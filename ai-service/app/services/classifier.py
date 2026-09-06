import logging
from typing import Dict, Tuple, Optional
from pathlib import Path
import joblib
from app.config import settings

logger = logging.getLogger("sentinelai.classifier")


class AttackClassifierService:
    _instance: Optional["AttackClassifierService"] = None

    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.classes = []
        self._is_loaded = False
        self.load_artifacts()

    @classmethod
    def get_instance(cls) -> "AttackClassifierService":
        if cls._instance is None:
            cls._instance = AttackClassifierService()
        return cls._instance

    def load_artifacts(self) -> bool:
        """Loads serialized model and vectorizer from disk into memory once."""
        model_path: Path = settings.ATTACK_MODEL_PATH
        vec_path: Path = settings.ATTACK_VECTORIZER_PATH

        if not model_path.exists():
            logger.error(f"Attack model artifact not found at: {model_path}")
            self._is_loaded = False
            return False

        if not vec_path.exists():
            logger.error(f"Vectorizer artifact not found at: {vec_path}")
            self._is_loaded = False
            return False

        try:
            logger.info(f"Loading vectorizer from {vec_path}...")
            self.vectorizer = joblib.load(vec_path)
            logger.info(f"Loading model from {model_path}...")
            self.model = joblib.load(model_path)
            self.classes = list(self.model.classes_)
            self._is_loaded = True
            logger.info(f"Attack Classifier loaded successfully. Classes: {self.classes}")
            return True
        except Exception as e:
            logger.error(f"Failed to load attack classifier artifacts: {str(e)}")
            self._is_loaded = False
            return False

    def is_loaded(self) -> bool:
        return self._is_loaded

    def predict(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """
        Executes TF-IDF feature extraction and inference on input string.
        Returns (threatType, confidence, per_class_probabilities).
        """
        if not self._is_loaded:
            raise RuntimeError("Attack classifier model is not loaded.")

        # Transform input
        vec_input = self.vectorizer.transform([text])

        # Inference
        pred_label = str(self.model.predict(vec_input)[0])
        probabilities = self.model.predict_proba(vec_input)[0]

        prob_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(self.classes, probabilities)
        }

        confidence = round(float(max(probabilities)), 4)

        return pred_label, confidence, prob_dict


# Global service singleton accessor
classifier_service = AttackClassifierService.get_instance()