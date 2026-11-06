import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

MODEL_FILE = os.path.join(os.path.dirname(__file__), 'model_categorizer.joblib')
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'synthetic_transactions.csv')

class ExpenseCategorizer:
    def __init__(self):
        self.model = None
        self.load_or_train()

    def train(self, data_path=None):
        path = data_path or DATA_FILE
        if not os.path.exists(path):
            raise FileNotFoundError(f"Training data not found at {path}")

        df = pd.read_csv(path)
        X = df['description'].fillna('')
        y = df['category']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.15, random_state=42, stratify=y
        )

        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True, token_pattern=r'(?u)\b\w+\b')),
            ('clf', LogisticRegression(max_iter=1000, C=5.0, class_weight='balanced', random_state=42))
        ])

        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

        # Save model
        joblib.dump(pipeline, MODEL_FILE)
        self.model = pipeline

        return {
            "accuracy": round(float(acc), 4),
            "samples": len(df),
            "categories": list(pipeline.classes_),
            "metrics": report
        }

    def load_or_train(self):
        if os.path.exists(MODEL_FILE):
            try:
                self.model = joblib.load(MODEL_FILE)
            except Exception as e:
                print(f"[Categorizer] Error loading model: {e}. Retraining...")
                self.train()
        else:
            self.train()

    def predict(self, description: str):
        if not description or not description.strip():
            return {"category": "Other", "confidence": 0.5}

        if self.model is None:
            self.load_or_train()

        try:
            probs = self.model.predict_proba([description])[0]
            max_idx = probs.argmax()
            predicted_class = self.model.classes_[max_idx]
            confidence = round(float(probs[max_idx]), 3)

            return {
                "category": predicted_class,
                "confidence": confidence,
                "classes": list(self.model.classes_)
            }
        except Exception as e:
            print(f"[Categorizer] Prediction error: {e}")
            return {"category": "Other", "confidence": 0.5}

categorizer = ExpenseCategorizer()
