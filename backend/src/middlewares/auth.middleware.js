const { verifyToken } = require("../utils/token");
const prisma = require("../db/prisma");

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const createdAtIso = user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt;
    req.user = {
      ...user,
      createdAt: createdAtIso,
      created_at: createdAtIso,
    };
    next();
  } catch (error) {
    console.error("requireAuth error:", error);
    return res.status(500).json({ message: "Authentication check failed" });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.id) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { id: true, name: true, email: true, createdAt: true },
        });
        if (user) {
          const createdAtIso = user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt;
          req.user = {
            ...user,
            createdAt: createdAtIso,
            created_at: createdAtIso,
          };
        }
      }
    }
  } catch (error) {
    console.warn("optionalAuth check failed:", error.message);
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};
