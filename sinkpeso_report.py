#!/usr/bin/env python3
"""
SINKPESO Financial Report Generator - ReportLab Edition
=========================================================
Run: python sinkpeso_report.py
Output: SINKPESO_Report_June2026.pdf

Page 1: Dark cover + dashboard
Page 2: Light theme - executive summary, horizontal bar chart
Page 3: Light theme - highlights, wallets with multi-currency FX breakdown
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Flowable, KeepTogether
)
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import HorizontalBarChart

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

styles = getSampleStyleSheet()

sCellRight = ParagraphStyle("CellRight", fontName="Helvetica-Bold",
                            fontSize=9, textColor=SLATE, alignment=TA_RIGHT, leading=12)
sCellBold = ParagraphStyle("CellBold", fontName="Helvetica-Bold",
                           fontSize=9, textColor=SLATE, leading=12)
sCellNormal = ParagraphStyle("CellNormal", fontName="Helvetica",
                             fontSize=9, textColor=HexColor("#334155"), leading=12)
sNoteText = ParagraphStyle("NoteText", fontName="Helvetica-Oblique",
                           fontSize=8, textColor=GRAY, leading=11)


# CUSTOM FLOWABLES
class DarkCoverPage(Flowable):
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
        lw = CONTENT_W * 0.8
        c.line(W / 2 - lw / 2, H - 135, W / 2 + lw / 2, H - 135)

        c.setFont("Helvetica", 14)
        c.setFillColor(white)
        c.drawCentredString(W / 2, H - 160, "Financial Report")

        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(GREEN)
        c.drawCentredString(W / 2, H - 200, "June 2026")

        c.setFont("Helvetica", 10)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2, H - 220, "Generated on June 6, 2026 at 09:10 AM")

        c.setFont("Helvetica", 9)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2, H - 260, "SPENDING PERSONALITY")
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(GREEN)
        c.drawCentredString(W / 2, H - 285, "The Spender")

        # 4 metric cards - HARDCODED
        cards = [
            ("TOTAL INCOME",  "PHP 65,000.00", GREEN),
            ("TOTAL SPENT",   "PHP 58,200.00", RED),
            ("SAVINGS RATE",  "10.4%",         BLUE),
            ("NET AVAILABLE", "PHP 6,800.00",  GREEN),
        ]
        cw = (CONTENT_W - 40) / 4
        ch = 55
        cy = H - 380
        for i, (label, value, color) in enumerate(cards):
            x = ML + i * (cw + 13)
            c.setFillColor(SLATE)
            c.roundRect(x, cy, cw, ch, 4, fill=1, stroke=0)
            c.setFillColor(color)
            c.rect(x, cy + ch - 3, cw, 3, fill=1, stroke=0)
            c.setFont("Helvetica-Bold", 7)
            c.setFillColor(GRAY)
            c.drawCentredString(x + cw / 2, cy + 35, label)
            c.setFont("Helvetica-Bold", 13)
            c.setFillColor(color)
            c.drawCentredString(x + cw / 2, cy + 14, value)

        c.setFont("Helvetica", 9)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2, cy - 30, "47 transactions  -  4 categories  -  3 bills  -  1 vault  -  2 wallets")

        c.setFont("Helvetica", 8)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2, 40, "Private  -  Offline  -  Yours")
        c.drawCentredString(W / 2, 28, "by Lodoy Goes Random  |  Page 1 of 3")


class SectionAnchor(Flowable):
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


# BUILD
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

# PAGE 2: EXECUTIVE SUMMARY
story.append(KeepTogether([SectionAnchor("Executive Summary"), Spacer(1, 10)]))

# HARDCODED 8 summary cards
card_data = [
    ("TOTAL INCOME",     "PHP 65,000.00", GREEN),
    ("DAILY EXPENSES",   "PHP 24,500.00", RED),
    ("PAID BILLS",       "PHP 22,000.00", PURPLE),
    ("UNPAID BILLS",     "PHP 11,700.00", RED),
    ("IN SAVINGS VAULTS","PHP 5,000.00",  BLUE),
    ("NET AVAILABLE",    "PHP 6,800.00",  GREEN),
    ("SAVINGS RATE",     "10.4%",         BLUE),
    ("TOTAL SPENT",      "PHP 58,200.00", RED),
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
chart = HorizontalBarChart()
chart.x = 80
chart.y = 20
chart.width = 350
chart.height = 100
chart.data = [[24500, 22000, 11700]]
chart.categoryAxis.categoryNames = ["Daily Expenses", "Paid Bills", "Unpaid Bills"]
chart.categoryAxis.labels.fontName = "Helvetica"
chart.categoryAxis.labels.fontSize = 8
chart.categoryAxis.labels.fillColor = HexColor("#334155")
chart.valueAxis.valueMin = 0
chart.valueAxis.valueMax = 30000
chart.valueAxis.valueStep = 10000
chart.valueAxis.labels.fontName = "Helvetica"
chart.valueAxis.labels.fontSize = 8
chart.valueAxis.labels.fillColor = GRAY
chart.barWidth = 18
chart.groupSpacing = 12

chart.bars[0].fillColor = RED
chart.bars[1].fillColor = PURPLE
chart.bars[2].fillColor = SLATE_GRAY

chart.barLabels.fontName = "Helvetica-Bold"
chart.barLabels.fontSize = 8
chart.barLabels.fillColor = SLATE
chart.barLabels.nudge = 8
chart.barLabelArray = ["PHP 24,500.00", "PHP 22,000.00", "PHP 11,700.00"]

drawing.add(chart)
story.append(drawing)
story.append(Spacer(1, 14))

# PAGE 3: HIGHLIGHTS + WALLETS
story.append(Spacer(1, 24))
story.append(KeepTogether([SectionAnchor("Highlights"), Spacer(1, 8)]))

hdr_style = ParagraphStyle("THdr", fontName="Helvetica-Bold", fontSize=8, textColor=white, leading=10)

table_data = [
    [Paragraph("Metric", hdr_style), Paragraph("Detail", hdr_style), Paragraph("Amount", hdr_style)],
    [Paragraph("Peak Spending Day", sCellNormal), Paragraph("Saturdays", sCellNormal), Paragraph("PHP 8,400.00", sCellRight)],
    [Paragraph("Total Transactions", sCellNormal), Paragraph("47", sCellNormal), Paragraph("--", sCellRight)],
    [Paragraph("Peak Day Total", sCellNormal), Paragraph("Saturday", sCellNormal), Paragraph("PHP 8,400.00", sCellRight)],
    [Paragraph("Total in Vaults", sCellNormal), Paragraph("Savings", sCellNormal), Paragraph("PHP 5,000.00", sCellRight)],
]

t = Table(table_data, colWidths=[CONTENT_W * 0.35, CONTENT_W * 0.35, CONTENT_W * 0.30])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), SLATE),
    ("TEXTCOLOR", (0, 0), (-1, 0), white),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ("LEFTPADDING", (0, 0), (-1, -1), 15),
    ("RIGHTPADDING", (0, 0), (-1, -1), 20),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT_BG, LIGHT_BG2]),
    ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (2, 0), (2, -1), "RIGHT"),
]))
story.append(t)

# WALLETS
story.append(Spacer(1, 24))
story.append(KeepTogether([SectionAnchor("Wallets & Multi-Currency Breakdown"), Spacer(1, 8)]))

wallet_data = [
    [Paragraph("Wallet", hdr_style), Paragraph("Type", hdr_style), Paragraph("Original Balance", hdr_style),
     Paragraph("FX Rate", hdr_style), Paragraph("Total (Base)", hdr_style)],
    [Paragraph("Cash", sCellNormal), Paragraph("Physical", sCellNormal),
     Paragraph("PHP 1,800.00", sCellRight), Paragraph("1 PHP = 1.00 PHP", sCellNormal),
     Paragraph("PHP 1,800.00", sCellBold)],
    [Paragraph("Digital Bank", sCellNormal), Paragraph("Savings", sCellNormal),
     Paragraph("PHP 5,000.00", sCellRight), Paragraph("1 PHP = 1.00 PHP", sCellNormal),
     Paragraph("PHP 5,000.00", sCellBold)],
    [Paragraph("TOTAL (Combined)", sCellBold), Paragraph("", sCellNormal),
     Paragraph("", sCellNormal), Paragraph("", sCellNormal),
     Paragraph("PHP 6,800.00", ParagraphStyle("TotalR", fontName="Helvetica-Bold",
               fontSize=9, textColor=GREEN, alignment=TA_RIGHT, leading=12))],
]

wcol_w = [
    CONTENT_W * 0.17,   # Wallet
    CONTENT_W * 0.10,   # Type
    CONTENT_W * 0.22,   # Original Balance
    CONTENT_W * 0.27,   # FX Rate
    CONTENT_W * 0.24,   # Total (Base)
]
wt = Table(wallet_data, colWidths=wcol_w, repeatRows=1)
wt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), SLATE),
    ("TEXTCOLOR", (0, 0), (-1, 0), white),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ("LEFTPADDING", (0, 0), (-1, -1), 15),
    ("RIGHTPADDING", (0, 0), (-1, -1), 20),
    ("ROWBACKGROUNDS", (0, 1), (-1, -2), [LIGHT_BG, LIGHT_BG2]),
    ("LINEBELOW", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BACKGROUND", (0, -1), (-1, -1), LIGHT_GRAY),
    ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
]))
story.append(wt)
story.append(Spacer(1, 12))

# FX Callout
callout_data = [[Paragraph(
    "Note: Exchange rates are relative to base currency (PHP). All wallets are in PHP.",
    sNoteText
)]]
callout = Table(callout_data, colWidths=[CONTENT_W - 16])
callout.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
    ("LEFTPADDING", (0, 0), (-1, -1), 15),
    ("RIGHTPADDING", (0, 0), (-1, -1), 20),
    ("TOPPADDING", (0, 0), (-1, -1), 12),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
]))
story.append(callout)

# BUILD
doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
print("PDF generated: SINKPESO_Report_June2026.pdf")
print("Path: %s" % os.path.abspath("SINKPESO_Report_June2026.pdf"))