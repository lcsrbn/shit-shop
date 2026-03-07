import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
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
    }

    return Response.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown webhook error";

    console.error("❌ Stripe webhook error:", message);

    return new Response(`Webhook error: ${message}`, {
      status: 400,
    });
  }
}