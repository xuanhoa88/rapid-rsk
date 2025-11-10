# Deployment Guide

## Overview

React Starter Kit uses `webpack-node-externals` for server bundling:

- ✅ Small server bundle
- ✅ Requires `node_modules/` at runtime
- ✅ Must run `npm install --production` after build

**Node.js Requirements:**

- Node.js >= 16.0.0
- npm >= 7.0.0

## Quick Start

### 1. Build

```bash
npm run build
```

**Output:**

```
build/
  ├── server.js              # Server bundle
  ├── loadable-stats.json    # @loadable/component chunk mapping
  ├── package.json           # Dependencies (generated)
  ├── LICENSE.txt            # License file
  └── public/
      ├── assets/            # Client bundles (JS, CSS, images)
      ├── favicon.ico        # Favicon
      ├── robots.txt         # SEO
      └── *.xml, *.webmanifest  # PWA and browser configs
```

### 2. Install Production Dependencies

```bash
cd build
npm install --production
```

**Required!** Server bundle needs `node_modules/` at runtime.

**Note:** Install dependencies inside the `build/` directory, not the project root.

### 3. Set Environment Variables & Run

```bash
cd build
export NODE_ENV=production
export RSK_JWT_SECRET=$(openssl rand -base64 32)
node server.js
```

## Docker Deployment (Recommended)

### Dockerfile

Already configured in project root. Uses multi-stage build:

**Build Stage:**

- Installs all dependencies (including devDependencies)
- Runs `npm run build` to create production bundle
- Outputs to `/build/build` directory

**Production Stage:**

- Copies built files to `/app/build`
- Changes working directory to `/app/build`
- Installs production dependencies in build directory
- Runs server with `node server.js` from build directory

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /build/build ./build
WORKDIR /app/build
RUN npm install --production
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```

### Build & Run

```bash
# Build image
docker build -t my-app .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e RSK_JWT_SECRET=your-secret \
  my-app
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - RSK_PORT=3000
      - RSK_JWT_SECRET=${JWT_SECRET}
```

```bash
docker-compose up -d
```

### Podman (Docker Alternative)

Podman is a daemonless container engine that's compatible with Docker. All Docker commands work with Podman:

```bash
# Build image
podman build -t my-app .

# Run container
podman run -p 3000:3000 \
  -e NODE_ENV=production \
  -e RSK_JWT_SECRET=your-secret \
  my-app

# Run with podman-compose
podman-compose up -d

# Generate systemd service (rootless)
podman generate systemd --new --name my-app > ~/.config/systemd/user/my-app.service
systemctl --user enable --now my-app
```

**Benefits of Podman:**

- ✅ Daemonless architecture (more secure)
- ✅ Rootless containers by default
- ✅ Drop-in replacement for Docker
- ✅ Native systemd integration
- ✅ No daemon process required

## Traditional Server

### Deploy Files

```bash
# Build locally
npm run build
npm install --production

# Deploy to server
rsync -av build/ node_modules/ package*.json server:/app/

# On server
cd /app
NODE_ENV=production node build/server.js
```

### With PM2

```bash
# Install PM2
npm install -g pm2

# Start
pm2 start build/server.js --name my-app -i max

# Save
pm2 save
pm2 startup
```

## Environment Variables

### Required Variables

**These must be set in production:**

| Variable         | Required | Purpose           | Example                        |
| ---------------- | -------- | ----------------- | ------------------------------ |
| `NODE_ENV`       | Yes      | Environment mode  | `production`                   |
| `RSK_JWT_SECRET` | **Yes**  | JWT token signing | `your-secret-key-min-32-chars` |

**⚠️ Important:** `RSK_JWT_SECRET` must be:

- At least 32 characters long
- Randomly generated
- Kept secret (never commit to git)
- Same across all server instances

### Optional Variables

| Variable              | Default               | Purpose                   |
| --------------------- | --------------------- | ------------------------- |
| `RSK_PORT`            | `3000`                | Server port               |
| `RSK_API_BASE_URL`    | `''`                  | Client API base URL       |
| `RSK_API_PROXY_URL`   | -                     | External API proxy target |
| `RSK_APP_NAME`        | `'React Starter Kit'` | Application name          |
| `RSK_APP_DESCRIPTION` | `'Boilerplate...'`    | Application description   |

### Development

Use `.env` file (automatically loaded):

```bash
cp .env.defaults .env
# Edit .env and set RSK_JWT_SECRET
npm start
```

### Production

Set directly on server (don't deploy `.env` file):

```bash
cd build
export NODE_ENV=production
export RSK_JWT_SECRET=your-secret-key-here
export RSK_PORT=3000
node server.js
```

See [environment-variables.md](environment-variables.md) for complete guide.

## Verification

### Check Build

```bash
# Verify server bundle exists
ls -lh build/server.js

# Verify client assets exist
ls build/public/assets/

# Verify loadable-stats.json exists (required for code splitting)
ls build/loadable-stats.json

# Verify node_modules present in build directory (required!)
ls build/node_modules/ | wc -l
```

### Test Locally

```bash
# Change to build directory
cd build

# Set environment variables and start server
export NODE_ENV=production
export RSK_JWT_SECRET=$(openssl rand -base64 32)
node server.js &

# Test
curl http://localhost:3000/

# Stop server
kill %1
```

## Troubleshooting

### "express-jwt: `secret` is a required option"

**Cause:** `RSK_JWT_SECRET` environment variable not set

**Fix:**

```bash
# Generate a secure secret (32+ characters)
export RSK_JWT_SECRET=$(openssl rand -base64 32)

# Or set manually
export RSK_JWT_SECRET=your-secret-key-here

# Then run server
node build/server.js
```

**⚠️ Important:** Never commit your JWT secret to version control!

### "Cannot find module 'react'"

**Cause:** Production dependencies not installed

**Fix:**

```bash
npm install --production
```

### "Cannot find module './loadable-stats.json'"

**Cause:** loadable-stats.json missing (generated by @loadable/webpack-plugin)

**Fix:**

```bash
# Ensure client build completed successfully
ls build/loadable-stats.json

# If missing, rebuild client
npm run build:client
```

### Server starts but pages don't load

**Cause:** Static files missing

**Fix:**

```bash
# Ensure public/ is deployed
ls build/public/assets/
```

## CI/CD Example

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Install production deps
        run: npm install --production

      - name: Deploy
        run: |
          rsync -av build/ node_modules/ ${{ secrets.SERVER }}:/app/
          ssh ${{ secrets.SERVER }} "pm2 restart my-app"
```

## Summary

### Required Steps

1. ✅ `npm run build`
2. ✅ `npm install --production` (REQUIRED!)
3. ✅ Deploy `build/` + `node_modules/`
4. ✅ Set environment variables
5. ✅ Run `node build/server.js`

### What to Deploy

```
✅ build/              # Built files
✅ node_modules/       # Production dependencies
✅ package.json        # For npm install
✅ package-lock.json   # For reproducible installs
```

### What NOT to Deploy

```
❌ src/               # Source code
❌ tools/             # Build tools
❌ .env               # Use server env vars
❌ .git/              # Git history
```

---

**Key Point:** Server bundle requires `node_modules/` at runtime. Always run `npm install --production` after building!
