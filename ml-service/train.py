"""
BuyWise ML Categorizer Training Script
Trains TF-IDF + Logistic Regression model on labeled synthetic transaction dataset.
Prints classification metrics and saves serialized joblib model.
"""
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.categorizer import categorizer

def main():
    print("=" * 60)
    print("BuyWise Machine Learning Model Training")
    print("Algorithm: TF-IDF Vectorizer + Multinomial Logistic Regression")
    print("=" * 60)

    try:
        results = categorizer.train()
        print(f"\nTraining completed successfully!")
        print(f"Total Samples Trained: {results['samples']}")
        print(f"Accuracy Score:        {results['accuracy'] * 100:.2f}%")
        print(f"Categories Supported:  {', '.join(results['categories'])}")
        print("\nClassification Metrics Summary:")
        for cat, metric in results['metrics'].items():
            if isinstance(metric, dict):
                print(f" - {cat:15}: Precision={metric.get('precision', 0):.2f}, Recall={metric.get('recall', 0):.2f}, F1={metric.get('f1-score', 0):.2f}")
        print("=" * 60)
    except Exception as e:
        print(f"Error during training: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

