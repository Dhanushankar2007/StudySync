/**
 * verify-pg-counts.js
 *
 * Connects to PostgreSQL using Prisma and prints the record counts
 * for users, notifications, and tasks.
 */

const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const prisma = require("./prisma");

async function checkCounts() {
  console.log("🔍 Checking PostgreSQL record counts...\n");

  const [users, notifications, tasks] = await Promise.all([
    prisma.user.count(),
    prisma.notification.count(),
    prisma.task.count(),
  ]);

  console.log("📊 PostgreSQL Database Record Counts:");
  console.log(`   - Users:         ${users}  (Expected baseline: 2)`);
  console.log(`   - Notifications: ${notifications}  (Expected baseline: 5)`);
  console.log(`   - Tasks:         ${tasks}  (Expected baseline: 3)\n`);

  if (users >= 2 && notifications >= 5 && tasks >= 3) {
    console.log("✅ All baseline records verified successfully in PostgreSQL!");
  } else {
    console.log("ℹ️  Note: Record counts are below baseline. Run 'npm run db:migrate-sqlite' to migrate SQLite records.");
  }

  // Also print registered user emails (without exposing hashes)
  const userList = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  console.log("\n👥 Registered Users in PostgreSQL:");
  userList.forEach(u => console.log(`   - ${u.name} (${u.email}) [${u.id}]`));
}

checkCounts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Connection or query failed:", err.message);
    process.exit(1);
  });
