from fastapi import APIRouter, status
from app.schemas.network import NetworkFlowRequest, NetworkFlowResponse
from app.services.network_ids import network_ids_service

router = APIRouter(prefix="/network", tags=["Network IDS"])

@router.post("/flow", response_model=NetworkFlowResponse, status_code=status.HTTP_200_OK)
def analyze_network_flow(request: NetworkFlowRequest):
    result = network_ids_service.classify_flow(request.model_dump())
    return NetworkFlowResponse(
        success=True,
        **result,
    )
