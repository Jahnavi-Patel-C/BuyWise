import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_TIMEOUT = 3500; // 3.5s timeout for fast fallback

// Keyword-based deterministic fallback for categorization
const KEYWORD_CATEGORY_MAP = [
  { category: 'Food', keywords: ['swiggy', 'zomato', 'canteen', 'mess', 'biryani', 'pizza', 'burger', 'chai', 'coffee', 'starbucks', 'mcdonalds', 'kfc', 'lunch', 'dinner', 'breakfast', 'snack', 'cafe', 'restaurant', 'dosa', 'roll', 'subway'] },
  { category: 'Transport', keywords: ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'irctc', 'auto', 'fuel', 'petrol', 'diesel', 'cab', 'ticket', 'flight'] },
  { category: 'Groceries', keywords: ['blinkit', 'zepto', 'instamart', 'bigbasket', 'grocery', 'supermarket', 'dmart', 'vegetables', 'milk', 'bread', 'ration'] },
  { category: 'Bills', keywords: ['electricity', 'water', 'wifi', 'broadband', 'recharge', 'jio', 'airtel', 'vi', 'bill', 'maintenance', 'lpg', 'gas'] },
  { category: 'Education', keywords: ['books', 'course', 'udemy', 'coursera', 'exam', 'tuition', 'college', 'xerox', 'stationery', 'library', 'fee', 'notes', 'printout'] },
  { category: 'Entertainment', keywords: ['netflix', 'spotify', 'movie', 'cinema', 'pvr', 'inox', 'prime', 'game', 'steam', 'concert', 'event', 'hotstar'] },
  { category: 'Shopping', keywords: ['amazon', 'flipkart', 'myntra', 'zara', 'clothes', 'shoes', 'electronics', 'headphones', 'gadget', 'tshirt', 'jeans', 'watch'] },
  { category: 'Healthcare', keywords: ['pharmacy', 'medicine', 'doctor', 'hospital', 'clinic', 'apollo', '1mg', 'tablets', 'dentist', 'health'] },
];

export async function predictCategory(description) {
  if (!description || typeof description !== 'string') {
    return { category: 'Other', confidence: 1.0, source: 'fallback_default' };
  }

  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict-category`,
      { description },
      { timeout: ML_TIMEOUT }
    );
    if (response.data && response.data.category) {
      return {
        category: response.data.category,
        confidence: response.data.confidence || 0.85,
        source: 'ml_model',
      };
    }
  } catch (err) {
    // Graceful fallback to rule-based keyword classification
    // console.log('[ML Client] Service unavailable, using keyword fallback');
  }

  const cleanText = description.toLowerCase();
  for (const mapping of KEYWORD_CATEGORY_MAP) {
    if (mapping.keywords.some((kw) => cleanText.includes(kw))) {
      return { category: mapping.category, confidence: 0.9, source: 'rule_fallback' };
    }
  }

  return { category: 'Other', confidence: 0.5, source: 'rule_fallback' };
}

export async function detectAnomalies(transactions) {
  if (!Array.isArray(transactions) || transactions.length < 5) {
    return {
      anomalies: [],
      method: 'insufficient_data',
      message: 'Need at least 5 transactions for anomaly detection',
    };
  }

  try {
    const payload = transactions.map((t) => ({
      id: t._id ? t._id.toString() : t.id,
      description: t.description,
      amount: Number(t.amount),
      category: t.category,
      date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
    }));

    const response = await axios.post(
      `${ML_SERVICE_URL}/detect-anomalies`,
      { transactions: payload },
      { timeout: ML_TIMEOUT }
    );
    if (response.data && Array.isArray(response.data.anomalies)) {
      return {
        anomalies: response.data.anomalies,
        method: 'isolation_forest',
        stats: response.data.stats,
      };
    }
  } catch (err) {
    // console.log('[ML Client] Isolation Forest service unavailable, applying statistical fallback');
  }

  // Statistical Fallback: Category Z-Score Anomaly Detection
  // Group by category, compute mean and std deviation
  const categoryStats = {};
  transactions.forEach((t) => {
    const cat = t.category || 'Other';
    if (!categoryStats[cat]) categoryStats[cat] = [];
    categoryStats[cat].push(Number(t.amount));
  });

  const anomalyIds = new Set();
  const anomalyDetails = [];

  Object.entries(categoryStats).forEach(([cat, amounts]) => {
    if (amounts.length >= 3) {
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      transactions
        .filter((t) => t.category === cat)
        .forEach((t) => {
          const zScore = stdDev > 0 ? (Number(t.amount) - mean) / stdDev : 0;
          if (zScore > 2.0 && Number(t.amount) > 500) {
            anomalyIds.add(t._id ? t._id.toString() : t.id);
            anomalyDetails.push({
              id: t._id ? t._id.toString() : t.id,
              description: t.description,
              amount: Number(t.amount),
              category: cat,
              reason: `Unusually high for ${cat} (mean: ₹${Math.round(mean)}, +${zScore.toFixed(1)}σ)`,
            });
          }
        });
    }
  });

  return {
    anomalies: anomalyDetails,
    method: 'statistical_zscore',
    message: 'Evaluated using statistical category deviation fallback',
  };
}

export async function forecastExpenses(transactions, days = 30) {
  if (!Array.isArray(transactions) || transactions.length < 3) {
    return {
      forecastDailyAverage: 0,
      forecastTotal: 0,
      trend: 'stable',
      confidence: 0.3,
      method: 'insufficient_history',
    };
  }

  try {
    const payload = transactions.map((t) => ({
      amount: Number(t.amount),
      date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
      type: t.type,
    }));

    const response = await axios.post(
      `${ML_SERVICE_URL}/forecast-expenses`,
      { transactions: payload, days },
      { timeout: ML_TIMEOUT }
    );
    if (response.data) {
      return response.data;
    }
  } catch (err) {
    // Fallback to time-weighted moving average
  }

  const expenses = transactions.filter((t) => t.type === 'expense');
  if (expenses.length === 0) {
    return {
      forecastDailyAverage: 0,
      forecastTotal: 0,
      trend: 'stable',
      confidence: 0.4,
      method: 'baseline_zero',
    };
  }

  // Calculate day range in transactions
  const dates = expenses.map((t) => new Date(t.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const spanDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const dailyAvg = totalExpense / spanDays;

  return {
    forecastDailyAverage: Math.round(dailyAvg),
    forecastTotal: Math.round(dailyAvg * days),
    trend: dailyAvg > 300 ? 'elevated' : 'moderate',
    confidence: Math.min(0.85, 0.4 + (expenses.length / 50) * 0.45),
    method: 'statistical_moving_average',
  };
}

