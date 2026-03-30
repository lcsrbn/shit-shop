import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const ADMIN_COOKIE = "shit_shop_admin_session";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get(ADMIN_COOKIE)?.value === "1";

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    // 🔍 Leggi stato attuale
    const { data: current, error: readError } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single();

    if (readError && readError.code !== "PGRST116") {
      console.error("Read maintenance error:", readError);
      return NextResponse.json(
        { error: readError.message },
        { status: 500 }
      );
    }

    const currentValue = current?.value === true;

    // 🔄 Toggle
    const { error: writeError } = await supabase
      .from("app_settings")
      .upsert({
        key: "maintenance_mode",
        value: !currentValue,
      });

    if (writeError) {
      console.error("Write maintenance error:", writeError);
      return NextResponse.json(
        { error: writeError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      maintenance: !currentValue,
    });
  } catch (err) {
    console.error("Toggle maintenance fatal error:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Server error",
      },
      { status: 500 }
    );
  }
}