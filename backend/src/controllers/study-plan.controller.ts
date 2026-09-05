import type { Response } from "express";
import { Types } from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import PlannerProfile from "../models/PlannerProfile.js";
import StudyPlan from "../models/StudyPlan.js";
import { generateStudySessions } from "../services/scheduler.service.js";

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