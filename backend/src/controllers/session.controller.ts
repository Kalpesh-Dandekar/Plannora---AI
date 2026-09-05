import type { Response } from "express";
import { Types } from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import StudyPlan, {
  type StudySessionFeedback,
  type StudySessionStatus,
} from "../models/StudyPlan.js";
import {
  applyAdaptiveAdjustment,
  calculateAdaptiveAdjustment,
} from "../services/adaptive.service.js";

const validStatuses: StudySessionStatus[] = [
  "planned",
  "done",
  "partial",
  "missed",
];

const validFeedback: StudySessionFeedback[] = [
  "easy",
  "okay",
  "difficult",
];

interface SessionUpdateInput {
  status?: string;
  feedback?: string | null;
}

export async function updateStudySession(
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

    const rawSessionId = req.params.sessionId;
    const sessionId = Array.isArray(rawSessionId)
      ? rawSessionId[0]
      : rawSessionId;

    if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid study session.",
      });
      return;
    }

    const body = req.body as SessionUpdateInput;

    if (
      !body.status ||
      !validStatuses.includes(body.status as StudySessionStatus) ||
      body.status === "planned"
    ) {
      res.status(400).json({
        success: false,
        message: "Status must be done, partial, or missed.",
      });
      return;
    }

    if (
      body.feedback !== undefined &&
      body.feedback !== null &&
      !validFeedback.includes(body.feedback as StudySessionFeedback)
    ) {
      res.status(400).json({
        success: false,
        message: "Feedback must be easy, okay, or difficult.",
      });
      return;
    }

    const studyPlan = await StudyPlan.findOne({
      userId: req.userId,
      "sessions._id": sessionId,
    } as any);

    if (!studyPlan) {
      res.status(404).json({
        success: false,
        message: "Study session was not found.",
      });
      return;
    }

    const session = studyPlan.sessions.find(
      (item) => String((item as any)._id) === sessionId,
    );

    if (!session) {
      res.status(404).json({
        success: false,
        message: "Study session was not found.",
      });
      return;
    }

    if (session.status !== "planned") {
      res.status(409).json({
        success: false,
        message: "This study session has already been completed or updated.",
      });
      return;
    }

    const status = body.status as StudySessionStatus;

    const feedback =
      body.feedback === undefined || body.feedback === null
        ? null
        : (body.feedback as StudySessionFeedback);

    session.status = status;
    session.feedback = feedback;

    const adaptiveResult = calculateAdaptiveAdjustment(
      status,
      feedback,
    );

    applyAdaptiveAdjustment(
      studyPlan.sessions,
      session.subject,
      session.topic,
      adaptiveResult.priorityAdjustment,
    );

    await studyPlan.save();

    res.status(200).json({
      success: true,
      message: "Study session updated successfully.",
      adaptation: adaptiveResult,
      session,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown study session update error";

    console.error(`Study session update failed: ${message}`);

    res.status(500).json({
      success: false,
      message: "Unable to update this study session right now.",
    });
  }
}