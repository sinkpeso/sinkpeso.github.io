// walleticons.js — Branded wallet icon system for SINKPESO
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS
//   1. Known wallets → branded inline SVG icon (Lucide-style, premium dark)
//   2. Unknown wallets → letter-avatar using the wallet's own accent color
//   3. getWalletBrand returns { svg, bg, type }
//
// KEY NORMALIZATION
//   All keys are lowercase + no spaces. getWalletBrand strips spaces and
//   lowercases input before lookup. Aliases cover every realistic app-passed
//   variant (e.g. "BDO Unibank", "BDO", "bdo" all hit the same icon).
//
// LOOKUP STRATEGY (in order):
//   1. Exact match after normalize()
//   2. Alias table — explicit multi-word names your app is likely to pass
//   3. Guarded substring match — key must be ≥4 chars to avoid false matches
//      on short strings like "bdo" matching "bdounibank"
//
// ADDING A BRAND
//   Add entry to WALLET_BRAND_ICONS (key = normalized lowercase).
//   Add any multi-word aliases to WALLET_ALIASES.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
    const e = React.createElement;

    // ── HELPER ────────────────────────────────────────────────────────────────
    // Strips whitespace and lowercases. Applied to both keys and input names.
    function normalize(str) {
        return str.trim().toLowerCase().replace(/\s+/g, "");
    }

    // ── ALIAS TABLE ───────────────────────────────────────────────────────────
    // Maps any normalized variant your app might pass → canonical key.
    // Add here whenever your app stores a wallet name differently from the key.
    const WALLET_ALIASES = {
        // GCash
        "gcash":                    "gcash",
        // Maya
        "maya":                     "maya",
        "paymaya":                  "maya",
        // GrabPay
        "grabpay":                  "grabpay",
        // ShopeePay
        "shopeepay":                "shopeepay",
        // PayPal
        "paypal":                   "paypal",
        // Wise
        "wise":                     "wise",
        // GoTyme — covers "GoTyme", "GoTyme Bank", "Go Tyme"
        "gotyme":                   "gotyme",
        "gotymebank":               "gotyme",
        "gotyme bank":              "gotyme",   // pre-normalize variant (kept for safety)
        // HelloMoney — covers "HelloMoney", "HelloMoney by AUB"
        "hellomoney":               "hellomoney",
        "hellomonebyaub":           "hellomoney",
        "hellomonebyaub":           "hellomoney",
        "hellomoneybyaub":          "hellomoney",
        // BDO
        "bdo":                      "bdo",
        "bdounibank":               "bdo",
        "bdounibankbdo":            "bdo",
        // BPI
        "bpi":                      "bpi",
        "bankofthephilippineislands":"bpi",
        // Metrobank
        "metrobank":                "metrobank",
        "metropolitanbankandtrust": "metrobank",
        // MariBank — covers "MariBank", "MariBank PH", "Maribank PH (Digital Bank Version)"
        "maribank":                 "maribank",
        "maribankhph":              "maribank",   // common strip result of "MariBank PH"
        "maribankph":               "maribank",
        "maribankphdigitalbankversionaliasdigitalbank": "maribank",
        // RCBC
        "rcbc":                     "rcbc",
        "rizalcommercialbanking":   "rcbc",
        "rizalcommercialbankingcorporation": "rcbc",
        // EastWest — covers "EastWest", "EastWest Bank", "Eastwest Bank"
        "eastwest":                 "eastwest",
        "eastwestbank":             "eastwest",
        // China Bank — covers "China Bank", "ChinaBank", "Chinabank Savings"
        "chinabank":                "chinabank",
        "chinabankph":              "chinabank",
        "chinabanksavings":         "chinabank",
        // LandBank
        "landbank":                 "landbank",
        "landbankofthephilippines": "landbank",
        // DBP
        "dbp":                      "dbp",
        "developmentbankofthephilippines": "dbp",
        // PNB
        "pnb":                      "pnb",
        "philippinenationalbank":   "pnb",
        // AUB
        "aub":                      "aub",
        "asianunitedbank":          "aub",
        // --- extras kept from prior version ---
        "tonik":                    "tonik",
        "uno":                      "uno",
        "uniondigital":             "uniondigital",
        "seabank":                  "seabank",
        "coins":                    "coins",
        "coinsph":                  "coins",
        "cash":                     "cash",
    };

    // ── BRAND ICONS ───────────────────────────────────────────────────────────

    const WALLET_BRAND_ICONS = {

// ── GCash ────────────────────────────────────────────────────────────────────
gcash: {
    bg: "#0066CC",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0066CC"/>
        <path d="M27 20a7 7 0 11-2-5" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M21 20h7" stroke="#93C5FD" stroke-width="2.8" stroke-linecap="round"/>
    </svg>`
},

// ── Maya ─────────────────────────────────────────────────────────────────────
// FIX: paths redrawn to stay within viewBox (old version clipped at x=35)
maya: {
    bg: "#05B27C",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#05B27C"/>
        <path d="M8 27V15l7 9 7-9v12" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M25 15c2 0 4 1.5 4 5s-2 6-5 6" stroke="#A7F3D0" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M25 20h5" stroke="#A7F3D0" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`
},

// ── GrabPay ───────────────────────────────────────────────────────────────────
grabpay: {
    bg: "#009A44",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#009A44"/>
        <path d="M20 14c-5 0-9 3-9 8s4 8 9 8" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M20 18c-2.5 0-5 1.5-5 4" stroke="#6EE7B7" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="26" cy="22" r="3.5" stroke="#ffffff" stroke-width="2.2"/>
        <path d="M25 22h3" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    </svg>`
},

// ── ShopeePay ─────────────────────────────────────────────────────────────────
shopeepay: {
    bg: "#C0392B",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#C0392B"/>
        <path d="M14 18h12v8a3 3 0 01-3 3h-6a3 3 0 01-3-3v-8z" stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.07)"/>
        <path d="M17 18a3 3 0 016 0" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
        <line x1="20" y1="21" x2="20" y2="25" stroke="#FECACA" stroke-width="2" stroke-linecap="round"/>
    </svg>`
},

// ── PayPal ────────────────────────────────────────────────────────────────────
paypal: {
    bg: "#003580",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#003580"/>
        <path d="M14 10h8a5 5 0 010 10h-5l-1.5 8" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 13h7a4 4 0 010 8" stroke="#93C5FD" stroke-width="2" stroke-linecap="round"/>
    </svg>`
},

// ── Wise ──────────────────────────────────────────────────────────────────────
wise: {
    bg: "#0891B2",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0891B2"/>
        <path d="M10 26l5-12 4 7 3-4 6 9" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
},

// ── GoTyme ────────────────────────────────────────────────────────────────────
gotyme: {
    bg: "#070D19",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#070D19"/>
        <path d="M27 19.5H20V24H25.5C24.5 26.5 22 28 19.5 28C14.8 28 11 24.2 11 19.5C11 14.8 14.8 11 19.5 11C22.5 11 25.2 12.6 26.5 15" stroke="#00F0FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
},

// ── HelloMoney ────────────────────────────────────────────────────────────────
hellomoney: {
    bg: "#FF5E00",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#FF5E00"/>
        <circle cx="16" cy="18" r="5.5" stroke="#ffffff" stroke-width="2.6"/>
        <circle cx="24" cy="18" r="5.5" stroke="#ffffff" stroke-width="2.6"/>
        <path d="M11 25.5c2.5 3.5 6 5 9 5s6.5-1.5 9-5" stroke="#FFEAE0" stroke-width="2.6" stroke-linecap="round"/>
    </svg>`
},

// ── BDO Unibank ───────────────────────────────────────────────────────────────
bdo: {
    bg: "#0035AD",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0035AD"/>
        <path d="M11 13h9.5c2.5 0 4.5 1.5 4.5 3.75s-2 3.75-4.5 3.75H11V13z" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
        <path d="M11 20.5h10.5c2.5 0 4.5 1.5 4.5 3.75s-2 3.75-4.5 3.75H11v-7.5z" stroke="#ffffff" stroke-width="3" stroke-linejoin="round"/>
        <path d="M26.5 11.5l4 4L16.5 31.5l-4-4 14-16z" fill="#F1C40F"/>
    </svg>`
},

// ── BPI ───────────────────────────────────────────────────────────────────────
bpi: {
    bg: "#C0392B",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#C0392B"/>
        <path d="M20 11L10 17h20L20 11z" fill="#FECACA"/>
        <rect x="12" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="10" y="28" width="20" height="2.5" rx="1" fill="#FECACA"/>
    </svg>`
},

// ── Metrobank ─────────────────────────────────────────────────────────────────
metrobank: {
    bg: "#1a3a6e",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1a3a6e"/>
        <path d="M20 11L10 17h20L20 11z" fill="#93C5FD"/>
        <rect x="12" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="10" y="28" width="20" height="2.5" rx="1" fill="#93C5FD"/>
    </svg>`
},

// ── MariBank PH (Digital Bank Version) ────────────────────────────────────────
maribank: {
    bg: "#0E7490",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0E7490"/>
        <path d="M11 27V13L20 22L29 13V27" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 17L20 22L25 17" stroke="#67E8F9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
},

// ── RCBC ──────────────────────────────────────────────────────────────────────
rcbc: {
    bg: "#065F46",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#065F46"/>
        <path d="M20 11L10 17h20L20 11z" fill="#6EE7B7"/>
        <rect x="12" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="10" y="28" width="20" height="2.5" rx="1" fill="#6EE7B7"/>
    </svg>`
},

// ── EastWest Bank ─────────────────────────────────────────────────────────────
eastwest: {
    bg: "#991B1B",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#991B1B"/>
        <path d="M20 11L10 17h20L20 11z" fill="#FCA5A5"/>
        <rect x="12" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="10" y="28" width="20" height="2.5" rx="1" fill="#FCA5A5"/>
    </svg>`
},

// ── China Bank ────────────────────────────────────────────────────────────────
chinabank: {
    bg: "#065F46",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#065F46"/>
        <path d="M20 11L10 17h20L20 11z" fill="#6EE7B7"/>
        <rect x="12" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="10" y="28" width="20" height="2.5" rx="1" fill="#6EE7B7"/>
    </svg>`
},

// ── LandBank ──────────────────────────────────────────────────────────────────
landbank: {
    bg: "#155E75",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#155E75"/>
        <circle cx="20" cy="20" r="11" stroke="#34D399" stroke-width="2"/>
        <path d="M20 9C24 11 27 15 25 21C23 25 18 29 14 26C11 23 11 16 16 11C18 9 19.5 9 20 9Z" stroke="#ffffff" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M16 15C18 13 22 13 23 17C24 20 21 23 18 24" stroke="#A7F3D0" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
},

// ── DBP ───────────────────────────────────────────────────────────────────────
dbp: {
    bg: "#1D4ED8",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1D4ED8"/>
        <path d="M20 11L10 17h20L20 11z" fill="#BFDBFE"/>
        <rect x="12" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="10" y="28" width="20" height="2.5" rx="1" fill="#BFDBFE"/>
    </svg>`
},

// ── PNB ───────────────────────────────────────────────────────────────────────
pnb: {
    bg: "#0D1B3E",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0D1B3E"/>
        <path d="M20 8L32 29H8L20 8z" fill="#F39C12"/>
        <path d="M20 12.5L28.5 27H11.5L20 12.5z" fill="#092C5C"/>
        <path d="M20 27V16M20 21.5c-1.5-1-3-2.2-4-4.2M20 22.5c1.5-1 3-2.2 4-4.2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
    </svg>`
},

// ── AUB ───────────────────────────────────────────────────────────────────────
// FIX: replaced colored flag stripes (inconsistent with dark premium UI)
// with a clean landmark icon matching the bank category style
aub: {
    bg: "#0F172A",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0F172A"/>
        <path d="M20 11L10 17h20L20 11z" fill="#475569"/>
        <rect x="12" y="17" width="2.5" height="11" rx="1" fill="#94A3B8"/>
        <rect x="18.5" y="17" width="3" height="11" rx="1" fill="#94A3B8"/>
        <rect x="25.5" y="17" width="2.5" height="11" rx="1" fill="#94A3B8"/>
        <rect x="10" y="28" width="20" height="2.5" rx="1" fill="#475569"/>
    </svg>`
},

// ── Tonik ─────────────────────────────────────────────────────────────────────
tonik: {
    bg: "#9D174D",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#9D174D"/>
        <rect x="13" y="8" width="14" height="24" rx="3" stroke="#ffffff" stroke-width="2.2"/>
        <circle cx="20" cy="28.5" r="1.5" fill="#FBCFE8"/>
        <path d="M17 11.5h6" stroke="#FBCFE8" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
},

// ── UNO Digital Bank ──────────────────────────────────────────────────────────
uno: {
    bg: "#1E293B",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1E293B"/>
        <rect x="13" y="8" width="14" height="24" rx="3" stroke="#ffffff" stroke-width="2.2"/>
        <circle cx="20" cy="28.5" r="1.5" fill="#94A3B8"/>
        <path d="M17 11.5h6" stroke="#94A3B8" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
},

// ── UnionDigital Bank ─────────────────────────────────────────────────────────
uniondigital: {
    bg: "#4C1D95",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#4C1D95"/>
        <path d="M20 11L10 17h20L20 11z" fill="#C4B5FD"/>
        <rect x="12" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="10" y="28" width="20" height="2.5" rx="1" fill="#C4B5FD"/>
    </svg>`
},

// ── SeaBank PH ────────────────────────────────────────────────────────────────
seabank: {
    bg: "#E05300",
    type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#E05300"/>
        <path d="M27 15.5C27 13 25 11 21.5 11C16.5 11 13 14.5 13 19C13 25 27 21 27 26.5C27 29.5 24 30.5 20 30.5C14.5 30.5 12 27.5 12 25.5" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17.5 16.5C19.5 15 23 15 24 17.5" stroke="#FFEDD5" stroke-width="2" stroke-linecap="round"/>
    </svg>`
},

// ── Coins.ph ──────────────────────────────────────────────────────────────────
coins: {
    bg: "#1D4ED8",
    type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1D4ED8"/>
        <circle cx="17" cy="21" r="7" stroke="#ffffff" stroke-width="2.2"/>
        <circle cx="24" cy="21" r="7" stroke="#BFDBFE" stroke-width="2.2"/>
    </svg>`
},

// ── Cash ──────────────────────────────────────────────────────────────────────
cash: {
    bg: "#065F46",
    type: "cash",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#065F46"/>
        <rect x="7" y="12" width="26" height="16" rx="3" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="20" cy="20" r="4.5" stroke="#34D399" stroke-width="2.2"/>
        <path d="M12 16V24M28 16V24" stroke="#34D399" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`
},

    }; // end WALLET_BRAND_ICONS

    // ── BRAND LOOKUP ──────────────────────────────────────────────────────────
    // Order of resolution:
    //   1. Alias table exact match (covers all known multi-word variants)
    //   2. Direct key match in WALLET_BRAND_ICONS
    //   3. Guarded substring: only if brand key is ≥4 chars (prevents "bdo"
    //      accidentally matching "bdounibank" before alias table handles it)
    function getWalletBrand(name) {
        if (!name || typeof name !== "string") return null;

        const key = normalize(name);

        // 1. Alias table
        const aliasTarget = WALLET_ALIASES[key];
        if (aliasTarget && WALLET_BRAND_ICONS[aliasTarget]) {
            return WALLET_BRAND_ICONS[aliasTarget];
        }

        // 2. Direct key hit
        if (WALLET_BRAND_ICONS[key]) {
            return WALLET_BRAND_ICONS[key];
        }

        // 3. Substring — guarded to ≥4 chars to avoid short-key false matches
        for (const brand of Object.keys(WALLET_BRAND_ICONS)) {
            if (brand.length >= 4 && key.includes(brand)) {
                return WALLET_BRAND_ICONS[brand];
            }
        }

        return null;
    }

    // ── WalletIcon COMPONENT ──────────────────────────────────────────────────
    // Props:
    //   name   (string)  — wallet name, e.g. "GCash", "BDO Unibank"
    //   color  (string)  — accent hex for fallback avatar only
    //   size   (number)  — px (default 32; use 28 for list rows, 36 for headers)
    //   radius (number)  — border-radius (default 9)
    function WalletIcon({ name = "", color = "#475569", size = 32, radius = 9 }) {
        const brand = getWalletBrand(name);

        if (brand) {
            return e('div', {
                style: {
                    width: size, height: size, borderRadius: radius,
                    overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.32)",
                },
                dangerouslySetInnerHTML: { __html: brand.svg }
            });
        }

        // Fallback: letter avatar using the wallet's own accent color
        const letter   = (name.trim()[0] || "?").toUpperCase();
        const fontSize = Math.round(size * 0.42);

        return e('div', {
            style: {
                width: size, height: size, borderRadius: radius, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: color + "1A",
                border: `1.5px solid ${color}40`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.22)",
            }
        },
            e('span', {
                style: {
                    fontSize, fontWeight: 700, color,
                    fontFamily: "DM Sans, -apple-system, sans-serif",
                    lineHeight: 1, letterSpacing: "-0.01em",
                    userSelect: "none",
                    opacity: 0.9,
                }
            }, letter)
        );
    }

    window.walleticons = {
        WalletIcon,
        getWalletBrand,
    };

})();
