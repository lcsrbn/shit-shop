import { NextResponse } from "next/server";
import { getSupabaseServerAuthClient } from "@/lib/supabase-server-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const ALLOWED_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "failed",
  "cancelled",
] as const;

function isAllowedStatus(value: string): boolean {
  return ALLOWED_STATUSES.includes(
    value as (typeof ALLOWED_STATUSES)[number]
  );
}

export async function POST(req: Request) {
  try {
    const supabaseAuth = await getSupabaseServerAuthClient();

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    const currentEmail = (user.email ?? "").toLowerCase();

    if (adminEmails.length > 0 && !adminEmails.includes(currentEmail)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!isAllowedStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status })
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
// force rebuild