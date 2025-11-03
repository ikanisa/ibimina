# LOCAL HOSTING GUIDE

Complete guide for hosting the Staff Admin PWA locally with multiple options.

---

## Prerequisites

- Built app (`pnpm build` completed)
- `dist/` directory exists

**Verify:**
```bash
ls -la dist/
# Should contain: index.html, assets/, sw.js, etc.
```

---

## Option 1: Vite Preview (Quickest)

**Best for:** Quick testing after build, development.

### Setup

No additional setup required.

### Start

```bash
pnpm preview
```

### Access

```
http://localhost:4173
```

### Features

- ✓ Fast startup
- ✓ SPA routing support
- ✓ Hot reload (not required for built app)
- ✗ No custom headers
- ✗ Limited to localhost

### Stop

Press `Ctrl+C`

---

## Option 2: Node Static Server

**Best for:** Testing static file serving behavior, CDN simulation.

### Setup

```bash
# Install serve globally (one-time)
npm install -g serve

# Or use npx (no installation)
```

### Start

```bash
# With global serve
serve dist -s -p 8080

# Or with npx
npx serve dist -s -p 8080
```

**Flags:**
- `-s` or `--single`: SPA mode (fallback to index.html)
- `-p <port>`: Port number

### Access

```
http://localhost:8080
```

### Features

- ✓ SPA routing support
- ✓ Mimics CDN behavior
- ✓ Configurable port
- ✗ No custom headers
- ✗ Limited to localhost

### Stop

Press `Ctrl+C`

### Custom Configuration

Create `serve.json`:

```json
{
  "public": "dist",
  "rewrites": [
    { "source": "**", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "**/*.@(js|css)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

Then run:
```bash
serve
```

---

## Option 3: Docker + Nginx (HTTP)

**Best for:** Production-like environment, testing Nginx config, team sharing.

### Setup

1. Ensure Docker is installed and running:
   ```bash
   docker --version
   # Expected: Docker version 20.x or higher
   
   docker ps
   # Should not error
   ```

2. Build the app:
   ```bash
   pnpm build
   ```

### Start

```bash
# Using docker compose
docker compose up --build

# Or detached mode
docker compose up --build -d

# Using Makefile
make docker-up
```

**What happens:**
1. Builds Docker image with Nginx
2. Copies `dist/` to image
3. Configures Nginx with `deploy/nginx/nginx.conf`
4. Starts container
5. Maps port 8080 to container port 80

### Access

```
http://localhost:8080
```

### Features

- ✓ Production Nginx configuration
- ✓ Custom security headers
- ✓ Proper caching rules
- ✓ Gzip compression
- ✓ SPA routing
- ✓ Health check endpoint (`/health`)
- ✗ No HTTPS (use Option 4 for HTTPS)

### Check Status

```bash
# View running containers
docker ps

# View logs
docker compose logs -f

# Check health
curl http://localhost:8080/health
# Expected: "healthy"
```

### Stop

```bash
# Using docker compose
docker compose down

# Using Makefile
make docker-down
```

### Rebuild

```bash
# After code changes
pnpm build
docker compose up --build

# Or
make docker-up
```

---

## Option 4: Docker + Nginx (HTTPS)

**Best for:** Testing PWA features (service worker, push notifications), LAN access, production simulation.

### Why HTTPS?

- Service workers require secure context (HTTPS or localhost)
- Push notifications require HTTPS
- LAN testing (e.g., 192.168.x.x) requires HTTPS
- Simulates production environment

### Setup (One-Time)

#### Step 1: Install mkcert

```bash
# macOS
brew install mkcert

# Linux (Debian/Ubuntu)
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert

# Windows
choco install mkcert

# Verify
mkcert -version
```

#### Step 2: Generate Certificates

```bash
# Run mkcert setup script
bash scripts/mkcert.sh
```

**What this does:**
1. Installs mkcert CA (trusted by your system)
2. Generates certificates for:
   - `admin.local`
   - `localhost`
   - `127.0.0.1`
   - `::1`
3. Saves to `deploy/nginx/certs/cert.pem` and `key.pem`

#### Step 3: Update /etc/hosts

```bash
# macOS/Linux
sudo nano /etc/hosts

# Add this line:
127.0.0.1  admin.local

# Save and exit

# Windows
# Edit C:\Windows\System32\drivers\etc\hosts as Administrator
```

#### Step 4: Build App

```bash
pnpm build
```

### Start

```bash
# Using docker compose
docker compose -f docker-compose.ssl.yml up --build -d

# Using Makefile
make docker-ssl-up
```

### Access

```
https://admin.local:8443
```

**Or:**
```
https://localhost:8443
```

### Features

- ✓ HTTPS with trusted certificate
- ✓ All Nginx features from Option 3
- ✓ HSTS header
- ✓ Service worker support
- ✓ Push notification support
- ✓ LAN access (if firewall allows)
- ✓ Production-like security

### Verify HTTPS

```bash
# Check certificate
curl -I https://admin.local:8443
# Should return 200 OK

# Check service worker
# Open DevTools → Application → Service Workers
# Should see "Active" service worker
```

### Access from LAN

1. Find your local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   # or
   ip addr show
   
   # Example: 192.168.1.100
   ```

2. Add to certificate (regenerate):
   ```bash
   cd deploy/nginx/certs
   mkcert -key-file key.pem -cert-file cert.pem admin.local localhost 127.0.0.1 ::1 192.168.1.100
   ```

3. Access from another device:
   ```
   https://192.168.1.100:8443
   ```

   Note: You may need to:
   - Accept certificate warning on device
   - Configure firewall to allow port 8443

### Stop

```bash
# Using docker compose
docker compose -f docker-compose.ssl.yml down

# Using Makefile
make docker-ssl-down
```

---

## Comparison Table

| Feature | Vite Preview | Node Serve | Docker HTTP | Docker HTTPS |
|---------|--------------|------------|-------------|--------------|
| Setup Difficulty | Easy | Easy | Medium | Hard |
| Startup Time | Fast | Fast | Medium | Medium |
| HTTPS | ✗ | ✗ | ✗ | ✓ |
| Service Worker | localhost only | localhost only | localhost only | ✓ Full support |
| Custom Headers | ✗ | Limited | ✓ | ✓ |
| Gzip | ✗ | ✗ | ✓ | ✓ |
| LAN Access | ✗ | ✗ | ✓ (HTTP) | ✓ (HTTPS) |
| Production-Like | ✗ | ✗ | ✓ | ✓✓ |

---

## Port Mapping Reference

| Service | Port | Protocol |
|---------|------|----------|
| Vite Preview | 4173 | HTTP |
| Node Serve | 8080 (custom) | HTTP |
| Docker HTTP | 8080 | HTTP |
| Docker HTTPS | 8443 | HTTPS |

---

## Nginx Configuration

### HTTP Config

**File:** `deploy/nginx/nginx.conf`

**Key Features:**
- SPA fallback (all routes → `/index.html`)
- Cache control:
  - Static assets: 1 year, immutable
  - `index.html`: no-cache
  - Service worker: no-cache
- Security headers:
  - X-Frame-Options
  - X-Content-Type-Options
  - CSP
- Gzip compression
- Health check endpoint: `/health`

### HTTPS Config

**File:** `deploy/nginx/nginx-ssl.conf`

**Additional Features:**
- TLS 1.2/1.3
- HSTS header
- SSL certificate paths

### Custom Configuration

Edit `deploy/nginx/nginx.conf` or `nginx-ssl.conf`:

```nginx
# Example: Add custom header
add_header X-Custom-Header "value" always;

# Example: Change cache duration
location ~* \.(js|css)$ {
    expires 7d;  # Changed from 1y
}
```

Rebuild container:
```bash
docker compose down
docker compose up --build
```

---

## Testing PWA Features

### Service Worker

1. Host with HTTPS (Option 4)
2. Open DevTools → Application → Service Workers
3. Verify status: "Activated and is running"
4. Check cached resources: Cache Storage

### Offline Mode

1. Open app
2. DevTools → Network → Offline checkbox
3. Navigate between pages
4. Should work from cache
5. Offline indicator should appear

### Install Prompt

1. Host with HTTPS
2. Open in Chrome
3. Address bar → Install icon
4. Or Settings page → "Install as App"
5. Confirm app installs to system

### Push Notifications

1. Host with HTTPS
2. Settings page → Enable Notifications
3. Grant permission
4. Backend sends push notification
5. Should receive notification

---

## Health Checks

All Docker options include a health check endpoint:

```bash
# Check if app is running
curl http://localhost:8080/health
# or
curl https://admin.local:8443/health

# Expected response:
# healthy
```

---

## Logs and Debugging

### Vite Preview

Logs appear in terminal. No special debugging needed.

### Docker

```bash
# View logs
docker compose logs

# Follow logs
docker compose logs -f

# Logs for specific service
docker compose logs web

# Or for HTTPS
docker compose -f docker-compose.ssl.yml logs web-ssl
```

### Nginx Access Logs

```bash
# Enter container
docker compose exec web sh

# View access logs
tail -f /var/log/nginx/access.log

# View error logs
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8080
# or
netstat -an | grep 8080

# Kill process
kill -9 <PID>

# Or use different port
serve dist -s -p 8081
```

### Docker Build Fails

```bash
# Check dist/ exists
ls -la dist/

# Rebuild without cache
docker compose build --no-cache
docker compose up
```

### HTTPS Certificate Not Trusted

```bash
# Reinstall mkcert CA
mkcert -install

# Regenerate certificates
bash scripts/mkcert.sh

# Restart browser
```

### Service Worker Not Registering

1. Ensure HTTPS (or localhost)
2. Check console for errors
3. Verify `sw.js` exists in `dist/`
4. Check `VITE_PWA_DISABLED` is `false`
5. Hard refresh: Cmd/Ctrl + Shift + R

---

## Quick Command Reference

```bash
# Option 1: Vite Preview
pnpm preview

# Option 2: Node Serve
npx serve dist -s -p 8080

# Option 3: Docker HTTP
make docker-up
# or
docker compose up --build -d

# Option 4: Docker HTTPS
bash scripts/mkcert.sh  # First time only
make docker-ssl-up
# or
docker compose -f docker-compose.ssl.yml up --build -d
```

---

## Next Steps

- **Testing**: See [RUNBOOK.md](RUNBOOK.md#testing)
- **Deployment**: See [RUNBOOK.md](RUNBOOK.md#production-deployment)
- **Troubleshooting**: See [RUNBOOK.md](RUNBOOK.md#common-issues)

---

**Need Help?** Open an issue or check [RUNBOOK.md](RUNBOOK.md).
