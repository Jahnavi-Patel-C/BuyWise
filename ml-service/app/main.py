from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from app.categorizer import categorizer
from app.anomaly_detector import anomaly_detector
from app.forecasting import expense_forecaster

app = FastAPI(
    title="BuyWise Machine Learning Microservice",
    description="Expense Categorization (TF-IDF + Logistic Regression), Unusual Spending Detection (Isolation Forest), and Expense Forecasting (Linear Regression)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CategoryRequest(BaseModel):
    description: str

class TransactionItem(BaseModel):
    id: Optional[str] = None
    description: Optional[str] = ""
    amount: float
    category: Optional[str] = "Other"
    date: Optional[str] = None
    type: Optional[str] = "expense"

class AnomalyRequest(BaseModel):
    transactions: List[TransactionItem]

class ForecastRequest(BaseModel):
    transactions: List[TransactionItem]
    days: Optional[int] = 30

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "BuyWise ML Service",
        "models": {
            "categorizer": "TF-IDF + Logistic Regression (Active)",
            "anomaly_detector": "Isolation Forest (Active)",
            "forecaster": "Linear Regression (Active)"
        }
    }

@app.post("/predict-category")
def predict_category(req: CategoryRequest):
    return categorizer.predict(req.description)

@app.post("/detect-anomalies")
def detect_spending_anomalies(req: AnomalyRequest):
    txs = [t.model_dump() for t in req.transactions]
    return anomaly_detector.detect(txs)

@app.post("/forecast-expenses")
def forecast_spending(req: ForecastRequest):
    txs = [t.model_dump() for t in req.transactions]
    return expense_forecaster.forecast(txs, horizon_days=req.days or 30)

@app.post("/train")
def train_categorizer():
    try:
        metrics = categorizer.train()
        return {"success": True, "message": "Categorizer trained successfully", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

