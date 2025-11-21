import { Router } from "express";
import { prisma } from "../db";

const router = Router();

// List deals
router.get("/", async (req, res) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || undefined;

    const deals = await prisma.deal.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      include: {
        account: true,
        primaryContact: true
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(deals);
  } catch (err) {
    console.error("Error fetching deals", err);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

// Create deal
router.post("/", async (req, res) => {
  try {
    const {
      workspaceId,
      accountId,
      primaryContactId,
      name,
      pipeline,
      stage,
      amount,
      currency,
      expectedCloseDate,
      probability,
      ownerId
    } = req.body;

    if (!workspaceId || !accountId || !name) {
      return res
        .status(400)
        .json({ error: "workspaceId, accountId and name are required" });
    }

    const deal = await prisma.deal.create({
      data: {
        workspaceId,
        accountId,
        primaryContactId,
        name,
        pipeline,
        stage,
        amount,
        currency,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        probability,
        ownerId
      }
    });

    res.status(201).json(deal);
  } catch (err) {
    console.error("Error creating deal", err);
    res.status(500).json({ error: "Failed to create deal" });
  }
});

// Get single deal
router.get("/:id", async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: req.params.id },
      include: {
        account: true,
        primaryContact: true
      }
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    res.json(deal);
  } catch (err) {
    console.error("Error fetching deal", err);
    res.status(500).json({ error: "Failed to fetch deal" });
  }
});

// Update deal
router.put("/:id", async (req, res) => {
  try {
    const data = req.body;

    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data
    });

    res.json(deal);
  } catch (err) {
    console.error("Error updating deal", err);
    res.status(500).json({ error: "Failed to update deal" });
  }
});

// Delete deal
router.delete("/:id", async (req, res) => {
  try {
    await prisma.deal.delete({
      where: { id: req.params.id }
    });
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting deal", err);
    res.status(500).json({ error: "Failed to delete deal" });
  }
});

export default router;
