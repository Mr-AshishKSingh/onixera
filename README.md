# Onixera Technologies Website

Professional, responsive company website for Onixera Technologies with:

- Service showcase for software development, digital marketing, and student support
- Contact form integrated with Firebase Firestore
- Login page integrated with Firebase Authentication (Email/Password + Google)
- Netlify-ready static deployment

## 1. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com.
2. Enable **Authentication**:
   - Email/Password provider
   - Google provider
3. Enable **Firestore Database** in production or test mode.
4. In Firestore, create rules for your needs. Example for testing:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leads/{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Open `js/firebase-config.js` and replace all placeholder values with your Firebase app config.

## 2. Run Locally

You can use any local static server. For example, with Python:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## 3. Deploy to Netlify

1. Push this folder to a GitHub repository.
2. In Netlify, choose **Add new site** > **Import an existing project**.
3. Select your repository.
4. Netlify auto-detects `netlify.toml`:
   - Publish directory: `.`
5. Deploy the site.

## 4. Optional Production Improvement

For stronger security, move Firebase config and data writes behind Netlify Functions/API and lock down Firestore rules with authentication checks.
