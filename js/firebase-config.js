import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-analytics.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAYjuraNFNgL12qxbrWLoGCokqEEyNLn8Y",
  authDomain: "onixera-952b6.firebaseapp.com",
  projectId: "onixera-952b6",
  storageBucket: "onixera-952b6.firebasestorage.app",
  messagingSenderId: "215096125933",
  appId: "1:215096125933:web:ffcfbd8c52f62dc3121fe4",
  measurementId: "G-XKQSZZZ4EX"
};

const app = initializeApp(firebaseConfig);

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (error) {
  // Analytics may be unavailable depending on environment.
  analytics = null;
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export { analytics };
