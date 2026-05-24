import { NextResponse } from "next/server";
import { getSourceStatuses } from "@/lib/source-status";

export async function GET() {
  return NextResponse.json({
    sources: getSourceStatuses()
  });
}
