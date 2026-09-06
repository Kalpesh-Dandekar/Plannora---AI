import { Router } from "express";

import {
  generateStudyPlan,
  getStudyPlan,
  quickReplan,
  rescuePlan,
} from "../controllers/study-plan.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getStudyPlan);
router.post("/generate", requireAuth, generateStudyPlan);
router.post("/rescue", requireAuth, rescuePlan);
router.post("/quick-replan", requireAuth, quickReplan);

export default router;
