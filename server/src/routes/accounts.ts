import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// List accounts
router.get("/", async (req, res) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || undefined;

    const accounts = await prisma.account.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: "desc" }
    });

    res.json(accounts);
  } catch (err) {
    console.error("Error fetching accounts", err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// Create account
router.post("/", async (req, res) => {
  try {
    const {
      workspaceId,
      name,
      domain,
      industry,
      employeeCount,
      country,
      city,
      websiteUrl,
      lifecycleStage,
      ownerId
    } = req.body;

    if (!workspaceId || !name) {
      return res
        .status(400)
        .json({ error: "workspaceId and name are required" });
    }

    const account = await prisma.account.create({
      data: {
        workspaceId,
        name,
        domain,
        industry,
        employeeCount,
        country,
        city,
        websiteUrl,
        lifecycleStage,
        ownerId
      }
    });

    res.status(201).json(account);
  } catch (err) {
    console.error("Error creating account", err);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Get single account
router.get("/:id", async (req, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: true,
        leads: true,
        deals: true
      }
    });

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
  } catch (err) {
    console.error("Error fetching account", err);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

// Update account
router.put("/:id", async (req, res) => {
  try {
    const data = req.body;

    const account = await prisma.account.update({
      where: { id: req.params.id },
      data
    });

    res.json(account);
  } catch (err) {
    console.error("Error updating account", err);
    res.status(500).json({ error: "Failed to update account" });
  }
});

// Delete account
router.delete("/:id", async (req, res) => {
  try {
    await prisma.account.delete({
      where: { id: req.params.id }
    });
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting account", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
