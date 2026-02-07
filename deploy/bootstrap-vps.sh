#!/usr/bin/env bash
set -Eeuo pipefail

DOMAIN="${DOMAIN:-odi-group.ru}"
WWW_DOMAIN="${WWW_DOMAIN:-www.odi-group.ru}"
APP_ROOT="${APP_ROOT:-/var/www/odi}"
SRC_DIR="${SRC_DIR:-$HOME/odi-group}"
BRANCH="${BRANCH:-main}"
PORT="${PORT:-8080}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-https://${DOMAIN},https://${WWW_DOMAIN}}"
ENABLE_UFW="${ENABLE_UFW:-true}"
PRESERVE_ENV="${PRESERVE_ENV:-true}"
SKIP_CERTBOT="${SKIP_CERTBOT:-false}"

REPO_URL="${REPO_URL:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:?Set CERTBOT_EMAIL for Lets Encrypt}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:?Set TELEGRAM_BOT_TOKEN}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:?Set TELEGRAM_CHAT_ID}"

TELEGRAM_CALC_BOT_TOKEN="${TELEGRAM_CALC_BOT_TOKEN:-}"
TELEGRAM_CALC_CHAT_ID="${TELEGRAM_CALC_CHAT_ID:-}"
TELEGRAM_QUARANTINE_CHAT_ID="${TELEGRAM_QUARANTINE_CHAT_ID:-}"
LOG_HASH_SALT="${LOG_HASH_SALT:-}"
CAPTCHA_ENABLED="${CAPTCHA_ENABLED:-false}"

info() {
  printf '\n[%s] %s\n' "$(date '+%F %T')" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

get_env_value() {
  local key="$1"
  local file="$2"

  if [[ ! -f "$file" ]]; then
    return
  fi

  grep -m 1 "^${key}=" "$file" | sed "s/^${key}=//" || true
}

merge_optional_env_value() {
  local key="$1"
  local incoming_value="$2"
  local existing_file="$3"

  if [[ "$PRESERVE_ENV" == "true" && -z "$incoming_value" ]]; then
    local existing_value
    existing_value="$(get_env_value "$key" "$existing_file")"
    printf "%s" "$existing_value"
    return
  fi

  printf "%s" "$incoming_value"
}

install_node20() {
  local node_major
  node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || true)"
  if [[ -n "$node_major" && "$node_major" -ge 20 ]]; then
    info "Node.js ${node_major} already installed"
    return
  fi

  info "Installing Node.js 20.x"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
}

write_server_env() {
  local existing_env="${APP_ROOT}/server/.env"
  local tmp_env
  local merged_calc_bot_token
  local merged_calc_chat_id
  local merged_quarantine_chat_id
  local merged_log_hash_salt
  local merged_captcha_enabled

  merged_calc_bot_token="$(merge_optional_env_value "TELEGRAM_CALC_BOT_TOKEN" "${TELEGRAM_CALC_BOT_TOKEN}" "${existing_env}")"
  merged_calc_chat_id="$(merge_optional_env_value "TELEGRAM_CALC_CHAT_ID" "${TELEGRAM_CALC_CHAT_ID}" "${existing_env}")"
  merged_quarantine_chat_id="$(merge_optional_env_value "TELEGRAM_QUARANTINE_CHAT_ID" "${TELEGRAM_QUARANTINE_CHAT_ID}" "${existing_env}")"
  merged_log_hash_salt="$(merge_optional_env_value "LOG_HASH_SALT" "${LOG_HASH_SALT}" "${existing_env}")"
  merged_captcha_enabled="$(merge_optional_env_value "CAPTCHA_ENABLED" "${CAPTCHA_ENABLED}" "${existing_env}")"

  tmp_env="$(mktemp)"

  cat >"$tmp_env" <<EOF
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
TELEGRAM_CALC_BOT_TOKEN=${merged_calc_bot_token}
TELEGRAM_CALC_CHAT_ID=${merged_calc_chat_id}
TELEGRAM_QUARANTINE_CHAT_ID=${merged_quarantine_chat_id}
LOG_HASH_SALT=${merged_log_hash_salt}
CAPTCHA_ENABLED=${merged_captcha_enabled}
PORT=${PORT}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
EOF

  sudo install -o root -g www-data -m 640 "$tmp_env" "${APP_ROOT}/server/.env"
  rm -f "$tmp_env"
}

write_systemd_service() {
  sudo tee /etc/systemd/system/odi-leads.service >/dev/null <<EOF
[Unit]
Description=ODI Lead API
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_ROOT}/server
EnvironmentFile=${APP_ROOT}/server/.env
ExecStart=/usr/bin/node ${APP_ROOT}/server/src/index.js
Restart=on-failure
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
}

write_nginx_config() {
  sudo tee /etc/nginx/sites-available/odi >/dev/null <<EOF
server {
  listen 80;
  server_name ${DOMAIN} ${WWW_DOMAIN};

  root ${APP_ROOT}/web/dist;
  index index.html;

  location / {
    try_files \$uri /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:${PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF
}

main() {
  require_cmd sudo
  require_cmd curl
  require_cmd git

  info "Checking sudo access"
  sudo -v

  info "Updating apt repositories and base packages"
  sudo apt update
  sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y
  sudo apt install -y curl git ca-certificates ufw nginx certbot python3-certbot-nginx rsync

  install_node20

  info "Node and npm versions"
  node -v
  npm -v

  info "Ensuring nginx is enabled"
  sudo systemctl enable --now nginx

  if [[ "${ENABLE_UFW}" == "true" ]]; then
    info "Configuring UFW (OpenSSH and Nginx Full)"
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    if sudo ufw status | grep -q "Status: inactive"; then
      sudo ufw --force enable
    fi
  fi

  info "Preparing source code in ${SRC_DIR}"
  if [[ -d "${SRC_DIR}/.git" ]]; then
    git -C "${SRC_DIR}" fetch --prune origin
    if git -C "${SRC_DIR}" show-ref --verify --quiet "refs/remotes/origin/${BRANCH}"; then
      git -C "${SRC_DIR}" checkout -B "${BRANCH}" "origin/${BRANCH}"
    else
      echo "Branch origin/${BRANCH} not found in ${SRC_DIR}" >&2
      exit 1
    fi
  else
    if [[ -d "${SRC_DIR}" && -n "$(ls -A "${SRC_DIR}" 2>/dev/null)" ]]; then
      echo "SRC_DIR exists and is not a git repository: ${SRC_DIR}" >&2
      exit 1
    fi
    if [[ -z "${REPO_URL}" ]]; then
      echo "REPO_URL is required when cloning into ${SRC_DIR}" >&2
      exit 1
    fi
    git clone --branch "${BRANCH}" "${REPO_URL}" "${SRC_DIR}"
  fi

  cd "${SRC_DIR}"
  info "Installing workspace dependencies"
  npm install

  info "Building frontend"
  npm run build:web

  info "Preparing deploy directories"
  sudo mkdir -p "${APP_ROOT}/web/dist" "${APP_ROOT}/server"

  info "Syncing frontend and backend files"
  sudo rsync -a --delete "${SRC_DIR}/apps/web/dist/" "${APP_ROOT}/web/dist/"
  sudo rsync -a --delete --exclude node_modules "${SRC_DIR}/apps/server/" "${APP_ROOT}/server/"

  info "Writing backend environment"
  write_server_env

  info "Installing backend production dependencies"
  sudo npm install --omit=dev --prefix "${APP_ROOT}/server"

  info "Applying ownership and permissions"
  sudo chown -R root:www-data "${APP_ROOT}"
  sudo find "${APP_ROOT}" -type d -exec chmod 750 {} \;
  sudo find "${APP_ROOT}" -type f -exec chmod 640 {} \;
  sudo chmod 640 "${APP_ROOT}/server/.env"

  info "Writing systemd and nginx configuration"
  write_systemd_service
  write_nginx_config

  sudo rm -f /etc/nginx/sites-enabled/default
  sudo ln -sfn /etc/nginx/sites-available/odi /etc/nginx/sites-enabled/odi

  info "Reloading systemd and restarting services"
  sudo systemctl daemon-reload
  sudo systemctl enable --now odi-leads.service
  sudo nginx -t
  sudo systemctl reload nginx

  if [[ "${SKIP_CERTBOT}" == "true" ]]; then
    info "Skipping certbot step (SKIP_CERTBOT=true)"
  else
    info "Requesting SSL certificates via certbot"
    if [[ -n "${WWW_DOMAIN}" ]]; then
      sudo certbot --nginx -d "${DOMAIN}" -d "${WWW_DOMAIN}" -m "${CERTBOT_EMAIL}" \
        --agree-tos --no-eff-email --redirect --keep-until-expiring --expand -n
    else
      sudo certbot --nginx -d "${DOMAIN}" -m "${CERTBOT_EMAIL}" \
        --agree-tos --no-eff-email --redirect --keep-until-expiring --expand -n
    fi

    info "Verifying certbot renewal"
    sudo certbot renew --dry-run
  fi

  info "Post-deploy checks"
  sudo systemctl --no-pager --full status odi-leads.service | sed -n '1,20p'
  curl -fsS "http://127.0.0.1:${PORT}/api/health"
  curl -I "https://${DOMAIN}"

  info "Deployment complete"
}

main "$@"
