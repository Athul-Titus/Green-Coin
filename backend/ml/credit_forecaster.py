"""
GreenCoin — AI Credit Forecaster
Uses Groq Llama 3.1 to predict future credit earnings based on historical patterns.
"""
import logging
from ml.llm_client import ask_llm

logger = logging.getLogger("greencoin.forecaster")

SYSTEM_PROMPT = """You are GreenCoin's Credit Forecasting AI. You analyze a user's
past carbon credit earning history and predict future earnings.

Consider:
- Trend direction (increasing, decreasing, stable)
- Seasonal patterns (monsoon reduces cycling, summer increases solar)
- Consistency of the user's logging habits
- Average daily/weekly earning rates

Return JSON with:
{
  "month_1": <predicted credits for next month>,
  "month_2": <predicted credits for month 2>,
  "month_3": <predicted credits for month 3>,
  "inr_month_1": <month_1 * 50>,
  "inr_month_2": <month_2 * 50>,
  "inr_month_3": <month_3 * 50>,
  "confidence": <0.0 to 1.0>,
  "trend": "<up|down|stable>",
  "method": "llm_analysis",
  "insight": "<1 sentence about the user's earning pattern>"
}"""


class CreditForecaster:
    def forecast_earnings(self, user_id: str, history: list, months: int = 3) -> dict:
        """Forecast future credit earnings using AI analysis."""
        # Summarize history for the LLM (send last 30 entries max)
        recent = history[-30:] if len(history) > 30 else history
        total_credits = sum(h.get("amount", 0) for h in recent)
        num_days = len(set(h.get("date", "")[:10] for h in recent)) or 1

        user_prompt = f"""Forecast credit earnings for this GreenCoin user:
- User ID: {user_id}
- Recent history: {len(recent)} credit records over ~{num_days} active days
- Total recent credits: {total_credits:.1f}
- Average daily credits: {total_credits / num_days:.1f}
- Forecast period: {months} months
- Sample records (last 5): {recent[-5:]}"""

        result = ask_llm(SYSTEM_PROMPT, user_prompt)

        if result and "month_1" in result:
            logger.info(f"AI Forecast: trend={result.get('trend')}, "
                        f"confidence={result.get('confidence')}")
            # Ensure INR values exist
            for i in range(1, months + 1):
                key = f"month_{i}"
                inr_key = f"inr_month_{i}"
                if key in result and inr_key not in result:
                    result[inr_key] = result[key] * 50
            result.setdefault("method", "llm_analysis")
            return result

        # Fallback: simple projection from average
        logger.info("Using fallback forecast")
        daily_avg = total_credits / num_days if num_days > 0 else 10
        monthly = round(daily_avg * 30, 0)
        return {
            "month_1": monthly,
            "month_2": round(monthly * 1.05),
            "month_3": round(monthly * 1.1),
            "inr_month_1": monthly * 50,
            "inr_month_2": round(monthly * 1.05) * 50,
            "inr_month_3": round(monthly * 1.1) * 50,
            "confidence": 0.7,
            "trend": "stable",
            "method": "baseline_fallback",
        }
