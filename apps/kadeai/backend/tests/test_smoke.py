from fastapi.testclient import TestClient

from main import app


def test_health_is_public_and_json():
    response = TestClient(app).get('/health')
    assert response.status_code == 200
    assert response.headers['content-type'].startswith('application/json')
    assert response.json()['status'] == 'ok'


def test_protected_route_fails_closed_without_token():
    response = TestClient(app).post('/video/silence-cut', json={'video_path': 'missing.mp4'})
    assert response.status_code in {401, 503}
