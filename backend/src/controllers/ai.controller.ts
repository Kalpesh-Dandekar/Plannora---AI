import type { Response } from "express";
import { Types } from "mongoose";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { loadAiContext } from "../services/ai/ai-context.service.js";
import { fallbackCoach, fallbackExam, fallbackInsights, fallbackStrategy, fallbackWhy } from "../services/ai/ai-fallback.service.js";
import { generateStructured } from "../services/ai/gemini.service.js";
import { prompt, schemas } from "../services/ai/ai-prompts.service.js";
import type { RescueInput } from "../services/ai/ai.types.js";
import { validCoach, validExamStrategy, validInsights, validStudyStrategy, validWhy } from "../services/ai/ai-validation.service.js";

const validText = (value: unknown, max = 120): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max;
async function context(req: AuthenticatedRequest, res: Response) {
  if (!req.userId || !Types.ObjectId.isValid(req.userId)) { res.status(401).json({ success: false, message: "Invalid authentication token." }); return null; }
  const result = await loadAiContext(req.userId);
  if (!result) res.status(404).json({ success: false, message: "Planner setup has not been created yet." });
  return result;
}

export async function studyStrategy(req: AuthenticatedRequest, res: Response) {
  try {
    const body = req.body as { subject?: unknown; topic?: unknown };
    if (!validText(body.subject) || !validText(body.topic)) { res.status(400).json({ success: false, message: "Subject and topic are required and must be 120 characters or fewer." }); return; }
    const loaded = await context(req, res); if (!loaded) return;
    const topic = loaded.topics.find((item) => item.subject === body.subject && item.topic === body.topic);
    if (!topic) { res.status(404).json({ success: false, message: "That topic was not found in your planner." }); return; }
    const compact = { topic, exam: loaded.context.exam, readiness: loaded.context.readiness, preferredSessionMinutes: loaded.context.availability.preferredSessionMinutes };
    const generated = await generateStructured(prompt("Recommend one allowed study strategy, a concise evidence-based reason, a concrete next action, and sensible minutes.", compact), schemas.strategy);
    const fallback = fallbackStrategy(topic, loaded.context.availability.preferredSessionMinutes);
    res.json({ success: true, source: validStudyStrategy(generated) ? "ai" : "fallback", strategy: validStudyStrategy(generated) ? { ...generated, subject: topic.subject, topic: topic.topic } : fallback });
  } catch { res.status(500).json({ success: false, message: "Unable to prepare a study strategy right now." }); }
}

export async function whyThis(req: AuthenticatedRequest, res: Response) {
  try {
    const sessionId = (req.body as { sessionId?: unknown }).sessionId;
    if (!validText(sessionId, 50) || !Types.ObjectId.isValid(sessionId)) { res.status(400).json({ success: false, message: "Please provide a valid study session." }); return; }
    const loaded = await context(req, res); if (!loaded) return;
    const session = loaded.plan?.sessions.find((item) => String((item as any)._id) === sessionId);
    if (!session) { res.status(404).json({ success: false, message: "Study session was not found." }); return; }
    const topicData = loaded.topics.find((item) => item.subject === session.subject && item.topic === session.topic);
    const compact = { session: { subject: session.subject, topic: session.topic, priorityScore: session.priorityScore, why: session.why, strategy: session.strategy, status: session.status, feedback: session.feedback }, topic: topicData, exam: loaded.context.exam };
    const generated = await generateStructured(prompt("Explain concisely why the deterministic planner prioritized this existing session and give one focus tip. Do not generate or change a score.", compact), schemas.why);
    const valid = validWhy(generated);
    res.json({ success: true, source: valid ? "ai" : "fallback", explanation: valid ? generated : fallbackWhy(session) });
  } catch { res.status(500).json({ success: false, message: "Unable to explain this session right now." }); }
}

function rescueInput(value: unknown): RescueInput | null {
  if (typeof value !== "object" || value === null) return null;
  const body = value as Record<string, unknown>; const numbers = [body.movedSessions, body.recoveredMinutes, body.remainingUnscheduledMinutes];
  if (!numbers.every((item) => Number.isInteger(item) && Number(item) >= 0 && Number(item) <= 100000)) return null;
  if (!Array.isArray(body.overloadedTopics) || body.overloadedTopics.length > 10 || !body.overloadedTopics.every((item) => validText(item, 120))) return null;
  return { movedSessions: Number(body.movedSessions), recoveredMinutes: Number(body.recoveredMinutes), remainingUnscheduledMinutes: Number(body.remainingUnscheduledMinutes), overloadedTopics: body.overloadedTopics as string[] };
}

export async function recoveryCoach(req: AuthenticatedRequest, res: Response) {
  try {
    const result = rescueInput(req.body); if (!result) { res.status(400).json({ success: false, message: "Please provide a valid rescue result." }); return; }
    const loaded = await context(req, res); if (!loaded) return;
    const generated = await generateStructured(prompt("Return {summary, priority, nextStep, warning}. Interpret this deterministic rescue result accurately. All first three fields and warning must be concise strings. Never claim more sessions or minutes than supplied. If unscheduled minutes are positive, warning must clearly say some workload did not fit.", { rescue: result, context: loaded.context }), schemas.coach);
    const valid = validCoach(generated) && (result.remainingUnscheduledMinutes === 0 || generated.warning !== null);
    const coach = valid ? { ...generated, warning: result.remainingUnscheduledMinutes > 0 ? generated.warning : null } : fallbackCoach(result);
    res.json({ success: true, source: valid ? "ai" : "fallback", coach });
  } catch { res.status(500).json({ success: false, message: "Unable to prepare recovery coaching right now." }); }
}

export async function examStrategy(req: AuthenticatedRequest, res: Response) {
  try {
    const loaded = await context(req, res); if (!loaded) return;
    if (!loaded.context.exam) { res.status(400).json({ success: false, message: "No active exam is configured." }); return; }
    const generated = await generateStructured(prompt("Return {summary, topPriorities, dailyApproach, revisionAdvice, risk}. Create a concise exam strategy using only these measured values. topPriorities is an array of at most three strings; risk is exactly low, medium, or high.", loaded.context), schemas.exam);
    const valid = validExamStrategy(generated);
    res.json({ success: true, source: valid ? "ai" : "fallback", strategy: valid ? generated : fallbackExam(loaded.context) });
  } catch { res.status(500).json({ success: false, message: "Unable to prepare an exam strategy right now." }); }
}

export async function studyInsights(req: AuthenticatedRequest, res: Response) {
  try {
    const loaded = await context(req, res); if (!loaded) return;
    const generated = await generateStructured(prompt("Return {summary, observations, actions}. Interpret these analytics without fabricating statistics. observations contains at most three {title, detail, type} objects where type is strength, warning, or opportunity; actions contains at most two strings.", loaded.context), schemas.insights);
    const valid = validInsights(generated);
    res.json({ success: true, source: valid ? "ai" : "fallback", insights: valid ? generated : fallbackInsights(loaded.context) });
  } catch { res.status(500).json({ success: false, message: "Unable to prepare study insights right now." }); }
}
