# EASL Integration API Documentation

## Overview
This document describes the communication protocol between the Board App (parent application) and the EASL Web Interface (embedded iframe). The integration uses the browser's `postMessage` API for secure cross-origin communication.

**EASL Application URL:** `https://easl-board.vercel.app/`

---

## Quick Reference

**For EASL Developers - What You Need to Do:**

1. **Listen for queries from Board App:**
   ```javascript
   window.addEventListener('message', (event) => {
     if (event.data?.type === 'CANVAS_QUERY') {
       const { query } = event.data.payload;
       // Process query...
     }
   });
   ```

2. **Send conversations back to Board App (REQUIRED):**
   ```javascript
   window.parent.postMessage({
     type: 'EASL_CONVERSATION',
     payload: {
       query: userQuery,
       response: aiResponse,
       timestamp: new Date().toISOString()
     }
   }, '*');
   ```

3. **Handle clear chats requests:**
   ```javascript
   if (event.data?.type === 'CLEAR_CHATS') {
     clearChatInterface();
   }
   ```

**⚠️ Important:** Do NOT call `/api/easl-response` directly. Use `EASL_CONVERSATION` postMessage instead.

---

## Table of Contents
1. [Security Requirements](#security-requirements)
2. [Messages from Board App to EASL](#messages-from-board-app-to-easl)
3. [Messages from EASL to Board App](#messages-from-easl-to-board-app)
4. [Backend API Integration](#backend-api-integration)
5. [Implementation Examples](#implementation-examples)
6. [Testing & Debugging](#testing--debugging)

---

## Security Requirements

### Origin Validation
Both applications MUST validate message origins to prevent security vulnerabilities.

**EASL App (iframe) should validate:**
```javascript
window.addEventListener('message', (event) => {
  // Accept messages from Board App domains
  const allowedOrigins = [
    'http://localhost:3000',           // Development
    'https://your-board-app.com'       // Production
  ];
  
  if (!allowedOrigins.includes(event.origin)) {
    return; // Ignore messages from unknown origins
  }
  
  // Process message...
});
```

**Board App validates:**
```javascript
// Board App only accepts messages from EASL
if (event.origin !== 'https://easl-board.vercel.app') {
  return;
}
```

---

## Messages from Board App to EASL

The Board App sends these message types to the EASL iframe:

### 1. CANVAS_QUERY
Sends a user query to EASL for processing.

**Message Structure:**
```typescript
{
  type: 'CANVAS_QUERY',
  payload: {
    query: string,              // The query text
    timestamp: string,          // ISO 8601 timestamp
    metadata?: {                // Optional metadata
      source?: string,          // e.g., 'voice', 'ui', 'api'
      patientId?: string,
      contextData?: any
    }
  }
}
```

**Example:**
```javascript
window.parent.postMessage({
  type: 'CANVAS_QUERY',
  payload: {
    query: "What are the treatment options for hepatocellular carcinoma?",
    timestamp: "2025-11-14T06:00:00.000Z",
    metadata: {
      source: 'voice',
      patientId: 'patient-123'
    }
  }
}, 'https://easl-board.vercel.app');
```

**EASL Implementation:**
```javascript
window.addEventListener('message', (event) => {
  if (event.data?.type === 'CANVAS_QUERY') {
    const { query, timestamp, metadata } = event.data.payload;
    
    // Display query in chat interface
    displayUserMessage(query);
    
    // Process with AI
    processQuery(query, metadata);
  }
});
```

---

### 2. CLEAR_CHATS
Instructs EASL to clear its chat history/UI.

**Message Structure:**
```typescript
{
  type: 'CLEAR_CHATS',
  payload: {
    timestamp: string           // ISO 8601 timestamp
  }
}
```

**Example:**
```javascript
window.parent.postMessage({
  type: 'CLEAR_CHATS',
  payload: {
    timestamp: "2025-11-14T06:00:00.000Z"
  }
}, 'https://easl-board.vercel.app');
```

**EASL Implementation:**
```javascript
window.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_CHATS') {
    // Clear chat UI
    clearChatInterface();
    
    // Send confirmation back to Board App
    window.parent.postMessage({
      type: 'EASL_RESPONSE',
      payload: {
        response: { success: true },
        status: 'cleared',
        timestamp: new Date().toISOString()
      }
    }, '*');
  }
});
```

---

## Messages from EASL to Board App

The EASL iframe MUST send these messages back to the Board App:

### 1. EASL_CONVERSATION (REQUIRED)
Send this message after EVERY chat interaction to persist conversation history.

**Message Structure:**
```typescript
{
  type: 'EASL_CONVERSATION',
  payload: {
    query: string,              // User's question
    response: string,           // AI's complete response
    timestamp: string,          // ISO 8601 timestamp
    metadata?: {                // Optional metadata
      model?: string,           // e.g., 'gpt-4', 'claude-3'
      tokens?: number,
      responseTime?: number,    // milliseconds
      [key: string]: any
    }
  }
}
```

**When to Send:**
- ✅ After AI generates a complete response
- ✅ After user submits a query and receives an answer
- ❌ Do NOT send for partial/streaming responses (wait until complete)

**Example:**
```javascript
// After AI completes response
async function handleAIResponse(userQuery, aiResponse) {
  // Display response in UI
  displayAIMessage(aiResponse);
  
  // Send to Board App for persistence
  window.parent.postMessage({
    type: 'EASL_CONVERSATION',
    payload: {
      query: userQuery,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      metadata: {
        model: 'gpt-4',
        tokens: 150,
        responseTime: 1250
      }
    }
  }, '*');
}
```

**Board App Handling:**
The Board App will automatically:
1. Receive the `EASL_CONVERSATION` message
2. Transform it and call the backend API with `response_type: 'chat'`
3. Save it to Redis for persistence
4. Include it in conversation history

**Important:** EASL developers do NOT need to call the backend API directly. The Board App handles this automatically when you send the `EASL_CONVERSATION` postMessage.

---

### 2. EASL_RESPONSE
Send operational responses (e.g., confirmation of actions).

**Message Structure:**
```typescript
{
  type: 'EASL_RESPONSE',
  payload: {
    response: any,              // Response data
    status?: string,            // Optional status
    timestamp: string           // ISO 8601 timestamp
  }
}
```

**Example:**
```javascript
// Confirm chat clear action
window.parent.postMessage({
  type: 'EASL_RESPONSE',
  payload: {
    response: { success: true },
    status: 'cleared',
    timestamp: new Date().toISOString()
  }
}, '*');
```

---

## Backend API Integration

### How Conversations are Persisted

When EASL sends an `EASL_CONVERSATION` postMessage, the Board App automatically calls its backend API.

**⚠️ IMPORTANT:** EASL developers should NOT call this API directly. Use the `EASL_CONVERSATION` postMessage instead.

**API Endpoint:** `POST /api/easl-response` (called automatically by Board App)

**Request Body (sent by Board App):**
```json
{
  "query": "User's question",
  "response": "AI's response",
  "response_type": "chat",
  "metadata": {
    "model": "gpt-4",
    "tokens": 150
  }
}
```

**API Requirements:**
- `response_type` MUST be `"complete"` or `"chat"` (Board App uses `"chat"`)
- `query` and `response` are required fields
- The API rejects other response types (e.g., `"streaming"`, `"partial"`)

**Response:**
```json
{
  "success": true,
  "message": "Response saved successfully",
  "conversationId": "conv-1763099910687",
  "totalConversations": 12
}
```

**Storage:**
- Conversations are stored in Redis (persistent)
- Maximum 100 conversations retained (FIFO)
- Each conversation includes: query, response, timestamp, metadata

### Direct API Calls (Not Recommended)

If you need to call the backend API directly (bypassing postMessage), you must use the correct `response_type`:

**✅ Accepted:**
```bash
curl -X POST http://localhost:3001/api/easl-response \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test query",
    "response": "test response",
    "response_type": "complete"
  }'
```

**❌ Rejected:**
```bash
curl -X POST http://localhost:3001/api/easl-response \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test query",
    "response": "test response",
    "response_type": "test"
  }'

# Returns: {"error": "Only complete responses are accepted", "received_type": "test"}
```

**Valid `response_type` values:**
- `"complete"` - Full AI response (recommended for direct API calls)
- `"chat"` - Used by Board App when forwarding postMessages

**Invalid values:**
- `"streaming"`, `"partial"`, `"test"`, or any other value will be rejected

**Recommendation:** Use `EASL_CONVERSATION` postMessage instead of direct API calls. The Board App handles the API integration automatically.

---

### Retrieving Conversation History

**API Endpoint:** `GET /api/easl-history?limit=10`

**Response:**
```json
{
  "success": true,
  "totalConversations": 12,
  "conversations": [
    {
      "id": "conv-1763099910687",
      "query": "What is hepatocellular carcinoma?",
      "response": "Hepatocellular carcinoma (HCC) is...",
      "timestamp": "2025-11-14T06:00:00.000Z",
      "metadata": {
        "model": "gpt-4",
        "tokens": 150
      },
      "response_type": "chat"
    }
  ]
}
```

---

## Implementation Examples

### Complete EASL Integration

```javascript
// ============================================================================
// EASL App - Complete Integration Example
// ============================================================================

class EASLBoardIntegration {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Validate origin
      const allowedOrigins = [
        'http://localhost:3000',
        'https://your-board-app.com'
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      // Handle different message types
      switch (event.data?.type) {
        case 'CANVAS_QUERY':
          this.handleQuery(event.data.payload);
          break;
        case 'CLEAR_CHATS':
          this.handleClearChats(event.data.payload);
          break;
      }
    });
  }

  async handleQuery({ query, timestamp, metadata }) {
    console.log('📥 Received query from Board App:', query);
    
    // Display user message in chat UI
    this.displayUserMessage(query);
    
    // Process with AI
    const aiResponse = await this.processWithAI(query, metadata);
    
    // Display AI response in chat UI
    this.displayAIMessage(aiResponse);
    
    // Send conversation back to Board App for persistence
    this.sendConversation(query, aiResponse, metadata);
  }

  async processWithAI(query, metadata) {
    // Your AI processing logic here
    const response = await yourAIService.generate(query);
    return response;
  }

  sendConversation(query, response, originalMetadata = {}) {
    window.parent.postMessage({
      type: 'EASL_CONVERSATION',
      payload: {
        query: query,
        response: response,
        timestamp: new Date().toISOString(),
        metadata: {
          ...originalMetadata,
          model: 'gpt-4',
          tokens: response.length,
          responseTime: 1250
        }
      }
    }, '*');
    
    console.log('📤 Sent conversation to Board App');
  }

  handleClearChats({ timestamp }) {
    console.log('📥 Received clear chats request');
    
    // Clear your chat UI
    this.clearChatInterface();
    
    // Send confirmation
    window.parent.postMessage({
      type: 'EASL_RESPONSE',
      payload: {
        response: { success: true },
        status: 'cleared',
        timestamp: new Date().toISOString()
      }
    }, '*');
    
    console.log('✅ Chat cleared and confirmed');
  }

  displayUserMessage(message) {
    // Your UI logic to display user message
  }

  displayAIMessage(message) {
    // Your UI logic to display AI message
  }

  clearChatInterface() {
    // Your UI logic to clear chat
  }
}

// Initialize integration
const integration = new EASLBoardIntegration();
```

### Handling User-Initiated Chats

```javascript
// When user submits a message directly in EASL (not from Board App)
async function handleUserSubmit(userMessage) {
  // Display user message
  displayUserMessage(userMessage);
  
  // Get AI response
  const aiResponse = await getAIResponse(userMessage);
  
  // Display AI response
  displayAIMessage(aiResponse);
  
  // IMPORTANT: Send to Board App for persistence
  window.parent.postMessage({
    type: 'EASL_CONVERSATION',
    payload: {
      query: userMessage,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'user_initiated',
        model: 'gpt-4'
      }
    }
  }, '*');
}
```

---

## Testing & Debugging

### Console Logging
Enable detailed logging to debug integration:

```javascript
// EASL App
window.addEventListener('message', (event) => {
  console.log('📥 EASL received message:', {
    type: event.data?.type,
    origin: event.origin,
    payload: event.data?.payload
  });
});

// When sending messages
console.log('📤 EASL sending message:', {
  type: 'EASL_CONVERSATION',
  payload: { query, response }
});
```

### Verification Checklist

**EASL Developers should verify:**

- [ ] Message listener is set up on page load
- [ ] Origin validation is implemented
- [ ] `CANVAS_QUERY` messages are received and processed
- [ ] `CLEAR_CHATS` messages clear the UI
- [ ] `EASL_CONVERSATION` is sent after EVERY chat interaction
- [ ] `EASL_CONVERSATION` includes both query and response
- [ ] Timestamp is in ISO 8601 format
- [ ] Console logs show message flow

**Testing Commands:**

```bash
# Check if conversations are being saved
curl http://localhost:3001/api/easl-history

# Verify conversation count
curl http://localhost:3001/api/easl-history | jq '.totalConversations'

# View recent conversations
curl http://localhost:3001/api/easl-history?limit=5 | jq '.conversations'
```

### Common Issues

**Issue:** Conversations not persisting
- **Cause:** Not sending `EASL_CONVERSATION` messages
- **Fix:** Ensure message is sent after each complete response

**Issue:** Messages not received
- **Cause:** Origin validation blocking messages
- **Fix:** Check `event.origin` in console logs

**Issue:** Partial responses being sent
- **Cause:** Sending messages during streaming
- **Fix:** Only send `EASL_CONVERSATION` when response is complete

**Issue:** API returns "Only complete responses are accepted"
- **Cause:** Using wrong `response_type` in direct API call
- **Fix:** Use `response_type: "complete"` or switch to `EASL_CONVERSATION` postMessage
- **Example Error:**
  ```json
  {
    "error": "Only complete responses are accepted",
    "received_type": "test"
  }
  ```
- **Solution:**
  ```javascript
  // ❌ Wrong
  fetch('/api/easl-response', {
    body: JSON.stringify({
      query: "...",
      response: "...",
      response_type: "test"  // Invalid!
    })
  });
  
  // ✅ Correct (but postMessage is preferred)
  fetch('/api/easl-response', {
    body: JSON.stringify({
      query: "...",
      response: "...",
      response_type: "complete"
    })
  });
  
  // ✅ Best: Use postMessage instead
  window.parent.postMessage({
    type: 'EASL_CONVERSATION',
    payload: { query: "...", response: "..." }
  }, '*');
  ```

---

## Support

For questions or issues with the integration:
- Check browser console for message logs
- Verify API endpoints are accessible
- Review conversation history via `/api/easl-history`
- Ensure Redis is connected (check server logs)

---

## Changelog

**v1.0.0** - Initial documentation
- Defined `CANVAS_QUERY` message format
- Defined `EASL_CONVERSATION` message format
- Defined `CLEAR_CHATS` message format
- Added security requirements
- Added implementation examples
