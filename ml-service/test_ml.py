"""
BuyWise ML Test Suite
Verifies:
1. Expense Categorization Model (TF-IDF + Logistic Regression)
2. Anomaly Detection (Isolation Forest with sufficient data and statistical fallback with insufficient data)
3. Expense Prediction (Linear Regression & Trend Forecasting)
"""
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.categorizer import categorizer
from app.anomaly_detector import anomaly_detector
from app.forecasting import expense_forecaster

def test_categorizer():
    print("\n[TEST 1] Testing Expense Categorizer (TF-IDF + Logistic Regression)...")
    samples = [
        ("Campus canteen lunch meal", "Food"),
        ("Uber cab ride to railway station", "Transport"),
        ("Amazon wireless noise cancelling headphones", "Shopping"),
        ("Semester engineering textbook", "Education"),
        ("Netflix monthly streaming subscription", "Entertainment"),
        ("Airtel fiber broadband bill", "Bills"),
        ("Blinkit fresh milk and eggs", "Groceries"),
        ("Apollo pharmacy paracetamol tablets", "Healthcare"),
    ]

    passed = 0
    for text, expected in samples:
        res = categorizer.predict(text)
        pred = res["category"]
        conf = res["confidence"]
        status = "PASS" if pred == expected else "FAIL"
        if status == "PASS":
            passed += 1
        print(f"  {status}: '{text}' -> {pred} (conf: {conf}, expected: {expected})")

    assert passed >= 6, f"Categorizer passed {passed}/{len(samples)}, expected at least 6"
    print(f"Categorizer Test Passed ({passed}/{len(samples)} correct)!")

def test_anomaly_detector():
    print("\n[TEST 2] Testing Anomaly Detector (Isolation Forest & Fallback)...")
    
    # A. Insufficient data test (< 5 transactions)
    small_txs = [
        {"id": "1", "description": "Tea", "amount": 20, "category": "Food"},
        {"id": "2", "description": "Coffee", "amount": 30, "category": "Food"}
    ]
    res_small = anomaly_detector.detect(small_txs)
    assert res_small["method"] == "insufficient_data", "Failed fallback for < 5 transactions"
    print("  PASS: Insufficient data (<5) handled gracefully with fallback message.")

    # B. Sufficient data test with a clear outlier
    student_txs = [
        {"id": "1", "description": "Canteen meal", "amount": 80, "category": "Food"},
        {"id": "2", "description": "Chai samosa", "amount": 40, "category": "Food"},
        {"id": "3", "description": "Zomato dinner", "amount": 220, "category": "Food"},
        {"id": "4", "description": "Metro recharge", "amount": 100, "category": "Transport"},
        {"id": "5", "description": "Bus ticket", "amount": 30, "category": "Transport"},
        {"id": "6", "description": "Rapido ride", "amount": 50, "category": "Transport"},
        {"id": "7", "description": "Stationery pens", "amount": 60, "category": "Education"},
        {"id": "8", "description": "Photocopy notes", "amount": 40, "category": "Education"},
        {"id": "9", "description": "Luxury Leather Jacket Impulse", "amount": 4500, "category": "Shopping"}, # Outlier!
        {"id": "10", "description": "Snack", "amount": 50, "category": "Food"},
    ]
    res_outlier = anomaly_detector.detect(student_txs)
    assert len(res_outlier["anomalies"]) >= 1, "Isolation Forest should detect the ₹4500 luxury outlier"
    outlier = res_outlier["anomalies"][0]
    print(f"  PASS: Isolation Forest detected outlier -> '{outlier['description']}' (₹{outlier['amount']})")

def test_forecaster():
    print("\n[TEST 3] Testing Expense Forecaster (Linear Regression)...")
    
    # A. Low history test
    res_low = expense_forecaster.forecast([], 30)
    assert res_low["trend"] == "insufficient_data", "Should report insufficient data"
    print("  PASS: Low history reports clear limitation warning.")

    # B. Multi-day series
    txs = [
        {"amount": 150, "date": "2026-11-01T10:00:00Z", "type": "expense"},
        {"amount": 200, "date": "2026-11-02T10:00:00Z", "type": "expense"},
        {"amount": 180, "date": "2026-11-03T10:00:00Z", "type": "expense"},
        {"amount": 220, "date": "2026-11-04T10:00:00Z", "type": "expense"},
        {"amount": 250, "date": "2026-11-05T10:00:00Z", "type": "expense"},
    ]
    res = expense_forecaster.forecast(txs, 30)
    assert res["forecastDailyAverage"] > 0, "Forecast daily average should be positive"
    assert res["forecastTotal"] > 0, "Forecast total should be positive"
    print(f"  PASS: Forecasted Daily Avg: ₹{res['forecastDailyAverage']}, 30-Day Projection: ₹{res['forecastTotal']} (Trend: {res['trend']}, Conf: {res['confidence']})")

if __name__ == "__main__":
    print("=" * 60)
    print("Running BuyWise ML Test Suite")
    print("=" * 60)
    test_categorizer()
    test_anomaly_detector()
    test_forecaster()
    print("\nALL ML TESTS PASSED SUCCESSFULLY! (3/3)")
    print("=" * 60)

