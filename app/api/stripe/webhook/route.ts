import Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import {
  sendAdminOrderNotification,
  sendCustomerOrderConfirmation,
} from "@/lib/email";

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

type OrderItem = {
  qty?: number;
  sku?: string;
  productId?: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  lineTotalEUR?: number;
  unitPriceEUR?: number;
};

type OrderRow = {
  id: string;
  stock_processed: boolean | null;
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

async function getUserIdByEmail(email: string | null): Promise<string | null> {
  if (!email) return null;

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Supabase auth admin listUsers error:", error);
    return null;
  }

  const match = data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  return match?.id ?? null;
}

function readItemsJsonFromMetadata(session: Stripe.Checkout.Session): OrderItem[] {
  const raw = session.metadata?.itemsJson;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeStockItems(items: OrderItem[]) {
  return items
    .map((item) => {
      const variantPublicId =
        typeof item.variantId === "string" ? item.variantId : null;

      const qty = Number(item.qty ?? 0);

      if (!variantPublicId || !Number.isFinite(qty) || qty <= 0) {
        return null;
      }

      return {
        variantPublicId,
        qty: Math.floor(qty),
      };
    })
    .filter(
      (item): item is { variantPublicId: string; qty: number } => item !== null
    );
}

async function decrementStockForItems(orderId: string, items: OrderItem[]) {
  const supabase = getSupabaseServerClient();
  const stockItems = normalizeStockItems(items);

  if (stockItems.length === 0) {
    console.warn("No stock items found for order", { orderId });

    const { error: markError } = await supabase
      .from("orders")
      .update({ stock_processed: true })
      .eq("id", orderId);

    if (markError) {
      throw new Error(`Failed to mark stock processed: ${markError.message}`);
    }

    return;
  }

  for (const item of stockItems) {
    const { data: variant, error: readError } = await supabase
      .from("product_variants")
      .select("id, public_id, stock_quantity")
      .eq("public_id", item.variantPublicId)
      .single();

    if (readError || !variant) {
      throw new Error(
        `Variant not found for stock decrement: ${item.variantPublicId}`
      );
    }

    const currentStock = Number(variant.stock_quantity ?? 0);
    const nextStock = Math.max(0, currentStock - item.qty);

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ stock_quantity: nextStock })
      .eq("id", variant.id);

    if (updateError) {
      throw new Error(
        `Failed to update stock for ${item.variantPublicId}: ${updateError.message}`
      );
    }

    console.log("✅ stock decremented", {
      orderId,
      variantPublicId: item.variantPublicId,
      qty: item.qty,
      previousStock: currentStock,
      nextStock,
    });
  }

  const { error: markError } = await supabase
    .from("orders")
    .update({ stock_processed: true })
    .eq("id", orderId);

  if (markError) {
    throw new Error(`Failed to mark stock processed: ${markError.message}`);
  }
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

      const fetchedSession = await stripe.checkout.sessions.retrieve(
        rawSession.id,
        {
          expand: ["payment_intent"],
        }
      );

      const session = fetchedSession as SessionWithExtras;
      const supabase = getSupabaseServerClient();

      const taxCode = getCustomFieldValue(session.custom_fields, "tax_code");
      const orderNote = getCustomFieldValue(session.custom_fields, "order_note");

      const paymentIntent =
        typeof session.payment_intent === "string" || !session.payment_intent
          ? null
          : session.payment_intent;

      const customerEmail =
        session.customer_details?.email ?? session.customer_email ?? null;

      const metadataUserId = session.metadata?.userId ?? null;
      const userId = metadataUserId ?? (await getUserIdByEmail(customerEmail));

      if (!userId) {
        console.error("Missing user_id for completed checkout session", {
          stripeSessionId: session.id,
          customerEmail,
          metadata: session.metadata,
        });

        return new Response("Missing user_id for order", {
          status: 500,
        });
      }

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
        session.customer_details?.phone ?? paymentIntent?.shipping?.phone ?? null;

      const itemsJson = readItemsJsonFromMetadata(session);

      const row = {
        user_id: userId,
        status: "paid",
        order_id: session.metadata?.orderId ?? null,
        stripe_session_id: session.id,
        stripe_payment_intent_id: getPaymentIntentId(session.payment_intent),

        customer_email: customerEmail,
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

        items_json: itemsJson,
        stripe_payload_json: JSON.parse(JSON.stringify(session)),
      };

      const { error: upsertError } = await supabase
        .from("orders")
        .upsert(row, { onConflict: "stripe_session_id" });

      if (upsertError) {
        console.error("Supabase upsert error:", {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code,
        });

        return new Response(`Database upsert error: ${upsertError.message}`, {
          status: 500,
        });
      }

      const { data: order, error: orderReadError } = await supabase
        .from("orders")
        .select("id, stock_processed")
        .eq("stripe_session_id", session.id)
        .single();

      if (orderReadError || !order) {
        console.error("Order read after upsert error:", orderReadError);

        return new Response("Order read after upsert error", {
          status: 500,
        });
      }

      const orderRow = order as OrderRow;

      if (!orderRow.stock_processed) {
        try {
          await decrementStockForItems(orderRow.id, itemsJson);
        } catch (stockError) {
          console.error("❌ stock decrement error:", stockError);

          return new Response(
            stockError instanceof Error
              ? `Stock decrement error: ${stockError.message}`
              : "Stock decrement error",
            { status: 500 }
          );
        }
      } else {
        console.log("ℹ️ stock already processed", {
          stripeSessionId: session.id,
          orderId: orderRow.id,
        });
      }

      console.log("✅ order saved", {
        stripeSessionId: session.id,
        orderId: session.metadata?.orderId ?? null,
        customerEmail,
        userId,
        amountTotal: session.amount_total ?? null,
        itemsCount: itemsJson.length,
      });

      try {
        await sendCustomerOrderConfirmation({
          orderId: session.metadata?.orderId ?? null,
          customerEmail,
          customerName: shippingName,
          amountTotal: session.amount_total ?? null,
          currency: session.currency ?? "EUR",
          items: itemsJson,
        });

        await sendAdminOrderNotification({
          orderId: session.metadata?.orderId ?? null,
          customerEmail,
          customerName: shippingName,
          amountTotal: session.amount_total ?? null,
          currency: session.currency ?? "EUR",
          items: itemsJson,
        });

        console.log("✅ order emails sent");
      } catch (emailError) {
        console.error("❌ order email error:", emailError);
      }
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