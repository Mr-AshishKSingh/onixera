import { config } from "./config.js";
import { displayOfferLetterPreview } from "./offer-letter-generator.js";

const yearEl = document.getElementById("year");
const leadForm = document.getElementById("lead-form");
const statusEl = document.getElementById("form-status");
const jobApplicationForm = document.getElementById("job-application-form");
const jobApplicationStatusEl = document.getElementById("job-application-status");
const introGate = document.getElementById("intro-gate");
const introEnterBtn = document.getElementById("intro-enter");
const openOfferLetterModalBtn = document.getElementById("open-offer-letter-modal");
const offerLetterModal = document.getElementById("offer-letter-modal");
const closeOfferLetterModalBtn = document.getElementById("close-offer-letter-modal");
const offerLetterBackdrop = document.getElementById("offer-letter-backdrop");
const offerLetterForm = document.getElementById("offer-letter-form");
const offerLetterStatusEl = document.getElementById("offer-letter-status");

// Razorpay key loaded from config.js (which reads from environment variables)
const RAZORPAY_KEY_ID = config.razorpay.keyId;

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (introGate) {
  document.body.classList.add("intro-locked");

  let hasOpened = false;
  let autoOpenTimer = 0;

  const openIntro = () => {
    if (hasOpened || document.body.classList.contains("intro-open")) {
      return;
    }

    hasOpened = true;
    window.clearTimeout(autoOpenTimer);

    document.body.classList.remove("intro-locked");
    document.body.classList.add("intro-open");
    introGate.setAttribute("aria-hidden", "true");

    window.removeEventListener("wheel", onWheel);
    document.removeEventListener("wheel", onWheel, true);
    introGate.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchstart", onTouchStart, true);
    document.removeEventListener("touchmove", onTouchMove, true);
    introGate.removeEventListener("touchstart", onTouchStart);
    introGate.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keydown", onKeyDown, true);
    introEnterBtn?.removeEventListener("click", openIntro);

    window.setTimeout(() => {
      introGate.remove();
    }, 1000);
  };

  const onWheel = (event) => {
    // Trackpads can emit small deltas; any downward wheel intent should open.
    if (event.deltaY <= 0 && event.deltaX === 0) {
      return;
    }
    event.preventDefault();
    openIntro();
  };

  let touchStartY = 0;
  const onTouchStart = (event) => {
    touchStartY = event.touches[0]?.clientY || 0;
  };

  const onTouchMove = (event) => {
    const currentY = event.touches[0]?.clientY || 0;
    if (touchStartY - currentY > 24) {
      event.preventDefault();
      openIntro();
    }
  };

  const onKeyDown = (event) => {
    const openerKeys = ["ArrowDown", "PageDown", " ", "Enter"];
    if (!openerKeys.includes(event.key)) {
      return;
    }
    event.preventDefault();
    openIntro();
  };

  introGate.addEventListener("click", openIntro);
  introEnterBtn?.addEventListener("click", openIntro);
  window.addEventListener("wheel", onWheel, { passive: false });
  document.addEventListener("wheel", onWheel, { passive: false, capture: true });
  introGate.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
  document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
  introGate.addEventListener("touchstart", onTouchStart, { passive: true });
  introGate.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  document.addEventListener("keydown", onKeyDown, true);

  // Fallback: never leave users stuck behind the intro gate.
  autoOpenTimer = window.setTimeout(openIntro, 5000);
}

function setStatus(text, type) {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = text;
  statusEl.classList.remove("success", "error");
  if (type) {
    statusEl.classList.add(type);
  }
}

function setJobApplicationStatus(text, type) {
  if (!jobApplicationStatusEl) {
    return;
  }

  jobApplicationStatusEl.textContent = text;
  jobApplicationStatusEl.classList.remove("success", "error");
  if (type) {
    jobApplicationStatusEl.classList.add(type);
  }
}

function setOfferLetterStatus(text, type) {
  if (!offerLetterStatusEl) {
    return;
  }

  offerLetterStatusEl.textContent = text;
  offerLetterStatusEl.classList.remove("success", "error");
  if (type) {
    offerLetterStatusEl.classList.add(type);
  }
}

function getFirebaseErrorCode(error) {
  if (!error || typeof error !== "object") {
    return "";
  }
  const code = error.code || "";
  return typeof code === "string" ? code.replace(/^firebase\//, "") : "";
}

function getPublicFormErrorMessage(error, fallbackMessage) {
  const code = getFirebaseErrorCode(error);

  if (code === "permission-denied") {
    return "Submission is temporarily unavailable. Please try again shortly.";
  }

  if (code === "network-request-failed" || code === "unavailable" || code === "deadline-exceeded") {
    return "Network issue detected. Please check your internet connection and try again.";
  }

  return fallbackMessage;
}

async function ensurePublicFormAuth(auth, signInAnonymously) {
  if (!auth || !signInAnonymously || auth.currentUser) {
    return;
  }

  try {
    await signInAnonymously(auth);
  } catch (error) {
    const code = getFirebaseErrorCode(error);

    if (code === "operation-not-allowed") {
      // Keep forms usable if Firestore rules allow public writes without auth.
      console.warn("Anonymous auth is disabled in Firebase Auth.");
      return;
    }

    console.warn("Anonymous auth setup failed:", error);
  }
}

function openOfferLetterModal() {
  if (!offerLetterModal) {
    return;
  }

  offerLetterModal.hidden = false;
  offerLetterModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeOfferLetterModal() {
  if (!offerLetterModal) {
    return;
  }

  offerLetterModal.hidden = true;
  offerLetterModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  setOfferLetterStatus("", "");
}

function formatDateForLetter(dateInputValue) {
  const date = new Date(`${dateInputValue}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function buildOfferLetterHtml(details, paymentId) {
  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offer Letter - ${details.name}</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; color: #1f2937; margin: 0; background: #f7f4ee; }
      .sheet { width: min(860px, 92vw); margin: 2rem auto; background: #fff; border: 1px solid #d9d2c8; border-radius: 10px; padding: 2rem; }
      .head { border-bottom: 2px solid #0f5c56; padding-bottom: 0.9rem; margin-bottom: 1.2rem; }
      h1 { margin: 0; font-size: 1.7rem; color: #0b4743; }
      .meta { color: #4b5563; font-size: 0.95rem; }
      p { line-height: 1.7; }
      .fields { margin: 1rem 0; padding: 0.9rem 1rem; background: #f8fafc; border-left: 4px solid #0f5c56; }
      .sign { margin-top: 2.2rem; }
      .pay { margin-top: 1.4rem; font-size: 0.87rem; color: #4b5563; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="head">
        <h1>Onixera Technologies</h1>
        <p class="meta">Internship Offer Letter</p>
      </div>

      <p>Date: ${generatedOn}</p>
      <p><strong>To,</strong><br/>${details.name}</p>

      <p>We are pleased to offer you an internship opportunity with <strong>Onixera Technologies</strong>.</p>

      <div class="fields">
        <p><strong>Internship Domain:</strong> ${details.domain}</p>
        <p><strong>Internship Duration:</strong> ${details.duration}</p>
        <p><strong>Start Date:</strong> ${details.startDateFormatted}</p>
        <p><strong>End Date:</strong> ${details.endDateFormatted}</p>
      </div>

      <p>During this period, you are expected to maintain professional conduct and actively participate in assigned tasks and learning activities.</p>
      <p>We look forward to your contribution and wish you a great learning experience with us.</p>

      <div class="sign">
        <p>Sincerely,</p>
        <p><strong>HR Team</strong><br/>Onixera Technologies</p>
      </div>

      <p class="pay">Payment Reference: ${paymentId}</p>
    </div>
  </body>
</html>`;
}

function downloadOfferLetter(details, paymentId) {
  const letterHtml = buildOfferLetterHtml(details, paymentId);
  const blob = new Blob([letterHtml], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `offer-letter-${details.name.toLowerCase().replace(/\s+/g, "-")}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);

  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.document.open();
    previewWindow.document.write(letterHtml);
    previewWindow.document.close();
  }
}

function initOfferLetterFlow() {
  if (!offerLetterModal) {
    return;
  }

  if (openOfferLetterModalBtn) {
    openOfferLetterModalBtn.addEventListener("click", openOfferLetterModal);
  }
  closeOfferLetterModalBtn?.addEventListener("click", closeOfferLetterModal);
  offerLetterBackdrop?.addEventListener("click", closeOfferLetterModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !offerLetterModal.hidden) {
      closeOfferLetterModal();
    }
  });

  if (!offerLetterForm) {
    return;
  }

  offerLetterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(offerLetterForm);
    const name = (formData.get("offerName") || "").toString().trim();
    const domain = (formData.get("offerDomain") || "").toString().trim();
    const duration = (formData.get("offerDuration") || "").toString().trim();
    const startDate = (formData.get("offerStartDate") || "").toString().trim();
    const endDate = (formData.get("offerEndDate") || "").toString().trim();

    if (!name || !domain || !duration || !startDate || !endDate) {
      setOfferLetterStatus("Please complete all details first.", "error");
      return;
    }

    if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
      setOfferLetterStatus("End date must be after start date.", "error");
      return;
    }

    if (typeof window.Razorpay === "undefined") {
      setOfferLetterStatus("Payment service did not load. Please refresh and try again.", "error");
      return;
    }

    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === "rzp_test_YourKeyHere") {
      setOfferLetterStatus("Please configure your Razorpay key in main.js before accepting payments.", "error");
      return;
    }

    setOfferLetterStatus("Opening payment gateway...", "");

    const details = {
      name,
      domain,
      duration,
      startDate,
      endDate,
      startDateFormatted: formatDateForLetter(startDate),
      endDateFormatted: formatDateForLetter(endDate)
    };

    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: 100,
      currency: "INR",
      name: "Onixera Technologies",
      description: "Internship Offer Letter Fee",
      notes: {
        candidateName: details.name,
        internshipDomain: details.domain
      },
      prefill: {
        name: details.name
      },
      handler: (response) => {
        const paymentId = response?.razorpay_payment_id || `PAY-${Date.now()}`;
        // Display personalized offer letter with new generator
        displayOfferLetterPreview({
          name: details.name,
          domain: details.domain,
          duration: details.duration
        });
        setOfferLetterStatus("Payment successful! Your offer letter is ready.", "success");
        offerLetterForm.reset();
      },
      modal: {
        ondismiss: () => {
          setOfferLetterStatus("Payment cancelled.", "error");
        }
      },
      theme: {
        color: "#0f5c56"
      }
    });

    rzp.on("payment.failed", () => {
      setOfferLetterStatus("Payment failed. Please try again.", "error");
    });

    rzp.open();
  });
}

async function initLeadForm() {
  if (!leadForm) {
    return;
  }

  let addDoc;
  let collection;
  let serverTimestamp;
  let db;
  let auth;
  let signInAnonymously;

  try {
    const firestoreModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"
    );
    const authModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js"
    );
    const firebaseConfigModule = await import("./firebase-config.js");

    addDoc = firestoreModule.addDoc;
    collection = firestoreModule.collection;
    serverTimestamp = firestoreModule.serverTimestamp;
    db = firebaseConfigModule.db;
    auth = firebaseConfigModule.auth;
    signInAnonymously = authModule.signInAnonymously;

    await ensurePublicFormAuth(auth, signInAnonymously);
  } catch (error) {
    console.error("Firebase modules failed to load:", error);
  }

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!addDoc || !collection || !serverTimestamp || !db) {
      setStatus("Form service is currently unavailable. Please try again later.", "error");
      return;
    }

    const formData = new FormData(leadForm);
    const payload = {
      name: (formData.get("name") || "").toString().trim(),
      email: (formData.get("email") || "").toString().trim(),
      service: (formData.get("service") || "").toString().trim(),
      message: (formData.get("message") || "").toString().trim(),
      createdAt: serverTimestamp()
    };

    if (!payload.name || !payload.email || !payload.service || !payload.message) {
      setStatus("Please complete all fields before submitting.", "error");
      return;
    }

    setStatus("Submitting your request...");

    try {
      await addDoc(collection(db, "leads"), payload);
      leadForm.reset();
      setStatus("Thanks! Your request has been submitted successfully.", "success");
    } catch (error) {
      const message = getPublicFormErrorMessage(
        error,
        "Could not submit right now. Please try again in a moment."
      );
      setStatus(message, "error");
      console.error(error);

      if (getFirebaseErrorCode(error) === "permission-denied") {
        await ensurePublicFormAuth(auth, signInAnonymously);
      }
    }
  });
}

async function initJobApplicationForm() {
  if (!jobApplicationForm) {
    return;
  }

  let addDoc;
  let collection;
  let serverTimestamp;
  let db;
  let auth;
  let signInAnonymously;

  try {
    const firestoreModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"
    );
    const authModule = await import(
      "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js"
    );
    const firebaseConfigModule = await import("./firebase-config.js");

    addDoc = firestoreModule.addDoc;
    collection = firestoreModule.collection;
    serverTimestamp = firestoreModule.serverTimestamp;
    db = firebaseConfigModule.db;
    auth = firebaseConfigModule.auth;
    signInAnonymously = authModule.signInAnonymously;

    await ensurePublicFormAuth(auth, signInAnonymously);
  } catch (error) {
    console.error("Firebase modules failed to load for jobs:", error);
  }

  jobApplicationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!addDoc || !collection || !serverTimestamp || !db) {
      setJobApplicationStatus("Application service is currently unavailable. Please try again later.", "error");
      return;
    }

    const formData = new FormData(jobApplicationForm);
    const payload = {
      name: (formData.get("jobName") || "").toString().trim(),
      email: (formData.get("jobEmail") || "").toString().trim().toLowerCase(),
      phone: (formData.get("jobPhone") || "").toString().trim(),
      role: (formData.get("jobRole") || "").toString().trim(),
      experience: (formData.get("jobExperience") || "").toString().trim(),
      resumeLink: (formData.get("jobResumeLink") || "").toString().trim(),
      referralCode: (formData.get("jobReferralCode") || "").toString().trim(),
      status: "new",
      source: "website",
      createdAt: serverTimestamp()
    };

    if (
      !payload.name ||
      !payload.email ||
      !payload.phone ||
      !payload.role ||
      !payload.experience ||
      !payload.resumeLink
    ) {
      setJobApplicationStatus("Please complete all fields before applying.", "error");
      return;
    }

    try {
      // Basic URL validation to avoid invalid resume links.
      new URL(payload.resumeLink);
    } catch {
      setJobApplicationStatus("Please provide a valid resume link URL.", "error");
      return;
    }

    setJobApplicationStatus("Submitting your application...");

    try {
      await addDoc(collection(db, "jobApplications"), payload);
      jobApplicationForm.reset();
      setJobApplicationStatus("Application submitted successfully. Our team will contact you soon.", "success");
    } catch (error) {
      console.error(error);
      const message = getPublicFormErrorMessage(
        error,
        "Could not submit right now. Please try again in a moment."
      );
      setJobApplicationStatus(message, "error");

      if (getFirebaseErrorCode(error) === "permission-denied") {
        await ensurePublicFormAuth(auth, signInAnonymously);
      }
    }
  });
}

initLeadForm();
initJobApplicationForm();
initOfferLetterFlow();
