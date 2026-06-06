// ReportGenerator.js — Minimalist Executive PDF for SINKPESO
//
// Refactored design goals:
//   • Stark monochrome palette — black, off-white, four gray stops
//   • ONE accent color pair (green/red) reserved exclusively for
//     final balances and positive/negative margins
//   • All monetary values strictly right-aligned
//   • Typographic hierarchy replaces colored cards and dark backgrounds
//   • Tables: no fill noise — just hairline horizontal rules
//   • Drop-in replacement — appData schema is 100% unchanged
//
// Dependencies: jsPDF (window.jspdf), AutoTable plugin

(function () {
    "use strict";

    // ── Palette: monochrome spectrum + two functional accents ──────────────
    //    Everything is expressed in [R, G, B] arrays for jsPDF.
    var INK       = [17,  24,  39];     // #111827  — primary text, headings
    var SECONDARY = [75,  85,  99];     // #4B5563  — secondary text, sub-labels
    var MUTED     = [156, 163, 175];    // #9CA3AF  — captions, rules, timestamps
    var RULE      = [229, 231, 235];    // #E5E7EB  — hairline dividers, bar tracks
    var SURFACE   = [249, 250, 251];    // #F9FAFB  — barely-there alternate row tint
    var WHITE     = [255, 255, 255];
    // Accent: used ONLY for final balance / positive-negative outcomes
    var ACCENT_P  = [22,  163, 74];     // #16A34A  — positive balance, "Paid", "Complete"
    var ACCENT_N  = [220, 38,  38];     // #DC2626  — negative balance, "Unpaid", overdue

    // ── Layout constants ────────────────────────────────────────────────────
    var ML = 0.75 * 25.4;   // 0.75 in → ~19 mm  left margin
    var MR = 0.75 * 25.4;   //                    right margin
    var MT = 15;             // mm  top margin for autoTable pagination
    var MB = 15;             // mm  bottom margin for needsSpace checks

    // ── Utility functions ───────────────────────────────────────────────────

    function getPersonality(savingsRate) {
        if (savingsRate >= 30) return { label: "The Saver",     color: ACCENT_P   };
        if (savingsRate >= 15) return { label: "The Balancer",  color: SECONDARY  };
        if (savingsRate >= 0)  return { label: "The Spender",   color: MUTED      };
        return                        { label: "The Overdraft", color: ACCENT_N   };
    }

    function getDayName(idx) {
        return ["Sundays","Mondays","Tuesdays","Wednesdays",
                "Thursdays","Fridays","Saturdays"][idx] || "";
    }

    function needsSpace(doc, y, needed) {
        return (y + needed) > (doc.internal.pageSize.getHeight() - MB);
    }

    function fmtMoney(cents) {
        var v = (Number(cents) || 0) / 100;
        return v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Resolve text color from a tri-state: true → green, false → red, undefined → ink
    function accentFor(positive) {
        if (positive === true)  return ACCENT_P;
        if (positive === false) return ACCENT_N;
        return INK;
    }

    // ════════════════════════════════════════════════════════════════════════
    // DRAW HELPERS
    // ════════════════════════════════════════════════════════════════════════

    // ── Cover page (Page 1) ─────────────────────────────────────────────────
    // White background. Pure typographic layout — no card shapes, no fills.
    // Metrics rendered as a ruled list: label left (muted), value right (bold).
    function drawCover(doc, data) {
        var pw  = doc.internal.pageSize.getWidth();
        var ph  = doc.internal.pageSize.getHeight();
        var cx  = pw / 2;
        var rCol = pw - MR;

        // White background
        doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.rect(0, 0, pw, ph, "F");

        // ── Wordmark ──────────────────────────────────────────────────────────
        var titleY = ph * 0.17;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(42);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text("SINKPESO", cx, titleY, { align: "center" });

        // Single bold rule below wordmark (55% page width)
        var ruleW = (pw - ML - MR) * 0.55;
        doc.setDrawColor(INK[0], INK[1], INK[2]);
        doc.setLineWidth(0.8);
        doc.line(cx - ruleW / 2, titleY + 5, cx + ruleW / 2, titleY + 5);

        // Document type label
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text("FINANCIAL REPORT", cx, titleY + 15, { align: "center" });

        // ── Report period ─────────────────────────────────────────────────────
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text(data.reportDate, cx, ph * 0.295, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text("Generated " + data.generatedAt, cx, ph * 0.295 + 9, { align: "center" });

        // ── Spending personality ───────────────────────────────────────────────
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text("SPENDING PERSONALITY", cx, ph * 0.40, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(
            data.personality.color[0],
            data.personality.color[1],
            data.personality.color[2]
        );
        doc.text(data.personality.label, cx, ph * 0.40 + 11, { align: "center" });

        // ── Key metrics: ruled typographic list ───────────────────────────────
        // Label (uppercase, muted, small) on the left.
        // Value (bold) on the right. Only Net Available gets accent color.
        var m = data.metrics;
        var sym = data.baseSymbol;
        var metricItems = [
            { label: "Total Income",  value: sym + fmtMoney(m.totalIncome)  },
            { label: "Total Spent",   value: sym + fmtMoney(m.totalSpent)   },
            { label: "Savings Rate",  value: m.savingsRate                  },
            { label: "Net Available", value: sym + fmtMoney(m.netAvailable),
              positive: m.netAvailable >= 0 },
        ];

        var metricStartY = ph * 0.52;
        var rowH = 17;
        var stackLeft  = ML;
        var stackRight = pw - MR;

        metricItems.forEach(function (item, i) {
            var my = metricStartY + i * rowH;

            // Hairline rule above each row
            doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
            doc.setLineWidth(0.2);
            doc.line(stackLeft, my, stackRight, my);

            // Label — left-aligned, uppercase, small, muted
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
            doc.text(item.label.toUpperCase(), stackLeft, my + 10);

            // Value — right-aligned, bold, accent only for net
            var col = accentFor(item.positive);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(col[0], col[1], col[2]);
            doc.text(item.value, stackRight, my + 12, { align: "right" });
        });

        // Closing rule after last metric
        var closeRuleY = metricStartY + metricItems.length * rowH;
        doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
        doc.setLineWidth(0.2);
        doc.line(stackLeft, closeRuleY, stackRight, closeRuleY);

        // Quick stats — small, muted, centered below metrics
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(data.quickStats, cx, closeRuleY + 11, {
            align: "center",
            maxWidth: pw - ML - MR
        });

        // ── Footer ────────────────────────────────────────────────────────────
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text("Private  ·  Offline  ·  Yours", cx, ph - 22, { align: "center" });
        doc.text("by Lodoy Goes Random  ·  Page 1 of 3", cx, ph - 14, { align: "center" });
    }

    // ── Interior page header (Pages 2–3) ────────────────────────────────────
    // Bold top rule replaces the original two-tone band.
    // No colored fills. Footer: small, muted, centered.
    function drawPageHeader(doc, pageNum) {
        var pw = doc.internal.pageSize.getWidth();
        var ph = doc.internal.pageSize.getHeight();

        // White background
        doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.rect(0, 0, pw, ph, "F");

        // Bold top rule
        doc.setDrawColor(INK[0], INK[1], INK[2]);
        doc.setLineWidth(0.8);
        doc.line(ML, 12, pw - MR, 12);

        // Product name — left, bold, small caps feel
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text("SINKPESO", ML, 9);

        // Page indicator — right, muted
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(
            "Financial Report  ·  Page " + pageNum + " of 3",
            pw - MR, 9, { align: "right" }
        );

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(
            "Private  ·  Offline  ·  Yours  ·  by Lodoy Goes Random",
            pw / 2, ph - 8, { align: "center" }
        );
    }

    // ── Section heading ─────────────────────────────────────────────────────
    // Replaces the colored left-bar anchor with a clean all-caps label
    // followed by a full-width hairline rule. No colored elements.
    function drawSectionAnchor(doc, title, y) {
        var pw = doc.internal.pageSize.getWidth();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        doc.text(title.toUpperCase(), ML, y + 5);

        // Full-width rule — slightly heavier than body hairlines
        doc.setDrawColor(INK[0], INK[1], INK[2]);
        doc.setLineWidth(0.4);
        doc.line(ML, y + 8, pw - MR, y + 8);

        return y + 17;
    }

    // ── Metric grid row ─────────────────────────────────────────────────────
    // Renders N label-value pairs side by side in equal columns.
    // Label: 7 pt, uppercase, muted.  Value: 11 pt, bold, right-aligned
    // within its column. Hairline rule above and after the row.
    // Accent color applied only when `positive` is explicitly true/false.
    function drawMetricRow(doc, pairs, y) {
        var pw      = doc.internal.pageSize.getWidth();
        var contentW = pw - ML - MR;
        var n       = pairs.length;
        var colW    = contentW / n;
        var rowH    = 21;

        pairs.forEach(function (p, i) {
            var x = ML + i * colW;

            // Top hairline for this column's cell
            doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
            doc.setLineWidth(0.18);
            doc.line(x, y, x + colW - 2, y);

            // Label
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6.5);
            doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
            doc.text(p.label.toUpperCase(), x, y + 8);

            // Value — right-aligned within its column
            var col = accentFor(p.positive);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(col[0], col[1], col[2]);
            doc.text(p.value, x + colW - 3, y + 18, { align: "right" });
        });

        // Full-width bottom rule
        doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
        doc.setLineWidth(0.18);
        doc.line(ML, y + rowH, pw - MR, y + rowH);

        return y + rowH + 3;
    }

    // ── Minimal horizontal bar chart ────────────────────────────────────────
    // No rounded corners. Track is RULE gray. Fills are INK (first/largest)
    // and SECONDARY (remaining bars) — all monochrome.
    // Values are right-aligned past the bar area.
    function drawHorizontalBarChart(doc, labels, values, y) {
        var pw       = doc.internal.pageSize.getWidth();
        var contentW = pw - ML - MR;
        var labelW   = 46;
        var valueW   = 38;
        var barAreaX = ML + labelW;
        var barAreaW = contentW - labelW - valueW;
        var barH     = 5;
        var rowH     = 14;
        var maxVal   = Math.max.apply(null, values) || 1;
        var sym      = "PHP ";

        values.forEach(function (val, i) {
            var cy = y + i * rowH;

            // Category label — secondary color, not muted (readable)
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
            doc.text(labels[i], ML, cy + 5);

            // Track (flat rect, RULE color — no rounded rect = less visual noise)
            doc.setFillColor(RULE[0], RULE[1], RULE[2]);
            doc.rect(barAreaX, cy, barAreaW, barH, "F");

            // Fill: dominant bar = INK, others = SECONDARY
            var fillW = Math.max(2, barAreaW * (val / maxVal));
            var shade = i === 0 ? INK : SECONDARY;
            doc.setFillColor(shade[0], shade[1], shade[2]);
            doc.rect(barAreaX, cy, fillW, barH, "F");

            // Value — right-aligned, bold, ink
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(INK[0], INK[1], INK[2]);
            var valStr = sym + val.toLocaleString("en-PH", {
                minimumFractionDigits: 2, maximumFractionDigits: 2
            });
            doc.text(valStr, ML + contentW, cy + 5, { align: "right" });
        });

        return y + values.length * rowH + 4;
    }

    // ── Table builder ───────────────────────────────────────────────────────
    // Stripped back to bare essentials:
    //   • White fill (no alternating background drama — only SURFACE tint)
    //   • Zero cell borders — replaced by:
    //       – one bold hairline under the header row
    //       – one ultra-light hairline under each body row
    //   • Header: white background, SECONDARY text, bold — no dark slab
    //   • Tighter cell padding than the original (5 pt vs 10 pt top/bottom)
    function makeTable(doc, startY, headers, rows, colWidths, opts) {
        opts = opts || {};
        var contentWidth = doc.internal.pageSize.getWidth() - ML - MR;

        var config = {
            startY: startY,
            margin: { left: ML, right: MR, top: MT, bottom: MB },
            tableWidth: contentWidth,
            columnStyles: {},
            body: rows.map(function (row) {
                var obj = {};
                row.forEach(function (cell, i) { obj["col" + i] = cell; });
                return obj;
            }),
            styles: {
                fontSize: 8,
                cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
                textColor: INK,
                lineColor: RULE,
                lineWidth: 0,           // All borders disabled — rules drawn manually
                font: "helvetica",
                overflow: "linebreak",
                fillColor: WHITE,
            },
            headStyles: {
                fillColor: WHITE,       // No dark slate header slab
                textColor: SECONDARY,   // Subdued header text
                fontStyle: "bold",
                fontSize: 7,
                cellPadding: { top: 4, bottom: 5, left: 4, right: 4 },
                lineWidth: 0,
            },
            // Very subtle tint — only 2 RGB steps off white
            alternateRowStyles: { fillColor: SURFACE },
            tableLineWidth: 0,
            didDrawCell: function (data) {
                var d = data.doc;
                // Bold hairline under the entire header row
                if (data.section === "head") {
                    d.setDrawColor(INK[0], INK[1], INK[2]);
                    d.setLineWidth(0.4);
                    d.line(
                        data.cell.x,
                        data.cell.y + data.cell.height,
                        data.cell.x + data.cell.width,
                        data.cell.y + data.cell.height
                    );
                }
                // Ultra-light hairline under each body row cell
                if (data.section === "body") {
                    d.setDrawColor(RULE[0], RULE[1], RULE[2]);
                    d.setLineWidth(0.18);
                    d.line(
                        data.cell.x,
                        data.cell.y + data.cell.height,
                        data.cell.x + data.cell.width,
                        data.cell.y + data.cell.height
                    );
                }
            },
        };

        if (opts.columnStyles) config.columnStyles = opts.columnStyles;
        if (opts.didParseCell) config.didParseCell = opts.didParseCell;

        doc.autoTable(config);
        return doc.lastAutoTable.finalY;
    }

    // ════════════════════════════════════════════════════════════════════════
    // MAIN EXPORT — appData schema unchanged
    // ════════════════════════════════════════════════════════════════════════
    function generateFullReport(appData) {
        if (!window.jspdf) {
            console.error("[ReportGenerator] jsPDF not loaded");
            alert("PDF library not loaded. Please refresh and try again.");
            return;
        }

        var jsPDF = window.jspdf.jsPDF;
        var doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        var pw    = doc.internal.pageSize.getWidth();
        var contentW = pw - ML - MR;
        var sym   = "PHP ";

        // ── Extract app data (schema identical to previous version) ───────────
        var fc           = appData.fc;
        var totals       = appData.totals;
        var dailyExpenses = appData.dailyExpenses || [];
        var incomes      = appData.incomes      || [];
        var bills        = appData.bills        || [];
        var funds        = appData.funds        || [];
        var txns         = appData.txns         || [];
        var wallets      = appData.wallets      || [];
        var debts        = appData.debts        || [];
        var archives     = appData.archives     || [];
        var budgets      = appData.budgets      || [];
        var enrichedFunds = totals.enrichedFunds || funds;

        var now      = new Date();
        var monthName = now.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
        var dateStr  = now.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
        var timeStr  = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

        // ── Pre-compute ───────────────────────────────────────────────────────
        var catSpend = {};
        dailyExpenses.forEach(function (d) {
            catSpend[d.category] = (catSpend[d.category] || 0) + (d.amountCents || 0);
        });
        var sortedCats = Object.entries(catSpend)
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 5);

        var biggest = dailyExpenses.reduce(function (max, d) {
            return (d.amountCents || 0) > (max.amountCents || 0) ? d : max;
        }, { amountCents: 0, name: "—", category: "", date: "" });

        var savingsRate = totals.totalIncome > 0
            ? Math.round(
                ((totals.totalIncome - (totals.totalDailySpent + totals.paidBills))
                / totals.totalIncome) * 100
              )
            : 0;
        var personality = getPersonality(savingsRate);

        var dayTotals = [0, 0, 0, 0, 0, 0, 0];
        dailyExpenses.forEach(function (d) {
            var dow = new Date(d.date + "T12:00:00").getDay();
            dayTotals[dow] += (d.amountCents || 0);
        });
        var peakDayIdx   = dayTotals.indexOf(Math.max.apply(null, dayTotals));
        var peakDayTotal = dayTotals[peakDayIdx];
        var txnCount     = dailyExpenses.length;
        var totalInVaults = enrichedFunds.reduce(function (s, f) {
            return s + (f.bal || f.savedCents || 0);
        }, 0);

        var quickStats = txnCount + " transactions  ·  " + sortedCats.length +
            " categories  ·  " + bills.length + " bills  ·  " +
            enrichedFunds.length + " vaults  ·  " + wallets.length + " wallets";

        // ════════════════════════════════════════════════════════════════════
        // PAGE 1 — COVER
        // ════════════════════════════════════════════════════════════════════
        drawCover(doc, {
            baseSymbol:   sym,
            reportDate:   monthName,
            generatedAt:  dateStr + " at " + timeStr,
            personality:  personality,
            metrics: {
                totalIncome:  totals.totalIncome,
                totalSpent:   totals.totalDailySpent + totals.paidBills,
                savingsRate:  savingsRate + "%",
                netAvailable: totals.netAvailable,
            },
            quickStats: quickStats,
        });

        // ════════════════════════════════════════════════════════════════════
        // PAGE 2 — EXECUTIVE SUMMARY + SPENDING BREAKDOWN + CATEGORIES
        // ════════════════════════════════════════════════════════════════════
        doc.addPage();
        drawPageHeader(doc, 2);
        var y = MT + 6;

        // ── Executive Summary ─────────────────────────────────────────────
        y = drawSectionAnchor(doc, "Executive Summary", y);

        // Row 1: income, daily spend, paid bills  (all in INK — no accent)
        y = drawMetricRow(doc, [
            { label: "Total Income",   value: sym + fmtMoney(totals.totalIncome) },
            { label: "Daily Expenses", value: sym + fmtMoney(totals.totalDailySpent) },
            { label: "Paid Bills",     value: sym + fmtMoney(totals.paidBills) },
        ], y);

        // Row 2: unpaid (red if >0), savings rate (ink), net available (accent)
        y = drawMetricRow(doc, [
            { label: "Unpaid Bills",  value: sym + fmtMoney(totals.unpaidBills),
              positive: totals.unpaidBills > 0 ? false : undefined },
            { label: "Savings Rate",  value: savingsRate + "%" },
            { label: "Net Available", value: sym + fmtMoney(totals.netAvailable),
              positive: totals.netAvailable >= 0 },
        ], y);

        y += 8;

        // ── Spending Breakdown ─────────────────────────────────────────────
        if (needsSpace(doc, y, 56)) { doc.addPage(); drawPageHeader(doc, 2); y = MT + 6; }
        y = drawSectionAnchor(doc, "Spending Breakdown", y);
        y = drawHorizontalBarChart(doc,
            ["Daily Expenses", "Paid Bills", "Unpaid Bills"],
            [
                (totals.totalDailySpent || 0) / 100,
                (totals.paidBills       || 0) / 100,
                (totals.unpaidBills     || 0) / 100,
            ],
            y
        );
        y += 8;

        // ── Top Spending Categories ────────────────────────────────────────
        // (data was computed in original but never displayed — now rendered)
        if (sortedCats.length > 0) {
            if (needsSpace(doc, y, 40)) { doc.addPage(); drawPageHeader(doc, 2); y = MT + 6; }
            y = drawSectionAnchor(doc, "Top Spending Categories", y);
            y = drawHorizontalBarChart(doc,
                sortedCats.map(function (c) { return c[0]; }),
                sortedCats.map(function (c) { return c[1] / 100; }),
                y
            );
        }

        // ════════════════════════════════════════════════════════════════════
        // PAGE 3 — HIGHLIGHTS + WALLETS + BILLS + SAVINGS VAULTS
        // ════════════════════════════════════════════════════════════════════
        doc.addPage();
        drawPageHeader(doc, 3);
        y = MT + 6;

        // ── Highlights ────────────────────────────────────────────────────
        y = drawSectionAnchor(doc, "Highlights", y);

        var highlightRows = [];
        if (biggest.amountCents > 0) {
            highlightRows.push([
                "Biggest Expense",
                biggest.name + (biggest.category ? "  (" + biggest.category + ")" : ""),
                sym + fmtMoney(biggest.amountCents)
            ]);
        }
        // Note: original had "Peak Spending Day" AND "Peak Day Total" as two
        // separate rows referencing the same data — merged into one row here.
        highlightRows.push(["Peak Spending Day", getDayName(peakDayIdx),
            sym + fmtMoney(peakDayTotal)]);
        highlightRows.push(["Total Transactions", String(txnCount), "—"]);
        highlightRows.push(["Total in Vaults",    "Savings",
            sym + fmtMoney(totalInVaults)]);

        var hlFinalY = makeTable(doc, y,
            ["Metric", "Detail", "Amount"],
            highlightRows,
            null,
            {
                columnStyles: {
                    0: { fontStyle: "bold",  cellWidth: contentW * 0.32 },
                    2: { halign: "right", fontStyle: "bold", cellWidth: contentW * 0.28 },
                }
            }
        );
        y = hlFinalY + 12;

        // ── Wallets & Multi-Currency Breakdown ────────────────────────────
        if (wallets.length > 0) {
            if (needsSpace(doc, y, 50)) { doc.addPage(); drawPageHeader(doc, 3); y = MT + 6; }
            y = drawSectionAnchor(doc, "Wallets & Multi-Currency Breakdown", y);

            var walletRows      = [];
            var combinedBaseTotal = 0;

            wallets.forEach(function (w) {
                var bal         = (w.balanceCents || 0) / 100;
                var currency    = w.currency || "PHP";
                var nativeSymbol = w.currencySymbol || (currency + " ");
                var fxRate      = w.fxRateToBase || 1.0;
                var nativeStr   = nativeSymbol + bal.toLocaleString("en-PH", {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                });
                var fxStr    = currency !== "PHP"
                    ? "1 " + currency + " = " + fxRate.toFixed(2) + " PHP"
                    : "—";
                var baseVal  = bal * fxRate;
                combinedBaseTotal += baseVal;
                var baseStr  = sym + baseVal.toLocaleString("en-PH", {
                    minimumFractionDigits: 2, maximumFractionDigits: 2
                });
                walletRows.push([w.name || "", w.type || "—", nativeStr, fxStr, baseStr]);
            });

            // Totals row — styled via didParseCell, accent on the final value
            var combinedStr = sym + combinedBaseTotal.toLocaleString("en-PH", {
                minimumFractionDigits: 2, maximumFractionDigits: 2
            });
            walletRows.push(["TOTAL (Combined)", "", "", "", combinedStr]);

            var walColW = [
                contentW * 0.20, contentW * 0.13,
                contentW * 0.22, contentW * 0.22, contentW * 0.23
            ];
            var walFinalY = makeTable(doc, y,
                ["Wallet", "Type", "Balance", "FX Rate", "Base (PHP)"],
                walletRows,
                walColW,
                {
                    columnStyles: {
                        2: { halign: "right" },
                        3: { halign: "right" },
                        4: { halign: "right", fontStyle: "bold" },
                    },
                    didParseCell: function (data) {
                        // Totals row: SURFACE tint, bold, accent on the PHP total
                        if (data.section === "body" &&
                            data.row.index === walletRows.length - 1) {
                            data.cell.styles.fontStyle  = "bold";
                            data.cell.styles.fillColor  = SURFACE;
                            data.cell.styles.textColor  = INK;
                            if (data.column.index === 4) {
                                data.cell.styles.textColor =
                                    combinedBaseTotal >= 0 ? ACCENT_P : ACCENT_N;
                            }
                        }
                    }
                }
            );
            y = walFinalY + 10;

            // FX reference note — inline italic text, no box
            var fxNotes = [];
            wallets.forEach(function (w) {
                var currency = w.currency || "PHP";
                if (currency !== "PHP") {
                    fxNotes.push("1 " + currency + " = " +
                        (w.fxRateToBase || 1).toFixed(2) + " PHP");
                }
            });
            if (fxNotes.length > 0 && !needsSpace(doc, y, 10)) {
                doc.setFont("helvetica", "italic");
                doc.setFontSize(7.5);
                doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
                doc.text(
                    "Rates: " + fxNotes.join(", ") + ". Exchange rates are user-defined.",
                    ML, y + 5, { maxWidth: contentW }
                );
                y += 12;
            }
        }

        // ── Bills ─────────────────────────────────────────────────────────
        if (bills.length > 0) {
            if (needsSpace(doc, y, 50)) { doc.addPage(); drawPageHeader(doc, 3); y = MT + 6; }
            y = drawSectionAnchor(doc, "Bills", y);

            var billRows = bills.map(function (b) {
                return [
                    b.name || "", b.dueDate || "",
                    b.isPaid ? "Paid" : "Unpaid",
                    b.recurring || "—",
                    sym + fmtMoney(b.amountCents)
                ];
            });
            var paidTotal     = bills.reduce(function (s, b) {
                return s + (b.isPaid ? b.amountCents : 0);
            }, 0);
            var totalBillsVal = bills.reduce(function (s, b) {
                return s + (b.amountCents || 0);
            }, 0);
            billRows.push(["", "", "", "Paid Total",  sym + fmtMoney(paidTotal)]);
            billRows.push(["", "", "", "Grand Total", sym + fmtMoney(totalBillsVal)]);

            makeTable(doc, y,
                ["Bill", "Due Date", "Status", "Recurring", "Amount"],
                billRows,
                null,
                {
                    columnStyles: { 4: { halign: "right", fontStyle: "bold" } },
                    didParseCell: function (data) {
                        if (data.section === "body") {
                            // Status cell: accent color only
                            if (data.column.index === 2 && data.row.index < bills.length) {
                                data.cell.styles.textColor =
                                    data.cell.raw === "Paid" ? ACCENT_P : ACCENT_N;
                                data.cell.styles.fontStyle = "bold";
                            }
                            // Summary rows: SURFACE tint, bold
                            if (data.row.index >= bills.length) {
                                data.cell.styles.fontStyle = "bold";
                                data.cell.styles.fillColor = SURFACE;
                                data.cell.styles.textColor = INK;
                            }
                        }
                    }
                }
            );
        }

        // ── Savings Vaults ─────────────────────────────────────────────────
        if (enrichedFunds.length > 0) {
            var vaultY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : y;
            if (needsSpace(doc, vaultY, 50)) {
                doc.addPage(); drawPageHeader(doc, 3); vaultY = MT + 6;
            }
            vaultY = drawSectionAnchor(doc, "Savings Vaults", vaultY);

            var vaultRows = enrichedFunds.map(function (f) {
                var saved  = f.bal || f.savedCents || 0;
                var goal   = f.goalCents || 0;
                var pct    = goal > 0 ? Math.round((saved / goal) * 100) : 0;
                var status = pct >= 100 ? "Complete" : (pct >= 50 ? "On Track" : "Starting");
                return [
                    f.name || "",
                    sym + fmtMoney(goal),
                    sym + fmtMoney(saved),
                    pct + "%",
                    status
                ];
            });

            makeTable(doc, vaultY,
                ["Vault", "Target", "Saved", "Progress", "Status"],
                vaultRows,
                null,
                {
                    columnStyles: {
                        1: { halign: "right" },
                        2: { halign: "right", fontStyle: "bold" },
                        3: { halign: "right" },
                    },
                    didParseCell: function (data) {
                        if (data.section === "body" && data.column.index === 4) {
                            if (data.cell.raw === "Complete") {
                                data.cell.styles.textColor = ACCENT_P;
                                data.cell.styles.fontStyle = "bold";
                            } else if (data.cell.raw === "On Track") {
                                data.cell.styles.textColor = SECONDARY;
                                data.cell.styles.fontStyle = "bold";
                            } else {
                                data.cell.styles.textColor = MUTED;
                                data.cell.styles.fontStyle = "normal";
                            }
                        }
                    }
                }
            );
        }

        // ── Save ──────────────────────────────────────────────────────────
        var filename = "SINKPESO_Report_" + now.toISOString().slice(0, 10) + ".pdf";
        doc.save(filename);
    }

    // ── Expose ──────────────────────────────────────────────────────────────
    window.generateFullReport = generateFullReport;

})();
