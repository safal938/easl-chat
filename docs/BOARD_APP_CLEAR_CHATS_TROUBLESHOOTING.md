# Board App Clear Chats - Troubleshooting Guide

## Common Issues and Solutions

### 1. 401 Unauthorized Error

#### Symptom
```json
{
  "success": false,
  "error": "Invalid or expired token",
  "message": "Please provide a valid Firebase ID token"
}
```

#### Possible Causes
- Firebase ID token has expired (tokens expire after 1 hour)
- User is not authenticated
- Token is malformed or invalid
- Wrong Firebase project

#### Solutions

**Solution 1: Refresh the token**
```javascript
const auth = getAuth();
const user = auth.currentUser;

// Force refresh the token
const idToken = await user.getIdToken(true); // true = force refresh
```

**Solution 2: Check if user is authenticated**
```javascript
const auth = getAuth();
if (!auth.currentUser) {
  console.error('User not authenticated');
  // Redirect to login
  window.location.href = '/login';
}
```

**Solution 3: Verify token format**
```javascript
const idToken = await user.getIdToken();
console.log('Token length:', idToken.length); // Should be ~1000+ characters
console.log('Token starts with:', idToken.substring(0, 20));
```

---

### 2. Missing Authorization Header

#### Symptom
```json
{
  "success": false,
  "error": "Missing or invalid authorization header",
  "message": "Authorization header must be in format: Bearer <firebase-id-token>"
}
```

#### Possible Causes
- Authorization header not included in request
- Wrong header format
- Token not prefixed with "Bearer "

#### Solutions

**Solution 1: Check header format**
```javascript
// ✅ CORRECT
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
});

// ❌ WRONG - Missing "Bearer "
const response = await fetch(url, {
  headers: {
    'Authorization': idToken,
  },
});

// ❌ WRONG - Wrong header name
const response = await fetch(url, {
  headers: {
    'Auth': `Bearer ${idToken}`,
  },
});
```

---

### 3. No Chats Deleted (deletedChats: 0)

#### Symptom
```json
{
  "success": true,
  "deletedChats": 0,
  "deletedMessages": 0,
  "message": "Successfully deleted 0 chat(s) with 0 message(s)"
}
```

#### Possible Causes
- No chats exist from board app
- All chats have mixed sources (board app + main app)
- Messages not properly tagged with source

#### Solutions

**Solution 1: Verify chats were created via board app**
```javascript
// Check in browser console
const auth = getAuth();
const user = auth.currentUser;
const chatsRef = collection(db, `users/${user.uid}/chats`);
const snapshot = await getDocs(chatsRef);

snapshot.forEach(doc => {
  console.log('Chat:', doc.id, doc.data());
});
```

**Solution 2: Check message sources**
```javascript
// Check messages in a specific chat
const messagesRef = collection(db, `users/${user.uid}/chats/${chatId}/messages`);
const snapshot = await getDocs(messagesRef);

snapshot.forEach(doc => {
  const data = doc.data();
  console.log('Message:', doc.id, 'Source:', data.source);
});
```

**Solution 3: Verify hasBoardAppMessages flag**
```javascript
// Check if chat is flagged
const chatRef = doc(db, `users/${user.uid}/chats/${chatId}`);
const chatDoc = await getDoc(chatRef);
console.log('hasBoardAppMessages:', chatDoc.data().hasBoardAppMessages);
```

---

### 4. Wrong Chats Deleted

#### Symptom
Chats that should be preserved are being deleted, or vice versa.

#### Possible Causes
- Message source tagging is incorrect
- Logic error in deletion algorithm
- Race condition during message creation

#### Solutions

**Solution 1: Audit message sources**
```javascript
// Check all messages in all chats
const chatsRef = collection(db, `users/${user.uid}/chats`);
const chatsSnapshot = await getDocs(chatsRef);

for (const chatDoc of chatsSnapshot.docs) {
  const messagesRef = collection(db, `users/${user.uid}/chats/${chatDoc.id}/messages`);
  const messagesSnapshot = await getDocs(messagesRef);
  
  console.log(`Chat ${chatDoc.id}:`);
  messagesSnapshot.forEach(msgDoc => {
    const data = msgDoc.data();
    console.log(`  - ${data.isUser ? 'User' : 'AI'}: source=${data.source}`);
  });
}
```

**Solution 2: Contact EASL team**
If message sources are incorrect, this is a bug in the EASL app. Contact the EASL team with:
- Chat IDs affected
- Expected vs actual behavior
- Screenshots of message data

---

### 5. Network Error / CORS Error

#### Symptom
```
Failed to fetch
CORS policy: No 'Access-Control-Allow-Origin' header
```

#### Possible Causes
- Wrong API URL
- CORS not configured for your domain
- Network connectivity issue

#### Solutions

**Solution 1: Verify API URL**
```javascript
// Development
const API_URL = 'http://localhost:3000';

// Production
const API_URL = 'https://easl-board.vercel.app';

console.log('Using API URL:', API_URL);
```

**Solution 2: Check CORS configuration**
Contact EASL team to add your domain to allowed origins in `lib/canvas-config.ts`:
```typescript
allowedOrigins: [
  'https://your-board-app.vercel.app', // Add your domain
  'http://localhost:3000',
  // ...
]
```

**Solution 3: Test with curl**
```bash
curl -X POST https://easl-board.vercel.app/api/board-app/clear-chats \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 6. 500 Internal Server Error

#### Symptom
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

#### Possible Causes
- Firebase Admin SDK not configured
- Firestore permissions issue
- Bug in deletion logic

#### Solutions

**Solution 1: Check server logs**
Contact EASL team to check server logs for detailed error messages.

**Solution 2: Retry the request**
```javascript
async function clearChatsWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await clearChats();
      return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

### 7. Partial Deletion (Some Chats Failed)

#### Symptom
```json
{
  "success": true,
  "deletedChats": 3,
  "deletedMessages": 15,
  "errors": [
    "Error processing chat abc123: Permission denied"
  ]
}
```

#### Possible Causes
- Firestore permissions issue for specific chats
- Concurrent modifications
- Corrupted chat data

#### Solutions

**Solution 1: Retry for failed chats**
The API will continue processing other chats even if some fail. You can retry the operation to attempt deleting the failed chats again.

**Solution 2: Manual cleanup**
Contact EASL team with the error messages to manually investigate and clean up failed chats.

---

### 8. Token Expired During Request

#### Symptom
Request starts successfully but fails midway with 401 error.

#### Possible Causes
- Token expired during long-running deletion
- Token was close to expiration when request started

#### Solutions

**Solution 1: Refresh token before request**
```javascript
async function clearChatsWithFreshToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  // Always get fresh token
  const idToken = await user.getIdToken(true);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });
  
  return await response.json();
}
```

**Solution 2: Implement token refresh on 401**
```javascript
async function clearChatsWithAutoRetry() {
  let idToken = await user.getIdToken();
  
  let response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${idToken}` },
  });
  
  if (response.status === 401) {
    // Refresh token and retry
    idToken = await user.getIdToken(true);
    response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${idToken}` },
    });
  }
  
  return await response.json();
}
```

---

### 9. UI Not Updating After Deletion

#### Symptom
Chats are deleted successfully, but UI still shows them.

#### Possible Causes
- UI not refreshed after deletion
- Stale cache
- Firestore listener not updating

#### Solutions

**Solution 1: Force refresh**
```javascript
const result = await clearChats();
if (result.success) {
  window.location.reload();
}
```

**Solution 2: Update state manually**
```javascript
const result = await clearChats();
if (result.success) {
  // Remove deleted chats from state
  setChats(prevChats => 
    prevChats.filter(chat => !chat.hasBoardAppMessages)
  );
}
```

**Solution 3: Re-fetch data**
```javascript
const result = await clearChats();
if (result.success) {
  await fetchChats(); // Your function to fetch chats
}
```

---

### 10. Firebase Not Initialized

#### Symptom
```
Error: Firebase not initialized
Cannot read property 'currentUser' of undefined
```

#### Possible Causes
- Firebase SDK not imported
- Firebase not initialized
- Wrong import path

#### Solutions

**Solution 1: Initialize Firebase**
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ...
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

**Solution 2: Check imports**
```javascript
// ✅ CORRECT
import { getAuth } from 'firebase/auth';

// ❌ WRONG
import { getAuth } from 'firebase';
```

---

## Debugging Checklist

When troubleshooting, go through this checklist:

- [ ] User is authenticated (`auth.currentUser` is not null)
- [ ] Firebase ID token is valid (not expired)
- [ ] Authorization header is correctly formatted
- [ ] API URL is correct (development vs production)
- [ ] Network connectivity is working
- [ ] CORS is configured for your domain
- [ ] Chats were created via board app (not main app)
- [ ] Messages have correct source tags
- [ ] Browser console shows no errors
- [ ] Server logs show no errors (contact EASL team)

## Diagnostic Commands

### Check Authentication
```javascript
const auth = getAuth();
console.log('Current user:', auth.currentUser);
console.log('User email:', auth.currentUser?.email);
console.log('User ID:', auth.currentUser?.uid);
```

### Check Token
```javascript
const idToken = await auth.currentUser.getIdToken();
console.log('Token length:', idToken.length);
console.log('Token preview:', idToken.substring(0, 50) + '...');

// Decode token (for debugging only - don't do this in production)
const parts = idToken.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token payload:', payload);
console.log('Token expires:', new Date(payload.exp * 1000));
```

### Check Chats
```javascript
const chatsRef = collection(db, `users/${auth.currentUser.uid}/chats`);
const snapshot = await getDocs(chatsRef);
console.log('Total chats:', snapshot.size);

snapshot.forEach(doc => {
  const data = doc.data();
  console.log(`Chat ${doc.id}:`, {
    title: data.title,
    hasBoardAppMessages: data.hasBoardAppMessages,
  });
});
```

### Check Messages
```javascript
const messagesRef = collection(db, `users/${auth.currentUser.uid}/chats/${chatId}/messages`);
const snapshot = await getDocs(messagesRef);
console.log('Total messages:', snapshot.size);

snapshot.forEach(doc => {
  const data = doc.data();
  console.log(`Message ${doc.id}:`, {
    isUser: data.isUser,
    source: data.source,
    text: data.text.substring(0, 50) + '...',
  });
});
```

### Test API Endpoint
```javascript
async function testEndpoint() {
  const auth = getAuth();
  const idToken = await auth.currentUser.getIdToken(true);
  
  console.log('Testing API endpoint...');
  console.log('Token:', idToken.substring(0, 20) + '...');
  
  try {
    const response = await fetch('https://easl-board.vercel.app/api/board-app/clear-chats', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const result = await response.json();
    console.log('Response body:', result);
    
    return result;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

testEndpoint();
```

## Getting Help

If you've tried all the solutions above and still have issues:

1. **Gather information**:
   - Error messages (exact text)
   - Browser console logs
   - Network tab (request/response)
   - Steps to reproduce
   - Expected vs actual behavior

2. **Check documentation**:
   - [Quick Start Guide](./BOARD_APP_CLEAR_CHATS_QUICK_START.md)
   - [API Documentation](./BOARD_APP_CLEAR_CHATS_API.md)
   - [Implementation Details](./BOARD_APP_CLEAR_CHATS_IMPLEMENTATION.md)

3. **Contact EASL team**:
   - Provide all gathered information
   - Include chat IDs and user IDs (if applicable)
   - Describe what you've already tried

## Known Limitations

1. **Token Expiration**: Firebase ID tokens expire after 1 hour. Always refresh before making requests.

2. **Rate Limiting**: No rate limiting is currently implemented, but avoid calling the API in tight loops.

3. **Large Datasets**: Deleting thousands of chats may take time. Consider implementing pagination or batch processing.

4. **Concurrent Modifications**: If messages are being added while deletion is in progress, they may not be deleted.

5. **Soft Delete**: Currently, deletion is permanent. There's no undo functionality.

## Best Practices to Avoid Issues

1. **Always refresh token before requests**:
   ```javascript
   const idToken = await user.getIdToken(true);
   ```

2. **Implement error handling**:
   ```javascript
   try {
     await clearChats();
   } catch (error) {
     console.error('Failed to clear chats:', error);
     showErrorToUser(error.message);
   }
   ```

3. **Show confirmation dialog**:
   ```javascript
   if (confirm('Clear all board app chats? This cannot be undone.')) {
     await clearChats();
   }
   ```

4. **Update UI after deletion**:
   ```javascript
   const result = await clearChats();
   if (result.success) {
     refreshChatList();
   }
   ```

5. **Log important events**:
   ```javascript
   console.log('Clearing chats...');
   const result = await clearChats();
   console.log('Cleared:', result.deletedChats, 'chats');
   ```

---

**Still having issues?** Contact the EASL team with your diagnostic information.
