/**
 * Environment Configuration Loader
 * This loads configuration from environment variables.
 * For browser environments without a build tool, use the fallback approach.
 */

// Function to get environment variable with fallback
function getEnvVar(key, fallback = '') {
  // Try to get from import.meta.env (Vite)
  try {
    if (import.meta?.env?.[key]) {
      return import.meta.env[key];
    }
  } catch (e) {
    // import.meta not available or not Vite environment
  }
  
  // Try to get from window.__CONFIG__ (injected at runtime)
  if (typeof window !== 'undefined' && window.__CONFIG__ && window.__CONFIG__[key]) {
    return window.__CONFIG__[key];
  }
  
  // Return fallback
  return fallback;
}

export const config = {
  firebase: {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'AIzaSyAYjuraNFNgL12qxbrWLoGCokqEEyNLn8Y'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'onixera-952b6.firebaseapp.com'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'onixera-952b6'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'onixera-952b6.firebasestorage.app'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '215096125933'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', '1:215096125933:web:ffcfbd8c52f62dc3121fe4'),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', 'G-XKQSZZZ4EX')
  },
  razorpay: {
    keyId: getEnvVar('VITE_RAZORPAY_KEY_ID', 'rzp_test_YourKeyHere')
  }
};

export default config;
