import { Router } from "express";

import { getDashboard, getExams, getProgress, getSubjects } from "../controllers/read-model.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const dashboardRouter = Router().get("/", requireAuth, getDashboard);
export const subjectsRouter = Router().get("/", requireAuth, getSubjects);
export const examsRouter = Router().get("/", requireAuth, getExams);
export const progressRouter = Router().get("/", requireAuth, getProgress);
