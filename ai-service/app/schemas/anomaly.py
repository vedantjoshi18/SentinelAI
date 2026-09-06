from pydantic import BaseModel, Field
from typing import Dict


class AnomalyRequest(BaseModel):
    request_frequency: float = Field(
        ...,
        ge=0.0,
        description="Requests per minute (overall request velocity)",
        examples=[12.5, 120.0],
    )
    burst_frequency: float = Field(
        ...,
        ge=0.0,
        description="Peak requests within a 10-second sliding window",
        examples=[2.0, 35.0],
    )
    failed_auth_count: int = Field(
        default=0,
        ge=0,
        description="Count of consecutive failed authentication attempts",
        examples=[0, 7],
    )
    error_4xx_rate: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Proportion of HTTP 4xx client errors (0.0 to 1.0)",
        examples=[0.02, 0.85],
    )
    path_entropy: float = Field(
        default=1.0,
        ge=0.0,
        description="Unique endpoint diversity / distinct paths visited in session",
        examples=[3.0, 45.0],
    )
    avg_interval_ms: float = Field(
        default=5000.0,
        ge=0.0,
        description="Mean inter-request arrival interval in milliseconds",
        examples=[6500.0, 120.0],
    )


class AnomalyResponse(BaseModel):
    is_anomaly: bool = Field(
        ...,
        description="Binary classification from Isolation Forest (-1 maps to True, 1 maps to False)",
        examples=[False, True],
    )
    anomaly_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Calibrated severity score between 0.0 (benign normal) and 1.0 (highly anomalous)",
        examples=[0.08, 0.94],
    )
    raw_score: float = Field(
        ...,
        description="Raw decision function score from Isolation Forest (negative indicates anomaly)",
        examples=[0.142, -0.185],
    )
    anomaly_level: str = Field(
        ...,
        description="Qualitative threat level: NORMAL, SUSPICIOUS, or CRITICAL",
        examples=["NORMAL", "CRITICAL"],
    )
    modelVersion: str = Field(
        ...,
        description="Identifier of the behavioral anomaly model",
        examples=["behaviour-model-v1"],
    )
    features: Dict[str, float] = Field(
        ...,
        description="Input behavioral telemetry values evaluated",
    )
