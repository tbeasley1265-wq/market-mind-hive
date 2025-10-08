import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.from("items").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, itemsSeen: data?.length ?? 0 });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
