import cors from "cors";
import express from "express";

import healthRouter from "./routes/health.routes.js";

const app = express();
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({ origin: frontendUrl }));
app.use(express.json());
app.use("/health", healthRouter);

export default app;
