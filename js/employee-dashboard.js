import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { db } from "./firebase-config.js";

const sessionRaw = localStorage.getItem("onixeraEmployeeSession");
const employeeNameEl = document.getElementById("employee-name");
const logoutBtn = document.getElementById("employee-logout");
const updatesList = document.getElementById("company-updates");
const announcementReaderEl = document.getElementById("announcement-reader");
const announcementReaderTitleEl = document.getElementById("announcement-reader-title");
const announcementReaderMetaEl = document.getElementById("announcement-reader-meta");
const announcementReaderMessageEl = document.getElementById("announcement-reader-message");
const announcementReaderCloseBtn = document.getElementById("announcement-reader-close");
const personalNotificationsSection = document.getElementById("personal-notifications-section");
const personalNotificationsList = document.getElementById("personal-notifications-list");
const employeeAttendanceCalendarEl = document.getElementById("employee-attendance-calendar");
const employeeAttendanceMonthLabelEl = document.getElementById("employee-attendance-month-label");
const employeeAttendancePrevBtn = document.getElementById("employee-attendance-prev-month");
const employeeAttendanceNextBtn = document.getElementById("employee-attendance-next-month");
const tasksBody = document.getElementById("tasks-body");
const taskStatusMsg = document.getElementById("task-status-msg");
const detailNameEl = document.getElementById("detail-name");
const detailRoleEl = document.getElementById("detail-role");
const detailIdEl = document.getElementById("detail-id");
const detailEmailEl = document.getElementById("detail-email");
const detailDepartmentEl = document.getElementById("detail-department");
const detailDomainEl = document.getElementById("detail-domain");
const detailSalaryEl = document.getElementById("detail-salary");
const detailJoinedEl = document.getElementById("detail-joined");
const employeeAvatarEl = document.getElementById("employee-avatar");

if (!sessionRaw) {
  window.location.href = "./employee-login.html";
}

const session = sessionRaw ? JSON.parse(sessionRaw) : null;

if (session && employeeNameEl) {
  employeeNameEl.textContent = session.name || session.email;
}

const fallbackUpdates = [
  {
    title: "Welcome",
    message: "Manager alerts will appear here once published.",
    priority: "normal",
    date: "Now"
  }
];

const state = {
  attendance: {},
  tasks: [],
  announcements: [],
  selectedAnnouncementIndex: -1
};

let attendanceMonthCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function toEmployeeDocKey(value) {
  return String(value || "").trim().toLowerCase();
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderFallbackUpdates() {
  state.announcements = fallbackUpdates.map((item) => ({
    title: item.title,
    message: item.message,
    when: item.date,
    priority: item.priority || "normal"
  }));
  renderLiveUpdates(state.announcements);
}

function openAnnouncementReader(item, index) {
  if (!announcementReaderEl || !item || typeof index !== "number") {
    return;
  }

  if (state.selectedAnnouncementIndex === index) {
    closeAnnouncementReader();
    return;
  }

  state.selectedAnnouncementIndex = index;
  announcementReaderTitleEl.textContent = item.title || "Announcement";
  announcementReaderMetaEl.textContent = `${item.when || "Now"} • ${String(item.priority || "normal").toUpperCase()}`;
  announcementReaderMessageEl.textContent = item.message || "No announcement details provided.";
  announcementReaderEl.hidden = false;
}

function closeAnnouncementReader() {
  if (!announcementReaderEl) {
    return;
  }
  state.selectedAnnouncementIndex = -1;
  announcementReaderEl.hidden = true;
}

function renderLiveUpdates(items) {
  updatesList.innerHTML = "";

  if (!items.length) {
    renderFallbackUpdates();
    return;
  }

  items.forEach((item) => {
    const index = updatesList.children.length;
    const li = document.createElement("li");
    li.className = "update-item";
    li.innerHTML = `
      <button class="update-item-btn" type="button" data-announcement-index="${index}" aria-expanded="false">
        <p class="update-title">${item.title}</p>
        <p class="update-date">${item.when} • Click to open</p>
      </button>
    `;

    if (state.selectedAnnouncementIndex === index) {
      li.classList.add("is-open");
      const button = li.querySelector(".update-item-btn");
      if (button) {
        button.setAttribute("aria-expanded", "true");
      }
    }

    updatesList.appendChild(li);
  });
}

function listenCompanyUpdates() {
  const updatesQuery = query(collection(db, "companyUpdates"), orderBy("createdAt", "desc"), limit(10));

  onSnapshot(
    updatesQuery,
    (snapshot) => {
      const updates = snapshot.docs.map((item) => {
        const data = item.data();
        const when = data.createdAt?.toDate
          ? data.createdAt.toDate().toLocaleString([], {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "Now";

        return {
          title: data.title || "Alert",
          message: data.message || "",
          when,
          priority: data.priority || "normal"
        };
      });

      state.announcements = updates;
      renderLiveUpdates(updates);
    },
    (error) => {
      console.error("Could not stream updates:", error);
      renderFallbackUpdates();
    }
  );
}

function renderPersonalNotifications(items) {
  if (!personalNotificationsSection || !personalNotificationsList) {
    return;
  }

  personalNotificationsList.innerHTML = "";

  if (!items.length) {
    personalNotificationsSection.hidden = true;
    return;
  }

  personalNotificationsSection.hidden = false;

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "personal-notif-card";
    card.innerHTML = `
      <div class="personal-notif-head">
        <p class="personal-notif-title">${item.title}</p>
        <span class="personal-notif-badge ${item.priority}">${String(item.priority || "normal").toUpperCase()}</span>
      </div>
      <p class="personal-notif-message">${item.message}</p>
      <p class="personal-notif-time">${item.when}</p>
    `;
    personalNotificationsList.appendChild(card);
  });
}

function listenPersonalNotifications() {
  if (!session?.email) {
    return;
  }

  const personalQuery = query(
    collection(db, "personalNotifications"),
    where("recipientEmail", "==", toEmployeeDocKey(session.email)),
    limit(20)
  );

  onSnapshot(
    personalQuery,
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => {
          const data = item.data();
          const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : null;
          const when = createdAtDate
            ? createdAtDate.toLocaleString([], {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })
            : "Now";

          return {
            title: data.title || "Message",
            message: data.message || "",
            priority: data.priority || "normal",
            when,
            sortValue: createdAtDate ? createdAtDate.getTime() : 0
          };
        })
        .sort((a, b) => b.sortValue - a.sortValue);

      renderPersonalNotifications(items);
    },
    (error) => {
      console.error("Could not stream personal notifications:", error);
    }
  );
}

function renderAttendanceCalendar() {
  employeeAttendanceCalendarEl.innerHTML = "";

  const monthStart = new Date(attendanceMonthCursor.getFullYear(), attendanceMonthCursor.getMonth(), 1);
  const monthEnd = new Date(attendanceMonthCursor.getFullYear(), attendanceMonthCursor.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const totalDays = monthEnd.getDate();

  employeeAttendanceMonthLabelEl.textContent = monthStart.toLocaleString([], {
    month: "long",
    year: "numeric"
  });

  const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  headers.forEach((label) => {
    const head = document.createElement("div");
    head.className = "calendar-head";
    head.textContent = label;
    employeeAttendanceCalendarEl.appendChild(head);
  });

  for (let i = 0; i < startWeekday; i += 1) {
    const blank = document.createElement("div");
    blank.className = "calendar-cell calendar-cell-empty";
    employeeAttendanceCalendarEl.appendChild(blank);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const dateKey = toDateKey(date);
    const record = state.attendance[dateKey] || { status: "Pending", checkIn: "--" };

    const cell = document.createElement("div");
    cell.className = `calendar-cell calendar-status-${String(record.status || "Pending").toLowerCase().replace(/\s+/g, "-")}`;
    cell.innerHTML = `
      <span class="calendar-day">${day}</span>
      <span class="calendar-state">${record.status || "Pending"}</span>
      <span class="calendar-time">${record.checkIn || "--"}</span>
    `;
    employeeAttendanceCalendarEl.appendChild(cell);
  }
}

function renderTasks() {
  tasksBody.innerHTML = "";

  if (!state.tasks.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="5">No tasks assigned by manager yet.</td>';
    tasksBody.appendChild(tr);
    return;
  }

  state.tasks.forEach((task) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${task.title}</td>
      <td>${task.assignedDate}</td>
      <td>${task.dueDate}</td>
      <td>
        <select class="task-status" data-id="${task.id}">
          <option value="Pending" ${task.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Done" ${task.status === "Done" ? "selected" : ""}>Done</option>
        </select>
      </td>
      <td>${task.updatedAt || "--"}</td>
    `;
    tasksBody.appendChild(tr);
  });
}

function setTaskMessage(text, type) {
  taskStatusMsg.textContent = text;
  taskStatusMsg.classList.remove("success", "error");
  if (type) {
    taskStatusMsg.classList.add(type);
  }
}

async function hydrateEmployeeProfile() {
  if (!session?.uid) {
    return;
  }

  try {
    const userSnap = await getDoc(doc(db, "users", session.uid));
    const userData = userSnap.exists() ? userSnap.data() : {};

    const displayName = userData.name || session.name || session.email;
    if (detailNameEl) {
      detailNameEl.textContent = displayName;
    }
    if (detailRoleEl) {
      detailRoleEl.textContent = userData.role || "Employee";
    }
    if (detailIdEl) {
      detailIdEl.textContent = userData.employeeId || "ONX-EMP-000";
    }
    if (detailEmailEl) {
      detailEmailEl.textContent = session.email || "--";
    }
    if (detailDepartmentEl) {
      detailDepartmentEl.textContent = userData.department || "General";
    }
    if (detailDomainEl) {
      detailDomainEl.textContent = userData.domain || userData.department || "General";
    }
    if (detailSalaryEl) {
      detailSalaryEl.textContent = Number.isFinite(Number(userData.salary))
        ? `INR ${Number(userData.salary).toLocaleString()}`
        : "--";
    }
    if (detailJoinedEl) {
      detailJoinedEl.textContent = userData.joinedOn || "--";
    }
    if (employeeAvatarEl) {
      employeeAvatarEl.textContent = displayName.charAt(0).toUpperCase();
    }
  } catch (error) {
    console.error("Failed to load employee profile:", error);
  }
}

function normalizeAttendance(records) {
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
}

function listenAttendance() {
  const employeeKey = toEmployeeDocKey(session?.email);
  if (!employeeKey) {
    renderAttendanceCalendar();
    return;
  }

  const attendanceRef = doc(db, "attendance", employeeKey);
  onSnapshot(
    attendanceRef,
    (snap) => {
      const records = snap.exists() ? snap.data().records : null;
      state.attendance = normalizeAttendance(records);
      renderAttendanceCalendar();
    },
    (error) => {
      console.error("Attendance listener failed:", error);
      state.attendance = {};
      renderAttendanceCalendar();
    }
  );
}

function listenTasks() {
  if (!session?.email) {
    renderTasks();
    return;
  }

  const tasksRef = doc(db, "employeeTasks", session.email);
  onSnapshot(
    tasksRef,
    (snap) => {
      const tasks = snap.exists() ? snap.data().tasks : null;
      state.tasks = Array.isArray(tasks) ? tasks : [];
      renderTasks();
    },
    (error) => {
      console.error("Task listener failed:", error);
      state.tasks = [];
      renderTasks();
    }
  );
}

tasksBody.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }

  const id = target.getAttribute("data-id");
  if (!id) {
    return;
  }

  state.tasks = state.tasks.map((task) => {
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

  if (!session?.email) {
    renderTasks();
    return;
  }

  setDoc(
    doc(db, "employeeTasks", session.email),
    {
      employeeEmail: session.email,
      tasks: state.tasks,
      updatedBy: session.email,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  )
    .then(() => {
      renderTasks();
      setTaskMessage("Task status updated successfully.", "success");
    })
    .catch((error) => {
      console.error(error);
      setTaskMessage("Could not update task status. Check Firestore rules.", "error");
    });
});

updatesList.addEventListener("click", (event) => {
  const button = event.target.closest(".update-item-btn");
  if (!button) {
    return;
  }

  const index = Number(button.getAttribute("data-announcement-index"));
  if (!Number.isInteger(index) || index < 0) {
    return;
  }

  const selected = state.announcements[index];
  if (!selected) {
    return;
  }

  openAnnouncementReader(selected, index);
  renderLiveUpdates(state.announcements);
});

announcementReaderCloseBtn?.addEventListener("click", closeAnnouncementReader);

employeeAttendancePrevBtn.addEventListener("click", () => {
  attendanceMonthCursor = new Date(attendanceMonthCursor.getFullYear(), attendanceMonthCursor.getMonth() - 1, 1);
  renderAttendanceCalendar();
});

employeeAttendanceNextBtn.addEventListener("click", () => {
  attendanceMonthCursor = new Date(attendanceMonthCursor.getFullYear(), attendanceMonthCursor.getMonth() + 1, 1);
  renderAttendanceCalendar();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("onixeraEmployeeSession");
  window.location.href = "./employee-login.html";
});

renderFallbackUpdates();
hydrateEmployeeProfile();
listenAttendance();
listenCompanyUpdates();
listenPersonalNotifications();
listenTasks();
