# DROP by LocalReach

> **Official Domain:** [https://drop.localreach.in](https://drop.localreach.in)  
> **Tagline:** Temporary file sharing, simply.

DROP is a premium, minimal web application built for temporary file transfer. Files are secured with passcodes, automatically deleted after 10 days, and can be shared via direct link or discreet low-visibility QR image steganography.

---

## Key Features

- **Instant Action Landing**: Immediately presents `UPLOAD FILE` and `SCAN IMAGE` above the fold without marketing distractions.
- **Passcode-Protected Access**: Passcodes are securely hashed with `bcryptjs`. Plaintext passcodes are never stored or transmitted in plain sight.
- **Direct-to-Storage Uploads**: Files upload directly from the browser to Backblaze B2 via presigned URLs, bypassing serverless payload limits.
- **Dual Sharing Methods**:
  1. **Direct Link Sharing**: Cryptographically random 24-byte URL-safe tokens (`https://drop.localreach.in/f/XXXXXXXX`).
  2. **Discreet QR Image Sharing**: Embed a low-visibility QR into an image with adjustable visibility, position, and sizing.
- **Built-in Image Scanner**: In-browser client-side QR scanner with contrast enhancement to detect low-visibility QR codes without relying on third-party tools or Google Lens.
- **10-Day Automated Expiration**: Every file has a strict 10-day lifecycle enforced on every access. Automated daily Vercel Cron workers permanently purge expired drops and multi-version storage objects.
- **Distributed Security & Rate Limiting**: Powered by Upstash Redis for distributed sliding-window rate limiting, temporary upload reservations, and brute-force lockout protection.
- **Zero-Account Architecture**: No signups, no logins, no dashboards, no tracking cookies, and no perpetual digital footprint.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, jsQR, QRCode
- **Backend / API**: Node.js, Express, TypeScript, Vercel Serverless Functions (`api/index.ts`)
- **Database**: MongoDB Atlas (metadata-only storage with serverless connection caching; actual binary files are stored in object storage)
- **File Storage**: Backblaze B2 (Private bucket using S3-compatible API with presigned upload and download URLs)
- **Temporary State & Rate Limiting**: Upstash Redis (Serverless HTTP client with sliding-window rate limiting)
- **Scheduled Cleanup**: Vercel Cron (`GET /api/cron/cleanup`)

---

## Folder Structure

```
LocalReach Drop/
├── package.json              # Root script runner (dev & build orchestration)
├── vercel.json               # Vercel deployment configuration (frontend + /api + crons)
├── .gitignore                # Gitignore (excluding secrets, node_modules, build outputs)
├── .env.example              # Template for server-side & client-side environment variables
├── README.md                 # Project documentation
├── SETUP.md                  # Comprehensive setup and deployment guide
├── api/
│   └── index.ts              # Vercel Serverless Function entry point exporting Express app
├── backend/                  # Node.js + Express API
│   ├── .env.example          # Backend environment variable template
│   ├── .env                  # Local development environment configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── config/           # Environment variables & constants
│       ├── controllers/      # File upload-url, complete, verify, download, preview, QR
│       ├── db/               # Serverless Mongoose connection caching helper
│       ├── models/           # MongoDB Mongoose model (FileDrop)
│       ├── routes/           # REST endpoints (/api/files, /api/qr, /api/cron)
│       ├── services/         # Cleanup service (10-day purging) & Upstash Redis service
│       ├── storage/          # Backblaze B2 S3-compatible storage provider (B2StorageProvider)
│       ├── types/            # TypeScript interfaces
│       ├── utils/            # Cryptographic token generator, hashers, sanitizers
│       ├── app.ts            # Express setup, security middleware, and route mounting
│       └── server.ts         # Local development runner (app.listen)
└── frontend/                 # React + Vite application
    ├── .env.example
    ├── .env
    ├── package.json
    ├── vite.config.ts        # Vite configuration
    ├── tailwind.config.js    # LocalReach branding theme & frosted-glass tokens
    └── src/
        ├── components/       # Navbar, Footer, Button, BackButton, Toast
        ├── pages/
        │   ├── Home/         # Immediate dual action cards & 10-day notice
        │   ├── About/        # Editorial brand story for DROP by LocalReach
        │   ├── HowItWorks/   # 8-step numbered guide with highlight callouts
        │   ├── Upload/       # Direct-to-B2 upload flow, passcode setup, link generator
        │   ├── ImageShare/   # Discreet QR steganography editor & exporter
        │   ├── Scan/         # QR detector & DROP access recovery
        │   ├── FileAccess/   # Passcode entry, file preview & direct B2 download
        │   ├── Contact/      # Contact page
        │   ├── Privacy/      # Privacy policy
        │   └── Terms/        # Terms of service
        ├── services/         # Frontend API client (same-origin /api)
        ├── utils/            # Steganography engine, contrast enhancer, formatters
        └── styles/           # Frosted glass and modern styling
```

---

## Quick Start (Local Development)

### 1. Install all dependencies:
```bash
npm run install:all
```

### 2. Configure Environment:
Configure your MongoDB Atlas, Backblaze B2, and Upstash Redis credentials in `backend/.env`:
```bash
# See backend/.env.example for required variables
```

### 3. Start Development:
```bash
npm run dev
```
- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:5000`

---

## Production Deployment (Vercel)

1. Push repository to GitHub.
2. Import repository into Vercel.
3. Add the server-side environment variables from `.env.example` into Vercel Project Settings $\rightarrow$ Environment Variables.
4. Deploy. Both frontend and `/api` Serverless Functions are deployed together from a single Vercel project on the same domain (`drop.localreach.in`).
