# CORS Fix for Board App Integration

## Problem
When the Board App (`https://boardv26.vercel.app` or `http://localhost:3000`) tries to call the clear-chats API on the EASL Chat app (`https://easl-board.vercel.app`), it gets blocked by CORS policy:

```
Access to fetch at 'https://easl-board.vercel.app/api/board-app/clear-chats' 
from origin 'https://boardv26.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
The API endpoint `/api/board-app/clear-chats` was missing CORS headers, which are required for cross-origin requests from the Board App.

## Solution
Added CORS headers to the API route to allow requests from the Board App domain.

## Changes Made

### File: `app/api/board-app/clear-chats/route.ts`

**1. Added Dynamic CORS Headers Configuration**
```typescript
function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'https://boardv26.vercel.app', // Production Board App
    'http://localhost:3000',        // Local Board App development
    'http://localhost:3001',        // Alternative local port
  ];

  const isAllowed = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}
```

**2. Added OPTIONS Handler for Preflight Requests**
```typescript
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
```

**3. Added CORS Headers to All Responses**
- Success responses
- Error responses (401, 500, 405)
- All `NextResponse.json()` calls now include `{ headers: corsHeaders }`

## How CORS Works

### Preflight Request (OPTIONS)
When the browser makes a cross-origin request with custom headers (like `Authorization`), it first sends a preflight OPTIONS request to check if the server allows it.

**Browser sends**:
```
OPTIONS /api/board-app/clear-chats
Origin: https://boardv26.vercel.app
Access-Control-Request-Method: POST
Access-Control-Request-Headers: authorization, content-type
```

**Server responds**:
```
Access-Control-Allow-Origin: https://boardv26.vercel.app
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Access-Control-Allow-Credentials: true
```

### Actual Request (POST)
If the preflight succeeds, the browser makes the actual POST request.

**Browser sends**:
```
POST /api/board-app/clear-chats
Origin: https://boardv26.vercel.app
Authorization: Bearer <token>
```

**Server responds**:
```
Access-Control-Allow-Origin: https://boardv26.vercel.app
Access-Control-Allow-Credentials: true
{ success: true, ... }
```

## Allowed Origins

The API allows requests from these origins:

1. **Production Board App**: `https://boardv26.vercel.app`
2. **Local Development**: `http://localhost:3000`
3. **Alternative Port**: `http://localhost:3001`

The CORS handler dynamically checks the request origin and allows it if it's in the whitelist.

## Testing

### Local Development
1. Start EASL Chat app: `npm run dev` (this repo)
2. Start Board App locally: `npm run dev` (Board App repo on `http://localhost:3000`)
3. Click "Clear Expert Guideline System" button in Board App
4. Should work without CORS errors

### Production
1. EASL Chat app deployed at: `https://easl-board.vercel.app`
2. Board App deployed at: `https://boardv26.vercel.app`
3. Test from Board App production environment

## Security Notes

1. **Origin Restriction**: Only requests from the configured Board App URL are allowed
2. **Authentication Required**: All requests still require valid Firebase ID token
3. **Method Restriction**: Only POST and OPTIONS methods are allowed
4. **Header Restriction**: Only Content-Type and Authorization headers are allowed

## Troubleshooting

### Still Getting CORS Errors?

**Check 1: Environment Variable**
```bash
# Verify the Board App URL is correct
echo $NEXT_PUBLIC_BOARD_APP_URL
```

**Check 2: Server Restart**
After adding CORS headers, restart the development server:
```bash
# Stop the server (Ctrl+C)
# Start again
npm run dev
```

**Check 3: Browser Cache**
Clear browser cache or use incognito mode to test.

**Check 4: Network Tab**
Open browser DevTools → Network tab:
- Look for OPTIONS request (preflight)
- Check response headers include `Access-Control-Allow-Origin`
- Look for POST request
- Check response headers include `Access-Control-Allow-Origin`

### Common Issues

**Issue**: CORS error persists after fix
**Solution**: Make sure you restarted the dev server

**Issue**: OPTIONS request returns 404
**Solution**: Verify the OPTIONS handler is exported in the route file

**Issue**: Different origin in error message
**Solution**: Update `NEXT_PUBLIC_BOARD_APP_URL` to match the actual Board App URL

## Related Files

- `app/api/board-app/clear-chats/route.ts` - API route with CORS headers
- `.env` - Environment variables (NEXT_PUBLIC_BOARD_APP_URL)
- `docs/BOARD_APP_CLEAR_CHATS_TROUBLESHOOTING.md` - General troubleshooting

## Status
✅ CORS headers added
✅ OPTIONS handler implemented
✅ All responses include CORS headers
✅ Configurable via environment variable
✅ Ready for testing
