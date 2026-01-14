# ColorTouch CRM - Deployment & Offline Mode Guide

## 📋 Summary

### ✅ What's Implemented

1. **CSV Duplicate Handling** - Already working! The system skips duplicate leads (based on email) and shows a summary
2. **Multi-Content Campaign Form** - Added upload sections for images, videos, and documents
3. **Required Field Indicators** - Red asterisks (*) mark all required fields in the campaign form
4. **Electron Desktop App** - Full desktop application setup with offline/online capabilities

---

## 🚀 Deployment Options

### Option 1: Web Application (Recommended for Production)

**Best for:** Multi-user access, centralized data, automatic updates

#### Changes Needed:
1. **Database**: Ensure PostgreSQL is accessible from production server
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/colortouch"
   ```

2. **Environment Variables** (`.env.production`):
   ```env
   # Database
   DATABASE_URL=your_production_database_url
   
   # Auth
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your_production_secret_key
   
   # Email (for notifications)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Admin credentials
   ADMIN_EMAIL=admin@yourcompany.com
   ADMIN_NAME=Administrator
   ADMIN_PASSWORD=secure_password_here
   
   # Razorpay (payment integration)
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   
   # WhatsApp (if using)
   WHATSAPP_API_URL=your_whatsapp_api
   WHATSAPP_API_KEY=your_api_key
   ```

3. **Build and Deploy**:
   ```powershell
   # Install dependencies
   npm install
   
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate deploy
   
   # Build for production
   npm run build
   
   # Start production server
   npm start
   ```

4. **Deployment Platforms**:
   - **Vercel** (Easiest): Connect GitHub repo, auto-deploys
   - **Railway/Render**: One-click deploy with database included
   - **AWS/Azure/GCP**: Full control, requires more setup
   - **Self-hosted VPS**: Install Node.js, PM2, Nginx

---

### Option 2: Desktop Application (Electron)

**Best for:** Offline access, single-user workstations, data privacy

#### How It Works:
- **Development Mode**: Connects to `localhost:3000` (Next.js dev server)
- **Production Mode**: Runs static HTML/CSS/JS from bundled files
- **Offline Capability**: ⚠️ **Partial** (see limitations below)

#### Build Desktop App:

```powershell
# Development (with hot reload)
npm run electron:dev

# Build installers
npm run electron:build:win    # Windows (.exe)
npm run electron:build:mac    # macOS (.dmg)
npm run electron:build:linux  # Linux (.AppImage)
```

**Output**: Installable applications in `dist/` folder

---

## 🔌 Offline Mode Explained

### What Works Offline ✅

1. **UI & Navigation**: Full interface loads from local files
2. **Viewing Cached Data**: Previously loaded leads, campaigns, etc.
3. **Form Validation**: Client-side checks work normally
4. **File Selection**: Can choose CSV/media files for later upload

### What Requires Internet ❌

1. **Database Operations**:
   - Adding/editing/deleting leads
   - Creating campaigns
   - Viewing reminders
   - **Reason**: PostgreSQL database is typically online

2. **Email Notifications**: Nodemailer requires SMTP connection

3. **Payment Processing**: Razorpay API calls need internet

4. **WhatsApp Campaigns**: External WhatsApp API required

5. **Zapier Integrations**: Webhook delivery needs connectivity

---

## 💡 Making It More Offline-Friendly

### Solution 1: Local Database (SQLite)

**Change database from PostgreSQL to SQLite** for true offline support:

1. Update `schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"  // Changed from "postgresql"
     url      = "file:./dev.db"
   }
   ```

2. Regenerate client:
   ```powershell
   npx prisma migrate dev --name switch_to_sqlite
   ```

3. **Trade-off**: SQLite is single-user only, no concurrent access

### Solution 2: Sync Queue

Implement a queue system:
- Store operations while offline (IndexedDB/LocalStorage)
- Auto-sync when internet returns
- Show "pending sync" indicators

**Example Flow**:
```
User creates lead → Saved locally → Shows "⏱ Pending Sync" badge
→ Internet restored → Auto-uploads to server → ✅ Synced
```

### Solution 3: Hybrid Mode (Recommended)

- **Online**: Full features with database
- **Offline**: Read-only mode + local draft storage
- Auto-detect connection status and switch modes

---

## 🔧 Deployment Checklist

### Before Deploying:

- [ ] Set all environment variables in production
- [ ] Run database migrations (`npx prisma migrate deploy`)
- [ ] Test with production database credentials
- [ ] Set up email SMTP (Gmail App Password recommended)
- [ ] Configure Razorpay with live keys (not test mode)
- [ ] Add custom domain and SSL certificate
- [ ] Set up backup strategy for database
- [ ] Configure CORS if API is on different domain
- [ ] Test CSV upload with large files
- [ ] Test WhatsApp campaign sending
- [ ] Verify payment flow end-to-end

### For Desktop App:

- [ ] Generate app icons (256x256 for Windows, 512x512 for Mac/Linux)
- [ ] Update `electron-builder.json` with your app details:
  ```json
  {
    "appId": "com.yourcompany.colortouch",
    "productName": "YourCompany CRM"
  }
  ```
- [ ] Code sign the app (Windows/Mac require certificates for distribution)
- [ ] Test installer on clean machine
- [ ] Include database connection details in installer/config
- [ ] Provide user documentation for setup

---

## 🌐 Recommended Setup

**For Most Users**: Deploy as web app + offer desktop app as optional

### Architecture:
```
┌─────────────────┐
│  Web Browser    │ ←─ Employees access from anywhere
│  (Online)       │
└─────────────────┘
         ↓
┌─────────────────┐
│  Cloud Server   │ ←─ Next.js + PostgreSQL (Vercel/Railway)
│  (Database)     │
└─────────────────┘
         ↑
┌─────────────────┐
│ Desktop App     │ ←─ Owner uses offline (local SQLite cache)
│ (Electron)      │     Syncs when online
└─────────────────┘
```

### Benefits:
- Web app = Always latest version, multi-user, accessible anywhere
- Desktop app = Owner has offline fallback, faster UI, privacy

---

## 🚨 Important Notes

1. **Database Connection**: Electron app needs DATABASE_URL pointing to accessible PostgreSQL instance (online) or local SQLite (offline)

2. **API Routes**: Next.js API routes (`/api/*`) don't work in static export mode used by Electron production builds. You need:
   - Separate backend API server (Express/Fastify)
   - OR keep desktop app in dev mode (always runs `npm run dev` locally)
   - OR use SQLite + local-only features

3. **File Uploads**: Media files for campaigns need cloud storage (AWS S3, Cloudflare R2) or local filesystem handling

4. **Security**: Don't commit `.env` files with production secrets to GitHub!

5. **Updates**: Web apps auto-update. Desktop apps need update mechanism (electron-updater).

---

## 📞 Next Steps

1. **For Web Deployment**: 
   - Choose hosting platform (Vercel recommended)
   - Set up environment variables
   - Deploy and test

2. **For Desktop App**:
   - Decide on SQLite vs PostgreSQL
   - Build and test installers
   - Distribute to users

3. **Hybrid Approach**:
   - Deploy web version first
   - Build desktop app for select users
   - Implement sync mechanism if needed

Need help with specific deployment platform? Let me know!
