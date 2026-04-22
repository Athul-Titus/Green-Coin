"""
GreenCoin — GreenAdvisor (ML Module)
K-Means user segmentation + collaborative-filtering-style action ranking.
"""
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


CLUSTER_LABELS = {
    0: "urban_student",
    1: "working_professional",
    2: "suburban_family",
    3: "rural_household",
}

CLUSTER_STATS = {
    "urban_student": {
        "avg_monthly_credits": 320,
        "avg_monthly_inr": 16000,
        "top_earner_monthly_credits": 800,
        "percentile": 45,
        "best_actions": ["cycling_commute", "public_transport", "plant_based_meal"],
    },
    "working_professional": {
        "avg_monthly_credits": 480,
        "avg_monthly_inr": 24000,
        "top_earner_monthly_credits": 1200,
        "percentile": 55,
        "best_actions": ["ev_charging", "plant_based_meal", "solar_energy"],
    },
    "suburban_family": {
        "avg_monthly_credits": 560,
        "avg_monthly_inr": 28000,
        "top_earner_monthly_credits": 1400,
        "percentile": 60,
        "best_actions": ["solar_energy", "composting", "ev_charging"],
    },
    "rural_household": {
        "avg_monthly_credits": 420,
        "avg_monthly_inr": 21000,
        "top_earner_monthly_credits": 900,
        "percentile": 50,
        "best_actions": ["solar_energy", "composting", "plant_based_meal"],
    },
}

ACTION_TIPS = {
    "cycling_commute": {
        "difficulty": "medium",
        "tip": "Start with 2 days/week and build up. Keep your bike maintained and a helmet ready.",
    },
    "public_transport": {
        "difficulty": "easy",
        "tip": "Download your city's transit app. Monthly pass saves money and hassle.",
    },
    "plant_based_meal": {
        "difficulty": "easy",
        "tip": "Start with one vegetarian lunch per day. Dal, chana, or paneer dishes earn full credits.",
    },
    "solar_energy": {
        "difficulty": "hard",
        "tip": "Connect to GreenCoin smart meter integration to auto-log your kWh daily.",
    },
    "composting": {
        "difficulty": "easy",
        "tip": "Use a balcony compost bin. Vegetable peels, coffee grounds, and paper scraps all count.",
    },
    "ev_charging": {
        "difficulty": "medium",
        "tip": "Log your charging sessions directly from your EV's app or smart charger.",
    },
    "led_switch": {
        "difficulty": "easy",
        "tip": "One-time 20-credit bonus. Replace all incandescent bulbs — takes 15 minutes.",
    },
    "no_flight": {
        "difficulty": "hard",
        "tip": "Next time you plan to fly under 500 km, try the overnight train instead.",
    },
}

ACTION_RATES = {
    "cycling_commute": 4, "public_transport": 2, "plant_based_meal": 5,
    "solar_energy": 10, "composting": 3, "ev_charging": 8,
    "led_switch": 20, "no_flight": 50,
}

# Feasibility scores by cluster (0-1, higher = more feasible)
FEASIBILITY = {
    "urban_student":       {"cycling_commute": 0.9, "public_transport": 0.95, "plant_based_meal": 0.8,
                            "solar_energy": 0.1, "composting": 0.5, "ev_charging": 0.2, "led_switch": 0.9, "no_flight": 0.6},
    "working_professional":{"cycling_commute": 0.7, "public_transport": 0.8, "plant_based_meal": 0.7,
                            "solar_energy": 0.6, "composting": 0.6, "ev_charging": 0.8, "led_switch": 0.9, "no_flight": 0.7},
    "suburban_family":     {"cycling_commute": 0.5, "public_transport": 0.5, "plant_based_meal": 0.7,
                            "solar_energy": 0.9, "composting": 0.9, "ev_charging": 0.8, "led_switch": 0.9, "no_flight": 0.5},
    "rural_household":     {"cycling_commute": 0.4, "public_transport": 0.3, "plant_based_meal": 0.8,
                            "solar_energy": 0.95, "composting": 0.95, "ev_charging": 0.4, "led_switch": 0.8, "no_flight": 0.3},
}


class GreenAdvisor:
    """
    Recommends green actions based on user segment.
    Uses K-Means to cluster users → then ranks actions by credit_yield × feasibility.
    """

    def __init__(self):
        self._kmeans = None
        self._scaler = None
        self._train()

    def _profile_to_features(self, profile: Dict[str, Any]) -> np.ndarray:
        """Convert lifestyle profile dict to feature vector."""
        commute_map = {"walk": 0, "cycling": 1, "public_transport": 2, "car": 3, "wfh": 0}
        diet_map = {"vegan": 0, "vegetarian": 1, "flexitarian": 2, "omnivore": 3}
        energy_map = {"solar": 0, "partial_solar": 1, "grid": 2}
        neighborhood_map = {"urban": 0, "suburban": 1, "rural": 2}

        return np.array([[
            commute_map.get(profile.get("commute", "car"), 3),
            diet_map.get(profile.get("diet", "omnivore"), 3),
            energy_map.get(profile.get("energy", "grid"), 2),
            neighborhood_map.get(profile.get("neighborhood_type", "urban"), 0),
        ]])

    def _train(self):
        """Fit KMeans on synthetic user profiles (4 distinct clusters)."""
        np.random.seed(0)
        n_per_cluster = 200

        # Synthetic data representing 4 user segments
        urban_students       = np.random.normal([1, 1, 2, 0], 0.3, (n_per_cluster, 4))
        working_professionals= np.random.normal([2, 2, 1, 0], 0.4, (n_per_cluster, 4))
        suburban_families    = np.random.normal([3, 1, 1, 1], 0.4, (n_per_cluster, 4))
        rural_households     = np.random.normal([3, 1, 0, 2], 0.3, (n_per_cluster, 4))

        X = np.vstack([urban_students, working_professionals, suburban_families, rural_households])
        X = np.clip(X, 0, 3)

        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        self._kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
        self._kmeans.fit(X_scaled)
        logger.info("✅ GreenAdvisor KMeans fitted with %d samples", len(X))

    def _get_cluster(self, profile: Dict[str, Any]) -> str:
        """Predict user cluster from lifestyle profile."""
        features = self._profile_to_features(profile)
        X_scaled = self._scaler.transform(features)
        cluster_id = int(self._kmeans.predict(X_scaled)[0])
        return CLUSTER_LABELS.get(cluster_id, "working_professional")

    def generate_plan(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate personalized action plan.
        Returns top 5 actions ranked by (credit_yield × feasibility).
        """
        cluster = self._get_cluster(profile)
        feasibility = FEASIBILITY.get(cluster, FEASIBILITY["working_professional"])

        # Rank all actions by score
        scored = []
        for action_code, rate in ACTION_RATES.items():
            feasibility_score = feasibility.get(action_code, 0.5)
            # Estimate monthly yield: rate × avg_quantity × 30_days × feasibility
            avg_quantities = {
                "cycling_commute": 5, "public_transport": 10, "plant_based_meal": 2,
                "solar_energy": 3, "composting": 0.5, "ev_charging": 5,
                "led_switch": 0.05, "no_flight": 0.1,
            }
            monthly_credits = rate * avg_quantities.get(action_code, 1) * 30 * feasibility_score
            score = monthly_credits * feasibility_score

            tip_info = ACTION_TIPS.get(action_code, {})
            scored.append({
                "action_type": action_code,
                "projected_monthly_credits": round(monthly_credits, 1),
                "projected_monthly_inr": round(monthly_credits * 50, 0),
                "difficulty_level": tip_info.get("difficulty", "medium"),
                "getting_started_tip": tip_info.get("tip", ""),
                "feasibility_score": round(feasibility_score, 2),
                "_score": score,
            })

        scored.sort(key=lambda x: x["_score"], reverse=True)
        recommendations = [{k: v for k, v in r.items() if k != "_score"} for r in scored[:5]]

        total_projected = sum(r["projected_monthly_credits"] for r in recommendations)

        return {
            "cluster": cluster,
            "recommendations": recommendations,
            "projected_monthly_credits": round(total_projected, 1),
            "projected_monthly_inr": round(total_projected * 50, 0),
        }

    def get_cluster_stats(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Return peer statistics for user's cluster."""
        cluster = self._get_cluster(profile)
        stats = CLUSTER_STATS.get(cluster, CLUSTER_STATS["working_professional"]).copy()
        stats["label"] = cluster
        return stats
