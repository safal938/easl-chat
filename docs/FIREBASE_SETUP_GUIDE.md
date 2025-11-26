# Firebase Setup Guide - Complete Walkthrough

This guide walks you through setting up a new Firebase project and connecting it to this EASL application.

---

## Table of Contents

1. [Create Firebase Project](#1-create-firebase-project)
2. [Enable Authentication](#2-enable-authentication)
3. [Create Firestore Database](#3-create-firestore-database)
4. [Get Firebase Configuration](#4-get-firebase-configuration)
5. [Update Environment Variables](#5-update-environment-variables)
6. [Set Up Firebase Admin SDK](#6-set-up-firebase-admin-sdk)
7. [Configure Security Rules](#7-configure-security-rules)
8. [Test the Connection](#8-test-the-connection)
9. [Deploy to Production](#9-deploy-to-production)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Create Firebase Project

### Step 1.1: Go to Firebase Console

1. Open your browser and go to: https://console.firebase.google.com/
2. Sign in with your Google account
3. Click **"Add project"** or **"Create a project"**

### Step 1.2: Configure Project

1. **Project name**: Enter a name (e.g., "EASL Board App")
2. Click **Continue**

3. **Google Analytics**: 
   - Choose whether to enable (recommended for production)
   - Click **Continue**

4. **Analytics account**: 
   - Select an existing account or create new
   - Click **Create project**

5. Wait for project creation (takes ~30 seconds)
6. Click **Continue** when ready

---

## 2. Enable Authentication

### Step 2.1: Navigate to Authentication

1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**

### Step 2.2: Enable Email/Password Authentication

1. Click on the **"Sign-in method"** tab
2. Click on **"Email/Password"**
3. Toggle **"Enable"** to ON
4. Click **"Save"**

### Step 2.3: (Optional) Enable Other Providers

If you want to support Google Sign-In, GitHub, etc.:

1. Click on the provider (e.g., "Google")
2. Toggle **"Enable"** to ON
3. Configure the provider settings
4. Click **"Save"**

---

## 3. Create Firestore Database

### Step 3.1: Navigate to Firestore

1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**

### Step 3.2: Choose Location

1. **Location**: Select a region close to your users
   - For US: `us-central1` or `us-east1`
   - For Europe: `europe-west1`
   - For Asia: `asia-southeast1`
   
   ⚠️ **Important**: Location cannot be changed later!

2. Click **"Next"**

### Step 3.3: Security Rules

1. Choose **"Start in production mode"** (we'll configure rules later)
2. Click **"Create"**
3. Wait for database creation (~30 seconds)

---

## 4. Get Firebase Configuration

### Step 4.1: Register Web App

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. **App nickname**: Enter a name (e.g., "EASL Web App")
6. **Firebase Hosting**: Leave unchecked (unless you want to use it)
7. Click **"Register app"**

### Step 4.2: Copy Configuration

You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD8ZvwC4vAmg-4-_zPJFlRe7xq_c8op8vY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "901836280064",
  appId: "1:901836280064:web:d49c4433300e8a85c4a3e5"
};
```

**Copy these values** - you'll need them in the next step!

8. Click **"Continue to console"**

---

## 5. Update Environment Variables

### Step 5.1: Update .env File

1. Open the `.env` file in your project root
2. Replace the Firebase configuration values:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY_HERE"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
```

### Step 5.2: Example .env File

Here's what your complete `.env` file should look like:

```bash
# External API Configuration
NEXT_PUBLIC_STATUS_API_URL="https://inference-local-guideline-16771232505.us-central1.run.app/health"
NEXT_PUBLIC_EXTERNAL_API_URL="https://inference-local-guideline-16771232505.us-central1.run.app/query/local-stream"
NEXT_PUBLIC_EXTERNAL_API_URL_FIX="https://inference-local-guideline-16771232505.us-central1.run.app/"

# Firebase Configuration (REPLACE THESE)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyD8ZvwC4vAmg-4-_zPJFlRe7xq_c8op8vY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="901836280064"
NEXT_PUBLIC_FIREBASE_APP_ID="1:901836280064:web:d49c4433300e8a85c4a3e5"

# Board App Configuration
NEXT_PUBLIC_BOARD_API_URL="https://board-v24problem.vercel.app"

# Firebase Admin SDK (Optional - for production)
# FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Step 5.3: Save the File

Save the `.env` file. The app will automatically pick up these changes.

---

## 6. Set Up Firebase Admin SDK

The Firebase Admin SDK is needed for server-side operations (like the clear chats API).

### Step 6.1: Generate Service Account Key

1. In Firebase Console, click the **gear icon** (⚙️) → **"Project settings"**
2. Click the **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** in the confirmation dialog
5. A JSON file will download - **keep this file secure!**

### Step 6.2: Add Service Account to Environment

**Option A: For Development (Local)**

1. Open the downloaded JSON file
2. Copy the entire contents
3. Add to your `.env` file:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

⚠️ **Important**: Keep this on ONE line, wrapped in single quotes!

**Option B: For Production (Vercel/Cloud)**

1. In your deployment platform (Vercel, etc.), add environment variable:
   - Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Value: Paste the entire JSON content

2. Or use Application Default Credentials (works in Cloud Run, Firebase Functions)
   - No need to set this variable
   - The app will automatically use default credentials

---

## 7. Configure Security Rules

### Step 7.1: Firestore Security Rules

1. In Firebase Console, go to **"Firestore Database"**
2. Click the **"Rules"** tab
3. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Chats - users can only access their own chats
      match /chats/{chatId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Messages - users can only access messages in their own chats
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

4. Click **"Publish"**

### Step 7.2: Storage Rules (Optional)

If you're using Firebase Storage:

1. Go to **"Storage"** in Firebase Console
2. Click the **"Rules"** tab
3. Configure as needed
4. Click **"Publish"**

---

## 8. Test the Connection

### Step 8.1: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Start it again
npm run dev
```

### Step 8.2: Test Authentication

1. Open your app: http://localhost:3000
2. Try to sign up with a new account
3. Check Firebase Console → Authentication → Users
4. You should see the new user listed

### Step 8.3: Test Firestore

1. Send a message in the chat
2. Check Firebase Console → Firestore Database
3. You should see:
   ```
   users/
     └── {userId}/
           └── chats/
                 └── {chatId}/
                       ├── (chat document)
                       └── messages/
                             └── {messageId}/
                                   └── (message document)
   ```

### Step 8.4: Test Clear Chats API

1. Create some chats via the board app iframe
2. Get your Firebase ID token:
   ```javascript
   // In browser console
   const auth = getAuth();
   const token = await auth.currentUser.getIdToken();
   console.log(token);
   ```

3. Test the API:
   ```bash
   node scripts/test-clear-chats.js YOUR_TOKEN_HERE
   ```

4. Should see:
   ```
   ✅ SUCCESS!
      Deleted X chat(s)
      Deleted Y message(s)
   ```

---

## 9. Deploy to Production

### Step 9.1: Update Production Environment Variables

**For Vercel:**

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add all the Firebase variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (paste entire JSON)

4. Click **"Save"**

**For Other Platforms:**

Follow your platform's documentation for setting environment variables.

### Step 9.2: Configure Authorized Domains

1. In Firebase Console, go to **"Authentication"** → **"Settings"** → **"Authorized domains"**
2. Add your production domain:
   - `your-app.vercel.app`
   - `your-custom-domain.com`
3. Click **"Add domain"**

### Step 9.3: Deploy

```bash
# Commit your changes
git add .
git commit -m "Configure Firebase"
git push

# Vercel will automatically deploy
# Or manually deploy:
vercel --prod
```

### Step 9.4: Test Production

1. Visit your production URL
2. Test authentication
3. Test chat functionality
4. Test clear chats API

---

## 10. Troubleshooting

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Solution**: Check that `NEXT_PUBLIC_FIREBASE_API_KEY` is correct in `.env`

### Issue: "Firebase: Error (auth/unauthorized-domain)"

**Solution**: Add your domain to Authorized domains in Firebase Console

### Issue: "Permission denied" when accessing Firestore

**Solution**: Check Firestore security rules. Make sure user is authenticated.

### Issue: Clear chats API returns 401

**Solution**: 
1. Check `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
2. Verify the service account has proper permissions
3. Try refreshing your ID token

### Issue: Changes not reflecting

**Solution**: 
1. Restart development server
2. Clear browser cache
3. Check `.env` file is in project root
4. Verify environment variables are loaded

---

## Quick Reference

### Firebase Console URLs

- **Main Console**: https://console.firebase.google.com/
- **Authentication**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication
- **Firestore**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
- **Project Settings**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general

### Required Environment Variables

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### Test Commands

```bash
# Start dev server
npm run dev

# Test clear chats API
node scripts/test-clear-chats.js YOUR_TOKEN

# Build for production
npm run build
```

---

## Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Web app registered in Firebase
- [ ] Firebase configuration copied
- [ ] `.env` file updated with Firebase config
- [ ] Service account key generated
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` added to `.env`
- [ ] Firestore security rules configured
- [ ] Development server restarted
- [ ] Authentication tested (sign up/login works)
- [ ] Firestore tested (messages saved)
- [ ] Clear chats API tested
- [ ] Production environment variables configured
- [ ] Authorized domains added
- [ ] Production deployment tested

---

## Next Steps

After completing this setup:

1. **Test thoroughly** in development
2. **Configure board app** to use the new Firebase project
3. **Deploy to production** and test again
4. **Monitor** Firebase Console for usage and errors
5. **Set up billing** if needed (Firebase has generous free tier)

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#10-troubleshooting) section
2. Review Firebase Console for error messages
3. Check browser console for client-side errors
4. Check server logs for API errors
5. Consult Firebase documentation: https://firebase.google.com/docs

---

**Last Updated**: November 2024
