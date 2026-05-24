import { NextResponse } from "next/server";
import { overview } from "@/lib/analytics";

export async function GET() {
  return NextResponse.json(await overview());
}
