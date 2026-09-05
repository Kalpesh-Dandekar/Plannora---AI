import cors from "cors";
import express from "express";

import authRouter from "./routes/auth.routes.js";
import healthRouter from "./routes/health.routes.js";
import plannerRouter from "./routes/planner.routes.js";
import sessionRouter from "./routes/session.routes.js";
import studyPlanRouter from "./routes/study-plan.routes.js";

const app = express();

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(
  cors({
    origin: frontendUrl,
  }),
);

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/planner", plannerRouter);
app.use("/api/study-plan", studyPlanRouter);
app.use("/api/sessions", sessionRouter);

export default app;