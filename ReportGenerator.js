// ReportGenerator.js — Comprehensive PDF Report for SINKPESO
//
// Generates a multi-section PDF using jsPDF + AutoTable.
// Single "Export All" button covers: dashboard summary, categories,
// expenses, bills & income, savings vaults, budget limits, wallets,
// transactions, debt tracker, and month history.
//
// Dependencies: jsPDF (window.jspdf), AutoTable plugin

(function () {
    "use strict";

    // ── Color palette ──────────────────────────────────────────────────────
    var GREEN  = [0, 230, 118];      // #00E676
    var RED    = [239, 68, 68];      // #EF4444
    var PURPLE = [168, 85, 247];     // #A855F7
    var YELLOW = [245, 158, 11];     // #F59E0B
    var BLUE   = [59, 130, 246];     // #3B82F6
    var WHITE  = [255, 255, 255];
    var DARK   = [15, 23, 42];       // #0F172A
    var GRAY   = [100, 116, 139];    // #64748B
    var LIGHT_GRAY = [226, 232, 240];

    // ── Helpers ────────────────────────────────────────────────────────────
    function getPersonality(savingsRate) {
        if (savingsRate >= 30) return { label: "The Saver", color: GREEN };
        if (savingsRate >= 15) return { label: "The Balancer", color: BLUE };
        if (savingsRate >= 0) return { label: "The Spender", color: YELLOW };
        return { label: "The Overdraft", color: RED };
    }

    function getDayName(dayIndex) {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || "";
    }

    function fmtCents(doc, cents) {
        var val = (Number(cents) || 0) / 100;
        return "P" + val.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function fmtNum(cents) {
        return (Number(cents) || 0) / 100;
    }

    function addPageNumber(doc) {
        var pages = doc.internal.getNumberOfPages();
        for (var i = 1; i <= pages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.text("Page " + i + " of " + pages, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
            doc.text("SINKPESO - Private - Offline - Yours", doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 5, { align: "center" });
        }
    }

    // ── Section header helper ──────────────────────────────────────────────
    function addSectionTitle(doc, title, yPos) {
        if (yPos > 260) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.roundedRect(14, yPos - 5, doc.internal.pageSize.getWidth() - 28, 10, 2, 2, "F");
        doc.setFontSize(13);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFont("helvetica", "bold");
        doc.text(title, 20, yPos + 2);
        return yPos + 16;
    }

    // ── MAIN EXPORT FUNCTION ───────────────────────────────────────────────
    function generateFullReport(data) {
        if (!window.jspdf) {
            console.error("[ReportGenerator] jsPDF not loaded");
            return;
        }
        var jsPDF = window.jspdf.jsPDF;
        var doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        var pageW = doc.internal.pageSize.getWidth();
        var pageH = doc.internal.pageSize.getHeight();
        var marginL = 14;
        var marginR = 14;
        var contentW = pageW - marginL - marginR;

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

        var now = new Date();
        var monthName = now.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
        var dateStr = now.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
        var timeStr = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

        // ── PAGE 1: COVER ──────────────────────────────────────────────────
        doc.setFillColor(DARK[0], DARK[1], DARK[2]);
        doc.rect(0, 0, pageW, pageH, "F");

        // Green accent bar
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.rect(0, pageH * 0.35, pageW, 4, "F");

        // Logo text
        doc.setFontSize(42);
        doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setFont("helvetica", "bold");
        doc.text("SINKPESO", pageW / 2, pageH * 0.28, { align: "center" });

        // Subtitle
        doc.setFontSize(16);
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont("helvetica", "normal");
        doc.text("Full Financial Report", pageW / 2, pageH * 0.28 + 16, { align: "center" });

        // Month
        doc.setFontSize(24);
        doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setFont("helvetica", "bold");
        doc.text(monthName, pageW / 2, pageH * 0.42, { align: "center" });

        // Date generated
        doc.setFontSize(11);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        doc.text("Generated on " + dateStr + " at " + timeStr, pageW / 2, pageH * 0.42 + 12, { align: "center" });

        // Spending personality
        var savingsRate = totals.totalIncome > 0
            ? Math.round(((totals.totalIncome - (totals.totalDailySpent + totals.paidBills)) / totals.totalIncome) * 100)
            : 0;
        var personality = getPersonality(savingsRate);
        doc.setFontSize(13);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text("Spending Personality", pageW / 2, pageH * 0.55, { align: "center" });
        doc.setFontSize(22);
        doc.setTextColor(personality.color[0], personality.color[1], personality.color[2]);
        doc.setFont("helvetica", "bold");
        doc.text(personality.label, pageW / 2, pageH * 0.55 + 12, { align: "center" });

        // Key stats on cover
        var coverStats = [
            { label: "Total Income", value: fc(totals.totalIncome), color: GREEN },
            { label: "Total Spent", value: fc(totals.totalDailySpent + totals.paidBills), color: RED },
            { label: "Savings Rate", value: savingsRate + "%", color: savingsRate >= 15 ? GREEN : YELLOW },
            { label: "Net Available", value: fc(totals.netAvailable), color: totals.netAvailable >= 0 ? GREEN : RED },
        ];
        var statY = pageH * 0.66;
        var statW = (contentW - 12) / 4;
        coverStats.forEach(function (s, i) {
            var x = marginL + i * (statW + 4);
            doc.setFillColor(30, 41, 59);
            doc.roundedRect(x, statY, statW, 28, 3, 3, "F");
            doc.setFontSize(8);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.setFont("helvetica", "normal");
            doc.text(s.label, x + statW / 2, statY + 10, { align: "center" });
            doc.setFontSize(13);
            doc.setTextColor(s.color[0], s.color[1], s.color[2]);
            doc.setFont("helvetica", "bold");
            doc.text(s.value, x + statW / 2, statY + 22, { align: "center" });
        });

        // Footer on cover
        doc.setFontSize(9);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.setFont("helvetica", "normal");
        doc.text("Private. Offline. Yours.", pageW / 2, pageH - 20, { align: "center" });
        doc.text("by Lodoy Goes Random", pageW / 2, pageH - 14, { align: "center" });


        // ── PAGE 2+: CONTENT ───────────────────────────────────────────────
        doc.addPage();
        var y = 20;

        // ── 1. TOP SPENDING CATEGORIES ─────────────────────────────────────
        var catSpend = {};
        dailyExpenses.forEach(function (d) {
            catSpend[d.category] = (catSpend[d.category] || 0) + (d.amountCents || 0);
        });
        var sortedCats = Object.entries(catSpend).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
        if (sortedCats.length > 0) {
            y = addSectionTitle(doc, "Top Spending Categories", y);
            var catTable = sortedCats.map(function (entry, i) {
                var pct = sortedCats[0][1] > 0 ? Math.round((entry[1] / sortedCats[0][1]) * 100) : 0;
                return [String(i + 1), entry[0], fc(entry[1]), pct + "%"];
            });
            doc.autoTable({
                startY: y,
                head: [["#", "Category", "Amount", "% of Top"]],
                body: catTable,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 10, cellPadding: 4, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 2. BIGGEST EXPENSE + PEAK DAY ──────────────────────────────────
        var biggest = dailyExpenses.reduce(function (max, d) {
            return (d.amountCents || 0) > (max.amountCents || 0) ? d : max;
        }, { amountCents: 0, name: "None", category: "", date: "" });

        var dayTotals = [0, 0, 0, 0, 0, 0, 0];
        dailyExpenses.forEach(function (d) {
            var dow = new Date(d.date + "T12:00:00").getDay();
            dayTotals[dow] += (d.amountCents || 0);
        });
        var peakDayIdx = dayTotals.indexOf(Math.max.apply(null, dayTotals));
        var peakDayTotal = dayTotals[peakDayIdx];

        var txnCount = dailyExpenses.length;
        var enrichedFunds = totals.enrichedFunds || funds;
        var totalInVaults = enrichedFunds.reduce(function (s, f) { return s + (f.bal || f.savedCents || 0); }, 0);

        if (biggest.amountCents > 0 || peakDayTotal > 0) {
            y = addSectionTitle(doc, "Highlights", y);
            var highlightRows = [];
            if (biggest.amountCents > 0) {
                highlightRows.push(["Biggest Expense", biggest.name + " (" + biggest.category + ")", fc(biggest.amountCents)]);
            }
            highlightRows.push(["Peak Spending Day", getDayName(peakDayIdx) + "s", fc(peakDayTotal)]);
            highlightRows.push(["Total Transactions", String(txnCount), ""]);
            highlightRows.push(["Total in Vaults", "", fc(totalInVaults)]);
            highlightRows.push(["Net Available", "", fc(totals.netAvailable)]);

            doc.autoTable({
                startY: y,
                head: [["Metric", "Detail", "Amount"]],
                body: highlightRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 10, cellPadding: 4, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 2: { halign: "right" } },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 3. DAILY EXPENSES ──────────────────────────────────────────────
        if (dailyExpenses.length > 0) {
            y = addSectionTitle(doc, "Daily Expenses", y);
            var expRows = dailyExpenses
                .slice()
                .sort(function (a, b) { return (a.date || "").localeCompare(b.date || ""); })
                .map(function (d) {
                    var wallet = wallets.find(function (w) { return w.id === d.walletId; });
                    return [d.date || "", d.name || "", d.category || "", wallet ? wallet.name : "", fc(d.amountCents)];
                });
            doc.autoTable({
                startY: y,
                head: [["Date", "Name", "Category", "Wallet", "Amount"]],
                body: expRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 4: { halign: "right" } },
                didDrawPage: function (data) {
                    // Re-draw section header on new pages
                    if (data.pageNumber > 1) {
                        // AutoTable handles headers via head option
                    }
                },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 4. BILLS ───────────────────────────────────────────────────────
        if (bills.length > 0) {
            y = addSectionTitle(doc, "Bills", y);
            var billRows = bills.map(function (b) {
                return [
                    b.name || "",
                    b.dueDate || "",
                    b.isPaid ? "Paid" : "Unpaid",
                    b.recurring || "-",
                    fc(b.amountCents)
                ];
            });
            doc.autoTable({
                startY: y,
                head: [["Bill", "Due Date", "Status", "Recurring", "Amount"]],
                body: billRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 4: { halign: "right" } },
                didParseCell: function (data) {
                    if (data.section === "body" && data.column.index === 2) {
                        if (data.cell.raw === "Paid") {
                            data.cell.styles.textColor = GREEN;
                        } else if (data.cell.raw === "Unpaid") {
                            data.cell.styles.textColor = RED;
                        }
                    }
                },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 5. INCOME ──────────────────────────────────────────────────────
        if (incomes.length > 0) {
            y = addSectionTitle(doc, "Income Entries", y);
            var incRows = incomes.map(function (inc) {
                return [inc.date || "", inc.name || "", inc.source || "-", fc(inc.amountCents)];
            });
            doc.autoTable({
                startY: y,
                head: [["Date", "Name", "Source", "Amount"]],
                body: incRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 3: { halign: "right" } },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 6. SAVINGS VAULTS ──────────────────────────────────────────────
        if (enrichedFunds.length > 0) {
            y = addSectionTitle(doc, "Savings Vaults", y);
            var vaultRows = enrichedFunds.map(function (f) {
                var saved = f.bal || f.savedCents || 0;
                var goal = f.goalCents || 0;
                var pct = goal > 0 ? Math.round((saved / goal) * 100) : 0;
                return [f.name || "", fc(goal), fc(saved), pct + "%"];
            });
            doc.autoTable({
                startY: y,
                head: [["Vault", "Target", "Saved", "Progress"]],
                body: vaultRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 7. BUDGET LIMITS ───────────────────────────────────────────────
        if (budgets.length > 0) {
            y = addSectionTitle(doc, "Budget Limits", y);
            var budRows = budgets.map(function (b) {
                var spent = (totals.catSum || {})[b.category] || 0;
                var limit = b.limitCents || 0;
                var pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                var status = limit === 0 ? "-" : (pct >= 100 ? "OVER" : (pct >= 80 ? "Warning" : "OK"));
                return [b.category || "", fc(limit), fc(spent), pct + "%", status];
            });
            doc.autoTable({
                startY: y,
                head: [["Category", "Limit", "Spent", "Used", "Status"]],
                body: budRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
                didParseCell: function (data) {
                    if (data.section === "body" && data.column.index === 4) {
                        if (data.cell.raw === "OVER") data.cell.styles.textColor = RED;
                        else if (data.cell.raw === "Warning") data.cell.styles.textColor = YELLOW;
                        else if (data.cell.raw === "OK") data.cell.styles.textColor = GREEN;
                    }
                },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 8. WALLETS ─────────────────────────────────────────────────────
        if (wallets.length > 0) {
            y = addSectionTitle(doc, "Wallets", y);
            var walRows = wallets.map(function (w) {
                return [w.name || "", w.type || "-", fc(w.balanceCents)];
            });
            doc.autoTable({
                startY: y,
                head: [["Wallet", "Type", "Balance"]],
                body: walRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 2: { halign: "right" } },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 9. DEBT TRACKER ────────────────────────────────────────────────
        if (debts.length > 0) {
            y = addSectionTitle(doc, "Debt Tracker", y);
            var debtRows = debts.map(function (d) {
                return [d.name || "", d.type || "-", d.person || "-", fc(d.amountCents), d.dueDate || "-", d.status || "-"];
            });
            doc.autoTable({
                startY: y,
                head: [["Name", "Type", "Person", "Amount", "Due Date", "Status"]],
                body: debtRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 3: { halign: "right" } },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 10. TRANSACTION LOG ────────────────────────────────────────────
        if (txns.length > 0) {
            y = addSectionTitle(doc, "Transaction Log (Vaults & Bills)", y);
            var txnRows = txns.map(function (t) {
                var fund = funds.find(function (f) { return f.id === t.fundId; });
                var bill = bills.find(function (b) { return b.id === t.billId; });
                var desc = t.type === "bill_payment"
                    ? (bill ? bill.name : "Bill Payment")
                    : (t.type === "deposit" ? "Deposit -> " : "Withdraw <- ") + (fund ? fund.name : "Vault");
                return [t.date || "", t.type || "", desc, fc(t.amountCents)];
            });
            doc.autoTable({
                startY: y,
                head: [["Date", "Type", "Description", "Amount"]],
                body: txnRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 3: { halign: "right" } },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── 11. MONTH HISTORY ──────────────────────────────────────────────
        if (archives.length > 0) {
            y = addSectionTitle(doc, "Month History (Archived)", y);
            var archRows = archives.map(function (a) {
                return [
                    a.month || "",
                    a.closedAt ? a.closedAt.slice(0, 10) : "",
                    fc(a.totalIncome),
                    fc(a.totalSpent + a.totalBills),
                    fc(a.remaining)
                ];
            });
            doc.autoTable({
                startY: y,
                head: [["Month", "Archived", "Income", "Spent", "Remaining"]],
                body: archRows,
                margin: { left: marginL, right: marginR },
                styles: { fontSize: 9, cellPadding: 3, textColor: DARK },
                headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: "bold" },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
            });
            y = doc.lastAutoTable.finalY + 12;
        }

        // ── Add page numbers to all pages ──────────────────────────────────
        addPageNumber(doc);

        // ── Save the PDF ───────────────────────────────────────────────────
        var filename = "SINKPESO_Full_Report_" + now.toISOString().slice(0, 10) + ".pdf";
        doc.save(filename);
    }

    // ── Expose globally ────────────────────────────────────────────────────
    window.generateFullReport = generateFullReport;

})();