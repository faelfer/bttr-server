#!/usr/bin/env python3
"""Teste real: iniciar Compose e API antes de executar. Usa somente a biblioteca padrão."""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

API = os.environ.get("BTTR_API", "http://localhost:8000")
MAILPIT = os.environ.get("MAILPIT_API", "http://localhost:8025")


def call(method, path, body=None, token=None, expected=200):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Token " + token
    request = urllib.request.Request(API + path, data=None if body is None else json.dumps(body).encode(),
                                     headers=headers, method=method)
    try:
        response = urllib.request.urlopen(request, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    content = response.read().decode()
    assert response.status == expected, f"{method} {path}: esperado {expected}, recebido {response.status}: {content}"
    return json.loads(content) if content else None


def main():
    suffix = str(time.time_ns())
    password = "!Ab1!Ab1"
    accounts = []
    try:
        for label in ("alice", "bob"):
            email = f"{label}-{suffix}@example.com"
            username = f"{label}-{suffix}"
            call("POST", "/users/sign_up", {"username": username, "email": email, "password": password})
            login = call("POST", "/users/sign_in", {"email": email, "password": password})
            assert login["user"]["email"] == email and "password" not in login["user"]
            accounts.append({"token": login["token"], "email": email, "username": username})
        alice, bob = accounts
        token = alice["token"]
        call("GET", "/users/profile", expected=401)
        call("GET", "/users/profile", token="invalid-token", expected=401)
        parts = token.split(".")
        parts[2] = ("A" if parts[2][0] != "A" else "B") + parts[2][1:]
        call("GET", "/users/profile", token=".".join(parts), expected=401)
        call("POST", "/users/sign_in", {"email": alice["email"], "password": "wrong"}, expected=401)
        call("GET", "/users/profile", token=token)
        call("PATCH", "/users/profile", {"username": alice["username"] + "-new", "email": alice["email"]}, token)
        call("PATCH", "/users/profile", {"username": alice["username"] + "-new", "email": bob["email"]}, token, 409)
        for i in range(6):
            call("POST", "/skills/create_skill", {"name": f"Java {i}", "daily": "30"}, token)
        page = call("GET", "/skills/skills_by_page", token=token)
        assert page["count"] == 6 and len(page["results"]) == 5 and page["next"].endswith("page=2")
        assert len(call("GET", "/skills/skills_by_page?page=2", token=token)["results"]) == 1
        skill = call("GET", "/skills/skills_from_user", token=token)["skills"][0]["id"]
        call("GET", f"/skills/skill_by_id/{skill}", token=token)
        call("GET", f"/skills/skill_by_id/{skill}", token=bob["token"], expected=404)
        call("PUT", f"/skills/update_skill_by_id/{skill}", {"name": "Quarkus", "daily": "60"}, token)
        call("POST", "/skills/create_skill", {"name": "quarkus", "daily": 30}, token, 409)
        call("POST", "/times/create_time", {"skill_id": str(skill), "minutes": "20"}, bob["token"], 404)
        call("POST", "/times/create_time", {"skill_id": str(skill), "minutes": "20"}, token)
        entry = call("GET", "/times/times_by_page", token=token)["results"][0]
        assert entry["skill"]["name"] == "Quarkus"
        entry_id = entry["id"]
        call("GET", f"/times/time_by_id/{entry_id}", token=token)
        call("GET", f"/times/time_by_id/{entry_id}", token=bob["token"], expected=404)
        call("PUT", f"/times/update_time_by_id/{entry_id}", {"skill_id": skill, "minutes": "45"}, token)
        now = datetime.now(timezone.utc)
        query = urllib.parse.urlencode({"skill_id": skill, "date_initial": (now - timedelta(days=1)).isoformat(),
                                       "date_final": (now + timedelta(days=1)).isoformat()})
        assert call("GET", "/times/times_by_date?" + query, token=token)["times"][0]["minutes"] == 45
        call("POST", "/users/redefine_password", {"password": password, "new_password": "!Ab2!Ab2"}, token)
        login = call("POST", "/users/sign_in", {"email": alice["email"], "password": "!Ab2!Ab2"})
        alice["token"] = token = login["token"]
        call("POST", "/users/sign_in", {"email": alice["email"], "password": password}, expected=401)
        call("POST", "/users/forgot_password", {"email": alice["email"]})
        call("POST", "/users/forgot_password", {"email": f"absent-{suffix}@example.com"})
        with urllib.request.urlopen(MAILPIT + "/api/v1/messages", timeout=10) as response:
            messages = json.load(response)["messages"]
        message = next(m for m in messages if any(r["Address"] == alice["email"] for r in m["To"]))
        with urllib.request.urlopen(MAILPIT + "/api/v1/message/" + message["ID"], timeout=10) as response:
            mail = json.load(response)
        assert "/login-actions/action-token?" in (mail.get("HTML", "") + mail.get("Text", ""))
        call("DELETE", f"/times/delete_time_by_id/{entry_id}", token=token)
        call("POST", "/times/create_time", {"skill_id": skill, "minutes": 15}, token)
        call("DELETE", f"/skills/delete_skill_by_id/{skill}", token=token)
        assert call("GET", "/times/times_by_page", token=token)["count"] == 0
    finally:
        original_failure = sys.exc_info()[0] is not None
        cleanup_errors = []
        for account in accounts:
            try:
                call("DELETE", "/users/profile", token=account["token"])
                call("GET", "/skills/skills_from_user", token=account["token"], expected=401)
            except Exception as error:
                cleanup_errors.append(str(error))
        if cleanup_errors:
            if original_failure:
                print("Falha adicional na limpeza das contas de teste: " + "; ".join(cleanup_errors), file=sys.stderr)
            else:
                raise AssertionError("Falha na limpeza das contas: " + "; ".join(cleanup_errors))
    print("OK: 20 endpoints, Keycloak real, isolamento, paginação, senhas, cascatas e e-mail no Mailpit.")


if __name__ == "__main__":
    main()
