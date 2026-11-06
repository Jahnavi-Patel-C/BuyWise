import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self, contamination=0.08):
        self.contamination = contamination

    def detect(self, transactions):
        """
        Detect unusual spending transactions using Isolation Forest.
        If transactions < 5, uses statistical fallback.
        """
        if not transactions or len(transactions) < 5:
            return {
                "anomalies": [],
                "method": "insufficient_data",
                "message": "At least 5 transactions required for anomaly detection"
            }

        df = pd.DataFrame(transactions)
        
        # Ensure numerical amount
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
        
        # Category mean amounts for deviation feature
        cat_means = df.groupby('category')['amount'].transform('mean')
        df['cat_deviation'] = df['amount'] - cat_means
        df['ratio_to_mean'] = df['amount'] / (cat_means.replace(0, 1))

        # Feature matrix: [amount, cat_deviation, ratio_to_mean]
        features = df[['amount', 'cat_deviation', 'ratio_to_mean']].values

        try:
            # Dynamically adjust contamination to prevent over-flagging on small student datasets
            contam = min(0.15, max(0.04, 1.0 / len(df)))
            iso = IsolationForest(contamination=contam, random_state=42)
            preds = iso.fit_predict(features)
            scores = iso.decision_function(features)

            anomalies = []
            for i, pred in enumerate(preds):
                # Isolation Forest marks anomalies as -1
                # Ensure we only flag significant expenses (e.g. > 300) so a ₹20 chai isn't flagged as outlier
                if pred == -1 and df.iloc[i]['amount'] > 350:
                    item = df.iloc[i]
                    anomalies.append({
                        "id": str(item.get('id', i)),
                        "description": item.get('description', 'Unknown item'),
                        "amount": float(item['amount']),
                        "category": str(item.get('category', 'Other')),
                        "anomaly_score": round(float(scores[i]), 3),
                        "reason": f"Unusually high for {item.get('category')}: ₹{item['amount']} (Avg: ₹{round(cat_means.iloc[i], 1)})"
                    })

            return {
                "anomalies": anomalies,
                "method": "isolation_forest",
                "total_evaluated": len(df),
                "anomaly_count": len(anomalies)
            }
        except Exception as e:
            # Fallback to simple statistical IQR / Z-score
            mean = df['amount'].mean()
            std = df['amount'].std()
            anomalies = []
            for i, row in df.iterrows():
                if std > 0 and (row['amount'] - mean) / std > 2.0 and row['amount'] > 400:
                    anomalies.append({
                        "id": str(row.get('id', i)),
                        "description": row.get('description', 'Unknown item'),
                        "amount": float(row['amount']),
                        "category": str(row.get('category', 'Other')),
                        "reason": f"Statistically elevated transaction (+{round((row['amount'] - mean) / std, 1)}σ)"
                    })

            return {
                "anomalies": anomalies,
                "method": "statistical_zscore_fallback",
                "total_evaluated": len(df),
                "anomaly_count": len(anomalies)
            }

anomaly_detector = AnomalyDetector()

