import { Router } from "express";

import {
  getPlannerProfile,
  savePlannerProfile,
} from "../controllers/planner.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getPlannerProfile);
router.put("/", requireAuth, savePlannerProfile);

export default router;