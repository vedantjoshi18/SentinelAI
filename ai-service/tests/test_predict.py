from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)


def test_health_check_status_and_model():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["modelLoaded"] is True
    assert data["modelVersion"] == settings.ATTACK_MODEL_VERSION


def test_predict_normal_input():
    payload = {"text": "laptop accessories with usb-c cable"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threatType"] == "NORMAL"
    assert 0.0 <= data["confidence"] <= 1.0
    assert data["confidence"] > 0.70
    assert data["modelVersion"] == settings.ATTACK_MODEL_VERSION
    assert "probabilities" in data


def test_predict_sql_injection_tautology():
    payload = {"text": "1' OR '1'='1"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threatType"] == "SQL_INJECTION"
    assert data["confidence"] > 0.90


def test_predict_sql_injection_union():
    payload = {"text": "-5622\" where 7970=7970 union all select 1,2--"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threatType"] == "SQL_INJECTION"
    assert data["confidence"] > 0.90


def test_predict_xss_script_tag():
    payload = {"text": "<script>alert('XSS')</script>"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threatType"] == "XSS"
    assert data["confidence"] > 0.90


def test_predict_xss_img_onerror():
    payload = {"text": "<img src=x onerror=alert(1)>"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threatType"] == "XSS"
    assert data["confidence"] > 0.90


def test_predict_path_traversal():
    payload = {"text": "/../../../../../../../../../../../../etc/passwd"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threatType"] == "PATH_TRAVERSAL"
    assert data["confidence"] > 0.90


def test_predict_command_injection():
    payload = {"text": "| cat /etc/passwd"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threatType"] == "COMMAND_INJECTION"
    assert data["confidence"] > 0.90


def test_reject_empty_payload():
    payload = {"text": ""}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"] == "Request validation failed"


def test_reject_whitespace_only_payload():
    payload = {"text": "   "}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False


def test_reject_missing_text_field():
    payload = {}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False


def test_api_prefix_route():
    payload = {"text": "1' OR '1'='1"}
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threatType"] == "SQL_INJECTION"