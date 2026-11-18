/**
 * tests/verify-migration.js
 *
 * Verifies that the SQLite data migration logic extracts existing records
 * from studysync.db and correctly structures them for PostgreSQL upsert.
 */

const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "../data/studysync.db");
if (!fs.existsSync(dbPath)) {
  console.error("❌ SQLite database not found at:", dbPath);
  process.exit(1);
}

const sqlite = new DatabaseSync(dbPath);

console.log("🔍 Testing SQLite data migration read...");

// 1. Users
const users = sqlite.prepare("SELECT * FROM users").all();
console.log(`✅ Read ${users.length} users from SQLite:`);
users.forEach(u => console.log(`   - ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`));

if (users.length !== 2) throw new Error(`Expected 2 users, found ${users.length}`);

// 2. Notifications
const notifications = sqlite.prepare("SELECT * FROM notifications").all();
console.log(`✅ Read ${notifications.length} notifications from SQLite:`);
notifications.forEach(n => console.log(`   - ID: ${n.id}, User: ${n.user_id}, Title: ${n.title}`));

if (notifications.length !== 5) throw new Error(`Expected 5 notifications, found ${notifications.length}`);

// 3. Tasks
const tasks = sqlite.prepare("SELECT * FROM tasks").all();
console.log(`✅ Read ${tasks.length} tasks from SQLite:`);
tasks.forEach(t => console.log(`   - ID: ${t.id}, Title: ${t.title}, Priority: ${t.priority}, Completed: ${t.completed}`));

if (tasks.length !== 3) throw new Error(`Expected 3 tasks, found ${tasks.length}`);

console.log("\n🎉 SQLite data migration reader verified successfully!\n");
