# DROP by LocalReach — Setup & Deployment Guide

This guide walks you through configuring **DROP by LocalReach** for both local development and production deployment on **Vercel** with **MongoDB Atlas**, **Backblaze B2**, and **Upstash Redis**.

---

## Architecture Overview

```
Browser
   ↓
Vercel (Single Project on https://drop.localreach.in)
   ├── React + Vite frontend (Static SPA)
   └── /api backend (Express wrapped as Vercel Serverless Function)
          ├── MongoDB Atlas → Persistent metadata & 10-day lifecycle records
          ├── Upstash Redis → Distributed rate limiting & upload reservations
          └── Backblaze B2 → Private file storage (Direct presigned uploads & downloads)
```

---

## 1. MongoDB Atlas Configuration

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free M0 cluster (or use an existing cluster).
3. Under **Database Access**, create a database user:
   - Built-in role: `Read and write to any database`.
   - Set a strong password (if the password contains special characters like `@`, `#`, `:`, URL-encode them).
4. Under **Network Access**, add an IP Access Entry:
   - For Vercel serverless functions: `0.0.0.0/0` (Allow Access from Anywhere).
5. Click **Connect** $\rightarrow$ **Drivers** $\rightarrow$ Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/drop?retryWrites=true&w=majority
   ```

---

## 2. Backblaze B2 Storage Configuration

1. Log in to [Backblaze](https://www.backblaze.com/b2/cloud-storage.html).
2. Under **B2 Cloud Storage** $\rightarrow$ **Buckets**, click **Create a Bucket**:
   - Bucket Name: `drop-files` (or your preferred unique name).
   - Files in Bucket are: **Private** (Do NOT make it public).
   - Default Encryption: Enabled.
3. Note your bucket's **Endpoint** and **Region**:
   - Example endpoint: `s3.us-east-005.backblazeb2.com`
   - Example region: `us-east-005`
4. Under **Account** $\rightarrow$ **Application Keys**, click **Add a New Application Key**:
   - Name: `drop-b2-app-key`.
   - Allow access to Bucket: select your bucket (e.g. `drop-files`).
   - Type of Access: `Read and Write`.
   - Note the **keyID** (`B2_KEY_ID`) and **applicationKey** (`B2_APPLICATION_KEY`).

---

## 3. Upstash Redis Configuration

1. Log in to [Upstash](https://console.upstash.com/).
2. Click **Create Database**:
   - Name: `drop-redis`.
   - Region: Select region close to your Vercel deployment.
   - Type: Serverless.
3. In the database dashboard under **REST API**, copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 4. Local Development Setup

1. Clone or open the repository:
   ```bash
   cd "C:\Websites\LocalReach Drop"
   ```

2. Install all workspace dependencies:
   ```bash
   npm run install:all
   ```

3. Configure local environment:
   Open `backend/.env` and fill in your credentials:
   ```env
   PORT=5000
   NODE_ENV=development

   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/drop?retryWrites=true&w=majority

   STORAGE_PROVIDER=b2
   B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
   B2_REGION=us-east-005
   B2_BUCKET_NAME=drop-files
   B2_KEY_ID=your_b2_key_id
   B2_APPLICATION_KEY=your_b2_application_key

   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token

   PUBLIC_BASE_URL=http://localhost:5173
   FILE_EXPIRATION_DAYS=10
   MAX_FILE_SIZE_MB=100
   TOKEN_SECRET=your_local_secret_key_2026
   CRON_SECRET=your_local_cron_secret
   CORS_ORIGIN=http://localhost:5173,https://drop.localreach.in
   CONTACT_URL=https://localreach.in/contact
   ```

4. Start development server:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - Health Check: `http://localhost:5000/api/health`

---

## 5. Production Deployment on Vercel

1. Push your repository to **GitHub**.
2. Log in to [Vercel](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
3. Import your GitHub repository:
   - Framework Preset: **Vite**
   - Root Directory: `./` (Leave as root)
   - Build Command: `npm run build --workspace=frontend` (Configured automatically in `vercel.json`)
   - Output Directory: `frontend/dist` (Configured automatically in `vercel.json`)
4. In the **Environment Variables** section, add:

| Variable Name | Environment | Description |
|---|---|---|
| `MONGODB_URI` | Production, Preview | MongoDB Atlas connection string |
| `STORAGE_PROVIDER` | Production, Preview | `b2` |
| `B2_ENDPOINT` | Production, Preview | e.g. `https://s3.us-east-005.backblazeb2.com` |
| `B2_REGION` | Production, Preview | e.g. `us-east-005` |
| `B2_BUCKET_NAME` | Production, Preview | e.g. `drop-files` |
| `B2_KEY_ID` | Production, Preview | Backblaze B2 Application Key ID |
| `B2_APPLICATION_KEY` | Production, Preview | Backblaze B2 Application Key |
| `UPSTASH_REDIS_REST_URL` | Production, Preview | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Production, Preview | Upstash Redis REST Token |
| `TOKEN_SECRET` | Production, Preview | Cryptographically strong secret |
| `CRON_SECRET` | Production, Preview | Secret for Vercel Cron authorization |
| `PUBLIC_BASE_URL` | Production, Preview | `https://drop.localreach.in` |
| `FILE_EXPIRATION_DAYS` | Production, Preview | `10` |
| `MAX_FILE_SIZE_MB` | Production, Preview | `100` |
| `VITE_API_URL` | Production, Preview | `/api` |

5. Click **Deploy**.
6. After deployment, navigate to your domain (`https://drop.localreach.in`) to verify the frontend and `/api/health`.
