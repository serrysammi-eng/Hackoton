import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { getProvider, resolveModelId, isGeminiDirect } from "./ai-gateway.server";

const BaseSchema = z.object({
  model: z.string().default("google/gemini-3-flash-preview"),
  userApiKey: z.string().optional(),
  name: z.string().default("learner"),
  language: z.enum(["english", "hindi", "both"]),
  subject: z.string(),
  level: z.string(),
  topic: z.string(),
});

function languageInstruction(language: string) {
  if (language === "hindi") {
    return "Respond ENTIRELY in Hindi (Devanagari script). Use simple, friendly Hindi.";
  }
  if (language === "both") {
    return "Respond in simple Hinglish (Hindi words written in English/Roman script mixed with English). Friendly, casual.";
  }
  return "Respond in simple, clear English.";
}

function ageInstruction(level: string) {
  switch (level) {
    case "school":
      return "The learner is a young child (age 6-10). Use very simple words, short sentences, fun emojis, and relatable everyday examples.";
    case "high_school":
      return "The learner is a teenager (age 11-17). Use clear language, relatable examples, and a friendly tone.";
    case "college":
      return "The learner is a college student. Be precise, use proper terminology, but stay engaging.";
    default:
      return "The learner is an adult. Be respectful, concise, and practical.";
  }
}

function extractJson<T>(text: string): T {
  // strip code fences
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  // find first { or [
  const first = s.search(/[{[]/);
  if (first > 0) s = s.slice(first);
  return JSON.parse(s) as T;
}

async function runJSON<T>(
  params: z.infer<typeof BaseSchema>,
  prompt: string,
  system: string,
): Promise<T> {
  const usingGeminiDirect = isGeminiDirect(params.userApiKey);
  const provider = getProvider(params.userApiKey);
  const modelId = resolveModelId(params.model, usingGeminiDirect);
  const { text } = await generateText({
    model: provider(modelId),
    system,
    prompt,
  });
  return extractJson<T>(text);
}

// ----- LESSON (ENRICHED: 6-8 sections with application, mistakes, challenge) -----
export const generateLesson = createServerFn({ method: "POST" })
  .validator((d: unknown) => BaseSchema.parse(d))
  .handler(async ({ data }) => {
    const system = `You are StudyMate AI, a fun and clear tutor for ${data.name}.
${ageInstruction(data.level)}
${languageInstruction(data.language)}
Output STRICT JSON only, no prose outside JSON.`;
    const prompt = `Create a detailed, engaging lesson about "${data.topic}" within the subject "${data.subject}".
Return JSON of shape:
{
  "title": "string",
  "intro": "1-2 sentence hook with an emoji",
  "sections": [
    { "heading": "string", "body": "3-5 short sentences with emojis and detailed examples", "type": "concept" }
  ],
  "keyTakeaways": ["string", "string", "string", "string"],
  "funFact": "one fun fact with emoji",
  "scene": {
    "analogy_context": "One sentence framing a real-life analogy for the whole lesson (cricket, food, school, trains, Bollywood).",
    "steps": [
      {
        "on_screen_text": "Short label or key term visible on the canvas (5 words max)",
        "voiceover_script": "What Shiksha says aloud for this step (2-3 sentences, warm teacher tone)",
        "svg_doodle": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'><!-- simple shapes using stroke only, no fill except rgba --></svg>",
        "duration": 3
      }
    ],
    "interactive_question": {
      "question": "A simple check-understanding question about the lesson",
      "choices": ["option A", "option B", "option C", "option D"],
      "answerIndex": 0,
      "hint": "Short friendly hint shown on wrong answer (1 sentence)"
    }
  }
}

SECTION RULES — generate between 6 and 8 sections total:
1. Start with 3-4 "concept" sections that explain the core ideas with specific numbers and examples.
2. Include 1 section with type "application" titled "🌍 Real-World Application" showing how this concept is used in everyday life.
3. Include 1 section with type "mistakes" titled "⚠️ Common Mistakes" listing 2-3 pitfalls students commonly fall into.
4. End with 1 section with type "challenge" titled "🧪 Try It Yourself" giving a hands-on mini exercise or problem.

CONTENT RULES:
- Each section body should be 3-5 sentences, not just 2.
- Include at least 2 fun facts scattered throughout sections.
- Use specific numbers, names, and real examples — not vague descriptions.
- Include an emoji in each section heading.
- Make section bodies genuinely informative and engaging.
- Total word count: aim for 500-700 words.

SCENE RULES — generate exactly 5 to 7 steps:
- Each step should tell part of the lesson story visually.
- on_screen_text: ultra-short, 5 words max, acts like a chapter title.
- voiceover_script: 2-3 sentences Shiksha would say warmly. Match the language setting.
- svg_doodle: A simple inline SVG (viewBox="0 0 300 200"). Use ONLY stroke-based shapes (lines, circles, rects, paths, text). No background fills. Stroke colors: #a78bfa (purple) for shapes, #fbbf24 (amber) for labels, #e2e8f0 (slate) for text. Keep it simple — 3 to 6 shapes per step. Each shape MUST have a unique class like "s1", "s2" etc. Do NOT reference external resources. If you cannot generate a meaningful SVG, output null.
- duration: between 2.5 and 4 seconds.
- interactive_question: one multiple-choice check question. answerIndex must be 0, 1, 2, or 3.

Generate 4 key takeaways instead of 3.`;
    return runJSON<{
      title: string;
      intro: string;
      sections: { heading: string; body: string; type?: string }[];
      keyTakeaways: string[];
      funFact: string;
      scene: {
        analogy_context: string;
        steps: {
          on_screen_text: string;
          voiceover_script: string;
          svg_doodle: string | null;
          duration: number;
        }[];
        interactive_question: {
          question: string;
          choices: [string, string, string, string];
          answerIndex: 0 | 1 | 2 | 3;
          hint: string;
        };
      };
    }>(data, prompt, system);
  });

// ----- QUIZ -----
export const generateQuiz = createServerFn({ method: "POST" })
  .validator((d: unknown) => BaseSchema.parse(d))
  .handler(async ({ data }) => {
    const system = `You are StudyMate AI quiz generator.
${ageInstruction(data.level)}
${languageInstruction(data.language)}
Output STRICT JSON only.`;
    const prompt = `Generate exactly 5 multiple-choice questions about "${data.topic}" (${data.subject}).
Return JSON: { "questions": [ { "q": "string", "choices": ["A","B","C","D"], "answerIndex": 0, "explanation": "short clear explanation of why correct" } ] }
Vary difficulty. The answerIndex must be 0..3.`;
    return runJSON<{
      questions: { q: string; choices: string[]; answerIndex: number; explanation: string }[];
    }>(data, prompt, system);
  });

// ----- FLASHCARDS -----
export const generateFlashcards = createServerFn({ method: "POST" })
  .validator((d: unknown) => BaseSchema.parse(d))
  .handler(async ({ data }) => {
    const system = `You are StudyMate AI flashcard generator.
${ageInstruction(data.level)}
${languageInstruction(data.language)}
Output STRICT JSON only.`;
    const prompt = `Generate 8 flashcards about "${data.topic}" (${data.subject}).
Return JSON: { "cards": [ { "front": "question or term", "back": "short clear answer with an emoji" } ] }`;
    return runJSON<{ cards: { front: string; back: string }[] }>(data, prompt, system);
  });

// ----- GAME QUESTIONS -----
const GameSchema = BaseSchema.extend({ gameType: z.enum(["coding", "math", "science"]) });
export const generateGameQuestions = createServerFn({ method: "POST" })
  .validator((d: unknown) => GameSchema.parse(d))
  .handler(async ({ data }) => {
    const system = `You are StudyMate AI game-question generator.
${ageInstruction(data.level)}
${languageInstruction(data.language)}
Output STRICT JSON only.`;
    let typeHint = "";
    if (data.gameType === "coding")
      typeHint = "Python coding questions (output, syntax, while/for loops, variables).";
    else if (data.gameType === "math") typeHint = "Quick math problems suitable for the level.";
    else typeHint = `${data.subject} quiz battle questions.`;
    const prompt = `Generate 10 quick multiple-choice questions for a game. ${typeHint}
Topic context: "${data.topic}". Keep each question short (one line).
Return JSON: { "questions": [ { "q": "string", "choices": ["A","B","C","D"], "answerIndex": 0 } ] }`;
    return runJSON<{ questions: { q: string; choices: string[]; answerIndex: number }[] }>(
      data,
      prompt,
      system,
    );
  });
