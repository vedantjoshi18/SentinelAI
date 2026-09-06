from pydantic import BaseModel, Field
from typing import List

class NetworkFlowRequest(BaseModel):
    flow_duration_ms: float = Field(..., ge=0.0, description="Total duration of bidirectional flow in milliseconds")
    total_fwd_packets: int = Field(..., ge=0, description="Total packets in the forward direction")
    total_bwd_packets: int = Field(..., ge=0, description="Total packets in the backward direction")
    flow_bytes_per_sec: float = Field(..., ge=0.0, description="Flow throughput in bytes per second")
    flow_packets_per_sec: float = Field(..., ge=0.0, description="Flow packet rate per second")
    syn_flag_count: int = Field(0, ge=0, description="Number of packets with SYN flag set")
    ack_flag_count: int = Field(0, ge=0, description="Number of packets with ACK flag set")
    fin_flag_count: int = Field(0, ge=0, description="Number of packets with FIN flag set")

class NetworkFlowResponse(BaseModel):
    success: bool = True
    prediction: str = Field(..., description="Classification category: BENIGN, DOS_SYN_FLOOD, PORT_SCAN, BRUTE_FORCE")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Classifier confidence probability")
    threat_level: str = Field(..., description="Threat severity level: LOW, MEDIUM, HIGH, CRITICAL")
    is_intrusion: bool = Field(..., description="True if flow indicates malicious network intrusion")
    flow_indicators: List[str] = Field(default_factory=list, description="Diagnostic risk signals identified in flow")
    model_version: str = Field("cicids-v1.0.0", description="Network IDS model version identifier")
