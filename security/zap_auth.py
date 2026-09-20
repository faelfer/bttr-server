#!/usr/bin/env python3
"""Create and remove the temporary account used by the authenticated ZAP scan."""

import json
import os
import sys
import time
import urllib.error
import urllib.request

API = os.environ.get("BTTR_API", "http://api:8000")
PASSWORD = "!ZapSecurity1"


def call(method, path, body=None, token=None, expected=200):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Token " + token
    request = urllib.request.Request(
        API + path,
        data=None if body is None else json.dumps(body).encode(),
        headers=headers,
        method=method,
    )
    try:
        response = urllib.request.urlopen(request, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    content = response.read().decode()
    if response.status != expected:
        raise RuntimeError(
            f"{method} {path}: esperado HTTP {expected}, recebido {response.status}: {content}"
        )
    return json.loads(content) if content else None


def create():
    suffix = str(time.time_ns())
    account = {
        "username": "zap-" + suffix,
        "email": f"zap-{suffix}@example.com",
        "password": PASSWORD,
    }
    call("POST", "/users/sign_up", account)
    login = call(
        "POST",
        "/users/sign_in",
        {"email": account["email"], "password": account["password"]},
    )
    token = login["token"]
    profile = call("GET", "/users/profile", token=token)
    if profile["user"]["email"] != account["email"]:
        raise RuntimeError("o token temporário não autenticou a conta criada")
    print(token)


def delete():
    token = os.environ.get("ZAP_AUTH_TOKEN")
    if not token:
        raise RuntimeError("ZAP_AUTH_TOKEN não foi informado para excluir a conta")
    call("DELETE", "/users/profile", token=token)


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {"create", "delete"}:
        raise SystemExit("uso: zap_auth.py create|delete")
    if sys.argv[1] == "create":
        create()
    else:
        delete()
