# dbrowser

A lightweight, self-hosted SQLite browser for Docker environments.

## What is it?

dbrowser is a web-based SQLite browser built for homelabs and Docker setups
where databases live in Docker volumes and bind mounts. No paywall, no complex
setup — just a clean table browser and SQL editor in one interface.

## Features

- Browse multiple SQLite databases from one interface
- Table viewer with search, pagination and column types
- SQL editor as a slide-in drawer (Ctrl+Enter to run)
- Read-only by default — safe to run alongside live apps
- Works with both Docker-managed volumes and bind mounts

## Screenshot

<img width="1726" height="1005" alt="image" src="https://github.com/user-attachments/assets/2e36f2a4-550e-4c1c-86c0-5820aa165efc" />

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/kenneth-t/dbrowser.git
cd dbrowser
```

### 2. Configure docker-compose.yml

Copy `docker-compose.example.yml` to `docker-compose.yml` and point the volumes
at your own SQLite databases.

**Bind mount example:**
```yaml
volumes:
  - /path/to/your/app/data:/data/myapp:ro
```

**Docker-managed volume example:**
```yaml
volumes:
  - myapp_data:/data/myapp:ro

# add to top-level volumes section:
volumes:
  myapp_data:
    external: true
```

### 3. Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

Edit `deploy.sh` first to set `SERVER` and `REMOTE_PATH` for your host.

## Local development

**Backend:**
```bash
cd backend && npm install && node index.js
```

**Frontend** (separate terminal):
```bash
cd frontend && npm install && npm run dev
```

The frontend dev server proxies `/api` requests to `localhost:3000`.

## Tech stack

- Backend: Node.js / Express + better-sqlite3
- Frontend: React 19 + Vite
- Container: Docker multi-stage build

## License

MIT — see [LICENSE](LICENSE)
