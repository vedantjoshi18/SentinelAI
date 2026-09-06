from fastapi import APIRouter, HTTPException, status
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.classifier import classifier_service
from app.config import settings

router = APIRouter(tags=["Attack Classification"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify Application Payload Attack Type",
    description="Analyzes input text payload using TF-IDF and trained multi-class classifier to predict threat category and confidence.",
)
def predict_threat(request: PredictionRequest) -> PredictionResponse:
    if not classifier_service.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Attack classifier model is currently unavailable or initializing.",
        )

    try:
        threat_type, confidence, prob_dict = classifier_service.predict(request.text)

        return PredictionResponse(
            threatType=threat_type,
            confidence=confidence,
            modelVersion=settings.ATTACK_MODEL_VERSION,
            probabilities=prob_dict,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )