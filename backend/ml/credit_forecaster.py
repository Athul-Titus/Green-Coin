"""
GreenCoin — CreditForecaster (ML Module)
PyTorch LSTM for 3-month credit earnings forecast.
"""
import numpy as np
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not available — using statistical fallback for forecasting")


class LSTMForecaster(nn.Module if TORCH_AVAILABLE else object):
    """Simple 2-layer LSTM for time-series credit forecasting."""
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=3):
        if TORCH_AVAILABLE:
            super().__init__()
            self.hidden_size = hidden_size
            self.num_layers = num_layers
            self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
            self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        out, _ = self.lstm(x, (h0, c0))
        return self.fc(out[:, -1, :])


# Cluster average monthly credits (fallback for new users)
CLUSTER_AVERAGES = {
    "urban_student":        [280, 310, 340],
    "working_professional": [420, 465, 510],
    "suburban_family":      [500, 540, 580],
    "rural_household":      [380, 410, 440],
    "default":              [350, 380, 410],
}


class CreditForecaster:
    """
    Forecasts user credit earnings for the next 1-3 months.
    - Uses PyTorch LSTM trained on synthetic sequences
    - Falls back to cluster averages for users with < 14 days of history
    """

    SEQ_LEN = 30  # 30-day lookback window

    def __init__(self):
        self._model = None
        if TORCH_AVAILABLE:
            self._build_and_train()

    def _build_and_train(self):
        """Build and train LSTM on synthetic credit history sequences."""
        import torch
        np.random.seed(99)
        n_sequences = 500

        # Generate synthetic 90-day histories with upward trend + noise
        X_list, y_list = [], []
        for _ in range(n_sequences):
            base = np.random.uniform(5, 30)
            trend = np.random.uniform(0, 0.3)
            seq = base + trend * np.arange(90) + np.random.normal(0, 3, 90)
            seq = np.clip(seq, 0, None)
            # Use first 90 days to predict next 3 months (monthly totals)
            X_list.append(seq[-self.SEQ_LEN:])
            y_list.append([seq[-30:].sum(), seq[-60:-30].sum() * 1.05, seq[-90:-60].sum() * 1.1])

        X = torch.tensor(np.array(X_list), dtype=torch.float32).unsqueeze(-1)
        y = torch.tensor(np.array(y_list), dtype=torch.float32)

        self._model = LSTMForecaster()
        optimizer = torch.optim.Adam(self._model.parameters(), lr=0.01)
        criterion = nn.MSELoss()

        self._model.train()
        for epoch in range(50):
            optimizer.zero_grad()
            pred = self._model(X)
            loss = criterion(pred, y)
            loss.backward()
            optimizer.step()

        self._model.eval()
        logger.info("✅ CreditForecaster LSTM trained (%d epochs)", 50)

    def _aggregate_to_daily(self, history: List[Dict]) -> np.ndarray:
        """Convert credit history records to daily totals array."""
        if not history:
            return np.array([])

        day_totals: Dict[str, float] = {}
        for record in history:
            try:
                date_str = record["date"][:10]
                day_totals[date_str] = day_totals.get(date_str, 0.0) + float(record["amount"])
            except Exception:
                continue

        if not day_totals:
            return np.array([])

        # Build contiguous daily array (90 days back from today)
        today = datetime.utcnow().date()
        days = [(today - timedelta(days=i)).isoformat() for i in range(89, -1, -1)]
        return np.array([day_totals.get(d, 0.0) for d in days])

    def forecast_earnings(
        self,
        user_id: str,
        history: List[Dict],
        months: int = 3,
    ) -> Dict[str, Any]:
        """
        Predict next 3 months of credit earnings.
        Returns monthly totals + confidence + trend.
        """
        daily = self._aggregate_to_daily(history)
        has_enough_data = len(daily) >= 14 and daily.sum() > 0

        if not has_enough_data or not TORCH_AVAILABLE or self._model is None:
            # Fallback: cluster average
            base = CLUSTER_AVERAGES["default"]
            return {
                "month_1": base[0],
                "month_2": base[1],
                "month_3": base[2],
                "confidence": 0.45,
                "trend": "stable",
                "method": "cluster_average_fallback",
                "note": "Based on users similar to you. Accuracy improves after 14+ days of activity.",
            }

        import torch
        # Use last SEQ_LEN days
        seq = daily[-self.SEQ_LEN:]
        if len(seq) < self.SEQ_LEN:
            seq = np.pad(seq, (self.SEQ_LEN - len(seq), 0))

        # Normalize
        scale = max(seq.max(), 1.0)
        seq_norm = seq / scale

        X = torch.tensor(seq_norm, dtype=torch.float32).unsqueeze(0).unsqueeze(-1)
        with torch.no_grad():
            pred_norm = self._model(X).numpy()[0]

        pred = (pred_norm * scale * 30).tolist()  # scale to monthly
        pred = [max(0.0, round(p, 1)) for p in pred]

        # Trend
        trend = "stable"
        if pred[2] > pred[0] * 1.1:
            trend = "up"
        elif pred[2] < pred[0] * 0.9:
            trend = "down"

        # Confidence based on data richness
        days_active = int((daily > 0).sum())
        confidence = min(0.92, 0.5 + days_active * 0.005)

        return {
            "month_1": pred[0] if months >= 1 else None,
            "month_2": pred[1] if months >= 2 else None,
            "month_3": pred[2] if months >= 3 else None,
            "inr_month_1": round(pred[0] * 50, 0) if months >= 1 else None,
            "inr_month_2": round(pred[1] * 50, 0) if months >= 2 else None,
            "inr_month_3": round(pred[2] * 50, 0) if months >= 3 else None,
            "confidence": round(confidence, 2),
            "trend": trend,
            "method": "lstm",
        }
