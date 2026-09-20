#!/bin/sh
set -eu

: "${CI_UID:=$(id -u)}"
: "${CI_GID:=$(id -g)}"
: "${COMPOSE_PROJECT_NAME:=bttr-security}"
: "${BTTR_API_IMAGE:=bttr-server-security:local}"
export CI_UID CI_GID COMPOSE_PROJECT_NAME BTTR_API_IMAGE

ZAP_AUTH_TOKEN=""
export ZAP_AUTH_TOKEN

compose() {
  docker compose -f compose.performance.yaml -f compose.security.yaml "$@"
}

cleanup() {
  status=$?
  trap - EXIT INT TERM
  set +e
  if [ -n "$ZAP_AUTH_TOKEN" ]; then
    compose run --rm -T --no-deps -e ZAP_AUTH_TOKEN zap-auth delete >/dev/null
  fi
  compose down --remove-orphans
  docker image rm "$BTTR_API_IMAGE" >/dev/null 2>&1
  exit "$status"
}
trap cleanup EXIT INT TERM

mkdir -p build/reports/security
rm -rf build/reports/security/*
compose up -d --build --wait api
compose run --rm -T --no-deps trivy

ZAP_AUTH_TOKEN="$(compose run --rm -T --no-deps zap-auth create)"
export ZAP_AUTH_TOKEN
compose run --rm -T --no-deps -e ZAP_AUTH_TOKEN zap
compose run --rm -T --no-deps -e ZAP_AUTH_TOKEN zap-auth delete
ZAP_AUTH_TOKEN=""
