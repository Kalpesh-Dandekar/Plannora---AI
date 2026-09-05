import cors from "cors";
import express from "express";

import authRouter from "./routes/auth.routes.js";
import healthRouter from "./routes/health.routes.js";

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

export default app;