import { Model, Schema, Types, model } from "mongoose";

export type StudySessionStatus =
  | "planned"
  | "done"
  | "partial"
  | "missed";

export type StudySessionFeedback =
  | "easy"
  | "okay"
  | "difficult";

export interface IStudySession {
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  strategy: string;
  priorityScore: number;
  why: string;
  status: StudySessionStatus;
  feedback: StudySessionFeedback | null;
}

export interface IStudyPlan {
  userId: Types.ObjectId;
  plannerProfileId: Types.ObjectId;
  generatedAt: Date;
  sessions: IStudySession[];
  createdAt: Date;
  updatedAt: Date;
}

const studySessionSchema = new Schema<IStudySession>(
  {
    date: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    strategy: {
      type: String,
      required: true,
      trim: true,
    },

    priorityScore: {
      type: Number,
      required: true,
      min: 0,
    },

    why: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["planned", "done", "partial", "missed"],
      default: "planned",
    },

    feedback: {
      type: String,
      enum: ["easy", "okay", "difficult"],
      default: null,
    },
  },
  {
    _id: true,
  },
);

const studyPlanSchema = new Schema<IStudyPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    plannerProfileId: {
      type: Schema.Types.ObjectId,
      ref: "PlannerProfile",
      required: true,
    },

    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    sessions: {
      type: [studySessionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const StudyPlan: Model<IStudyPlan> = model<IStudyPlan>(
  "StudyPlan",
  studyPlanSchema,
);

export default StudyPlan;