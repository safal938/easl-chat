# Board App iframe Integration Issue - Why It Only Works on Localhost

## Problem
The EASL app iframe integration works perfectly on localhost but fails on the deployed app.

## Root Cause: Origin Mismatch

### How the Integration Works

The Board App integration uses **two separate communication mechanisms**:

#### 1. **iframe postMessage** (Canvas → EASL)
- Board App embeds EASL in an iframe
- Sends queries via `postMessage` API
- EASL receives queries and processes them

#### 2. **HTTP API calls** (EASL → Board App)
- EASL sends complete responses via HTTP POST
- Endpoint: `/api/easl-response`
- Board App stores responses in database

## The Issue: Hardcoded Localhost URL

### In `public/canvas-test.html`
```html
<iframe 
  id="easlIframe"
  src="http://localhost:3000"  <!-- ❌ HARDCODED LOCALHOST -->
  title="EASL App"
></iframe>
```

```javascript
iframe.contentWindow.postMessage(message, 'http://localhost:3000');  // ❌ HARDCODED
```

### In `lib/canvas-config.ts`
```typescript
export const CANVAS_CONFIG = {
  allowedOrigins: [
    'https://boardv26.vercel.app',  // ✅ Production Board App
    'http://localhost:3000',          // ✅ Local EASL
    'http://localhost:3001',          // ✅ Local Board App
    'http://localhost:5173',          // ✅ Vite
  ],
  
  easlAppUrl: 'https://easl-seven.vercel.app',  // ✅ Production EASL
};
```

### In `hooks/useCanvasMessageListener.ts`
```typescript
const handleMessage = useCallback((event: MessageEvent) => {
  // Security: Verify the origin
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('⚠️ Message from untrusted origin:', event.origin);
    return;  // ❌ BLOCKS MESSAGES FROM NON-ALLOWED ORIGINS
  }
  // ... process message
}, [onQueryReceived, allowedOrigins]);
```

## Why It Fails on Production

### Scenario 1: Board App (Production) → EASL (Production)

1. **Board App** (`https://boardv26.vercel.app`) loads iframe:
   ```html
   <iframe src="https://easl-seven.vercel.app"></iframe>
   ```

2. **Board App** sends postMessage:
   ```javascript
   iframe.contentWindow.postMessage(message, 'https://easl-seven.vercel.app');
   ```

3. **EASL** receives message with `event.origin = 'https://boardv26.vercel.app'`

4. **EASL** checks allowed origins:
   ```typescript
   allowedOrigins = [
     'https://boardv26.vercel.app',  // ✅ MATCHES!
     'http://localhost:3000',
     'http://localhost:3001',
     'http://localhost:5173',
   ]
   ```

5. **Result**: ✅ **Should work** (if Board App is configured correctly)

### Scenario 2: Test Page (Localhost) → EASL (Production)

1. **Test Page** (`http://localhost:5173`) loads iframe:
   ```html
   <iframe src="https://easl-seven.vercel.app"></iframe>
   ```

2. **Test Page** sends postMessage:
   ```javascript
   iframe.contentWindow.postMessage(message, 'https://easl-seven.vercel.app');
   ```

3. **EASL** receives message with `event.origin = 'http://localhost:5173'`

4. **EASL** checks allowed origins:
   ```typescript
   allowedOrigins = [
     'https://boardv26.vercel.app',
     'http://localhost:3000',
     'http://localhost:3001',
     'http://localhost:5173',  // ✅ MATCHES!
   ]
   ```

5. **Result**: ✅ **Should work**

### Scenario 3: Test Page (Localhost) → EASL (Localhost)

1. **Test Page** (`http://localhost:5173`) loads iframe:
   ```html
   <iframe src="http://localhost:3000"></iframe>  <!-- ❌ HARDCODED -->
   ```

2. **Test Page** sends postMessage:
   ```javascript
   iframe.contentWindow.postMessage(message, 'http://localhost:3000');
   ```

3. **EASL** receives message with `event.origin = 'http://localhost:5173'`

4. **EASL** checks allowed origins:
   ```typescript
   allowedOrigins = [
     'https://boardv26.vercel.app',
     'http://localhost:3000',
     'http://localhost:3001',
     'http://localhost:5173',  // ✅ MATCHES!
   ]
   ```

5. **Result**: ✅ **Works** (this is what you're seeing)

## The Real Problem

The issue is likely in the **Board App** itself, not the EASL app. The Board App needs to:

1. **Load the correct EASL URL** based on environment:
   ```javascript
   const easlUrl = process.env.NODE_ENV === 'production' 
     ? 'https://easl-seven.vercel.app'
     : 'http://localhost:3000';
   
   <iframe src={easlUrl}></iframe>
   ```

2. **Send postMessage to the correct origin**:
   ```javascript
   iframe.contentWindow.postMessage(message, easlUrl);
   ```

3. **Be in the EASL allowed origins list**:
   - ✅ `https://boardv26.vercel.app` is already in the list
   - ❌ But check if the actual Board App URL matches

## Current Configuration

### EASL App (This App)
- **Production URL**: `https://easl-seven.vercel.app`
- **Allowed Origins**: 
  - ✅ `https://boardv26.vercel.app`
  - ✅ `http://localhost:3000`
  - ✅ `http://localhost:3001`
  - ✅ `http://localhost:5173`

### Board App
- **Production URL**: `https://board-v24problem.vercel.app` (from `.env`)
- **Expected URL**: `https://boardv26.vercel.app` (in allowed origins)
- **❌ MISMATCH!**

## The Fix

### Option 1: Update EASL Allowed Origins (Recommended)

Update `lib/canvas-config.ts`:
```typescript
export const CANVAS_CONFIG = {
  allowedOrigins: [
    'https://boardv26.vercel.app',
    'https://board-v24problem.vercel.app',  // ✅ ADD THIS
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  easlAppUrl: 'https://easl-seven.vercel.app',
};
```

### Option 2: Update Board App URL

Change the Board App to use `https://boardv26.vercel.app` instead of `https://board-v24problem.vercel.app`.

### Option 3: Use Environment Variables

Make the configuration dynamic:

**lib/canvas-config.ts**:
```typescript
export const CANVAS_CONFIG = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_BOARD_APP_URL || 'https://boardv26.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ].filter(Boolean),
  easlAppUrl: process.env.NEXT_PUBLIC_EASL_APP_URL || 'https://easl-seven.vercel.app',
};
```

**.env**:
```bash
NEXT_PUBLIC_BOARD_APP_URL="https://board-v24problem.vercel.app"
NEXT_PUBLIC_EASL_APP_URL="https://easl-seven.vercel.app"
```

## Debugging Steps

### 1. Check Browser Console (on Production)

When Board App loads EASL iframe, check for:
```
⚠️ Message from untrusted origin: https://board-v24problem.vercel.app
```

If you see this, the origin is not in the allowed list.

### 2. Check Network Tab

Look for:
- iframe loading `https://easl-seven.vercel.app` ✅
- OR iframe loading `http://localhost:3000` ❌

### 3. Check postMessage Calls

In Board App console:
```javascript
// Should see
iframe.contentWindow.postMessage(message, 'https://easl-seven.vercel.app');

// NOT
iframe.contentWindow.postMessage(message, 'http://localhost:3000');
```

### 4. Verify Board App Configuration

Check Board App code for:
- Hardcoded `localhost` URLs
- Environment-specific iframe src
- Correct postMessage target origin

## Summary

| Component | Localhost | Production | Issue |
|-----------|-----------|------------|-------|
| EASL App | `http://localhost:3000` | `https://easl-seven.vercel.app` | ✅ Correct |
| Board App | `http://localhost:3001` | `https://board-v24problem.vercel.app` | ❌ Not in allowed origins |
| Test Page | `http://localhost:5173` | N/A | ✅ In allowed origins |
| Allowed Origins | Includes localhost | Includes `board-v25` | ❌ Missing `board-v24problem` |

## Recommended Action

**Add the current Board App URL to allowed origins**:

```typescript
// lib/canvas-config.ts
export const CANVAS_CONFIG = {
  allowedOrigins: [
    'https://boardv26.vercel.app',
    'https://board-v24problem.vercel.app',  // ✅ ADD THIS LINE
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ],
  easlAppUrl: 'https://easl-seven.vercel.app',
};
```

Then redeploy the EASL app.
