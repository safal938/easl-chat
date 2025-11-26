# Clear Chats Guest Mode Support

## Problem
The clear chats functionality from Board App only worked for authenticated users with Firebase. Guest users couldn't clear their chat history.

## Solution
Updated both the API endpoint and the client-side handler to support guest mode.

### 1. API Endpoint (`app/api/board-app/clear-chats/route.ts`)

**Changes**:
- Now accepts `Bearer guest` token for guest users
- Uses `UnifiedChatService` instead of `ChatService`
- Supports both Firebase and localStorage deletion

**Usage**:
```typescript
// Authenticated user
Authorization: Bearer <firebase-id-token>

// Guest user
Authorization: Bearer guest
```

**Response**:
```json
{
  "success": true,
  "deletedChats": 2,
  "deletedMessages": 10,
  "mode": "guest" | "authenticated"
}
```

### 2. Client Handler (`components/Chat.tsx`)

**Changes**:
- Detects guest mode by checking localStorage
- For guest mode: Calls `UnifiedChatService.deleteBoardAppChats(null)` directly
- For authenticated mode: Calls API endpoint with Firebase token

**Flow**:
```typescript
onClearChats: async () => {
  // Check if guest mode
  const guestModeEnabled = localStorage.getItem('easl_guest_mode_enabled') === 'true';
  
  if (guestModeEnabled) {
    // Clear localStorage directly
    const result = await UnifiedChatService.deleteBoardAppChats(null);
  } else {
    // Call API with Firebase token
    const response = await fetch('/api/board-app/clear-chats', {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
  }
  
  // Clear UI and navigate to home
  setMessages([]);
  window.location.href = '/';
}
```

## How It Works

### Guest Mode
```
Board App sends CLEAR_CHATS message
    ↓
Chat component receives message
    ↓
Detects guest mode
    ↓
Calls UnifiedChatService.deleteBoardAppChats(null)
    ↓
Routes to LocalStorageChatService
    ↓
Clears all localStorage keys:
  - easl_chats_list
  - easl_chat_*
    ↓
Clears UI state
    ↓
Navigates to home
    ↓
Sends success response to Board App
```

### Authenticated Mode
```
Board App sends CLEAR_CHATS message
    ↓
Chat component receives message
    ↓
Gets Firebase ID token
    ↓
Calls API endpoint with token
    ↓
API verifies token
    ↓
Calls UnifiedChatService.deleteBoardAppChats(userId)
    ↓
Routes to ChatService
    ↓
Deletes from Firestore
    ↓
Clears UI state
    ↓
Navigates to home
    ↓
Sends success response to Board App
```

## Testing

### Test Guest Mode Clear
1. Enable guest mode (default)
2. Create some chats
3. From Board App, send clear chats message:
   ```javascript
   window.postMessage({
     type: 'CLEAR_CHATS',
     payload: { timestamp: new Date().toISOString() }
   }, '*');
   ```
4. Verify:
   - localStorage is cleared
   - Sidebar shows "No chats yet"
   - Navigated to home page
   - Board App receives success response

### Test Authenticated Mode Clear
1. Sign in with email/password
2. Create some chats
3. From Board App, send clear chats message
4. Verify:
   - Firestore chats deleted
   - Sidebar shows "No chats yet"
   - Navigated to home page
   - Board App receives success response

## Files Modified

1. ✅ `app/api/board-app/clear-chats/route.ts`
   - Added guest mode support
   - Uses `UnifiedChatService`
   - Accepts `Bearer guest` token

2. ✅ `components/Chat.tsx`
   - Detects guest mode
   - Clears localStorage directly for guests
   - Calls API for authenticated users

## Benefits

✅ **Guest Mode Support** - Guest users can clear their chat history  
✅ **Client-Side Clearing** - No API call needed for localStorage  
✅ **Unified Service** - Same code path for both modes  
✅ **Board App Integration** - Works seamlessly with Board App  
✅ **Backward Compatible** - Authenticated mode still works  

## Status

✅ Guest mode clear chats fully functional  
✅ API endpoint supports both modes  
✅ Client handler detects mode automatically  
✅ All diagnostics pass  
✅ Ready to use!  
