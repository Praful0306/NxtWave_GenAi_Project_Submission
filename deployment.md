# VaaniTutor — Production Deployment Guide

This guide provides the complete, step-by-step deployment instructions for **VaaniTutor** across Vercel, Render, MongoDB Atlas, and GitHub strictly aligned with the system architecture.

---

## 🏗️ Architecture Overview

```
                          ┌──────────────────────────┐
                          │   Client / Web Browser   │
                          └─────────────┬────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌─────────────────────────┐                               ┌─────────────────────────┐
│     Frontend (Vercel)   │                               │    AI Backend (Render)  │
│  React 19 + Vite + Tailwind│                            │  FastAPI (Python 3.11+) │
└─────────────────────────┘                               └─────────────▲───────────┘
             │                                                          │
             ▼                                                          │
┌─────────────────────────┐                                             │
│   Node Backend (Render) │◄────────────────────────────────────────────┘
│  Express + Mongoose     │      (Internal Service Key / JWT Validation)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│   MongoDB Atlas Cluster │
└─────────────────────────┘
```

---

## 1. 🗄️ Database: MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a new Cluster (e.g. Free M0 Sandbox on AWS/Mumbai `ap-south-1`).
3. Under **Database Access**, create a user (e.g., `vaani_admin`) with password and read/write privileges.
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere, required for Render web services).
5. Click **Connect** $\rightarrow$ **Drivers** (Node.js) and copy the connection string:
   ```
   mongodb+srv://vaani_admin:<password>@cluster0.xxxxx.mongodb.net/vaanitutor?retryWrites=true&w=majority
   ```

---

## 2. 🤖 AI Microservice: `server-ai` (Render Web Service #1)

### Render Settings:
- **Environment:** `Python 3`
- **Root Directory:** `server-ai`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`

### Environment Variables (`server-ai`):

| Variable Name | Description | Example / Source |
|---|---|---|
| `JWT_SECRET` | Secret to verify user tokens (**must match `server-node`**) | `vaanitutor-production-jwt-secret-key-32chars` |
| `INTERNAL_SERVICE_KEY` | Server-to-server auth key (**must match `server-node`**) | `vaanitutor-internal-service-key-prod-99` |
| `SARVAM_API_KEYS` | Sarvam AI API keys for Bulbul v3 TTS & Saarika STT | `sk_live_xxxx,sk_live_yyyy` |
| `OPENROUTER_API_KEY` | OpenRouter key for primary Indic LLM (`sarvamai/sarvam-m`) | `sk-or-v1-xxxx` |
| `GEMINI_API_KEY` | Google Gemini API key (fallback LLM/STT) | `AIzaSy...` |
| `GROQ_API_KEY` | Groq Whisper / Llama key (fallback) | `gsk_...` |
| `OPENAI_API_KEY` | OpenAI API key (TTS/Whisper fallback) | `sk-proj-...` |
| `CATALYST_ORG_ID` | Zoho Catalyst Org ID for Zia STT & QuickML GLM-4.7 | `100xxxxxxxx` |
| `CATALYST_CLIENT_ID` | Zoho Catalyst OAuth Client ID | `1000.xxxx` |
| `CATALYST_CLIENT_SECRET`| Zoho Catalyst OAuth Client Secret | `xxxx` |
| `CATALYST_REFRESH_TOKEN`| Zoho Catalyst OAuth Refresh Token | `1000.xxxx` |

---

## 3. ⚙️ CRUD Backend: `server-node` (Render Web Service #2)

### Render Settings:
- **Environment:** `Node` (Node.js 20+)
- **Root Directory:** `server-node`
- **Build Command:** `npm install`
- **Start Command:** `npm start` (runs `node src/server.js`)
- **Health Check Path:** `/api/health`

### Environment Variables (`server-node`):

| Variable Name | Description | Example / Source |
|---|---|---|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Service port | `5000` (or leave default for Render `$PORT`) |
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://vaani_admin:...` |
| `JWT_SECRET` | Secret for signing & verifying JWTs | `vaanitutor-production-jwt-secret-key-32chars` |
| `JWT_EXPIRY` | Token expiration duration | `7d` |
| `INTERNAL_SERVICE_KEY` | Key for roadmap generation calls to `server-ai` | `vaanitutor-internal-service-key-prod-99` |
| `FRONTEND_URL` | Production Vercel domain | `https://vaanitutor.vercel.app` |
| `AI_SERVICE_URL` | Live URL of `server-ai` Render service | `https://vaanitutor-ai.onrender.com` |
| `ZEPTOMAIL_SEND_TOKEN` | Zoho ZeptoMail API send token for OTP emails | `Zoho-enczapikey PHtE6...` |
| `ZEPTOMAIL_FROM_EMAIL` | Verified sender email | `noreply@vaanitutor.com` |
| `ZEPTOMAIL_FROM_NAME` | Sender display name | `VaaniTutor` |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud OAuth Client ID | `751379337976-...apps.googleusercontent.com` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google Cloud OAuth Client Secret | `GOCSPX-...` |
| `GOOGLE_OAUTH_CALLBACK_URL` | Google OAuth redirect URI | `https://vaanitutor-api.onrender.com/api/auth/google/callback` |
| `ZOHO_OAUTH_CLIENT_ID` | Zoho API Console OAuth Client ID | `1000.1U4WHTCFE4V7K5IMCDML9FYBW04JRR` |
| `ZOHO_OAUTH_CLIENT_SECRET` | Zoho API Console OAuth Secret | `9ae34b8c...` |
| `ZOHO_OAUTH_CALLBACK_URL` | Zoho OAuth redirect URI | `https://vaanitutor-api.onrender.com/api/auth/zoho/callback` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_live_...` or `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret (server-side only) | `b4Bgc6sDTgs...` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret for signature validation | `whsec_...` |
| `PREMIUM_AMOUNT_PAISE` | Lifetime upgrade price in paise | `29900` (₹299) or `2999` (₹29.99) |

---

## 4. ⚡ Frontend: `client` (Vercel)

### Vercel Project Setup:
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install --legacy-peer-deps`

### Environment Variables (`client` on Vercel):

| Variable Name | Description | Example |
|---|---|---|
| `VITE_API_URL` | Live Node CRUD API base URL | `https://vaanitutor-api.onrender.com` |
| `VITE_AI_URL` | Live AI Service base URL | `https://vaanitutor-ai.onrender.com` |

### Single Page Application (SPA) Routing on Vercel:
Create `client/vercel.json` to handle client-side routing on page refreshes:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. 💳 Razorpay Webhook Configuration

1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com/) $\rightarrow$ **Settings** $\rightarrow$ **Webhooks**.
2. Click **Add New Webhook**.
3. Set **Webhook URL**:
   ```
   https://vaanitutor-api.onrender.com/api/payments/webhook
   ```
4. Set **Secret**: Enter your `RAZORPAY_WEBHOOK_SECRET` value.
5. Select active events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Click **Create Webhook**.

---

## 6. 🔐 OAuth Provider Redirect URI Configuration

### Google Cloud Console:
1. Open [Google Cloud Console](https://console.cloud.google.com/) $\rightarrow$ **APIs & Services** $\rightarrow$ **Credentials**.
2. Edit your OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add:
   - `https://vaanitutor.vercel.app`
   - `http://localhost:5173` (for local dev)
4. Under **Authorized redirect URIs**, add:
   - `https://vaanitutor-api.onrender.com/api/auth/google/callback`
   - `http://localhost:5000/api/auth/google/callback`

### Zoho API Console:
1. Open [Zoho API Console](https://api-console.zoho.com/).
2. Edit your Server-based Application client.
3. Add Authorized Redirect URI:
   - `https://vaanitutor-api.onrender.com/api/auth/zoho/callback`
   - `http://localhost:5000/api/auth/zoho/callback`

---

## 7. ✅ Live Post-Deployment Verification Checklist

| # | Check Item | Test Action | Expected Result |
|---|---|---|---|
| 1 | **Health Endpoints** | Visit `https://vaanitutor-api.onrender.com/api/health` & `...-ai.onrender.com/health` | `{"status": "ok"}` on both |
| 2 | **Landing & 3D Hero** | Load `https://vaanitutor.vercel.app/` | Smooth Three.js hero render, GSAP scroll reveals |
| 3 | **Auth Flow** | Register with email+OTP, sign in with Google & Zoho | JWT issued, user created, redirects to `/onboarding` |
| 4 | **Curriculum Generation** | Complete 3-question Onboarding wizard for Kannada | Generates 30-day roadmap with daily 3-activity sessions |
| 5 | **Voice Practice** | Record Kannada sentence on Day 1 | Sarvam/Zia transcribes, LLM assesses, Bulbul v3 streams audio back |
| 6 | **Sequential Unlock** | Complete Speak $\rightarrow$ Game $\rightarrow$ Quiz | Day 1 marked complete, Day 2 unlocks, streak increments |
| 7 | **Free Tier Paywall Gate** | Complete Day 2 and attempt Day 3 | Intercepts HTTP 402, routes to `/paywall` |
| 8 | **Razorpay Upgrade** | Click "Upgrade to Premium (₹299)" | Opens Razorpay modal, verifies HMAC signature, unlocks Day 3+ |
| 9 | **Curriculum Regeneration**| Adjust level in Settings | Confirms, regenerates Day 1 plan without losing historical stats |
