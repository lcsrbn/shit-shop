import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { isOrderStatus, normalizeOrderStatus } from "@/lib/order";

const ADMIN_COOKIE = "shit_shop_admin_session";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const hasAdminSession = cookieStore.get(ADMIN_COOKIE)?.value === "1";

    if (!hasAdminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status } = body as {
      orderId?: string;
      status?: string;
    };

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    if (!isOrderStatus(normalizeOrderStatus(status))) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const normalizedStatus = normalizeOrderStatus(status);
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("orders")
      .update({ status: normalizedStatus })
      .eq("id", orderId)
      .select("id, status")
      .single();

    if (error) {
      console.error("Update status DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, order: data });
  } catch (err) {
    console.error("Update status fatal error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Server error",
      },
      { status: 500 }
    );
  }
}