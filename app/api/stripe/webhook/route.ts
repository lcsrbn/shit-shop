import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return new NextResponse("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
    }

    const payload = await req.text();

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("✅ checkout.session.completed", {
        sessionId: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email ?? null,
        customerName: session.customer_details?.name ?? null,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        orderId: session.metadata?.orderId ?? null,
        source: session.metadata?.source ?? null,
      });

      // Più avanti qui salveremo l'ordine su database
      // e invieremo eventuali email automatiche.
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Stripe webhook error:", error?.message ?? error);
    return new NextResponse(`Webhook error: ${error?.message ?? "unknown error"}`, {
      status: 400,
    });
  }
}