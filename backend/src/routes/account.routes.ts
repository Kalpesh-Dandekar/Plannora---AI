import { Router } from "express";

import { getAccount, updateAccount } from "../controllers/account.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.get("/", requireAuth, getAccount);
router.patch("/", requireAuth, updateAccount);
export default router;
