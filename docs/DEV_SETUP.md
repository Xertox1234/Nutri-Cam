# Development Setup Guide

## Overview
This project uses **tunneling** to allow mobile devices to connect to your local development server. Both the Expo frontend and Express backend use public tunnel URLs.

## Port Configuration
- **Backend**: Port 3000 (avoid 5000 - used by Apple AirPlay)
- **Expo Metro**: Port 8081 (automatically tunneled)

## Starting Development Servers

### 1. Start Backend Server
```bash
npm run server:dev
```
This starts the Express server on port 3000.

### 2. Start Expo with Tunnel
```bash
npm run expo:dev
```
This starts Expo with automatic ngrok tunneling enabled (via `--tunnel` flag).

### 3. Start Backend Tunnel
```bash
npx localtunnel --port 3000
```
This creates a public HTTPS URL for your backend API.

**Important**: The tunnel URL changes each time! You'll see output like:
```
your url is: https://[random-words].loca.lt
```

### 4. Update Frontend Configuration
After starting localtunnel, copy the URL and update:

**File**: `client/lib/query-client.ts`

```typescript
export function getApiUrl(): string {
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    // UPDATE THIS URL EVERY TIME YOU RESTART LOCALTUNNEL
    return "https://[your-tunnel-url].loca.lt";
  }
  // ... rest of function
}
```

## CORS Configuration
The backend is configured to allow **all origins** in development mode:

**File**: `server/index.ts` - `setupCors()` function
```typescript
res.header("Access-Control-Allow-Origin", origin || "*");
```

This prevents 403 CORS errors when accessing from mobile devices.

## Complete Startup Sequence

```bash
# Terminal 1: Backend
npm run server:dev

# Terminal 2: Expo
npm run expo:dev

# Terminal 3: Backend tunnel
npx localtunnel --port 3000
# Copy the URL from output!

# Then update client/lib/query-client.ts with the new tunnel URL
```

## Testing
1. Scan the QR code shown by Expo on your mobile device
2. The app will connect to your backend via the tunnel URL
3. Check backend logs for incoming API requests

## Troubleshooting

### Network Request Failed
- Verify backend tunnel is running
- Check that `query-client.ts` has the correct tunnel URL
- Ensure CORS is allowing all origins

### Port Already in Use
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Then restart servers
```

### Tunnel Connection Issues
- Localtunnel can be unreliable
- Alternative: Use ngrok (requires auth): `ngrok http 3000`
- Alternative: Use cloudflared: `cloudflared tunnel --url http://localhost:3000`

## Why Tunneling?
- Mobile devices need to reach your Mac's local server
- Can't use localhost from phone
- Local network IPs (192.168.x.x) don't work reliably across networks
- Tunnels provide stable HTTPS URLs that work anywhere

## Notes
- Don't commit the tunnel URL to git - it changes every session
- Port 5000 conflicts with macOS AirPlay Receiver
- Expo's `--tunnel` flag uses @expo/ngrok automatically
- Backend needs separate tunnel (localtunnel/ngrok/cloudflared)
