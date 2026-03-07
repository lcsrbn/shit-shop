import Stripe from "stripe";
import { NextResponse } from "next/server";
import { products } from "@/lib/products";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type ReqBody = {
  orderId?: string;
  items: { id: string; qty: number }[];
};

function clampQty(q: number) {
  if (!Number.isFinite(q)) return 1;
  return Math.max(1, Math.min(99, Math.floor(q)));
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_SITE_URL" }, { status: 500 });
    }

    const body = (await req.json()) as ReqBody;

    if (!body?.items?.length) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = body.items.map(
      ({ id, qty }) => {
        const p = products.find((x) => x.id === id);
        if (!p) throw new Error(`Unknown product id: ${id}`);

        return {
          quantity: clampQty(qty),
          price_data: {
            currency: "eur",
            unit_amount: Math.round(p.priceEUR * 100),
            product_data: {
              name: p.name,
            },
          },
        };
      }
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,

      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: [
          "IT",
          "AT",
          "BE",
          "DE",
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
            custom: "Codice fiscale",
          },
          type: "text",
          optional: true,
        },
        {
          key: "order_note",
          label: {
            type: "custom",
            custom: "Note ordine",
          },
          type: "text",
          optional: true,
        },
      ],

      metadata: {
        source: "shit-shop",
        orderId: body.orderId ?? "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}