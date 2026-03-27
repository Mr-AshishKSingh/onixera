import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const form = document.getElementById("employee-login-form");
const emailInput = document.getElementById("employee-email");
const passwordInput = document.getElementById("employee-password");
const statusEl = document.getElementById("employee-auth-status");

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.classList.remove("success", "error");
  if (type) {
    statusEl.classList.add(type);
  }
}

async function loginWithLocalCredentials(email, password) {
  const q = query(
    collection(db, "users"),
    where("role", "==", "employee"),
    where("email", "==", email),
    limit(1)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("No employee account found for this email.");
  }

  const profileDoc = snap.docs[0];
  const userData = profileDoc.data();
  if (!userData.loginPassword || userData.loginPassword !== password) {
    throw new Error("Invalid employee credentials.");
  }

  const sessionData = {
    uid: userData.uid || profileDoc.id,
    name: userData.name || email,
    email,
    role: "employee",
    signedInAt: new Date().toISOString()
  };

  localStorage.setItem("onixeraEmployeeSession", JSON.stringify(sessionData));
  localStorage.removeItem("onixeraManagerSession");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setStatus("Please enter email and password.", "error");
    return;
  }

  setStatus("Signing in...");

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, "users", result.user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().role !== "employee") {
      setStatus("This account is not registered as employee.", "error");
      return;
    }

    const userData = userSnap.data();
    const sessionData = {
      uid: result.user.uid,
      name: userData.name || result.user.email,
      email: result.user.email,
      role: "employee",
      signedInAt: new Date().toISOString()
    };

    localStorage.setItem("onixeraEmployeeSession", JSON.stringify(sessionData));
    localStorage.removeItem("onixeraManagerSession");

    setStatus("Login successful.", "success");
    window.location.href = "./employee-dashboard.html";
  } catch (error) {
    try {
      await loginWithLocalCredentials(email, password);
      setStatus("Login successful.", "success");
      window.location.href = "./employee-dashboard.html";
    } catch (fallbackError) {
      setStatus(fallbackError.message || error.message || error.code || "Login failed.", "error");
    }
  }
});
