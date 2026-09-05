import { Router } from "express";

import { updateStudySession } from "../controllers/session.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.patch("/:sessionId", requireAuth, updateStudySession);

export default router;