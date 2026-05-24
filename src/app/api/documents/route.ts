import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 50);
  const docs = await listDocuments(limit);
  return NextResponse.json({ documents: docs });
}
