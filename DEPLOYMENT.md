# ColorTouch Deployment Guide

This app is configured to use Neon (PostgreSQL) in the cloud.

## Environment

Required env vars (set in `.env` locally and in your hosting provider):

- `DATABASE_URL` – Neon connection string (sslmode=require)
- `NEXTAUTH_SECRET` – random string
- `AUTH_SECRET` – random string
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` – if using Google login

Optional for seeding:

- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`

## First-time Setup

1. Create a Neon project and copy the direct connection string (no pooling).
2. Set `DATABASE_URL` in `.env`.
3. Push schema:

   ```powershell
   npm run db:push
   ```

4. Seed an admin user (optional):

   ```powershell
   # Defaults: admin@colortouch.app / Admin@123!
   # Or override via env vars
   setx ADMIN_EMAIL "admin@yourdomain.com"
   setx ADMIN_PASSWORD "StrongPass@123"
   npm run seed:admin
   ```

5. (If migrating existing data) use the included scripts:

   ```powershell
   node scripts/export-data.js   # from old DB
   node scripts/import-data.js   # into Neon
   ```

## Running Locally

```powershell
npm run dev
```

## Networks Blocking Port 5432

If your network blocks PostgreSQL (port 5432), use Neon Proxy:

```powershell
npm i -g neonctl
neon proxy start
```

Use the printed local connection string as `DATABASE_URL` while on that network.

## Deploying

Most hosts (Vercel, Azure App Service, Render) work with this stack. Provide the same env vars in your host and build with:

```powershell
npm run build
npm start
```

## Security Notes

- Never commit `.env` or secrets.
- Rotate `NEXTAUTH_SECRET` and database password periodically.
- Change the seeded admin password after first login.
