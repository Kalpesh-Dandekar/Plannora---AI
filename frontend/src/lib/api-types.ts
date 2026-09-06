export type SessionStatus = "planned" | "done" | "partial" | "missed";
export type SessionFeedback = "easy" | "okay" | "difficult";

export interface StudySession {
  _id: string;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  strategy: string;
  priorityScore: number;
  why: string;
  status: SessionStatus;
  feedback: SessionFeedback | null;
}

export interface TopicProgress {
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  preparationLevel: "Not Started" | "Learning" | "Revision Needed" | "Confident";
  plannedSessions: number;
  completedSessions: number;
  partialSessions: number;
  missedSessions: number;
  totalPlannedMinutes: number;
  completedMinutes: number;
  progressPercentage: number;
  currentPriorityScore: number;
}

export interface SubjectProgress {
  name: string;
  topicCount: number;
  completedSessions: number;
  plannedSessions: number;
  totalPlannedMinutes: number;
  completedMinutes: number;
  progressPercentage: number;
  topics: TopicProgress[];
}

export interface DashboardResponse {
  success: true;
  dashboard: {
    user: { name: string; mode: "regular" | "exam" };
    today: { date: string; plannedMinutes: number; completedMinutes: number; remainingMinutes: number; totalSessions: number; completedSessions: number; nextSession: StudySession | null };
    exam: { name: string; date: string; daysRemaining: number | null } | null;
    readinessScore: number;
    streak: number;
    weeklyGoal: { plannedMinutes: number; completedMinutes: number; percentage: number };
    priorityTopics: Array<TopicProgress & { subject: string }>;
    recentProgress: WeeklyProgress[];
  };
}

export interface SubjectsResponse { success: true; subjects: SubjectProgress[] }
export interface ExamsResponse { success: true; exam: null | { name: string; date: string; daysRemaining: number | null; readinessScore: number; totalTopics: number; preparedTopics: number; remainingTopics: number; plannedStudyMinutes: number; completedStudyMinutes: number } }
export interface WeeklyProgress { date: string; plannedMinutes: number; completedMinutes: number; percentage: number }
export interface ProgressResponse { success: true; progress: { totalPlannedSessions: number; completedSessions: number; partialSessions: number; missedSessions: number; completionRate: number; plannedMinutes: number; completedMinutes: number; completionPercentage: number; subjectProgress: SubjectProgress[]; topicProgress: Array<TopicProgress & { subject: string }>; weeklyProgress: WeeklyProgress[]; weakAreas: Array<TopicProgress & { subject: string }>; strongerAreas: Array<TopicProgress & { subject: string }>; feedbackDistribution: Record<SessionFeedback, number>; readinessScore: number; streak: number } }
export interface AccountResponse { success: true; account: { name: string; email: string; createdAt: string; mode?: "regular" | "exam" | null } }
export interface PlannerResponse { success: true; profile?: { period?: string; session?: string; strategy?: string; mode?: "regular" | "exam" } }
export interface StudyPlanResponse { success: true; plan?: { sessions: StudySession[] } }
export interface RescueResponse { success: true; message: string; rescue: { movedSessions: number; recoveredMinutes: number; overloadedTopics: string[]; remainingUnscheduledMinutes: number }; plan: { sessions: StudySession[] } }
export interface QuickPlanResponse { success: true; quickPlan: { requestedMinutes: number; allocatedMinutes: number; remainingMinutes: number; sessions: Array<{ subject: string; topic: string; durationMinutes: number; strategy: string; priorityScore: number; why: string }> } }
export type AiSource = "ai" | "fallback";
export interface AiWhyResponse { success: true; source: AiSource; explanation: { headline: string; reason: string; focusTip: string } }
export interface AiStudyStrategyResponse { success: true; source: AiSource; strategy: { subject: string; topic: string; recommendedStrategy: "Concepts" | "Practice" | "Revision" | "Active Recall" | "Concepts + Practice"; reason: string; nextAction: string; suggestedMinutes: number } }
export interface AiRecoveryResponse { success: true; source: AiSource; coach: { summary: string; priority: string; nextStep: string; warning: string | null } }
export interface AiExamStrategyResponse { success: true; source: AiSource; strategy: { summary: string; topPriorities: string[]; dailyApproach: string; revisionAdvice: string; risk: "low" | "medium" | "high" } }
export interface AiInsightsResponse { success: true; source: AiSource; insights: { summary: string; observations: Array<{ title: string; detail: string; type: "strength" | "warning" | "opportunity" }>; actions: string[] } }
