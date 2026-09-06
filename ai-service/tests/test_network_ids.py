from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestNetworkIDS:
    def test_benign_normal_flow(self):
        payload = {
            "flow_duration_ms": 1250.0,
            "total_fwd_packets": 12,
            "total_bwd_packets": 15,
            "flow_bytes_per_sec": 4500.0,
            "flow_packets_per_sec": 21.6,
            "syn_flag_count": 1,
            "ack_flag_count": 27,
            "fin_flag_count": 2,
        }
        res = client.post("/network/flow", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["prediction"] == "BENIGN"
        assert data["threat_level"] == "LOW"
        assert data["is_intrusion"] is False
        assert data["confidence"] >= 0.95

    def test_dos_syn_flood_detection(self):
        payload = {
            "flow_duration_ms": 500.0,
            "total_fwd_packets": 150,
            "total_bwd_packets": 0,
            "flow_bytes_per_sec": 12000.0,
            "flow_packets_per_sec": 300.0,
            "syn_flag_count": 150,
            "ack_flag_count": 0,
            "fin_flag_count": 0,
        }
        res = client.post("/network/flow", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["prediction"] == "DOS_SYN_FLOOD"
        assert data["threat_level"] == "CRITICAL"
        assert data["is_intrusion"] is True
        assert "HIGH_SYN_ASYMMETRY" in data["flow_indicators"]
        assert "RAPID_SYN_PACKET_BURST" in data["flow_indicators"]

    def test_port_scan_sweep_detection(self):
        payload = {
            "flow_duration_ms": 15.0,
            "total_fwd_packets": 1,
            "total_bwd_packets": 0,
            "flow_bytes_per_sec": 60.0,
            "flow_packets_per_sec": 66.0,
            "syn_flag_count": 1,
            "ack_flag_count": 0,
            "fin_flag_count": 0,
        }
        res = client.post("/network/flow", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["prediction"] == "PORT_SCAN"
        assert data["threat_level"] == "HIGH"
        assert data["is_intrusion"] is True
        assert "UNRESPONSIVE_HALF_OPEN_PROBE" in data["flow_indicators"]

    def test_volumetric_bandwidth_flooding(self):
        payload = {
            "flow_duration_ms": 1000.0,
            "total_fwd_packets": 5000,
            "total_bwd_packets": 100,
            "flow_bytes_per_sec": 5_000_000.0,
            "flow_packets_per_sec": 5100.0,
            "syn_flag_count": 2,
            "ack_flag_count": 2,
            "fin_flag_count": 0,
        }
        res = client.post("/network/flow", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["prediction"] == "BRUTE_FORCE"
        assert data["threat_level"] == "HIGH"
        assert data["is_intrusion"] is True

    def test_api_prefix_route(self):
        payload = {
            "flow_duration_ms": 1000.0,
            "total_fwd_packets": 5,
            "total_bwd_packets": 5,
            "flow_bytes_per_sec": 1000.0,
            "flow_packets_per_sec": 10.0,
            "syn_flag_count": 1,
            "ack_flag_count": 10,
            "fin_flag_count": 2,
        }
        res = client.post("/api/network/flow", json=payload)
        assert res.status_code == 200
        assert res.json()["prediction"] == "BENIGN"

    def test_reject_negative_flow_metrics(self):
        payload = {
            "flow_duration_ms": -10.0,
            "total_fwd_packets": -5,
            "total_bwd_packets": 0,
            "flow_bytes_per_sec": 100.0,
            "flow_packets_per_sec": 10.0,
        }
        res = client.post("/network/flow", json=payload)
        assert res.status_code == 422

    def test_health_reports_network_ids_loaded(self):
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["networkIdsLoaded"] is True
        assert data["networkIdsVersion"] == "cicids-v1.0.0"
