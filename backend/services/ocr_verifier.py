"""
GreenCoin — OCR Receipt Verifier Service
Extracts text from receipt images and verifies plant-based purchases.
"""
import hashlib
import base64
import logging
import re
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Keywords indicating plant-based food
PLANT_BASED_KEYWORDS = {
    "tofu", "tempeh", "seitan", "lentil", "dal", "dahl", "chickpea", "chana",
    "rajma", "kidney bean", "black bean", "soybean", "edamame", "paneer",
    "spinach", "kale", "broccoli", "cauliflower", "carrot", "potato", "sweet potato",
    "tomato", "mushroom", "asparagus", "zucchini", "eggplant", "aubergine", "brinjal",
    "lettuce", "cabbage", "capsicum", "pepper", "onion", "garlic", "ginger",
    "banana", "apple", "orange", "mango", "papaya", "avocado", "berries",
    "oats", "quinoa", "millet", "barley", "rice", "pasta", "bread",
    "almond milk", "oat milk", "soy milk", "coconut milk",
    "vegan", "vegetarian", "plant based", "plant-based", "organic",
    "salad", "veggie", "vegetable", "fruit cup",
}

# Keywords that indicate meat (disqualify from plant-based credit)
MEAT_KEYWORDS = {
    "chicken", "beef", "pork", "lamb", "mutton", "fish", "shrimp", "prawn",
    "turkey", "duck", "salmon", "tuna", "egg", "meat", "burger", "steak",
    "sausage", "bacon", "ham", "pepperoni",
}

# Known receipt hashes (dedup store — in production this would be Redis/DB)
_submitted_hashes: set = set()


class OCRVerifier:
    """
    Verifies receipt images for plant-based meal credits.
    
    In DEMO_MODE: returns mock verification without calling Google Vision.
    In production: calls Google Vision API for text extraction.
    """

    def __init__(self, demo_mode: bool = True):
        self.demo_mode = demo_mode

    def _compute_hash(self, image_b64: str) -> str:
        """SHA-256 of raw image data for deduplication."""
        return hashlib.sha256(image_b64.encode()).hexdigest()

    def _extract_text_demo(self, image_b64: str) -> str:
        """Return mock OCR text for demo mode."""
        return """
        GREEN BOWL CAFE
        Koramangala, Bangalore
        Date: 15/01/2024  Time: 13:22
        
        1x Tofu Buddha Bowl        ₹280
        1x Lentil Soup             ₹120
        1x Mixed Vegetable Curry   ₹190
        1x Mango Lassi (no sugar)  ₹90
        
        Subtotal: ₹680
        GST 5%: ₹34
        Total: ₹714
        
        Thank you! Have a green day 🌱
        """

    def _extract_text_google_vision(self, image_b64: str) -> str:
        """Call Google Vision API for OCR (production mode)."""
        import httpx
        from config import settings

        response = httpx.post(
            f"https://vision.googleapis.com/v1/images:annotate?key={settings.GOOGLE_VISION_API_KEY}",
            json={
                "requests": [{
                    "image": {"content": image_b64},
                    "features": [{"type": "TEXT_DETECTION"}],
                }]
            },
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()
        annotations = data.get("responses", [{}])[0].get("textAnnotations", [])
        return annotations[0].get("description", "") if annotations else ""

    def _parse_receipt(self, text: str) -> Dict[str, Any]:
        """Extract structured info from OCR text."""
        text_lower = text.lower()

        plant_based_items = [kw for kw in PLANT_BASED_KEYWORDS if kw in text_lower]
        meat_items = [kw for kw in MEAT_KEYWORDS if kw in text_lower]

        # Extract total amount
        total_amount = 0.0
        total_match = re.search(r'total[:\s]+[₹rs\s]*([\d,]+\.?\d*)', text_lower)
        if total_match:
            total_amount = float(total_match.group(1).replace(",", ""))

        # Extract date
        date_match = re.search(r'\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}', text)
        date_str = date_match.group(0) if date_match else "unknown"

        return {
            "plant_based_items": plant_based_items,
            "meat_items": meat_items,
            "total_amount": total_amount,
            "date": date_str,
            "is_plant_based_dominant": len(plant_based_items) > 0 and len(meat_items) == 0,
        }

    def verify(self, image_b64: str) -> Dict[str, Any]:
        """
        Verify a receipt image for plant-based meal credits.
        
        Returns: {verified, plant_based_items, total_amount, flags}
        """
        global _submitted_hashes
        flags = []

        # Dedup check
        img_hash = self._compute_hash(image_b64)
        if img_hash in _submitted_hashes:
            flags.append("DUPLICATE_RECEIPT_SUBMISSION")
            return {
                "verified": False,
                "plant_based_items": [],
                "total_amount": 0.0,
                "flags": flags,
                "hash": img_hash,
            }
        _submitted_hashes.add(img_hash)

        # OCR
        if self.demo_mode:
            ocr_text = self._extract_text_demo(image_b64)
        else:
            try:
                ocr_text = self._extract_text_google_vision(image_b64)
            except Exception as e:
                logger.error(f"Google Vision API error: {e}")
                flags.append("OCR_API_ERROR")
                ocr_text = ""

        if not ocr_text.strip():
            flags.append("OCR_FAILED_NO_TEXT")
            return {"verified": False, "plant_based_items": [], "total_amount": 0.0, "flags": flags}

        parsed = self._parse_receipt(ocr_text)

        if not parsed["is_plant_based_dominant"]:
            if parsed["meat_items"]:
                flags.append(f"MEAT_ITEMS_DETECTED: {', '.join(parsed['meat_items'][:3])}")
            else:
                flags.append("NO_PLANT_BASED_ITEMS_FOUND")

        return {
            "verified": parsed["is_plant_based_dominant"] and len(flags) == 0,
            "plant_based_items": parsed["plant_based_items"],
            "meat_items": parsed["meat_items"],
            "total_amount": parsed["total_amount"],
            "date": parsed["date"],
            "flags": flags,
            "hash": img_hash,
        }
