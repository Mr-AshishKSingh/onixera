# Security Guide - Environment Variables

## Overview

Your sensitive API keys (Firebase credentials, Razorpay keys) have been moved to environment variables to prevent accidental exposure when pushing code to GitHub.

## Setup Instructions

### 1. Create `.env` file

After cloning the repository, create a `.env` file in the root directory with your actual keys:

```bash
cp .env.example .env
```

Then edit `.env` and replace placeholder values with your actual credentials:

```
VITE_FIREBASE_API_KEY=your_actual_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_RAZORPAY_KEY_ID=rzp_test_or_live_key
```

### 2. Important Security Notes

✅ **What's Protected:**
- `.env` file is in `.gitignore` and won't be committed to GitHub
- All sensitive keys are loaded at runtime via `js/config.js`
- Environment variables prevent hardcoding secrets in source code

⚠️ **Frontend Note:**
- Firebase API key is **meant to be public** and is used to identify your app
- **Secure your Firestore rules** to prevent unauthorized database access
- Never expose Firebase private keys or service accounts in frontend code

### 3. Local Development

When running locally:
- The `.env` file is loaded by your development environment
- Keys are injected into `config.js` and used throughout the app

### 4. Production Deployment (Netlify)

For Netlify deployment:

1. Go to **Site Settings → Build & Deploy → Environment**
2. Add your environment variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_RAZORPAY_KEY_ID`

3. Netlify will automatically inject these during build

### 5. Files Changed

- Created `.env` - Your local environment variables (not committed)
- Created `.env.example` - Template for developers
- Created `js/config.js` - Configuration loader
- Updated `js/firebase-config.js` - Uses config instead of hardcoded values
- Updated `js/main.js` - Uses config for Razorpay key
- Updated `.gitignore` - Added `.env` to prevent accidental commits

### 6. Verify Security

Run this command to ensure `.env` files are properly ignored:

```bash
git status
```

✅ You should **NOT** see `.env` in the output
✅ You should see `.env.example` (template file)

### 7. Common Issues

**Q: I see `.env` appearing in git status**
A: Run `git rm --cached .env` to remove it from git tracking

**Q: Keys are still showing in GitHub**
A: 
1. Use git-filter-repo to remove them from history: `git filter-repo --path .env --invert-paths`
2. Rotate your Firebase and Razorpay keys immediately
3. Check [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning) for exposed keys

**Q: Local development isn't loading keys**
A: Ensure `.env` file exists in the root directory and is properly formatted

## Additional Security Recommendations

1. **Firestore Rules**: Add proper authentication checks to your Firestore rules (not just public access)
2. **Razorpay**: Use test keys during development, switch to live keys only in production
3. **Key Rotation**: Periodically rotate your Firebase and Razorpay keys
4. **Monitoring**: Enable Firebase Security Alerts to monitor for suspicious activity
