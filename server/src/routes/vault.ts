import { Router } from "express";
import { prisma } from "../db";
import { encrypt } from "../utils/encryption";

const router = Router();

// Save integration secrets
router.post("/save", async (req, res) => {
  const { provider, workspaceId, secrets } = req.body;

  if (!provider || !workspaceId || !secrets) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const encrypted = encrypt(JSON.stringify(secrets));

  let conn = await prisma.integrationConnection.findFirst({
    where: { provider, workspaceId }
  });

  if (!conn) {
    conn = await prisma.integrationConnection.create({
      data: {
        provider,
        workspaceId,
        status: "not_connected",
        authData: encrypted,
      },
    });
  } else {
    conn = await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { authData: encrypted }
    });
  }

  return res.json({ ok: true });
});

export default router;
