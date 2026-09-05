import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    PROJECT_NAME: str = "SentinelAI AI Service"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("AI_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("AI_PORT", "8000"))
    ATTACK_MODEL_VERSION: str = os.getenv("AI_MODEL_VERSION", "attack-classifier-v1")
    ANOMALY_MODEL_VERSION: str = os.getenv("ANOMALY_MODEL_VERSION", "behaviour-model-v1")

    ATTACK_MODEL_PATH: Path = BASE_DIR / "app" / "models" / "attack_classifier" / "model.joblib"
    ATTACK_VECTORIZER_PATH: Path = BASE_DIR / "app" / "models" / "attack_classifier" / "vectorizer.joblib"
    ANOMALY_MODEL_PATH: Path = BASE_DIR / "app" / "models" / "anomaly_detector" / "model.joblib"

settings = Settings()
