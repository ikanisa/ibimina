# Android Performance Optimization Guide

This guide covers performance optimization strategies for the Ibimina Capacitor-based Android apps.

## Overview

Performance optimization is critical for mobile apps to provide a smooth user experience, conserve battery, and reduce data usage.

## Key Performance Metrics

### Target Metrics

- **App Launch Time**: < 2 seconds (cold start)
- **Time to Interactive**: < 3 seconds
- **Frame Rate**: 60 FPS consistently
- **Memory Usage**: < 200 MB for typical usage
- **APK Size**: < 30 MB (without assets)
- **Battery Drain**: < 5% per hour of active use

## Web Performance Optimization

### 1. Code Splitting

Split your Next.js app into smaller chunks:

```typescript
// Use dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

### 2. Image Optimization

Use Next.js Image component with proper sizing:

```typescript
import Image from 'next/image';

<Image
  src="/assets/logo.png"
  width={200}
  height={100}
  loading="lazy"
  placeholder="blur"
  alt="Logo"
/>
```

### 3. Bundle Size Optimization

Analyze and optimize bundle size:

```bash
# Analyze bundle
ANALYZE=true pnpm run build

# Remove unused dependencies
pnpm prune

# Use selective imports
import { Button } from '@mui/material/Button'; // Good
import { Button } from '@mui/material'; // Avoid - imports entire library
```

### 4. Service Worker Caching

Implement intelligent caching strategies:

```javascript
// service-worker.js
const CACHE_NAME = 'ibimina-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/assets/logo.png'
];

// Cache static assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
```

## Native Android Optimization

### 1. ProGuard Configuration

Enable aggressive ProGuard rules for release builds:

```gradle
// apps/admin/android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles(
                getDefaultProguardFile('proguard-android-optimize.txt'),
                'proguard-rules.pro'
            )
        }
    }
}
```

**proguard-rules.pro**:
```proguard
# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# Keep plugin classes
-keep class rw.ibimina.staff.plugins.** { *; }

# Optimize aggressively
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }

# Keep coroutines
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}
```

### 2. WebView Optimization

Configure WebView for better performance:

```kotlin
// MainActivity.kt
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Enable hardware acceleration
    window.setFlags(
        WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
        WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
    )
    
    // Configure WebView settings
    getBridge()?.webView?.apply {
        settings.apply {
            // Enable caching
            cacheMode = WebSettings.LOAD_DEFAULT
            setAppCacheEnabled(true)
            setAppCachePath(cacheDir.path)
            
            // Enable DOM storage
            domStorageEnabled = true
            databaseEnabled = true
            
            // Optimize rendering
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            
            // Enable mixed content for dev (only if needed)
            if (BuildConfig.DEBUG) {
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            }
        }
    }
}
```

### 3. Memory Management

Implement proper memory management:

```kotlin
class CacheManager(private val context: Context) {
    
    private val maxMemory = Runtime.getRuntime().maxMemory() / 1024
    private val cacheSize = (maxMemory / 8).toInt() // Use 1/8 of available memory
    
    private val memoryCache = object : LruCache<String, Bitmap>(cacheSize) {
        override fun sizeOf(key: String, bitmap: Bitmap): Int {
            return bitmap.byteCount / 1024
        }
    }
    
    fun getBitmap(key: String): Bitmap? {
        return memoryCache.get(key)
    }
    
    fun putBitmap(key: String, bitmap: Bitmap) {
        if (getBitmap(key) == null) {
            memoryCache.put(key, bitmap)
        }
    }
    
    fun clear() {
        memoryCache.evictAll()
    }
}
```

### 4. Background Work Optimization

Use WorkManager efficiently:

```kotlin
// Only schedule necessary work
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .setRequiresBatteryNotLow(true)
    .setRequiresStorageNotLow(true)
    .build()

val syncWork = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 15, // Minimum is 15 minutes
    repeatIntervalTimeUnit = TimeUnit.MINUTES
)
    .setConstraints(constraints)
    .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,
        WorkRequest.MIN_BACKOFF_MILLIS,
        TimeUnit.MILLISECONDS
    )
    .build()

WorkManager.getInstance(context)
    .enqueueUniquePeriodicWork(
        "sync",
        ExistingPeriodicWorkPolicy.KEEP,
        syncWork
    )
```

## Network Optimization

### 1. Request Batching

Batch multiple requests together:

```typescript
// Instead of multiple individual requests
const batchRequest = async (operations: Operation[]) => {
  return fetch('/api/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operations })
  });
};
```

### 2. Response Compression

Enable gzip compression:

```typescript
// Next.js automatically compresses responses
// For Capacitor server config:
const config: CapacitorConfig = {
  server: {
    androidScheme: 'https',
    // Responses will be compressed by the web server
  }
};
```

### 3. Request Deduplication

Prevent duplicate simultaneous requests:

```typescript
const requestCache = new Map<string, Promise<any>>();

async function fetchWithDeduplication(url: string) {
  if (requestCache.has(url)) {
    return requestCache.get(url);
  }
  
  const promise = fetch(url).then(r => r.json());
  requestCache.set(url, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    // Clear after a short delay
    setTimeout(() => requestCache.delete(url), 1000);
  }
}
```

## Database Optimization

### 1. Efficient Queries

Use IndexedDB with proper indexes:

```typescript
// Create indexes for frequently queried fields
const openRequest = indexedDB.open('ibimina', 1);

openRequest.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  const userStore = db.createObjectStore('users', { keyPath: 'id' });
  userStore.createIndex('email', 'email', { unique: true });
  userStore.createIndex('status', 'status', { unique: false });
  
  const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
  transactionStore.createIndex('userId', 'userId', { unique: false });
  transactionStore.createIndex('date', 'date', { unique: false });
  transactionStore.createIndex('userId_date', ['userId', 'date'], { unique: false });
};
```

### 2. Data Pagination

Implement cursor-based pagination:

```typescript
async function fetchPaginatedData(cursor?: string, limit = 20) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    ...(cursor && { cursor })
  });
  
  return fetch(`/api/data?${params}`);
}
```

## UI Optimization

### 1. Virtual Scrolling

Use virtual scrolling for large lists:

```typescript
import { VirtualScroller } from '@tanstack/react-virtual';

function LargeList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <ListItem item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Debounce Input

Debounce expensive operations:

```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const [query, setQuery] = useState('');
  
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      performSearch(value);
    },
    500
  );
  
  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

### 3. Memoization

Memoize expensive computations:

```typescript
import { useMemo } from 'react';

function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransformation(item));
  }, [data]);
  
  return <List items={processedData} />;
}
```

## Monitoring and Profiling

### 1. Performance Monitoring

Add performance tracking:

```typescript
// lib/performance.ts
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  
  if (duration > 16.67) { // More than one frame at 60fps
    console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
  }
}

// Usage
measurePerformance('data-processing', () => {
  processLargeDataset(data);
});
```

### 2. Memory Profiling

Monitor memory usage in Android:

```kotlin
class MemoryMonitor(private val context: Context) {
    
    fun logMemoryUsage() {
        val runtime = Runtime.getRuntime()
        val usedMemory = runtime.totalMemory() - runtime.freeMemory()
        val maxMemory = runtime.maxMemory()
        val percentUsed = (usedMemory.toFloat() / maxMemory * 100).toInt()
        
        Log.d("MemoryMonitor", "Memory usage: ${usedMemory / 1024 / 1024}MB / ${maxMemory / 1024 / 1024}MB ($percentUsed%)")
        
        if (percentUsed > 80) {
            Log.w("MemoryMonitor", "High memory usage detected")
            // Trigger cleanup
            System.gc()
        }
    }
}
```

### 3. Frame Rate Monitoring

Track frame rate drops:

```typescript
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 60;

function measureFPS() {
  const now = performance.now();
  frameCount++;
  
  if (now >= lastFrameTime + 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
    frameCount = 0;
    lastFrameTime = now;
    
    if (fps < 45) {
      console.warn(`Low FPS detected: ${fps}`);
    }
  }
  
  requestAnimationFrame(measureFPS);
}

if (process.env.NODE_ENV === 'development') {
  measureFPS();
}
```

## Build Optimization

### 1. Multi-ABI APKs

Generate separate APKs for different architectures:

```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk false
        }
    }
}
```

### 2. Resource Shrinking

Remove unused resources automatically:

```gradle
android {
    buildTypes {
        release {
            shrinkResources true
            minifyEnabled true
        }
    }
}
```

### 3. Asset Optimization

Compress assets during build:

```bash
# Optimize images
pngquant --quality=80-90 --ext .png --force assets/**/*.png
jpegoptim --max=85 assets/**/*.jpg

# Use WebP format
cwebp -q 85 input.png -o output.webp
```

## Best Practices Summary

1. **Lazy load** non-critical resources
2. **Cache** API responses and assets aggressively
3. **Minimize** JavaScript bundle size
4. **Optimize** images and use appropriate formats
5. **Implement** virtual scrolling for long lists
6. **Debounce** expensive operations
7. **Use** WorkManager for background tasks
8. **Enable** ProGuard and resource shrinking
9. **Monitor** performance metrics continuously
10. **Test** on real devices, especially low-end ones

## Tools

- **Android Studio Profiler**: CPU, memory, network profiling
- **Chrome DevTools**: Web performance analysis
- **Lighthouse**: PWA and performance audits
- **React DevTools Profiler**: Component render analysis
- **Android Debug Bridge (ADB)**: System logs and monitoring

## References

- [Android Performance Patterns](https://www.youtube.com/playlist?list=PLWz5rJ2EKKc9CBxr3BVjPTPoDPLdPIFCE)
- [Web Performance Optimization](https://web.dev/performance/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Capacitor Performance](https://capacitorjs.com/docs/guides/performance)
