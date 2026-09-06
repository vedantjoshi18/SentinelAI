from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict


class PredictionRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Application request input or payload string to evaluate",
        examples=["SELECT * FROM users WHERE id = 1", "' OR '1'='1"],
    )

    @field_validator("text")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Payload text must not be empty or whitespace only")
        return v


class PredictionResponse(BaseModel):
    threatType: str = Field(
        ...,
        description="Classified threat category (NORMAL, SQL_INJECTION, XSS, COMMAND_INJECTION, PATH_TRAVERSAL)",
        examples=["SQL_INJECTION"],
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model prediction confidence score between 0.0 and 1.0",
        examples=[0.9985],
    )
    modelVersion: str = Field(
        ...,
        description="Identifier of the model used to perform inference",
        examples=["attack-classifier-v1"],
    )
    probabilities: Optional[Dict[str, float]] = Field(
        default=None,
        description="Per-class probability distribution across all supported threat categories",
    )