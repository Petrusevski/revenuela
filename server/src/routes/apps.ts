// server/src/routes/apps.ts
import { Router, Request, Response } from "express";
import { APP_CATALOG } from "../workflow/catalog";
import type { AppDefinition } from "../workflow/types";

const router = Router();

// List all apps and nodes
router.get("/", (_req: Request, res: Response) => {
  res.json(APP_CATALOG);
});

// Get single app by id
router.get("/:id", (req: Request, res: Response) => {
  const app = APP_CATALOG.find((a: AppDefinition) => a.id === req.params.id);

  if (!app) {
    return res.status(404).json({ error: "App not found" });
  }

  res.json(app);
});

export default router;
