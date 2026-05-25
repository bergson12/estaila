import "server-only";

/**
 * DeepSeek client — OpenAI-compatible REST API.
 *
 * Used for: agent bios, smart-text suggestions, and the real-estate chatbot.
 * Cheaper than GPT-4 and decent for Spanish + real-estate domain.
 *
 * Env:
 *   DEEPSEEK_API_KEY  — sk-...
 *
 * Endpoint: https://api.deepseek.com/v1/chat/completions
 * Model:    deepseek-chat  (V4 stable)
 */

const ENDPOINT = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

export function isDeepSeekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {}
): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error(
      "DEEPSEEK_API_KEY no configurado. Define la variable en Vercel."
    );
  }

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 800,
  };
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DeepSeek ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("DeepSeek devolvió respuesta vacía");
  return content;
}

/** Single-shot helper for short prompts. */
export async function ask(
  system: string,
  user: string,
  opts?: ChatOptions
): Promise<string> {
  return chat(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    opts
  );
}
