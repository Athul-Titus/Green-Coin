"""
GreenCoin — AI Fraud Detector
Uses Groq Llama 3.1 to detect suspicious patterns in green action submissions.
"""
import logging
from ml.llm_client import ask_llm

logger = logging.getLogger("greencoin.fraud")

SYSTEM_PROMPT = """You are GreenCoin's Fraud Detection AI. You analyze green action
submissions and flag suspicious patterns.

Red flags to check:
- Impossibly high quantities (e.g. 100 km cycling in one session)
- Rapid-fire submissions (many actions within minutes)
- Inconsistent proof data (e.g. GPS shows no movement but claims cycling)
- Duplicate or templated proof data
- Actions at unusual times (e.g. solar energy at night)
- Quantities that are exact round numbers repeatedly

Return JSON with:
{
  "is_fraud": <true or false>,
  "confidence": <0.0 to 1.0>,
  "flags": [<list of specific warning strings>],
  "risk_level": "<low|medium|high|critical>",
  "reasoning": "<brief explanation>"
}"""


class FraudDetector:
    def detect_fraud(self, action_data: dict) -> tuple:
        """
        Analyze an action for fraud indicators.
        Returns: (is_fraud: bool, flags: list)
        """
        user_prompt = f"""Analyze this action submission for fraud:
- Action type: {action_data.get('action_type', 'unknown')}
- Quantity: {action_data.get('quantity', 0)}
- Timestamp: {action_data.get('timestamp', 'unknown')}
- Proof data: {action_data.get('proof_data', {})}
- User ID: {action_data.get('user_id', 'unknown')}"""

        result = ask_llm(SYSTEM_PROMPT, user_prompt)

        if result and "is_fraud" in result:
            logger.info(f"AI Fraud Check: fraud={result['is_fraud']}, "
                        f"risk={result.get('risk_level', 'unknown')}")
            return result.get("is_fraud", False), result.get("flags", [])

        # Fallback: assume legitimate
        return False, []
