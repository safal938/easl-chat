# Board App: Clear Chats via PostMessage

## Overview

The EASL app now supports clearing chat history directly via `postMessage` - no Firebase setup or API calls required! This works exactly like sending queries to the EASL app.

## How It Works

The Board App can send a `CLEAR_CHATS` message to the EASL iframe, and the EASL app will:
1. Clear all messages from the current chat UI
2. Reset the input field
3. Reset any streaming state
4. Send a success/error response back to the Board App

## Implementation

### From Board App (Parent Window)

```javascript
// Get reference to the EASL iframe
const easlIframe = document.getElementById('easl-iframe');

// Send clear chats message
easlIframe.contentWindow.postMessage(
  {
    type: 'CLEAR_CHATS',
    payload: {
      timestamp: new Date().toISOString()
    }
  },
  'http://localhost:3000' // EASL app origin
);
```

### Listen for Response

```javascript
window.addEventListener('message', (event) => {
  // Verify origin
  if (event.origin !== 'http://localhost:3000') return;
  
  const message = event.data;
  
  if (message.type === 'EASL_RESPONSE') {
    console.log('Response from EASL:', message.payload);
    
    if (message.payload.status === 'success') {
      console.log('✅ Chat history cleared successfully');
      // Update your UI
    } else {
      console.error('❌ Failed to clear chat history:', message.payload.response);
    }
  }
});
```

## Complete Example

### Board App Button Handler

```javascript
// Clear chats button in Board App
document.getElementById('clear-chats-btn').addEventListener('click', () => {
  const easlIframe = document.getElementById('easl-iframe');
  
  if (!easlIframe) {
    console.error('EASL iframe not found');
    return;
  }
  
  // Send clear chats message
  easlIframe.contentWindow.postMessage(
    {
      type: 'CLEAR_CHATS',
      payload: {
        timestamp: new Date().toISOString()
      }
    },
    'http://localhost:3000'
  );
  
  console.log('🗑️ Clear chats request sent to EASL app');
});
```

### Response Handler

```javascript
// Listen for responses from EASL app
window.addEventListener('message', (event) => {
  // Security: Verify origin
  if (event.origin !== 'http://localhost:3000') return;
  
  const message = event.data;
  
  if (message.type === 'EASL_RESPONSE') {
    const { response, status, timestamp } = message.payload;
    
    if (status === 'success' && response.success) {
      console.log('✅ Chat cleared:', response.message);
      
      // Update Board App UI
      showNotification('Chat history cleared successfully', 'success');
      
      // Optionally refresh your chat list or UI
      refreshChatList();
    } else {
      console.error('❌ Clear failed:', response.error);
      showNotification('Failed to clear chat history', 'error');
    }
  }
});
```

## Message Format

### Request (Board App → EASL App)

```typescript
{
  type: 'CLEAR_CHATS',
  payload: {
    timestamp: string  // ISO 8601 timestamp
  }
}
```

### Response (EASL App → Board App)

```typescript
{
  type: 'EASL_RESPONSE',
  payload: {
    response: {
      success: boolean,
      message?: string,  // Success message
      error?: string     // Error message if failed
    },
    status: 'success' | 'error',
    timestamp: string,
    metadata?: any
  }
}
```

## Security

- **Origin Verification**: The EASL app only accepts messages from allowed origins (configured in `CANVAS_CONFIG.allowedOrigins`)
- **Type Checking**: Messages must have the correct `type` field
- **No Authentication Required**: Since the iframe is already embedded and trusted

## Advantages Over API Approach

✅ **No Firebase Setup**: Works without any Firebase configuration  
✅ **No CORS Issues**: Direct iframe communication  
✅ **Instant**: No network latency  
✅ **Simple**: Just postMessage, no API endpoints  
✅ **Secure**: Origin-based security  
✅ **Consistent**: Uses same pattern as query sending  

## Configuration

### EASL App (Already Configured)

The EASL app is already set up to receive `CLEAR_CHATS` messages. No changes needed!

### Board App Setup

1. **Get iframe reference**:
   ```javascript
   const easlIframe = document.getElementById('easl-iframe');
   ```

2. **Send message**:
   ```javascript
   easlIframe.contentWindow.postMessage({
     type: 'CLEAR_CHATS',
     payload: { timestamp: new Date().toISOString() }
   }, 'http://localhost:3000');
   ```

3. **Listen for response**:
   ```javascript
   window.addEventListener('message', handleEaslResponse);
   ```

## Testing

### Test from Browser Console (in Board App)

```javascript
// Send clear chats message
document.getElementById('easl-iframe').contentWindow.postMessage(
  {
    type: 'CLEAR_CHATS',
    payload: { timestamp: new Date().toISOString() }
  },
  'http://localhost:3000'
);

// Check console for response
```

### Expected Console Output

**In EASL App Console**:
```
🗑️ Received clear chats request from Canvas: { timestamp: "...", origin: "..." }
✅ Chat history cleared successfully
📤 Sent response to Canvas: { origin: "...", status: "success" }
```

**In Board App Console**:
```
🗑️ Clear chats request sent to EASL app
📥 Response from EASL: { response: { success: true, message: "..." }, status: "success" }
✅ Chat cleared: Chat history cleared
```

## Comparison: API vs PostMessage

| Feature | API Approach | PostMessage Approach |
|---------|-------------|---------------------|
| Firebase Setup | ✅ Required | ❌ Not needed |
| CORS Configuration | ✅ Required | ❌ Not needed |
| Network Call | ✅ Yes | ❌ No (instant) |
| Authentication | ✅ Required | ❌ Not needed |
| Complexity | 🔴 High | 🟢 Low |
| Setup Time | 🔴 30+ minutes | 🟢 5 minutes |
| Maintenance | 🔴 High | 🟢 Low |

## Troubleshooting

### Message Not Received

1. **Check iframe is loaded**:
   ```javascript
   const iframe = document.getElementById('easl-iframe');
   console.log('Iframe loaded:', iframe?.contentWindow !== null);
   ```

2. **Check origin**:
   ```javascript
   // Make sure origin matches EASL app URL
   const origin = 'http://localhost:3000'; // or your production URL
   ```

3. **Check console for errors**:
   - Look for "Message from untrusted origin" warnings
   - Verify the message structure is correct

### No Response Received

1. **Check response listener**:
   ```javascript
   window.addEventListener('message', (event) => {
     console.log('Received message:', event.data);
   });
   ```

2. **Verify origin in listener**:
   ```javascript
   if (event.origin !== 'http://localhost:3000') {
     console.log('Ignoring message from:', event.origin);
     return;
   }
   ```

## Related Documentation

- `hooks/useCanvasMessageListener.ts` - Message listener implementation
- `components/Chat.tsx` - Clear chats handler
- `lib/canvas-config.ts` - Origin configuration
- `docs/BOARD_APP_INTEGRATION_CHECKLIST.md` - Full integration guide

## Status

✅ **Implemented and Ready to Use**  
✅ **No Firebase Setup Required**  
✅ **Works with Existing Iframe Integration**  
