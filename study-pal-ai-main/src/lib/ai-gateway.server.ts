import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Helper to determine if we are using a direct provider connection (always true for Groq).
 */
export function isGeminiDirect(userApiKey?: string): boolean {
  return true;
}

/**
 * Returns the Groq AI SDK provider.
 */
export function getProvider(userApiKey?: string) {
  const apiKey =
    userApiKey && userApiKey.trim().length > 0
      ? userApiKey.trim()
      : process.env.GROQ_API_KEY ||
        process.env.VITE_GROQ_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.LOVABLE_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "Groq API Key is not configured. Please resolve this by doing one of the following:\n" +
        "1. Create a `.env` file in the project root with `GROQ_API_KEY=your_groq_api_key`,\n" +
        "2. Go to the Settings screen in the application UI (gear icon in the navigation menu) and enter your API Key.",
    );
  }

  return createOpenAICompatible({
    name: "groq",
    baseURL: "https://api.groq.com/openai/v1",
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
  });
}

/** Map our friendly model id to Groq's supported model names. */
export function resolveModelId(model: string, usingGeminiDirect?: boolean): string {
  let m = model.toLowerCase();

  // Strip provider prefixes
  if (m.startsWith("google/")) {
    m = m.replace("google/", "");
  }
  if (m.startsWith("openai/")) {
    m = m.replace("openai/", "");
  }

  // Clean preview suffixes
  m = m.replace("-preview", "");

  // Map to high-performance Groq models
  if (m.includes("pro") || m.includes("gpt-5") || m.includes("gpt-4")) {
    return "llama-3.3-70b-versatile"; // Smart model
  }

  return "llama-3.1-8b-instant"; // Fast default model
}
