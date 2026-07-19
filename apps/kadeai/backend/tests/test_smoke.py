from fastapi.testclient import TestClient

import asyncio

from main import _run_module, app, core_settings


def test_health_is_public_and_json():
    response = TestClient(app).get('/health')
    assert response.status_code == 200
    assert response.headers['content-type'].startswith('application/json')
    assert response.json()['status'] == 'ok'
    assert response.json() == {'status': 'ok'}
    assert response.headers['cache-control'] == 'no-store'
    assert response.headers['x-content-type-options'] == 'nosniff'


def test_protected_route_fails_closed_without_token():
    response = TestClient(app).post('/video/silence-cut', json={'video_path': 'missing.mp4'})
    assert response.status_code in {401, 503}


def test_protected_route_rejects_oversized_and_unsupported_requests(monkeypatch):
    monkeypatch.setattr(core_settings, 'backend_token', 'unit-test-token')
    client = TestClient(app)
    headers = {'Authorization': 'Bearer unit-test-token'}
    oversized = client.post('/silence-cut', headers={**headers, 'Content-Length': str(2 * 1024 * 1024 + 1)}, json={'video_path': 'x'})
    assert oversized.status_code == 413
    unsupported = client.post('/silence-cut', headers={**headers, 'Content-Type': 'text/plain'}, content='x')
    assert unsupported.status_code == 415


def test_valid_token_still_confines_media_paths(monkeypatch, tmp_path):
    monkeypatch.setattr(core_settings, 'backend_token', 'unit-test-token')
    monkeypatch.setattr(core_settings, 'media_root', tmp_path.resolve())
    response = TestClient(app).post(
        '/silence-cut',
        headers={'Authorization': 'Bearer unit-test-token'},
        json={'video_path': str(tmp_path.parent / 'outside.mp4')},
    )
    assert response.status_code == 403
    assert 'outside the configured media root' in response.json()['detail']


def test_module_timeout_is_bounded_and_error_is_generic(monkeypatch):
    monkeypatch.setattr(core_settings, 'provider_timeout_seconds', 0.01)

    async def slow_provider():
        await asyncio.sleep(0.1)

    with TestClient(app) as _:
        try:
            asyncio.run(_run_module(slow_provider))
            raise AssertionError('timeout was not enforced')
        except Exception as exc:
            assert getattr(exc, 'status_code', None) == 504
            assert getattr(exc, 'detail', None) == 'Processing timed out.'
