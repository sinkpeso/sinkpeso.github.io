// ReportGenerator.js — Comprehensive PDF Report for SINKPESO
//
// Generates a polished multi-section PDF using jsPDF + AutoTable.
// Professional layout with executive summary, category bars,
// and clean tabular data throughout.
//
// Dependencies: jsPDF (window.jspdf), AutoTable plugin

(function () {
    "use strict";

    // ── Color palette ──────────────────────────────────────────────────────
    var GREEN       = [0, 230, 118];      // #00E676
    var RED         = [239, 68, 68];      // #EF4444
    var PURPLE      = [168, 85, 247];     // #A855F7
    var YELLOW      = [245, 158, 11];     // #F59E0B
    var BLUE        = [59, 130, 246];     // #3B82F6
    var WHITE       = [255, 255, 255];
    var DARK        = [15, 23, 42];       // #0F172A
    var SLATE       = [30, 41, 59];       // #1E293B
    var GRAY        = [100, 116, 139];    // #64748B
    var LIGHT_GRAY  = [241, 245, 249];    // #F1F5F9
    var BORDER_GRAY = [226, 232, 240];    // #E2E8F0
    var BODY_TEXT    = [51, 65, 85];      // #334155

    // ── Layout constants ───────────────────────────────────────────────────
    var ML = 20;   // margin left
    var MR = 20;   // margin right
    var MT = 25;   // margin top
    var MB = 18;   // margin bottom

    // ── Helpers ────────────────────────────────────────────────────────────
    function getPersonality(savingsRate) {
        if (savingsRate >= 30) return { label: "The Saver", color: GREEN, desc: "You keep more than you spend. Solid discipline." };
        if (savingsRate >= 15) return { label: "The Balancer", color: BLUE, desc: "You manage spending and saving in healthy balance." };
        if (savingsRate >= 0) return { label: "The Spender", color: YELLOW, desc: "Most of your income goes to expenses. Consider tightening up." };
        return { label: "The Overdraft", color: RED, desc: "You spent more than you earned. Time to review." };
    }

    function getDayName(idx) {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][idx] || "";
    }

    function getRemainingHeight(doc) {
        return doc.internal.pageSize.getHeight() - MB;
    }

    function needsNewPage(doc, y, spaceNeeded) {
        return (y + spaceNeeded) > getRemainingHeight(doc);
    }

    function addPageNumber(doc) {
        var pages = doc.internal.getNumberOfPages();
        var pw = doc.internal.pageSize.getWidth();
        var ph = doc.internal.pageSize.getHeight();
        for (var i = 1; i <= pages; i++) {
            doc.setPage(i);
            // Top: SINKPESO brand (pages 2+)
            if (i > 1) {
                doc.setFontSize(7);
                doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
                doc.setFont("helvetica", "normal");
                doc.text("SINKPESO  |  Financial Report", ML, 10);
                doc.setTextColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]);
                doc.line(ML, 12, pw - MR, 12);
            }
            // Bottom
            doc.setFontSize(7);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.setFont("helvetica", "normal");
            doc.text("Page " + i + " of " + pages, pw / 2, ph - 10, { align: "center" });
            doc.setTextColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]);
            doc.line(ML, ph - 14, pw - MR, ph - 14);
            doc.setFontSize(6);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.text("Private  ·  Offline  ·  Yours  ·  by Lodoy Goes Random", pw / 2, ph - 7, { align: "center" });
        }
    }

    // ── Section title with left accent bar ──────────────────────────────────
    function addSectionTitle(doc, title, y) {
        var pw = doc.internal.pageSize.getWidth();
        if (needsNewPage(doc, y, 24)) {
            doc.addPage();
            y = MT;
        }
        // Green left accent bar
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.rect(ML, y - 4, 3, 14, "F");
        // Title text
        doc.setFontSize(14);
        doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
        doc.setFont("helvetica", "bold");
        doc.text(title, ML + 10, y + 6);
        // Divider line
        y += 14;
        doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]);
        doc.setLineWidth(0.4);
        doc.line(ML, y, pw - MR, y);
        return y + 8;
    }

    // ── Summary card helper ─────────────────────────────────────────────────
    function drawSummaryCard(doc, x, y, w, h, label, value, color) {
        // Card background
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
        // Top color accent
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(x, y, w, 2, "F");
        // Label
        doc.setFontSize(7);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "bold");
        doc.text(label.toUpperCase(), x + w / 2, y + 10, { align: "center" });
        // Value
        doc.setFontSize(14);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(value, x + w / 2, y + 22, { align: "center" });
    }

    // ── Category bar chart (horizontal) ─────────────────────────────────────
    function drawCategoryBars(doc, sortedCats, fc, y) {
        var pw = doc.internal.pageSize.getWidth();
        var barAreaW = pw - ML - MR;
        var labelW = 38;
        var amountW = 32;
        var barW = barAreaW - labelW - amountW - 8;
        var barH = 9;
        var rowH = 16;
        var maxVal = sortedCats.length > 0 ? sortedCats[0][1] : 1;
        var barColors = [GREEN, BLUE, PURPLE, YELLOW, RED];

        sortedCats.forEach(function (entry, i) {
            var cy = y + i * rowH;
            var color = barColors[i % barColors.length];
            var pct = maxVal > 0 ? (entry[1] / maxVal) : 0;

            // Rank + Category label
            doc.setFontSize(9);
            doc.setTextColor(BODY_TEXT[0], BODY_TEXT[1], BODY_TEXT[2]);
            doc.setFont("helvetica", "bold");
            doc.text((i + 1) + ". " + entry[0], ML, cy + 6);

            // Bar track
            var barX = ML + labelW;
            doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
            doc.roundedRect(barX, cy, barW, barH, 2, 2, "F");

            // Bar fill
            var fillW = Math.max(4, barW * pct);
            doc.setFillColor(color[0], color[1], color[2]);
            doc.roundedRect(barX, cy, fillW, barH, 2, 2, "F");

            // Amount
            doc.setFontSize(9);
            doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
            doc.setFont("helvetica", "bold");
            doc.text(fc(entry[1]), barX + barW + 6, cy + 6.5);
        });

        return y + sortedCats.length * rowH;
    }

    // ── Standard AutoTable styles ───────────────────────────────────────────
    function tableStyles() {
        return {
            startY: 0, // set per call
            margin: { left: ML, right: MR, top: MT, bottom: MB },
            styles: {
                fontSize: 9,
                cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
                textColor: BODY_TEXT,
                lineColor: BORDER_GRAY,
                lineWidth: 0.3,
                font: "helvetica",
                overflow: "linebreak",
            },
            headStyles: {
                fillColor: SLATE,
                textColor: WHITE,
                fontStyle: "bold",
                fontSize: 8.5,
                cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            tableLineColor: BORDER_GRAY,
            tableLineWidth: 0.3,
        };
    }

    // ── MAIN EXPORT FUNCTION ───────────────────────────────────────────────
    function generateFullReport(data) {
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

        var fc = data.fc;
        var totals = data.totals;
        var dailyExpenses = data.dailyExpenses || [];
        var incomes = data.incomes || [];
        var bills = data.bills || [];
        var funds = data.funds || [];
        var txns = data.txns || [];
        var wallets = data.wallets || [];
        var debts = data.debts || [];
        var archives = data.archives || [];
        var budgets = data.budgets || [];
        var enrichedFunds = totals.enrichedFunds || funds;

        var now = new Date();
        var monthName = now.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
        var dateStr = now.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
        var timeStr = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

        // Pre-compute stats
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

        // ════════════════════════════════════════════════════════════════════
        // PAGE 1: COVER
        // ════════════════════════════════════════════════════════════════════
        doc.setFillColor(DARK[0], DARK[1], DARK[2]);
        doc.rect(0, 0, pw, ph, "F");

        // Thin green accent line
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.rect(ML, ph * 0.22, contentW, 2, "F");

        // SINKPESO title
        doc.setFontSize(48);
        doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setFont("helvetica", "bold");
        doc.text("SINKPESO", pw / 2, ph * 0.18, { align: "center" });

        // Subtitle
        doc.setFontSize(14);
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont("helvetica", "normal");
        doc.text("Financial Report", pw / 2, ph * 0.18 + 14, { align: "center" });

        // Month — large
        doc.setFontSize(28);
        doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setFont("helvetica", "bold");
        doc.text(monthName, pw / 2, ph * 0.30, { align: "center" });

        // Date & time
        doc.setFontSize(10);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        doc.text("Generated on " + dateStr + " at " + timeStr, pw / 2, ph * 0.30 + 12, { align: "center" });

        // Spending personality
        doc.setFontSize(9);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        doc.text("SPENDING PERSONALITY", pw / 2, ph * 0.40, { align: "center" });
        doc.setFontSize(20);
        doc.setTextColor(personality.color[0], personality.color[1], personality.color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(personality.label, pw / 2, ph * 0.40 + 12, { align: "center" });
        doc.setFontSize(9);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        doc.text(personality.desc, pw / 2, ph * 0.40 + 22, { align: "center" });

        // 4 key stats on cover
        var cardW = (contentW - 18) / 4;
        var cardH = 30;
        var cardY = ph * 0.54;
        var coverStats = [
            { label: "Total Income", value: fc(totals.totalIncome), color: GREEN },
            { label: "Total Spent", value: fc(totals.totalDailySpent + totals.paidBills), color: RED },
            { label: "Savings Rate", value: savingsRate + "%", color: savingsRate >= 15 ? GREEN : YELLOW },
            { label: "Net Available", value: fc(totals.netAvailable), color: totals.netAvailable >= 0 ? GREEN : RED },
        ];
        coverStats.forEach(function (s, i) {
            var x = ML + i * (cardW + 6);
            // Card bg
            doc.setFillColor(SLATE[0], SLATE[1], SLATE[2]);
            doc.roundedRect(x, cardY, cardW, cardH, 3, 3, "F");
            // Top accent
            doc.setFillColor(s.color[0], s.color[1], s.color[2]);
            doc.rect(x, cardY, cardW, 2, "F");
            // Label
            doc.setFontSize(7);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.setFont("helvetica", "bold");
            doc.text(s.label.toUpperCase(), x + cardW / 2, cardY + 11, { align: "center" });
            // Value
            doc.setFontSize(12);
            doc.setTextColor(s.color[0], s.color[1], s.color[2]);
            doc.setFont("helvetica", "bold");
            doc.text(s.value, x + cardW / 2, cardY + 23, { align: "center" });
        });

        // Quick stats row under cards
        var quickY = cardY + cardH + 14;
        doc.setFontSize(9);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        var quickStats = [
            txnCount + " transactions",
            sortedCats.length + " categories",
            bills.length + " bills",
            enrichedFunds.length + " vaults",
            wallets.length + " wallets"
        ];
        doc.text(quickStats.join("   ·   "), pw / 2, quickY, { align: "center" });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text("Private  ·  Offline  ·  Yours", pw / 2, ph - 20, { align: "center" });
        doc.text("by Lodoy Goes Random", pw / 2, ph - 14, { align: "center" });

        // ════════════════════════════════════════════════════════════════════
        // PAGE 2: EXECUTIVE SUMMARY
        // ════════════════════════════════════════════════════════════════════
        doc.addPage();
        var y = MT + 6;

        y = addSectionTitle(doc, "Executive Summary", y);

        // 2-column grid of summary cards
        var sumCardW = (contentW - 8) / 2;
        var sumCardH = 26;
        var sumCards = [
            { label: "Total Income", value: fc(totals.totalIncome), color: GREEN },
            { label: "Daily Expenses", value: fc(totals.totalDailySpent), color: RED },
            { label: "Paid Bills", value: fc(totals.paidBills), color: PURPLE },
            { label: "Unpaid Bills", value: fc(totals.unpaidBills), color: totals.unpaidBills > 0 ? YELLOW : GRAY },
            { label: "In Savings Vaults", value: fc(totalInVaults), color: BLUE },
            { label: "Net Available", value: fc(totals.netAvailable), color: totals.netAvailable >= 0 ? GREEN : RED },
            { label: "Savings Rate", value: savingsRate + "%", color: savingsRate >= 15 ? GREEN : (savingsRate >= 0 ? YELLOW : RED) },
            { label: "Biggest Expense", value: biggest.amountCents > 0 ? biggest.name + " — " + fc(biggest.amountCents) : "—", color: biggest.amountCents > 0 ? RED : GRAY },
        ];
        sumCards.forEach(function (s, i) {
            var col = i % 2;
            var row = Math.floor(i / 2);
            var x = ML + col * (sumCardW + 8);
            var cy = y + row * (sumCardH + 6);
            drawSummaryCard(doc, x, cy, sumCardW, sumCardH, s.label, s.value, s.color);
        });
        y += Math.ceil(sumCards.length / 2) * (sumCardH + 6) + 8;

        // ════════════════════════════════════════════════════════════════════
        // CATEGORY BREAKDOWN (bar chart)
        // ════════════════════════════════════════════════════════════════════
        if (sortedCats.length > 0) {
            if (needsNewPage(doc, y, sortedCats.length * 16 + 30)) {
                doc.addPage();
                y = MT + 6;
            }
            y = addSectionTitle(doc, "Top Spending Categories", y);
            y = drawCategoryBars(doc, sortedCats, fc, y);
            y += 8;
        }

        // ════════════════════════════════════════════════════════════════════
        // HIGHLIGHTS TABLE
        // ════════════════════════════════════════════════════════════════════
        if (needsNewPage(doc, y, 80)) { doc.addPage(); y = MT + 6; }
        y = addSectionTitle(doc, "Highlights", y);

        var highlightRows = [];
        if (biggest.amountCents > 0) {
            highlightRows.push(["Biggest Expense", biggest.name + " (" + biggest.category + ")", fc(biggest.amountCents)]);
        }
        highlightRows.push(["Peak Spending Day", getDayName(peakDayIdx) + "s", fc(peakDayTotal)]);
        highlightRows.push(["Total Transactions", String(txnCount), "—"]);
        highlightRows.push(["Peak Day Total", getDayName(peakDayIdx), fc(peakDayTotal)]);
        highlightRows.push(["Total in Vaults", "", fc(totalInVaults)]);
        highlightRows.push(["Wallet Balances", "", fc(wallets.reduce(function (s, w) { return s + (w.balanceCents || 0); }, 0))]);

        var ts = tableStyles();
        ts.startY = y;
        ts.columnStyles = { 2: { halign: "right", fontStyle: "bold" } };
        ts.head = [["Metric", "Detail", "Amount"]];
        ts.body = highlightRows;
        doc.autoTable(ts);
        y = doc.lastAutoTable.finalY + 12;

        // ════════════════════════════════════════════════════════════════════
        // DAILY EXPENSES
        // ════════════════════════════════════════════════════════════════════
        if (dailyExpenses.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Daily Expenses", y);

            var expRows = dailyExpenses
                .slice()
                .sort(function (a, b) { return (a.date || "").localeCompare(b.date || ""); })
                .map(function (d) {
                    var wallet = wallets.find(function (w) { return w.id === d.walletId; });
                    return [d.date || "", d.name || "", d.category || "", wallet ? wallet.name : "", fc(d.amountCents)];
                });

            // Total row
            var totalExp = dailyExpenses.reduce(function (s, d) { return s + (d.amountCents || 0); }, 0);
            expRows.push(["", "", "", "TOTAL", fc(totalExp)]);

            var ets = tableStyles();
            ets.startY = y;
            ets.head = [["Date", "Expense", "Category", "Wallet", "Amount"]];
            ets.columnStyles = { 4: { halign: "right", fontStyle: "bold" } };
            ets.body = expRows;
            ets.didParseCell = function (data) {
                // Bold the total row
                if (data.section === "body" && data.row.index === expRows.length - 1) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = [241, 245, 249];
                    data.cell.styles.textColor = SLATE;
                }
            };
            doc.autoTable(ets);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // BILLS
        // ════════════════════════════════════════════════════════════════════
        if (bills.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Bills", y);

            var billRows = bills.map(function (b) {
                return [b.name || "", b.dueDate || "", b.isPaid ? "Paid" : "Unpaid", b.recurring || "—", fc(b.amountCents)];
            });
            var totalBillsVal = bills.reduce(function (s, b) { return s + (b.amountCents || 0); }, 0);
            var paidTotal = bills.reduce(function (s, b) { return s + (b.isPaid ? b.amountCents : 0); }, 0);
            billRows.push(["", "", "", "PAID", fc(paidTotal)]);
            billRows.push(["", "", "", "TOTAL", fc(totalBillsVal)]);

            var bts = tableStyles();
            bts.startY = y;
            bts.head = [["Bill", "Due Date", "Status", "Recurring", "Amount"]];
            bts.columnStyles = { 4: { halign: "right", fontStyle: "bold" } };
            bts.body = billRows;
            bts.didParseCell = function (data) {
                if (data.section === "body") {
                    // Color status column
                    if (data.column.index === 2 && data.row.index < bills.length) {
                        if (data.cell.raw === "Paid") data.cell.styles.textColor = GREEN;
                        else if (data.cell.raw === "Unpaid") data.cell.styles.textColor = RED;
                        data.cell.styles.fontStyle = "bold";
                    }
                    // Bold total rows
                    if (data.row.index >= bills.length) {
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.fillColor = [241, 245, 249];
                        data.cell.styles.textColor = SLATE;
                    }
                }
            };
            doc.autoTable(bts);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // INCOME
        // ════════════════════════════════════════════════════════════════════
        if (incomes.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Income Entries", y);

            var incRows = incomes.map(function (inc) {
                return [inc.date || "", inc.name || "", inc.source || "—", fc(inc.amountCents)];
            });
            var totalInc = incomes.reduce(function (s, i) { return s + (i.amountCents || 0); }, 0);
            incRows.push(["", "", "TOTAL", fc(totalInc)]);

            var its = tableStyles();
            its.startY = y;
            its.head = [["Date", "Source", "Type", "Amount"]];
            its.columnStyles = { 3: { halign: "right", fontStyle: "bold" } };
            its.body = incRows;
            its.didParseCell = function (data) {
                if (data.section === "body" && data.row.index === incRows.length - 1) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = [241, 245, 249];
                    data.cell.styles.textColor = SLATE;
                }
            };
            doc.autoTable(its);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // SAVINGS VAULTS
        // ════════════════════════════════════════════════════════════════════
        if (enrichedFunds.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Savings Vaults", y);

            var vaultRows = enrichedFunds.map(function (f) {
                var saved = f.bal || f.savedCents || 0;
                var goal = f.goalCents || 0;
                var pct = goal > 0 ? Math.round((saved / goal) * 100) : 0;
                var status = pct >= 100 ? "Complete" : (pct >= 50 ? "On Track" : "Starting");
                return [f.name || "", fc(goal), fc(saved), pct + "%", status];
            });
            vaultRows.push(["", "TOTAL SAVED", fc(totalInVaults), "", ""]);

            var vts = tableStyles();
            vts.startY = y;
            vts.head = [["Vault", "Target", "Saved", "Progress", "Status"]];
            vts.columnStyles = { 1: { halign: "right" }, 2: { halign: "right", fontStyle: "bold" }, 3: { halign: "right" } };
            vts.body = vaultRows;
            vts.didParseCell = function (data) {
                if (data.section === "body") {
                    // Status colors
                    if (data.column.index === 4 && data.row.index < enrichedFunds.length) {
                        if (data.cell.raw === "Complete") data.cell.styles.textColor = GREEN;
                        else if (data.cell.raw === "On Track") data.cell.styles.textColor = BLUE;
                        else data.cell.styles.textColor = YELLOW;
                        data.cell.styles.fontStyle = "bold";
                    }
                    // Total row
                    if (data.row.index === vaultRows.length - 1) {
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.fillColor = [241, 245, 249];
                        data.cell.styles.textColor = SLATE;
                    }
                }
            };
            doc.autoTable(vts);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // BUDGET LIMITS
        // ════════════════════════════════════════════════════════════════════
        if (budgets.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Budget Limits", y);

            var budRows = budgets.map(function (b) {
                var spent = (totals.catSum || {})[b.category] || 0;
                var limit = b.limitCents || 0;
                var pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                var status = limit === 0 ? "—" : (pct >= 100 ? "OVER BUDGET" : (pct >= 80 ? "Warning" : "Under Budget"));
                var remaining = limit - spent;
                return [b.category || "", fc(limit), fc(spent), fc(remaining > 0 ? remaining : 0), pct + "%", status];
            });

            var buds = tableStyles();
            buds.startY = y;
            buds.head = [["Category", "Limit", "Spent", "Remaining", "Used", "Status"]];
            buds.columnStyles = { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" }, 4: { halign: "right" } };
            buds.body = budRows;
            buds.didParseCell = function (data) {
                if (data.section === "body" && data.column.index === 5) {
                    if (data.cell.raw === "OVER BUDGET") { data.cell.styles.textColor = RED; data.cell.styles.fontStyle = "bold"; }
                    else if (data.cell.raw === "Warning") { data.cell.styles.textColor = YELLOW; data.cell.styles.fontStyle = "bold"; }
                    else if (data.cell.raw === "Under Budget") { data.cell.styles.textColor = GREEN; }
                }
            };
            doc.autoTable(buds);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // WALLETS
        // ════════════════════════════════════════════════════════════════════
        if (wallets.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Wallets", y);

            var walRows = wallets.map(function (w) {
                return [w.name || "", w.type || "—", fc(w.balanceCents)];
            });
            var totalWal = wallets.reduce(function (s, w) { return s + (w.balanceCents || 0); }, 0);
            walRows.push(["", "TOTAL", fc(totalWal)]);

            var wts = tableStyles();
            wts.startY = y;
            wts.head = [["Wallet", "Type", "Balance"]];
            wts.columnStyles = { 2: { halign: "right", fontStyle: "bold" } };
            wts.body = walRows;
            wts.didParseCell = function (data) {
                if (data.section === "body" && data.row.index === walRows.length - 1) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = [241, 245, 249];
                    data.cell.styles.textColor = SLATE;
                }
            };
            doc.autoTable(wts);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // DEBT TRACKER
        // ════════════════════════════════════════════════════════════════════
        if (debts.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Debt Tracker", y);

            var debtRows = debts.map(function (d) {
                return [d.name || "", (d.type || "—").charAt(0).toUpperCase() + (d.type || "").slice(1), d.person || "—", fc(d.amountCents), d.dueDate || "—", d.status || "—"];
            });

            var dts = tableStyles();
            dts.startY = y;
            dts.head = [["Name", "Type", "Person", "Amount", "Due Date", "Status"]];
            dts.columnStyles = { 3: { halign: "right", fontStyle: "bold" } };
            dts.body = debtRows;
            dts.didParseCell = function (data) {
                if (data.section === "body" && data.column.index === 5) {
                    var val = (data.cell.raw || "").toLowerCase();
                    if (val === "paid" || val === "settled") data.cell.styles.textColor = GREEN;
                    else if (val === "overdue") data.cell.styles.textColor = RED;
                    else data.cell.styles.textColor = YELLOW;
                    data.cell.styles.fontStyle = "bold";
                }
            };
            doc.autoTable(dts);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // TRANSACTION LOG
        // ════════════════════════════════════════════════════════════════════
        if (txns.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Transaction Log — Vaults & Bills", y);

            var txnRows = txns.map(function (t) {
                var fund = funds.find(function (f) { return f.id === t.fundId; });
                var bill = bills.find(function (b) { return b.id === t.billId; });
                var desc = t.type === "bill_payment"
                    ? (bill ? bill.name : "Bill Payment")
                    : (t.type === "deposit" ? "Deposit → " : "Withdraw ← ") + (fund ? fund.name : "Vault");
                var typeLabel = t.type === "bill_payment" ? "Bill" : (t.type === "deposit" ? "Deposit" : "Withdraw");
                return [t.date || "", typeLabel, desc, fc(t.amountCents)];
            });

            var tts = tableStyles();
            tts.startY = y;
            tts.head = [["Date", "Type", "Description", "Amount"]];
            tts.columnStyles = { 3: { halign: "right", fontStyle: "bold" } };
            tts.body = txnRows;
            tts.didParseCell = function (data) {
                if (data.section === "body" && data.column.index === 1) {
                    if (data.cell.raw === "Deposit") data.cell.styles.textColor = GREEN;
                    else if (data.cell.raw === "Withdraw") data.cell.styles.textColor = YELLOW;
                    else if (data.cell.raw === "Bill") data.cell.styles.textColor = PURPLE;
                    data.cell.styles.fontStyle = "bold";
                }
            };
            doc.autoTable(tts);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // MONTH HISTORY
        // ════════════════════════════════════════════════════════════════════
        if (archives.length > 0) {
            if (needsNewPage(doc, y, 40)) { doc.addPage(); y = MT + 6; }
            y = addSectionTitle(doc, "Month History — Archived Snapshots", y);

            var archRows = archives.map(function (a) {
                return [
                    a.month || "",
                    a.closedAt ? a.closedAt.slice(0, 10) : "",
                    fc(a.totalIncome),
                    fc(a.totalSpent + a.totalBills),
                    fc(a.remaining)
                ];
            });

            var ats = tableStyles();
            ats.startY = y;
            ats.head = [["Month", "Archived On", "Income", "Total Spent", "Remaining"]];
            ats.columnStyles = { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } };
            ats.body = archRows;
            ats.didParseCell = function (data) {
                if (data.section === "body" && data.column.index === 4) {
                    // Color remaining: green if positive, red if negative
                    var raw = data.cell.raw || "";
                    data.cell.styles.fontStyle = "bold";
                }
            };
            doc.autoTable(ats);
            y = doc.lastAutoTable.finalY + 12;
        }

        // ════════════════════════════════════════════════════════════════════
        // FINAL: Page numbers + save
        // ════════════════════════════════════════════════════════════════════
        addPageNumber(doc);

        var filename = "SINKPESO_Report_" + now.toISOString().slice(0, 10) + ".pdf";
        doc.save(filename);
    }

    // ── Expose globally ────────────────────────────────────────────────────
    window.generateFullReport = generateFullReport;

})();