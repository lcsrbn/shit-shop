"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { PALETTE } from "@/lib/world/sprites";

export type TerminalProduct = {
  id: string;
  name: string;
  description: string;
  priceEUR: number;
  defaultVariantId: string;
  variants: Array<{
    id: string;
    name: string;
    priceEUR: number;
    stock: number;
  }>;
};

type Line = {
  text: string;
  color?: string;
  cmd?: string; // clicking the line runs this command (mobile-friendly)
};

const BOOT_LINES: Line[] = [
  { text: "SHIT-SHOP TERMINAL v0.1", color: PALETTE.ghost },
  { text: "connecting to the other plane..." },
  { text: "connected. it was waiting." },
  { text: "" },
  { text: "type HELP, or tap a line.", color: PALETTE.mauve },
  { text: "" },
];

const HELP_LINES: Line[] = [
  { text: "LIST        what can cross over", cmd: "LIST" },
  { text: "SHOW n      look closer at item n" },
  { text: "ADD n       move item n to the cart" },
  { text: "CART        what is ready to cross", cmd: "CART" },
  { text: "CLEAR       empty the cart", cmd: "CLEAR" },
  { text: "BUY         cross over (checkout)", cmd: "BUY" },
  { text: "EXIT        the screen goes dark", cmd: "EXIT" },
];

function eur(value: number) {
  return `EUR ${value.toFixed(2)}`;
}

export default function TerminalShop({
  catalog,
  onClose,
}: {
  catalog: TerminalProduct[];
  onClose: () => void;
}) {
  const cart = useCart();
  const router = useRouter();

  const [lines, setLines] = useState<Line[]>(BOOT_LINES);
  const [input, setInput] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  function print(next: Line[]) {
    setLines((prev) => [...prev, ...next]);
  }

  function productLines(): Line[] {
    if (catalog.length === 0) {
      return [{ text: "nothing can cross over today." }];
    }

    return catalog.map((p, i) => {
      const inStock = p.variants.some((v) => v.stock > 0);

      return {
        text: `${i + 1}. ${p.name}  ${eur(p.priceEUR)}${inStock ? "" : "  [GONE]"}`,
        color: inStock ? PALETTE.ghost : PALETTE.mauve,
        cmd: `SHOW ${i + 1}`,
      };
    });
  }

  function resolveVariant(ref: string) {
    const [nRaw, vRaw] = ref.split(".");
    const product = catalog[Number(nRaw) - 1];
    if (!product) return null;

    const variant = vRaw
      ? product.variants[Number(vRaw) - 1]
      : product.variants.find((v) => v.id === product.defaultVariantId) ??
        product.variants[0];

    if (!variant) return null;
    return { product, variant };
  }

  function runCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    print([{ text: `> ${trimmed}`, color: PALETTE.mauve }]);

    const [word, arg] = trimmed.split(/\s+/);
    const cmd = word.toUpperCase();

    switch (cmd) {
      case "HELP":
        print(HELP_LINES);
        break;

      case "LIST":
        print(productLines());
        break;

      case "SHOW": {
        const product = catalog[Number(arg) - 1];
        if (!product) {
          print([{ text: "there is no such item. try LIST.", cmd: "LIST" }]);
          break;
        }

        const desc = product.description?.trim();
        print([
          { text: product.name, color: PALETTE.ghost },
          ...(desc ? [{ text: desc }] : []),
          ...product.variants.map((v, j) => ({
            text: `${arg}.${j + 1}  ${v.name}  ${eur(v.priceEUR)}${
              v.stock > 0 ? "" : "  [GONE]"
            }`,
            color: v.stock > 0 ? undefined : PALETTE.mauve,
            cmd: v.stock > 0 ? `ADD ${arg}.${j + 1}` : undefined,
          })),
          { text: `type ADD ${arg}, or tap a variant.`, color: PALETTE.mauve },
        ]);
        break;
      }

      case "ADD": {
        const found = arg ? resolveVariant(arg) : null;
        if (!found) {
          print([{ text: "there is no such item. try LIST.", cmd: "LIST" }]);
          break;
        }

        if (found.variant.stock <= 0) {
          print([{ text: "the other plane is out of this." }]);
          break;
        }

        cart.add(found.product.id, found.variant.id);
        print([
          {
            text: `${found.product.name} is ready to cross over.`,
            color: PALETTE.ghost,
          },
          { text: "type CART to see, BUY to go.", color: PALETTE.mauve },
        ]);
        break;
      }

      case "CART": {
        if (cart.detailedItems.length === 0) {
          print([{ text: "the cart is empty. it is patient." }]);
          break;
        }

        print([
          ...cart.detailedItems.map((item) => ({
            text: `${item.qty} x ${item.product.name} (${item.variant.name})  ${eur(
              item.lineEUR
            )}`,
          })),
          {
            text: `total  ${eur(cart.subtotalEUR)}`,
            color: PALETTE.ghost,
          },
          { text: "type BUY to cross over.", cmd: "BUY", color: PALETTE.mauve },
        ]);
        break;
      }

      case "CLEAR":
        cart.clear();
        print([{ text: "the cart forgets everything." }]);
        break;

      case "BUY":
      case "CHECKOUT": {
        if (cart.count === 0) {
          print([{ text: "nothing to cross over. try LIST.", cmd: "LIST" }]);
          break;
        }

        print([{ text: "leaving this plane...", color: PALETTE.ghost }]);
        window.setTimeout(() => router.push("/checkout"), 700);
        break;
      }

      case "EXIT":
      case "QUIT":
        onClose();
        break;

      default:
        print([
          {
            text: `"${trimmed.toLowerCase()}" means nothing here. yet.`,
            color: PALETTE.mauve,
          },
        ]);
        break;
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 4,
        background: "rgba(18,16,29,.98)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 18px",
        color: PALETTE.gold,
        fontSize: 10,
        lineHeight: 2,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0px, rgba(0,0,0,.22) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            onClick={
              line.cmd
                ? (e) => {
                    e.stopPropagation();
                    runCommand(line.cmd as string);
                  }
                : undefined
            }
            style={{
              color: line.color ?? PALETTE.gold,
              cursor: line.cmd ? "pointer" : "default",
              textShadow: `0 0 6px ${PALETTE.gold}44`,
              minHeight: 20,
              whiteSpace: "pre-wrap",
            }}
          >
            {line.text}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderTop: `2px solid ${PALETTE.dark}`,
          paddingTop: 10,
        }}
      >
        <span style={{ color: PALETTE.ghost }}>&gt;</span>

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              runCommand(input);
              setInput("");
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          style={{
            flex: 1,
            background: "transparent",
            border: 0,
            outline: "none",
            color: PALETTE.ghost,
            fontFamily: "inherit",
            fontSize: 10,
            textShadow: `0 0 6px ${PALETTE.gold}44`,
          }}
        />
      </div>
    </div>
  );
}
