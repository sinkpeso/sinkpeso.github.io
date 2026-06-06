// ReportGenerator.js — Professional PDF Report for SINKPESO
//
// Generates a polished 3-page PDF matching the ReportLab reference design:
//   Page 1: Dark cover + dashboard
//   Page 2: Light theme — executive summary, bar chart, highlights
//   Page 3: Light theme — wallets with multi-currency FX breakdown
//
// Dependencies: jsPDF (window.jspdf), AutoTable plugin

(function () {
    "use strict";

    // ── Color palette ──────────────────────────────────────────────────────
    var GREEN       = [0, 230, 118];      // #00E676
    var RED         = [239, 68, 68];      // #EF4444
    var PURPLE      = [168, 85, 247];     // #A855F7
    var LIGHT_PURPLE= [192, 132, 252];    // #C084FC
    var BLUE        = [59, 130, 246];     // #3B82F6
    var WHITE       = [255, 255, 255];
    var DARK_BG     = [15, 23, 42];       // #0F172A
    var SLATE       = [30, 41, 59];       // #1E293B
    var GRAY        = [100, 116, 139];    // #64748B
    var BODY_TEXT   = [51, 65, 85];       // #334155
    var LIGHT_GRAY  = [241, 245, 249];    // #F1F5F9
    var BORDER_GRAY = [226, 232, 240];    // #E2E8F0
    var LIGHT_BG2   = [248, 250, 252];    // #F8FAFC

    // ── Layout ─────────────────────────────────────────────────────────────
    var ML = 0.75 * 25.4;   // 0.75 inch in mm ≈ 19mm
    var MR = 0.75 * 25.4;
    var MT = 15;
    var MB = 15;

    // ── Helpers ────────────────────────────────────────────────────────────
    function getPersonality(savingsRate) {
        if (savingsRate >= 30) return { label: "The Saver", color: GREEN };
        if (savingsRate >= 15) return { label: "The Balancer", color: BLUE };
        if (savingsRate >= 0) return { label: "The Spender", color: YELLOW };
        return { label: "The Overdraft", color: RED };
    }
    var YELLOW = [245, 158, 11];

    function getDayName(idx) {
        return ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"][idx] || "";
    }

    function needsSpace(doc, y, needed) {
        var maxY = doc.internal.pageSize.getHeight() - MB;
        return (y + needed) > maxY;
    }

    function fmtMoney(cents) {
        var v = (Number(cents) || 0) / 100;
        return v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ── Draw helpers ───────────────────────────────────────────────────────

    function drawDarkCover(doc, data) {
        var pw = doc.internal.pageSize.getWidth();
        var ph = doc.internal.pageSize.getHeight();

        // Dark background
        doc.setFillColor(DARK_BG[0], DARK_BG[1], DARK_BG[2]);
        doc.rect(0, 0, pw, ph, "F");

        // SINKPESO title
        doc.setFontSize(42);
        doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setFont("helvetica", "bold");
        doc.text("SINKPESO", pw / 2, ph * 0.18, { align: "center" });

        // Green accent line (80% width)
        var lineW = (pw - ML - MR) * 0.8;
        doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setLineWidth(1.2);
        doc.line(pw / 2 - lineW / 2, ph * 0.18 + 6, pw / 2 + lineW / 2, ph * 0.18 + 6);

        // Subtitle
        doc.setFontSize(14);
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont("helvetica", "normal");
        doc.text("Financial Report", pw / 2, ph * 0.18 + 22, { align: "center" });

        // Report date
        doc.setFontSize(24);
        doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setFont("helvetica", "bold");
        doc.text(data.reportDate, pw / 2, ph * 0.30, { align: "center" });

        // Timestamp
        doc.setFontSize(10);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        doc.text("Generated on " + data.generatedAt, pw / 2, ph * 0.30 + 14, { align: "center" });

        // Personality
        doc.setFontSize(9);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text("SPENDING PERSONALITY", pw / 2, ph * 0.40, { align: "center" });
        doc.setFontSize(20);
        doc.setTextColor(data.personality.color[0], data.personality.color[1], data.personality.color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(data.personality.label, pw / 2, ph * 0.40 + 14, { align: "center" });

        // 4 metric cards
        var sym = data.baseSymbol;
        var m = data.metrics;
        var cards = [
            { label: "TOTAL INCOME",  value: sym + fmtMoney(m.totalIncome),  color: GREEN },
            { label: "TOTAL SPENT",   value: sym + fmtMoney(m.totalSpent),   color: RED },
            { label: "SAVINGS RATE",  value: m.savingsRate,                  color: BLUE },
            { label: "NET AVAILABLE", value: sym + fmtMoney(m.netAvailable), color: m.netAvailable >= 0 ? GREEN : RED },
        ];

        var cardW = ((pw - ML - MR) - 18) / 4;
        var cardH = 34;
        var cardY = ph * 0.52;

        cards.forEach(function (c, i) {
            var x = ML + i * (cardW + 6);
            // Card bg
            doc.setFillColor(SLATE[0], SLATE[1], SLATE[2]);
            doc.roundedRect(x, cardY, cardW, cardH, 2, 2, "F");
            // Top accent
            doc.setFillColor(c.color[0], c.color[1], c.color[2]);
            doc.rect(x, cardY + cardH - 2, cardW, 2, "F");
            // Label
            doc.setFontSize(6.5);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.setFont("helvetica", "bold");
            doc.text(c.label, x + cardW / 2, cardY + 12, { align: "center" });
            // Value
            doc.setFontSize(12);
            doc.setTextColor(c.color[0], c.color[1], c.color[2]);
            doc.setFont("helvetica", "bold");
            doc.text(c.value, x + cardW / 2, cardY + 25, { align: "center", maxWidth: cardW - 6 });
        });

        // Quick stats line
        doc.setFontSize(9);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        doc.text(data.quickStats, pw / 2, cardY - 18, { align: "center", maxWidth: pw - ML - MR - 10 });

        // Cover footer
        doc.setFontSize(8);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text("Private  ·  Offline  ·  Yours", pw / 2, ph - 30, { align: "center" });
        doc.text("by Lodoy Goes Random  |  Page 1 of 3", pw / 2, ph - 22, { align: "center" });
    }

    function drawLightPageHeader(doc, pageNum) {
        var pw = doc.internal.pageSize.getWidth();
        var ph = doc.internal.pageSize.getHeight();

        // White background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pw, ph, "F");

        // Header
        doc.setFontSize(7);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        doc.text("SINKPESO  |  Financial Report", ML, 10);
        doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]);
        doc.setLineWidth(0.3);
        doc.line(ML, 12, pw - MR, 12);

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text("Private  ·  Offline  ·  Yours  ·  by Lodoy Goes Random  |  Page " + pageNum + " of 3",
            pw / 2, ph - 8, { align: "center" });
    }

    function drawSectionAnchor(doc, title, y) {
        // Green left bar
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.rect(ML, y - 4, 2.5, 12, "F");
        // Title
        doc.setFontSize(13);
        doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
        doc.setFont("helvetica", "bold");
        doc.text(title, ML + 8, y + 4);
        // Divider
        var pw = doc.internal.pageSize.getWidth();
        doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]);
        doc.setLineWidth(0.3);
        doc.line(ML, y + 10, pw - MR, y + 10);
        return y + 18;
    }

    function drawSummaryCard(doc, x, y, w, h, label, value, color) {
        // Background
        doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
        // Top accent
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(x, y + h - 1.5, w, 1.5, "F");
        // Label
        doc.setFontSize(6.5);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "bold");
        doc.text(label, x + w / 2, y + 10, { align: "center", maxWidth: w - 8 });
        // Value
        doc.setFontSize(11);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(value, x + w / 2, y + 21, { align: "center", maxWidth: w - 8 });
    }

    // ── Horizontal bar chart ───────────────────────────────────────────────
    function drawHorizontalBarChart(doc, labels, values, colors, sym, y) {
        var pw = doc.internal.pageSize.getWidth();
        var labelW = 35;
        var valueW = 28;
        var barAreaX = ML + labelW + 4;
        var barAreaW = pw - ML - MR - labelW - valueW - 12;
        var barH = 14;
        var rowH = 22;
        var maxVal = Math.max.apply(null, values) || 1;

        values.forEach(function (val, i) {
            var cy = y + i * rowH;
            var color = colors[i];
            var pct = maxVal > 0 ? (val / maxVal) : 0;

            // Category label (left)
            doc.setFontSize(8);
            doc.setTextColor(BODY_TEXT[0], BODY_TEXT[1], BODY_TEXT[2]);
            doc.setFont("helvetica", "bold");
            doc.text(labels[i], ML, cy + 5);

            // Bar track
            doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
            doc.roundedRect(barAreaX, cy, barAreaW, barH, 2, 2, "F");

            // Bar fill
            var fillW = Math.max(6, barAreaW * pct);
            doc.setFillColor(color[0], color[1], color[2]);
            doc.roundedRect(barAreaX, cy, fillW, barH, 2, 2, "F");

            // Value label (right of bar)
            doc.setFontSize(8);
            doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
            doc.setFont("helvetica", "bold");
            doc.text(sym + fmtMoney(val * 100), barAreaX + barAreaW + 5, cy + 5.5);
        });

        return y + values.length * rowH;
    }

    // ── Standard table config ───────────────────────────────────────────────
    function makeTable(doc, startY, headers, rows, colWidths, opts) {
        opts = opts || {};
        var allRows = [headers].concat(rows);
        // Wrap all cells in arrays for autoTable
        var body = allRows.slice(1);

        // Auto-distribute column widths if not provided
        var contentWidth = doc.internal.pageSize.getWidth() - ML - MR;
        var cw = colWidths;
        if (!cw) {
            var perCol = contentWidth / headers.length;
            cw = headers.map(function () { return perCol; });
        }

        var config = {
            startY: startY,
            margin: { left: ML, right: MR, top: MT, bottom: MB },
            tableWidth: contentWidth,
            columnStyles: {},
            body: body.map(function (row) {
                var obj = {};
                row.forEach(function (cell, i) { obj["col" + i] = cell; });
                return obj;
            }),
            styles: {
                fontSize: 8.5,
                cellPadding: { top: 10, bottom: 10, left: 12, right: 12 },
                textColor: BODY_TEXT,
                lineColor: BORDER_GRAY,
                lineWidth: 0.3,
                font: "helvetica",
                overflow: "linebreak",
                cellWidth: "wrap",
                minCellWidth: 20,
            },
            headStyles: {
                fillColor: SLATE,
                textColor: WHITE,
                fontStyle: "bold",
                fontSize: 8,
                cellPadding: { top: 10, bottom: 10, left: 12, right: 12 },
            },
            alternateRowStyles: { fillColor: LIGHT_BG2 },
            tableLineColor: BORDER_GRAY,
            tableLineWidth: 0.5,
            didDrawCell: function (data) {
                // Clean horizontal separation lines (LINEBELOW)
                if (data.section === "body") {
                    var doc = data.doc;
                    doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]);
                    doc.setLineWidth(0.5);
                    doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                }
            },
        };

        if (opts.columnStyles) config.columnStyles = opts.columnStyles;
        if (opts.didParseCell) config.didParseCell = opts.didParseCell;

        doc.autoTable(config);
        return doc.lastAutoTable.finalY;
    }

    // ════════════════════════════════════════════════════════════════════════
    // MAIN EXPORT
    // ════════════════════════════════════════════════════════════════════════
    function generateFullReport(appData) {
        if (!window.jspdf) {
            console.error("[ReportGenerator] jsPDF not loaded");
            alert("PDF library not loaded. Please refresh and try again.");
            return;
        }

        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        var pw = doc.internal.pageSize.getWidth();
        var ph = doc.internal.pageSize.getHeight();
        var contentW = pw - ML - MR;
        var sym = "P";

        // Extract app data
        var fc = appData.fc;
        var totals = appData.totals;
        var dailyExpenses = appData.dailyExpenses || [];
        var incomes = appData.incomes || [];
        var bills = appData.bills || [];
        var funds = appData.funds || [];
        var txns = appData.txns || [];
        var wallets = appData.wallets || [];
        var debts = appData.debts || [];
        var archives = appData.archives || [];
        var budgets = appData.budgets || [];
        var enrichedFunds = totals.enrichedFunds || funds;

        var now = new Date();
        var monthName = now.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
        var dateStr = now.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
        var timeStr = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

        // Pre-compute
        var catSpend = {};
        dailyExpenses.forEach(function (d) {
            catSpend[d.category] = (catSpend[d.category] || 0) + (d.amountCents || 0);
        });
        var sortedCats = Object.entries(catSpend).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);

        var biggest = dailyExpenses.reduce(function (max, d) {
            return (d.amountCents || 0) > (max.amountCents || 0) ? d : max;
        }, { amountCents: 0, name: "—", category: "", date: "" });

        var savingsRate = totals.totalIncome > 0
            ? Math.round(((totals.totalIncome - (totals.totalDailySpent + totals.paidBills)) / totals.totalIncome) * 100)
            : 0;
        var personality = getPersonality(savingsRate);

        var dayTotals = [0, 0, 0, 0, 0, 0, 0];
        dailyExpenses.forEach(function (d) {
            var dow = new Date(d.date + "T12:00:00").getDay();
            dayTotals[dow] += (d.amountCents || 0);
        });
        var peakDayIdx = dayTotals.indexOf(Math.max.apply(null, dayTotals));
        var peakDayTotal = dayTotals[peakDayIdx];
        var txnCount = dailyExpenses.length;
        var totalInVaults = enrichedFunds.reduce(function (s, f) { return s + (f.bal || f.savedCents || 0); }, 0);
        var walletTotal = wallets.reduce(function (s, w) { return s + (w.balanceCents || 0); }, 0);

        var quickStats = txnCount + " transactions  ·  " + sortedCats.length + " categories  ·  " +
            bills.length + " bills  ·  " + enrichedFunds.length + " vaults  ·  " + wallets.length + " wallets";

        // ════════════════════════════════════════════════════════════════════
        // PAGE 1: DARK COVER + DASHBOARD
        // ════════════════════════════════════════════════════════════════════
        drawDarkCover(doc, {
            baseSymbol: sym,
            reportDate: monthName,
            generatedAt: dateStr + " at " + timeStr,
            personality: personality,
            metrics: {
                totalIncome: totals.totalIncome,
                totalSpent: totals.totalDailySpent + totals.paidBills,
                savingsRate: savingsRate + "%",
                netAvailable: totals.netAvailable,
            },
            quickStats: quickStats,
        });

        // ════════════════════════════════════════════════════════════════════
        // PAGE 2: EXECUTIVE SUMMARY + BAR CHART + HIGHLIGHTS
        // ════════════════════════════════════════════════════════════════════
        doc.addPage();
        drawLightPageHeader(doc, 2);
        var y = MT + 6;

        // ── Executive Summary ───────────────────────────────────────────────
        y = drawSectionAnchor(doc, "Executive Summary", y);

        var sumCardW = (contentW - 6) / 2;
        var sumCardH = 26;
        var sumCards = [
            { label: "TOTAL INCOME",     value: sym + fmtMoney(totals.totalIncome),                  color: GREEN },
            { label: "DAILY EXPENSES",   value: sym + fmtMoney(totals.totalDailySpent),              color: RED },
            { label: "PAID BILLS",       value: sym + fmtMoney(totals.paidBills),                    color: PURPLE },
            { label: "UNPAID BILLS",     value: sym + fmtMoney(totals.unpaidBills),                  color: totals.unpaidBills > 0 ? RED : GRAY },
            { label: "IN SAVINGS VAULTS",value: sym + fmtMoney(totalInVaults),                       color: BLUE },
            { label: "NET AVAILABLE",    value: sym + fmtMoney(totals.netAvailable),                 color: totals.netAvailable >= 0 ? GREEN : RED },
            { label: "SAVINGS RATE",     value: savingsRate + "%",                                   color: BLUE },
            { label: "TOTAL SPENT",      value: sym + fmtMoney(totals.totalDailySpent + totals.paidBills), color: RED },
        ];

        sumCards.forEach(function (c, i) {
            var col = i % 2;
            var row = Math.floor(i / 2);
            var cx = ML + col * (sumCardW + 6);
            var cy = y + row * (sumCardH + 4);
            drawSummaryCard(doc, cx, cy, sumCardW, sumCardH, c.label, c.value, c.color);
        });
        y += Math.ceil(sumCards.length / 2) * (sumCardH + 4) + 6;

        // ── Spending Breakdown Horizontal Bar Chart ─────────────────────────
        if (needsSpace(doc, y, 80)) { doc.addPage(); drawLightPageHeader(doc, 2); y = MT + 6; }
        y = drawSectionAnchor(doc, "Spending Breakdown", y);

        var chartLabels = ["Daily Expenses", "Paid Bills", "Unpaid Bills"];
        var chartValues = [
            (totals.totalDailySpent || 0) / 100,
            (totals.paidBills || 0) / 100,
            (totals.unpaidBills || 0) / 100
        ];
        var chartColors = [RED, PURPLE, [100, 116, 139]]; // Red, Purple, Slate Gray
        y = drawHorizontalBarChart(doc, chartLabels, chartValues, chartColors, sym, y);
        y += 6;

        // ════════════════════════════════════════════════════════════════════
        // PAGE 3: HIGHLIGHTS + WALLETS
        // ════════════════════════════════════════════════════════════════════
        doc.addPage();
        drawLightPageHeader(doc, 3);
        y = MT + 6;

        // ── Highlights Table ────────────────────────────────────────────────
        y = drawSectionAnchor(doc, "Highlights", y);

        var highlightRows = [];
        if (biggest.amountCents > 0) {
            highlightRows.push(["Biggest Expense", biggest.name + " (" + biggest.category + ")", sym + fmtMoney(biggest.amountCents)]);
        }
        highlightRows.push(["Peak Spending Day", getDayName(peakDayIdx), sym + fmtMoney(peakDayTotal)]);
        highlightRows.push(["Total Transactions", String(txnCount), "—"]);
        highlightRows.push(["Peak Day Total", getDayName(peakDayIdx), sym + fmtMoney(peakDayTotal)]);
        highlightRows.push(["Total in Vaults", "Savings", sym + fmtMoney(totalInVaults)]);

        var hlFinalY = makeTable(doc, y, ["Metric", "Detail", "Amount"], highlightRows, null, {
            columnStyles: { 2: { halign: "right", fontStyle: "bold" } }
        });
        y = hlFinalY + 10;

        // ── Wallets Table ───────────────────────────────────────────────────
        if (needsSpace(doc, y, 60)) { doc.addPage(); drawLightPageHeader(doc, 3); y = MT + 6; }
        y = drawSectionAnchor(doc, "Wallets & Multi-Currency Breakdown", y);

        var walletRows = [];
        var combinedBaseTotal = 0;

        wallets.forEach(function (w) {
            var bal = (w.balanceCents || 0) / 100;
            var currency = w.currency || "PHP";
            var nativeSymbol = w.currencySymbol || (currency === "PHP" ? "P" : currency === "USD" ? "$" : currency);
            var fxRate = w.fxRateToBase || 1.0;
            var nativeStr = nativeSymbol + bal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            var fxStr = "1 " + currency + " = " + fxRate.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " PHP";
            var baseVal = bal * fxRate;
            combinedBaseTotal += baseVal;
            var baseStr = sym + baseVal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            walletRows.push([w.name || "", w.type || "—", nativeStr, fxStr, baseStr]);
        });

        // Total row
        walletRows.push(["TOTAL (Combined)", "", "", "", sym + combinedBaseTotal.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })]);

        var walColW = [contentW * 0.17, contentW * 0.10, contentW * 0.22, contentW * 0.27, contentW * 0.24];
        var walFinalY = makeTable(doc, y, ["Wallet", "Type", "Original Balance", "FX Rate", "Total (Base)"], walletRows, walColW, {
            columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
            didParseCell: function (data) {
                // Bold total row
                if (data.section === "body" && data.row.index === walletRows.length - 1) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = LIGHT_GRAY;
                    data.cell.styles.textColor = SLATE;
                }
            }
        });
        y = walFinalY + 8;

        // FX Reference Callout Box
        var fxNotes = [];
        wallets.forEach(function (w) {
            var currency = w.currency || "PHP";
            if (currency !== "PHP") {
                var rate = w.fxRateToBase || 1.0;
                fxNotes.push("1 " + currency + " = " + rate.toLocaleString("en-PH", { minimumFractionDigits: 2 }) + " PHP");
            }
        });

        if (fxNotes.length > 0 && !needsSpace(doc, y, 20)) {
            var noteText = "Note: Exchange rates are relative to base currency (PHP). " + fxNotes.join(", ") + ".";
            // Draw callout box
            doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
            var boxW = contentW;
            var boxH = 14;
            doc.roundedRect(ML, y, boxW, boxH, 2, 2, "F");
            doc.setFontSize(7.5);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.setFont("helvetica", "italic");
            doc.text(noteText, ML + 6, y + 6, { maxWidth: boxW - 12 });
            y += boxH + 6;
        }

        // ── Bills Table (if data) ──────────────────────────────────────────
        if (bills.length > 0 && !needsSpace(doc, y, 50)) {
            y = drawSectionAnchor(doc, "Bills", y);

            var billRows = bills.map(function (b) {
                return [b.name || "", b.dueDate || "", b.isPaid ? "Paid" : "Unpaid", b.recurring || "—", sym + fmtMoney(b.amountCents)];
            });
            var paidTotal = bills.reduce(function (s, b) { return s + (b.isPaid ? b.amountCents : 0); }, 0);
            var totalBillsVal = bills.reduce(function (s, b) { return s + (b.amountCents || 0); }, 0);
            billRows.push(["", "", "", "PAID", sym + fmtMoney(paidTotal)]);
            billRows.push(["", "", "", "TOTAL", sym + fmtMoney(totalBillsVal)]);

            makeTable(doc, y, ["Bill", "Due Date", "Status", "Recurring", "Amount"], billRows, null, {
                columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
                didParseCell: function (data) {
                    if (data.section === "body") {
                        if (data.column.index === 2 && data.row.index < bills.length) {
                            if (data.cell.raw === "Paid") data.cell.styles.textColor = GREEN;
                            else if (data.cell.raw === "Unpaid") data.cell.styles.textColor = RED;
                            data.cell.styles.fontStyle = "bold";
                        }
                        if (data.row.index >= bills.length) {
                            data.cell.styles.fontStyle = "bold";
                            data.cell.styles.fillColor = LIGHT_GRAY;
                            data.cell.styles.textColor = SLATE;
                        }
                    }
                }
            });
        }

        // ── Savings Vaults (if data) ───────────────────────────────────────
        if (enrichedFunds.length > 0 && !needsSpace(doc, y, 50)) {
            y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y;
            if (!needsSpace(doc, y, 50)) {
                y = drawSectionAnchor(doc, "Savings Vaults", y);

                var vaultRows = enrichedFunds.map(function (f) {
                    var saved = f.bal || f.savedCents || 0;
                    var goal = f.goalCents || 0;
                    var pct = goal > 0 ? Math.round((saved / goal) * 100) : 0;
                    var status = pct >= 100 ? "Complete" : (pct >= 50 ? "On Track" : "Starting");
                    return [f.name || "", sym + fmtMoney(goal), sym + fmtMoney(saved), pct + "%", status];
                });

                makeTable(doc, y, ["Vault", "Target", "Saved", "Progress", "Status"], vaultRows, null, {
                    columnStyles: { 1: { halign: "right" }, 2: { halign: "right", fontStyle: "bold" }, 3: { halign: "right" } },
                    didParseCell: function (data) {
                        if (data.section === "body" && data.column.index === 4) {
                            if (data.cell.raw === "Complete") data.cell.styles.textColor = GREEN;
                            else if (data.cell.raw === "On Track") data.cell.styles.textColor = BLUE;
                            else data.cell.styles.textColor = YELLOW;
                            data.cell.styles.fontStyle = "bold";
                        }
                    }
                });
            }
        }

        // ── Save ────────────────────────────────────────────────────────────
        var filename = "SINKPESO_Report_" + now.toISOString().slice(0, 10) + ".pdf";
        doc.save(filename);
    }

    // ── Expose ──────────────────────────────────────────────────────────────
    window.generateFullReport = generateFullReport;

})();