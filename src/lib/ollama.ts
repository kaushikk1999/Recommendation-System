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
}

export function ollamaConfigured() {
  return Boolean(env.OLLAMA_API_KEY);
}

export function cleanOllamaContent(content: string) {
  return content
    .replace(/<\|channel\>thought\n[\s\S]*?<channel\|>/g, "")
    .replace(/<\|[^>]+?\|>/g, "")
    .trim();
}

export async function ollamaChat(messages: OllamaMessage[]) {
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
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.9,
        top_k: 40
      }
    })
  });
  if (!response.ok) throw new Error(`Ollama failed: ${response.status} ${response.statusText}`);
  const data = (await response.json()) as OllamaChatResponse;
  return cleanOllamaContent(data.message?.content || data.response || "");
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
