import { NextResponse } from "next/server";
import { getSupabaseServerAuthClient } from "@/lib/supabase-server-auth";

export async function POST() {
  const supabase = await getSupabaseServerAuthClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL));
}