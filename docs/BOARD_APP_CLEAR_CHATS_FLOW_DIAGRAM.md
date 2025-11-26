# Board App Clear Chats - Flow Diagrams

## Message Source Tracking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Action                              │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  Board App   │   │   Main App   │
│   (iframe)   │   │  (direct)    │
└──────┬───────┘   └──────┬───────┘
       │                  │
       │ postMessage      │ direct input
       │                  │
       ▼                  ▼
┌─────────────────────────────────────┐
│      EASL Chat Component            │
│  ┌───────────────────────────────┐  │
│  │ boardAppMetadataRef.current   │  │
│  │   = metadata (or null)        │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     useChatMessages Hook            │
│  ┌───────────────────────────────┐  │
│  │ if (boardAppMetadataRef):     │  │
│  │   source = 'board-app'        │  │
│  │ else:                         │  │
│  │   source = 'main-app'         │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Message Created              │
│  {                                   │
│    text: "...",                      │
│    source: "board-app" | "main-app", │
│    boardAppMetadata: {...}           │
│  }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      ChatService.saveMessage         │
│  ┌───────────────────────────────┐  │
│  │ Save message to Firestore     │  │
│  │ If source = 'board-app':      │  │
│  │   Set hasBoardAppMessages=true│  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│           Firestore                  │
│  users/{uid}/chats/{chatId}          │
│    hasBoardAppMessages: true         │
│  users/{uid}/chats/{chatId}/         │
│    messages/{msgId}                  │
│      source: "board-app"             │
└─────────────────────────────────────┘
```

## Clear Chats API Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Board App UI                                │
│  User clicks "Clear Chats" button                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Get Firebase ID Token                               │
│  const idToken = await user.getIdToken()                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/board-app/clear-chats                     │
│  Headers: Authorization: Bearer {idToken}                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Endpoint (route.ts)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Extract token from Authorization header               │  │
│  │ 2. Verify token with Firebase Admin SDK                  │  │
│  │ 3. Extract userId from verified token                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│         ChatService.deleteBoardAppChats(userId)                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Query all chats for user                               │  │
│  │ 2. Filter: hasBoardAppMessages === true                   │  │
│  │ 3. For each chat:                                         │  │
│  │    a. Load all messages                                   │  │
│  │    b. Check if ALL messages.source === 'board-app'        │  │
│  │    c. If yes: proceed to delete                           │  │
│  │    d. If no: skip (preserve)                              │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Deletion Process                              │
│  For each qualifying chat:                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Delete all messages                                    │  │
│  │    users/{uid}/chats/{chatId}/messages/{msgId}            │  │
│  │                                                           │  │
│  │ 2. Delete chat document                                   │  │
│  │    users/{uid}/chats/{chatId}                             │  │
│  │                                                           │  │
│  │ 3. Track statistics                                       │  │
│  │    deletedChats++                                         │  │
│  │    deletedMessages++                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Response                                  │
│  {                                                               │
│    success: true,                                               │
│    deletedChats: 5,                                             │
│    deletedMessages: 23,                                         │
│    message: "Successfully deleted 5 chat(s)..."                 │
│  }                                                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Board App UI                                   │
│  Display success message                                        │
│  Refresh chat list                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Deletion Decision Tree

```
                    ┌─────────────────┐
                    │  Chat Document  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ hasBoardApp     │
                    │ Messages = true?│
                    └────┬───────┬────┘
                         │       │
                    YES  │       │  NO
                         │       │
                         ▼       ▼
              ┌──────────────┐  ┌──────────────┐
              │ Load all     │  │ SKIP         │
              │ messages     │  │ (preserve)   │
              └──────┬───────┘  └──────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ Check each message:  │
              │ source === 'board-   │
              │ app'?                │
              └──────┬───────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ALL  │                         │  SOME/NONE
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ DELETE       │          │ PRESERVE     │
│ - All msgs   │          │ (mixed       │
│ - Chat doc   │          │  source)     │
└──────────────┘          └──────────────┘
```

## Example Scenarios

### Scenario 1: Pure Board App Chat (DELETED)

```
Chat ID: chat-001
├── Message 1 (user)
│   ├── text: "What is hepatitis?"
│   ├── source: "board-app"
│   └── boardAppMetadata: {...}
│
└── Message 2 (AI)
    ├── text: "Hepatitis is..."
    ├── source: "board-app"
    └── boardAppMetadata: {...}

Decision: ✅ DELETE
Reason: All messages from board-app
```

### Scenario 2: Mixed Source Chat (PRESERVED)

```
Chat ID: chat-002
├── Message 1 (user)
│   ├── text: "What is hepatitis?"
│   ├── source: "board-app"
│   └── boardAppMetadata: {...}
│
├── Message 2 (AI)
│   ├── text: "Hepatitis is..."
│   ├── source: "board-app"
│   └── boardAppMetadata: {...}
│
├── Message 3 (user)
│   ├── text: "Tell me more"
│   ├── source: "main-app"  ← Main app message
│   └── boardAppMetadata: undefined
│
└── Message 4 (AI)
    ├── text: "Here's more info..."
    ├── source: "main-app"
    └── boardAppMetadata: undefined

Decision: ❌ PRESERVE
Reason: Contains main-app messages
```

### Scenario 3: Pure Main App Chat (PRESERVED)

```
Chat ID: chat-003
├── Message 1 (user)
│   ├── text: "What is cirrhosis?"
│   ├── source: "main-app"
│   └── boardAppMetadata: undefined
│
└── Message 2 (AI)
    ├── text: "Cirrhosis is..."
    ├── source: "main-app"
    └── boardAppMetadata: undefined

Decision: ❌ PRESERVE
Reason: No board-app messages (hasBoardAppMessages = false)
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Board App                                   │
│  User is logged in with Firebase                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Firebase Client SDK                                 │
│  const auth = getAuth()                                         │
│  const user = auth.currentUser                                  │
│  const idToken = await user.getIdToken()                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ ID Token (JWT)
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Request                                         │
│  POST /api/board-app/clear-chats                                │
│  Authorization: Bearer {idToken}                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Firebase Admin SDK                                  │
│  const decodedToken = await adminAuth.verifyIdToken(idToken)    │
│  const userId = decodedToken.uid                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   VALID│                 │INVALID
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ Proceed with │   │ Return 401   │
│ deletion     │   │ Unauthorized │
└──────────────┘   └──────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Request                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Token Verification                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   VALID│                 │INVALID
        ▼                 ▼
┌──────────────┐   ┌──────────────────────────────────┐
│ Continue     │   │ Return 401                       │
│              │   │ {                                │
│              │   │   success: false,                │
│              │   │   error: "Invalid token"         │
│              │   │ }                                │
└──────┬───────┘   └──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Deletion Process                                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
  SUCCESS│                 │ERROR
        ▼                 ▼
┌──────────────┐   ┌──────────────────────────────────┐
│ Return 200   │   │ Return 500                       │
│ {            │   │ {                                │
│   success:   │   │   success: false,                │
│   true,      │   │   error: "Internal error",       │
│   deleted... │   │   message: "..."                 │
│ }            │   │ }                                │
└──────────────┘   └──────────────────────────────────┘
```

## Data Structure

### Message Document

```
users/{userId}/chats/{chatId}/messages/{messageId}
{
  id: string,
  text: string,
  isUser: boolean,
  timestamp: Date,
  uid: string,
  
  // NEW FIELDS
  source: "board-app" | "main-app",
  boardAppMetadata?: {
    patientId?: string,
    context?: string,
    source?: "user" | "voice" | "api",
    ...
  },
  
  // Existing fields
  isReasoning?: boolean,
  reasoningText?: string,
  expertName?: string,
  safetyAnalysis?: {...},
  localGuidelineAnalysis?: {...},
  ...
}
```

### Chat Document

```
users/{userId}/chats/{chatId}
{
  title: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // NEW FIELD
  hasBoardAppMessages: boolean
}
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│              Query Optimization                                  │
└─────────────────────────────────────────────────────────────────┘

WITHOUT hasBoardAppMessages flag:
┌──────────────────────────────────────────────────────────────┐
│ 1. Query ALL chats                                           │
│ 2. For EACH chat:                                            │
│    - Load ALL messages                                       │
│    - Check source of each message                            │
│ 3. Delete qualifying chats                                   │
│                                                              │
│ Performance: O(n * m) where n=chats, m=avg messages         │
└──────────────────────────────────────────────────────────────┘

WITH hasBoardAppMessages flag:
┌──────────────────────────────────────────────────────────────┐
│ 1. Query ONLY chats with hasBoardAppMessages=true           │
│ 2. For EACH flagged chat:                                    │
│    - Load ALL messages                                       │
│    - Check source of each message                            │
│ 3. Delete qualifying chats                                   │
│                                                              │
│ Performance: O(k * m) where k=flagged chats, m=avg messages │
│ Improvement: k << n (much fewer chats to process)           │
└──────────────────────────────────────────────────────────────┘
```

---

These diagrams provide a visual representation of how the clear chats feature works. Use them as a reference when implementing or troubleshooting the integration.
