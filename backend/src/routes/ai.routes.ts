import { Router } from "express";
import { examStrategy, recoveryCoach, studyInsights, studyStrategy, whyThis } from "../controllers/ai.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.use(requireAuth);
router.post("/study-strategy", studyStrategy);
router.post("/why-this", whyThis);
router.post("/recovery-coach", recoveryCoach);
router.get("/exam-strategy", examStrategy);
router.get("/insights", studyInsights);
export default router;
