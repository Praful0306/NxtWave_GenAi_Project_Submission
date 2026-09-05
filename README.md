# VaaniTutor

**Learn to speak Indian languages — not just read about them.**

A voice-first language tutor for Kannada, Hindi, English and eight more Indian
languages. You say a phrase out loud, get it transcribed, corrected and scored,
then hear the correction spoken back in a native voice.

🌐 **Live:** [learninglanguagesai.in](https://www.learninglanguagesai.in)
📦 **Repo:** [Praful0306/NxtWave_GenAi_Project_Submission](https://github.com/Praful0306/NxtWave_GenAi_Project_Submission)

Built for the **NxtWave GenAI Internship Assessment — Project 4 (LLMs Meet Speech)**.

---

## Table of contents

- [What it does](#what-it-does)
- [Supported languages](#supported-languages)
- [How a day works](#how-a-day-works)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Running it locally](#running-it-locally)
- [Environment variables](#environment-variables)
- [How to use the app](#how-to-use-the-app)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Hurdles we hit and how we solved them](#hurdles-we-hit-and-how-we-solved-them)
- [My contribution](#my-contribution)
- [Contributing](#contributing)
- [AI assistance](#ai-assistance)
- [Known limitations](#known-limitations)

---

## What it does

Most language apps teach you to *recognise* words. VaaniTutor makes you *say*
them, then tells you what you got wrong.

- **Speak and be corrected.** Record a phrase. It's transcribed, graded for
  fluency, and every mistake is tagged by type — grammar, vocabulary, word
  order, register or pronunciation — with a plain explanation.
- **Hear the correction.** The corrected sentence is spoken back in a native
  voice, at 0.75×, 1× or 1.25× so you can slow it down.
- **A plan, not a pile of lessons.** Tell it your language, level and how many
  days you have. It builds a day-by-day roadmap. Each day unlocks the next.
- **Learn several languages at once.** Each has its own roadmap, pace, level
  and streak. Changing one never touches another.
- **Pick up exactly where you stopped.** Leave halfway through and you return
  to the same activity — never back to the start.

---

## Supported languages

| Language | Code | Tier | Language | Code | Tier |
|---|---|---|---|---|---|
| ಕನ್ನಡ Kannada | `kn-IN` | 1 | ગુજરાતી Gujarati | `gu-IN` | 2 |
| हिन्दी Hindi | `hi-IN` | 1 | ਪੰਜਾਬੀ Punjabi | `pa-IN` | 2 |
| English (India) | `en-IN` | 1 | മലയാളം Malayalam | `ml-IN` | 2 |
| தமிழ் Tamil | `ta-IN` | 2 | ଓଡ଼ିଆ Odia | `od-IN` | 2 |
| తెలుగు Telugu | `te-IN` | 2 | বাংলা Bengali | `bn-IN` | 2 |
| मराठी Marathi | `mr-IN` | 2 | | | |

**Tier 1** languages get an extra speech-to-text fallback (Zoho Zia) and are the
ones we tested most heavily. All eleven produce native-voice audio.

---

## How a day works

Three activities, always in this order. About ten minutes.

```
   ┌─────────────┐      ┌──────────────┐      ┌─────────────┐
   │  1. SPEAK   │ ───► │ 2. WORD ORDER│ ───► │  3. QUIZ    │ ───► next day unlocks
   └─────────────┘      └──────────────┘      └─────────────┘
   record a phrase      rebuild it from       short recall
   get corrections      scrambled words       check
```

1. **Speak** — record the day's phrase. You get a transcript, a corrected
   version you can play back, a fluency score out of 100, and tagged errors.
2. **Word order** — the same sentence, scrambled. Tap the words back into
   order. Generated from the day's phrase, no extra AI call.
3. **Quiz** — two to four multiple-choice questions on the day's vocabulary and
   grammar. Finish it and tomorrow unlocks.

**Resume is the whole point.** A `DailySessions` record tracks
`currentActivityIndex`. Close the tab mid-game and reopening the page puts you
back on the game. Nothing expires, nothing forces a restart.

**Streaks** count calendar days you actually practised — deliberately separate
from roadmap progress, since finishing three days in one sitting isn't a
three-day streak.

---

## Architecture

Three deployable units. The split matters: **`server-node` owns all state,
`server-ai` owns none.**

```
                    ┌──────────────────────────┐
                    │        Browser           │
                    │  React 19 + Vite + TW4   │
                    └───────┬──────────┬───────┘
                            │          │
        JWT, CRUD, payments │          │ audio, transcripts, TTS
                            ▼          ▼
        ┌───────────────────────┐   ┌────────────────────────┐
        │      server-node      │   │       server-ai        │
        │   Express (Node 20)   │──►│   FastAPI (Python)     │
        │                       │   │                        │
        │ • auth, OTP, OAuth    │   │ • speech-to-text chain │
        │ • roadmaps, sessions  │   │ • LLM grading chain    │
        │ • payments, webhooks  │   │ • text-to-speech chain │
        │ • the ONLY JWT issuer │   │ • verifies JWTs only   │
        └───────────┬───────────┘   │ • NO database at all   │
                    │               └───────────┬────────────┘
                    ▼                           ▼
           ┌────────────────┐        ┌─────────────────────────┐
           │ MongoDB Atlas  │        │ Sarvam · Groq · Gemini  │
           └────────────────┘        │ OpenRouter · NVIDIA     │
                                     │ Cloudflare · Zoho       │
                                     └─────────────────────────┘
```

### Why the AI service is stateless

`server-ai` never touches the database. It receives inputs, calls a provider,
returns outputs. That keeps the security boundary simple: it can't leak another
learner's data because it can't read any data.

### Provider fallback chains

Every AI call walks a chain, with a 5–6 second timeout per tier — a provider
that hangs is treated exactly like one that errored, so a slow provider can
never stall the whole request.

| Purpose | Chain |
|---|---|
| **Speech-to-text** | Sarvam Saarika → Zoho Zia *(Tier 1 only)* → Gemini → Groq Whisper → OpenAI Whisper |
| **Grading & roadmaps** | OpenRouter (`sarvam-m`) → Zoho Catalyst → Gemini → Groq → NVIDIA NIM → Cloudflare → deterministic fallback |
| **Text-to-speech** | Sarvam Bulbul v3 (WebSocket stream) → OpenAI TTS *(English only)* |

The final LLM tier is rule-based and needs no network, so roadmap generation
never hard-fails.

### Security decisions worth calling out

- **`server-node` is the only JWT issuer.** `server-ai` verifies against the
  same secret and never mints a token.
- **Payment success is never taken from the browser.** Premium unlocks only
  after an HMAC-SHA256 signature check on the server, with a separately-signed
  webhook as an independent backstop.
- **The price is server-side only.** A client that asks for a ₹1 order gets the
  real amount anyway.
- **Every query is scoped to the JWT's user id**, with ownership re-checked on
  fetch-by-id.
- Passwords are bcrypt (cost 12). OTPs are hashed before storage, expire in 10
  minutes, cap at 5 attempts.

---

## Folder structure

```
NxtWave_GenAi_Project_Submission/
│
├── client/                          # React 19 + Vite + Tailwind v4
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/index.jsx         # Button, Card, Badge, Field, Alert,
│   │   │   │                        #   StatTile, CountUp, ProgressBar…
│   │   │   ├── AppShell/            # header + page canvas + footer
│   │   │   ├── AudioRecorder/       # mic capture, level meter, silence check
│   │   │   ├── AudioPlayer/         # streamed TTS + 0.75/1/1.25× control
│   │   │   ├── AssessmentCard/      # score ring, error breakdown, AI reply
│   │   │   ├── PracticeActivities/  # GameActivity, QuizActivity
│   │   │   ├── RoadmapTimeline/     # week accordions, day cards
│   │   │   ├── OnboardingWizard/    # the 3-question setup
│   │   │   ├── LanguageCard/        # dashboard language tile
│   │   │   ├── ProgressChart/       # Recharts, theme-aware
│   │   │   ├── landing/             # Hero3D, FeatureCarousel,
│   │   │   │                        #   ScrollRevealSection, ScriptMarquee
│   │   │   ├── AuthLayout.jsx       # shared frame for auth screens
│   │   │   ├── LegalLayout.jsx      # shared frame for privacy/terms
│   │   │   ├── Brandmark.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ThemeToggle/
│   │   │   └── ProtectedRoute/
│   │   ├── pages/                   # one file per route (see table below)
│   │   ├── store/                   # Zustand: auth, language, theme
│   │   ├── services/                # axios clients: api, aiApi, languageApi
│   │   ├── config/pricing.js        # single source for the displayed price
│   │   ├── index.css                # design tokens, light + dark
│   │   └── main.jsx
│   ├── index.html
│   ├── vercel.json                  # SPA rewrites
│   └── vite.config.js
│
├── server-node/                     # Express — owns all state
│   └── src/
│       ├── server.js                # app wiring, CORS, raw-body for webhooks
│       ├── config/
│       │   ├── env.js               # every env var, with defaults
│       │   └── db.js                # Atlas, with in-memory fallback
│       ├── routes/
│       │   ├── authRoutes.js        # register, OTP, login, Google, Zoho
│       │   ├── roadmapRoutes.js     # generate, fetch, regenerate
│       │   ├── sessionRoutes.js     # the resume entry point + game/quiz
│       │   ├── languageRoutes.js
│       │   ├── progressRoutes.js
│       │   └── paymentRoutes.js     # order, verify, webhook, history
│       ├── services/
│       │   ├── authService.js       # the only place JWTs are signed
│       │   ├── oauthService.js      # Google + Zoho user sign-in
│       │   ├── otpService.js
│       │   ├── emailService.js      # ZeptoMail (logs to console if unset)
│       │   ├── roadmapService.js
│       │   ├── sessionService.js    # DailySessions lifecycle
│       │   ├── paymentService.js    # Razorpay orders + HMAC verification
│       │   ├── adaptiveService.js   # rolling-average difficulty
│       │   └── statsService.js
│       ├── models/                  # User, OtpCode, UserLanguage, Roadmap,
│       │   │                        #   DailySession, PracticeSession,
│       │   │                        #   Payment, UserLanguageStats
│       ├── middleware/              # auth, rateLimit
│       └── clients/aiServiceClient.js
│
├── server-ai/                       # FastAPI — owns no state
│   ├── app/
│   │   ├── main.py                  # app, CORS, router mounting
│   │   ├── config.py                # settings + key-pool parsing
│   │   ├── auth.py                  # JWT verify only, never issues
│   │   ├── limiter.py               # slowapi rate limiting
│   │   ├── routes/
│   │   │   ├── practice.py          # transcribe, feedback, speak
│   │   │   └── internal.py          # roadmap generation (service key)
│   │   ├── providers/
│   │   │   ├── stt_router.py        # walks the STT chain
│   │   │   ├── llm_router.py        # walks the LLM chain
│   │   │   ├── tts_router.py        # walks the TTS chain
│   │   │   ├── sarvam_stt.py  sarvam_tts.py
│   │   │   ├── zoho_zia_stt.py  zoho_catalyst_llm.py
│   │   │   ├── gemini_*.py  groq_*.py  openai_*.py
│   │   │   ├── nvidia_llm.py  cloudflare_llm.py  openrouter_llm.py
│   │   │   └── deterministic_evaluator.py
│   │   ├── services/llm_roadmap_service.py
│   │   └── data/seed_roadmaps.py
│   └── requirements.txt
│
├── deployment.md                    # step-by-step deploy guide
└── README.md
```

### Routes

| Route | Purpose |
|---|---|
| `/` | Landing — 3D hero, language carousel, pricing |
| `/login` `/register` | Email + password, or Google / Zoho |
| `/verify-email` | 6-digit OTP |
| `/forgot-password` `/reset-password` | Password recovery |
| `/oauth-callback` | Receives the token, forwards to dashboard |
| `/onboarding` | The 3-question setup |
| `/dashboard` | Your languages, streak, stats |
| `/roadmap/:code` | Week-by-week plan |
| `/practice/:code` | The 3-activity session |
| `/progress/:code` | Fluency trend, error breakdown |
| `/paywall` | Shown when free sessions run out |
| `/settings` | Languages, account, theme, membership |
| `/privacy` `/terms` | Legal pages |

---

## Running it locally

**You need:** Node 20+, Python 3.11+, and a MongoDB Atlas URI (or nothing — it
falls back to an in-memory database).

Three terminals.

### 1. Backend — CRUD API

```bash
cd server-node
npm install
cp .env.example .env     # then fill it in, see below
npm run dev              # http://localhost:5000
```

### 2. Backend — AI service

```bash
cd server-ai
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

Open **http://localhost:5173**.

> **No email service configured?** OTP codes are printed to the `server-node`
> console instead of being emailed. Copy the code from there.

> **No AI keys?** The LLM chain falls through to a deterministic generator, so
> roadmaps still work. Speech features need at least a Sarvam key.

---

## Environment variables

### `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_API_URL=http://localhost:8000
```

> ⚠️ `VITE_API_URL` **must end in `/api`**. Vite bakes these in at build time,
> so changing them on Vercel needs a redeploy, not just a save.

### `server-node/.env`

```env
MONGODB_URI=              # omit for an in-memory DB
JWT_SECRET=               # must be identical in server-ai
INTERNAL_SERVICE_KEY=     # must be identical in server-ai
FRONTEND_URL=http://localhost:5173    # comma-separated list allowed

# Email (optional — logs to console if unset)
ZEPTOMAIL_SEND_TOKEN=
ZEPTOMAIL_FROM_EMAIL=
ZEPTOMAIL_FROM_NAME=

# OAuth sign-in
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
ZOHO_OAUTH_CLIENT_ID=
ZOHO_OAUTH_CLIENT_SECRET=
ZOHO_OAUTH_CALLBACK_URL=http://localhost:5000/api/auth/zoho/callback

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
PREMIUM_AMOUNT_PAISE=299900     # paise, so this is ₹2,999
```

### `server-ai/.env`

```env
JWT_SECRET=               # same value as server-node
INTERNAL_SERVICE_KEY=     # same value as server-node
FRONTEND_URL=http://localhost:5173

SARVAM_API_KEYS=          # comma-separated pool, rotated on failure
GROQ_API_KEYS=
GEMINI_API_KEYS=
OPENROUTER_API_KEY=
NVIDIA_NIM_API_KEYS=
CLOUDFLARE_API_KEYS=
CLOUDFLARE_ACCOUNT_ID=
OPENAI_API_KEY=

CATALYST_ORG_ID=
CATALYST_REFRESH_TOKEN=
CATALYST_CLIENT_ID=
CATALYST_CLIENT_SECRET=
```

> **`FRONTEND_URL` accepts a comma-separated list** so the apex domain, its
> `www` form and a `*.vercel.app` fallback can all be allowed during a DNS
> cutover. CORS checks the whole list; OAuth redirects use the first entry.

> **`SARVAM_API_KEYS` accepts multiple keys.** The provider walks them in order
> and falls through on failure. Two keys is strongly recommended — Kannada and
> Hindi have no TTS fallback, so one key stumbling means silence.

---

## How to use the app

1. **Sign up** with email, or continue with Google or Zoho. Email signups get a
   6-digit code; OAuth accounts skip it, since the provider already verified.
2. **Answer three questions** — which language, your level, how many days.
3. **A roadmap is generated**, split into weeks and days.
4. **Open a day and practise:**
   - Read the phrase, press **Hear it** to listen first.
   - Press the microphone, say it, press stop.
   - Play it back, then **Send for feedback**.
   - Read the corrections, play the corrected version, slow it to 0.75× if you
     need to.
   - Rebuild the sentence in the word-order game.
   - Answer the quiz. The day is done and tomorrow unlocks.
5. **Track it** on the progress page — fluency trend and error breakdown.
6. **Add another language** any time from the dashboard.

**Free tier:** your first two sessions. After that it's a one-time ₹2,999
unlock — no subscription, no renewal. Premium also turns Speak into a five-turn
roleplay where the tutor replies in character rather than grading one sentence.

---

## Deployment

| Unit | Host | Notes |
|---|---|---|
| `client/` | Vercel | Auto-deploys on push. Env changes need a redeploy. |
| `server-node/` | Render | `node src/server.js` |
| `server-ai/` | Render | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Database | MongoDB Atlas | `server-node` only |

Full walkthrough in [`deployment.md`](./deployment.md).

**Two traps worth repeating:**

1. **Render does not restart on an environment variable change.** Save the
   variable, then hit **Manual Deploy** or the old value keeps running.
2. **OAuth redirect URIs point at the backend**, not the frontend —
   `.../api/auth/google/callback` — and must match the provider console
   character for character.

---

## Roadmap

### Shipped

- [x] Email + OTP, Google and Zoho sign-in
- [x] Three-question onboarding, AI-generated roadmaps
- [x] Speak → Word order → Quiz, resumable at the exact activity
- [x] Speech-to-text with a five-provider fallback chain
- [x] Native-voice text-to-speech in all 11 languages, with speed control
- [x] Fluency scoring and a six-type error taxonomy
- [x] Daily streaks, sequential day unlock, adaptive difficulty
- [x] Multi-language learning, independent per language
- [x] Razorpay payments with server-side signature verification and webhook
- [x] Light and dark themes, responsive down to 375px
- [x] Deployed on a custom domain with SSL

### Next — 1 to 2 weeks *(as college time allows)*

- [ ] **Real-time conversation.** The current roleplay is turn-based: record,
      wait, reply. The goal is a live call where you just *talk* — streaming
      speech-to-text so the tutor hears you as you speak, with interruption
      handling.
- [ ] **Live translation in the conversation.** Speak in the language you know,
      hear it back in the one you're learning — and the reverse. Useful the
      moment you're stuck mid-sentence.
- [ ] **The AI calling agent.** A voice agent you can actually ring, that talks
      like a friend rather than a test — casual, patient, correcting you
      naturally in conversation instead of grading you. This is the milestone
      the whole project is pointed at.
- [ ] Second Sarvam key in the rotation pool, removing the single point of
      failure for Kannada and Hindi audio.
- [ ] Paid hosting to remove Render's cold starts.

### Later

- [ ] Phoneme-level pronunciation scoring, not just sentence-level
- [ ] Offline practice for the game and quiz
- [ ] Recurring subscriptions (needs Razorpay Subscriptions activation)
- [ ] Shareable streak milestones and a friends leaderboard
- [ ] Automated tests around session resume and payment verification
- [ ] A mobile app wrapper

---

## Hurdles we hit and how we solved them

**Speech feedback silently never fired.**
The recorder returned a transcript object while the practice page read
`.audioBlob` off it, so the pipeline stopped dead with no error. We made the
recorder hand up the raw blob and gave the page ownership of the whole
transcribe → grade → save sequence, which also stopped the audio uploading twice.

**Recordings played back silent.**
The object URL was being revoked from a React effect keyed on that same URL, so
it was freed the instant it was created and `<audio>` pointed at nothing. We now
release URLs by hand, and added silence detection so a dead microphone says so
instead of submitting an empty transcript.

**The entire live site was blocked by CORS.**
Both backends were still allowing `localhost:5173`, so every request from the
real domain was refused. We made `FRONTEND_URL` accept a comma-separated list,
which also covers the apex domain, the `www` form and the DNS cutover window.

**Google sign-in returned "Route not found".**
Two separate causes stacked. The CORS fix made `FRONTEND_URL` a list and the
OAuth redirect pasted the whole list into a URL; and `VITE_API_URL` was missing
its `/api` suffix. We split the redirect origin from the CORS allow-list and
corrected the frontend base URL.

**Payments failed with a generic "Payment Failed".**
The `razorpay` package was corrupted in `node_modules`, the require failure was
swallowed by an empty catch, and the code invented a fake order ID that Razorpay
had never heard of. We removed the fake-order fallback so a gateway problem
reports itself honestly — which is exactly how we found the real cause.

**Intermittent 401s on the speech service.**
Render's clocks run about a second behind, so a freshly issued JWT looked
"not yet valid" and the first call after signing in failed, then worked on
retry. We allowed 60 seconds of leeway when decoding, the standard tolerance for
clock drift across hosts.

**Content occasionally rendered invisible.**
Entrance animations started elements at `opacity: 0` and relied on
requestAnimationFrame to reveal them — which browsers throttle in background
tabs, leaving content permanently blank. Mount animations now move elements
rather than fade them, so the worst case is "visible, slightly offset".

---

## My contribution

I built this project end to end — **Praful Kasamalagi**.

- **Architecture.** Chose the three-service split and the rule that the AI
  service holds no state, so the security boundary stays simple.
- **Backend.** Both services: authentication with OTP and two OAuth providers,
  the roadmap generator, the resumable session lifecycle, streaks, adaptive
  difficulty, and the payment flow with server-side signature verification and a
  webhook backstop.
- **AI integration.** The layered provider chains for speech-to-text, grading
  and speech synthesis, with per-tier timeouts and key rotation so a slow or
  rate-limited provider degrades instead of failing.
- **Frontend.** Every screen, the design token system that makes light and dark
  both work, the recorder and audio player, and the responsive pass down to
  375px.
- **Deployment.** Vercel, two Render services, MongoDB Atlas, the custom domain
  with SSL, and the OAuth, email and payment provider setup.
- **Debugging.** Found and fixed the issues listed above, verifying each against
  the deployed services rather than only locally.

---

## Contributing

Contributions are welcome — especially on the real-time conversation work.

1. **Fork** the repo and clone your fork.
2. **Branch** from `main`:
   ```bash
   git checkout -b fix/short-description
   ```
3. **Set up** all three services as described in
   [Running it locally](#running-it-locally).
4. **Make the change.** A few conventions:
   - `server-node` owns state; `server-ai` must stay stateless.
   - Never accept a payment amount from the client.
   - Never trust a client-reported payment result — verify the signature.
   - Use the design tokens (`bg-surface`, `text-ink`, `border-line`) rather than
     hardcoded colours, so both themes keep working.
   - Don't start UI content at `opacity: 0` in a mount animation.
5. **Check it builds and both themes still look right:**
   ```bash
   cd client && npm run build
   ```
6. **Commit** with a conventional message:
   ```
   fix(auth): reject expired reset codes
   feat(practice): add phoneme-level scoring
   ```
7. **Open a pull request** describing what changed, why, and how you tested it.

**Good first issues:** adding a language to the matrix, improving an error
message, writing a test for the session-resume logic, or improving the empty
states.

**Please don't** commit `.env` files, API keys, or `node_modules`.

---

## AI assistance

An AI coding assistant (Claude) was used during development, mainly to debug
errors in existing code — the recorder and playback issues, the CORS
misconfiguration, the OAuth redirect, and the JWT clock-drift problem described
above. All code was reviewed and tested before being committed.

---

## Known limitations

Stated plainly, because they're real.

- **Cold starts.** Both backends run on Render's free tier and sleep after ~15
  minutes idle. The first request can take 30–60 seconds.
- **One Sarvam key.** Kannada, Hindi and the Tier 2 languages have no
  text-to-speech fallback, so a transient failure on that key produces no audio.
  A second key in the pool fixes this and needs no code change.
- **One-time payment, not recurring.** Renewals, cancellation and dunning are
  out of scope for this version.
- **Turn-based, not full duplex.** The roleplay is record → reply → record.
  Simultaneous speak-while-listening is the next milestone, not a current
  feature.
- **Transcription is imperfect** in noisy rooms or with unfamiliar accents, and
  fluency scores are indicative, not a certification.

---

## Licence

Built as an educational project for the NxtWave GenAI internship assessment.

---

<div align="center">

**ಕನ್ನಡ · हिन्दी · English · தமிழ் · తెలుగు · বাংলা · मराठी · ગુજરાતી · ਪੰਜਾਬੀ · മലയാളം · ଓଡ଼ିଆ**

</div>
