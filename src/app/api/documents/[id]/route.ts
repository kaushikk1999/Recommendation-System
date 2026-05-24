import { NextResponse } from "next/server";
import { getDocument } from "@/lib/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json({ document });
}
