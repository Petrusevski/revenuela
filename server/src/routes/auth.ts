import { Router } from "express";
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function createToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  console.log("📝 Register request received:", req.body.email); // DEBUG LOG

  try {
    const { fullName, email, password } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      console.log("🔄 Starting transaction..."); // DEBUG LOG

      // 1. Create User
      const user = await tx.user.create({
        data: { fullName, email, passwordHash },
      });
      console.log("✅ User created:", user.id); // DEBUG LOG

      // 2. Create Workspace
      const slug = `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${uuidv4().slice(0, 4)}`;
      
      const workspace = await tx.workspace.create({
        data: {
          name: `${fullName}'s Workspace`,
          slug: slug,
          users: {
            create: {
              userId: user.id,
              role: "owner",
            },
          },
        },
      });
      console.log("✅ Workspace created:", workspace.id); // DEBUG LOG

      return { user, workspace };
    });

    const token = createToken(result.user);

    return res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName },
      workspaceId: result.workspace.id,
    });

  } catch (err: any) {
    console.error("❌ Register Error:", err);
    return res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// Login route...
router.post("/login", async (req, res) => {
    // ... (keep your existing login logic here)
    try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = createToken(user);

    return res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    });
  } catch (err: any) {
    console.error("Login error", err);
    return res.status(500).json({ error: "Failed to login" });
  }
});

export default router;