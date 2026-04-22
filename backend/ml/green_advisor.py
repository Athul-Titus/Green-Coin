class GreenAdvisor:
    def __init__(self):
        pass

    def generate_plan(self, profile):
        return {
            "cluster": "urban_eco_warrior",
            "recommendations": [
                {
                    "action_type": "cycling_commute",
                    "projected_monthly_credits": 120.0,
                    "projected_monthly_inr": 6000.0,
                    "difficulty_level": "medium",
                    "getting_started_tip": "Start by trying a 2km ride twice a week.",
                    "feasibility_score": 88
                }
            ],
            "projected_monthly_credits": 120.0,
        }

    def get_cluster_stats(self, profile):
        return {
            "label": "urban_eco_warrior",
            "avg_monthly_credits": 100.0,
            "avg_monthly_inr": 5000.0,
            "top_earner_monthly_credits": 200.0,
            "percentile": 60
        }
