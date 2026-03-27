import { NextResponse } from "next/server";
import { getSupabaseServerAuthClient } from "@/lib/supabase-server-auth";

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerAuthClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.length > 0) {
      const current = (user.email ?? "").toLowerCase();
      if (!adminEmails.includes(current)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json();

    const { orderId, status } = body as {
      orderId?: string;
      status?: string;
    };

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing params" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      console.error("Update status error:", error);
      return NextResponse.json(
        { error: "DB error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}