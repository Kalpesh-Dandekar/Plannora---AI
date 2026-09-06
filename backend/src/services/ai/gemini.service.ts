import { GoogleGenAI } from "@google/genai";

export async function generateStructured(prompt: string, schema: unknown): Promise<unknown | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json", ...(schema ? { responseJsonSchema: schema } : {}), temperature: 0.25, maxOutputTokens: 700, abortSignal: controller.signal } });
    if (!response.text) return null;
    return JSON.parse(response.text) as unknown;
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "timeout" : "provider unavailable";
    console.warn(`AI generation used fallback: ${reason}.`);
    return null;
  } finally { clearTimeout(timeout); }
}
