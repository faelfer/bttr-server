#!/bin/sh
set -eu

filesystem_report=/reports/trivy-filesystem.json
image_report=/reports/trivy-image.json

trivy fs \
  --scanners vuln,secret,misconfig \
  --skip-dirs /workspace/.git \
  --skip-dirs /workspace/.gradle \
  --skip-dirs /workspace/build \
  --format json \
  --output "$filesystem_report" \
  /workspace
trivy convert --scanners vuln,secret,misconfig \
  --format template --template '@/contrib/html.tpl' \
  --output /reports/trivy-filesystem.html "$filesystem_report"
trivy convert --scanners vuln,secret,misconfig \
  --format sarif --output /reports/trivy-filesystem.sarif "$filesystem_report"

trivy image \
  --scanners vuln,secret \
  --format json \
  --output "$image_report" \
  "$TARGET_IMAGE"
trivy convert --scanners vuln,secret \
  --format template --template '@/contrib/html.tpl' \
  --output /reports/trivy-image.html "$image_report"
trivy convert --scanners vuln,secret \
  --format sarif --output /reports/trivy-image.sarif "$image_report"

trivy convert --scanners vuln,secret,misconfig \
  --severity HIGH,CRITICAL --exit-code 1 --format table "$filesystem_report"
if ! trivy image \
  --quiet \
  --scanners vuln,secret \
  --ignore-unfixed \
  --severity HIGH,CRITICAL \
  --exit-code 1 \
  --format json \
  --output /tmp/trivy-image-gate.json \
  "$TARGET_IMAGE"; then
  echo 'Trivy bloqueou a imagem: há vulnerabilidade HIGH ou CRITICAL com correção disponível.' >&2
  echo 'Consulte /reports/trivy-image.html para ver os detalhes.' >&2
  exit 1
fi
