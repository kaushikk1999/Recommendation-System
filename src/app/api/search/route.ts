import { NextResponse } from "next/server";
import { retrieveDocuments } from "@/lib/rag";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  const results = await retrieveDocuments(q, 10);
  return NextResponse.json({ results });
}
