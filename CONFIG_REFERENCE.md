# Quick Reference - XeniaCRM CRM Configurations

## 🌐 Web Deployment (PostgreSQL - Online)

Use this for deployed web app (Vercel, Railway, etc.):

```env
DATABASE_URL="postgresql://neondb_owner:npg_XJmrFe5pU4AK@ep-autumn-resonance-adrfzleg.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Prisma Schema:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Deploy:**
```powershell
npm run build
npm start
```

---

## 💻 Desktop App (SQLite - Offline)

Use this for desktop installer:

```env
DATABASE_URL="file:./xeniacrm.db"
OFFLINE_MODE=true
AUTO_SYNC_ENABLED=true
```

**Prisma Schema:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Build:**
```powershell
# Quick build
npm run electron:build:win

# Or use batch script
.\build-offline.bat
```

---

## 🔄 Switching Modes

### From Online → Offline (Desktop Build):

```powershell
# 1. Backup current config
Copy-Item .env .env.backup

# 2. Switch to offline
Copy-Item .env.offline .env

# 3. Update schema
# Change provider to "sqlite" in prisma/schema.prisma

# 4. Regenerate
npx prisma generate

# 5. Reset migrations
Remove-Item -Recurse prisma\migrations
npx prisma migrate dev --name init_sqlite

# 6. Seed admin
npm run seed:admin

# 7. Build installer
npm run electron:build:win
```

### From Offline → Online (Web Deploy):

```powershell
# 1. Restore online config
Copy-Item .env.backup .env

# 2. Update schema
# Change provider to "postgresql" in prisma/schema.prisma

# 3. Regenerate
npx prisma generate

# 4. Deploy migrations
npx prisma migrate deploy

# 5. Build web app
npm run build
npm start
```

---

## 📝 Key Differences

| Feature | PostgreSQL (Web) | SQLite (Desktop) |
|---------|------------------|------------------|
| Database File | Remote server | Local `.db` file |
| Offline Support | ❌ No | ✅ Yes |
| Multi-user | ✅ Yes | ❌ No (single user) |
| Decimal Type | `Decimal @db.Decimal(12,2)` | `String` |
| VarChar Type | `@db.VarChar(20)` | `String` (no annotation) |
| Sync | N/A | Auto-sync to remote |
| Installation | Server deploy | Desktop installer |

---

## 🎯 Current Setup

**Build in progress:**
- ✅ SQLite schema configured
- ✅ Database created: `xeniacrm.db`
- ✅ Admin user seeded
- ⏳ Building Windows installer...

**Installer will be at:**
```
dist\XeniaCRM CRM-Setup-0.1.0.exe
```

**After build completes, restore web config:**
```powershell
Copy-Item .env.backup .env
# Update schema.prisma provider back to "postgresql"
npx prisma generate
```

---

## 🔍 Troubleshooting

**"Provider mismatch" error:**
- Ensure schema.prisma `provider` matches DATABASE_URL
- SQLite uses `file:` protocol
- PostgreSQL uses `postgresql://` protocol

**Missing migrations error:**
- SQLite and PostgreSQL need separate migration histories
- Delete `migrations/` folder when switching providers
- Run `prisma migrate dev` to create new migrations

**Decimal/VarChar errors with SQLite:**
- SQLite doesn't support `@db.Decimal` or `@db.VarChar`
- Use plain `String` type instead
- Convert in application code as needed

---

**Quick Commands:**

```powershell
# Check current config
Get-Content .env | Select-String "DATABASE_URL"

# Check schema provider
Get-Content prisma\schema.prisma | Select-String "provider"

# View current database
Get-Item xeniacrm.db  # SQLite
# Or check PostgreSQL connection
npx prisma studio
```
