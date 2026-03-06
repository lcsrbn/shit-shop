import Stripe from "stripe";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function moneyEUR(amountCents: number | null | undefined) {
  const v = typeof amountCents === "number" ? amountCents : 0;
  return `€${(v / 100).toFixed(2)}`;
}

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    const whsec = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !whsec) {
      return NextResponse.json({ error: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" }, { status: 400 });
    }

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, whsec);
    } catch (err: any) {
      console.error("Webhook signature verification failed.", err?.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // customer email from checkout
      const customerEmail =
        session.customer_details?.email ||
        (typeof session.customer_email === "string" ? session.customer_email : null);

      // line items
      const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      const lines = items.data
        .map((li) => {
          const name = li.description ?? "Item";
          const qty = li.quantity ?? 1;
          const amount = li.amount_total ?? li.amount_subtotal ?? 0;
          return `• ${name} × ${qty} — ${moneyEUR(amount)}`;
        })
        .join("\n");

      const total = moneyEUR(session.amount_total);

      // send email (if SMTP configured)
      const transport = getTransport();
      const from = process.env.EMAIL_FROM;
      if (transport && from && customerEmail) {
        const subject = `Conferma ordine — ${total}`;
        const text =
          `Ciao!\n\nPagamento confermato.\n\n` +
          `Ordine:\n${lines}\n\n` +
          `Totale: ${total}\n\n` +
          `Grazie!\n`;

        await transport.sendMail({
          from,
          to: customerEmail,
          subject,
          text,
        });
      } else {
        console.log("Email skipped (missing SMTP/EMAIL_FROM/customerEmail).", {
          hasTransport: !!transport,
          from: !!from,
          customerEmail,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err?.message ?? "Webhook error" }, { status: 500 });
  }
}