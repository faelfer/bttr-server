#!/usr/bin/env python3
"""Smoke test executado localmente e pelo Jenkins contra a imagem do mock."""

import json
import os
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen


BASE_URL = os.getenv("BTTR_MOCK_API", "http://localhost:8090").rstrip("/")
TOKEN = "Token mock-access-token"


def request(path, method="GET", payload=None, expected=200, authenticated=True, headers=None):
    request_headers = {"Accept": "application/json"}
    if authenticated:
        request_headers["Authorization"] = TOKEN
    if payload is not None:
        request_headers["Content-Type"] = "application/json"
    if headers:
        request_headers.update(headers)
    body = json.dumps(payload).encode() if payload is not None else None
    http_request = Request(
        f"{BASE_URL}{path}", data=body, headers=request_headers, method=method
    )
    try:
        with urlopen(http_request, timeout=10) as response:
            status = response.status
            response_headers = response.headers
            raw = response.read()
    except HTTPError as error:
        status = error.code
        response_headers = error.headers
        raw = error.read()

    if status != expected:
        print(
            f"{method} {path}: esperado HTTP {expected}, recebido {status}: "
            f"{raw.decode(errors='replace')}",
            file=sys.stderr,
        )
        raise AssertionError(f"status inesperado em {method} {path}")

    parsed = json.loads(raw) if raw else None
    return parsed, response_headers


def reset_scenarios():
    request(
        "/__admin/scenarios/reset",
        method="POST",
        authenticated=False,
    )


def main():
    health, _ = request("/mock/health", authenticated=False)
    assert health == {"status": "UP", "service": "bttr-api-mock", "version": "1.0"}

    mappings, _ = request("/__admin/mappings", authenticated=False)
    assert len(mappings["mappings"]) >= 40

    _, cors_headers = request(
        "/skills/skills_from_user",
        method="OPTIONS",
        expected=204,
        authenticated=False,
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert cors_headers["Access-Control-Allow-Origin"] == "*"
    assert "Authorization" in cors_headers["Access-Control-Allow-Headers"]

    request("/users/profile", expected=401, authenticated=False)
    request(
        "/users/sign_in",
        method="POST",
        payload={"email": "invalid@example.com", "password": "invalid"},
        expected=401,
        authenticated=False,
    )
    request(
        "/users/sign_up",
        method="POST",
        payload={
            "username": "Duplicate",
            "email": "duplicate@example.com",
            "password": "Mock@123",
        },
        expected=409,
        authenticated=False,
    )
    sign_in, _ = request(
        "/users/sign_in",
        method="POST",
        payload={"email": "mock.user@bttr.local", "password": "Mock@123"},
        authenticated=False,
    )
    assert sign_in["token"] == "mock-access-token"
    profile, _ = request("/users/profile")
    assert profile["user"]["email"] == "mock.user@bttr.local"

    reset_scenarios()
    skills, _ = request("/skills/skills_from_user")
    assert [skill["name"] for skill in skills["skills"]] == ["Java"]
    request(
        "/skills/create_skill",
        method="POST",
        payload={"name": "Kotlin", "daily": 60},
    )
    skills, _ = request("/skills/skills_from_user")
    assert [skill["name"] for skill in skills["skills"]] == ["Kotlin", "Java"]
    request(
        "/skills/update_skill_by_id/2",
        method="PUT",
        payload={"name": "Quarkus", "daily": 90},
    )
    skill, _ = request("/skills/skill_by_id/2")
    assert skill["skill"]["name"] == "Quarkus"
    request("/skills/delete_skill_by_id/2", method="DELETE")
    skills, _ = request("/skills/skills_by_page?page=1")
    assert skills["count"] == 1 and skills["results"][0]["name"] == "Java"

    reset_scenarios()
    times, _ = request("/times/times_by_page?page=1")
    assert times["count"] == 1 and times["results"][0]["minutes"] == 30
    request(
        "/times/create_time",
        method="POST",
        payload={"skill_id": 1, "minutes": 60},
    )
    times, _ = request(
        "/times/times_by_date?skill_id=1"
        "&date_initial=2026-01-01T00%3A00%3A00Z"
        "&date_final=2026-01-31T23%3A59%3A59Z"
    )
    assert [time["id"] for time in times["times"]] == [2, 1]
    request(
        "/times/update_time_by_id/2",
        method="PUT",
        payload={"skill_id": 1, "minutes": 90},
    )
    time, _ = request("/times/time_by_id/2")
    assert time["time"]["minutes"] == 90
    request("/times/delete_time_by_id/2", method="DELETE")
    times, _ = request("/times/times_by_page?page=1")
    assert times["count"] == 1 and times["results"][0]["id"] == 1

    request("/not-configured", expected=404, authenticated=False)
    reset_scenarios()
    print("Mock API smoke test: OK")


if __name__ == "__main__":
    main()
