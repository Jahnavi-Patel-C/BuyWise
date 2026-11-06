# BuyWise — Think before you spend

> **AI-Powered Personal Finance & Purchasing Decision Assistant for College Students**

[![GitHub Repository](https://img.shields.io/badge/GitHub-Jahnavi--Patel--C%2FBuyWise-181717?style=flat&logo=github)](https://github.com/Jahnavi-Patel-C/BuyWise)
[![Tests Passing](https://img.shields.io/badge/Tests-53%2F53%20Passing-success)](https://github.com/Jahnavi-Patel-C/BuyWise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

- **Official Repository**: [https://github.com/Jahnavi-Patel-C/BuyWise](https://github.com/Jahnavi-Patel-C/BuyWise)
- **Live Application URL**: Deployed via Vercel + Render *(see [Live Cloud Deployment Guide](#8-live-cloud-deployment-guide) below)*

---

## 1. Project Overview

**BuyWise** is an AI-powered financial decision assistant built from scratch for college students managing limited allowances, irregular income, and upcoming academic commitments.

Unlike traditional expense trackers that merely record where your money went, **BuyWise helps you decide whether you should spend money in the first place.**

### Key Student Questions Answered:
- *Can I afford these wireless headphones for ₹3,500?*
- *Can I spend ₹250 on food today without derailing my budget?*
- *Will this purchase compromise my upcoming college semester fee?*
- *Should I buy this now or wait until my next allowance?*
- *What happens to my savings if I buy a refurbished or cheaper alternative?*

---

## 2. Core Modules

| Module | Name | Key Functionality |
| :--- | :--- | :--- |
| **Module 1** | **Purchase Decision Analyzer** | Evaluates candidate purchases against balance, emergency reserve, upcoming fees, and expected allowance. Outputs explainable `BUY NOW`, `WAIT`, or `RECONSIDER` recommendations with full calculations. |
| **Module 2** | **Daily Spending Evaluator** | Everyday micro-spending check (e.g. ₹250 dinner) evaluating today's accumulated velocity against safe daily allowances. |
| **Module 3** | **Financial Timeline & Profile** | Dynamic chronological milestone projection showing running balances across upcoming fees and scheduled allowances without double-counting. |
| **Module 4** | **What-If Purchase Simulator** | Real-time comparative sandbox comparing Buy Now vs. Wait for Allowance vs. Cheaper Alternative vs. Skip & Boost Savings. |
| **Module 5** | **Spending Behaviour Intelligence** | Analyzes transaction history: category breakdown, micro-spending habits (<= ₹300) with 20% cutback savings, recurring subscriptions, and ML anomaly detection. |
| **Module 6** | **Personalized Financial Advisor** | Rules-based and statistical recommendation engine offering targeted guidance on safety cushions and dining velocity. |

---

## 3. Financial Decision Engine & Savings Accounting

BuyWise employs a deterministic, transparent financial decision engine designed specifically around student budgeting realities:

$$\text{Remaining Savings Target} = \max\left(0, \text{Monthly Savings Target} - \text{Actual Savings}\right)$$

$$\text{Total Protected Reserves} = \text{Emergency Reserve} + \text{Remaining Savings Target}$$

$$\text{Safe Discretionary Spending} = \max\left(0, \text{Current Liquid Balance} - \text{Total Protected Reserves}\right)$$

### Key Accounting Invariance Principles:
1. **Zero Double-Counting**: When money is transferred from checking to savings, the liquid balance decreases while `actualSavings` increases. This dynamically lowers `remainingSavingsTarget`, keeping safe discretionary spending invariant.
   - *Example*: Balance ₹3,500, Reserve ₹700, Target ₹1,000, Actual ₹0 $\rightarrow$ Safe Discretionary is **₹1,800**.
   - *After ₹400 Transfer*: Balance ₹3,100, Reserve ₹700, Remaining Target ₹600 $\rightarrow$ Safe Discretionary remains **₹1,800**.
2. **Savings Never Treated as Spendable Cash**: The spending account holds ₹3,100. Purchases exceeding ₹1,800 are flagged `RECONSIDER`/`WAIT` to prevent dipping into reserves.
3. **Automated Savings Cycle Rollover**: At the start of a new monthly cycle, `actualSavings` automatically resets to ₹0 so the new month's target is planned, while `totalAccumulatedSavings` safely carries forward lifetime wealth.

---

## 4. Technology Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide React Icons. (Modern fintech design: warm off-white, muted lavender, soft sage green).
- **Backend**: Node.js, Express.js, JWT Authentication, bcrypt password hashing, centralized error handling.
- **Database**: MongoDB (Atlas/Local compatible) with transparent, zero-setup **In-Memory MongoDB fallback** (`mongodb-memory-server`) so the app runs out-of-the-box on any machine without installing MongoDB.
- **AI/ML Service**: Python 3.12, FastAPI, Uvicorn, Scikit-learn, Pandas, NumPy:
  - **Expense Categorizer**: TF-IDF Vectorizer + Multinomial Logistic Regression.
  - **Unusual Spending Detector**: Isolation Forest (`sklearn.ensemble.IsolationForest`) with statistical Z-score deviation fallback.
  - **Expense Forecasting**: Linear Regression (`sklearn.linear_model.LinearRegression`).

---

## 4. Quick Start Guide (Windows / PowerShell)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

---

### Step 1: Install Dependencies

Open PowerShell in the `BuyWise` root folder:

```powershell
# 1. Install Backend Dependencies
cd backend
npm install
cd ..

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..

# 3. Setup Python ML Environment
cd ml-service
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
cd ..
```

---

### Step 2: Run Verification Tests

Run the full end-to-end integration and unit test suites:

```powershell
# 1. Run Master End-to-End Integration Audit (28 tests across Express, FastAPI, and MongoDB)
node backend\tests\e2eAudit.js

# 2. Run Comprehensive Financial Logic & Critical Cases (21 unit & integration tests)
node backend\tests\runAllTests.js

# 3. Run Python ML Model Test Suite (TF-IDF, Isolation Forest, Linear Regression)
.\ml-service\venv\Scripts\python ml-service\test_ml.py

# 4. Verify Frontend Production Build
cd frontend
npm run build
cd ..
```

---

### Step 3: Run the Application

Start services in separate terminal tabs in the following order:

#### Terminal 1 — Python ML Service (Port 8000)
```powershell
cd ml-service
.\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*(Note: If the ML service is not running, the Express backend automatically activates resilient deterministic fallbacks.)*

#### Terminal 2 — Backend API Server (Port 5000)
```powershell
cd backend
npm run dev
```

#### Terminal 3 — Frontend Web Application (Port 5173)
```powershell
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 5. Demo Account & Instant Evaluation

BuyWise includes a 1-click Demo Account pre-seeded with realistic college student finances:
- **Email**: `alex.student@buywise.edu`
- **Password**: `Password@123`
- **Pre-seeded Data**:
  - Monthly allowance of ₹6,000 arriving in 10 days
  - Current bank balance of ₹4,850
  - Upcoming mandatory Semester Exam Fee of ₹2,500 due in 5 days
  - 30+ categorized campus transactions (Canteen, Metro, Zomato, Xeroxing, Blinkit)
  - An outlier purchase (₹2,600 designer sunglasses) flagged by Isolation Forest

> **Quick Tip:** On the login screen, click **"Launch Demo Student Workspace"** to enter the fully populated workspace in one click without typing credentials.

---

## 6. Database Persistence Configuration (In-Memory vs. Persistent MongoDB)

> [!IMPORTANT]
> **Default In-Memory Database Behavior:**
> By default, BuyWise starts with an embedded in-memory MongoDB server (`mongodb-memory-server`) to enable zero-configuration academic demonstration on any machine without requiring a locally installed `mongod` service or cloud account. **Data stored in this default in-memory engine resets whenever the backend server process is restarted.**

### Configuring Persistent MongoDB Storage:
To persist users, profiles, and transactions indefinitely across service restarts, configure a standard MongoDB connection string:

1. Copy `.env.example` to `backend/.env` (or edit `backend/.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=buywise-secure-student-jwt-secret-key-2025
   ML_SERVICE_URL=http://127.0.0.1:8000
   
   # Persistent MongoDB Options:
   # Option A: Cloud MongoDB Atlas URI:
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/buywise?retryWrites=true&w=majority
   
   # Option B: Local MongoDB Service:
   # MONGODB_URI=mongodb://localhost:27017/buywise
   ```
2. Restart the backend:
   ```powershell
   cd backend
   npm run dev
   ```
   The backend console will print:
   `Connected successfully to MongoDB Database`

If `MONGODB_URI` is left blank or unreachable, the system automatically falls back to isolated in-memory storage.

---

## 7. Project Structure

```
BuyWise/
├── backend/
│   ├── src/
│   │   ├── config/db.js             # MongoDB + In-Memory fallback
│   │   ├── controllers/             # Auth, profile, transactions, decisions, analytics
│   │   ├── models/                  # User, FinancialProfile, Transaction, Obligation, Decision
│   │   ├── services/
│   │   │   ├── decisionEngine.js    # Deterministic explainable decision engine
│   │   │   ├── dailyEvaluator.js    # Everyday micro-spending evaluator
│   │   │   └── mlClient.js          # REST client to Python ML with statistical fallback
│   │   ├── middleware/              # Auth JWT verification & Centralized Error Handler
│   │   ├── routes/                  # Express REST routes
│   │   ├── seeds/seedDemoData.js    # Student seed generator
│   │   └── server.js                # Express app entrypoint
│   ├── tests/
│   │   └── runAllTests.js           # Critical financial test cases 1-10 & auth tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/              # DecisionBadge, MetricCard, Sidebar, Navbar
│   │   ├── context/AuthContext.jsx  # Authentication state & demo handler
│   │   ├── pages/                   # Home, Analyzer, Daily, Timeline, Simulator, Insights, Transactions, Profile, Auth
│   │   ├── services/api.js          # Frontend REST client
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── ml-service/
│   ├── app/
│   │   ├── categorizer.py           # TF-IDF + Logistic Regression
│   │   ├── anomaly_detector.py      # Isolation Forest with Z-score fallback
│   │   ├── forecasting.py           # Linear Regression trend forecasting
│   │   └── main.py                  # FastAPI server endpoints
│   ├── data/synthetic_transactions.csv
│   ├── train.py                     # Standalone model training script
│   ├── test_ml.py                   # ML test suite
│   └── requirements.txt
├── docs/
│   ├── ARCHITECTURE.md              # Detailed architecture breakdown
│   └── API.md                       # Comprehensive REST API reference
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Critical Financial Logic Test Cases Verified

1. **Comfortable Capacity**: Purchase safely above emergency cushion and obligations -> `BUY NOW`.
2. **Emergency Cushion Threat**: Purchase would drain balance below emergency reserve -> `RECONSIDER`.
3. **Delayed Affordability**: Purchase exceeds current cash, but is safe once next allowance credits -> `WAIT`.
4. **Impending College Fees**: Upcoming ₹2,500 semester fee due soon blocks discretionary gadgets -> `RECONSIDER` / `WAIT`.
5. **Excessive Daily Velocity**: Spending exceeds 1.8x safe daily velocity -> `WAIT`.
6. **Missing/Uncertain Income**: Fallback to current balance without speculative projections.
7. **Small History**: Transparent statistical fallback when transactions < 5.
8. **Input Validation**: Zero or negative amounts rejected with clear error status.
9. **Strict User Isolation**: Verified that User B cannot query or mutate User A's financial transactions or profile.
10. **Timeline Date Sensitivity**: Evaluates whether planned purchase date falls before or after income arrival.

---

## 8. Live Cloud Deployment Guide

BuyWise is architected for zero-cost production deployment across modern cloud platforms:

```
┌─────────────────────────────────┐
│     Vercel (React Frontend)     │
│   https://buywise.vercel.app    │
└────────────────┬────────────────┘
                 │ (VITE_API_URL)
                 ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│    Render (Express Backend)     │ ────> │   Render (FastAPI ML Service)   │
│ https://buywise-api.onrender.com│ <──── │ https://buywise-ml.onrender.com │
└────────────────┬────────────────┘       └─────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     MongoDB Atlas (M0 Free)     │
│  mongodb+srv://.../buywise      │
└─────────────────────────────────┘
```

### 1. Database (MongoDB Atlas)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free **M0 cluster**.
2. Under **Database Access**, create a user (e.g. `buywise_admin`) with password.
3. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) so cloud hosting can connect.
4. Click **Connect -> Drivers** to copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/buywise?retryWrites=true&w=majority
   ```

### 2. Backend & ML Service (Render Blueprint)
1. Sign in to [Render](https://render.com).
2. Click **New + -> Blueprint**.
3. Connect repository `https://github.com/Jahnavi-Patel-C/BuyWise`.
4. Render automatically parses `render.yaml` to spin up both:
   - `buywise-ml-service` (Python 3.11 FastAPI with scikit-learn)
   - `buywise-backend` (Node.js 18+ Express server)
5. Under `buywise-backend` environment variables, supply your MongoDB Atlas URI:
   - `MONGODB_URI`: `mongodb+srv://...`
6. Click **Apply**. Both services will build and deploy with live HTTPS URLs.

### 3. Frontend (Vercel)
1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New -> Project** and import `Jahnavi-Patel-C/BuyWise`.
3. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `<your-render-backend-url>/api` (e.g. `https://buywise-backend.onrender.com/api`)
5. Click **Deploy**. Vercel will build and assign your production domain.


