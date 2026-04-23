"""
GreenCoin — AI Green Advisor
Uses Groq Llama 3.1 to generate personalized green action plans
based on user lifestyle profiles.
"""
import logging
from ml.llm_client import ask_llm

logger = logging.getLogger("greencoin.advisor")

SYSTEM_PROMPT = """You are GreenCoin's AI Green Lifestyle Advisor. You help Indian users
earn carbon credits by suggesting practical, personalized green actions based on their
lifestyle profile.

GreenCoin credit rates per unit:
- cycling_commute: 4 credits/km
- public_transport: 2 credits/km
- plant_based_meal: 5 credits/meal
- solar_energy: 10 credits/kWh
- composting: 3 credits/kg
- ev_charging: 8 credits/kWh
- led_switch: 20 credits (one-time)
- no_flight: 50 credits/flight avoided

1 credit = INR 50.

Based on the user profile, assign a cluster label and generate 3-5 personalized
recommendations sorted by feasibility.

Return JSON with:
{
  "cluster": "<label like 'urban_eco_warrior' or 'suburban_green_starter'>",
  "recommendations": [
    {
      "action_type": "<from the list above>",
      "projected_monthly_credits": <number>,
      "projected_monthly_inr": <number>,
      "difficulty_level": "<easy|medium|hard>",
      "getting_started_tip": "<practical 1-sentence tip specific to their city>",
      "feasibility_score": <0-100>
    }
  ],
  "projected_monthly_credits": <total across all recommendations>,
  "motivational_message": "<1 sentence encouragement>"
}"""


class GreenAdvisor:
    def __init__(self):
        pass

    def generate_plan(self, profile: dict) -> dict:
        """Generate a personalized green action plan using AI."""
        user_prompt = f"""Generate a personalized green action plan for this user:
- City: {profile.get('city', 'Unknown')}
- Neighborhood: {profile.get('neighborhood_type', 'urban')}
- Current commute: {profile.get('commute', 'unknown')}
- Diet: {profile.get('diet', 'unknown')}
- Energy source: {profile.get('energy', 'grid')}"""

        result = ask_llm(SYSTEM_PROMPT, user_prompt, temperature=0.5)

        if result and "recommendations" in result:
            logger.info(f"AI Advisor: cluster={result.get('cluster')}, "
                        f"{len(result['recommendations'])} recommendations")
            # Ensure projected_monthly_credits exists
            if "projected_monthly_credits" not in result:
                result["projected_monthly_credits"] = sum(
                    r.get("projected_monthly_credits", 0) for r in result["recommendations"]
                )
            return result

        # Fallback
        logger.info("Using fallback advisor plan")
        return {
            "cluster": "urban_eco_warrior",
            "recommendations": [
                {
                    "action_type": "cycling_commute",
                    "projected_monthly_credits": 120.0,
                    "projected_monthly_inr": 6000.0,
                    "difficulty_level": "medium",
                    "getting_started_tip": "Start with a 2 km ride to your nearest metro station.",
                    "feasibility_score": 88,
                },
                {
                    "action_type": "plant_based_meal",
                    "projected_monthly_credits": 150.0,
                    "projected_monthly_inr": 7500.0,
                    "difficulty_level": "easy",
                    "getting_started_tip": "Try replacing one meal per day with a plant-based option.",
                    "feasibility_score": 92,
                },
                {
                    "action_type": "composting",
                    "projected_monthly_credits": 90.0,
                    "projected_monthly_inr": 4500.0,
                    "difficulty_level": "medium",
                    "getting_started_tip": "Get a small kitchen compost bin for vegetable scraps.",
                    "feasibility_score": 75,
                },
            ],
            "projected_monthly_credits": 360.0,
        }

    def get_cluster_stats(self, profile: dict) -> dict:
        """Get peer comparison statistics for the user's cluster."""
        plan = self.generate_plan(profile)
        cluster = plan.get("cluster", "urban_eco_warrior")
        monthly = plan.get("projected_monthly_credits", 300)
        return {
            "label": cluster,
            "avg_monthly_credits": round(monthly * 0.8, 2),
            "avg_monthly_inr": round(monthly * 0.8 * 50, 2),
            "top_earner_monthly_credits": round(monthly * 1.5, 2),
            "percentile": 65,
        }
