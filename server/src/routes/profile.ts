import { Router } from "express";
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

/** GET /api/profile — returns current user's personal info */
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

/** PUT /api/profile — update name and/or email */
router.put("/", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { fullName, email } = req.body || {};

    const data: any = {};
    if (fullName && typeof fullName === "string") data.fullName = fullName.trim();
    if (email && typeof email === "string") {
      const normalized = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return res.status(400).json({ error: "Invalid email address." });
      }
      const conflict = await prisma.user.findFirst({ where: { email: normalized, NOT: { id: userId } } });
      if (conflict) return res.status(409).json({ error: "Email already in use." });
      data.email = normalized;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, fullName: true, email: true, createdAt: true },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

/** PUT /api/profile/password — change password */
router.put("/password", async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both currentPassword and newPassword are required." });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return res.status(404).json({ error: "User not found." });
    }

    const valid = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect." });

    const newHash = await bcrypt.hash(String(newPassword), 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
