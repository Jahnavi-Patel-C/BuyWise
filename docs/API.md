# BuyWise REST API Reference

Base URL: `http://localhost:5000/api`

---

## 1. Authentication (`/api/auth`)

### `POST /auth/register`
Creates a new student account and initializes a starter financial profile.
- **Request Body**:
  ```json
  {
    "username": "Alex Sharma",
    "email": "alex@buywise.edu",
    "password": "Password@123"
  }
  ```
- **Response (201)**:
  ```json
  {
    "success": true,
    "token": "<jwt_token>",
    "user": { "id": "...", "username": "Alex Sharma", "email": "alex@buywise.edu" }
  }
  ```

### `POST /auth/login`
Authenticates existing student credentials.
- **Request Body**:
  ```json
  { "email": "alex@buywise.edu", "password": "Password@123" }
  ```

### `GET /auth/me`
Retrieves currently authenticated session. Header: `Authorization: Bearer <token>`.

### `POST /seed/demo`
One-click demo initialization endpoint. Creates/resets the demo student account with realistic transactions, upcoming college fees, and pre-evaluated decisions.

---

## 2. Financial Profile (`/api/profile`)

*All routes require Bearer token.*

### `GET /profile`
Retrieves the user's financial profile and pending obligation summary.

### `PUT /profile`
Updates financial parameters (allowance, currentBalance, expectedIncome, expectedIncomeDate, essentialExpenses, savingsTarget, emergencyReserve).

---

## 3. Decision Engine (`/api/decisions`)

### `POST /decisions/evaluate-purchase`
Evaluates a planned purchase (Module 1).
- **Request Body**:
  ```json
  {
    "purchaseName": "Wireless Headphones",
    "amount": 3500,
    "category": "Electronics",
    "plannedDate": "2026-11-06",
    "priority": "useful",
    "saveHistory": true
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "decision": {
      "recommendation": "WAIT",
      "calculatedFinancialCapacity": 1200,
      "remainingProjectedBalance": 1350,
      "reasons": [
        "Upcoming college exam fee of ₹2,500 due in 5 days.",
        "With allowance arriving in 10 days, this purchase is safe if delayed."
      ],
      "suggestedAction": "Delay purchase until allowance arrives."
    }
  }
  ```

### `POST /decisions/evaluate-daily`
Evaluates everyday small purchases (Module 2).
- **Request Body**:
  ```json
  { "amount": 250, "category": "Food", "description": "Swiggy Dinner" }
  ```

### `POST /decisions/simulate`
Generates What-If comparisons (Module 4: Buy Now, Wait, Cheaper, Skip).

### `GET /decisions/history`
Returns past purchase evaluations.

---

## 4. Financial Obligations (`/api/obligations`)

- `GET /obligations`: List user obligations (filter `?status=pending|paid`)
- `POST /obligations`: Create obligation (title, amount, dueDate, obligationType)
- `PUT /obligations/:id`: Update obligation (e.g. mark as paid)
- `DELETE /obligations/:id`: Delete obligation

---

## 5. Transactions (`/api/transactions`)

- `GET /transactions`: List transactions (filters: `category`, `type`, pagination)
- `POST /transactions`: Record transaction (auto-updates currentBalance & triggers ML categorizer)
- `POST /transactions/auto-categorize`: Previews ML category for a description
- `DELETE /transactions/:id`: Deletes transaction and restores balance

---

## 6. Behavioural Analytics & Timeline (`/api/analytics`)

- `GET /analytics/spending-intelligence`: Category breakdown, micro-purchases, recurring patterns, Isolation Forest anomalies, 30-day forecast.
- `GET /analytics/recommendations`: Actionable personalized advice.
- `GET /analytics/timeline`: Chronological timeline and running balances.

