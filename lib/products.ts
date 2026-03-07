export type Product = {
    id: string;
    name: string;
    priceEUR: number;
    description?: string;
    frontImage: string; // shown on floating cards
    backImage: string;  // shown on expanded back side (different)
  };
  
  function svgDataUri(bg1: string, bg2: string, label: string, accent: string) {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${bg1}"/>
          <stop offset="1" stop-color="${bg2}"/>
        </linearGradient>
        <filter id="n">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.12"/></feComponentTransfer>
        </filter>
      </defs>
      <rect width="900" height="1200" fill="url(#g)"/>
      <rect width="900" height="1200" filter="url(#n)"/>
      <g>
        <rect x="70" y="120" width="760" height="520" rx="60" fill="${accent}" opacity="0.92"/>
        <circle cx="240" cy="390" r="160" fill="rgba(255,255,255,0.85)"/>
        <rect x="260" y="240" width="520" height="90" rx="45" fill="rgba(255,255,255,0.75)"/>
      </g>
      <text x="70" y="1090" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="60" fill="rgba(255,255,255,0.92)">${label}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  
  function svgBackUri(bg1: string, bg2: string, label: string) {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${bg1}"/>
          <stop offset="1" stop-color="${bg2}"/>
        </linearGradient>
        <filter id="n">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" stitchTiles="stitch"/>
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer>
        </filter>
      </defs>
      <rect width="1400" height="900" fill="url(#g)"/>
      <rect width="1400" height="900" filter="url(#n)"/>
      <g fill="rgba(255,255,255,0.88)">
        <circle cx="1080" cy="260" r="170"/>
        <circle cx="380" cy="640" r="240"/>
        <rect x="160" y="120" width="820" height="110" rx="55"/>
      </g>
      <text x="70" y="830" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="64" fill="rgba(255,255,255,0.92)">${label} — details</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  
  export const products: Product[] = [
    {
      id: "p_sticker_pack",
      name: "Sticker Pack",
      priceEUR: 0.50,
      description: "12 sticker vinilici resistenti. Tagliati a sagoma, finitura opaca, waterproof.",
      frontImage: svgDataUri("#22c55e", "#14b8a6", "Stickers", "rgba(255,255,255,0.18)"),
      backImage: svgBackUri("#0ea5e9", "#22c55e", "Sticker Pack"),
    },
    {
      id: "p_aurora_print",
      name: "Aurora Print",
      priceEUR: 24,
      description: "Stampa matte 200gsm. Toni freddi, grana morbida, resa pulita su pareti chiare.",
      frontImage: svgDataUri("#4f46e5", "#06b6d4", "Aurora", "rgba(255,255,255,0.16)"),
      backImage: svgBackUri("#111827", "#06b6d4", "Aurora Print"),
    },
    {
      id: "p_mono_poster",
      name: "Mono Poster",
      priceEUR: 18,
      description: "Poster minimal con contrasto delicato. Perfetto per set-up studio e cornici sottili.",
      frontImage: svgDataUri("#111827", "#6b7280", "Mono", "rgba(255,255,255,0.14)"),
      backImage: svgBackUri("#0f172a", "#7c3aed", "Mono Poster"),
    },
    {
      id: "p_night_zine",
      name: "Night Zine",
      priceEUR: 12,
      description: "Zine 32 pagine, rilegatura a punto metallico. Mood scuro, ritmo editoriale.",
      frontImage: svgDataUri("#0f172a", "#7c3aed", "Night", "rgba(255,255,255,0.14)"),
      backImage: svgBackUri("#111827", "#ef4444", "Night Zine"),
    },
    {
      id: "p_canvas_wave",
      name: "Canvas Wave",
      priceEUR: 48,
      description: "Canvas 30×40, stampa pigmentata. Colori profondi, look caldo e materico.",
      frontImage: svgDataUri("#0ea5e9", "#22c55e", "Wave", "rgba(255,255,255,0.16)"),
      backImage: svgBackUri("#0ea5e9", "#f59e0b", "Canvas Wave"),
    },
  ];