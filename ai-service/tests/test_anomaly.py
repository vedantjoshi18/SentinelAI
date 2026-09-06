import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.anomaly import anomaly_service


@pytest.fixture(scope="module")
def client():
    # Ensure artifacts are loaded for tests
    anomaly_service.load_artifacts()
    with TestClient(app) as test_client:
        yield test_client


class TestAnomalyDetection:
    """Test suite for Phase 9 Behavioral Anomaly Detection API."""

    def test_benign_normal_user_behavior(self, client):
        """Should classify normal human browsing patterns as non-anomalous."""
        payload = {
            "request_frequency": 12.0,
            "burst_frequency": 2.0,
            "failed_auth_count": 0,
            "error_4xx_rate": 0.02,
            "path_entropy": 3.0,
            "avg_interval_ms": 6500.0,
        }

        res = client.post("/anomaly", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["is_anomaly"] is False
        assert data["anomaly_level"] == "NORMAL"
        assert data["anomaly_score"] < 0.40
        assert data["raw_score"] > 0.0
        assert data["modelVersion"] == "behaviour-model-v1"
        assert data["features"]["request_frequency"] == 12.0

    def test_brute_force_credential_stuffing_anomaly(self, client):
        """Should detect aggressive brute force login attempts as CRITICAL anomaly."""
        payload = {
            "request_frequency": 160.0,
            "burst_frequency": 30.0,
            "failed_auth_count": 25,
            "error_4xx_rate": 0.88,
            "path_entropy": 1.0,
            "avg_interval_ms": 250.0,
        }

        res = client.post("/anomaly", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["is_anomaly"] is True
        assert data["anomaly_level"] in ["CRITICAL", "SUSPICIOUS"]
        assert data["anomaly_score"] >= 0.70
        assert data["raw_score"] < 0.0

    def test_directory_fuzzing_scanner_anomaly(self, client):
        """Should detect automated endpoint crawling with massive 404s and high entropy."""
        payload = {
            "request_frequency": 280.0,
            "burst_frequency": 55.0,
            "failed_auth_count": 0,
            "error_4xx_rate": 0.96,
            "path_entropy": 80.0,
            "avg_interval_ms": 120.0,
        }

        res = client.post("/anomaly", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["is_anomaly"] is True
        assert data["anomaly_score"] >= 0.75
        assert data["anomaly_level"] == "CRITICAL"

    def test_api_flooding_denial_of_service(self, client):
        """Should detect rapid API request velocity spikes."""
        payload = {
            "request_frequency": 550.0,
            "burst_frequency": 110.0,
            "failed_auth_count": 0,
            "error_4xx_rate": 0.25,
            "path_entropy": 2.0,
            "avg_interval_ms": 45.0,
        }

        res = client.post("/anomaly", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert data["is_anomaly"] is True
        assert data["anomaly_score"] >= 0.75

    def test_api_prefix_route_alias(self, client):
        """POST /api/anomaly should function identically to /anomaly."""
        payload = {
            "request_frequency": 8.0,
            "burst_frequency": 1.0,
            "failed_auth_count": 0,
            "error_4xx_rate": 0.01,
            "path_entropy": 2.0,
            "avg_interval_ms": 7000.0,
        }

        res = client.post("/api/anomaly", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["is_anomaly"] is False
        assert data["anomaly_level"] == "NORMAL"

    def test_reject_negative_frequency(self, client):
        """Should reject negative request_frequency with 422 Unprocessable Entity."""
        res = client.post("/anomaly", json={"request_frequency": -10.0, "burst_frequency": 1.0})
        assert res.status_code == 422

    def test_reject_invalid_error_rate_greater_than_one(self, client):
        """Should reject error_4xx_rate > 1.0 with 422."""
        payload = {
            "request_frequency": 10.0,
            "burst_frequency": 2.0,
            "error_4xx_rate": 1.85,
        }
        res = client.post("/anomaly", json=payload)
        assert res.status_code == 422

    def test_reject_negative_failed_auth(self, client):
        """Should reject negative failed_auth_count with 422."""
        payload = {
            "request_frequency": 10.0,
            "burst_frequency": 2.0,
            "failed_auth_count": -5,
        }
        res = client.post("/anomaly", json=payload)
        assert res.status_code == 422

    def test_health_reports_both_models_loaded(self, client):
        """Health endpoint should report both attack and anomaly models loaded."""
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["modelLoaded"] is True
        assert data["attackModelLoaded"] is True
        assert data["anomalyModelLoaded"] is True
        assert data["anomalyModelVersion"] == "behaviour-model-v1"
