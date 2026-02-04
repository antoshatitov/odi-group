# ОДИ — корпоративный сайт строительной компании

Монорепозиторий для сайта компании «ОДИ» (строительство индивидуальных домов в Калининграде и Калининградской области).

## Структура

- `apps/web` — React 18 + Vite 6 + TypeScript фронтенд
- `apps/server` — Node.js 20 + Fastify API `/api/lead`
- `deploy` — Nginx и systemd конфигурации для VPS

## Быстрый старт (локально)

1) Установите зависимости:

```bash
npm install
```

2) Запустите фронтенд:

```bash
npm run dev:web
```

3) Запустите сервер заявок:

```bash
cp .env.example apps/server/.env
npm run dev:server
```

Фронтенд будет доступен на `http://localhost:5173`.

## Переменные окружения

`.env.example` содержит базовые переменные. Скопируйте их в `apps/server/.env` и при необходимости в `apps/web/.env`.

**Backend (`apps/server/.env`)**

- `TELEGRAM_BOT_TOKEN` — токен бота
- `TELEGRAM_CHAT_ID` — ID чата
- `PORT` — порт API (по умолчанию 8080)
- `ALLOWED_ORIGINS` — список разрешённых origin через запятую

**Frontend (`apps/web/.env`, опционально)**

- `VITE_API_BASE` — базовый URL API, например `http://localhost:8080`

## Сборка фронтенда

```bash
npm run build:web
```

Готовая статика появится в `apps/web/dist`.

## Деплой на Timeweb.cloud (VPS)

1) Подготовьте папки:

```bash
sudo mkdir -p /var/www/odi/web /var/www/odi/server
```

2) Скопируйте файлы:

- `apps/web/dist` → `/var/www/odi/web/dist`
- `apps/server` → `/var/www/odi/server`

3) Создайте `.env` для сервера:

```bash
sudo cp /var/www/odi/server/.env.example /var/www/odi/server/.env
sudo nano /var/www/odi/server/.env
```

4) Настройте systemd:

```bash
sudo cp deploy/odi-leads.service /etc/systemd/system/odi-leads.service
sudo systemctl daemon-reload
sudo systemctl enable --now odi-leads.service
```

5) Настройте Nginx:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/odi
sudo ln -s /etc/nginx/sites-available/odi /etc/nginx/sites-enabled/odi
sudo nginx -t
sudo systemctl reload nginx
```

6) Подключите SSL:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d odi-kaliningrad.ru -d www.odi-kaliningrad.ru
```

## Данные проектов и галереи

- Проекты: `apps/web/src/data/projects.ts`
- Галерея: `apps/web/src/data/gallery.ts`

Изображения лежат в `apps/web/public/images`. Замените SVG-плейсхолдеры на реальные фото в webp/avif.
