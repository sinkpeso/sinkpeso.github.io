// walleticons.js — Branded wallet icon system for SINKPESO
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
//   1. Known wallets (GCash, Maya, BPI, etc.) → branded inline SVG icon
//   2. Unknown wallets → letter-avatar using the wallet's own accent color
//
// ADDING A NEW BRAND
//   1. Add an entry to WALLET_BRAND_ICONS below.
//   2. The key is the lowercase wallet name (or partial match).
//   3. Value is an object: { svg: "<svg>...</svg>", bg: "#hexcolor" }
//
// USAGE
//   window.walleticons.WalletIcon — React component
//     e(WalletIcon, { name: "GCash", color: "#00E676", size: 28 })
//
//   window.walleticons.getWalletBrand — plain helper
//     getWalletBrand("gcash") → { svg, bg } or null
// ─────────────────────────────────────────────────────────────────────────────

(function () {
    const e = React.createElement;

    // ── BRANDED SVG ICONS ─────────────────────────────────────────────────────
    // Each value: { bg: accent color, svg: raw SVG string (viewBox 0 0 40 40) }
    // Keep SVGs simple — they render at 28–32px so fine detail is invisible.
    const WALLET_BRAND_ICONS = {

// ── GCash ───────────────────────────────────────────────────────────────
gcash: {
    bg: "#007DFE",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#007DFE"/>
        <path d="M27 20a7 7 0 11-2-5"
            stroke="#ffffff" stroke-width="3"
            stroke-linecap="round"/>
        <path d="M21 20h7"
            stroke="#7DD3FC" stroke-width="3"
            stroke-linecap="round"/>
    </svg>`
},

// ── Maya ────────────────────────────────────────────────────────────────
maya: {
    bg: "#00C389",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00C389"/>
        <path d="M9 28V14l7 8 7-8v14"
            stroke="#ffffff" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M27 14l4 7-4 7"
            stroke="#D1FAE5" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
},

// ── PayMaya alias ───────────────────────────────────────────────────────
paymaya: {
    bg: "#00C389",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00C389"/>
        <path d="M9 28V14l7 8 7-8v14"
            stroke="#ffffff" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M27 14l4 7-4 7"
            stroke="#D1FAE5" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
},

// ── BDO Unibank ────────────────────────────────────────────────────────
bdo: {
    bg: "#0038A8",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0038A8"/>
        <circle cx="20" cy="20" r="8"
            stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="20" cy="20" r="3"
            fill="#EF4444"/>
        <path d="M20 12v16M12 20h16"
            stroke="#ffffff" stroke-width="1.8"/>
    </svg>`
},

// ── BDO Unibank alias ──────────────────────────────────────────────────
bdounibank: {
    bg: "#0038A8",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0038A8"/>
        <circle cx="20" cy="20" r="8"
            stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="20" cy="20" r="3"
            fill="#EF4444"/>
        <path d="M20 12v16M12 20h16"
            stroke="#ffffff" stroke-width="1.8"/>
    </svg>`
},

// ── MariBank ───────────────────────────────────────────────────────────
maribank: {
    bg: "#6D28D9",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="mariGrad" x1="0" y1="0" x2="40" y2="40">
                <stop stop-color="#8B5CF6"/>
                <stop offset="1" stop-color="#4C1D95"/>
            </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#mariGrad)"/>
        <text x="20" y="27"
            text-anchor="middle"
            font-family="Arial Black,Arial,sans-serif"
            font-size="18"
            font-weight="900"
            fill="#ffffff">M</text>
    </svg>`
},

// ── PayPal ─────────────────────────────────────────────────────────────
paypal: {
    bg: "#003087",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#003087"/>
        <path d="M15 10h8a5 5 0 010 10h-5l-1 7"
            stroke="#ffffff"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"/>
        <path d="M18 13h7a4 4 0 010 8"
            stroke="#7DD3FC"
            stroke-width="2"
            stroke-linecap="round"/>
    </svg>`
},

// ── GrabPay ────────────────────────────────────────────────────────────
grabpay: {
    bg: "#00B14F",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00B14F"/>
        <path d="M12 23c2-4 4-6 8-6s6 2 8 6"
            stroke="#ffffff"
            stroke-width="2.8"
            stroke-linecap="round"/>
        <path d="M12 18c2-3 4-4 8-4s6 1 8 4"
            stroke="#D1FAE5"
            stroke-width="2.3"
            stroke-linecap="round"/>
    </svg>`
},

// ── ShopeePay ──────────────────────────────────────────────────────────
shopeepay: {
    bg: "#EE4D2D",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#EE4D2D"/>
        <path d="M14 17h12v9a4 4 0 01-4 4h-4a4 4 0 01-4-4v-9z"
            stroke="#ffffff"
            stroke-width="2.2"
            fill="rgba(255,255,255,0.08)"/>
        <path d="M17 17a3 3 0 016 0"
            stroke="#ffffff"
            stroke-width="2"/>
        <text x="20" y="25"
            text-anchor="middle"
            font-family="Arial Black,Arial,sans-serif"
            font-size="10"
            font-weight="900"
            fill="#ffffff">S</text>
    </svg>`
},

// ── Wise ───────────────────────────────────────────────────────────────
wise: {
    bg: "#06B6D4",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#06B6D4"/>
        <path d="M10 26l5-12 4 7 3-4 6 9"
            stroke="#ffffff"
            stroke-width="2.8"
            stroke-linecap="round"
            stroke-linejoin="round"/>
    </svg>`
},

// ── RCBC ───────────────────────────────────────────────────────────────
rcbc: {
    bg: "#006747",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#006747"/>
        <rect x="11" y="11" width="18" height="18"
            rx="4"
            stroke="#ffffff"
            stroke-width="2.3"/>
        <path d="M14 20h12"
            stroke="#D1FAE5"
            stroke-width="2.3"
            stroke-linecap="round"/>
    </svg>`
},

// ── EastWest Bank ──────────────────────────────────────────────────────
eastwest: {
    bg: "#B00020",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#B00020"/>
        <text x="20" y="26"
            text-anchor="middle"
            font-family="Arial Black,Arial,sans-serif"
            font-size="12"
            font-weight="900"
            fill="#ffffff">EW</text>
    </svg>`
},

// ── China Bank ─────────────────────────────────────────────────────────
chinabank: {
    bg: "#00796B",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00796B"/>
        <circle cx="20" cy="20" r="7"
            stroke="#ffffff"
            stroke-width="2"/>
        <path d="M20 13v14M13 20h14"
            stroke="#CCFBF1"
            stroke-width="2"/>
    </svg>`
},

// ── Tonik ──────────────────────────────────────────────────────────────
tonik: {
    bg: "#CC0F7A",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#CC0F7A"/>
        <text x="20" y="27"
            text-anchor="middle"
            font-family="Arial Black,Arial,sans-serif"
            font-size="18"
            font-weight="900"
            fill="#ffffff">T</text>
    </svg>`
},

// ── UNO Digital Bank ───────────────────────────────────────────────────
uno: {
    bg: "#111827",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#111827"/>
        <text x="20" y="25"
            text-anchor="middle"
            font-family="Arial Black,Arial,sans-serif"
            font-size="10"
            font-weight="900"
            fill="#ffffff">UNO</text>
    </svg>`
},

// ── UnionDigital Bank ──────────────────────────────────────────────────
uniondigital: {
    bg: "#5227CC",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#5227CC"/>
        <path d="M12 15v8a8 8 0 0016 0v-8"
            stroke="#ffffff"
            stroke-width="3"
            stroke-linecap="round"/>
        <circle cx="20" cy="23" r="2" fill="#C4B5FD"/>
    </svg>`
},

// ── AUB ────────────────────────────────────────────────────────────────
aub: {
    bg: "#1D4ED8",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1D4ED8"/>
        <text x="20" y="25"
            text-anchor="middle"
            font-family="Arial Black,Arial,sans-serif"
            font-size="11"
            font-weight="900"
            fill="#ffffff">AUB</text>
    </svg>`
},

// ── PNB ────────────────────────────────────────────────────────────────
pnb: {
    bg: "#0038A8",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0038A8"/>
        <text x="20" y="26"
            text-anchor="middle"
            font-family="Arial Black,Arial,sans-serif"
            font-size="11"
            font-weight="900"
            fill="#ffffff">PNB</text>
    </svg>`
},

// ── DBP ────────────────────────────────────────────────────────────────
dbp: {
    bg: "#0057B8",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0057B8"/>
        <circle cx="20" cy="20" r="8"
            stroke="#ffffff"
            stroke-width="2.2"/>
        <path d="M20 15v10M15 20h10"
            stroke="#BFDBFE"
            stroke-width="2"
            stroke-linecap="round"/>
    </svg>`
},

// ── LandBank ───────────────────────────────────────────────────────────
landbank: {
    bg: "#1B5E20",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1B5E20"/>
        <path d="M20 11L10 17v2h20v-2L20 11z"
            fill="#A7F3D0"/>
        <rect x="12" y="19" width="3" height="10"
            rx="1" fill="#A7F3D0"/>
        <rect x="18.5" y="19" width="3" height="10"
            rx="1" fill="#A7F3D0"/>
        <rect x="25" y="19" width="3" height="10"
            rx="1" fill="#A7F3D0"/>
        <rect x="10" y="29" width="20" height="2"
            rx="1" fill="#A7F3D0"/>
    </svg>`
},	
	// ── Cash ─────────────────────────────────────────────────────────────
cash: {
    bg: "#00E676",
    svg: `<svg viewBox="0 0 40 40" fill="none"
        xmlns="http://www.w3.org/2000/svg">

        <!-- Background -->
        <rect width="40" height="40" rx="10" fill="#00E676"/>

        <!-- Bill -->
        <rect x="7" y="12" width="26" height="16" rx="4"
            fill="#065F46"/>

        <!-- Inner border -->
        <rect x="10" y="15" width="20" height="10" rx="2"
            stroke="#A7F3D0"
            stroke-width="1.5"
            fill="none"/>

        <!-- Peso symbol -->
        <text x="20" y="23"
            text-anchor="middle"
            font-family="Arial Black,Arial,sans-serif"
            font-size="10"
            font-weight="900"
            fill="#A7F3D0">₱</text>

    </svg>`
},

    };

	

    // ── BRAND LOOKUP ─────────────────────────────────────────────────────────
    // Match wallet name to a brand entry.
    // Tries exact lowercase match first, then partial substring match.
    function getWalletBrand(name) {
        if (!name || typeof name !== "string") return null;
        const key = name.trim().toLowerCase().replace(/\s+/g, "");
        // Exact match
        if (WALLET_BRAND_ICONS[key]) return WALLET_BRAND_ICONS[key];
        // Partial match — wallet name contains a known brand key
        for (const brand of Object.keys(WALLET_BRAND_ICONS)) {
            if (key.includes(brand) || brand.includes(key)) {
                return WALLET_BRAND_ICONS[brand];
            }
        }
        return null;
    }

    // ── WalletIcon COMPONENT ──────────────────────────────────────────────────
    // Renders a branded icon for known wallets, or a colored letter-avatar for unknown.
    //
    // Props:
    //   name   (string)  — wallet name, e.g. "GCash", "My Custom Wallet"
    //   color  (string)  — the wallet's accent color (from WALLET_COLORS), used for fallback avatar
    //   size   (number)  — icon size in px (default 32)
    //   radius (number)  — border-radius (default 9)
    //
    function WalletIcon({ name = "", color = "#64748B", size = 32, radius = 9 }) {
        const brand = getWalletBrand(name);

        // ── BRANDED: inject SVG as HTML ────────────────────────────────────────
        if (brand) {
            return e('div', {
                style: {
                    width: size, height: size, borderRadius: radius,
                    overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    // subtle shadow so the icon lifts off any background
                    boxShadow: "0 1px 4px rgba(0,0,0,0.28)",
                },
                dangerouslySetInnerHTML: { __html: brand.svg }
            });
        }

        // ── FALLBACK: letter-avatar using wallet's own color ───────────────────
        // Takes the first letter of the wallet name, uppercased.
        // Background is a low-opacity version of the wallet's accent color.
        const letter  = (name.trim()[0] || "?").toUpperCase();
        const fontSize = Math.round(size * 0.42);

        return e('div', {
            style: {
                width: size, height: size, borderRadius: radius, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: color + "22",          // 13% opacity tint
                border: `1.5px solid ${color}55`,  // 33% opacity border
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            }
        },
            e('span', {
                style: {
                    fontSize, fontWeight: 800, color,
                    fontFamily: "DM Sans, -apple-system, sans-serif",
                    lineHeight: 1, letterSpacing: "-0.01em",
                    userSelect: "none",
                }
            }, letter)
        );
    }

    // ── EXPOSE TO WINDOW ──────────────────────────────────────────────────────
    window.walleticons = {
        WalletIcon,
        getWalletBrand,
    };

})();
