import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA || "local",
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    youtube: !!process.env.YOUTUBE_API_KEY,
  });
}
