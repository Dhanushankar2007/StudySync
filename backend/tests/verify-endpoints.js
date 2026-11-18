/**
 * tests/verify-endpoints.js
 *
 * Comprehensive end-to-end API test suite verifying that all endpoints,
 * request/response structures, auth flows, and CRUD operations function
 * properly and remain 100% compatible with the React frontend.
 */

const http = require("node:http");
const bcrypt = require("bcryptjs");

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = "test_jwt_secret_key_123456789";

// In-memory mock store for Prisma to run end-to-end route tests
const mockStore = {
  users: new Map(),
  notifications: new Map(),
  tasks: new Map(),
  taskSequence: 1,
};

// Seed initial SQLite-like records
mockStore.users.set("usr_demo_1", {
  id: "usr_demo_1",
  name: "Alex Johnson",
  email: "alex@studysync.io",
  passwordHash: bcrypt.hashSync("password123", 10),
  resetToken: null,
  resetTokenExpires: null,
  createdAt: new Date("2026-11-13T03:46:56.767Z"),
  updatedAt: new Date("2026-11-13T03:46:56.767Z"),
});

mockStore.tasks.set(1, {
  id: 1,
  userId: "usr_demo_1",
  title: "Revise Computer Networks Layer 3",
  description: "Networking",
  deadline: "2026-11-14",
  priority: "high",
  completed: false,
  createdAt: new Date("2026-11-13T03:46:56.767Z"),
  updatedAt: new Date("2026-11-13T03:46:56.767Z"),
});
mockStore.taskSequence = 2;

// Intercept prisma in cache
const prisma = require("../src/db/prisma");

prisma.user.findUnique = async ({ where }) => {
  if (where.id) return mockStore.users.get(where.id) || null;
  if (where.email) {
    for (const u of mockStore.users.values()) {
      if (u.email === where.email) return u;
    }
  }
  return null;
};

prisma.user.findFirst = async ({ where }) => {
  for (const u of mockStore.users.values()) {
    if (where.resetToken && u.resetToken !== where.resetToken) continue;
    if (where.resetTokenExpires?.gt && u.resetTokenExpires <= where.resetTokenExpires.gt) continue;
    return u;
  }
  return null;
};

prisma.user.create = async ({ data }) => {
  const user = {
    id: data.id,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    resetToken: data.resetToken || null,
    resetTokenExpires: data.resetTokenExpires || null,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
  mockStore.users.set(user.id, user);
  return user;
};

prisma.user.update = async ({ where, data }) => {
  const existing = mockStore.users.get(where.id);
  if (!existing) throw new Error("User not found");
  const updated = {
    ...existing,
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
    ...(data.resetToken !== undefined ? { resetToken: data.resetToken } : {}),
    ...(data.resetTokenExpires !== undefined ? { resetTokenExpires: data.resetTokenExpires } : {}),
    updatedAt: new Date(),
  };
  mockStore.users.set(where.id, updated);
  return updated;
};

prisma.notification.findMany = async ({ where, orderBy, take }) => {
  let list = Array.from(mockStore.notifications.values());
  if (where?.OR) {
    list = list.filter((n) => where.OR.some((cond) => {
      if (cond.userId === null) return n.userId === null;
      return n.userId === cond.userId;
    }));
  }
  list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (take) list = list.slice(0, take);
  return list;
};

prisma.notification.create = async ({ data }) => {
  const notif = {
    id: data.id,
    userId: data.userId || null,
    title: data.title,
    message: data.message,
    type: data.type || "general",
    read: Boolean(data.read),
    link: data.link || null,
    createdAt: data.createdAt || new Date(),
  };
  mockStore.notifications.set(notif.id, notif);
  return notif;
};

prisma.notification.createMany = async ({ data }) => {
  for (const item of data) {
    mockStore.notifications.set(item.id, {
      ...item,
      read: Boolean(item.read),
      createdAt: item.createdAt || new Date(),
    });
  }
  return { count: data.length };
};

prisma.notification.update = async ({ where, data }) => {
  const existing = mockStore.notifications.get(where.id);
  if (!existing) throw new Error("Not found");
  const updated = { ...existing, ...data };
  mockStore.notifications.set(where.id, updated);
  return updated;
};

prisma.notification.updateMany = async ({ where, data }) => {
  let count = 0;
  for (const [id, notif] of mockStore.notifications.entries()) {
    let match = true;
    if (where?.OR) {
      match = where.OR.some((c) => (c.userId === null ? notif.userId === null : notif.userId === c.userId));
    }
    if (match) {
      mockStore.notifications.set(id, { ...notif, ...data });
      count++;
    }
  }
  return { count };
};

prisma.notification.delete = async ({ where }) => {
  mockStore.notifications.delete(where.id);
  return { id: where.id };
};

prisma.notification.deleteMany = async ({ where } = {}) => {
  let count = 0;
  for (const [id, notif] of Array.from(mockStore.notifications.entries())) {
    let match = true;
    if (where?.OR) {
      match = where.OR.some((c) => (c.userId === null ? notif.userId === null : notif.userId === c.userId));
    }
    if (match) {
      mockStore.notifications.delete(id);
      count++;
    }
  }
  return { count };
};

prisma.task.findMany = async ({ where, orderBy }) => {
  let list = Array.from(mockStore.tasks.values());
  if (where?.userId) {
    list = list.filter((t) => t.userId === where.userId);
  }
  list.sort((a, b) => b.id - a.id);
  return list;
};

prisma.task.findFirst = async ({ where }) => {
  for (const t of mockStore.tasks.values()) {
    if (where.id && t.id !== where.id) continue;
    if (where.userId && t.userId !== where.userId) continue;
    return t;
  }
  return null;
};

prisma.task.create = async ({ data }) => {
  const id = mockStore.taskSequence++;
  const task = {
    id,
    userId: data.userId || null,
    title: data.title,
    description: data.description || "",
    deadline: data.deadline || null,
    priority: data.priority || "medium",
    completed: Boolean(data.completed),
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
  mockStore.tasks.set(id, task);
  return task;
};

prisma.task.update = async ({ where, data }) => {
  const existing = mockStore.tasks.get(where.id);
  if (!existing) throw new Error("Task not found");
  const updated = {
    ...existing,
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
    ...(data.priority !== undefined ? { priority: data.priority } : {}),
    ...(data.completed !== undefined ? { completed: Boolean(data.completed) } : {}),
    updatedAt: new Date(),
  };
  mockStore.tasks.set(where.id, updated);
  return updated;
};

prisma.task.deleteMany = async ({ where }) => {
  let count = 0;
  for (const [id, t] of Array.from(mockStore.tasks.entries())) {
    if (where.id && t.id !== where.id) continue;
    if (where.userId && t.userId !== where.userId) continue;
    mockStore.tasks.delete(id);
    count++;
  }
  return { count };
};

prisma.$transaction = async (actions) => {
  const results = [];
  for (const act of actions) {
    results.push(await act);
  }
  return results;
};

// Start Express app
const app = require("../src/app");

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`\n🚀 Test server listening on ${baseUrl}\n`);
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || "Assertion failed");
  }

  let authToken = "";
  let createdTaskId = null;
  let createdNotifId = null;

  // 1. System Health Check
  await test("GET /api/health returns 200 and ok status", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.status === "ok", "Expected status ok");
  });

  // 2. User Registration (Signup)
  await test("POST /api/auth/signup creates new user and returns JWT token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "testuser@studysync.io",
        password: "testpassword123",
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success true");
    assert(data.token, "Expected token in response");
    assert(data.user.email === "testuser@studysync.io", "Email mismatch");
    authToken = data.token;
  });

  // 3. User Login
  await test("POST /api/auth/login logs in user and returns valid token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex@studysync.io",
        password: "password123",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success true");
    assert(data.token, "Expected token");
    assert(data.user.name === "Alex Johnson", "Name mismatch");
  });

  // 4. Auth Me
  await test("GET /api/auth/me returns current user with valid token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.name === "Test User", "Name mismatch in /me");
  });

  // 5. Profile Update
  await test("PUT /api/auth/profile updates user name", async () => {
    const res = await fetch(`${baseUrl}/api/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Updated Test User" }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.user.name === "Updated Test User", "Name was not updated");
  });

  // 6. Study Planner - Create Task
  await test("POST /api/planner creates new study task", async () => {
    const res = await fetch(`${baseUrl}/api/planner`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Study PostgreSQL with Prisma",
        description: "Database migration testing",
        deadline: "2026-11-25",
        priority: "high",
        completed: false,
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success true");
    assert(data.data.title === "Study PostgreSQL with Prisma", "Title mismatch");
    assert(data.data.id, "Expected task id");
    createdTaskId = data.data.id;
  });

  // 7. Study Planner - List Tasks
  await test("GET /api/planner lists tasks", async () => {
    const res = await fetch(`${baseUrl}/api/planner`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.data), "Expected array of tasks");
    assert(data.data.length >= 1, "Expected at least 1 task");
  });

  // 8. Study Planner - Get Single Task
  await test("GET /api/planner/:id returns single task", async () => {
    const res = await fetch(`${baseUrl}/api/planner/${createdTaskId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.data.id === createdTaskId, "Task ID mismatch");
  });

  // 9. Study Planner - Complete Task
  await test("PATCH /api/planner/:id/complete marks task complete", async () => {
    const res = await fetch(`${baseUrl}/api/planner/${createdTaskId}/complete`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed: true }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.data.completed === true, "Task completed was not true");
  });

  // 10. Study Planner - Update Task
  await test("PUT /api/planner/:id updates task details", async () => {
    const res = await fetch(`${baseUrl}/api/planner/${createdTaskId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priority: "low" }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.data.priority === "low", "Priority was not updated");
  });

  // 11. Study Planner - Delete Task
  await test("DELETE /api/planner/:id deletes task", async () => {
    const res = await fetch(`${baseUrl}/api/planner/${createdTaskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 204, `Expected 204, got ${res.status}`);
  });

  // 12. Notifications - Create Notification
  await test("POST /api/notifications creates new notification", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Notification",
        message: "Testing Prisma notifications flow",
        type: "reminder",
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.data.title === "Test Notification", "Title mismatch");
    createdNotifId = data.data.id;
  });

  // 13. Notifications - List Notifications
  await test("GET /api/notifications returns notification list", async () => {
    const res = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.data), "Expected array of notifications");
  });

  // 14. Notifications - Mark Single Read
  await test("PATCH /api/notifications/:id/read marks notification as read", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/${createdNotifId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 15. Notifications - Mark All Read
  await test("PATCH /api/notifications/read-all marks all notifications as read", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 16. Notifications - Delete Single
  await test("DELETE /api/notifications/:id deletes notification", async () => {
    const res = await fetch(`${baseUrl}/api/notifications/${createdNotifId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(res.status === 204, `Expected 204, got ${res.status}`);
  });

  // 17. Forgot Password & Reset Password Flow
  await test("POST /api/auth/forgot-password and POST /api/auth/reset-password flow", async () => {
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex@studysync.io" }),
    });
    assert(forgotRes.status === 200, `Expected 200, got ${forgotRes.status}`);
    const forgotData = await forgotRes.json();
    assert(forgotData.success === true, "Expected success true");
    const devToken = forgotData._dev_token;
    assert(devToken, "Expected _dev_token in response when SMTP is unconfigured");

    // Verify token
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-reset-token?token=${devToken}`);
    const verifyData = await verifyRes.json();
    assert(verifyData.valid === true, "Expected valid token");

    // Reset password
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: devToken,
        newPassword: "newpassword456",
      }),
    });
    assert(resetRes.status === 200, `Expected 200, got ${resetRes.status}`);

    // Verify login with new password
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex@studysync.io",
        password: "newpassword456",
      }),
    });
    assert(loginRes.status === 200, `Expected 200, got ${loginRes.status}`);
  });

  server.close();
  console.log(`\n========================================`);
  console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
