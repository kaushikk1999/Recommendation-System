import { z } from "zod";
import { streamAnswerQuestion } from "@/lib/rag";

const chatSchema = z.object({ question: z.string().min(2).max(1000) });

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return new Response(sse("error", { error: "Invalid question" }), { status: 400, headers: { "content-type": "text/event-stream" } });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamAnswerQuestion(parsed.data.question)) {
          if (event.type === "status") controller.enqueue(encoder.encode(sse("status", { message: event.message })));
          if (event.type === "delta") controller.enqueue(encoder.encode(sse("delta", { text: event.text })));
          if (event.type === "metadata") controller.enqueue(encoder.encode(sse("metadata", event.result)));
          if (event.type === "done") controller.enqueue(encoder.encode(sse("done", {})));
        }
      } catch (error) {
        controller.enqueue(encoder.encode(sse("error", { error: error instanceof Error ? error.message : "Chat stream failed" })));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
      "x-accel-buffering": "no"
    }
  });
}
