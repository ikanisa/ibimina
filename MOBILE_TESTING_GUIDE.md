# Mobile Device Testing Guide

This guide provides comprehensive instructions for testing the SACCO+ Client App
on real Android and iOS devices.

## Overview

The SACCO+ Client App is a Progressive Web App (PWA) designed for mobile-first
usage. This guide covers:

- Android device testing
- iOS device testing
- Common issues and troubleshooting
- Performance validation
- Offline functionality verification

---

## Prerequisites

Before testing on mobile devices:

1. **Development Server Running**

   ```bash
   cd apps/client
   pnpm dev
   ```

   The app will be available at `http://localhost:3001`

2. **Network Configuration**
   - Connect mobile device to same Wi-Fi network as development machine
   - Find your local IP address:
     ```bash
     # macOS/Linux
     ifconfig | grep "inet "
     # Windows
     ipconfig
     ```
   - Access app on mobile using: `http://YOUR_LOCAL_IP:3001`

3. **HTTPS for Production Testing**
   - PWA features require HTTPS in production
   - Use ngrok for testing with HTTPS:
     ```bash
     ngrok http 3001
     ```

---

## Android Device Testing

### 1. Installation & Setup

#### Install PWA from Chrome

1. Open Chrome browser on Android device
2. Navigate to app URL
3. Chrome should show "Add to Home screen" banner
4. Tap "Add" or go to Settings → Add to Home screen
5. Icon should appear on home screen

#### Install PWA from Samsung Internet

1. Open Samsung Internet browser
2. Navigate to app URL
3. Tap menu (three lines)
4. Select "Add page to" → Home screen
5. Confirm installation

### 2. Testing Checklist

#### ✅ Installation & Icons

- [ ] PWA installs successfully from Chrome
- [ ] PWA installs successfully from Samsung Internet
- [ ] App icon displays correctly on home screen
- [ ] Icon is not generic browser icon
- [ ] Splash screen displays when launching
- [ ] Splash screen matches app branding

#### ✅ Functionality

- [ ] Login page loads and functions correctly
- [ ] Biometric authentication works (if supported)
- [ ] Navigation between screens is smooth
- [ ] All forms are accessible and usable
- [ ] Virtual keyboard doesn't overlap inputs
- [ ] Touch targets are at least 48x48px
- [ ] Gestures work (swipe, pinch, etc.)

#### ✅ Camera & File Upload

- [ ] Camera access permission requested
- [ ] Take photo for ID upload works
- [ ] Choose from gallery works
- [ ] Uploaded images display correctly
- [ ] File size limits enforced

#### ✅ Offline Functionality

1. **Test Offline Mode**
   - Enable Airplane mode
   - App should still load cached pages
   - Show offline indicator
   - Queue actions for later sync

2. **Service Worker**
   - Check service worker registered: `chrome://serviceworker-internals`
   - Verify caching strategy working
   - Test background sync (if implemented)

#### ✅ Notifications

- [ ] Push notification permission requested
- [ ] Notifications display correctly
- [ ] Tapping notification opens correct screen
- [ ] Notification icons render properly

#### ✅ Performance

- [ ] App loads in under 3 seconds on 3G
- [ ] Smooth scrolling (60fps)
- [ ] No layout shifts during load
- [ ] Images load progressively
- [ ] Animations are smooth

#### ✅ Display & Layout

- [ ] Responsive design adapts to screen size
- [ ] Text is readable (min 16px body text)
- [ ] Contrast ratios meet WCAG standards
- [ ] No horizontal scrolling
- [ ] Safe areas respected (notches, rounded corners)

#### ✅ Standalone Mode

- [ ] App opens in full screen (no browser UI)
- [ ] Status bar color matches theme
- [ ] Navigation bar color matches theme
- [ ] System back button works correctly
- [ ] Deep links open in app

### 3. TWA (Trusted Web Activity) Testing

If building Android app bundle:

1. **Install Android Studio**
2. **Generate TWA Package**

   ```bash
   cd apps/client/android
   ./gradlew assembleDebug
   ```

3. **Install on Device**

   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

4. **Verify TWA**
   - App should open without browser UI
   - Share system auth with browser
   - Handle deep links properly

---

## iOS Device Testing

### 1. Installation & Setup

#### Install PWA from Safari

1. Open Safari browser on iOS device
2. Navigate to app URL
3. Tap Share button (square with arrow)
4. Scroll down and tap "Add to Home Screen"
5. Edit name if desired
6. Tap "Add"
7. Icon should appear on home screen

⚠️ **Note**: iOS only supports PWA installation from Safari, not Chrome or other
browsers.

### 2. Testing Checklist

#### ✅ Installation & Icons

- [ ] PWA installs from Safari Share menu
- [ ] App icon displays correctly
- [ ] Launch screen shows (if configured)
- [ ] App opens in full screen mode

#### ✅ Functionality

- [ ] Login page works correctly
- [ ] Face ID / Touch ID works (if implemented)
- [ ] Navigation between screens works
- [ ] All forms are functional
- [ ] Keyboard doesn't overlap inputs
- [ ] Touch targets are adequate
- [ ] Gestures work properly

#### ✅ Camera & File Upload

- [ ] Camera permission requested correctly
- [ ] Take photo works
- [ ] Choose from photo library works
- [ ] Upload completes successfully

#### ✅ Offline Functionality

- [ ] Service worker registers (with limitations)
- [ ] Basic offline functionality works
- [ ] Cached pages load offline

⚠️ **iOS Limitations**:

- Service workers have stricter limitations
- Background sync not fully supported
- Push notifications only work with native app
- Storage quotas more restrictive

#### ✅ Display & Layout

- [ ] Responsive design works on all iPhone sizes
- [ ] Safe areas respected (notch, Dynamic Island)
- [ ] Text is readable
- [ ] No layout issues
- [ ] Status bar integrates well

#### ✅ Standalone Mode

- [ ] Opens in full screen
- [ ] Status bar color correct
- [ ] Home indicator area handled
- [ ] Back navigation works

### 3. iOS-Specific Considerations

**Safari Specific**:

- Clear Safari cache regularly during testing
- Test on both Wi-Fi and cellular
- Test with different iOS versions if possible

**Device Compatibility**:

- iPhone SE (small screen)
- iPhone 14/15 (standard size)
- iPhone 14/15 Pro Max (large screen, Dynamic Island)
- iPad (tablet mode, if supported)

---

## Cross-Platform Testing

### Testing Matrix

| Feature            | Android Chrome | Samsung Internet | iOS Safari | Notes                |
| ------------------ | -------------- | ---------------- | ---------- | -------------------- |
| PWA Install        | ✓              | ✓                | ✓          | iOS Safari only      |
| Service Worker     | ✓              | ✓                | Limited    | iOS restrictions     |
| Push Notifications | ✓              | ✓                | ✗          | iOS needs native app |
| Background Sync    | ✓              | ✓                | ✗          | Not on iOS           |
| Camera Access      | ✓              | ✓                | ✓          | All supported        |
| Biometrics         | ✓              | ✓                | ✓          | All supported        |
| Offline Mode       | ✓              | ✓                | Limited    | iOS limitations      |

### Common Issues

#### App Won't Install

- **Android**: Ensure HTTPS in production
- **iOS**: Must use Safari, not other browsers
- Check manifest.json is valid
- Verify icon sizes are correct

#### Blank Screen After Install

- Clear browser cache
- Check console for JavaScript errors
- Verify service worker registered correctly

#### Camera Access Not Working

- Check browser permissions
- Verify HTTPS (required for camera)
- Test on actual device, not emulator

#### Offline Mode Not Working

- Service worker may not be registered
- Check network tab for failed requests
- Verify caching strategy in service worker

---

## Performance Testing

### Tools

1. **Chrome DevTools Device Mode**
   - Simulate mobile devices
   - Throttle network to 3G
   - Check performance metrics

2. **Lighthouse**
   ```bash
   # Run from client app directory
   pnpm run check:lighthouse
   ```

### Key Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Total Blocking Time (TBT)**: < 300ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Speed Index**: < 3.4s

### Load Testing Scenarios

1. **3G Network**
   - Throttle to 3G speed
   - App should load in under 5 seconds
   - Images should lazy load

2. **Slow Device**
   - Use older device (e.g., Android with < 2GB RAM)
   - Check for performance degradation
   - Monitor memory usage

3. **High Latency**
   - Add 1000ms latency in DevTools
   - App should handle gracefully
   - Show loading indicators

---

## Security Testing

### Checklist

- [ ] HTTPS enforced in production
- [ ] No sensitive data in localStorage
- [ ] Authentication tokens secured
- [ ] API calls authenticated
- [ ] CSP headers configured
- [ ] XSS protection enabled

---

## Recording Test Results

### Test Session Template

```markdown
## Test Session: [Date]

**Device**: [e.g., iPhone 14, Android Pixel 7] **OS Version**: [e.g., iOS 17.2,
Android 14] **Browser**: [e.g., Safari, Chrome 120] **Network**: [e.g., Wi-Fi,
4G]

### Installation

- [ ] Successfully installed
- Issues: [none / describe]

### Functionality

- [ ] All features working
- Issues: [none / describe]

### Performance

- Load time: [X seconds]
- Smooth scrolling: [yes / no]
- Issues: [none / describe]

### Offline Mode

- [ ] Service worker registered
- [ ] Offline pages load
- Issues: [none / describe]

### Screenshots

[Attach screenshots of key screens]

### Overall Assessment

[Summary of testing session]
```

---

## Automated Testing

While this guide focuses on manual testing, consider automating with:

- **Playwright Mobile**: Test PWA on mobile browsers
- **Appium**: Test TWA/native wrapper
- **BrowserStack/Sauce Labs**: Cloud device testing

---

## Next Steps After Testing

1. **Document Issues**
   - Create GitHub issues for bugs
   - Include device/OS/browser details
   - Attach screenshots/videos

2. **Performance Optimization**
   - Address any performance issues
   - Optimize images
   - Minimize JavaScript bundles

3. **Accessibility Improvements**
   - Fix touch target sizes
   - Improve contrast ratios
   - Add ARIA labels

4. **Production Deployment**
   - Deploy with HTTPS
   - Configure CDN for assets
   - Set up monitoring

---

## Support & Resources

- **PWA Documentation**: https://web.dev/progressive-web-apps/
- **iOS PWA Quirks**: https://www.netguru.com/blog/pwa-ios
- **Android TWA Guide**:
  https://developer.chrome.com/docs/android/trusted-web-activity/
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci

---

**Testing completed?** Update the main checklist in
`docs/go-live/production-checklist.md`
