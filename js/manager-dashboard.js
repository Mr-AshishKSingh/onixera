import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { db, firebaseConfig } from "./firebase-config.js";

const managerSessionRaw = localStorage.getItem("onixeraManagerSession");
const managerNameEl = document.getElementById("manager-name");
const managerLogoutBtn = document.getElementById("manager-logout");
const employeeSelect = document.getElementById("manager-employee-select");
const managerSelectedEmployeeEl = document.getElementById("manager-selected-employee");
const managerOptionButtons = Array.from(document.querySelectorAll(".manager-option-btn"));
const managerModules = Array.from(document.querySelectorAll(".manager-module"));
const managerOptionsNoteEl = document.getElementById("manager-options-note");

const attendanceCalendarEl = document.getElementById("manager-attendance-calendar");
const attendanceMonthLabelEl = document.getElementById("attendance-month-label");
const prevAttendanceMonthBtn = document.getElementById("attendance-prev-month");
const nextAttendanceMonthBtn = document.getElementById("attendance-next-month");
const attendanceSelectedDateEl = document.getElementById("attendance-selected-date");
const attendanceDayStatusEl = document.getElementById("attendance-day-status");
const attendanceDayCheckinEl = document.getElementById("attendance-day-checkin");
const applyDayAttendanceBtn = document.getElementById("apply-day-attendance");
const saveAttendanceBtn = document.getElementById("save-attendance");
const managerStatusEl = document.getElementById("manager-status");

const alertForm = document.getElementById("manager-alert-form");
const alertTitleInput = document.getElementById("alert-title");
const alertMessageInput = document.getElementById("alert-message");
const alertPriorityInput = document.getElementById("alert-priority");
const alertStatusEl = document.getElementById("alert-status");
const managerAlertList = document.getElementById("manager-alert-list");
const personalMsgForm = document.getElementById("manager-personal-msg-form");
const personalMsgEmployeeInput = document.getElementById("personal-msg-employee");
const personalMsgTitleInput = document.getElementById("personal-msg-title");
const personalMsgContentInput = document.getElementById("personal-msg-content");
const personalMsgPriorityInput = document.getElementById("personal-msg-priority");
const personalMsgStatusEl = document.getElementById("personal-msg-status");
const managerPersonalMsgList = document.getElementById("manager-personal-msg-list");

const employeeForm = document.getElementById("manager-employee-form");
const editEmployeeNameInput = document.getElementById("edit-employee-name");
const editEmployeeIdInput = document.getElementById("edit-employee-id");
const editEmployeeDepartmentInput = document.getElementById("edit-employee-department");
const editEmployeeDomainInput = document.getElementById("edit-employee-domain");
const editEmployeeSalaryInput = document.getElementById("edit-employee-salary");
const editEmployeeJoinedInput = document.getElementById("edit-employee-joined");
const employeeProfileStatusEl = document.getElementById("employee-profile-status");

const createEmployeeForm = document.getElementById("manager-create-employee-form");
const createEmployeeNameInput = document.getElementById("create-employee-name");
const createEmployeeEmailInput = document.getElementById("create-employee-email");
const createEmployeePasswordInput = document.getElementById("create-employee-password");
const createEmployeeIdInput = document.getElementById("create-employee-id");
const createEmployeeJoinedInput = document.getElementById("create-employee-joined");
const createEmployeeSalaryInput = document.getElementById("create-employee-salary");
const createEmployeeDomainInput = document.getElementById("create-employee-domain");
const createEmployeeDepartmentInput = document.getElementById("create-employee-department");
const createEmployeeStatusEl = document.getElementById("create-employee-status");

const managerTaskForm = document.getElementById("manager-task-form");
const managerTasksBody = document.getElementById("manager-tasks-body");
const saveManagerTasksBtn = document.getElementById("save-manager-tasks");
const taskTitleInput = document.getElementById("task-title");
const taskAssignedDateInput = document.getElementById("task-assigned-date");
const taskDueDateInput = document.getElementById("task-due-date");
const taskAssignStatusEl = document.getElementById("task-assign-status");

// Debug: Log form element availability
console.log("Form elements loaded:", {
  createEmployeeForm: !!createEmployeeForm,
  createEmployeeStatusEl: !!createEmployeeStatusEl,
  createEmployeeNameInput: !!createEmployeeNameInput,
  createEmployeeEmailInput: !!createEmployeeEmailInput,
  createEmployeePasswordInput: !!createEmployeePasswordInput,
  createEmployeeSalaryInput: !!createEmployeeSalaryInput
});

if (!managerSessionRaw) {
  window.location.href = "./manager-login.html";
}

const managerSession = managerSessionRaw ? JSON.parse(managerSessionRaw) : null;
if (managerSession && managerNameEl) {
  managerNameEl.textContent = managerSession.name || "Manager";
}

let employees = [];
let draftAttendance = {};
let draftTasks = [];
let selectedAttendanceDates = new Set();
let attendanceMonthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let managerAlertsState = [];
let managerPersonalMessagesState = [];

function activateManagerModule(targetId) {
  managerModules.forEach((moduleEl) => {
    const isActive = moduleEl.id === targetId && Boolean(targetId);
    moduleEl.classList.toggle("is-active", isActive);
    moduleEl.hidden = !isActive;
  });

  managerOptionButtons.forEach((button) => {
    const isActive = button.getAttribute("data-target") === targetId;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  if (managerOptionsNoteEl) {
    managerOptionsNoteEl.style.display = targetId ? "none" : "block";
  }
}

function toEmployeeDocKey(value) {
  return String(value || "").trim().toLowerCase();
}

function setSelectedEmployeeLabel(email) {
  if (!managerSelectedEmployeeEl) {
    return;
  }

  if (!email) {
    managerSelectedEmployeeEl.textContent = "No employee selected";
    return;
  }

  const selected = employees.find((item) => item.email === email);
  managerSelectedEmployeeEl.textContent = selected ? `${selected.name} (${selected.email})` : email;
}

function setStatus(text, type) {
  managerStatusEl.textContent = text;
  managerStatusEl.classList.remove("success", "error");
  if (type) {
    managerStatusEl.classList.add(type);
  }
}

function setAlertStatus(text, type) {
  alertStatusEl.textContent = text;
  alertStatusEl.classList.remove("success", "error");
  if (type) {
    alertStatusEl.classList.add(type);
  }
}

function setPersonalMsgStatus(text, type) {
  if (!personalMsgStatusEl) {
    return;
  }

  personalMsgStatusEl.textContent = text;
  personalMsgStatusEl.classList.remove("success", "error");
  if (type) {
    personalMsgStatusEl.classList.add(type);
  }
}

function setEmployeeProfileStatus(text, type) {
  employeeProfileStatusEl.textContent = text;
  employeeProfileStatusEl.classList.remove("success", "error");
  if (type) {
    employeeProfileStatusEl.classList.add(type);
  }
}

function setTaskAssignStatus(text, type) {
  taskAssignStatusEl.textContent = text;
  taskAssignStatusEl.classList.remove("success", "error");
  if (type) {
    taskAssignStatusEl.classList.add(type);
  }
}

function setCreateEmployeeStatus(text, type) {
  if (createEmployeeStatusEl) {
    createEmployeeStatusEl.textContent = text;
    createEmployeeStatusEl.classList.remove("success", "error");
    if (type) {
      createEmployeeStatusEl.classList.add(type);
    }
    console.log("Employee status:", text, type);
  } else {
    console.error("Create employee status element not found");
  }
}

function parseSalary(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Number(parsed.toFixed(2));
}

function mapSignupError(errorCode) {
  switch (errorCode) {
    case "EMAIL_EXISTS":
      return "This email is already registered.";
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    case "WEAK_PASSWORD : Password should be at least 6 characters":
    case "WEAK_PASSWORD":
      return "Password must be at least 6 characters.";
    case "OPERATION_NOT_ALLOWED":
      return "Email/Password sign-in is disabled in Firebase Authentication.";
    case "API_KEY_HTTP_REFERRER_BLOCKED":
      return "Firebase API key is restricted for this localhost domain.";
    case "PROJECT_NOT_FOUND":
      return "Firebase project was not found for this API key.";
    case "INVALID_API_KEY":
      return "Firebase API key is invalid.";
    default:
      return `Could not create auth user (${errorCode || "unknown error"}).`;
  }
}

async function createEmployeeAuthAccount(email, password) {
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: false
    })
  });

  const result = await response.json();
  if (!response.ok) {
    const errorCode = result?.error?.message;
    throw new Error(mapSignupError(errorCode));
  }

  return result.localId;
}

function formatWhen(value) {
  if (!value) {
    return "Just now";
  }
  try {
    return new Date(value).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "Just now";
  }
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInput(timeText) {
  const match = String(timeText).match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) {
    return "";
  }
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();

  if (period === "PM" && hour < 12) {
    hour += 12;
  }
  if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function toDisplayTime(value) {
  if (!value) {
    return "--";
  }

  const [hourText, minute] = value.split(":");
  let hour = Number(hourText);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
}

function formatDateForInput(value) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return toDateKey(parsed);
}

function getRecordForDate(dateKey) {
  return draftAttendance[dateKey] || { status: "Pending", checkIn: "--" };
}

function renderAttendanceCalendar() {
  attendanceCalendarEl.innerHTML = "";

  const monthStart = new Date(attendanceMonthCursor.getFullYear(), attendanceMonthCursor.getMonth(), 1);
  const monthEnd = new Date(attendanceMonthCursor.getFullYear(), attendanceMonthCursor.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const totalDays = monthEnd.getDate();

  attendanceMonthLabelEl.textContent = monthStart.toLocaleString([], { month: "long", year: "numeric" });

  const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  headers.forEach((label) => {
    const head = document.createElement("div");
    head.className = "calendar-head";
    head.textContent = label;
    attendanceCalendarEl.appendChild(head);
  });

  for (let i = 0; i < startWeekday; i += 1) {
    const blank = document.createElement("div");
    blank.className = "calendar-cell calendar-cell-empty";
    attendanceCalendarEl.appendChild(blank);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const dateKey = toDateKey(date);
    const record = getRecordForDate(dateKey);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = `calendar-cell calendar-status-${String(record.status || "Pending").toLowerCase().replace(/\s+/g, "-")}`;
    if (selectedAttendanceDates.has(dateKey)) {
      cell.classList.add("calendar-cell-selected");
    }
  cell.setAttribute("data-date-key", dateKey);
    cell.innerHTML = `
      <span class="calendar-day">${day}</span>
      <span class="calendar-state">${record.status || "Pending"}</span>
      <span class="calendar-time">${record.checkIn || "--"}</span>
    `;
    attendanceCalendarEl.appendChild(cell);
  }
}

function renderManagerAlerts(updates) {
  managerAlertsState = updates;
  managerAlertList.innerHTML = "";

  if (!updates.length) {
    const empty = document.createElement("p");
    empty.className = "update-detail";
    empty.textContent = "No alerts published yet.";
    managerAlertList.appendChild(empty);
    return;
  }

  updates.forEach((item) => {
    const card = document.createElement("article");
    card.className = "manager-alert-item";
    card.innerHTML = `
      <div class="manager-alert-head">
        <p class="manager-alert-title">${item.title}</p>
        <span class="manager-alert-priority ${item.priority}">${item.priority}</span>
      </div>
      <p class="manager-alert-message">${item.message}</p>
      <p class="manager-alert-meta">Posted ${formatWhen(item.createdAt)} by ${item.createdBy || "Manager"}</p>
      <div class="manager-card-actions">
        <button type="button" class="btn btn-outline manager-action-btn" data-action="edit-alert" data-id="${item.id}">Edit</button>
        <button type="button" class="btn btn-ghost manager-action-btn danger" data-action="delete-alert" data-id="${item.id}">Delete</button>
      </div>
    `;
    managerAlertList.appendChild(card);
  });
}

function renderManagerPersonalMessages(messages) {
  if (!managerPersonalMsgList) {
    return;
  }

  managerPersonalMsgList.innerHTML = "";

  if (!messages.length) {
    const empty = document.createElement("p");
    empty.className = "update-detail";
    empty.textContent = "No personal messages sent yet.";
    managerPersonalMsgList.appendChild(empty);
    return;
  }

  managerPersonalMessagesState = messages;
  messages.forEach((item) => {
    const card = document.createElement("article");
    card.className = "manager-alert-item";
    card.innerHTML = `
      <div class="manager-alert-head">
        <p class="manager-alert-title">${item.title}</p>
        <span class="manager-alert-priority ${item.priority}">${item.priority}</span>
      </div>
      <p class="update-date">To: ${item.recipientEmail}</p>
      <p class="manager-alert-message">${item.message}</p>
      <p class="manager-alert-meta">Sent ${formatWhen(item.createdAt)} by ${item.createdBy || "Manager"}</p>
      <div class="manager-card-actions">
        <button type="button" class="btn btn-outline manager-action-btn" data-action="edit-personal" data-id="${item.id}">Edit</button>
        <button type="button" class="btn btn-ghost manager-action-btn danger" data-action="delete-personal" data-id="${item.id}">Delete</button>
      </div>
    `;
    managerPersonalMsgList.appendChild(card);
  });
}

function getTaskStatusClass(status) {
  return `status-${String(status || "Pending").toLowerCase().replace(/\s+/g, "-")}`;
}

function applyManagerTaskStatusClasses(selectEl, status) {
  if (!(selectEl instanceof HTMLSelectElement)) {
    return;
  }

  const knownClasses = ["status-pending", "status-in-progress", "status-done"];
  selectEl.classList.remove(...knownClasses);

  const statusClass = getTaskStatusClass(status);
  selectEl.classList.add(statusClass);

  const row = selectEl.closest("tr");
  if (row) {
    row.classList.remove(...knownClasses);
    row.classList.add(statusClass);
  }
}

function renderManagerTasks() {
  managerTasksBody.innerHTML = "";

  if (!draftTasks.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="6">No tasks assigned for selected employee.</td>';
    managerTasksBody.appendChild(row);
    return;
  }

  draftTasks.forEach((task) => {
    const statusClass = getTaskStatusClass(task.status);
    const row = document.createElement("tr");
    row.className = `manager-task-row ${statusClass}`;
    row.innerHTML = `
      <td>${task.title}</td>
      <td>${task.assignedDate}</td>
      <td>${task.dueDate}</td>
      <td>
        <select class="manager-task-status ${statusClass}" data-id="${task.id}">
          <option value="Pending" ${task.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Done" ${task.status === "Done" ? "selected" : ""}>Done</option>
        </select>
      </td>
      <td>${task.updatedAt || "--"}</td>
      <td>
        <div class="manager-task-actions">
          <button type="button" class="btn btn-outline manager-task-edit" data-id="${task.id}">Edit</button>
          <button type="button" class="btn btn-ghost manager-task-delete" data-id="${task.id}">Delete</button>
        </div>
      </td>
    `;
    managerTasksBody.appendChild(row);

    const statusSelect = row.querySelector(".manager-task-status");
    applyManagerTaskStatusClasses(statusSelect, task.status);
  });
}

function listenManagerAlerts() {
  const alertsQuery = query(collection(db, "companyUpdates"), orderBy("createdAt", "desc"), limit(8));

  onSnapshot(
    alertsQuery,
    (snapshot) => {
      const updates = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          title: data.title || "Alert",
          message: data.message || "",
          priority: data.priority || "normal",
          createdBy: data.createdBy || "Manager",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
        };
      });
      renderManagerAlerts(updates);
    },
    (error) => {
      console.error("Could not load manager alerts:", error);
      setAlertStatus("Could not load alerts. Check Firestore rules.", "error");
    }
  );
}

function listenManagerPersonalMessages() {
  if (!managerPersonalMsgList) {
    return;
  }

  const personalQuery = query(collection(db, "personalNotifications"), orderBy("createdAt", "desc"), limit(10));

  onSnapshot(
    personalQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          recipientEmail: data.recipientEmail || "--",
          title: data.title || "Message",
          message: data.message || "",
          priority: data.priority || "normal",
          createdBy: data.createdBy || "Manager",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null
        };
      });

      renderManagerPersonalMessages(messages);
    },
    (error) => {
      console.error("Could not load personal messages:", error);
      setPersonalMsgStatus("Could not load sent messages.", "error");
    }
  );
}

function populatePersonalMessageEmployeeSelect() {
  if (!personalMsgEmployeeInput) {
    return;
  }

  personalMsgEmployeeInput.innerHTML = '<option value="">Choose an employee...</option>';

  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.email;
    option.textContent = `${employee.name} (${employee.email})`;
    personalMsgEmployeeInput.appendChild(option);
  });
}

async function loadEmployees() {
  try {
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    const snap = await getDocs(q);
    employees = snap.docs.map((item) => {
      const data = item.data();
      return {
        uid: data.uid || item.id,
        name: data.name || data.email,
        email: toEmployeeDocKey(data.email)
      };
    });
  } catch (error) {
    console.error("Could not fetch employees:", error);
    employees = [];
  }

  employeeSelect.innerHTML = "";

  if (!employees.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No employee users found";
    employeeSelect.appendChild(option);
    setSelectedEmployeeLabel("");
    return;
  }

  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.email;
    option.textContent = `${employee.name} (${employee.email})`;
    employeeSelect.appendChild(option);
  });

  const currentValue = employeeSelect.value;
  const exists = employees.some((employee) => employee.email === currentValue);
  if (!exists) {
    employeeSelect.value = employees[0].email;
  }

  populatePersonalMessageEmployeeSelect();
  setSelectedEmployeeLabel(employeeSelect.value);
}

async function loadSelectedEmployeeProfile(email) {
  const selected = employees.find((item) => item.email === email);
  if (!selected?.uid) {
    editEmployeeNameInput.value = "";
    editEmployeeIdInput.value = "";
    editEmployeeDepartmentInput.value = "";
    editEmployeeDomainInput.value = "";
    editEmployeeSalaryInput.value = "";
    editEmployeeJoinedInput.value = "";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "users", selected.uid));
    const data = snap.exists() ? snap.data() : {};

    editEmployeeNameInput.value = data.name || selected.name || "";
    editEmployeeIdInput.value = data.employeeId || "";
    editEmployeeDepartmentInput.value = data.department || "";
    editEmployeeDomainInput.value = data.domain || "";
    editEmployeeSalaryInput.value = data.salary ?? "";
    editEmployeeJoinedInput.value = formatDateForInput(data.joinedOn);
  } catch (error) {
    console.error("Could not load selected employee profile:", error);
    setEmployeeProfileStatus("Could not load employee details.", "error");
  }
}

async function loadAttendance(email) {
  const employeeKey = toEmployeeDocKey(email);
  if (!employeeKey) {
    return {};
  }

  try {
    const snap = await getDoc(doc(db, "attendance", employeeKey));
    if (!snap.exists()) {
      return {};
    }

    const records = snap.data().records;
    if (records && typeof records === "object" && !Array.isArray(records)) {
      return records;
    }

    if (Array.isArray(records)) {
      const converted = {};
      records.forEach((item) => {
        if (item?.dateKey) {
          converted[item.dateKey] = {
            status: item.status || "Pending",
            checkIn: item.checkIn || "--"
          };
        }
      });
      return converted;
    }

    return {};
  } catch (error) {
    console.error("Could not load attendance:", error);
    return {};
  }
}

async function loadTasks(email) {
  if (!email) {
    return [];
  }

  try {
    const snap = await getDoc(doc(db, "employeeTasks", email));
    if (!snap.exists()) {
      return [];
    }

    const tasks = snap.data().tasks;
    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    console.error("Could not load tasks:", error);
    return [];
  }
}

async function refreshSelectedEmployeeContext(email) {
  setSelectedEmployeeLabel(email);
  draftAttendance = await loadAttendance(email);
  selectedAttendanceDates.clear();
  draftTasks = (await loadTasks(email)).map((task) => ({ ...task }));
  renderAttendanceCalendar();
  renderManagerTasks();
  setStatus("", "");
  setEmployeeProfileStatus("", "");
  setTaskAssignStatus("", "");
  await loadSelectedEmployeeProfile(email);
}

employeeSelect.addEventListener("change", async () => {
  await refreshSelectedEmployeeContext(employeeSelect.value);
});

function updateAttendanceSelectedDisplay() {
  const count = selectedAttendanceDates.size;
  if (count === 0) {
    attendanceSelectedDateEl.textContent = "Select dates to edit attendance";
    attendanceDayStatusEl.value = "Pending";
    attendanceDayCheckinEl.value = "";
  } else if (count === 1) {
    const dateKey = Array.from(selectedAttendanceDates)[0];
    const date = new Date(`${dateKey}T00:00:00`);
    attendanceSelectedDateEl.textContent = `Selected: 1 day (${date.toDateString()})`;
  } else {
    attendanceSelectedDateEl.textContent = `Selected: ${count} days`;
  }
}

attendanceCalendarEl.addEventListener("click", (event) => {
  const cell = event.target.closest("[data-date-key]");
  if (!cell) {
    return;
  }

  const dateKey = cell.getAttribute("data-date-key");
  
  // Toggle date in selection set
  if (selectedAttendanceDates.has(dateKey)) {
    selectedAttendanceDates.delete(dateKey);
  } else {
    selectedAttendanceDates.add(dateKey);
  }

  // Update display
  updateAttendanceSelectedDisplay();
  renderAttendanceCalendar();
});

applyDayAttendanceBtn.addEventListener("click", () => {
  if (selectedAttendanceDates.size === 0) {
    setStatus("Select at least one date from calendar first.", "error");
    return;
  }

  const nextStatus = attendanceDayStatusEl.value;
  const nextCheckIn = attendanceDayCheckinEl.value ? toDisplayTime(attendanceDayCheckinEl.value) : "--";

  // Apply to all selected dates
  selectedAttendanceDates.forEach((dateKey) => {
    draftAttendance[dateKey] = {
      status: nextStatus,
      checkIn: nextCheckIn
    };
  });

  setStatus(`Applied to ${selectedAttendanceDates.size} day(s).`, "success");
  renderAttendanceCalendar();
});

const clearAttendanceSelectionBtn = document.getElementById("clear-attendance-selection");
if (clearAttendanceSelectionBtn) {
  clearAttendanceSelectionBtn.addEventListener("click", () => {
    selectedAttendanceDates.clear();
    updateAttendanceSelectedDisplay();
    renderAttendanceCalendar();
    setStatus("", "");
  });
}

prevAttendanceMonthBtn.addEventListener("click", () => {
  attendanceMonthCursor = new Date(attendanceMonthCursor.getFullYear(), attendanceMonthCursor.getMonth() - 1, 1);
  renderAttendanceCalendar();
});

nextAttendanceMonthBtn.addEventListener("click", () => {
  attendanceMonthCursor = new Date(attendanceMonthCursor.getFullYear(), attendanceMonthCursor.getMonth() + 1, 1);
  renderAttendanceCalendar();
});

employeeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedEmail = employeeSelect.value;
  const selected = employees.find((item) => item.email === selectedEmail);

  if (!selected?.uid) {
    setEmployeeProfileStatus("Please select a valid employee.", "error");
    return;
  }

  const name = editEmployeeNameInput.value.trim();
  const employeeId = editEmployeeIdInput.value.trim();
  const department = editEmployeeDepartmentInput.value.trim();
  const domain = editEmployeeDomainInput.value.trim();
  const salaryValue = editEmployeeSalaryInput.value.trim();
  const joinedOn = editEmployeeJoinedInput.value;
  const salary = salaryValue ? parseSalary(salaryValue) : null;

  if (!name) {
    setEmployeeProfileStatus("Employee name is required.", "error");
    return;
  }

  if (salaryValue && salary === null) {
    setEmployeeProfileStatus("Enter a valid salary amount.", "error");
    return;
  }

  setEmployeeProfileStatus("Saving employee details...");

  try {
    await setDoc(
      doc(db, "users", selected.uid),
      {
        uid: selected.uid,
        email: selected.email,
        role: "employee",
        name,
        employeeId,
        department,
        domain,
        salary,
        joinedOn,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    const option = employeeSelect.selectedOptions[0];
    if (option) {
      option.textContent = `${name} (${selected.email})`;
    }
    selected.name = name;
    setSelectedEmployeeLabel(selected.email);

    setEmployeeProfileStatus("Employee details updated.", "success");
  } catch (error) {
    console.error(error);
    setEmployeeProfileStatus("Could not update details. Check Firestore rules.", "error");
  }
});

createEmployeeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = createEmployeeNameInput.value.trim();
  const email = toEmployeeDocKey(createEmployeeEmailInput.value);
  const password = createEmployeePasswordInput.value.trim();
  const employeeId = createEmployeeIdInput.value.trim();
  const joinedOn = createEmployeeJoinedInput.value;
  const domain = createEmployeeDomainInput.value.trim();
  const department = createEmployeeDepartmentInput.value.trim() || domain;
  const salary = parseSalary(createEmployeeSalaryInput.value.trim());

  if (!name || !email || !password || !employeeId || !joinedOn || !domain || salary === null) {
    setCreateEmployeeStatus("Please fill all required employee details correctly.", "error");
    return;
  }

  if (password.length < 6) {
    setCreateEmployeeStatus("Password must be at least 6 characters.", "error");
    return;
  }

  setCreateEmployeeStatus("Creating employee account...");

  try {
    let uid = "";
    let authMode = "firebase-auth";
    let authErrorMessage = "";

    try {
      uid = await createEmployeeAuthAccount(email, password);
    } catch (authError) {
      authMode = "local";
      authErrorMessage = authError?.message || "Auth service unavailable";
      uid = `local-${Date.now()}`;
    }

    await setDoc(
      doc(db, "users", uid),
      {
        uid,
        role: "employee",
        name,
        email,
        employeeId,
        joinedOn,
        salary,
        domain,
        department,
        loginPassword: password,
        authMode,
        authProvisionError: authErrorMessage || null,
        createdBy: managerSession?.email || "manager",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    await loadEmployees();
    employeeSelect.value = email;
    await refreshSelectedEmployeeContext(email);

    createEmployeeForm.reset();
    if (authMode === "firebase-auth") {
      setCreateEmployeeStatus("Employee account created successfully.", "success");
    } else {
      setCreateEmployeeStatus(
        `Employee created in local mode. Firebase auth creation failed: ${authErrorMessage}`,
        "success"
      );
    }
  } catch (error) {
    console.error(error);
    setCreateEmployeeStatus(error.message || error.code || "Could not create employee account.", "error");
  }
});

saveAttendanceBtn.addEventListener("click", async () => {
  const email = employeeSelect.value;
  const employeeKey = toEmployeeDocKey(email);
  if (!employeeKey) {
    setStatus("Please select an employee first.", "error");
    return;
  }

  try {
    await setDoc(
      doc(db, "attendance", employeeKey),
      {
        employeeEmail: employeeKey,
        records: draftAttendance,
        updatedBy: managerSession?.email || "manager",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    setStatus("Attendance updated successfully.", "success");
  } catch (error) {
    console.error(error);
    setStatus("Failed to save attendance. Check Firestore rules.", "error");
  }
});

alertForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = alertTitleInput.value.trim();
  const message = alertMessageInput.value.trim();
  const priority = alertPriorityInput.value;

  if (!title || !message) {
    setAlertStatus("Please add alert title and message.", "error");
    return;
  }

  setAlertStatus("Publishing alert...");

  try {
    await addDoc(collection(db, "companyUpdates"), {
      title,
      message,
      priority,
      createdBy: managerSession?.email || "manager",
      createdAt: serverTimestamp()
    });

    alertForm.reset();
    alertPriorityInput.value = "normal";
    setAlertStatus("Alert published for all employees.", "success");
  } catch (error) {
    console.error(error);
    setAlertStatus("Could not publish alert. Check Firestore rules.", "error");
  }
});

if (personalMsgForm) {
  personalMsgForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const recipientEmail = toEmployeeDocKey(personalMsgEmployeeInput?.value);
    const title = personalMsgTitleInput?.value.trim();
    const message = personalMsgContentInput?.value.trim();
    const priority = personalMsgPriorityInput?.value || "normal";

    if (!recipientEmail) {
      setPersonalMsgStatus("Please select an employee.", "error");
      return;
    }

    if (!title || !message) {
      setPersonalMsgStatus("Please add message title and content.", "error");
      return;
    }

    setPersonalMsgStatus("Sending personal message...");

    try {
      await addDoc(collection(db, "personalNotifications"), {
        recipientEmail,
        title,
        message,
        priority,
        createdBy: managerSession?.email || "manager",
        createdAt: serverTimestamp(),
        read: false
      });

      personalMsgForm.reset();
      if (personalMsgPriorityInput) {
        personalMsgPriorityInput.value = "normal";
      }
      setPersonalMsgStatus("Personal message sent.", "success");
    } catch (error) {
      console.error(error);
      setPersonalMsgStatus("Could not send personal message.", "error");
    }
  });
}

managerTaskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedEmail = employeeSelect.value;
  const title = taskTitleInput.value.trim();
  const assignedDate = taskAssignedDateInput.value;
  const dueDate = taskDueDateInput.value;

  if (!selectedEmail) {
    setTaskAssignStatus("Please select an employee first.", "error");
    return;
  }

  if (!title || !assignedDate || !dueDate) {
    setTaskAssignStatus("Please provide task title and both dates.", "error");
    return;
  }

  draftTasks.unshift({
    id: `task-${Date.now()}`,
    title,
    assignedDate,
    dueDate,
    status: "Pending",
    updatedAt: new Date().toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  renderManagerTasks();

  try {
    await setDoc(
      doc(db, "employeeTasks", selectedEmail),
      {
        employeeEmail: selectedEmail,
        tasks: draftTasks,
        updatedBy: managerSession?.email || "manager",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    managerTaskForm.reset();
    setTaskAssignStatus("Task assigned successfully.", "success");
  } catch (error) {
    console.error(error);
    setTaskAssignStatus("Could not assign task. Check Firestore rules.", "error");
  }
});

managerTasksBody.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  const id = target.getAttribute("data-id");
  if (!id) {
    return;
  }

  applyManagerTaskStatusClasses(target, target.value);

  draftTasks = draftTasks.map((task) => {
    if (task.id !== id) {
      return task;
    }
    return {
      ...task,
      status: target.value,
      updatedAt: new Date().toLocaleString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };
  });
});

managerTasksBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const editBtn = target.closest(".manager-task-edit");
  if (editBtn instanceof HTMLElement) {
    const taskId = editBtn.getAttribute("data-id");
    const existing = draftTasks.find((task) => task.id === taskId);
    if (!existing) {
      return;
    }

    const nextTitle = window.prompt("Edit task title", existing.title);
    if (nextTitle === null) {
      return;
    }

    const nextAssignedDate = window.prompt("Edit assigned date (YYYY-MM-DD)", existing.assignedDate);
    if (nextAssignedDate === null) {
      return;
    }

    const nextDueDate = window.prompt("Edit due date (YYYY-MM-DD)", existing.dueDate);
    if (nextDueDate === null) {
      return;
    }

    if (!nextTitle.trim() || !nextAssignedDate.trim() || !nextDueDate.trim()) {
      setTaskAssignStatus("Task title and both dates are required.", "error");
      return;
    }

    draftTasks = draftTasks.map((task) => {
      if (task.id !== taskId) {
        return task;
      }
      return {
        ...task,
        title: nextTitle.trim(),
        assignedDate: nextAssignedDate.trim(),
        dueDate: nextDueDate.trim(),
        updatedAt: new Date().toLocaleString([], {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      };
    });

    renderManagerTasks();
    setTaskAssignStatus("Task updated. Click Save Task Updates to persist.", "success");
    return;
  }

  const deleteBtn = target.closest(".manager-task-delete");
  if (deleteBtn instanceof HTMLElement) {
    const taskId = deleteBtn.getAttribute("data-id");
    const shouldDelete = window.confirm("Delete this task?");
    if (!shouldDelete) {
      return;
    }

    draftTasks = draftTasks.filter((task) => task.id !== taskId);
    renderManagerTasks();
    setTaskAssignStatus("Task removed. Click Save Task Updates to persist.", "success");
  }
});

managerAlertList?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const actionBtn = target.closest(".manager-action-btn");
  if (!(actionBtn instanceof HTMLElement)) {
    return;
  }

  const action = actionBtn.getAttribute("data-action");
  const id = actionBtn.getAttribute("data-id");
  if (!action || !id) {
    return;
  }

  if (action === "delete-alert") {
    if (!window.confirm("Delete this company notification?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "companyUpdates", id));
      setAlertStatus("Notification deleted.", "success");
    } catch (error) {
      console.error(error);
      setAlertStatus("Could not delete notification.", "error");
    }
    return;
  }

  if (action === "edit-alert") {
    const existing = managerAlertsState.find((item) => item.id === id);
    if (!existing) {
      setAlertStatus("Notification not found.", "error");
      return;
    }

    const title = window.prompt("Edit notification title", existing.title || "");
    if (title === null) {
      return;
    }
    const message = window.prompt("Edit notification message", existing.message || "");
    if (message === null) {
      return;
    }
    const priorityInput = window.prompt("Priority (normal/high)", existing.priority || "normal");
    if (priorityInput === null) {
      return;
    }

    const priority = ["normal", "high"].includes(priorityInput.toLowerCase())
      ? priorityInput.toLowerCase()
      : "normal";

    if (!title.trim() || !message.trim()) {
      setAlertStatus("Title and message cannot be empty.", "error");
      return;
    }

    try {
      await setDoc(
        doc(db, "companyUpdates", id),
        {
          title: title.trim(),
          message: message.trim(),
          priority,
          updatedAt: serverTimestamp(),
          updatedBy: managerSession?.email || "manager"
        },
        { merge: true }
      );
      setAlertStatus("Notification updated.", "success");
    } catch (error) {
      console.error(error);
      setAlertStatus("Could not update notification.", "error");
    }
  }
});

managerPersonalMsgList?.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const actionBtn = target.closest(".manager-action-btn");
  if (!(actionBtn instanceof HTMLElement)) {
    return;
  }

  const action = actionBtn.getAttribute("data-action");
  const id = actionBtn.getAttribute("data-id");
  if (!action || !id) {
    return;
  }

  if (action === "delete-personal") {
    if (!window.confirm("Delete this personal notification?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "personalNotifications", id));
      setPersonalMsgStatus("Personal notification deleted.", "success");
    } catch (error) {
      console.error(error);
      setPersonalMsgStatus("Could not delete personal notification.", "error");
    }
    return;
  }

  if (action === "edit-personal") {
    const existing = managerPersonalMessagesState.find((item) => item.id === id);
    if (!existing) {
      setPersonalMsgStatus("Personal notification not found.", "error");
      return;
    }

    const title = window.prompt("Edit personal notification title", existing.title || "");
    if (title === null) {
      return;
    }
    const message = window.prompt("Edit personal notification message", existing.message || "");
    if (message === null) {
      return;
    }
    const priorityInput = window.prompt("Priority (normal/high/urgent)", existing.priority || "normal");
    if (priorityInput === null) {
      return;
    }

    const normalizedPriority = priorityInput.toLowerCase();
    const priority = ["normal", "high", "urgent"].includes(normalizedPriority) ? normalizedPriority : "normal";

    if (!title.trim() || !message.trim()) {
      setPersonalMsgStatus("Title and message cannot be empty.", "error");
      return;
    }

    try {
      await setDoc(
        doc(db, "personalNotifications", id),
        {
          title: title.trim(),
          message: message.trim(),
          priority,
          updatedAt: serverTimestamp(),
          updatedBy: managerSession?.email || "manager"
        },
        { merge: true }
      );
      setPersonalMsgStatus("Personal notification updated.", "success");
    } catch (error) {
      console.error(error);
      setPersonalMsgStatus("Could not update personal notification.", "error");
    }
  }
});

saveManagerTasksBtn.addEventListener("click", async () => {
  const selectedEmail = employeeSelect.value;
  if (!selectedEmail) {
    setTaskAssignStatus("Please select an employee first.", "error");
    return;
  }

  try {
    await setDoc(
      doc(db, "employeeTasks", selectedEmail),
      {
        employeeEmail: selectedEmail,
        tasks: draftTasks,
        updatedBy: managerSession?.email || "manager",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    setTaskAssignStatus("Task updates saved.", "success");
    renderManagerTasks();
  } catch (error) {
    console.error(error);
    setTaskAssignStatus("Could not save task updates.", "error");
  }
});

managerLogoutBtn.addEventListener("click", () => {
  localStorage.removeItem("onixeraManagerSession");
  window.location.href = "./manager-login.html";
});

managerOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    if (!targetId) {
      return;
    }
    activateManagerModule(targetId);
  });
});

(async function init() {
  activateManagerModule("");

  await loadEmployees();
  if (employeeSelect.value) {
    await refreshSelectedEmployeeContext(employeeSelect.value);
  } else {
    renderAttendanceCalendar();
    renderManagerTasks();
    setSelectedEmployeeLabel("");
  }

  listenManagerAlerts();
  listenManagerPersonalMessages();
})();
