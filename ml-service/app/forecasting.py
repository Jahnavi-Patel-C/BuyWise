import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

class ExpenseForecaster:
    def forecast(self, transactions, horizon_days=30):
        if not transactions or len(transactions) < 3:
            return {
                "forecastDailyAverage": 0,
                "forecastTotal": 0,
                "trend": "insufficient_data",
                "slope": 0.0,
                "confidence": 0.3,
                "limitation": "Prediction confidence is low due to limited transaction history (less than 3 transactions)."
            }

        df = pd.DataFrame(transactions)
        
        # Filter expense transactions
        if 'type' in df.columns:
            df = df[df['type'] == 'expense']

        if len(df) < 3:
            return {
                "forecastDailyAverage": 0,
                "forecastTotal": 0,
                "trend": "no_expenses",
                "slope": 0.0,
                "confidence": 0.3,
                "limitation": "No sufficient expense history to model daily velocity."
            }

        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date']).sort_values('date')

        if len(df) == 0:
            return {
                "forecastDailyAverage": 0,
                "forecastTotal": 0,
                "trend": "no_valid_dates",
                "slope": 0.0,
                "confidence": 0.3
            }

        # Daily aggregations
        daily = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
        daily['day_idx'] = np.arange(len(daily))

        # Fit Linear Regression on daily progression
        X = daily[['day_idx']].values
        y = daily['amount'].values

        reg = LinearRegression()
        reg.fit(X, y)
        slope = float(reg.coef_[0])

        avg_daily = float(np.mean(y))
        
        # Projected daily spend with trend damping to avoid extreme runaways
        trend_adjusted_daily = max(50.0, avg_daily + slope * min(5, len(daily) / 4))
        projected_total = round(trend_adjusted_daily * horizon_days)

        trend_label = "stable"
        if slope > 15:
            trend_label = "accelerating_spending"
        elif slope < -15:
            trend_label = "cooling_down"

        # Confidence based on historical data volume
        confidence = min(0.90, max(0.40, 0.40 + (len(df) / 40.0) * 0.50))

        return {
            "forecastDailyAverage": round(trend_adjusted_daily),
            "forecastTotal": projected_total,
            "trend": trend_label,
            "slope": round(slope, 2),
            "confidence": round(confidence, 2),
            "history_days_analyzed": len(daily),
            "history_transactions_count": len(df),
            "limitation": "Linear extrapolation assumes consistent student spending patterns and may not account for one-time semester fees."
        }

expense_forecaster = ExpenseForecaster()

