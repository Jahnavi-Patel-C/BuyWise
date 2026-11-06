# BuyWise System Architecture

## 1. High-Level Architecture Overview

BuyWise is structured as an explainable, student-centered financial decision intelligence platform. It prevents poor purchasing choices and detects financial strain before money is spent.

```
+-------------------------------------------------------------------------+
|                              Frontend                                    |
|              React (Vite) + Tailwind CSS + Lucide Icons                  |
|          Modern Fintech UI (Off-white, Muted Lavender, Soft Sage)       |
+------------------------------------+------------------------------------+
                                     |
                          REST API / JSON (JWT Auth)
                                     |
+------------------------------------v------------------------------------+
|                         Node.js / Express API                           |
|  - JWT Authentication Middleware & User Data Isolation                 |
|  - Deterministic Financial Decision Engine                              |
|  - Daily Spending Evaluator Engine                                      |
|  - Financial Timeline & What-If Purchase Simulator                      |
|  - Centralized Error Handling & Input Validation                        |
+-------------------+--------------------------------+--------------------+
                    |                                |
         Mongoose ODM Queries               HTTP REST / Fast Fallback
                    |                                |
+-------------------v-----------------+   +----------v--------------------+
|             Database                |   |        Python ML Service      |
|  - MongoDB (Atlas / Local)          |   |  - FastAPI Microservice       |
|  - Zero-Setup In-Memory Fallback    |   |  - TF-IDF + Logistic Regress. |
|    (mongodb-memory-server)          |   |  - Isolation Forest           |
|  - Scoped by User ID                |   |  - Linear Regression Forecast |
+-------------------------------------+   +-------------------------------+
```

---

## 2. Modules & Core Responsibilities

### Module 1: Purchase Decision Analyzer
- **Purpose**: Evaluates candidate purchases against available balance, emergency reserves, upcoming obligations (e.g. college fees), and scheduled income.
- **Recommendations**:
  - `BUY NOW`: Fits comfortably above emergency cushion and all upcoming obligations.
  - `WAIT`: Viable after upcoming allowance/income is credited or after near-term bills are cleared.
  - `RECONSIDER`: Breaches emergency reserve, exceeds budget, or risks essential college fees.
- **Explainability**: Outputs the full mathematical calculation, reasons, and student-focused alternatives.

### Module 2: Daily Spending Evaluator
- **Purpose**: Evaluates everyday micro-expenses (e.g., "Can I spend ₹250 on food today?").
- **Metrics**: Computes daily safe allowance pace, integrates today's prior transactions, and checks short-term 7-day bill clearance.

### Module 3: Financial Profile & Chronological Timeline
- **Profile**: Stores allowance, balance, incoming income date, essential baseline expenses, savings goals, and emergency reserve.
- **Timeline**: Chronologically maps balance milestones and obligations without double-counting.

### Module 4: What-If Purchase Simulator
- **Simulation**: Compares Buy Now vs. Wait for Allowance vs. Cheaper Alternative (~35% discount) vs. Skip & Boost Savings.
- **Dynamic Math**: Immediate remaining balance, projected cycle buffer, and annualized savings.

### Module 5: Spending Behaviour Intelligence
- **Category Analytics**: Category breakdown percentages and total spend.
- **Micro-Spending Leaks**: Aggregates repeated small expenses (<= ₹300) and calculates actionable 20% savings.
- **Recurring Patterns**: Identifies repeating subscriptions and average ticket sizes.
- **Anomaly Detection**: Scikit-learn Isolation Forest identifies outliers with statistical deviation fallback.

### Module 6: Personalized Financial Advisor
- Rules-driven heuristic advisory engine evaluating emergency reserve health, near-term college commitments, dining spend velocity, and savings pacing.

---

## 3. Machine Learning & Statistical Engine

| Capability | Algorithm | Description & Fallback |
| :--- | :--- | :--- |
| **Expense Categorization** | TF-IDF Vectorizer + Multinomial Logistic Regression | Predicts categories from transaction descriptions. Fallback: Keyword taxonomy mapper. |
| **Unusual Spending Detection** | Isolation Forest (`sklearn.ensemble`) | Flags multidimensional transaction anomalies based on amount and category deviation. Fallback: Category Z-score deviation (+2.0σ). |
| **Expense Forecasting** | Linear Regression (`sklearn.linear_model`) | Extrapolates 30-day expenditure pace from historical series. Fallback: Moving average daily pace. |

---

## 4. Security & Data Isolation
- **Password Protection**: Passwords salted and hashed with bcrypt (cost factor 10).
- **Session Tokens**: JWT signed with HMAC-SHA256 (7-day validity).
- **User Scoping**: Every database query (`find`, `update`, `delete`) includes `{ userId: req.user.id }`.

