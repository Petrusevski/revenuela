import { Router, Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/proxy/favicon?domain=apollo.io
// Fetches Google's favicon service and pipes the image back as same-origin,
// so html2canvas can capture it without CORS issues.
// ─────────────────────────────────────────────────────────────────────────────
router.get("/favicon", async (req: Request, res: Response) => {
  const domain = req.query.domain as string;
  if (!domain) return res.status(400).send("domain required");

  // Basic validation — only allow simple domain strings
  if (!/^[a-zA-Z0-9._-]+$/.test(domain)) {
    return res.status(400).send("invalid domain");
  }

  try {
    const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
    const upstream = await axios.get<Buffer>(url, {
      responseType: "arraybuffer",
      timeout: 5000,
    });

    const contentType = upstream.headers["content-type"] ?? "image/png";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400"); // cache 24h
    return res.send(upstream.data);
  } catch {
    // Return a 1x1 transparent PNG on error so the img tag doesn't break
    const empty = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    res.set("Content-Type", "image/png");
    return res.send(empty);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/proxy/snapshot
// Body: { imageBase64: "data:image/png;base64,..." }
// Saves the image to public/snapshots/ and returns a public URL
// ─────────────────────────────────────────────────────────────────────────────
router.post("/snapshot", (req: Request, res: Response) => {
  const { imageBase64 } = req.body as { imageBase64?: string };
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer     = Buffer.from(base64Data, "base64");
    const filename   = `${uuidv4()}.png`;
    const dir        = path.join(__dirname, "../../../public/snapshots");

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);

    const baseUrl = process.env.SERVER_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
    return res.json({ url: `${baseUrl}/public/snapshots/${filename}` });
  } catch (err) {
    console.error("[proxy/snapshot]", err);
    return res.status(500).json({ error: "Failed to save snapshot" });
  }
});

export default router;
