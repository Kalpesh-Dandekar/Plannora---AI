import { Router } from "express";

import {
  generateStudyPlan,
  getStudyPlan,
} from "../controllers/study-plan.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getStudyPlan);
router.post("/generate", requireAuth, generateStudyPlan);

export default router;