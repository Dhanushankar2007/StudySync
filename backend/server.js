require("dotenv").config();

const app = require("./src/app");
const prisma = require("./src/db/prisma");

const PORT = process.env.PORT || 5050;

async function bootstrap() {
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$connect();
      console.log("🐘 Connected to PostgreSQL via Prisma (adapter-pg)");
    } catch (err) {
      console.error("⚠️  Database connection warning:", err.message);
    }
  } else {
    console.warn("⚠️  DATABASE_URL environment variable is not set. Please configure DATABASE_URL to connect to PostgreSQL.");
  }

  app.listen(PORT, () => {
    console.log(`StudySync backend running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
