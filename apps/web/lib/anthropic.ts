import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_CHAT_MODEL, CLAUDE_SUMMARY_MODEL } from "@video-grabber/shared";

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface VideoSummary {
  summary: string;
  topics: string[];
}

/** One-time-per-video call — cost amortizes across every user who watches it. */
export async function summarizeTranscript(transcript: string): Promise<VideoSummary> {
  const message = await getClient().messages.create({
    model: CLAUDE_SUMMARY_MODEL,
    max_tokens: 1024,
    system:
      "You summarize YouTube video transcripts. Respond with ONLY a JSON object " +
      'shaped exactly like {"summary": string, "topics": string[]} — summary is a ' +
      "concise 3-6 sentence overview, topics is 3-6 short keyword phrases suitable " +
      "for searching for related videos.",
    messages: [
      { role: "user", content: transcript },
      // Prefilling the assistant turn with "{" forces the response to start
      // as raw JSON — confirmed via live testing that without this, the
      // model sometimes wraps the object in ```json fences despite being
      // told not to, which broke JSON.parse.
      { role: "assistant", content: "{" },
    ],
  });

  const text = message.content.find((block) => block.type === "text")?.text ?? "}";
  const parsed = JSON.parse("{" + text) as VideoSummary;
  return parsed;
}

/** Per-question call — deliberately a cheap/fast model to protect credit margins. */
export async function answerQuestion(params: {
  transcript: string;
  summary: string;
  priorQuestions: { question: string; answer: string | null }[];
  question: string;
}): Promise<string> {
  const history = params.priorQuestions
    .filter((q) => q.answer)
    .map((q) => `Q: ${q.question}\nA: ${q.answer}`)
    .join("\n\n");

  const message = await getClient().messages.create({
    model: CLAUDE_CHAT_MODEL,
    max_tokens: 512,
    system:
      "You answer questions about a YouTube video using only its transcript and " +
      "summary below. If the transcript doesn't cover the answer, say so plainly " +
      "rather than guessing.\n\nSUMMARY:\n" +
      params.summary +
      "\n\nTRANSCRIPT:\n" +
      params.transcript +
      (history ? `\n\nPRIOR Q&A THIS SESSION:\n${history}` : ""),
    messages: [{ role: "user", content: params.question }],
  });

  return message.content.find((block) => block.type === "text")?.text ?? "";
}
