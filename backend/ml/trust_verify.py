"""
GreenCoin — AI Trust Verifier
Uses Groq Llama 3.1 to evaluate whether a logged green action is legitimate.
Outputs a trust_score (0-100) and fraud flags.
"""
import logging
from ml.llm_client import ask_llm

logger = logging.getLogger("greencoin.trust")

SYSTEM_PROMPT = """You are GreenCoin's Trust Verification AI. Your job is to evaluate
whether a user's claimed green action is legitimate and reasonable.

Consider these factors:
- Is the quantity physically possible for the action type in one session?
- Does the time of day make sense? (e.g. cycling at 3 AM is suspicious)
- Are there any obvious red flags in the proof data?
- Is the action type consistent with the claimed quantity?

Reasonable daily limits:
- cycling_commute: max 60 km/day
- public_transport: max 100 km/day
- plant_based_meal: max 3 meals/day
- solar_energy: max 50 kWh/day for residential
- composting: max 10 kg/day for household
- ev_charging: max 80 kWh/day
- led_switch: 1 per day (one-time)
- no_flight: 1 per month

Return JSON with:
{
  "trust_score": <integer 0-100>,
  "flags": [<list of string warnings, empty if clean>],
  "reasoning": "<brief explanation>"
}"""


class TrustVerifier:
    def verify_action(self, action_data: dict) -> dict:
        """
        Evaluate an action's trustworthiness using AI.
        Falls back to a reasonable default if the LLM call fails.
        """
        user_prompt = f"""Evaluate this green action:
- Action type: {action_data.get('action_type', 'unknown')}
- Quantity: {action_data.get('quantity', 0)}
- Timestamp: {action_data.get('timestamp', 'unknown')}
- Proof data: {action_data.get('proof_data', {})}
- User ID: {action_data.get('user_id', 'unknown')}"""

        result = ask_llm(SYSTEM_PROMPT, user_prompt)

        if result and "trust_score" in result:
            logger.info(f"AI Trust Score: {result['trust_score']} | Flags: {result.get('flags', [])}")
            return {
                "trust_score": int(result["trust_score"]),
                "flags": result.get("flags", []),
            }

        # Fallback: reasonable default
        logger.info("Using fallback trust score")
        return {"trust_score": 82, "flags": []}
