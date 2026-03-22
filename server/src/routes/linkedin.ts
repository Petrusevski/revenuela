import { Router, Request, Response } from "express";
import axios from "axios";
import { prisma } from "../db";
import { encrypt, decrypt } from "../utils/encryption";
import { requireAuth } from "../middleware/auth";

const router = Router();

const CLIENT_ID    = process.env.LINKEDIN_CLIENT_ID     ?? "";
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET ?? "";
const REDIRECT_URI  = process.env.LINKEDIN_REDIRECT_URI  ?? "http://localhost:3000/api/linkedin/callback";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/linkedin/auth?workspaceId=
// Opens in a popup — redirects to LinkedIn OAuth
// ─────────────────────────────────────────────────────────────────────────────
router.get("/auth", (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string;
  if (!workspaceId) return res.status(400).send("workspaceId required");
  if (!CLIENT_ID)   return res.status(500).send("LinkedIn OAuth not configured (missing LINKEDIN_CLIENT_ID)");

  const state = Buffer.from(workspaceId).toString("base64url");
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "openid profile w_member_social");
  url.searchParams.set("state", state);

  return res.redirect(url.toString());
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/linkedin/callback
// LinkedIn redirects here — exchanges code, stores token, closes popup
// ─────────────────────────────────────────────────────────────────────────────
router.get("/callback", async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query as Record<string, string>;

  const closePopup = (ok: boolean, detail?: string) => {
    const payload = JSON.stringify({ type: "linkedin_oauth", ok, detail: detail ?? "" });
    res.send(`<!DOCTYPE html>
<html><head><title>LinkedIn Auth</title></head>
<body style="background:#020617;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <p>${ok ? "✓ Connected! Closing…" : "✗ " + (detail ?? "Failed")}</p>
  <script>
    try { window.opener?.postMessage(${payload}, "*"); } catch(e) {}
    setTimeout(() => window.close(), 800);
  </script>
</body></html>`);
  };

  if (error || !code) return closePopup(false, error_description ?? "OAuth denied");

  let workspaceId: string;
  try {
    workspaceId = Buffer.from(state, "base64url").toString();
  } catch {
    return closePopup(false, "Invalid state parameter");
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await axios.post<{ access_token: string; expires_in: number }>(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type:    "authorization_code",
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, expires_in } = tokenRes.data;

    // Fetch profile — `sub` is the member ID
    const profileRes = await axios.get<{ sub: string; name?: string; picture?: string }>(
      "https://api.linkedin.com/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const personId  = profileRes.data.sub;
    const personUrn = `urn:li:person:${personId}`;
    const name      = profileRes.data.name ?? "";
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const authData = encrypt(JSON.stringify({ accessToken: access_token, expiresAt, personUrn, name }));

    // Upsert connection record
    const existing = await prisma.integrationConnection.findFirst({
      where: { workspaceId, provider: "linkedin_oauth" },
    });
    if (existing) {
      await prisma.integrationConnection.update({
        where: { id: existing.id },
        data:  { authData, status: "connected", updatedAt: new Date() },
      });
    } else {
      await prisma.integrationConnection.create({
        data: { workspaceId, provider: "linkedin_oauth", status: "connected", authData },
      });
    }

    return closePopup(true, name);
  } catch (err: any) {
    console.error("[linkedin/callback]", err?.response?.data ?? err?.message);
    return closePopup(false, "Token exchange failed");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/linkedin/status?workspaceId=
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  const workspaceId = req.query.workspaceId as string;
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  try {
    const conn = await prisma.integrationConnection.findFirst({
      where: { workspaceId, provider: "linkedin_oauth", status: "connected" },
    });
    if (!conn?.authData) return res.json({ connected: false });

    const data    = JSON.parse(decrypt(conn.authData));
    const expired = data.expiresAt && new Date(data.expiresAt) < new Date();
    return res.json({ connected: !expired, name: data.name ?? "", expiresAt: data.expiresAt });
  } catch {
    return res.json({ connected: false });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/linkedin/disconnect
// Body or query: { workspaceId }
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/disconnect", requireAuth, async (req: Request, res: Response) => {
  const workspaceId = (req.body?.workspaceId ?? req.query.workspaceId) as string;
  if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

  await prisma.integrationConnection.updateMany({
    where: { workspaceId, provider: "linkedin_oauth" },
    data:  { status: "disconnected" },
  });
  return res.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/linkedin/post
// Body: { workspaceId, text, imageBase64? }
// Uploads image (if provided) and creates a LinkedIn post
// ─────────────────────────────────────────────────────────────────────────────
router.post("/post", requireAuth, async (req: Request, res: Response) => {
  const { workspaceId, text, imageBase64 } = req.body as {
    workspaceId: string;
    text: string;
    imageBase64?: string;
  };
  if (!workspaceId || !text) return res.status(400).json({ error: "workspaceId and text required" });

  const conn = await prisma.integrationConnection.findFirst({
    where: { workspaceId, provider: "linkedin_oauth", status: "connected" },
  });
  if (!conn?.authData) return res.status(401).json({ error: "LinkedIn not connected" });

  let data: { accessToken: string; expiresAt: string; personUrn: string; name: string };
  try {
    data = JSON.parse(decrypt(conn.authData));
  } catch {
    return res.status(500).json({ error: "Could not read LinkedIn credentials" });
  }

  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    return res.status(401).json({ error: "LinkedIn token expired — please reconnect." });
  }

  const token      = data.accessToken;
  const personUrn  = data.personUrn;
  const liHeaders  = {
    Authorization:                `Bearer ${token}`,
    "Content-Type":               "application/json",
    "LinkedIn-Version":           "202408",
    "X-Restli-Protocol-Version":  "2.0.0",
  };

  try {
    let mediaId: string | null = null;

    // ── Image upload (if provided) ──────────────────────────────────────────
    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer  = Buffer.from(base64Data, "base64");

      // 1. Initialize upload
      const initRes = await axios.post<{ value: { uploadUrl: string; image: string } }>(
        "https://api.linkedin.com/rest/images?action=initializeUpload",
        { initializeUploadRequest: { owner: personUrn } },
        { headers: liHeaders }
      );
      const { uploadUrl, image } = initRes.data.value;
      mediaId = image;

      // 2. Upload binary to the signed URL
      await axios.put(uploadUrl, imgBuffer, {
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
    }

    // ── Create post ─────────────────────────────────────────────────────────
    const postBody: Record<string, unknown> = {
      author:       personUrn,
      commentary:   text,
      visibility:   "PUBLIC",
      distribution: {
        feedDistribution:           "MAIN_FEED",
        targetEntities:             [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState:            "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    if (mediaId) {
      postBody.content = {
        media: { altText: "GTM Stack Snapshot — iqpipe", id: mediaId },
      };
    }

    const postRes = await axios.post(
      "https://api.linkedin.com/rest/posts",
      postBody,
      { headers: liHeaders }
    );

    const postId = postRes.headers["x-restli-id"] ?? postRes.headers["location"] ?? null;
    return res.json({ ok: true, postId });

  } catch (err: any) {
    const detail = err?.response?.data ?? err?.message ?? "Unknown error";
    console.error("[linkedin/post]", JSON.stringify(detail));
    return res.status(500).json({ error: "Failed to post to LinkedIn", detail });
  }
});

export default router;
