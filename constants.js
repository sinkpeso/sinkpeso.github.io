// constants.js — Shared style tokens, icon paths, and configuration for SINKPESO
// No React. No side effects. Pure constants only.
// Load order: must come after React CDN, before any component files.

(function () {
    "use strict";

    // ── SHARED STYLE TOKENS ───────────────────────────────────────────────
    var S = {
        // LAYOUT
        row:        { display:"flex", alignItems:"center" },
        row8:       { display:"flex", alignItems:"center", gap:8 },
        row10:      { display:"flex", alignItems:"center", gap:10 },
        row12:      { display:"flex", alignItems:"center", gap:12 },
        rowBetween: { display:"flex", alignItems:"center", justifyContent:"space-between" },
        col:        { display:"flex", flexDirection:"column" },
        colGap8:    { display:"flex", flexDirection:"column", gap:8 },

        // TYPOGRAPHY
        pageTitle:   { fontSize:22, fontWeight:800, color:"var(--text-main)", lineHeight:1.15, letterSpacing:"-0.02em" },
        sectionTitle:{ fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:14 },
        modalTitle:  { fontSize:17, fontWeight:800, color:"var(--text-main)", letterSpacing:"-0.01em" },
        heroVal:     { fontSize:36, fontWeight:800, color:"#00E676", lineHeight:1, fontVariantNumeric:"tabular-nums", letterSpacing:"-0.02em" },
        bodyMuted:   { fontSize:13, color:"var(--text-muted)", lineHeight:1.55 },
        muted:       { fontSize:13, color:"var(--text-muted)" },
        label:       { fontSize:11, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:"var(--text-muted)" },

        // CARDS
        statCard:    { background:"var(--hover-bg)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px" },
        card:        { background:"var(--bg-panel)", border:"1px solid var(--border)", borderRadius:20, padding:24 },

        // BUTTONS
        chip: function(bg, color, border) { return { display:"inline-flex", alignItems:"center", gap:6, background:bg, color:color, border:"1px solid " + border, padding:"5px 11px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }; },
        iconBtn:     { background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", width:32, height:32, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0 },
        closeBtn:    { background:"var(--hover-bg)", border:"none", color:"var(--text-light)", width:30, height:30, borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },

        // PAGE STRUCTURE
        pageHeader:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 },
        modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
        modalFooter: { display:"flex", gap:10, marginTop:24 },
        formFooter:  { display:"flex", gap:10, marginTop:8 },
        section:     { marginBottom:24 },
    };

    // ── Z-INDEX LAYER SYSTEM ─────────────────────────────────────────────
    var Z = {
        STICKY_HEADER: 100,
        FAB:           180,
        BOTTOM_NAV:    200,
        MENU_BACKDROP: 299,
        MENU_DROPDOWN: 300,
        SHEET:         500,
        MODAL:         1000,
        MODAL_INLINE:  1100,
        TOAST:         9000,
        PIN_SCREEN:    9999,
    };

    // ── CATEGORIES ───────────────────────────────────────────────────────
    var CATEGORIES = ["Food", "Gas", "Bills", "Business", "Personal", "Savings"];

    // ── CURRENCIES ───────────────────────────────────────────────────────
    var CURRENCIES = {
        "PHP": { style: "currency", currency: "PHP" },
        "USD": { style: "currency", currency: "USD" },
        "EUR": { style: "currency", currency: "EUR" },
        "GBP": { style: "currency", currency: "GBP" },
        "JPY": { style: "currency", currency: "JPY", minimumFractionDigits: 0 }
    };

    var EXCHANGE_RATES = {
        "PHP": 1, "USD": 0.018, "EUR": 0.016, "GBP": 0.014, "JPY": 2.65
    };

    // ── WALLET CONSTANTS ─────────────────────────────────────────────────
    var WALLET_COLORS = ["#00E676","#3B82F6","#A855F7","#F59E0B","#EF4444","#10B981","#EC4899","#64748B"];
    var CASH_WALLET_ID = "sp-cash";
    var CASH_WALLET = { id: CASH_WALLET_ID, name: "Cash", openingBalanceCents: 0, color: "#00E676" };

    // ── VAULT ICONS ─────────────────────────────────────────────────────
    var FUND_ICONS = [
        { id: "landmark",    label: "Savings" },
        { id: "shield",      label: "Emergency" },
        { id: "plane",       label: "Travel" },
        { id: "briefcase",   label: "Business" },
        { id: "smartphone",  label: "Gadget" },
        { id: "utensils",    label: "Food" },
        { id: "receipt",     label: "Bills" },
        { id: "shoppingbag", label: "Shopping" },
        { id: "car",         label: "Vehicle" },
        { id: "home2",       label: "Housing" },
        { id: "gift",        label: "Gift" },
        { id: "trendingup",  label: "Investment" },
    ];

    var resolveVaultIcon = function(iconId) {
        for (var i = 0; i < FUND_ICONS.length; i++) {
            if (FUND_ICONS[i].id === iconId) return iconId;
        }
        return "landmark";
    };

    // ── EXPOSE ────────────────────────────────────────────────────────────
    window.SINKPESO_CONSTANTS = {
        S: S, Z: Z,
        CATEGORIES: CATEGORIES,
        CURRENCIES: CURRENCIES,
        EXCHANGE_RATES: EXCHANGE_RATES,
        WALLET_COLORS: WALLET_COLORS,
        CASH_WALLET_ID: CASH_WALLET_ID,
        CASH_WALLET: CASH_WALLET,
        FUND_ICONS: FUND_ICONS,
        resolveVaultIcon: resolveVaultIcon
    };

    // Also expose individual items for backward compat with index.html
    window.SINKPESO_S = S;
    window.SINKPESO_Z = Z;

    // ── LUCIDE SVG ICON PRIMITIVE ─────────────────────────────────────────
    // Inline SVG so zero network requests, zero dependencies
    var ICONS = {
        home:        "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
        wallet:      "M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5 M16 12h.01",
        receipt:     "M4 2h16v20l-8-4-8 4z",
        landmark:    "M3 22h18 M6 18V11 M10 18V11 M14 18V11 M18 18V11 M12 2L2 7h20z",
        settings:    "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
        lock:        "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
        plus:        "M12 5v14 M5 12h14",
        archive:     "M21 8v13H3V8 M1 3h22v5H1z M10 12h4",
        grid:        "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
        list:        "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
        history:     "M12 8v4l3 3 M3.05 11a9 9 0 109.9-8.95",
        more:        "M5 12h.01 M12 12h.01 M19 12h.01",
        x:           "M18 6L6 18 M6 6l12 12",
        shield:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        plane:       "M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
        briefcase:   "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
        smartphone:  "M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2z M12 18h.01",
        utensils:    "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2 M7 2v20 M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
        shoppingbag: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0",
        target:      "M12 22a10 10 0 100-20 10 10 0 000 20z M12 18a6 6 0 100-12 6 6 0 000 12z M12 14a2 2 0 100-4 2 2 0 000 4z",
        trendingup:  "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
        edit:        "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
        trash:       "M3 6h18 M8 6V4h8v2 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6",
        clipboardlist:"M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2 M9 14l2 2 4-4 M8 2h8v4H8z",
        inbox:       "M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
        arrowupdown: "M7 16V4m0 0L3 8m4-4l4 4 M17 8v12m0 0l4-4m-4 4l-4-4",
        car:         "M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-3 M8.5 17a1.5 1.5 0 100 3 1.5 1.5 0 000-3z M18.5 17a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
        home2:       "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
        gift:        "M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z",
        creditcard:  "M1 4h22v16H1z M1 10h22",
        banknote:    "M2 7h20v14H2z M16 14a2 2 0 000-4H8 M6 14h.01",
        calendar:    "M3 4h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z M16 2v4 M8 2v4 M1 10h22",
        camera:      "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
        image:       "M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z M21 15l-5-5L5 21",
        zoomin:      "M21 21l-4.35-4.35 M17 11A6 6 0 105 11a6 6 0 0012 0z M11 8v6 M8 11h6",
        coffee:      "M17 8h1a4 4 0 110 8h-1 M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4z M6 2v2 M10 2v2 M14 2v2",
        transfer:    "M8 3L4 7l4 4 M4 7h16 M16 21l4-4-4-4 M20 17H4",
    };

    function Icon({ name, size, color, style }) {
        var e = React.createElement;
        size = size || 18;
        color = color || "currentColor";
        style = style || {};
        var path = ICONS[name] || ICONS.target;
        return e('svg', { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: Object.assign({ flexShrink: 0 }, style) },
            ...path.split(" M").map(function (seg, i) { return e('path', { key: i, d: (i === 0 ? "" : "M") + seg }); })
        );
    }

    window.SINKPESO_ICONS = ICONS;
    window.SINKPESO_Icon = Icon;

})();
