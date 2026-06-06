#!/usr/bin/env python3
"""
SINKPESO Financial Report Generator - ReportLab Edition
=========================================================
Run: python sinkpeso_report.py
Output: SINKPESO_Report_June2026.pdf

This is the reference implementation. The live app uses ReportGenerator.js (jsPDF).

Page 1: Dark cover + dashboard
Page 2: Light theme - executive summary, horizontal bar chart
Page 3: Light theme - highlights, wallets with multi-currency FX breakdown
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Flowable, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.graphics.charts.barcharts import VerticalBarChart, HorizontalBarChart
from reportlab.graphics import renderPDF

# DATA SOURCE
data_source = {
    "base_currency": "PHP",
    "base_symbol": "P",
    "report_date": "June 2026",
    "generated_at": "June 6, 2026 at 08:40 AM",
    "personality": "The Spender",
    "metrics": {
        "total_income": 5400.00,
        "total_spent": 4200.00,
        "savings_rate": "22%",
        "net_available": 1200.00,
        "daily_expenses": 1500.00,
        "paid_bills": 1800.00,
        "unpaid_bills": 900.00,
        "in_vaults": 500.00
    },
    "highlights": [
        ["Peak Spending Day", "Sundays", "P450.00"],
        ["Total Transactions", "24", "--"],
        ["Peak Day Total", "Sunday", "P450.00"],
        ["Total in Vaults", "Savings", "P500.00"]
    ],
    "wallets": [
        {"name": "Cash", "type": "Physical", "currency": "PHP", "symbol": "P", "balance": 300.00, "fx_rate_to_base": 1.0},
        {"name": "Travel Stash", "type": "Cash", "currency": "USD", "symbol": "$", "balance": 50.00, "fx_rate_to_base": 58.50},
        {"name": "Crypto Wallet", "type": "Digital", "currency": "USDT", "symbol": "T", "balance": 20.00, "fx_rate_to_base": 58.60}
    ]
}

# COLORS
DARK_BG     = HexColor("#0F172A")
LIGHT_BG    = HexColor("#FFFFFF")
LIGHT_BG2   = HexColor("#F8FAFC")
GREEN       = HexColor("#00E676")
RED         = HexColor("#EF4444")
PURPLE      = HexColor("#A855F7")
BLUE        = HexColor("#3B82F6")
SLATE_GRAY  = HexColor("#64748B")
SLATE       = HexColor("#1E293B")
GRAY        = HexColor("#64748B")
LIGHT_GRAY  = HexColor("#F1F5F9")
BORDER_GRAY = HexColor("#E2E8F0")

W, H = A4
ML = 0.75 * inch
MR = 0.75 * inch
CONTENT_W = W - ML - MR

# STYLES
styles = getSampleStyleSheet()

sNoteText = ParagraphStyle("NoteText", parent=styles["Normal"], fontName="Helvetica-Oblique",
                           fontSize=8, textColor=GRAY, leading=11)

# CUSTOM FLOWABLES
class DarkCoverPage(Flowable):
    """Full-page dark cover drawn directly on canvas."""
    def __init__(self):
        Flowable.__init__(self)
        self.width = W
        self.height = H

    def draw(self):
        c = self.canv
        c.setFillColor(DARK_BG)
        c.rect(0, 0, W, H, fill=1, stroke=0)

        c.setFont("Helvetica-Bold", 42)
        c.setFillColor(GREEN)
        c.drawCentredString(W / 2, H - 120, "SINKPESO")

        c.setStrokeColor(GREEN)
        c.setLineWidth(2)
        line_w = CONTENT_W * 0.8
        c.line(W / 2 - line_w / 2, H - 135, W / 2 + line_w / 2, H - 135)

        c.setFont("Helvetica", 14)
        c.setFillColor(white)
        c.drawCentredString(W / 2, H - 160, "Financial Report")

        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(GREEN)
        c.drawCentredString(W / 2, H - 200, data_source["report_date"])

        c.setFont("Helvetica", 10)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2, H - 220, "Generated on %s" % data_source["generated_at"])

        c.setFont("Helvetica", 9)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2, H - 260, "SPENDING PERSONALITY")
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(GREEN)
        c.drawCentredString(W / 2, H - 285, data_source["personality"])

        sym = data_source["base_symbol"]
        m = data_source["metrics"]
        cards = [
            ("TOTAL INCOME", "%s%s" % (sym, "{:,.2f}".format(m["total_income"])), GREEN),
            ("TOTAL SPENT", "%s%s" % (sym, "{:,.2f}".format(m["total_spent"])), RED),
            ("SAVINGS RATE", m["savings_rate"], BLUE),
            ("NET AVAILABLE", "%s%s" % (sym, "{:,.2f}".format(m["net_available"])), GREEN if m["net_available"] >= 0 else RED),
        ]
        card_w = (CONTENT_W - 40) / 4
        card_h = 55
        card_y = H - 380
        for i, (label, value, color) in enumerate(cards):
            x = ML + i * (card_w + 13)
            c.setFillColor(SLATE)
            c.roundRect(x, card_y, card_w, card_h, 4, fill=1, stroke=0)
            c.setFillColor(color)
            c.rect(x, card_y + card_h - 3, card_w, 3, fill=1, stroke=0)
            c.setFont("Helvetica-Bold", 7)
            c.setFillColor(GRAY)
            c.drawCentredString(x + card_w / 2, card_y + 35, label)
            c.setFont("Helvetica-Bold", 13)
            c.setFillColor(color)
            c.drawCentredString(x + card_w / 2, card_y + 14, value)

        c.setFont("Helvetica", 9)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2, card_y - 30, "24 transactions  -  4 categories  -  3 bills  -  1 vault  -  3 wallets")

        c.setFont("Helvetica", 8)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2, 40, "Private  -  Offline  -  Yours")
        c.drawCentredString(W / 2, 28, "by Lodoy Goes Random  |  Page 1 of 3")


class SectionAnchor(Flowable):
    """Green vertical bar + section title for light pages."""
    def __init__(self, title):
        Flowable.__init__(self)
        self.title = title
        self.width = CONTENT_W
        self.height = 22

    def draw(self):
        c = self.canv
        c.setFillColor(GREEN)
        c.rect(0, 4, 3, 14, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(SLATE)
        c.drawString(12, 6, self.title)
        c.setStrokeColor(BORDER_GRAY)
        c.setLineWidth(0.5)
        c.line(0, 0, CONTENT_W, 0)


class SummaryCard(Flowable):
    """2-column grid card for executive summary."""
    def __init__(self, label, value, color):
        Flowable.__init__(self)
        self.label = label
        self.value = value
        self.color = color
        self.width = (CONTENT_W - 10) / 2
        self.height = 38

    def draw(self):
        c = self.canv
        c.setFillColor(LIGHT_GRAY)
        c.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        c.setFillColor(self.color)
        c.rect(0, self.height - 2, self.width, 2, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(GRAY)
        c.drawCentredString(self.width / 2, self.height - 14, self.label)
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(self.color)
        c.drawCentredString(self.width / 2, 8, self.value)


# BUILD DOCUMENT
def on_first_page(canvas, doc):
    pass

def on_later_pages(canvas, doc):
    canvas.setFillColor(LIGHT_BG)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(GRAY)
    canvas.drawString(ML, H - 30, "SINKPESO  |  Financial Report")
    canvas.setStrokeColor(BORDER_GRAY)
    canvas.setLineWidth(0.4)
    canvas.line(ML, H - 35, W - MR, H - 35)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(GRAY)
    canvas.drawCentredString(W / 2, 28, "Private  -  Offline  -  Yours  -  by Lodoy Goes Random  |  Page %d of 3" % doc.page)

doc = SimpleDocTemplate(
    "SINKPESO_Report_June2026.pdf",
    pagesize=A4,
    leftMargin=ML, rightMargin=MR,
    topMargin=0.6 * inch, bottomMargin=0.6 * inch
)

story = []

# PAGE 1: COVER
story.append(DarkCoverPage())
story.append(Spacer(1, H))

# PAGE 2: EXECUTIVE SUMMARY + HORIZONTAL BAR CHART
sym = data_source["base_symbol"]
m = data_source["metrics"]

story.append(KeepTogether([SectionAnchor("Executive Summary"), Spacer(1, 10)]))

card_data = [
    ("TOTAL INCOME", "%s%s" % (sym, "{:,.2f}".format(m["total_income"])), GREEN),
    ("DAILY EXPENSES", "%s%s" % (sym, "{:,.2f}".format(m["daily_expenses"])), RED),
    ("PAID BILLS", "%s%s" % (sym, "{:,.2f}".format(m["paid_bills"])), PURPLE),
    ("UNPAID BILLS", "%s%s" % (sym, "{:,.2f}".format(m["unpaid_bills"])), RED if m["unpaid_bills"] > 0 else GRAY),
    ("IN SAVINGS VAULTS", "%s%s" % (sym, "{:,.2f}".format(m["in_vaults"])), BLUE),
    ("NET AVAILABLE", "%s%s" % (sym, "{:,.2f}".format(m["net_available"])), GREEN if m["net_available"] >= 0 else RED),
    ("SAVINGS RATE", m["savings_rate"], BLUE),
    ("TOTAL SPENT", "%s%s" % (sym, "{:,.2f}".format(m["total_spent"])), RED),
]

for i in range(0, len(card_data), 2):
    row = []
    for j in range(2):
        if i + j < len(card_data):
            lbl, val, col = card_data[i + j]
            row.append(SummaryCard(lbl, val, col))
        else:
            row.append(Spacer(1, 1))
    card_table = Table([row], colWidths=[(CONTENT_W - 10) / 2, (CONTENT_W - 10) / 2])
    card_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(card_table)

story.append(Spacer(1, 12))

# HORIZONTAL BAR CHART
story.append(KeepTogether([SectionAnchor("Spending Breakdown"), Spacer(1, 8)]))

drawing = Drawing(CONTENT_W, 160)
chart = VerticalBarChart()
chart.x = 80
chart.y = 20
chart.width = 350
chart.height = 100
chart.data = [[m["daily_expenses"], m["paid_bills"], m["unpaid_bills"]]]
chart.categoryAxis.categoryNames = ["Daily Expenses", "Paid Bills", "Unpaid Bills"]
chart.categoryAxis.labels.fontName = "Helvetica"
chart.categoryAxis.labels.fontSize = 8
chart.categoryAxis.labels.fillColor = HexColor("#334155")
chart.valueAxis.valueMin = 0
chart.valueAxis.valueMax = 2000
chart.valueAxis.valueStep = 500
chart.valueAxis.labels.fontName = "Helvetica"
chart.valueAxis.labels.fontSize = 8
chart.valueAxis.labels.fillColor = GRAY
chart.barWidth = 40
chart.groupSpacing = 30

chart.bars[0].fillColor = RED
chart.bars[1].fillColor = PURPLE
chart.bars[2].fillColor = SLATE_GRAY

chart.barLabels.fontName = "Helvetica-Bold"
chart.barLabels.fontSize = 9
chart.barLabels.fillColor = SLATE
chart.barLabels.nudge = 8
chart.barLabelArray = [
    "%s%s" % (sym, "{:,.0f}".format(m["daily_expenses"])),
    "%s%s" % (sym, "{:,.0f}".format(m["paid_bills"])),
    "%s%s" % (sym, "{:,.0f}".format(m["unpaid_bills"]))
]

drawing.add(chart)
story.append(drawing)
story.append(Spacer(1, 14))

# PAGE 3: HIGHLIGHTS + WALLETS
story.append(Spacer(1, 24))
story.append(KeepTogether([SectionAnchor("Highlights"), Spacer(1, 8)]))

hdr_style = ParagraphStyle("THdr", fontName="Helvetica-Bold", fontSize=8, textColor=white, leading=10)
cell_style = ParagraphStyle("TCell", fontName="Helvetica", fontSize=9, textColor=HexColor("#334155"), leading=12)
cell_bold = ParagraphStyle("TCellB", fontName="Helvetica-Bold", fontSize=9, textColor=SLATE, leading=12)

table_data = [
    [Paragraph("Metric", hdr_style), Paragraph("Detail", hdr_style), Paragraph("Amount", hdr_style)]
]
for row in data_source["highlights"]:
    table_data.append([
        Paragraph(row[0], cell_style),
        Paragraph(row[1], cell_style),
        Paragraph(row[2], cell_bold)
    ])

col_w = [CONTENT_W * 0.35, CONTENT_W * 0.35, CONTENT_W * 0.30]
t = Table(table_data, colWidths=col_w, repeatRows=1)
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), SLATE),
    ("TEXTCOLOR", (0, 0), (-1, 0), white),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, LIGHT_BG2]),
    ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (2, 0), (2, -1), "RIGHT"),
]))
story.append(t)

# WALLETS
story.append(Spacer(1, 24))
story.append(KeepTogether([SectionAnchor("Wallets & Multi-Currency Breakdown"), Spacer(1, 8)]))

whdr = ParagraphStyle("WHdr", fontName="Helvetica-Bold", fontSize=8, textColor=white, leading=10)
wcell = ParagraphStyle("WCell", fontName="Helvetica", fontSize=9, textColor=HexColor("#334155"), leading=12)
wcellb = ParagraphStyle("WCellB", fontName="Helvetica-Bold", fontSize=9, textColor=SLATE, leading=12)
wcellr = ParagraphStyle("WCellR", fontName="Helvetica-Bold", fontSize=9, textColor=GREEN, leading=12, alignment=TA_RIGHT)

wallet_data = [
    [Paragraph("Wallet", whdr), Paragraph("Type", whdr), Paragraph("Original Balance", whdr),
     Paragraph("FX Rate", whdr), Paragraph("Total (Base)", whdr)]
]

combined_total = 0
for w in data_source["wallets"]:
    native = "%s%s" % (w["symbol"], "{:,.2f}".format(w["balance"]))
    fx_str = "1 %s = %s %s" % (w["currency"], "{:,.2f}".format(w["fx_rate_to_base"]), data_source["base_currency"])
    base_val = w["balance"] * w["fx_rate_to_base"]
    combined_total += base_val
    base_str = "%s%s" % (data_source["base_symbol"], "{:,.2f}".format(base_val))
    wallet_data.append([
        Paragraph(w["name"], wcell),
        Paragraph(w["type"], wcell),
        Paragraph(native, wcell),
        Paragraph(fx_str, wcell),
        Paragraph(base_str, wcellb),
    ])

wallet_data.append([
    Paragraph("TOTAL (Combined)", wcellb),
    Paragraph("", wcell),
    Paragraph("", wcell),
    Paragraph("", wcell),
    Paragraph("%s%s" % (data_source["base_symbol"], "{:,.2f}".format(combined_total)), wcellr),
])

wcol_w = [CONTENT_W * 0.18, CONTENT_W * 0.12, CONTENT_W * 0.20, CONTENT_W * 0.25, CONTENT_W * 0.25]
wt = Table(wallet_data, colWidths=wcol_w, repeatRows=1)
wt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), SLATE),
    ("TEXTCOLOR", (0, 0), (-1, 0), white),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [LIGHT_BG, LIGHT_BG2]),
    ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BACKGROUND", (0, -1), (-1, -1), LIGHT_GRAY),
    ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
]))
story.append(wt)
story.append(Spacer(1, 12))

# FX Reference Callout Box
fx_notes = []
for w in data_source["wallets"]:
    if w["currency"] != data_source["base_currency"]:
        fx_notes.append("1 %s = %s %s" % (w["currency"], "{:,.2f}".format(w["fx_rate_to_base"]), data_source["base_currency"]))

if fx_notes:
    note_text = "Note: Exchange rates are relative to base currency (%s). %s." % (data_source["base_currency"], ", ".join(fx_notes))
    callout_data = [[Paragraph(note_text, sNoteText)]]
    callout = Table(callout_data, colWidths=[CONTENT_W - 16])
    callout.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(callout)

# BUILD
doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
print("PDF generated: SINKPESO_Report_June2026.pdf")
print("Path: %s" % os.path.abspath("SINKPESO_Report_June2026.pdf"))