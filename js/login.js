import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { auth, googleProvider } from "./firebase-config.js";

const form = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const googleBtn = document.getElementById("google-login");
const createAccountBtn = document.getElementById("create-account");
const statusEl = document.getElementById("auth-status");

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.classList.remove("success", "error");
  if (type) {
    statusEl.classList.add(type);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setStatus("Please enter email and password.", "error");
    return;
  }

  setStatus("Signing in...");

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    setStatus(`Welcome, ${result.user.email}`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

googleBtn.addEventListener("click", async () => {
  setStatus("Connecting to Google...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    setStatus(`Signed in as ${result.user.displayName || result.user.email}`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

createAccountBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setStatus("Enter email and password first to create an account.", "error");
    return;
  }

  setStatus("Creating account...");

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    setStatus(`Account created for ${result.user.email}`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});
