import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAYjuraNFNgL12qxbrWLoGCokqEEyNLn8Y",
  authDomain: "onixera-952b6.firebaseapp.com",
  projectId: "onixera-952b6",
  storageBucket: "onixera-952b6.firebasestorage.app",
  messagingSenderId: "215096125933",
  appId: "1:215096125933:web:ffcfbd8c52f62dc3121fe4",
  measurementId: "G-XKQSZZZ4EX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Employee data
const managersData = [
  {
    name: "Ashish Manager",
    email: "ashish.manager@onixeratechnologies.com",
    password: "123456",
    department: "Management",
    domain: "Operations",
    joinedOn: "2024-04-01"
  },
  {
    name: "Harshita Manager",
    email: "harshita.manager@onixeratechnologies.com",
    password: "123456",
    department: "Management",
    domain: "Operations",
    joinedOn: "2024-04-01"
  }
];

const employeesData = [
  {
    name: "Rahul Kumar",
    email: "rahul.kumar@onixera.com",
    password: "Dev@2024#001",
    employeeId: "EMP001",
    department: "Development",
    domain: "Backend Development",
    salary: 60000,
    joinedOn: "2024-01-15"
  },
  {
    name: "Priya Singh",
    email: "priya.singh@onixera.com",
    password: "Dev@2024#002",
    employeeId: "EMP002",
    department: "Development",
    domain: "Frontend Development",
    salary: 55000,
    joinedOn: "2024-02-01"
  },
  {
    name: "Aisha Patel",
    email: "aisha.patel@onixera.com",
    password: "Design@2024#003",
    employeeId: "EMP003",
    department: "UI/UX",
    domain: "UI/UX Design",
    salary: 50000,
    joinedOn: "2024-01-20"
  },
  {
    name: "Vikram Desai",
    email: "vikram.desai@onixera.com",
    password: "Marketing@2024#004",
    employeeId: "EMP004",
    department: "Digital Marketing",
    domain: "Content Marketing",
    salary: 45000,
    joinedOn: "2024-01-25"
  },
  {
    name: "Neha Iyer",
    email: "neha.iyer@onixera.com",
    password: "Sales@2024#005",
    employeeId: "EMP005",
    department: "Cold Calling",
    domain: "B2B Sales",
    salary: 40000,
    joinedOn: "2024-02-10"
  },
  {
    name: "Arjun Nair",
    email: "arjun.nair@onixera.com",
    password: "Dev@2024#006",
    employeeId: "EMP006",
    department: "UI/UX",
    domain: "UX Research",
    salary: 52000,
    joinedOn: "2024-01-30"
  }
];

// Task templates by department
const taskTemplates = {
  "Development": [
    { title: "Fix bug in authentication module", description: "Resolve JWT token validation issues" },
    { title: "Implement payment gateway integration", description: "Integrate Razorpay into checkout flow" },
    { title: "Optimize database queries", description: "Reduce query execution time by 30%" },
    { title: "Code review for team PRs", description: "Review and provide feedback on pull requests" },
    { title: "Update API documentation", description: "Document new endpoints in Swagger" }
  ],
  "UI/UX": [
    { title: "Design mobile app mockups", description: "Create high-fidelity designs for iOS app" },
    { title: "Conduct user testing sessions", description: "Gather feedback from 5 test users" },
    { title: "Create design system components", description: "Build reusable component library" },
    { title: "Analyze user behavior metrics", description: "Review heatmaps and session recordings" },
    { title: "Prototype new dashboard layout", description: "Create interactive prototype for review" }
  ],
  "Digital Marketing": [
    { title: "Create social media content calendar", description: "Plan content for next month" },
    { title: "Write blog posts about AI trends", description: "Publish 3 articles on company blog" },
    { title: "Analyze campaign performance metrics", description: "Create report on Q1 campaigns" },
    { title: "Design email marketing templates", description: "Create 5 new email templates" },
    { title: "Optimize SEO for landing pages", description: "Improve keyword ranking" }
  ],
  "Cold Calling": [
    { title: "Generate B2B leads list", description: "Research and compile 100 qualified leads" },
    { title: "Make outreach calls to prospects", description: "Schedule 20 discovery calls" },
    { title: "Prepare sales pitch presentation", description: "Create 10-minute elevator pitch" },
    { title: "Follow up with warm leads", description: "Send personalized follow-up emails" },
    { title: "Update CRM with contact info", description: "Add 50 new prospects to database" }
  ]
};

// Helper function: Generate random date within last 2 months
function getRandomDateInPast60Days() {
  const end = new Date();
  const start = new Date(end.getTime() - 60 * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function: Format date to YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper function: Generate attendance records for past 2 months
function generateAttendanceRecords(email) {
  const records = {};
  const today = new Date();
  const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (let date = new Date(twoMonthsAgo); date <= today; date.setDate(date.getDate() + 1)) {
    const dateKey = formatDate(new Date(date));
    const dayOfWeek = new Date(date).getDay();

    // Skip weekends (Saturday=6, Sunday=0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      records[dateKey] = { status: "Weekend", checkIn: "--" };
      continue;
    }

    // 85% chance of being present, 15% chance of being absent
    const isPresent = Math.random() < 0.85;
    if (isPresent) {
      // Generate random check-in time between 8AM and 10AM
      const hour = Math.floor(Math.random() * 2) + 8;
      const minute = Math.floor(Math.random() * 60);
      const checkInTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      records[dateKey] = { status: "Present", checkIn: checkInTime };
    } else {
      records[dateKey] = { status: "Absent", checkIn: "--" };
    }
  }

  return records;
}

// Helper function: Generate tasks for an employee
function generateTasksForEmployee(email, department) {
  const templates = taskTemplates[department] || [];
  const numTasks = Math.floor(Math.random() * 3) + 2; // 2-4 tasks per employee
  const tasks = [];

  for (let i = 0; i < Math.min(numTasks, templates.length); i++) {
    const template = templates[i];
    const assignedDate = getRandomDateInPast60Days();
    const dueDate = new Date(assignedDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks after assigned

    const statuses = ["Pending", "In Progress", "Done"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // Format updatedAt as locale string like the dashboard expects
    const updatedAtDate = new Date();
    const updatedAt = updatedAtDate.toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    tasks.push({
      id: `task-${Date.now()}-${Math.random()}`,
      title: template.title,
      description: template.description,
      assignedDate: formatDate(assignedDate),
      dueDate: formatDate(dueDate),
      status: randomStatus,
      updatedAt: updatedAt
    });
  }

  return tasks;
}

// Main seeding function
async function seedEmployees() {
  console.log("🌱 Starting manager and employee seeding...\n");

  for (const managerData of managersData) {
    try {
      console.log(`📝 Creating manager: ${managerData.email}`);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        managerData.email,
        managerData.password
      );

      const uid = userCredential.user.uid;

      console.log(`💾 Saving manager profile for ${managerData.name}`);
      await setDoc(doc(db, "users", uid), {
        name: managerData.name,
        email: managerData.email,
        department: managerData.department,
        domain: managerData.domain,
        joinedOn: managerData.joinedOn,
        role: "manager",
        createdAt: serverTimestamp()
      });

      console.log(`✨ Successfully seeded manager: ${managerData.name}\n`);
    } catch (error) {
      console.error(`❌ Error seeding manager ${managerData.name}:`, error.message);
    }
  }

  for (const employeeData of employeesData) {
    try {
      // 1. Create user in Firebase Auth
      console.log(`📝 Creating user: ${employeeData.email}`);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        employeeData.email,
        employeeData.password
      );

      const uid = userCredential.user.uid;
      const email = employeeData.email;

      // 2. Save employee data in 'users' collection
      console.log(`💾 Saving profile for ${employeeData.name}`);
      await setDoc(doc(db, "users", uid), {
        name: employeeData.name,
        email: email,
        employeeId: employeeData.employeeId,
        department: employeeData.department,
        domain: employeeData.domain,
        salary: employeeData.salary,
        joinedOn: employeeData.joinedOn,
        role: "employee",
        createdAt: serverTimestamp()
      });

      // 3. Generate and save attendance records
      console.log(`📅 Generating attendance for 2 months`);
      const attendanceRecords = generateAttendanceRecords(email);
      const employeeKey = email.toLowerCase().trim();
      await setDoc(doc(db, "attendance", employeeKey), {
        employeeEmail: employeeKey,
        records: attendanceRecords,
        updatedBy: "system-seed",
        updatedAt: serverTimestamp()
      });

      // 4. Generate and save tasks
      console.log(`✅ Assigning tasks for ${employeeData.name}`);
      const tasks = generateTasksForEmployee(email, employeeData.department);
      await setDoc(doc(db, "employeeTasks", email), {
        employeeEmail: email,
        tasks: tasks,
        updatedBy: "system-seed",
        updatedAt: serverTimestamp()
      });

      console.log(`✨ Successfully seeded: ${employeeData.name}\n`);
    } catch (error) {
      console.error(`❌ Error seeding ${employeeData.name}:`, error.message);
    }
  }

  console.log("🎉 Employee seeding completed!");
  console.log("\n📋 Seeded Managers:");
  managersData.forEach((manager) => {
    console.log(`  • ${manager.name} (${manager.department}) - ${manager.email}`);
  });
  console.log("\n📋 Seeded Employees:");
  employeesData.forEach((emp) => {
    console.log(`  • ${emp.name} (${emp.department}) - ${emp.email}`);
  });
}

// Run the seeding
seedEmployees().catch(console.error);
