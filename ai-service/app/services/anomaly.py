import logging
from typing import Dict, Tuple, Optional
from pathlib import Path
import numpy as np
import joblib
from app.config import settings

logger = logging.getLogger("sentinelai.anomaly")

FEATURE_ORDER = [
    "request_frequency",
    "burst_frequency",
    "failed_auth_count",
    "error_4xx_rate",
    "path_entropy",
    "avg_interval_ms",
]


class AnomalyDetectorService:
    _instance: Optional["AnomalyDetectorService"] = None

    def __init__(self):
        self.model = None
        self.scaler = None
        self.meta = {}
        self._is_loaded = False
        self.load_artifacts()

    @classmethod
    def get_instance(cls) -> "AnomalyDetectorService":
        if cls._instance is None:
            cls._instance = AnomalyDetectorService()
        return cls._instance

    def load_artifacts(self) -> bool:
        """Loads serialized Isolation Forest model, scaler, and metadata into memory."""
        model_path: Path = settings.ANOMALY_MODEL_PATH
        scaler_path: Path = settings.ANOMALY_SCALER_PATH
        meta_path: Path = settings.ANOMALY_META_PATH

        if not model_path.exists():
            logger.error(f"Anomaly model artifact not found at: {model_path}")
            self._is_loaded = False
            return False

        if not scaler_path.exists():
            logger.error(f"Scaler artifact not found at: {scaler_path}")
            self._is_loaded = False
            return False

        try:
            logger.info(f"Loading scaler from {scaler_path}...")
            self.scaler = joblib.load(scaler_path)
            logger.info(f"Loading model from {model_path}...")
            self.model = joblib.load(model_path)
            if meta_path.exists():
                self.meta = joblib.load(meta_path)
            self._is_loaded = True
            logger.info("Behavioral Anomaly Detector loaded successfully.")
            return True
        except Exception as e:
            logger.error(f"Failed to load anomaly detector artifacts: {str(e)}")
            self._is_loaded = False
            return False

    def is_loaded(self) -> bool:
        return self._is_loaded

    def predict(self, features: Dict[str, float]) -> Tuple[bool, float, float, str]:
        """
        Executes behavioral anomaly detection inference.
        Returns:
            (is_anomaly: bool, anomaly_score: float, raw_score: float, anomaly_level: str)
        """
        if not self._is_loaded:
            raise RuntimeError("Behavioral anomaly detector model is not loaded.")

        # Order features according to training pipeline
        feature_vector = np.array([
            [float(features.get(f_name, 0.0)) for f_name in FEATURE_ORDER]
        ])

        # Standardize features
        scaled_vector = self.scaler.transform(feature_vector)

        # Raw prediction: -1 = anomaly, 1 = normal
        pred_label = self.model.predict(scaled_vector)[0]
        raw_score = float(self.model.decision_function(scaled_vector)[0])
        is_anomaly = bool(pred_label == -1)

        # Calibrate raw decision score into standardized 0.0–1.0 severity score
        if raw_score >= 0.0:
            calibrated_score = float(max(0.0, min(0.35, 0.35 * (1.0 - raw_score / 0.20))))
        else:
            calibrated_score = float(min(1.0, 0.50 + (abs(raw_score) / 0.025) * 0.50))

        # Qualitative threat categorization
        if calibrated_score >= 0.70:
            anomaly_level = "CRITICAL"
        elif calibrated_score >= 0.35:
            anomaly_level = "SUSPICIOUS"
        else:
            anomaly_level = "NORMAL"

        return is_anomaly, round(calibrated_score, 4), round(raw_score, 4), anomaly_level


# Global service singleton accessor
anomaly_service = AnomalyDetectorService.get_instance()
