import type { Response } from "express";
import { Types } from "mongoose";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import PlannerProfile, {
  type PlannerMode,
  type PreparationLevel,
  type TopicDifficulty,
} from "../models/PlannerProfile.js";

const validModes: PlannerMode[] = ["regular", "exam"];

const validDifficulties: TopicDifficulty[] = ["Easy", "Medium", "Hard"];

const validPreparationLevels: PreparationLevel[] = [
  "Not Started",
  "Learning",
  "Revision Needed",
  "Confident",
];

const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

interface PlannerTopicInput {
  name?: string;
  difficulty?: string;
  prep?: string;
}

interface PlannerSubjectInput {
  name?: string;
  topics?: PlannerTopicInput[];
}

interface PlannerExamInput {
  name?: string;
  date?: string;
}

interface PlannerProfileInput {
  mode?: string;
  exam?: PlannerExamInput;
  subjects?: PlannerSubjectInput[];
  days?: Record<string, number>;
  period?: string;
  session?: string;
  goal?: string;
  attention?: string[];
  strategy?: string;
}

export async function savePlannerProfile(
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
    const body = req.body as PlannerProfileInput;

    if (!body.mode || !validModes.includes(body.mode as PlannerMode)) {
      res.status(400).json({
        success: false,
        message: "Please select a valid planning mode.",
      });
      return;
    }

    const mode = body.mode as PlannerMode;

    if (mode === "exam") {
      if (!body.exam?.name?.trim() || !body.exam.date) {
        res.status(400).json({
          success: false,
          message: "Exam name and exam date are required in exam mode.",
        });
        return;
      }

      const examDate = new Date(`${body.exam.date}T00:00:00`);

      if (Number.isNaN(examDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Please provide a valid exam date.",
        });
        return;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.exam.date)) {
        res.status(400).json({
          success: false,
          message: "Exam date must use YYYY-MM-DD format.",
        });
        return;
      }
    }

    if (!Array.isArray(body.subjects) || body.subjects.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one subject is required.",
      });
      return;
    }

    const subjects = [];

    for (const subject of body.subjects) {
      const subjectName = subject.name?.trim();

      if (!subjectName) {
        continue;
      }

      if (!Array.isArray(subject.topics)) {
        continue;
      }

      const topics = [];

      for (const topic of subject.topics) {
        const topicName = topic.name?.trim();

        if (!topicName) {
          continue;
        }

        if (
          !topic.difficulty ||
          !validDifficulties.includes(topic.difficulty as TopicDifficulty)
        ) {
          res.status(400).json({
            success: false,
            message: `Invalid difficulty for topic "${topicName}".`,
          });
          return;
        }

        if (
          !topic.prep ||
          !validPreparationLevels.includes(topic.prep as PreparationLevel)
        ) {
          res.status(400).json({
            success: false,
            message: `Invalid preparation level for topic "${topicName}".`,
          });
          return;
        }

        topics.push({
          name: topicName,
          difficulty: topic.difficulty as TopicDifficulty,
          prep: topic.prep as PreparationLevel,
        });
      }

      if (topics.length > 0) {
        subjects.push({
          name: subjectName,
          topics,
        });
      }
    }

    if (subjects.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one subject with one topic is required.",
      });
      return;
    }

    if (!body.days || typeof body.days !== "object") {
      res.status(400).json({
        success: false,
        message: "Weekly availability is required.",
      });
      return;
    }

    const days: Record<string, number> = {};

    for (const day of validDays) {
      const hours = body.days[day];

      if (
        typeof hours !== "number" ||
        !Number.isFinite(hours) ||
        hours < 0 ||
        hours > 24
      ) {
        res.status(400).json({
          success: false,
          message: `Invalid availability for ${day}.`,
        });
        return;
      }

      days[day] = hours;
    }

    if (!body.period?.trim()) {
      res.status(400).json({
        success: false,
        message: "Preferred study period is required.",
      });
      return;
    }

    if (!body.session?.trim()) {
      res.status(400).json({
        success: false,
        message: "Study session length is required.",
      });
      return;
    }

    if (!body.goal?.trim()) {
      res.status(400).json({
        success: false,
        message: "Study goal is required.",
      });
      return;
    }

    if (!body.strategy?.trim()) {
      res.status(400).json({
        success: false,
        message: "Study strategy is required.",
      });
      return;
    }

    const attention = Array.isArray(body.attention)
      ? body.attention
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const exam =
      mode === "exam"
        ? {
            name: body.exam!.name!.trim(),
            date: body.exam!.date!,
          }
        : {
            name: "",
            date: null,
          };

    const profile = await PlannerProfile.findOneAndUpdate(
      {
        userId,
      } as any,
      {
        $set: {
          userId,
          mode,
          exam,
          subjects,
          days,
          period: body.period.trim(),
          session: body.session.trim(),
          goal: body.goal.trim(),
          attention,
          strategy: body.strategy.trim(),
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
      message: "Planner setup saved successfully.",
      profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown planner save error";

    console.error(`Planner profile save failed: ${message}`);

    res.status(500).json({
      success: false,
      message: "Unable to save your planner setup right now.",
    });
  }
}

export async function getPlannerProfile(
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

    const profile = await PlannerProfile.findOne({
      userId,
    } as any);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Planner setup has not been created yet.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown planner fetch error";

    console.error(`Planner profile fetch failed: ${message}`);

    res.status(500).json({
      success: false,
      message: "Unable to load your planner setup right now.",
    });
  }
}