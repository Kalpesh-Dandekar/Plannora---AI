import type { ExamStrategy, RecoveryCoach, StudyInsights, StudyStrategy, WhyExplanation } from "./ai.types.js";

const strategies = new Set(["Concepts", "Practice", "Revision", "Active Recall", "Concepts + Practice"]);
const risks = new Set(["low", "medium", "high"]);
const observationTypes = new Set(["strength", "warning", "opportunity"]);
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max = 400): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max;

export function validStudyStrategy(value: unknown): value is StudyStrategy {
  if (!object(value)) return false;
  return text(value.subject, 120) && text(value.topic, 120) && typeof value.recommendedStrategy === "string" && strategies.has(value.recommendedStrategy) && text(value.reason) && text(value.nextAction) && Number.isInteger(value.suggestedMinutes) && Number(value.suggestedMinutes) >= 25 && Number(value.suggestedMinutes) <= 60;
}
export function validWhy(value: unknown): value is WhyExplanation { return object(value) && text(value.headline, 120) && text(value.reason) && text(value.focusTip); }
export function validCoach(value: unknown): value is RecoveryCoach { return object(value) && text(value.summary) && text(value.priority) && text(value.nextStep) && (value.warning === null || text(value.warning)); }
export function validExamStrategy(value: unknown): value is ExamStrategy {
  return object(value) && text(value.summary) && Array.isArray(value.topPriorities) && value.topPriorities.length <= 3 && value.topPriorities.every((item) => text(item, 240)) && text(value.dailyApproach) && text(value.revisionAdvice) && typeof value.risk === "string" && risks.has(value.risk);
}
export function validInsights(value: unknown): value is StudyInsights {
  return object(value) && text(value.summary) && Array.isArray(value.observations) && value.observations.length <= 3 && value.observations.every((item) => object(item) && text(item.title, 120) && text(item.detail) && typeof item.type === "string" && observationTypes.has(item.type)) && Array.isArray(value.actions) && value.actions.length <= 2 && value.actions.every((item) => text(item, 240));
}
