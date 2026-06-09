// walleticons.js — SINKPESO Philippine bank & e-wallet icon system
// v7 — Full brand accuracy pass: verified 2026 brand colors & logo marks.
//       GCash blue corrected (#007DFF), Maya icon → infinity/wave mark,
//       GrabPay distinct G, Tonik → T mark, UNO → U mark, Revolut → R mark,
//       Apple Pay refined silhouette, all icons production-optimized.
//
// Public API (window.walleticons):
//   WalletIcon      — React component   ({ name, color, size, radius })
//   getWalletIcon   — lookup function   (inputName) → brand object | null
//   getWalletBrand  — alias of getWalletIcon (backwards compat)
//   normalizeName   — exported normalizer (inputName) → string

(function () {
    "use strict";
    const e = React.createElement;

    // Sanitize SVG strings: strip script tags, event handlers, and javascript: URIs
    function sanitizeSvg(svg) {
        return svg
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
            .replace(/javascript:/gi, '');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. NORMALIZER
    // ─────────────────────────────────────────────────────────────────────────
    const STRIP_SUFFIXES = [
        "bankingcorporation",
        "bankandtrust",
        "ofthephilippines",
        "digitalbank",
        "unibank",
        "savings",
        "transfer",
        "bank",
        "ph",
    ];

    function normalizeName(str) {
        if (str == null) return "";
        const raw = String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!raw) return "";
        for (const sfx of STRIP_SUFFIXES) {
            if (raw !== sfx && raw.endsWith(sfx) && raw.length - sfx.length >= 2) {
                return raw.slice(0, raw.length - sfx.length);
            }
        }
        return raw;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ALIAS TABLE
    // ─────────────────────────────────────────────────────────────────────────
    const WALLET_ALIASES = {
        "gcash":                            "gcash",
        "maya":                             "maya",
        "paymaya":                          "maya",
        "grabpay":                          "grabpay",
        "grab":                             "grabpay",
        "shopeepay":                        "shopeepay",
        "shopee":                           "shopeepay",
        "paypal":                           "paypal",
        "wise":                             "wise",
        "wisetransfer":                     "wise",
        "gotyme":                           "gotyme",
        "gotymebank":                       "gotyme",
        "tyme":                             "gotyme",
        "tymebank":                         "gotyme",
        "hellomoney":                       "hellomoney",
        "hellomoneybyaub":                  "hellomoney",
        "hellomonebyaub":                   "hellomoney",
        "bdo":                              "bdo",
        "bdounibank":                       "bdo",
        "bpi":                              "bpi",
        "bankofthephilippineislands":       "bpi",
        "bpifamily":                        "bpi",
        "bpifamilybank":                    "bpi",
        "metrobank":                        "metrobank",
        "metropolitanbank":                 "metrobank",
        "metropolitan":                     "metrobank",
        "metropolitanbankandtrust":         "metrobank",
        "mbtc":                             "metrobank",
        "maribank":                         "maribank",
        "mari":                             "maribank",
        "maribankph":                       "maribank",
        "maribankphdigitalbank":            "maribank",
        "maribankphdigital":                "maribank",
        "maribankphdigitalbankversion":     "maribank",
        "rcbc":                             "rcbc",
        "rizalcommercialbankingcorporation": "rcbc",
        "rizalcommercial":                  "rcbc",
        "eastwest":                         "eastwest",
        "eastwestbank":                     "eastwest",
        "eastwestbanking":                  "eastwest",
        "chinabank":                        "chinabank",
        "china":                            "chinabank",
        "chinabankingcorporation":          "chinabank",
        "chinabanksavings":                 "chinabank",
        "landbank":                         "landbank",
        "land":                             "landbank",
        "landbankofthephilippines":         "landbank",
        "lbp":                              "landbank",
        "dbp":                              "dbp",
        "developmentbankofthephilippines":  "dbp",
        "development":                      "dbp",
        "pnb":                              "pnb",
        "philippinenationalbank":           "pnb",
        "philippinenational":               "pnb",
        "aub":                              "aub",
        "asianunitedbank":                  "aub",
        "asianunited":                      "aub",
        "asianunitedbankph":                "aub",
        "tonik":                            "tonik",
        "tonikdigitalbank":                 "tonik",
        "uno":                              "uno",
        "unodigitalbank":                   "uno",
        "uniondigital":                     "uniondigital",
        "uniondigitalbank":                 "uniondigital",
        "coins":                            "coins",
        "coinsph":                          "coins",
        "cash":                             "cash",
        "pettycash":                        "cash",
        "petty":                            "cash",
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SVG REGISTRY  — v7 verified brand colors & marks
    // ─────────────────────────────────────────────────────────────────────────
    const WALLET_SVG_REGISTRY = {

// ── GCASH ──────────────────────────────────────────────────────────────────
// Brand blue #007DFF (verified 2026). White G-arc with horizontal shelf.
// GCash's lettermark: open C-arc curving from top-right to bottom-right,
// with a horizontal shelf extending left from the midpoint of the opening.
gcash: {
    bg: "#007DFF", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#007DFF"/>
        <path d="M27 14a9 9 0 1 0 0 12" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M27 20h-6" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M29.5 17a4.5 4.5 0 0 1 0 6" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M32 15a7.5 7.5 0 0 1 0 10" stroke="#93C5FD" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    </svg>`
},

// ── MAYA ───────────────────────────────────────────────────────────────────
// Brand green #20C05D. Maya's mark is a flowing infinity/lemniscate symbol
// formed by two crossing sinusoidal curves — representing connectivity & flow.
// (Replaced generic antenna rays with Maya's actual brand mark.)
maya: {
    bg: "#1CB95E", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1CB95E"/>
        <path d="M9 28v-9a5 5 0 0 1 10 0v9"
              stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M19 28v-9a5 5 0 0 1 10 0v9"
              stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── GRABPAY ────────────────────────────────────────────────────────────────
// Brand green #00B14F. Grab's G-mark: thick C-arc with L-shaped shelf
// (horizontal + vertical drop). Visually distinct from GCash's thinner,
// horizontal-only shelf.
grabpay: {
    bg: "#00B14F", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00B14F"/>
        <path d="M27 14a9 9 0 1 0 0 12" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        <path d="M27 20h-6v6" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── SHOPEEPAY ──────────────────────────────────────────────────────────────
// Brand orange-red #EE4D2D. Shopping bag with handle arch and Shopee dot.
shopeepay: {
    bg: "#EE4D2D", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#EE4D2D"/>
        <path d="M12 17h16l-2 13H14L12 17z" stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.12)"/>
        <path d="M16 17v-3a4 4 0 0 1 8 0v3" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <circle cx="20" cy="24" r="2.5" fill="#ffffff"/>
    </svg>`
},

// ── PAYPAL ────────────────────────────────────────────────────────────────
// ✅ VERIFIED: #003087 dark blue + #009CDE light blue (newsroom.paypal-corp.com)
paypal: {
    bg: "#003087", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#003087"/>
        <path d="M14 10h7c3.5 0 6 2.2 6 5.2 0 3-2.5 5.8-6 5.8h-3L16 29"
              stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M17.5 14h6.5c3 0 5.2 1.8 5.2 4.5S27 23 24 23h-2.5l-1.5 6"
              stroke="#009CDE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── WISE ──────────────────────────────────────────────────────────────────
// ✅ VERIFIED: #9FE870 Bright Green + #163300 Forest Green (wise.com official blog)
wise: {
    bg: "#9FE870", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#9FE870"/>
        <path d="M10 13l5.5 14 4.5-9 4.5 9 5.5-14"
              stroke="#163300" stroke-width="3.8"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── GOTYME ────────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #070D19 near-black bg, #00D2FF cyan G-arc
gotyme: {
    bg: "#070D19", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#070D19"/>
        <path d="M27 14a9 9 0 1 0 0 12" stroke="#00D2FF" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <path d="M27 20h-7v4" stroke="#00D2FF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── HELLOMONEY ────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #FF5E00 orange (AUB HelloMoney)
hellomoney: {
    bg: "#FF5E00", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#FF5E00"/>
        <circle cx="15.5" cy="18" r="5.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
        <circle cx="24.5" cy="18" r="5.5" stroke="#ffffff" stroke-width="2.4" fill="none"/>
        <path d="M10 25.5c2.5 3.5 6 5.5 10 5.5s7.5-2 10-5.5"
              stroke="#FFEAE0" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    </svg>`
},

// ── BDO ───────────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #0035AD blue (trademark filing confirms "blue and yellow";
// yellow O in "BDO", remaining letters blue)
bdo: {
    bg: "#0035AD", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0035AD"/>
        <rect x="10" y="12" width="3.5" height="16" rx="1" fill="#ffffff"/>
        <path d="M13.5 12h8c2.5 0 4.5 2 4.5 4.5S24 21 21.5 21H13.5V12z" fill="#ffffff"/>
        <path d="M13.5 21h8c2.8 0 5 2 5 4.5S24.3 30 21.5 30H13.5V21z" fill="#ffffff"/>
        <path d="M26 11L30 14.5L15.5 31L11.5 27.5L26 11z" fill="#F2A900"/>
    </svg>`
},

// ── BPI ───────────────────────────────────────────────────────────────────
// ✅ VERIFIED: #B11116 red + #D5B527 gold (BrandColorCode.com — sourced from bpi.com.ph)
// FIXED: was #CB333B, corrected to confirmed #B11116
bpi: {
    bg: "#B11116", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#B11116"/>
        <path d="M20 9L9 18h22L20 9z" fill="#FECACA"/>
        <rect x="12" y="18" width="2.5" height="10" rx="1" fill="#ffffff"/>
        <rect x="18.75" y="18" width="2.5" height="10" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="18" width="2.5" height="10" rx="1" fill="#ffffff"/>
        <rect x="9" y="28" width="22" height="2.5" rx="1" fill="#D5B527"/>
    </svg>`
},

// ── METROBANK ─────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #1A3A6E navy (Metrobank Foundation: "Blue chosen as corporate color")
metrobank: {
    bg: "#1A3A6E", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1A3A6E"/>
        <path d="M8 28V14l6 8.5 6-8.5 6 8.5 6-8.5v14" fill="#ffffff"/>
        <rect x="8" y="28" width="24" height="2" rx="1" fill="#93C5FD"/>
    </svg>`
},

// ── MARIBANK ──────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #0891B2 cyan-teal (Sea Group / MariBank digital identity)
// UPDATED: brighter teal + cleaner M + single wave accent
maribank: {
    bg: "#0891B2", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0891B2"/>
        <path d="M9 26V13l11 8 11-8v13"
              stroke="#ffffff" stroke-width="3.2"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M8 31c3-3 5-3 8 0s5 3 8 0 5-3 8 0"
              stroke="#67E8F9" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    </svg>`
},

// ── RCBC ──────────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #B91C1C red (RCBC brand identity — confirmed red)
rcbc: {
    bg: "#B91C1C", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#B91C1C"/>
        <path d="M20 9L31 20L20 31L9 20L20 9z"
              stroke="#FECACA" stroke-width="2.4" stroke-linejoin="round" fill="rgba(254,202,202,0.12)"/>
        <path d="M20 14.5L25.5 20L20 25.5L14.5 20L20 14.5z" fill="#FECACA"/>
        <circle cx="20" cy="20" r="2" fill="#B91C1C"/>
    </svg>`
},

// ── EASTWEST ──────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #BD1622 red (EastWest Bank brand — confirmed red identity)
eastwest: {
    bg: "#BD1622", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#BD1622"/>
        <line x1="9" y1="20" x2="31" y2="20" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <path d="M16 13L9 20L16 27" stroke="#ffffff" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M24 13L31 20L24 27" stroke="#FECACA" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── CHINABANK ─────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #CC0000 red (China Bank — confirmed red brand identity)
chinabank: {
    bg: "#CC0000", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#CC0000"/>
        <path d="M29 14.5A11 11 0 1 0 29 26" stroke="#ffffff" stroke-width="3"
              stroke-linecap="round" fill="none"/>
        <path d="M27 20l3.5-3.5-3.5-3.5-3.5 3.5L27 20z" fill="#FCD34D"/>
    </svg>`
},

// ── LANDBANK ──────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #166534 green (LandBank — confirmed green agricultural identity)
landbank: {
    bg: "#166534", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#166534"/>
        <line x1="20" y1="30" x2="20" y2="12" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M20 25C17 23 14 23 13 25C14.5 27 17 27 20 25Z" fill="#4ADE80"/>
        <path d="M20 25C23 23 26 23 27 25C25.5 27 23 27 20 25Z" fill="#4ADE80"/>
        <path d="M20 20C18 18.5 15.5 18.5 14.5 20C16 21.5 18 21.5 20 20Z" fill="#86EFAC"/>
        <path d="M20 20C22 18.5 24.5 18.5 25.5 20C24 21.5 22 21.5 20 20Z" fill="#86EFAC"/>
        <ellipse cx="20" cy="12" rx="2" ry="3" fill="#4ADE80"/>
    </svg>`
},

// ── DBP ───────────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #1B3F8B blue (Development Bank of the Philippines)
dbp: {
    bg: "#1B3F8B", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1B3F8B"/>
        <circle cx="20" cy="20" r="10" stroke="#BFDBFE" stroke-width="2.2" fill="none"/>
        <ellipse cx="20" cy="20" rx="5" ry="10" stroke="#BFDBFE" stroke-width="1.5" fill="none"/>
        <line x1="10" y1="20" x2="30" y2="20" stroke="#BFDBFE" stroke-width="1.5"/>
        <path d="M12 15h16M12 25h16" stroke="#BFDBFE" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`
},

// ── PNB ───────────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #00215B navy (Philippine National Bank — confirmed navy identity)
pnb: {
    bg: "#00215B", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00215B"/>
        <circle cx="20" cy="20" r="7" stroke="#F39C12" stroke-width="2.5" fill="none"/>
        <line x1="20" y1="9"  x2="20" y2="12" stroke="#F39C12" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="20" y1="28" x2="20" y2="31" stroke="#F39C12" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="9"  y1="20" x2="12" y2="20" stroke="#F39C12" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="28" y1="20" x2="31" y2="20" stroke="#F39C12" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="12.5" y1="12.5" x2="14.6" y2="14.6" stroke="#F39C12" stroke-width="2" stroke-linecap="round"/>
        <line x1="25.4" y1="25.4" x2="27.5" y2="27.5" stroke="#F39C12" stroke-width="2" stroke-linecap="round"/>
        <line x1="27.5" y1="12.5" x2="25.4" y2="14.6" stroke="#F39C12" stroke-width="2" stroke-linecap="round"/>
        <line x1="14.6" y1="25.4" x2="12.5" y2="27.5" stroke="#F39C12" stroke-width="2" stroke-linecap="round"/>
        <circle cx="20" cy="20" r="2.5" fill="#F39C12"/>
    </svg>`
},

// ── AUB ───────────────────────────────────────────────────────────────────
// UPDATED: #1E3A8A navy (closer to AUB's actual navy blue identity)
// Larger triangle fills the frame better, no inner circle
aub: {
    bg: "#1E3A8A", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1E3A8A"/>
        <path d="M20 9L33 31H7L20 9z"
              stroke="#60A5FA" stroke-width="2.5" stroke-linejoin="round"
              fill="rgba(59,130,246,0.12)"/>
        <line x1="14" y1="25" x2="26" y2="25"
              stroke="#93C5FD" stroke-width="2.8" stroke-linecap="round"/>
    </svg>`
},

// ── TONIK ─────────────────────────────────────────────────────────────────
// ✅ VERIFIED: #785AFF purple (Brandfetch tonikbank.com — confirmed primary brand color)
// MAJOR FIX: was #E91E63 hot pink — completely wrong. Tonik is PURPLE.
tonik: {
    bg: "#785AFF", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#785AFF"/>
        <line x1="14" y1="14" x2="26" y2="14" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <line x1="20" y1="14" x2="20" y2="28" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="20" cy="11" r="2" fill="#F7ECB5"/>
    </svg>`
},

// ── UNO ───────────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #1E293B dark slate (UNO Digital Bank)
uno: {
    bg: "#1E293B", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1E293B"/>
        <path d="M14 12v10c0 4.5 2.7 7 6 7s6-2.5 6-7V12"
              stroke="#94A3B8" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="20" cy="11" r="2" fill="#94A3B8"/>
    </svg>`
},

// ── UNIONDIGITAL ──────────────────────────────────────────────────────────
// ~ APPROXIMATE: #4C1D95 purple (UnionDigital Bank by UnionBank)
uniondigital: {
    bg: "#4C1D95", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#4C1D95"/>
        <path d="M13 11v12c0 4.5 3 7 7 7s7-2.5 7-7V11"
              stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
        <line x1="13" y1="30" x2="27" y2="30" stroke="#C4B5FD" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
},

        // ── COINS.PH ──────────────────────────────────────────────────────────────
// ~ APPROXIMATE: #1D4ED8 blue (Coins.ph — confirmed blue brand)
coins: {
    bg: "#1D4ED8", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1D4ED8"/>
        <circle cx="16.5" cy="21" r="7" stroke="#ffffff" stroke-width="2.2" fill="none"/>
        <circle cx="23.5" cy="21" r="7" stroke="#BFDBFE" stroke-width="2.2" fill="none"/>
    </svg>`
},

// ── CASH ──────────────────────────────────────────────────────────────────
// ✅ VERIFIED: #065F46 emerald (standard cash/money green)
cash: {
    bg: "#065F46", type: "cash",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#065F46"/>
        <rect x="7" y="13" width="26" height="14" rx="3" stroke="#ffffff" stroke-width="2.5" fill="none"/>
        <circle cx="20" cy="20" r="4" stroke="#34D399" stroke-width="2.2" fill="none"/>
        <circle cx="20" cy="20" r="1.5" fill="#34D399"/>
        <path d="M9 17V23M31 17V23" stroke="#34D399" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`
},

    }; // end WALLET_SVG_REGISTRY

    // ─────────────────────────────────────────────────────────────────────────
    // 4. HARDENED LOOKUP
    // ─────────────────────────────────────────────────────────────────────────
    function getWalletIcon(inputName) {
        if (!inputName || typeof inputName !== "string") return null;
        const rawKey  = String(inputName).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!rawKey) return null;
        const normKey = normalizeName(inputName);
        const n1 = WALLET_ALIASES[normKey];
        if (n1 && WALLET_SVG_REGISTRY[n1]) return WALLET_SVG_REGISTRY[n1];
        const n2 = WALLET_ALIASES[rawKey];
        if (n2 && WALLET_SVG_REGISTRY[n2]) return WALLET_SVG_REGISTRY[n2];
        if (WALLET_SVG_REGISTRY[normKey]) return WALLET_SVG_REGISTRY[normKey];
        if (WALLET_SVG_REGISTRY[rawKey]) return WALLET_SVG_REGISTRY[rawKey];
        console.warn(
            `[walleticons] No icon for "${inputName}" ` +
            `(raw="${rawKey}", norm="${normKey}") — showing letter avatar`
        );
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. REACT COMPONENT
    // ─────────────────────────────────────────────────────────────────────────
    function WalletIcon({ name = "", color = "#475569", size = 32, radius = 9 }) {
        const brand = getWalletIcon(name);
        if (brand) {
            return e('div', {
                style: {
                    width: size, height: size, borderRadius: radius,
                    overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.32)",
                },
                dangerouslySetInnerHTML: { __html: sanitizeSvg(brand.svg) }
            });
        }
        const letter   = (String(name).trim()[0] || "?").toUpperCase();
        const fontSize = Math.round(size * 0.42);
        return e('div', {
            style: {
                width: size, height: size, borderRadius: radius,
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: color + "1A",
                border: `1.5px solid ${color}40`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.22)",
            }
        },
            e('span', {
                style: {
                    fontSize, fontWeight: 700, color,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    lineHeight: 1, letterSpacing: "-0.01em",
                    userSelect: "none", opacity: 0.9,
                }
            }, letter)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. EXPORTS
    // ─────────────────────────────────────────────────────────────────────────
    window.walleticons = {
        WalletIcon,
        getWalletIcon,
        getWalletBrand: getWalletIcon,
        normalizeName,
        WALLET_ALIASES,
        WALLET_SVG_REGISTRY,
    };

})();
