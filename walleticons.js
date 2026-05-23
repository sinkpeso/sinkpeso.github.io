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

        // ── GCash — blue G mark ────────────────────────────────────────────────
        gcash: {
            bg: "#0070E0",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#0070E0"/>
                <text x="20" y="27" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
                    font-size="20" font-weight="900" fill="#ffffff">G</text>
                <path d="M22 21h5v2.5a7 7 0 01-7 2.5 7 7 0 010-14 7 7 0 014.9 2" 
                    stroke="#7DD4FC" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            </svg>`
        },

        // ── Maya — teal/green wordmark M ──────────────────────────────────────
        maya: {
            bg: "#00A859",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#00A859"/>
                <path d="M9 28V14l7 9 7-9v14M27 14l4 7-4 7" 
                    stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>`
        },

        // ── GoTyme — coral/orange G ───────────────────────────────────────────
        gotyme: {
            bg: "#FF5733",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#FF5733"/>
                <text x="20" y="28" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
                    font-size="22" font-weight="900" fill="#ffffff">G</text>
            </svg>`
        },

        // ── Tyme / GoTyme alias ───────────────────────────────────────────────
        tyme: {
            bg: "#FF5733",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#FF5733"/>
                <text x="20" y="28" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
                    font-size="22" font-weight="900" fill="#ffffff">G</text>
            </svg>`
        },

        // ── SeaBank — ocean blue wave ─────────────────────────────────────────
        seabank: {
            bg: "#1A56DB",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#1A56DB"/>
                <path d="M8 24c3-4 5-4 8 0s5 4 8 0 5-4 8 0" 
                    stroke="#93C5FD" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M8 18c3-3 5-3 8 0s5 3 8 0 5-3 8 0" 
                    stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            </svg>`
        },

        // ── CIMB — red C ──────────────────────────────────────────────────────
        cimb: {
            bg: "#CC0001",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#CC0001"/>
                <path d="M27 14a10 10 0 100 12" 
                    stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
                <path d="M27 17a6 6 0 100 6" 
                    stroke="#FECACA" stroke-width="2" stroke-linecap="round" fill="none"/>
            </svg>`
        },

        // ── BPI — red/maroon building columns ────────────────────────────────
        bpi: {
            bg: "#8B0000",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#8B0000"/>
                <rect x="8" y="28" width="24" height="3" rx="1" fill="#ffffff"/>
                <rect x="8" y="10" width="24" height="3" rx="1" fill="#ffffff"/>
                <rect x="11" y="13" width="3" height="15" rx="1" fill="#FECACA"/>
                <rect x="18.5" y="13" width="3" height="15" rx="1" fill="#FECACA"/>
                <rect x="26" y="13" width="3" height="15" rx="1" fill="#FECACA"/>
            </svg>`
        },

        // ── UnionBank — purple U shield ───────────────────────────────────────
        unionbank: {
            bg: "#4B0082",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#4B0082"/>
                <path d="M20 9l-10 4v8c0 6 4.5 10.5 10 12 5.5-1.5 10-6 10-12v-8l-10-4z" 
                    stroke="#C4B5FD" stroke-width="1.5" fill="rgba(196,181,253,0.15)"/>
                <path d="M14 17v6a6 6 0 0012 0v-6" 
                    stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            </svg>`
        },

        // ── Union Bank alias ──────────────────────────────────────────────────
        union: {
            bg: "#4B0082",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#4B0082"/>
                <path d="M20 9l-10 4v8c0 6 4.5 10.5 10 12 5.5-1.5 10-6 10-12v-8l-10-4z" 
                    stroke="#C4B5FD" stroke-width="1.5" fill="rgba(196,181,253,0.15)"/>
                <path d="M14 17v6a6 6 0 0012 0v-6" 
                    stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            </svg>`
        },

        // ── Cash — green banknote ─────────────────────────────────────────────
        cash: {
            bg: "#00E676",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#00E676"/>
                <rect x="7" y="14" width="26" height="16" rx="3" fill="rgba(0,0,0,0.18)"/>
                <rect x="9" y="16" width="22" height="12" rx="2" stroke="#065f46" stroke-width="1" fill="rgba(6,95,70,0.25)"/>
                <circle cx="20" cy="22" r="4" stroke="#065f46" stroke-width="1.5" fill="none"/>
                <path d="M20 19v6M17 22h6" stroke="#065f46" stroke-width="1.2" stroke-linecap="round"/>
            </svg>`
        },

        // ── Landbank ─────────────────────────────────────────────────────────
        landbank: {
            bg: "#1B5E20",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#1B5E20"/>
                <path d="M20 10L8 17v2h24v-2L20 10z" fill="#A5D6A7"/>
                <rect x="11" y="19" width="3" height="11" rx="1" fill="#A5D6A7"/>
                <rect x="18.5" y="19" width="3" height="11" rx="1" fill="#A5D6A7"/>
                <rect x="26" y="19" width="3" height="11" rx="1" fill="#A5D6A7"/>
                <rect x="8" y="30" width="24" height="2.5" rx="1" fill="#A5D6A7"/>
            </svg>`
        },

        // ── PNB (Philippine National Bank) ────────────────────────────────────
        pnb: {
            bg: "#003087",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#003087"/>
                <text x="20" y="27" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
                    font-size="13" font-weight="900" fill="#ffffff" letter-spacing="-1">PNB</text>
            </svg>`
        },

        // ── Metrobank ─────────────────────────────────────────────────────────
        metrobank: {
            bg: "#003087",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#003087"/>
                <text x="20" y="27" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
                    font-size="9" font-weight="900" fill="#ffffff">METRO</text>
            </svg>`
        },

        // ── Security Bank ─────────────────────────────────────────────────────
        securitybank: {
            bg: "#C41E3A",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#C41E3A"/>
                <path d="M20 10l-9 4v7c0 5 4 9 9 10 5-1 9-5 9-10v-7l-9-4z" 
                    fill="rgba(255,255,255,0.12)" stroke="#FCA5A5" stroke-width="1.2"/>
                <path d="M15 20h10M15 23h7" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            </svg>`
        },

        // ── Palawan Pawnshop / PalawanPay ─────────────────────────────────────
        palawan: {
            bg: "#E65C00",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#E65C00"/>
                <text x="20" y="27" text-anchor="middle" font-family="Arial Black,Arial,sans-serif"
                    font-size="18" font-weight="900" fill="#ffffff">P</text>
            </svg>`
        },

        // ── Coins.ph ──────────────────────────────────────────────────────────
        coins: {
            bg: "#2563EB",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#2563EB"/>
                <circle cx="20" cy="20" r="9" stroke="#93C5FD" stroke-width="2" fill="rgba(147,197,253,0.1)"/>
                <circle cx="20" cy="20" r="5" stroke="#ffffff" stroke-width="2" fill="none"/>
                <circle cx="20" cy="20" r="2" fill="#ffffff"/>
            </svg>`
        },

        // ── PayMaya alias ─────────────────────────────────────────────────────
        paymaya: {
            bg: "#00A859",
            svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="10" fill="#00A859"/>
                <path d="M9 28V14l7 9 7-9v14M27 14l4 7-4 7" 
                    stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
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
