import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServerAuthClient } from "@/lib/supabase-server-auth";
import { getProductAndVariantByPublicIds } from "@/lib/products-db";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type ReqBody = {
  orderId?: string;
  items: { id: string; variantId: string; qty: number }[];
};

function clampQty(q: number) {
  if (!Number.isFinite(q)) return 1;
  return Math.max(1, Math.min(99, Math.floor(q)));
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SITE_URL" },
        { status: 500 }
      );
    }

    const supabase = await getSupabaseServerAuthClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Checkout auth error:", userError);
    }

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to checkout" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as ReqBody;

    if (!body?.items?.length) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const normalizedItems = await Promise.all(
      body.items.map(async ({ id, variantId, qty }) => {
        const match = await getProductAndVariantByPublicIds({
          productPublicId: id,
          variantPublicId: variantId,
        });

        if (!match) {
          throw new Error(`Unknown product or variant: ${id} / ${variantId}`);
        }

        const normalizedQty = clampQty(qty);

        if (match.variant.stock_quantity < normalizedQty) {
          throw new Error(
            `Not enough stock for ${match.product.name} · ${match.variant.name}`
          );
        }

        return {
          productId: match.product.public_id,
          productName: match.product.name,
          variantId: match.variant.public_id,
          variantName: match.variant.name,
          sku: match.variant.sku,
          qty: normalizedQty,
          unitPriceEUR: Number(match.variant.price_eur),
          lineTotalEUR: Number(match.variant.price_eur) * normalizedQty,
        };
      })
    );

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] =
      normalizedItems.map((item) => ({
        quantity: item.qty,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(item.unitPriceEUR * 100),
          product_data: {
            name: `${item.productName} · ${item.variantName}`,
          },
        },
      }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,

      customer_email: user.email,

      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: [
          "IT",
          "AT",
          "BE",
          "DK",
          "ES",
          "FI",
          "FR",
          "IE",
          "LU",
          "NL",
          "PT",
          "SE",
        ],
      },

      custom_fields: [
        {
          key: "tax_code",
          label: {
            type: "custom",
            custom: "Tax code",
          },
          type: "text",
          optional: true,
        },
        {
          key: "order_note",
          label: {
            type: "custom",
            custom: "Order note",
          },
          type: "text",
          optional: true,
        },
      ],

      metadata: {
        source: "shit-shop",
        orderId: body.orderId ?? "",
        userId: user.id,
        userEmail: user.email ?? "",
        itemsJson: JSON.stringify(normalizedItems),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}