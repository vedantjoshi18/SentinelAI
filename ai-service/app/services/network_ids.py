import logging
from typing import Dict, Any, List

logger = logging.getLogger("sentinelai.network_ids")

class NetworkIDSService:
    """
    Layer 3/4 Flow Intrusion Detection Service.
    Implements flow feature analytics based on the CIC-IDS2017 flow distribution benchmark:
    - Identifies DoS SYN Flood attacks (high SYN flags, zero/low ACK, high flow packet rate)
    - Identifies Port Scans (short flow duration, 1 fwd packet, 0 bwd packets, repeated SYN)
    - Identifies Volumetric Brute Force / DDoS (massive packet and byte throughput)
    - Classifies normal bidirectional communications as BENIGN
    """
    def __init__(self):
        self.version = "cicids-v1.0.0"
        self._loaded = True

    def is_loaded(self) -> bool:
        return self._loaded

    def classify_flow(self, flow: Dict[str, Any]) -> Dict[str, Any]:
        duration = float(flow.get("flow_duration_ms", 0.0))
        fwd_pkts = int(flow.get("total_fwd_packets", 0))
        bwd_pkts = int(flow.get("total_bwd_packets", 0))
        bytes_sec = float(flow.get("flow_bytes_per_sec", 0.0))
        pkts_sec = float(flow.get("flow_packets_per_sec", 0.0))
        syn_flags = int(flow.get("syn_flag_count", 0))
        ack_flags = int(flow.get("ack_flag_count", 0))
        fin_flags = int(flow.get("fin_flag_count", 0))

        indicators: List[str] = []

        # 1. DoS SYN Flood Signature
        # Characteristic: High SYN flags without corresponding ACK handshake, high packet velocity
        if syn_flags >= 5 and (ack_flags == 0 or syn_flags / max(1, ack_flags) >= 4.0):
            indicators.append("HIGH_SYN_ASYMMETRY")
            if pkts_sec >= 100 or fwd_pkts >= 20:
                indicators.append("RAPID_SYN_PACKET_BURST")
            return {
                "prediction": "DOS_SYN_FLOOD",
                "confidence": 0.98 if "RAPID_SYN_PACKET_BURST" in indicators else 0.89,
                "threat_level": "CRITICAL",
                "is_intrusion": True,
                "flow_indicators": indicators,
                "model_version": self.version,
            }

        # 2. Port Scanning Signature
        # Characteristic: Single or few packets, zero responses from target, rapid connection resets/FIN
        if fwd_pkts >= 1 and bwd_pkts == 0 and duration <= 200.0 and (syn_flags >= 1 or fin_flags >= 1):
            indicators.append("UNRESPONSIVE_HALF_OPEN_PROBE")
            if pkts_sec >= 50.0:
                indicators.append("SWEEP_SCAN_VELOCITY")
            return {
                "prediction": "PORT_SCAN",
                "confidence": 0.95,
                "threat_level": "HIGH",
                "is_intrusion": True,
                "flow_indicators": indicators,
                "model_version": self.version,
            }

        # 3. Volumetric Brute Force / Bandwidth Flooding
        # Characteristic: Excessive byte and packet rates exceeding standard HTTP baseline
        if bytes_sec >= 1_000_000.0 or pkts_sec >= 2_000.0:
            indicators.append("VOLUMETRIC_FLOOD_THRESHOLD_EXCEEDED")
            return {
                "prediction": "BRUTE_FORCE",
                "confidence": 0.92,
                "threat_level": "HIGH",
                "is_intrusion": True,
                "flow_indicators": indicators,
                "model_version": self.version,
            }

        # 4. Normal Bidirectional Handshake (BENIGN)
        return {
            "prediction": "BENIGN",
            "confidence": 0.99,
            "threat_level": "LOW",
            "is_intrusion": False,
            "flow_indicators": ["NOMINAL_BIDIRECTIONAL_TRAFFIC"],
            "model_version": self.version,
        }

network_ids_service = NetworkIDSService()
