import { Resend } from "resend";

type EmailOrderItem = {
  productName?: string;
  variantName?: string;
  qty?: number;
  unitPriceEUR?: number;
  lineTotalEUR?: number;
};

type OrderEmailInput = {
  orderId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  amountTotal: number | null;
  currency: string | null;
  items: EmailOrderItem[];
};

function isEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.EMAIL_FROM &&
      process.env.ADMIN_ORDER_EMAIL
  );
}

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function formatMoneyCents(value: number | null, currency: string | null) {
  if (value == null) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value / 100);
}

function formatMoneyEUR(value: number | undefined, currency: string | null) {
  if (value == null || !Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency ?? "EUR").toUpperCase(),
  }).format(value);
}

function renderItemsText(items: EmailOrderItem[], currency: string | null) {
  if (items.length === 0) {
    return "No line items available.";
  }

  return items
    .map((item) => {
      return [
        `- ${item.productName ?? "Product"}`,
        `  Variant: ${item.variantName ?? "Default"}`,
        `  Quantity: ${item.qty ?? 1}`,
        `  Unit price: ${formatMoneyEUR(item.unitPriceEUR, currency)}`,
        `  Line total: ${formatMoneyEUR(item.lineTotalEUR, currency)}`,
      ].join("\n");
    })
    .join("\n\n");
}

function renderItemsHtml(items: EmailOrderItem[], currency: string | null) {
  if (items.length === 0) {
    return "<p>No line items available.</p>";
  }

  return `
    <ul>
      ${items
        .map(
          (item) => `
            <li>
              <strong>${item.productName ?? "Product"}</strong><br />
              Variant: ${item.variantName ?? "Default"}<br />
              Quantity: ${item.qty ?? 1}<br />
              Unit price: ${formatMoneyEUR(item.unitPriceEUR, currency)}<br />
              Line total: ${formatMoneyEUR(item.lineTotalEUR, currency)}
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

export async function sendCustomerOrderConfirmation(input: OrderEmailInput) {
  if (!input.customerEmail) {
    console.warn("Customer email skipped: missing customer email");
    return;
  }

  if (!isEmailConfigured()) {
    console.warn("Customer email skipped: Resend is not configured");
    return;
  }

  const resend = getResendClient();

  if (!resend) {
    console.warn("Customer email skipped: missing Resend client");
    return;
  }

  const orderLabel = input.orderId ?? "Order";
  const total = formatMoneyCents(input.amountTotal, input.currency);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: input.customerEmail,
    subject: `Order confirmation — ${orderLabel}`,
    text: `
Thank you for your order.

Order: ${orderLabel}
Customer: ${input.customerName ?? input.customerEmail}
Total: ${total}

Items:

${renderItemsText(input.items, input.currency)}
    `.trim(),
    html: `
      <h1>Thank you for your order</h1>
      <p>Your order has been received successfully.</p>

      <p><strong>Order:</strong> ${orderLabel}</p>
      <p><strong>Customer:</strong> ${input.customerName ?? input.customerEmail}</p>
      <p><strong>Total:</strong> ${total}</p>

      <h2>Items</h2>
      ${renderItemsHtml(input.items, input.currency)}
    `,
  });

  if (error) {
    throw error;
  }
}

export async function sendAdminOrderNotification(input: OrderEmailInput) {
  const adminEmail = process.env.ADMIN_ORDER_EMAIL;

  if (!adminEmail) {
    console.warn("Admin email skipped: ADMIN_ORDER_EMAIL is not configured");
    return;
  }

  if (!isEmailConfigured()) {
    console.warn("Admin email skipped: Resend is not configured");
    return;
  }

  const resend = getResendClient();

  if (!resend) {
    console.warn("Admin email skipped: missing Resend client");
    return;
  }

  const orderLabel = input.orderId ?? "Order";
  const total = formatMoneyCents(input.amountTotal, input.currency);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: adminEmail,
    subject: `New order received — ${orderLabel}`,
    text: `
A new order has been received.

Order: ${orderLabel}
Customer: ${input.customerName ?? "—"}
Email: ${input.customerEmail ?? "—"}
Total: ${total}

Items:

${renderItemsText(input.items, input.currency)}
    `.trim(),
    html: `
      <h1>New order received</h1>

      <p><strong>Order:</strong> ${orderLabel}</p>
      <p><strong>Customer:</strong> ${input.customerName ?? "—"}</p>
      <p><strong>Email:</strong> ${input.customerEmail ?? "—"}</p>
      <p><strong>Total:</strong> ${total}</p>

      <h2>Items</h2>
      ${renderItemsHtml(input.items, input.currency)}
    `,
  });

  if (error) {
    throw error;
  }
}