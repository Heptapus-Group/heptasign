# heptapus-sign

Internal document approval/signature and verification system for Heptapus Group.

This is not a legally qualified e-signature system. It is a self-hosted internal approval and verification tool that stores uploaded PDFs, stamps a separate signed PDF with QR/barcode metadata, and exposes verification by token or document code.

## Features

- Email/password login with bcrypt password hashes and JWT session cookie
- Manual document code entry with uniqueness validation
- Assign documents to selected internal users for signing
- Per-user document visibility for standard users
- PDF upload validation and SHA-256 integrity hashes
- Separate original and signed PDF storage
- QR token verification and Code128 barcode stamping with Heptapus logo overlay
- Public verification by QR token or document code
- Dashboard metrics, document list/detail, revoke flow, user admin
- Audit logs for login, user creation, document creation, signing, and revocation
- Crypto provider abstraction for later ML-DSA, SLH-DSA, or other NIST-approved post-quantum migration

## Local setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## Docker setup

Create `.env` from `.env.example`, then run:

```bash
docker compose up -d --build
docker compose exec heptapus-sign-app npx prisma migrate deploy
docker compose exec heptapus-sign-app npm run prisma:seed
```

For local development, `LOCAL_APP_PORT=3000` exposes the app. In production, you can remove the `ports` section or leave it unbound in your deployment override and let the existing Caddy container reach `heptapus-sign-app:3000` over the external Docker network.

## Local Docker setup without Caddy

Use the local compose file when you only want to test on your machine. It does not require the external Caddy network.

```bash
docker compose -f local.docker.compose.yml up -d --build
docker compose -f local.docker.compose.yml exec heptapus-sign-app npx prisma migrate deploy
docker compose -f local.docker.compose.yml exec heptapus-sign-app npm run prisma:seed
```

Open `http://localhost:3000`.

If you want to run `npm run dev` on the host while only Postgres runs in Docker:

```bash
docker compose -f local.docker.compose.yml up -d postgres
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

The local compose file maps Postgres to `127.0.0.1:55432` by default to avoid conflicts with existing local PostgreSQL installs. Override it with `LOCAL_POSTGRES_PORT` if needed.

## Environment variables

- `DATABASE_URL`: PostgreSQL connection URL
- `DATABASE_URL_DOCKER`: PostgreSQL URL used by the app container
- `JWT_SECRET`: long random secret for session cookies and lightweight metadata HMAC
- `APP_URL`: public base URL used in QR verification links
- `STORAGE_PATH`: mounted storage directory, `/app/storage` in Docker
- `MAX_UPLOAD_MB`: PDF upload limit
- `CADDY_NETWORK`: existing Docker network used by your Caddy reverse proxy
- `POSTGRES_DB`: production database name
- `POSTGRES_USER`: production database user
- `POSTGRES_PASSWORD`: production database password
- `ADMIN_NAME`: seed admin name
- `ADMIN_TITLE`: seed admin business title
- `ADMIN_EMAIL`: seed admin email
- `ADMIN_PASSWORD`: seed admin password

## Production checklist

Before the first production deploy:

1. Set a real HTTPS `APP_URL`, for example `https://sign.heptapus.com`.
2. Replace `JWT_SECRET` with a long random value.
3. Replace `POSTGRES_PASSWORD`, `DATABASE_URL`, and `DATABASE_URL_DOCKER` with matching production credentials.
4. Replace `ADMIN_EMAIL` and `ADMIN_PASSWORD`; remove or rotate the seeded password after the first login.
5. Set `CADDY_NETWORK` to the existing Docker network used by your current Caddy container.
6. Confirm your Caddy container is attached to that network.
7. Set `HEPTAPUS_SIGN_IMAGE` to the GHCR image for your organization, for example `ghcr.io/heptapus-group/heptapus-sign:latest`.
8. Run `npx prisma migrate deploy` inside the app container after each deployment.
9. Back up both named volumes: `heptapus_sign_postgres` and `heptapus_sign_files`.
10. Keep `.env` out of git. Commit only `.env.example`.

Production deploy command sequence when building directly on the server:

```bash
docker compose up -d --build
docker compose exec heptapus-sign-app npx prisma migrate deploy
docker compose exec heptapus-sign-app npm run prisma:seed
```

For low-resource servers, do not build on the server. Use the GitHub Actions workflow in `.github/workflows/docker.yml` to publish an image to GitHub Container Registry, then deploy with:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec heptapus-sign-app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec heptapus-sign-app npm run prisma:seed
```

The app listens on port `3000` inside Docker. The production compose files do not publish the app to the host; your existing Caddy reverse proxy should reach `heptapus-sign-app:3000` over the external Docker network.

## Existing Caddy integration

Do not add a Caddyfile to this repo. Add a site block to your existing Caddy configuration:

```caddy
sign.example.com {
  reverse_proxy heptapus-sign-app:3000
}
```

Make sure your existing Caddy container is attached to the same external Docker network named by `CADDY_NETWORK` in `.env`.

## GitHub setup

This repository is safe to publish as long as `.env` is not committed. The root `logo.png` source file is ignored; the app uses `public/logo.png`.

If GitHub CLI is installed and authenticated:

```bash
gh repo create "Heptapus Group/heptapus-sign" --private --source . --remote origin --push
```

If the organization slug is different from the display name, use the slug shown in the GitHub organization URL.

After the first push to `main`, GitHub Actions publishes:

```text
ghcr.io/<organization-slug>/heptapus-sign:latest
```

Use that value as `HEPTAPUS_SIGN_IMAGE` on the production server.

## Notes

- The original PDF is never modified.
- The signed PDF is stored separately and includes QR code, logo overlay, barcode, approval metadata, and verification URL.
- Admin users can see all documents. Standard users only see documents they created or documents assigned to them.
- The MVP intentionally avoids heavy PKI and experimental post-quantum dependencies. The crypto provider interface keeps future upgrade work contained.
