const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");

require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});

const prisma = require("./prisma");

async function migrateSqliteToPg() {
  const dbPath = path.join(__dirname, "../../data/studysync.db");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!fs.existsSync(dbPath)) {
    throw new Error("SQLite database not found: " + dbPath);
  }

  const sqlite = new DatabaseSync(dbPath, { readOnly: true });

  try {
    const users = sqlite.prepare("SELECT * FROM users").all();
    const notifications = sqlite.prepare("SELECT * FROM notifications").all();
    const tasks = sqlite.prepare("SELECT * FROM tasks").all();

    console.log("SQLite records found:", {
      users: users.length,
      notifications: notifications.length,
      tasks: tasks.length,
    });

    const result = await prisma.$transaction(async (tx) => {
      const [existingUsers, existingNotifications, existingTasks] =
        await Promise.all([
          tx.user.count(),
          tx.notification.count(),
          tx.task.count(),
        ]);

      if (existingUsers || existingNotifications || existingTasks) {
        throw new Error(
          "PostgreSQL already contains records. Migration stopped to protect existing data."
        );
      }

      if (users.length) {
        await tx.user.createMany({
          data: users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            passwordHash: u.password_hash,
            resetToken: u.reset_token || null,
            resetTokenExpires: u.reset_token_expires
              ? new Date(u.reset_token_expires)
              : null,
            createdAt: u.created_at ? new Date(u.created_at) : new Date(),
            updatedAt: u.updated_at ? new Date(u.updated_at) : new Date(),
          })),
        });
      }

      if (notifications.length) {
        await tx.notification.createMany({
          data: notifications.map((n) => ({
            id: n.id,
            userId: n.user_id || null,
            title: n.title,
            message: n.message,
            type: n.type || "general",
            read: Boolean(n.read),
            link: n.link || null,
            createdAt: n.created_at ? new Date(n.created_at) : new Date(),
          })),
        });
      }

      if (tasks.length) {
        await tx.task.createMany({
          data: tasks.map((t) => ({
            id: Number(t.id),
            userId: t.user_id || null,
            title: t.title,
            description: t.description || null,
            deadline: t.deadline || null,
            priority: t.priority || "medium",
            completed: Boolean(t.completed),
            createdAt: t.created_at ? new Date(t.created_at) : new Date(),
            updatedAt: t.updated_at ? new Date(t.updated_at) : new Date(),
          })),
        });
      }

      await tx.$queryRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('"tasks"', 'id'),
          COALESCE(MAX(id), 1),
          COUNT(*) > 0
        )
        FROM "tasks"
      `);

      return {
        users: users.length,
        notifications: notifications.length,
        tasks: tasks.length,
      };
    }, { maxWait: 15000, timeout: 60000 });

    console.log("Migration completed successfully:", result);
    return result;
  } finally {
    sqlite.close();
  }
}

if (require.main === module) {
  migrateSqliteToPg()
    .catch((error) => {
      console.error("Migration failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = migrateSqliteToPg;
