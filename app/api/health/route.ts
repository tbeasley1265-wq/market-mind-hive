import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "market-mind-hive",
    ts: new Date().toISOString(),
  });
}
