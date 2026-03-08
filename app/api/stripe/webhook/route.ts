import Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type SessionWithExtras = Stripe.Checkout.Session & {
  collected_information?: {
    shipping_details?: {
      name?: string | null;
      address?: Stripe.Address | null;
    } | null;
  } | null;
};

function getCustomFieldValue(
  fields: Stripe.Checkout.Session.CustomField[] | null | undefined,
  key: string
): string | null {
  const field = fields?.find((f) => f.key === key);
  if (!field) return null;
  if (field.type === "text") return field.text?.value ?? null;
  return null;
}

function getPaymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null
): string | null {
  if (!paymentIntent) return null;
  if (typeof paymentIntent === "string") return paymentIntent;
  return paymentIntent.id ?? null;
}

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
      const rawSession = event.data.object as Stripe.Checkout.Session;

      const fetchedSession = await stripe.checkout.sessions.retrieve(rawSession.id, {
        expand: ["payment_intent"],
      });

      const session = fetchedSession as SessionWithExtras;
      const supabase = getSupabaseServerClient();

      const taxCode = getCustomFieldValue(session.custom_fields, "tax_code");
      const orderNote = getCustomFieldValue(session.custom_fields, "order_note");

      const paymentIntent =
        typeof session.payment_intent === "string" || !session.payment_intent
          ? null
          : session.payment_intent;

      const shippingAddress =
        session.collected_information?.shipping_details?.address ??
        session.customer_details?.address ??
        paymentIntent?.shipping?.address ??
        null;

      const shippingName =
        session.collected_information?.shipping_details?.name ??
        session.customer_details?.name ??
        paymentIntent?.shipping?.name ??
        null;

      const customerPhone =
        session.customer_details?.phone ??
        paymentIntent?.shipping?.phone ??
        null;

      const row = {
        status: "paid",
        order_id: session.metadata?.orderId ?? null,
        stripe_session_id: session.id,
        stripe_payment_intent_id: getPaymentIntentId(session.payment_intent),

        customer_email:
          session.customer_details?.email ??
          session.customer_email ??
          null,
        customer_name: shippingName,
        customer_phone: customerPhone,

        shipping_line1: shippingAddress?.line1 ?? null,
        shipping_line2: shippingAddress?.line2 ?? null,
        shipping_city: shippingAddress?.city ?? null,
        shipping_state: shippingAddress?.state ?? null,
        shipping_postal_code: shippingAddress?.postal_code ?? null,
        shipping_country: shippingAddress?.country ?? null,

        tax_code: taxCode,
        order_note: orderNote,

        currency: session.currency ?? null,
        amount_subtotal: session.amount_subtotal ?? null,
        amount_total: session.amount_total ?? null,

        items_json: {
          note: "Line items can be expanded later if needed",
        },

        stripe_payload_json: JSON.parse(JSON.stringify(session)),
      };

      const { error } = await supabase
        .from("orders")
        .upsert(row, { onConflict: "stripe_session_id" });

      if (error) {
        console.error("Supabase insert error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return new Response(`Database insert error: ${error.message}`, {
          status: 500,
        });
      }

      console.log("✅ order saved", {
        stripeSessionId: session.id,
        orderId: session.metadata?.orderId ?? null,
        customerEmail: session.customer_details?.email ?? null,
        amountTotal: session.amount_total ?? null,
      });
    }

    return Response.json({ received: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "unknown webhook error";

    console.error("❌ Stripe webhook error:", message);

    return new Response(`Webhook error: ${message}`, {
      status: 400,
    });
  }
}