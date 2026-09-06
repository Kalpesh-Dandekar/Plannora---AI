import type { Response } from "express";
import { Types } from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import PlannerProfile from "../models/PlannerProfile.js";
import StudyPlan from "../models/StudyPlan.js";
import { generateStudySessions } from "../services/scheduler.service.js";
import {
  createQuickPlan,
  rescueStudyPlan,
} from "../services/plan-actions.service.js";

export async function generateStudyPlan(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!Types.ObjectId.isValid(req.userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    const userId = req.userId;

    const plannerProfile = await PlannerProfile.findOne({
      userId,
    } as any);

    if (!plannerProfile) {
      res.status(404).json({
        success: false,
        message: "Planner setup has not been created yet.",
      });
      return;
    }

    const sessions = generateStudySessions(plannerProfile);

    if (sessions.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "A study plan could not be generated from the current availability.",
      });
      return;
    }

    const studyPlan = await StudyPlan.findOneAndUpdate(
      {
        userId,
      } as any,
      {
        $set: {
          userId,
          plannerProfileId: plannerProfile._id,
          generatedAt: new Date(),
          sessions,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "Study plan generated successfully.",
      plan: studyPlan,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown study plan generation error";

    console.error(`Study plan generation failed: ${message}`);

    res.status(500).json({
      success: false,
      message: "Unable to generate your study plan right now.",
    });
  }
}

export async function getStudyPlan(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!Types.ObjectId.isValid(req.userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
      return;
    }

    const userId = req.userId;

    const studyPlan = await StudyPlan.findOne({
      userId,
    } as any);

    if (!studyPlan) {
      res.status(404).json({
        success: false,
        message: "Study plan has not been generated yet.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      plan: studyPlan,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown study plan fetch error";

    console.error(`Study plan fetch failed: ${message}`);

    res.status(500).json({
      success: false,
      message: "Unable to load your study plan right now.",
    });
  }
}

export async function rescuePlan(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId || !Types.ObjectId.isValid(req.userId)) {
      res.status(401).json({ success: false, message: "Invalid authentication token." });
      return;
    }
    const [studyPlan, plannerProfile] = await Promise.all([
      StudyPlan.findOne({ userId: req.userId } as any),
      PlannerProfile.findOne({ userId: req.userId } as any),
    ]);
    if (!plannerProfile) {
      res.status(404).json({ success: false, message: "Planner setup has not been created yet." });
      return;
    }
    if (!studyPlan) {
      res.status(404).json({ success: false, message: "Study plan has not been generated yet." });
      return;
    }
    const rescue = rescueStudyPlan(studyPlan.sessions, plannerProfile);
    await studyPlan.save();
    res.status(200).json({
      success: true,
      message: rescue.remainingUnscheduledMinutes
        ? "The remaining plan was rebalanced, but some work could not fit within current capacity."
        : "The remaining study plan was rebalanced successfully.",
      rescue,
      plan: studyPlan,
    });
  } catch (error) {
    console.error(`Study plan rescue failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(500).json({ success: false, message: "Unable to rescue your study plan right now." });
  }
}

export async function quickReplan(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId || !Types.ObjectId.isValid(req.userId)) {
      res.status(401).json({ success: false, message: "Invalid authentication token." });
      return;
    }
    const minutes = (req.body as { minutes?: unknown }).minutes;
    if (!Number.isInteger(minutes) || (minutes as number) <= 0 || (minutes as number) > 360) {
      res.status(400).json({ success: false, message: "Minutes must be a positive integer no greater than 360." });
      return;
    }
    const studyPlan = await StudyPlan.findOne({ userId: req.userId } as any);
    if (!studyPlan) {
      res.status(404).json({ success: false, message: "Study plan has not been generated yet." });
      return;
    }
    res.status(200).json({ success: true, quickPlan: createQuickPlan(studyPlan.sessions, minutes as number) });
  } catch (error) {
    console.error(`Quick replan failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    res.status(500).json({ success: false, message: "Unable to create a quick study plan right now." });
  }
}
