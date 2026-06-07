// walleticons.js — SINKPESO Philippine bank & e-wallet icon system
// v6 — corrected brand colors: RCBC red, ChinaBank red, Wise lime green,
//       EastWest proper red, Tonik hot pink, DBP deduped from Coins.ph,
//       GrabPay distinct from GoTyme.
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
        "seabank":                          "seabank",
        "seabankph":                        "seabank",
        "coins":                            "coins",
        "coinsph":                          "coins",
        "applepay":                         "applepay",
        "apple":                            "applepay",
        "googlepay":                        "googlepay",
        "google":                           "googlepay",
        "gpay":                             "googlepay",
        "revolut":                          "revolut",
        "cash":                             "cash",
        "pettycash":                        "cash",
        "petty":                            "cash",
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SVG REGISTRY  — v6 corrected brand colors
    // ─────────────────────────────────────────────────────────────────────────
    const WALLET_SVG_REGISTRY = {

// ── GCASH ──────────────────────────────────────────────────────────────────
// Brand blue #0178FF. White G-arc with shelf — GCash's actual lettermark.
gcash: {
    bg: "#0178FF", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0178FF"/>
        <path d="M29 18a10 10 0 1 0 0 5" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M22 20.5h7.5v4" stroke="#93C5FD" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── MAYA ───────────────────────────────────────────────────────────────────
// Brand green #20C05D. Signal/antenna radiating outward — Maya's connectivity mark.
maya: {
    bg: "#20C05D", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#20C05D"/>
        <line x1="20" y1="30" x2="20" y2="19" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="20" cy="30" r="2" fill="#ffffff"/>
        <path d="M15 23a7 7 0 0 0 0-8" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M25 23a7 7 0 0 1 0-8" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M12 26a11 11 0 0 0 0-14" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M28 26a11 11 0 0 1 0-14" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none"/>
    </svg>`
},

// ── GRABPAY ────────────────────────────────────────────────────────────────
// Brand green #00B14F. Bold filled G letterform — more filled/block than GCash's arc.
// Uses solid white fill rather than stroke to visually distinguish from GCash.
grabpay: {
    bg: "#00B14F", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00B14F"/>
        <path d="M20 10a10 10 0 1 0 9.3 6.3" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" fill="none"/>
        <rect x="20" y="18.5" width="9.5" height="3.5" rx="1.75" fill="#ffffff"/>
        <rect x="25.5" y="18.5" width="3.5" height="8" rx="1.75" fill="#ffffff"/>
    </svg>`
},

// ── SHOPEEPAY ──────────────────────────────────────────────────────────────
// Brand orange-red #EE4D2D. Shopping bag with Shopee's characteristic dot.
shopeepay: {
    bg: "#EE4D2D", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#EE4D2D"/>
        <path d="M13 18h14v8.5a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V18z"
              stroke="#ffffff" stroke-width="2.2" fill="rgba(255,255,255,0.1)"/>
        <path d="M17 18a3 3 0 0 1 6 0" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <circle cx="20" cy="23.5" r="2" fill="#ffffff"/>
    </svg>`
},

// ── PAYPAL ─────────────────────────────────────────────────────────────────
// Brand dark blue #003087. Overlapping double-P letterform.
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
// Brand lime green #9FE870 (not cyan — that was wrong). Bold dark W letterform.
// Wise's app icon: bright lime green background with their angular mark.
wise: {
    bg: "#9FE870", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#9FE870"/>
        <path d="M10 13l5.5 14 4.5-9 4.5 9 5.5-14"
              stroke="#163300" stroke-width="3.8"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── GOTYME ─────────────────────────────────────────────────────────────────
// Near-black #070D19, neon cyan G-arc. Distinct from GrabPay by color + shelf angle.
gotyme: {
    bg: "#070D19", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#070D19"/>
        <path d="M28 18a9 9 0 1 0 0 4" stroke="#00F0FF" stroke-width="2.8" stroke-linecap="round" fill="none"/>
        <path d="M21 20h8v3.5" stroke="#00F0FF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── HELLOMONEY ─────────────────────────────────────────────────────────────
// Orange #FF5E00, double-circle smiley.
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
// Brand blue #0035AD. Bold B letterform with BDO's signature gold diagonal slash.
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
// Brand red #CB333B. Temple columns — BPI's classic architectural crest motif.
bpi: {
    bg: "#CB333B", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#CB333B"/>
        <path d="M20 10L9 17.5h22L20 10z" fill="#FECACA"/>
        <rect x="11.5" y="17.5" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="18.5" y="17.5" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="25.5" y="17.5" width="3" height="11" rx="1" fill="#ffffff"/>
        <rect x="9" y="28.5" width="22" height="2.5" rx="1" fill="#FECACA"/>
    </svg>`
},

// ── METROBANK ──────────────────────────────────────────────────────────────
// Brand navy #1A3A6E. Filled M letterform — Metrobank's bold M mark.
metrobank: {
    bg: "#1A3A6E", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1A3A6E"/>
        <path d="M8 28V14l6 8.5 6-8.5 6 8.5 6-8.5v14" fill="#ffffff"/>
        <rect x="8" y="28" width="24" height="2" rx="1" fill="#93C5FD"/>
    </svg>`
},

// ── MARIBANK ───────────────────────────────────────────────────────────────
// Brand teal #0E7490. Wave M — MariBank's digital brand mark.
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
// FIX v6: Brand red #B91C1C (was wrong green #065F46 — same as Cash!).
// RCBC's actual identity uses a red diamond/rhombus motif.
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

// ── EASTWEST ───────────────────────────────────────────────────────────────
// FIX v6: Proper EastWest red #BD1622 (was too dark #7C1D1D).
// Bidirectional arrows — east/west compass motif fits their brand name perfectly.
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

// ── CHINABANK ──────────────────────────────────────────────────────────────
// FIX v6: Brand red #CC0000 (was wrong amber #92400E).
// China Bank's identity is distinctly red, not amber/brown.
// White C-arc with gold accent diamond retained.
chinabank: {
    bg: "#CC0000", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#CC0000"/>
        <path d="M29 14.5A11 11 0 1 0 29 26" stroke="#ffffff" stroke-width="3"
              stroke-linecap="round" fill="none"/>
        <path d="M27 20l3.5-3.5-3.5-3.5-3.5 3.5L27 20z" fill="#FCD34D"/>
    </svg>`
},

// ── LANDBANK ───────────────────────────────────────────────────────────────
// Brand green #166534. Wheat/grain stalk — Land Bank of the Philippines agricultural motif.
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
// FIX v6: Changed to #1B3F8B to avoid color collision with Coins.ph (#1D4ED8).
// Globe with meridians — Development Bank of the Philippines international scope.
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

// ── PNB ────────────────────────────────────────────────────────────────────
// Brand navy #00215B. Eight-ray Philippine sun — PNB's eagle+sun brand motif.
pnb: {
    bg: "#00215B", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#00215B"/>
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
// Dark slate #0F172A, blue A-triangle with crossbar.
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
// FIX v6: Brand hot pink/fuchsia #E91E63 (was too-dark maroon #9D174D).
// Tonik's actual brand is vibrant magenta-pink. Phone outline retained.
tonik: {
    bg: "#E91E63", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#E91E63"/>
        <rect x="13" y="8" width="14" height="24" rx="3" stroke="#ffffff" stroke-width="2.2" fill="none"/>
        <circle cx="20" cy="28.5" r="1.5" fill="#FCE4EC"/>
        <path d="M17 11.5h6" stroke="#FCE4EC" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
},

// ── UNO ────────────────────────────────────────────────────────────────────
// Dark slate #1E293B, phone with signal bars (UNO Digital Bank).
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
// Purple #4C1D95, U letterform (UnionDigital Bank).
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
// Orange #E05300, stylised S letterform (SeaBank / Sea Group).
seabank: {
    bg: "#E05300", type: "bank",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#E05300"/>
        <path d="M27 15c0-2.5-2-4.5-6-4.5C16 10.5 13 14 13 17c0 4.5 14 3.5 14 9.5C27 29 24.5 30 20 30S12 27 12 25"
              stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>`
},

// ── COINS.PH ───────────────────────────────────────────────────────────────
// Blue #1D4ED8, overlapping coin circles (Coins.ph crypto/payments).
coins: {
    bg: "#1D4ED8", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#1D4ED8"/>
        <circle cx="16.5" cy="21" r="7" stroke="#ffffff" stroke-width="2.2" fill="none"/>
        <circle cx="23.5" cy="21" r="7" stroke="#BFDBFE" stroke-width="2.2" fill="none"/>
    </svg>`
},

// ── APPLE PAY ─────────────────────────────────────────────────────────────
// Black #000000, white apple silhouette.
applepay: {
    bg: "#000000", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#000000"/>
        <path d="M25 17.5c-.3-.1-.5-.2-.8-.2-.3 0-.5.1-.8.2-.1-.4-.4-.7-.8-.9.4-.6.7-1.3.6-2-.7.1-1.4.4-1.9 1-.5.5-.8 1.2-.8 2h-.1c-1.3 0-2.5 1.2-2.5 2.5 0 2.8 2.3 6 4.2 6 .4 0 .6 0 .9-.1.3 0 .6.1.9.1 1.9 0 4.2-3.2 4.2-6 0-1.3-1.2-2.5-2.5-2.5h-.4z" fill="#ffffff"/>
        <path d="M22 12c.3-.7.1-1.6-.5-2.2" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" fill="none"/>
    </svg>`
},

// ── GOOGLE PAY ────────────────────────────────────────────────────────────
// White #FFFFFF, Google G in brand blue #4285F4.
googlepay: {
    bg: "#FFFFFF", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1.5"/>
        <path d="M27 20c0 4-3 7-7 7s-7-3-7-7 3-7 7-7c2.2 0 4 .9 5.2 2.2l-2 1.5C22.5 15.5 21.3 15 20 15c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5v-1h-5v-2.5h7.5c0 .5.1 1 .1 1.5z" fill="#4285F4"/>
    </svg>`
},

// ── REVOLUT ───────────────────────────────────────────────────────────────
// Brand blue #0075EB, card with forward arrow.
revolut: {
    bg: "#0075EB", type: "ewallet",
    svg: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="#0075EB"/>
        <rect x="10" y="11" width="20" height="18" rx="3" stroke="#ffffff" stroke-width="2.5" fill="none"/>
        <path d="M14 17h12M14 23h12" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
        <path d="M22 16l3 4-3 4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`
},

// ── CASH ───────────────────────────────────────────────────────────────────
// Emerald #065F46, banknote outline with centre coin circle.
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
