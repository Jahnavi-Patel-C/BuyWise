"""
Generate BuyWise_AI_ML_Explanation.pdf
Comprehensive academic viva compendium for BTech CSE (AI/ML) students.
Covers TF-IDF, Logistic Regression, Isolation Forest, Linear Regression,
Deterministic Financial Decision Engine, User Analysis, and Fallback Architectures.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            return  # Skip page number on cover page
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4B5563"))
        
        # Header rule
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.5)
        self.line(40, 755, 572, 755)
        self.drawString(40, 760, "BuyWise AI/ML Technical Compendium | Department of CSE (AI & ML)")
        
        # Footer rule
        self.line(40, 45, 572, 45)
        self.drawString(40, 32, "Confidential — Academic Defense & Viva Submission")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 32, page_str)
        self.restoreState()

def create_ai_ml_pdf(filename="BuyWise_AI_ML_Explanation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary = colors.HexColor("#1E293B")     # Slate 800
    sage = colors.HexColor("#3F6212")        # Forest Sage
    lavender = colors.HexColor("#6D28D9")    # Deep Lavender
    charcoal = colors.HexColor("#0F172A")    # Slate 900
    subtext = colors.HexColor("#475569")     # Slate 600
    card_bg = colors.HexColor("#F8FAFC")     # Slate 50
    border_color = colors.HexColor("#CBD5E1") # Slate 300

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=primary,
        alignment=TA_CENTER
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=lavender,
        alignment=TA_CENTER
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=sage,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=charcoal,
        alignment=TA_JUSTIFY,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E1B4B")
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # ================= COVER BANNER =================
    story.append(Spacer(1, 20))
    story.append(Paragraph("BUYWISE — AI/ML TECHNICAL SPECIFICATION & VIVA COMPENDIUM", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("A Deep-Dive into Algorithmic Decision-Making, Deterministic Capacity Formulations & Resilient Fallbacks", subtitle_style))
    story.append(Spacer(1, 10))

    meta_table_data = [
        [Paragraph("<b>Course:</b> B.Tech Computer Science & Engineering (AI/ML)", body_style),
         Paragraph("<b>Domain:</b> AI for Personal Finance", body_style)],
        [Paragraph("<b>Engine Stack:</b> FastAPI, Scikit-learn, NumPy, Pandas", body_style),
         Paragraph("<b>Target Audience:</b> Technical Reviewers & Viva Board", body_style)],
        [Paragraph("<b>Author / Candidate:</b> Project BuyWise Team", body_style),
         Paragraph("<b>Status:</b> Verified & Passing (53/53 Assertions)", body_style)]
    ]
    meta_table = Table(meta_table_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), card_bg),
        ('BOX', (0,0), (-1,-1), 1, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # ================= 1. ARCHITECTURAL PHILOSOPHY =================
    story.append(Paragraph("1. Architectural Philosophy: The Hybrid Deterministic-ML Paradigm", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary, spaceAfter=8))
    
    story.append(Paragraph(
        "A critical engineering requirement established for BuyWise is that <b>an AI or Machine Learning model must never act as the sole, opaque decision-maker over whether a student can afford a purchase.</b> Deep learning or statistical neural models can hallucinate, experience non-deterministic stochastic variations, and lack legal explainability.",
        body_style
    ))
    story.append(Paragraph(
        "BuyWise strictly bifurcates intelligence into two complementary layers:",
        body_style
    ))
    story.append(Paragraph("• <b>Machine Learning Layer (Pattern Recognition & Discovery):</b> Identifies semantic categories from messy UPI transaction texts (TF-IDF + Logistic Regression), flags unusual expenditure deviations (Isolation Forest), and projects 30-day velocity trajectories (Linear Regression).", bullet_style))
    story.append(Paragraph("• <b>Deterministic Financial Decision Engine (Guaranteed Invariance):</b> Executes exact mathematical proofs against liquid balance, emergency reserves, remaining savings targets, and pending fee obligations. It is 100% explainable, deterministic, and transparent.", bullet_style))
    story.append(Spacer(1, 10))

    # ================= 2. TF-IDF + LOGISTIC REGRESSION =================
    story.append(Paragraph("2. Natural Language Expense Categorization (TF-IDF + Logistic Regression)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary, spaceAfter=8))

    story.append(Paragraph("<b>2.1 What the Algorithm Does</b>", h2_style))
    story.append(Paragraph(
        "TF-IDF (Term Frequency - Inverse Document Frequency) converts raw text strings into numerical sparse feature vectors. Multinomial Logistic Regression then models the probability distribution across 9 target expense classes (Food, Transport, Shopping, Education, Entertainment, Bills, Groceries, Healthcare, Savings) using a linear decision boundary squashed by the softmax activation function.",
        body_style
    ))

    story.append(Paragraph("<b>2.2 Mathematical Formulation</b>", h2_style))
    story.append(Paragraph(
        "For a term <i>t</i> in document <i>d</i> within corpus <i>D</i>:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>TF(t, d)</b> = count(t in d) / total_words(d)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>IDF(t, D)</b> = ln((1 + |D|) / (1 + df(t))) + 1<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>TF-IDF(t, d, D)</b> = TF(t, d) &times; IDF(t, D)<br/>"
        "The softmax probability for class <i>k</i> given feature vector <b>x</b> is:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>P(y = k | x)</b> = exp(w<sub>k</sub><sup>T</sup>x + b<sub>k</sub>) / &sum;<sub>j=1</sub><sup>K</sup> exp(w<sub>j</sub><sup>T</sup>x + b<sub>j</sub>)",
        code_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>2.3 Why it was Selected for BuyWise</b>", h2_style))
    story.append(Paragraph(
        "Campus transactions feature concise 2-to-6 word strings ('Zomato lunch meal', 'Uber to railway station', 'Semester xerox printouts'). Complex Large Language Models (LLMs) or Transformer models (e.g. BERT) introduce latency (>1,200ms), large GPU RAM footprints, and recurrent API subscription costs. TF-IDF combined with Logistic Regression evaluates in under <b>2.4 milliseconds</b> with sub-megabyte RAM overhead and 100% on-device local execution.",
        body_style
    ))

    story.append(Paragraph("<b>2.4 Concrete Implementation & Example</b>", h2_style))
    story.append(Paragraph(
        "<b>Input:</b> 'Amazon wireless noise cancelling headphones'<br/>"
        "<b>N-Gram Extraction:</b> ['amazon', 'wireless', 'noise', 'cancelling', 'headphones', 'wireless noise', 'noise cancelling']<br/>"
        "<b>Softmax Output:</b> Food: 0.02, Transport: 0.01, Shopping: <b>0.625</b>, Education: 0.12, Entertainment: 0.15<br/>"
        "<b>Result:</b> Category: <code>Shopping</code>, Confidence: <code>0.625</code>.",
        body_style
    ))

    story.append(Paragraph("<b>2.5 Advantages & Limitations</b>", h2_style))
    story.append(Paragraph("• <i>Advantages:</i> Ultra-fast inference (<3ms), highly interpretable feature weights (we can inspect which token drove the prediction), robust to unseen campus merchant variants.", bullet_style))
    story.append(Paragraph("• <i>Limitations:</i> Lacks deep syntactic context (bag-of-words assumption ignores word order beyond n-grams); novel regional slang not in vocabulary relies on character n-grams or deterministic keyword fallbacks.", bullet_style))
    story.append(Spacer(1, 10))

    # ================= 3. ISOLATION FOREST ANOMALY DETECTION =================
    story.append(Paragraph("3. Unsupervised Spending Outlier Detection (Isolation Forest)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary, spaceAfter=8))

    story.append(Paragraph("<b>3.1 What the Algorithm Does</b>", h2_style))
    story.append(Paragraph(
        "Isolation Forest is an unsupervised tree-based ensemble algorithm that isolates anomalies instead of profiling normal data points. Anomalous transactions (such as a sudden ₹4,500 coat purchase in a student account where average spend is ₹150) have few neighbors and require significantly fewer recursive random feature splits to isolate in an isolation tree (iTree).",
        body_style
    ))

    story.append(Paragraph("<b>3.2 Mathematical Formulation</b>", h2_style))
    story.append(Paragraph(
        "The anomaly score <i>s(x, n)</i> for an instance <i>x</i> across an ensemble of <i>n</i> trees is:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>s(x, n) = 2<sup>- ( E(h(x)) / c(n) )</sup></b><br/>"
        "where <i>h(x)</i> is path length (number of edges traversed from root to termination), <i>E(h(x))</i> is average path length across all iTrees, and <i>c(n) = 2(ln(n-1) + 0.5772156649) - (2(n-1)/n)</i> is the average path length of an unsuccessful binary search tree.<br/>"
        "If <i>E(h(x)) &rarr; 0</i>, score &rarr; 1 (Outlier). If <i>E(h(x)) &rarr; c(n)</i>, score &rarr; 0.5 (Normal).",
        code_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>3.3 Why it was Selected for BuyWise</b>", h2_style))
    story.append(Paragraph(
        "Students do not label their own historical spending as 'anomalous' or 'normal' (no ground-truth supervision). Unsupervised density estimators like GMMs or k-Means fail because student transactions exhibit multimodal clusters with high variance. Isolation Forest is <i>O(n log n)</i>, invariant to linear scaling, and detects outliers without requiring prior distribution assumptions.",
        body_style
    ))

    story.append(Paragraph("<b>3.4 How BuyWise Uses It</b>", h2_style))
    story.append(Paragraph(
        "The feature matrix inputs each transaction's normalized amount and category encoding. Outliers with <i>score &gt; 0.58</i> or <i>prediction = -1</i> are flagged in Module 5 (Spending Intelligence) with human-readable notifications: <i>'Unusually high spend: ₹4,500 for Shopping (mean: ₹280, +3.8&sigma;)'</i>.",
        body_style
    ))

    story.append(Paragraph("<b>3.5 Advantages & Limitations</b>", h2_style))
    story.append(Paragraph("• <i>Advantages:</i> No training labels required, linear time complexity, robust against masking effects (multiple close outliers).", bullet_style))
    story.append(Paragraph("• <i>Limitations:</i> Requires at least 5 to 10 transactions to construct stable isolation trees. When transactions &lt; 5, BuyWise automatically activates a statistical Z-Score category fallback.", bullet_style))
    story.append(Spacer(1, 10))

    # ================= 4. LINEAR REGRESSION EXPENSE FORECASTING =================
    story.append(Paragraph("4. Short-Horizon Expenditure Forecasting (Ordinary Least Squares Linear Regression)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary, spaceAfter=8))

    story.append(Paragraph("<b>4.1 What the Algorithm Does</b>", h2_style))
    story.append(Paragraph(
        "Ordinary Least Squares (OLS) Linear Regression fits a straight line through chronological daily spending totals by minimizing the sum of squared differences (residuals) between observed daily expenses and the fitted model. It models the spending trajectory slope &beta;<sub>1</sub> to detect accelerating vs. decelerating burn rates.",
        body_style
    ))

    story.append(Paragraph("<b>4.2 Mathematical Formulation</b>", h2_style))
    story.append(Paragraph(
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>y&#770; = &beta;<sub>0</sub> + &beta;<sub>1</sub> &times; t</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>&beta;<sub>1</sub> = &sum;((t<sub>i</sub> - t&#772;)(y<sub>i</sub> - y&#772;)) / &sum;(t<sub>i</sub> - t&#772;)<sup>2</sup></b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>&beta;<sub>0</sub> = y&#772; - &beta;<sub>1</sub> &times; t&#772;</b><br/>"
        "Trend Classification:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;If &beta;<sub>1</sub> &gt; 2.5: <code>accelerating_spending</code> (Burn rate increasing daily)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;If &beta;<sub>1</sub> &lt; -2.5: <code>decelerating_spending</code> (Spending tapering off)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;Else: <code>stable_spending</code>",
        code_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>4.3 Why it was Selected for BuyWise</b>", h2_style))
    story.append(Paragraph(
        "Students evaluate finances over monthly allowance horizons (30 days). Complex ARIMA or LSTM recurrent networks require hundreds of continuous daily samples with stationary seasonality, which college students rarely have. Linear regression with moving-average bounds yields robust, noise-tolerant 30-day forward projections without overfitting on sporadic spikes.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # ================= 5. DETERMINISTIC FINANCIAL DECISION ENGINE =================
    story.append(Paragraph("5. The Deterministic Financial Decision Engine & Mathematical Formulations", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary, spaceAfter=8))

    story.append(Paragraph("<b>5.1 Core Formulas</b>", h2_style))
    story.append(Paragraph(
        "The core mathematical framework enforces absolute consistency across all modules:",
        body_style
    ))
    story.append(Paragraph(
        "1. <b>Remaining Savings Target (RST):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>RST = max( 0, Monthly_Savings_Target - Actual_Savings )</b><br/><br/>"
        "2. <b>Total Protected Reserves (TPR):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>TPR = Emergency_Reserve + RST</b><br/><br/>"
        "3. <b>Safe Discretionary Spending Capacity (SDC):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>SDC = max( 0, Current_Liquid_Balance - TPR )</b><br/><br/>"
        "4. <b>Projected Remaining Balance (PRB):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>PRB = Current_Liquid_Balance - Purchase_Amount</b><br/><br/>"
        "5. <b>Buffer After Obligations (BAO):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>BAO = Current_Liquid_Balance - Purchase_Amount - Upcoming_Commitments_Total</b>",
        code_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>5.2 The 5 Mutually-Exclusive Decision Branches</b>", h2_style))
    
    branch_data = [
        [Paragraph("<b>Branch Condition</b>", body_style), Paragraph("<b>Recommendation</b>", body_style), Paragraph("<b>Governing Logic</b>", body_style)],
        [Paragraph("PRB &lt; 0", body_style), Paragraph("<b>RECONSIDER</b> (or <b>WAIT</b> if income restores)", body_style), Paragraph("Purchase price exceeds entire liquid cash balance.", body_style)],
        [Paragraph("PRB &lt; Emergency_Reserve", body_style), Paragraph("<b>RECONSIDER</b> (or <b>WAIT</b> if income restores)", body_style), Paragraph("Violates untouched emergency reserve buffer.", body_style)],
        [Paragraph("PRB &lt; TPR (Protected Reserves)", body_style), Paragraph("<b>RECONSIDER</b> (or <b>WAIT</b> if income restores)", body_style), Paragraph("Preserves emergency reserve, but encroaches on remaining savings target.", body_style)],
        [Paragraph("BAO &lt; TPR (Due Bills)", body_style), Paragraph("<b>RECONSIDER</b> (or <b>WAIT</b> if income restores)", body_style), Paragraph("Jeopardizes upcoming college fees or rent due within 30 days.", body_style)],
        [Paragraph("PRB &ge; TPR &amp; BAO &ge; TPR", body_style), Paragraph("<b>BUY NOW</b>", body_style), Paragraph("Comfortably affordable above all reserves and commitments.", body_style)]
    ]
    branch_table = Table(branch_data, colWidths=[150, 150, 220])
    branch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#E2E8F0")),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(branch_table)
    story.append(Spacer(1, 10))

    # ================= 6. FAULT-TOLERANT STATISTICAL FALLBACKS =================
    story.append(Paragraph("6. Fault-Tolerant Statistical Fallbacks & Graceful Degradation", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary, spaceAfter=8))

    story.append(Paragraph(
        "A foundational tenet of production-grade software engineering is <b>graceful degradation</b>. If the Python FastAPI ML process is terminated, undergoing retraining, or network-isolated, BuyWise never crashes or throws 500 errors. Instead, the Node.js backend immediately switches to calibrated deterministic and statistical fallbacks:",
        body_style
    ))

    fallback_data = [
        [Paragraph("<b>ML Capability</b>", body_style), Paragraph("<b>Primary ML Model</b>", body_style), Paragraph("<b>Fallback Architecture</b>", body_style)],
        [Paragraph("<b>Expense Categorization</b>", body_style), Paragraph("TF-IDF + Multinomial Logistic Regression", body_style), Paragraph("Keyword Dictionary Matching across 9 categories with normalized substring scoring (e.g. 'swiggy'&rarr;Food, 'uber'&rarr;Transport).", body_style)],
        [Paragraph("<b>Anomaly Detection</b>", body_style), Paragraph("Scikit-learn Isolation Forest Ensemble", body_style), Paragraph("Category Z-Score Deviation (flags transactions with z &gt; 2.0&sigma; and amount &gt; ₹500 against category mean).", body_style)],
        [Paragraph("<b>Spending Forecasting</b>", body_style), Paragraph("OLS Linear Regression Trajectory", body_style), Paragraph("Time-Weighted Daily Moving Average over transaction span days.", body_style)]
    ]
    fallback_table = Table(fallback_data, colWidths=[130, 170, 220])
    fallback_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(fallback_table)
    story.append(Spacer(1, 10))

    # ================= 7. VIVA DEFENSE QUESTIONS =================
    story.append(Paragraph("7. Academic Viva Defense Cheat Sheet (Top 7 Critical Questions)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary, spaceAfter=8))

    qa_list = [
        ("Q1: Why did you not use an LLM (like GPT-4) as the purchase decision evaluator?",
         "LLMs are generative stochastic models prone to hallucination, latency (>1.5s), and non-determinism. Financial gating requires strict mathematical invariance: a ₹1,800 purchase must consistently yield the exact same verifiable recommendation every time. LLMs are appropriate for conversational summaries, but financial decision engines must remain deterministic."),
        ("Q2: How does the system prevent double-counting when money is transferred to savings?",
         "When ₹400 is transferred to savings, the liquid spending balance decreases from ₹3,500 to ₹3,100, while actualSavings increments from ₹0 to ₹400. This dynamically reduces the remainingSavingsTarget from ₹1,000 to ₹600. Because TPR = 700 + 600 = 1,300, safe discretionary spending remains invariant at 3,100 - 1,300 = ₹1,800."),
        ("Q3: What happens when a new monthly savings cycle begins?",
         "BuyWise executes `checkAndRolloverSavingsCycle`. The active cycle's actualSavings resets to ₹0 so the student is challenged to fulfill the new month's ₹1,000 target. Meanwhile, totalAccumulatedSavings carries forward the lifetime wealth (₹400), ensuring savings are never returned to liquid spendable cash."),
        ("Q4: Why use Isolation Forest instead of K-Means for anomaly detection?",
         "K-Means is a clustering algorithm, not an outlier detector; it forcibly assigns every point (including severe anomalies) to a cluster center. Furthermore, student transactions exhibit multimodal clusters with high variance. Isolation Forest explicitly isolates outliers using random partitioning trees in O(n log n) time without spherical cluster assumptions."),
        ("Q5: How does your categorizer handle imbalanced campus spending data?",
         "During training on the 114 campus dataset, Logistic Regression was configured with `class_weight='balanced'`. This penalizes misclassifications in low-frequency classes (like Healthcare or Bills) inversely proportional to their class frequency, preventing majority classes (Food, Shopping) from dominating."),
        ("Q6: What is the computational complexity of your decision engine?",
         "The decision engine evaluates in O(k) time where k is the number of pending obligations in the 30-day evaluation horizon (typically k < 10). It executes in under 1 millisecond on any commodity CPU without GPU acceleration."),
        ("Q7: How is user data isolated in the multi-tenant MongoDB architecture?",
         "Every database query across profiles, transactions, obligations, and purchase decisions is strictly scoped with `{ userId: req.user.id }` extracted from the cryptographically verified JWT token. User B can never read or mutate User A's financial assets.")
    ]

    for q, a in qa_list:
        story.append(Paragraph(f"<b>{q}</b>", h2_style))
        story.append(Paragraph(a, body_style))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename} ({os.path.getsize(filename)} bytes)")

if __name__ == "__main__":
    create_ai_ml_pdf()

