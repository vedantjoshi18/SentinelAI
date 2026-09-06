from fastapi import APIRouter, HTTPException, status
from app.schemas.anomaly import AnomalyRequest, AnomalyResponse
from app.services.anomaly import anomaly_service
from app.config import settings

router = APIRouter(tags=["Behavioral Anomaly Detection"])


@router.post(
    "/anomaly",
    response_model=AnomalyResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect Behavioral Telemetry Anomaly",
    description="Evaluates user behavioral telemetry (velocity, burst frequency, failed authentication, error rates, path diversity) using an unsupervised Isolation Forest.",
)
def detect_anomaly(request: AnomalyRequest) -> AnomalyResponse:
    if not anomaly_service.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Behavioral anomaly detector model is currently unavailable or initializing.",
        )

    try:
        features = request.model_dump()
        is_anomaly, anomaly_score, raw_score, level = anomaly_service.predict(features)

        return AnomalyResponse(
            is_anomaly=is_anomaly,
            anomaly_score=anomaly_score,
            raw_score=raw_score,
            anomaly_level=level,
            modelVersion=settings.ANOMALY_MODEL_VERSION,
            features=features,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )
