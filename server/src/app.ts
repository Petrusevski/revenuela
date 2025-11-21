import express from "express";
import cors from "cors";
import leadsRouter from "./routes/leads";
import accountsRouter from "./routes/accounts";
import dealsRouter from "./routes/deals";
import workflowsRouter from "./routes/workflows";
import appsRouter from "./routes/apps";
import assistantRouter from "./routes/assistant";
import settingsRouter from "./routes/settings";
import authRouter from "./routes/auth";
import notificationsRouter from "./routes/notifications";
import dashboardRouter from "./routes/dashboard";
import journeysRouter from "./routes/journeys";
import performanceRouter from "./routes/performance";
import activityRouter from "./routes/activity";

// Corrected imports (consolidated)
import workspaceRoutes from "./routes/workspaces"; 
import integrationRoutes from "./routes/integrations"; // Only import once
import vaultRoutes from "./routes/vault"; 

const app = express();

app.use(cors());
app.use(express.json());

// Simple healthcheck
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "revenuela-backend" });
});

// API routes
app.use("/api/leads", leadsRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/workflows", workflowsRouter);
app.use("/api/apps", appsRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/journeys", journeysRouter);
app.use("/api/performance", performanceRouter);
app.use("/api/activity", activityRouter);

// New routes
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/integrations", integrationRoutes); // Use the single router here
app.use("/api/vault", vaultRoutes);

export default app;