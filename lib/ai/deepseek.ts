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
  /** Abort the request after this many ms. Defaults to 9000 (Vercel Hobby cap). */
  timeoutMs?: number;
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

  // Abort early so we can surface a clean error instead of being killed by
  // the platform. Caller can override via opts.timeoutMs.
  // Default 25s (leaves 5s margin under our maxDuration=30 on Vercel).
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 25000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if ((e as { name?: string }).name === "AbortError") {
      throw new Error("DeepSeek tardó demasiado. Intenta una pregunta más corta.");
    }
    throw e;
  }
  clearTimeout(timer);

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DeepSeek ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string;
    }>;
    usage?: { completion_tokens?: number; total_tokens?: number };
  };
  const choice = data.choices?.[0];
  const content = choice?.message?.content?.trim();
  const finishReason = choice?.finish_reason ?? "unknown";
  const usage = data.usage;

  if (!content) {
    throw new Error(
      `DeepSeek devolvió respuesta vacía (finish_reason=${finishReason}, completion_tokens=${
        usage?.completion_tokens ?? "?"
      }). Sube max_tokens o simplifica el prompt.`
    );
  }

  // If model hit length budget, surface a warning in the content so we can
  // debug — but still return what we got.
  if (finishReason === "length") {
    console.warn(
      `[deepseek] truncated at max_tokens (completion=${usage?.completion_tokens})`
    );
  }
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
