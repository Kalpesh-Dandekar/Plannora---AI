import type { Response } from "express";
import { Types } from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import PlannerProfile from "../models/PlannerProfile.js";
import User from "../models/User.js";

function isAuthorized(req: AuthenticatedRequest, res: Response): req is AuthenticatedRequest & { userId: string } {
  if (!req.userId || !Types.ObjectId.isValid(req.userId)) {
    res.status(401).json({ success: false, message: "Invalid authentication token." });
    return false;
  }
  return true;
}

export async function getAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isAuthorized(req, res)) return;
    const [user, profile] = await Promise.all([
      User.findById(req.userId),
      PlannerProfile.findOne({ userId: req.userId } as any),
    ]);
    if (!user) { res.status(404).json({ success: false, message: "Account was not found." }); return; }
    res.json({ success: true, account: { name: user.name, email: user.email, createdAt: user.createdAt, mode: profile?.mode ?? null } });
  } catch (error) {
    console.error(`Account fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(500).json({ success: false, message: "Unable to load your account right now." });
  }
}

export async function updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!isAuthorized(req, res)) return;
    const { name, email } = req.body as { name?: string; email?: string };
    const updates: { name?: string; email?: string } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
        res.status(400).json({ success: false, message: "Name must be between 2 and 80 characters." }); return;
      }
      updates.name = name.trim();
    }
    if (email !== undefined) {
      const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        res.status(400).json({ success: false, message: "Please provide a valid email address." }); return;
      }
      const conflict = await User.exists({ email: normalized, _id: { $ne: req.userId } });
      if (conflict) { res.status(409).json({ success: false, message: "An account with this email already exists." }); return; }
      updates.email = normalized;
    }
    if (!Object.keys(updates).length) { res.status(400).json({ success: false, message: "Name or email is required." }); return; }
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true, runValidators: true });
    if (!user) { res.status(404).json({ success: false, message: "Account was not found." }); return; }
    res.json({ success: true, message: "Account updated successfully.", account: { name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (error) {
    console.error(`Account update failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(500).json({ success: false, message: "Unable to update your account right now." });
  }
}
