import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const form = document.getElementById("manager-login-form");
const emailInput = document.getElementById("manager-email");
const passwordInput = document.getElementById("manager-password");
const statusEl = document.getElementById("manager-auth-status");

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.classList.remove("success", "error");
  if (type) {
    statusEl.classList.add(type);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setStatus("Please enter manager email and password.", "error");
    return;
  }

  setStatus("Signing in...");

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userSnap = await getDoc(doc(db, "users", result.user.uid));

    if (!userSnap.exists() || userSnap.data().role !== "manager") {
      setStatus("This account is not registered as manager.", "error");
      return;
    }

    const userData = userSnap.data();
    localStorage.setItem(
      "onixeraManagerSession",
      JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        name: userData.name || result.user.email,
        role: "manager",
        signedInAt: new Date().toISOString()
      })
    );

    localStorage.removeItem("onixeraEmployeeSession");
    setStatus("Login successful.", "success");
    window.location.href = "./manager-dashboard.html";
  } catch (error) {
    setStatus(error.message || error.code || "Login failed.", "error");
  }
});
