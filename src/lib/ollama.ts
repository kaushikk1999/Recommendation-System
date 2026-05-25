import { env } from "@/lib/env";

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
  response?: string;
  done?: boolean;
}

export function ollamaConfigured() {
  return Boolean(env.OLLAMA_API_KEY);
}

export function cleanOllamaContent(content: string) {
  let cleaned = content
    .replace(/<\|channel\>thought\n[\s\S]*?<channel\|>/g, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<\|thought\|>[\s\S]*?<\|thought\|>/g, "")
    .replace(/<\|[^>]+?\|>/g, "");

  // Handle uncompleted thinking blocks
  const openThoughtIdx = cleaned.toLowerCase().lastIndexOf("<thought>");
  const closeThoughtIdx = cleaned.toLowerCase().lastIndexOf("</thought>");
  if (openThoughtIdx > closeThoughtIdx) {
    cleaned = cleaned.slice(0, openThoughtIdx);
  }

  const openThinkingIdx = cleaned.toLowerCase().lastIndexOf("<thinking>");
  const closeThinkingIdx = cleaned.toLowerCase().lastIndexOf("</thinking>");
  if (openThinkingIdx > closeThinkingIdx) {
    cleaned = cleaned.slice(0, openThinkingIdx);
  }

  const openOllamaThoughtIdx = cleaned.lastIndexOf("<|thought|>");
  if (openOllamaThoughtIdx !== -1) {
    const count = (cleaned.match(/<\|thought\|>/g) || []).length;
    if (count % 2 === 1) {
      cleaned = cleaned.slice(0, openOllamaThoughtIdx);
    }
  }

  const openChannelIdx = cleaned.lastIndexOf("<|channel>thought");
  const closeChannelIdx = cleaned.lastIndexOf("<channel|>");
  if (openChannelIdx > closeChannelIdx) {
    cleaned = cleaned.slice(0, openChannelIdx);
  }

  // Slice off any partial tag at the end (e.g. "<thou")
  const lastLessThan = cleaned.lastIndexOf("<");
  if (lastLessThan !== -1 && lastLessThan > cleaned.lastIndexOf(">")) {
    cleaned = cleaned.slice(0, lastLessThan);
  }

  return cleaned;
}

export async function ollamaChat(messages: OllamaMessage[]): Promise<string> {
  let content = "";
  for await (const chunk of ollamaChatStream(messages)) {
    content += chunk;
  }
  return cleanOllamaContent(content).trim();
}

export async function* ollamaChatStream(messages: OllamaMessage[]): AsyncGenerator<string, void, unknown> {
  if (!env.OLLAMA_API_KEY) throw new Error("Ollama API key is not configured");
  const response = await fetch(`${env.OLLAMA_HOST.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OLLAMA_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: env.OLLAMA_MODEL,
      messages,
      stream: true,
      options: {
        temperature: 0.2,
        top_p: 0.9,
        top_k: 40
      }
    })
  });
  if (!response.ok) throw new Error(`Ollama failed: ${response.status} ${response.statusText}`);
  if (!response.body) throw new Error("Ollama streaming response body is unavailable");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedRaw = "";
  let yieldedText = "";
  let streamDone = false;

  while (!streamDone) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const data = JSON.parse(line) as OllamaChatResponse;
      const rawChunk = data.message?.content || data.response || "";
      if (rawChunk) {
        accumulatedRaw += rawChunk;
        const currentCleaned = cleanOllamaContent(accumulatedRaw);
        if (currentCleaned.length > yieldedText.length) {
          const delta = currentCleaned.slice(yieldedText.length);
          yieldedText = currentCleaned;
          yield delta;
        }
      }
      if (data.done) {
        streamDone = true;
        break;
      }
    }
  }
  if (!streamDone) {
    const finalLine = buffer.trim();
    if (finalLine) {
      const data = JSON.parse(finalLine) as OllamaChatResponse;
      const rawChunk = data.message?.content || data.response || "";
      if (rawChunk) {
        accumulatedRaw += rawChunk;
        const currentCleaned = cleanOllamaContent(accumulatedRaw);
        if (currentCleaned.length > yieldedText.length) {
          const delta = currentCleaned.slice(yieldedText.length);
          yieldedText = currentCleaned;
          yield delta;
        }
      }
    }
  }
}

export async function getOllamaStatus() {
  if (!ollamaConfigured()) return { configured: false, ok: false, model: env.OLLAMA_MODEL, message: "Ollama API key is not configured" };
  try {
    const response = await fetch(`${env.OLLAMA_HOST.replace(/\/$/, "")}/api/tags`, {
      headers: { Authorization: `Bearer ${env.OLLAMA_API_KEY}` },
      cache: "no-store"
    });
    return {
      configured: true,
      ok: response.ok,
      model: env.OLLAMA_MODEL,
      message: response.ok ? "Ollama Cloud connection is ready" : `Ollama status failed: ${response.status}`
    };
  } catch (error) {
    return { configured: true, ok: false, model: env.OLLAMA_MODEL, message: error instanceof Error ? error.message : "Ollama status check failed" };
  }
}
