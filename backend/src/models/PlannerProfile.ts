import { Model, Schema, Types, model } from "mongoose";

export type PlannerMode = "regular" | "exam";
export type TopicDifficulty = "Easy" | "Medium" | "Hard";
export type PreparationLevel =
  | "Not Started"
  | "Learning"
  | "Revision Needed"
  | "Confident";

export interface IPlannerTopic {
  name: string;
  difficulty: TopicDifficulty;
  prep: PreparationLevel;
}

export interface IPlannerSubject {
  name: string;
  topics: IPlannerTopic[];
}

export interface IPlannerExam {
  name: string;
  date: string | null;
}

export interface IPlannerProfile {
  userId: Types.ObjectId;
  mode: PlannerMode;
  exam: IPlannerExam;
  subjects: IPlannerSubject[];
  days: Record<string, number>;
  period: string;
  session: string;
  goal: string;
  attention: string[];
  strategy: string;
  createdAt: Date;
  updatedAt: Date;
}

const plannerTopicSchema = new Schema<IPlannerTopic>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Hard"],
    },

    prep: {
      type: String,
      required: true,
      enum: ["Not Started", "Learning", "Revision Needed", "Confident"],
    },
  },
  {
    _id: false,
  },
);

const plannerSubjectSchema = new Schema<IPlannerSubject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    topics: {
      type: [plannerTopicSchema],
      required: true,
      validate: {
        validator: (topics: IPlannerTopic[]) => topics.length > 0,
        message: "Each subject must contain at least one topic.",
      },
    },
  },
  {
    _id: false,
  },
);

const plannerExamSchema = new Schema<IPlannerExam>(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    date: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const plannerProfileSchema = new Schema<IPlannerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    mode: {
      type: String,
      required: true,
      enum: ["regular", "exam"],
    },

    exam: {
      type: plannerExamSchema,
      default: {
        name: "",
        date: null,
      },
    },

    subjects: {
      type: [plannerSubjectSchema],
      required: true,
      validate: {
        validator: (subjects: IPlannerSubject[]) => subjects.length > 0,
        message: "At least one subject is required.",
      },
    },

    days: {
      type: Map,
      of: Number,
      required: true,
      default: {},
    },

    period: {
      type: String,
      required: true,
      trim: true,
    },

    session: {
      type: String,
      required: true,
      trim: true,
    },

    goal: {
      type: String,
      required: true,
      trim: true,
    },

    attention: {
      type: [String],
      default: [],
    },

    strategy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const PlannerProfile: Model<IPlannerProfile> = model<IPlannerProfile>(
  "PlannerProfile",
  plannerProfileSchema,
);

export default PlannerProfile;