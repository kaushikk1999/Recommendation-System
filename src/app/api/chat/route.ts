import { NextResponse } from "next/server";
import { z } from "zod";
import { answerQuestion } from "@/lib/rag";

const chatSchema = z.object({ question: z.string().min(2).max(1000) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  try {
    return NextResponse.json(await answerQuestion(parsed.data.question));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Chat failed" }, { status: 500 });
  }
}
