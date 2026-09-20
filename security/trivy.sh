#!/bin/sh
set -eu

filesystem_report=/reports/trivy-filesystem.json
image_report=/reports/trivy-image.json
trivy_timeout=${TRIVY_TIMEOUT:-60m}
trivy_download_retries=${TRIVY_DOWNLOAD_RETRIES:-2}
trivy_db_repository=${TRIVY_DB_REPOSITORY:-ghcr.io/aquasecurity/trivy-db:2}
trivy_java_db_repository=${TRIVY_JAVA_DB_REPOSITORY:-ghcr.io/aquasecurity/trivy-java-db:1}

case "$trivy_download_retries" in
  '' | *[!0-9]*)
    echo 'TRIVY_DOWNLOAD_RETRIES deve ser um inteiro positivo.' >&2
    exit 2
    ;;
esac
if [ "$trivy_download_retries" -lt 1 ]; then
  echo 'TRIVY_DOWNLOAD_RETRIES deve ser maior que zero.' >&2
  exit 2
fi

download_database() {
  database_name=$1
  download_flag=$2
  repository_flag=$3
  repository=$4
  attempt=1

  while [ "$attempt" -le "$trivy_download_retries" ]; do
    echo "Atualizando $database_name pelo repositório $repository (tentativa $attempt/$trivy_download_retries)..."
    if trivy image \
      --timeout "$trivy_timeout" \
      --no-progress \
      "$repository_flag" "$repository" \
      "$download_flag"; then
      return 0
    fi
    if [ "$attempt" -lt "$trivy_download_retries" ]; then
      echo "Falha ao atualizar $database_name; uma nova tentativa será feita." >&2
    fi
    attempt=$((attempt + 1))
  done

  echo "Não foi possível atualizar $database_name após $trivy_download_retries tentativas." >&2
  return 1
}

# Baixe uma vez para o cache persistente. Os scans abaixo reutilizam exatamente essas
# bases e não tentam iniciar novos downloads no mesmo job.
download_database \
  'a base de vulnerabilidades do Trivy' \
  --download-db-only \
  --db-repository \
  "$trivy_db_repository"
download_database \
  'a base Java do Trivy' \
  --download-java-db-only \
  --java-db-repository \
  "$trivy_java_db_repository"

trivy fs \
  --timeout "$trivy_timeout" \
  --skip-db-update \
  --skip-java-db-update \
  --no-progress \
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
  --timeout "$trivy_timeout" \
  --skip-db-update \
  --skip-java-db-update \
  --no-progress \
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
  --timeout "$trivy_timeout" \
  --skip-db-update \
  --skip-java-db-update \
  --no-progress \
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
