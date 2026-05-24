// walleticons.js — SINKPESO Philippine bank & e-wallet icon system
// v4 — bulletproof lookup, no substring scan, suffix-aware normalizer,
//       explicit alias table, clean SVGs, fully distinct icon shapes.
//
// Public API (window.walleticons):
//   WalletIcon      — React component   ({ name, color, size, radius })
//   getWalletIcon   — lookup function   (inputName) → brand object | null
//   getWalletBrand  — alias of getWalletIcon (backwards compat)
//   normalizeName   — exported normalizer (inputName) → string

(function () {
    "use strict";
    const e = React.createElement;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. NORMALIZER
    //    Step A: lowercase + strip every non-alphanumeric character
    //    Step B: strip at most one known trailing suffix (longest wins)
    //            so "bdounibank" → "bdo", "landbank" → "land",
    //               "eastwestbank" → "eastwest", "maribankph" (after A) ends
    //               with "ph" → "maribank" → "mari" only if called again,
    //               but we strip at most one pass so "maribankph" → "maribank".
    //    Result is used as the primary lookup key.
    //    Both the RAW form (after A only) and the NORM form (after A+B) are
    //    checked in getWalletIcon so ALIASES need not cover every stripped variant.
    // ─────────────────────────────────────────────────────────────────────────
    const STRIP_SUFFIXES = [
        // longest first — order is critical
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
        // Step A: lowercase + strip non-alphanumeric
        const raw = String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!raw) return "";
        // Step B: strip the first matching suffix (and only if result ≥ 2 chars)
        for (const sfx of STRIP_SUFFIXES) {
            if (raw !== sfx && raw.endsWith(sfx) && raw.length - sfx.length >= 2) {
                return raw.slice(0, raw.length - sfx.length);
            }
        }
        return raw;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ALIAS TABLE  (normalized-input → canonical registry key)
    //
    //    Both the RAW key (only step A) AND the NORM key (step A+B) are checked
    //    against this table inside getWalletIcon, so you only need to list each
    //    variant once — whichever form it arrives in.
    //
    //    Short 3-char keys like "bdo", "bpi", "pnb", "aub", "dbp" MUST live
    //    here — they are never matched by substring scan (which is removed).
    // ─────────────────────────────────────────────────────────────────────────
    const WALLET_ALIASES = {

        // ── E-WALLETS ──────────────────────────────────────────────────────
        // GCash
        "gcash":                            "gcash",

        // Maya / PayMaya
        "maya":                             "maya",
        "paymaya":                          "maya",

        // GrabPay
        "grabpay":                          "grabpay",
        "grab":                             "grabpay",

        // ShopeePay
        "shopeepay":                        "shopeepay",
        "shopee":                           "shopeepay",

        // PayPal
        "paypal":                           "paypal",

        // Wise
        "wise":                             "wise",
        "wisetransfer":                     "wise",   // raw
        "wise":                             "wise",   // stripped ("transfer" removed)

        // GoTyme
        "gotyme":                           "gotyme",
        "gotymebank":                       "gotyme",   // raw
        "tyme":                             "gotyme",
        "tymebank":                         "gotyme",   // raw

        // HelloMoney (MUST come before any "aub" substring — no substring scan so safe)
        "hellomoney":                       "hellomoney",
        "hellomoneybyaub":                  "hellomoney",
        "hellomonebyaub":                   "hellomoney",   // typo variant

        // ── BANKS ──────────────────────────────────────────────────────────
        // BDO
        "bdo":                              "bdo",
        "bdounibank":                       "bdo",          // raw
        // normalizeName("BDO Unibank") → strip "unibank" → "bdo" ✓

        // BPI
        "bpi":                              "bpi",
        "bankofthephilippineislands":       "bpi",
        "bpifamily":                        "bpi",
        "bpifamilybank":                    "bpi",

        // Metrobank
        "metrobank":                        "metrobank",
        "metropolitanbank":                 "metrobank",    // raw
        "metropolitan":                     "metrobank",    // stripped "bank"
        "metropolitanbankandtrust":         "metrobank",    // raw
        "mbtc":                             "metrobank",

        // MariBank PH
        "maribank":                         "maribank",     // raw  (ends "bank")
        "mari":                             "maribank",     // stripped "bank"
        "maribankph":                       "maribank",     // raw  (ends "ph")
        "maribankphdigitalbank":            "maribank",
        "maribankphdigital":                "maribank",
        "maribankphdigitalbankversion":     "maribank",     // "MariBank PH (Digital Bank Version)"

        // RCBC
        "rcbc":                             "rcbc",
        "rizalcommercialbankingcorporation": "rcbc",        // raw
        "rizalcommercial":                  "rcbc",         // stripped "bankingcorporation"

        // EastWest
        "eastwest":                         "eastwest",
        "eastwestbank":                     "eastwest",     // raw
        "eastwestbanking":                  "eastwest",

        // China Bank
        "chinabank":                        "chinabank",    // raw / canonical
        "china":                            "chinabank",    // stripped "bank"
        "chinabankingcorporation":          "chinabank",    // raw
        "chinabanksavings":                 "chinabank",    // raw

        // LandBank
        "landbank":                         "landbank",     // raw / canonical
        "land":                             "landbank",     // stripped "bank"
        "landbankofthephilippines":         "landbank",     // raw
        "lbp":                              "landbank",

        // DBP
        "dbp":                              "dbp",
        "developmentbankofthephilippines":  "dbp",          // raw
        "development":                      "dbp",          // stripped "bankofthephilippines"

        // PNB
        "pnb":                              "pnb",
        "philippinenationalbank":           "pnb",          // raw
        "philippinenational":               "pnb",          // stripped "bank"

        // AUB
        "aub":                              "aub",
        "asianunitedbank":                  "aub",          // raw
        "asianunited":                      "aub",          // stripped "bank"
        "asianunitedbankph":                "aub",

        // ── BONUS FINTECHS (kept from v3 for completeness) ─────────────────
        "tonik":                            "tonik",
        "tonikdigitalbank":                 "tonik",
        "uno":                              "uno",
        "unodigitalbank":                   "uno",
        "uniondigital":                     "uniondigital",
        "uniondigitalbank":                 "uniondigital",
        "seabank":                          "seabank",
        "seabankph":                        "seabank",
        "coins":                            "coins",
        "coinsph":                          "coins",

        // Cash (physical wallet)
        "cash":                             "cash",
        "pettycash":                        "cash",
        "petty":                            "cash",
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SVG REGISTRY
    //    All SVGs use viewBox="0 0 40 40". Paths stay within 6–34px on each
    //    axis. Canonical key = simple lowercase identifier, no spaces.
    //    Each entry: { bg (hex), type ("ewallet"|"bank"|"cash"), svg (string) }
    // ─────────────────────────────────────────────────────────────────────────
    const WALLET_SVG_REGISTRY = {

// ── GCASH ──────────────────────────────────────────────────────────────────
// Blue bg, white G-arc + horizontal crossbar (GCash letter-mark)
gcash: {
    bg: "#0066CC", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0066CC"/>
        <path d="M28 17.5a9 9 0 1 0 0 5.5" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <path d="M22 20h7v4" stroke="#93C5FD" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── MAYA ───────────────────────────────────────────────────────────────────
// Green bg, clean 4-point M letterform — all paths bounded 9–31 x, 14–27 y
maya: {
    bg: "#05B27C", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#05B27C"/>
        <path d="M9 27V14l6 8.5 5-8.5 5 8.5 6-8.5v13"
              stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M9 27h22" stroke="#A7F3D0" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
},

// ── GRABPAY ────────────────────────────────────────────────────────────────
// Green bg, G-circle + hand grab icon
grabpay: {
    bg: "#00B14F", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00B14F"/>
        <circle cx="20" cy="19" r="9" stroke="#ffffff" stroke-width="2.8" fill="none"/>
        <path d="M20 14v5h5" stroke="#6EE7B7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <circle cx="20" cy="19" r="1.8" fill="#ffffff"/>
    </svg>`
},

// ── SHOPEEPAY ──────────────────────────────────────────────────────────────
// Shopee red bg, shopping bag outline
shopeepay: {
    bg: "#EE4D2D", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#EE4D2D"/>
        <path d="M13 18h14v8.5a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V18z"
              stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.08)"/>
        <path d="M17 18a3 3 0 0 1 6 0" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <line x1="20" y1="21.5" x2="20" y2="25.5" stroke="#FECACA" stroke-width="2" stroke-linecap="round"/>
    </svg>`
},

// ── PAYPAL ─────────────────────────────────────────────────────────────────
// Dark blue bg, overlapping double-P letterform
paypal: {
    bg: "#003087", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#003087"/>
        <path d="M13 11h8.5c3 0 5.5 2 5.5 5s-2.5 5-5.5 5H16.5L15 29"
              stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M17 15h7.5c3 0 5 1.8 5 4.5S27 24 24 24H21L19.5 32"
              stroke="#93C5FD" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── WISE ───────────────────────────────────────────────────────────────────
// Wise cyan bg, flag/wave shape (the Wise brand flag motif)
wise: {
    bg: "#00B9FF", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00B9FF"/>
        <path d="M9 28l5-14 4.5 9 4-6 7.5 11" stroke="#ffffff"
              stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M9 28l5-14" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-linecap="round"/>
    </svg>`
},

// ── GOTYME ─────────────────────────────────────────────────────────────────
// Near-black bg, neon-cyan G-arc with shelf (GoTyme brand signature)
gotyme: {
    bg: "#070D19", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#070D19"/>
        <path d="M28 18a9 9 0 1 0 0 4" stroke="#00F0FF" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <path d="M21 20h8v3.5" stroke="#00F0FF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── HELLOMONEY ─────────────────────────────────────────────────────────────
// Orange bg, double-circle smiley face (the HelloMoney face mark)
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

// ── BDO ────────────────────────────────────────────────────────────────────
// Blue bg, filled white B letterform + gold diagonal slash overlay
// Filled paths ensure correct z-order: B first, slash second (renders on top)
bdo: {
    bg: "#0035AD", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0035AD"/>
        <rect x="10" y="12" width="3.5" height="16" rx="1" fill="#ffffff"/>
        <path d="M13.5 12H22c2.6 0 4.5 1.9 4.5 4.5S24.6 21 22 21H13.5V12z" fill="#ffffff"/>
        <path d="M13.5 21H22c2.8 0 5 1.9 5 4.5S24.8 30 22 30H13.5V21z" fill="#ffffff"/>
        <path d="M26 11L30 14.5L15.5 31L11.5 27.5L26 11z" fill="#F2A900"/>
    </svg>`
},

// ── BPI ────────────────────────────────────────────────────────────────────
// BPI red bg, classic temple-column motif (canonical BPI visual)
bpi: {
    bg: "#C0392B", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#C0392B"/>
        <path d="M20 10L9 17.5h22L20 10z" fill="#FECACA"/>
        <rect x="11.5" y="17.5" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17.5" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17.5" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="9" y="28.5" width="22" height="2.5" rx="1" fill="#FECACA"/>
    </svg>`
},

// ── METROBANK ──────────────────────────────────────────────────────────────
// Navy bg, bold M letterform (Metrobank brand M)
metrobank: {
    bg: "#1a3a6e", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1a3a6e"/>
        <path d="M8 28V14l6 8.5 6-8.5 6 8.5 6-8.5v14"
              stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M8 28h24" stroke="#93C5FD" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
},

// ── MARIBANK ───────────────────────────────────────────────────────────────
// Teal bg, stacked M wave (MariBank digital brand wave)
maribank: {
    bg: "#0E7490", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0E7490"/>
        <path d="M9 27V13l5.5 7 5.5-7 5.5 7 5.5-7v14"
              stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M9 27h22" stroke="#67E8F9" stroke-width="2" stroke-linecap="round"/>
    </svg>`
},

// ── RCBC ───────────────────────────────────────────────────────────────────
// Dark green bg, diamond/rhombus shape with inner fill (RCBC brand motif)
rcbc: {
    bg: "#065F46", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#065F46"/>
        <path d="M20 9L31 20L20 31L9 20L20 9z"
              stroke="#34D399" stroke-width="2.4" stroke-linejoin="round" fill="rgba(52,211,153,0.08)"/>
        <path d="M20 14.5L25.5 20L20 25.5L14.5 20L20 14.5z" fill="#34D399"/>
        <circle cx="20" cy="20" r="2" fill="#065F46"/>
    </svg>`
},

// ── EASTWEST ───────────────────────────────────────────────────────────────
// Dark crimson bg, bidirectional arrow ← → (East/West compass motif)
eastwest: {
    bg: "#7C1D1D", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#7C1D1D"/>
        <line x1="9" y1="20" x2="31" y2="20" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <path d="M16 13L9 20L16 27" stroke="#ffffff" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M24 13L31 20L24 27" stroke="#FCA5A5" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── CHINABANK ──────────────────────────────────────────────────────────────
// Warm amber bg, C-arc with gold diamond accent (China Bank brand red/gold)
chinabank: {
    bg: "#92400E", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#92400E"/>
        <path d="M29 14.5A11 11 0 1 0 29 26" stroke="#ffffff" stroke-width="3"
              stroke-linecap="round" fill="none"/>
        <path d="M27 20l3.5-3.5-3.5-3.5-3.5 3.5L27 20z" fill="#FCD34D"/>
    </svg>`
},

// ── LANDBANK ───────────────────────────────────────────────────────────────
// Dark green bg, wheat/grain stalk with paired leaves — NOT a globe or columns.
// Completely distinct from all other bank icons.
landbank: {
    bg: "#166534", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#166534"/>
        <line x1="20" y1="30" x2="20" y2="14" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M20 25C17.5 23.5 14.5 23.5 13 25C14.5 26.5 17.5 26.5 20 25Z" fill="#4ADE80"/>
        <path d="M20 25C22.5 23.5 25.5 23.5 27 25C25.5 26.5 22.5 26.5 20 25Z" fill="#4ADE80"/>
        <path d="M20 21C18 19.5 15.5 19.5 14.5 21C16 22.2 18 22 20 21Z" fill="#86EFAC"/>
        <path d="M20 21C22 19.5 24.5 19.5 25.5 21C24 22.2 22 22 20 21Z" fill="#86EFAC"/>
        <ellipse cx="20" cy="13" rx="2" ry="3" fill="#4ADE80"/>
        <path d="M11 30Q20 27.5 29 30" stroke="#86EFAC" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`
},

// ── DBP ────────────────────────────────────────────────────────────────────
// Blue bg, government building/landmark columns (DBP is a development bank,
// distinct from BPI by color and 4-column wider pediment layout)
dbp: {
    bg: "#1D4ED8", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1D4ED8"/>
        <path d="M20 10L9 17h22L20 10z" fill="#BFDBFE"/>
        <rect x="11"  y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="16.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="22"  y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="27.5" y="17" width="2.5" height="11" rx="1" fill="#ffffff"/>
        <rect x="9" y="28" width="22" height="2.5" rx="1" fill="#BFDBFE"/>
    </svg>`
},

// ── PNB ────────────────────────────────────────────────────────────────────
// Dark navy bg, Philippine sun / eight-ray star (PNB eagle+sun brand motif)
pnb: {
    bg: "#0D1B3E", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0D1B3E"/>
        <circle cx="20" cy="20" r="7" stroke="#F39C12" stroke-width="2.5" fill="none"/>
        <line x1="20" y1="9" x2="20" y2="12" stroke="#F39C12" stroke-width="2.5" stroke-linecap="round"/>
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

// ── AUB ────────────────────────────────────────────────────────────────────
// Dark slate bg, stylized A-triangle with crossbar — distinct from all column
// icons; no similarity to HelloMoney's orange-circle design
aub: {
    bg: "#0F172A", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0F172A"/>
        <path d="M20 10L31 29H9L20 10z" stroke="#3B82F6" stroke-width="2.5"
              stroke-linejoin="round" fill="rgba(59,130,246,0.07)"/>
        <line x1="15" y1="23" x2="25" y2="23" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="20" cy="20" r="1.8" fill="#3B82F6"/>
    </svg>`
},

// ── TONIK ──────────────────────────────────────────────────────────────────
// Pink-magenta bg, phone outline (Tonik is a mobile-first digital bank)
tonik: {
    bg: "#9D174D", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#9D174D"/>
        <rect x="13" y="8" width="14" height="24" rx="3" stroke="#ffffff" stroke-width="2.2" fill="none"/>
        <circle cx="20" cy="28.5" r="1.5" fill="#FBCFE8"/>
        <path d="M17 11.5h6" stroke="#FBCFE8" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
},

// ── UNO ────────────────────────────────────────────────────────────────────
// Dark slate bg, phone with signal bars (UNO Digital Bank)
uno: {
    bg: "#1E293B", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1E293B"/>
        <rect x="13" y="8" width="14" height="24" rx="3" stroke="#94A3B8" stroke-width="2.2" fill="none"/>
        <rect x="16" y="20" width="1.5" height="4" rx="0.8" fill="#94A3B8"/>
        <rect x="19.5" y="18" width="1.5" height="6" rx="0.8" fill="#94A3B8"/>
        <rect x="23" y="16" width="1.5" height="8" rx="0.8" fill="#94A3B8"/>
    </svg>`
},

// ── UNIONDIGITAL ───────────────────────────────────────────────────────────
// Purple bg, U letterform (UnionDigital Bank)
uniondigital: {
    bg: "#4C1D95", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#4C1D95"/>
        <path d="M13 11v12c0 4.5 3 7 7 7s7-2.5 7-7V11"
              stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
        <line x1="13" y1="30" x2="27" y2="30" stroke="#C4B5FD" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
},

// ── SEABANK ────────────────────────────────────────────────────────────────
// Orange bg, stylised S letterform (SeaBank / Shopee parent Sea Group)
seabank: {
    bg: "#E05300", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#E05300"/>
        <path d="M27 15c0-2.5-2-4.5-6-4.5C16 10.5 13 14 13 17c0 4.5 14 3.5 14 9.5C27 29 24.5 30 20 30S12 27 12 25"
              stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>`
},

// ── COINS.PH ───────────────────────────────────────────────────────────────
// Blue bg, overlapping coin circles (Coins.ph crypto wallet)
coins: {
    bg: "#1D4ED8", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1D4ED8"/>
        <circle cx="16.5" cy="21" r="7" stroke="#ffffff" stroke-width="2.2" fill="none"/>
        <circle cx="23.5" cy="21" r="7" stroke="#BFDBFE" stroke-width="2.2" fill="none"/>
    </svg>`
},

// ── CASH ───────────────────────────────────────────────────────────────────
// Emerald green bg, banknote rectangle with centre circle (physical cash)
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
    //
    //    Priority order:
    //      1. Alias table  (norm key — suffix-stripped)
    //      2. Alias table  (raw key  — no suffix stripping)
    //      3. Direct registry hit on norm key
    //      4. Direct registry hit on raw key
    //    ✗  NO SUBSTRING SCAN — eliminated to prevent false positives
    // ─────────────────────────────────────────────────────────────────────────
    function getWalletIcon(inputName) {
        if (!inputName || typeof inputName !== "string") return null;

        // Raw key: just lowercase + strip non-alphanumeric (no suffix stripping)
        const rawKey  = String(inputName).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!rawKey) return null;

        // Norm key: raw key + one trailing suffix stripped
        const normKey = normalizeName(inputName);

        // 1. Alias → registry  (norm key)
        const n1 = WALLET_ALIASES[normKey];
        if (n1 && WALLET_SVG_REGISTRY[n1]) return WALLET_SVG_REGISTRY[n1];

        // 2. Alias → registry  (raw key)
        const n2 = WALLET_ALIASES[rawKey];
        if (n2 && WALLET_SVG_REGISTRY[n2]) return WALLET_SVG_REGISTRY[n2];

        // 3. Direct registry hit  (norm key)
        if (WALLET_SVG_REGISTRY[normKey]) return WALLET_SVG_REGISTRY[normKey];

        // 4. Direct registry hit  (raw key)
        if (WALLET_SVG_REGISTRY[rawKey]) return WALLET_SVG_REGISTRY[rawKey];

        // ✗ NO SUBSTRING SCAN — log + return null
        console.warn(
            `[walleticons] No icon for "${inputName}" ` +
            `(raw="${rawKey}", norm="${normKey}") — showing letter avatar`
        );
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. REACT COMPONENT
    //
    //    Props:
    //      name   (string) — wallet name as stored in app state
    //      color  (string) — fallback letter-avatar accent color
    //      size   (number) — px, default 32  (use 28 for rows, 36 for headers)
    //      radius (number) — border-radius,  default 9
    // ─────────────────────────────────────────────────────────────────────────
    function WalletIcon({ name = "", color = "#475569", size = 32, radius = 9 }) {
        const brand = getWalletIcon(name);

        // ── Found: render SVG ─────────────────────────────────────────────
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

        // ── Not found: letter avatar ──────────────────────────────────────
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
                    fontFamily: "DM Sans, -apple-system, sans-serif",
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
        getWalletBrand: getWalletIcon,   // backwards-compat alias
        normalizeName,
        WALLET_ALIASES,
        WALLET_SVG_REGISTRY,
    };

})();
