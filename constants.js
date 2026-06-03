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

})();