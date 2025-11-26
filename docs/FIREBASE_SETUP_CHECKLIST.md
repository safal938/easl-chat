# Firebase Setup - Quick Checklist

Use this checklist to quickly set up a new Firebase project for the EASL application.

---

## 📋 Setup Checklist

### Part 1: Firebase Console Setup

#### Create Project
- [ ] Go to https://console.firebase.google.com/
- [ ] Click "Add project"
- [ ] Enter project name
- [ ] Enable/disable Google Analytics
- [ ] Wait for project creation
- [ ] Click "Continue"

#### Enable Authentication
- [ ] Click "Authentication" in sidebar
- [ ] Click "Get started"
- [ ] Click "Sign-in method" tab
- [ ] Enable "Email/Password"
- [ ] (Optional) Enable other providers (Google, GitHub, etc.)

#### Create Firestore Database
- [ ] Click "Firestore Database" in sidebar
- [ ] Click "Create database"
- [ ] Select location (⚠️ cannot change later!)
- [ ] Choose "Start in production mode"
- [ ] Click "Create"
- [ ] Wait for database creation

#### Register Web App
- [ ] Click gear icon (⚙️) → "Project settings"
- [ ] Scroll to "Your apps"
- [ ] Click Web icon (`</>`)
- [ ] Enter app nickname
- [ ] Click "Register app"
- [ ] **Copy the configuration values** ✏️

#### Generate Service Account Key
- [ ] In "Project settings", click "Service accounts" tab
- [ ] Click "Generate new private key"
- [ ] Click "Generate key"
- [ ] **Save the downloaded JSON file securely** 🔒

---

### Part 2: Local Project Setup

#### Update .env File
- [ ] Open `.env` in project root
- [ ] Update `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] Update `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] Update `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] Update `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] Update `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] Update `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] Add `FIREBASE_SERVICE_ACCOUNT_KEY` (entire JSON on one line)
- [ ] Save the file

#### Configure Security Rules
- [ ] Go to Firestore Database → Rules tab
- [ ] Copy rules from setup guide
- [ ] Click "Publish"

#### Restart Development Server
- [ ] Stop current server (Ctrl+C)
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000

---

### Part 3: Testing

#### Test Authentication
- [ ] Open app in browser
- [ ] Click "Sign Up" or "Login"
- [ ] Create a test account
- [ ] Verify login works
- [ ] Check Firebase Console → Authentication → Users
- [ ] Confirm user appears in list

#### Test Firestore
- [ ] Send a message in chat
- [ ] Check Firebase Console → Firestore Database
- [ ] Verify data structure:
  ```
  users/{userId}/chats/{chatId}/messages/{messageId}
  ```
- [ ] Confirm message data is saved

#### Test Clear Chats API
- [ ] Create test chats via board app
- [ ] Get Firebase ID token (browser console):
  ```javascript
  await firebase.auth().currentUser.getIdToken()
  ```
- [ ] Run test script:
  ```bash
  node scripts/test-clear-chats.js YOUR_TOKEN
  ```
- [ ] Verify success message
- [ ] Check chats were deleted in Firebase Console

---

### Part 4: Production Deployment

#### Configure Production Environment
- [ ] Go to deployment platform (Vercel, etc.)
- [ ] Add environment variables:
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
  - [ ] `FIREBASE_SERVICE_ACCOUNT_KEY`
- [ ] Save environment variables

#### Configure Authorized Domains
- [ ] Go to Firebase Console → Authentication → Settings
- [ ] Click "Authorized domains"
- [ ] Add production domain(s):
  - [ ] `your-app.vercel.app`
  - [ ] `your-custom-domain.com`
- [ ] Click "Add domain"

#### Deploy and Test
- [ ] Commit changes: `git add . && git commit -m "Configure Firebase"`
- [ ] Push to repository: `git push`
- [ ] Wait for deployment
- [ ] Visit production URL
- [ ] Test authentication
- [ ] Test chat functionality
- [ ] Test clear chats API

---

## 🎯 Quick Reference

### Firebase Console Links

Replace `YOUR_PROJECT_ID` with your actual project ID:

- **Main Console**: https://console.firebase.google.com/
- **Authentication**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication
- **Firestore**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
- **Settings**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general

### Environment Variables Template

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Test Commands

```bash
# Start development server
npm run dev

# Test clear chats API
node scripts/test-clear-chats.js YOUR_TOKEN

# Build for production
npm run build

# Deploy (Vercel)
vercel --prod
```

---

## ⚠️ Common Mistakes to Avoid

- [ ] ❌ Don't commit `.env` file to git
- [ ] ❌ Don't share service account key publicly
- [ ] ❌ Don't forget to restart dev server after changing `.env`
- [ ] ❌ Don't skip security rules configuration
- [ ] ❌ Don't forget to add production domain to authorized domains
- [ ] ❌ Don't use development Firebase config in production

---

## ✅ Success Criteria

You've successfully set up Firebase when:

- ✅ Users can sign up and log in
- ✅ Messages are saved to Firestore
- ✅ Data appears in Firebase Console
- ✅ Clear chats API works
- ✅ No console errors
- ✅ Production deployment works

---

## 📚 Full Documentation

For detailed instructions, see: [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)

---

## 🆘 Troubleshooting

### Authentication not working
→ Check API key and auth domain in `.env`

### Firestore permission denied
→ Check security rules in Firebase Console

### Clear chats API returns 401
→ Check service account key is set correctly

### Changes not reflecting
→ Restart development server

### More help needed?
→ See [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) Section 10: Troubleshooting

---

**Estimated Time**: 15-20 minutes

**Difficulty**: Beginner-friendly

**Last Updated**: November 2024
