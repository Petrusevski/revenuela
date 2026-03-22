import { Router } from "express";
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET env variable is missing or too short.");
}

function createToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET!, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ error: "Invalid email address." });
    }

    // Minimum password strength
    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { fullName: String(fullName).trim(), email: String(email).toLowerCase().trim(), passwordHash },
      });

      const slug = `${String(fullName).toLowerCase().replace(/[^a-z0-9]/g, "-")}-${uuidv4().slice(0, 4)}`;
      const workspace = await tx.workspace.create({
        data: {
          name: `${String(fullName).trim()}'s Workspace`,
          slug,
          plan: "trial",
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          users: {
            create: { userId: user.id, role: "owner" },
          },
        },
      });

      return { user, workspace };
    });

    const token = createToken(result.user);

    return res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName },
      workspaceId: result.workspace.id,
    });
  } catch (err: any) {
    console.error("Register error:", err.message);
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });

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
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Failed to login" });
  }
});

export default router;
