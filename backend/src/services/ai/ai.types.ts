export type AiSource = "ai" | "fallback";
export type StudyStrategyName = "Concepts" | "Practice" | "Revision" | "Active Recall" | "Concepts + Practice";
export type Risk = "low" | "medium" | "high";
export type ObservationType = "strength" | "warning" | "opportunity";

export interface TopicContext {
  subject: string;
  topic: string;
  difficulty: string;
  preparation: string;
  priorityScore: number;
  strategy: string;
  completedSessions: number;
  partialSessions: number;
  missedSessions: number;
  difficultFeedbackCount: number;
}

export interface AiContext {
  mode: string;
  exam: null | { name: string; date: string; daysRemaining: number | null };
  readiness: number;
  availability: { weeklyAvailableMinutes: number; zeroHourDays: string[]; preferredSessionMinutes: number };
  progress: { completionRate: number; completedMinutes: number; plannedMinutes: number; streak: number; feedback: { easy: number; okay: number; difficult: number } };
  priorityTopics: TopicContext[];
  weakAreas: TopicContext[];
  strongAreas: TopicContext[];
}

export interface StudyStrategy { subject: string; topic: string; recommendedStrategy: StudyStrategyName; reason: string; nextAction: string; suggestedMinutes: number }
export interface WhyExplanation { headline: string; reason: string; focusTip: string }
export interface RecoveryCoach { summary: string; priority: string; nextStep: string; warning: string | null }
export interface ExamStrategy { summary: string; topPriorities: string[]; dailyApproach: string; revisionAdvice: string; risk: Risk }
export interface StudyInsights { summary: string; observations: Array<{ title: string; detail: string; type: ObservationType }>; actions: string[] }
export interface RescueInput { movedSessions: number; recoveredMinutes: number; remainingUnscheduledMinutes: number; overloadedTopics: string[] }
