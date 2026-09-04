# VaaniTutor — AI Voice Language Tutor
## Specification (Spec Driven Development)

Submission target: **LLMs Meet Speech — Take-Home Assessment, Project 4 (Intermediate)**
This spec is the single source of truth for the build. The coding agent must return to
this document whenever it is unsure, rather than guessing. Every phase in Section 10
must be built and verified in order, not all at once.

---

## 1. Project Overview

Build a full-stack AI-powered voice language tutor called **VaaniTutor**. On first use,
a learner tells the app which language they want to learn, their starting level
(Basic / Intermediate / Advanced), and how many days they're giving themselves. The
app generates a personalized week-by-week, day-by-day roadmap. Each day's practice is
a **session with three activities** — Speak, a word-order Game, and a recall Quiz —
completed in order; leaving mid-session and returning later resumes exactly where the
learner stopped, never from the start.

**Kannada, Hindi, and English are Tier 1 languages** — they must work flawlessly and
are used for grading and demo. All other Sarvam-supported Indian languages (Section
6.2) must also function end-to-end.

A learner can be **actively learning multiple languages at once**, each with its own
independent roadmap, pace, and progress. Every profile setting is authoritative:
editing a language's level or goal duration in Settings **fully regenerates that
language's day-by-day plan** (Section 6.8); it never affects any other language.

**The first 2 sessions (any language, any length) are free.** From the 3rd session
onward, the account must be Premium — a real one-time payment via Razorpay (Section
6.10), not a simulated flag.

**Premium also unlocks conversational depth in Speak** (Section 6.9b): a free-tier
Speak is one prompt, one correction. A Premium Speak is a short, turn-based roleplay
— the AI tutor replies in character, in-language, correcting naturally as the
conversation continues — the same shape as Duolingo's own paid "Roleplay" feature,
and a genuinely stronger reason to pay than session-count alone. **Turn-based, not
real-time duplex** — record, get a reply, record again; the full-duplex,
speak-while-listening problem stays explicitly out of scope (Section 6.3).

A real **daily streak** (Section 7) tracks calendar days practiced, independent of
which roadmap day a learner is on — since sequential unlock already lets someone
finish several days in one sitting, the streak is a deliberately separate metric,
not a byproduct of roadmap progress.

Five product requirements drive every architecture decision below:
1. **It must feel fast to talk to** — not just "eventually correct."
2. **It must not fail** — speech and LLM calls need real redundancy, not a single
   API key with no plan B.
3. **Every learner's data is fully isolated** — no cross-account leakage, ever.
4. **Zero-cost AI operation** — the LLM/STT layer runs on stacked free tiers wherever
   possible; the *only* real money in this system is what a learner deliberately pays
   for Premium.
5. **Never trust the client** — payment success, in particular, is only ever
   confirmed by a server-side signature check against Razorpay, never by anything the
   browser claims happened.

The app **must be fully responsive** (phone, tablet, laptop, desktop), **must look
deliberately designed rather than like a templated "AI app"** (Section 11), and
**must be fully functional after deployment** — not only in local development.

---

## 2. Tech Stack

**Frontend**
- React 19 (Vite), React Router v6
- Tailwind CSS — mobile-first, utility-only, `darkMode: 'class'`
- Zustand (auth + practice session state + a dedicated theme store)
- Axios (two clients: one for the Node CRUD API, one for the Python AI API)
- Recharts (progress charts — responsive containers only)
- Three.js via `@react-three/fiber` + `@react-three/drei` — **landing page hero
  only**, lazy-loaded so its weight never touches the practice-loop bundle
- GSAP (+ ScrollTrigger) — landing-page scroll reveals; lightweight app-wide
  micro-interactions (record-button pulse, day-complete celebration, transitions)
- Swiper.js — landing feature carousel; `OnboardingWizard` step transitions;
  `RoadmapTimeline`'s mobile week view
- Razorpay Checkout.js (loaded via their CDN script, not npm — this is how Razorpay's
  own hosted payment widget works, and it means raw card data never touches our code)
- Native browser `MediaRecorder` / `getUserMedia` APIs for audio capture
- lucide-react (icons)

**Backend — CRUD service (`server-node`)**
- Node.js 20+, Express
- Mongoose (MongoDB Atlas ODM)
- jsonwebtoken (JWT issuance + verification), bcryptjs (cost 12)
- `razorpay` (official Node SDK) — order creation + signature verification
- OAuth2 client handling for Google and Zoho sign-in (e.g. `simple-oauth2` or
  provider-specific SDKs — either is fine, the flow in Section 6.11 is what matters)
- express-validator, cors, helmet, morgan, express-rate-limit, dotenv

**Backend — AI microservice (`server-ai`)**
- Python 3.11+, FastAPI, Uvicorn
- PyJWT — **verification only**, never issues a token
- httpx (async calls to every AI provider)
- python-multipart (audio upload), pydantic v2 + pydantic-settings
- slowapi (rate limiting — this service is directly internet-facing)
- **No database driver of any kind.** This service is stateless by design; see
  Section 6.

**AI / Speech (all called only from `server-ai`, never from `server-node`)**

- **STT (speech-to-text) — Tier 1 languages (`en-IN`, `hi-IN`, `kn-IN`):** Zoho
- **STT (speech-to-text) — Tier 1 languages (`en-IN`, `hi-IN`, `kn-IN`):** Sarvam
  *Saarika* — primary (Section 6.4). Zoho Catalyst *Zia* — first fallback (Section
  6.4a). Gemini → Groq Whisper → OpenAI Whisper below that. **Every tier has a 5–6
  second timeout** — a provider that doesn't respond in that window is treated
  identically to an error response and the chain moves on immediately, so a hung
  provider can never stall the whole request.
- **STT — all other supported languages:** Zia's confirmed language list is only
  English/Hindi/Kannada, so every other language starts the chain at **Sarvam
  Saarika** instead, same fallback order beneath it (Section 6.2's matrix marks this
  per-language, not as one blanket rule).
- **TTS (text-to-speech):** Sarvam AI *Bulbul v3* via **WebSocket streaming** (sub-250ms
  first byte) — primary for all Indian languages. OpenAI TTS — fallback, English only.
- **LLM (assessment + roadmap + quiz generation) — a tiered, multi-provider chain:**
  1. **`sarvamai/sarvam-m` via OpenRouter** — primary, the only Indic-tuned model.
  2. **Zoho Catalyst QuickML (GLM-4.7-Flash)** — OAuth-based, its own provider file
     (Section 6.4a) — included specifically because it's already covered by the
     existing Catalyst subscription.
  3. **Gemini → Groq → NVIDIA NIM → Cloudflare Workers AI** — the existing
     four-provider free-tier pool, one shared OpenAI-compatible adapter.
  4. **A deterministic rule-based fallback** — the final net.
  (Phase 4's "trim if it's running long" note applies more than ever now — 7 tiers is
  the maximal design, not a mandatory minimum.)

**Payments**
- **Razorpay** — Orders API for a one-time Premium unlock, verified server-side via
  HMAC signature, backed by a webhook as the authoritative source of truth (Section
  6.10). No recurring billing in this version — a deliberate scope cut given the
  timeline; noted plainly in the README, not hidden.

**Database**
- MongoDB Atlas — owned exclusively by `server-node`. In-memory fallback for local dev
  when `MONGODB_URI` is not set.

**Deployment**
- Frontend → Vercel
- `server-node` → Render (web service #1)
- `server-ai` → Render (web service #2)
- Database → MongoDB Atlas
- Source → GitHub

---

## 3. Core Features

1. Register / log in — by email+OTP, **or "Sign in with Google," or "Sign in with
   Zoho"** (Section 6.11).
2. **Onboarding wizard** (three questions): target language, starting level, goal
   duration in days. Reused for every additional language added later.
3. **Learn multiple languages simultaneously**, each fully independent.
4. **Roadmap generation**, once per language, regenerable per Section 6.8.
5. **Each day is a 3-activity session — Speak → Game → Quiz — resumable at the exact
   activity where the learner left off**, no time limit, no forced restart (Section
   6.9a).
   - **Speak:** free tier — record a prompt sentence, get transcribed, get
     structured feedback (corrected sentence, tagged errors, fluency score,
     encouragement), hear the correction spoken back at **0.75× / 1.0× / 1.25×
     playback speed** (native `<audio>` element `playbackRate` — no extra library).
     **Premium — a short turn-based roleplay conversation** (Section 6.9b): the AI
     tutor replies in character each turn, correcting naturally as it goes, up to a
     per-day turn cap, with the same speed control on every `aiReply`.
   - **Game:** the day's target phrase, word order scrambled — drag/tap words back
     into the correct order. Generated for free from the day's existing
     `targetPhrases`, no extra AI call needed.
   - **Quiz:** 2–4 multiple-choice questions recalling that day's vocabulary/grammar,
     generated by the same LLM chain that built the roadmap.
6. **Sequential unlock**: completing a day's full 3-activity session unlocks tomorrow.
   A pace indicator ("Day 4 of 30 — 2 days ahead") is informational only.
7. **The first 2 sessions are free; the 3rd+ requires Premium** (Section 6.10) — a
   real, one-time Razorpay payment, verified server-side.
8. Persisted practice history, progress dashboard (fluency trend, error-type
   breakdown, current level), adaptive difficulty.
9. **Light / Dark / System theme**, persisted to the profile.
10. **Strict per-user data isolation** (Section 6.6).

---

## 4. Authentication & Trust Boundary

- Three ways in: **email + password + OTP verification**, **Google OAuth**, **Zoho
  OAuth** (Section 6.11). All three converge on the same `Users` collection and the
  same JWT issuance — the frontend never needs to know which method a given session
  used.
- Passwords hashed with bcrypt, cost factor 12, and only present at all for
  `authProvider: 'email'` accounts — OAuth accounts have no password.
- Email/password registration does not issue a JWT immediately — it creates the user
  unverified and sends an OTP via ZeptoMail (Section 6.9). Google/Zoho sign-in issues
  the JWT immediately on first login, because the provider has already verified that
  email — running our own OTP on top of theirs would be redundant, not extra-safe.
- `server-node` is the **sole JWT issuer** — 7-day expiry, signed with `JWT_SECRET`.
- `server-ai` **never issues a token**, only verifies against the identical
  `JWT_SECRET` (configured separately per service — the easiest deployment step to
  get wrong; document it explicitly).
- `POST /internal/generate-roadmap` on `server-ai` uses `INTERNAL_SERVICE_KEY`, not a
  user JWT — server-to-server only.
- Frontend Zustand store persists the JWT in `localStorage`; both API clients attach
  it as `Authorization: Bearer <token>`.

---

## 5. Frontend Pages

- **`/`** — Landing page, the one place the full Three.js/GSAP/Swiper treatment
  applies (Section 11). Redirects authenticated users to `/dashboard`.
- **`/login`**, **`/register`** — email/password + OTP flow, plus "Continue with
  Google" / "Continue with Zoho" buttons.
- **`/verify-email`** — 6-digit OTP entry, email/password signups only.
- **`/forgot-password`**, **`/reset-password`**
- **`/onboarding`** — reused for every language added.
- **`/dashboard`** — one card per active language: current day, pace indicator,
  **streak** (Section 7), "Continue" CTA (which resumes mid-session — including
  mid-conversation on Premium — if one is in progress).
- **`/practice/:languageCode`** — the 3-activity session UI: a stepper (Speak → Game
  → Quiz), each activity's own screen, always opening at the resume point the backend
  returns, never at the start unless nothing has been done yet. Every spoken-back
  audio clip (corrections and `aiReply`) has a 0.75×/1.0×/1.25× speed toggle.
- **`/paywall`** — shown when the 3rd session is blocked; states the price plainly,
  triggers Razorpay Checkout.
- **`/roadmap/:languageCode`**, **`/progress/:languageCode`**
- **`/settings`** — profile hub: theme; language management (add / edit-with-
  confirmation-regenerate / archive); **Premium status and purchase history**.
- **`*` (404)**

---

## 6. Backend Architecture

### 6.1 The core rule

**`server-node` owns all state. `server-ai` owns no state at all.** `server-ai`
receives inputs, calls an AI provider, and returns outputs — nothing it does is ever
persisted by `server-ai` itself.

### 6.2 Language & Provider Matrix (v1 — fully supported and tested)

| Language | Code | STT primary | STT fallback chain | TTS primary | TTS fallback |
|---|---|---|---|---|---|
| English (India) — Tier 1 | `en-IN` | **Sarvam Saarika** | Zia (Zoho Catalyst) → Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | OpenAI TTS |
| Hindi — Tier 1 | `hi-IN` | **Sarvam Saarika** | Zia (Zoho Catalyst) → Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Kannada — Tier 1 | `kn-IN` | **Sarvam Saarika** | Zia (Zoho Catalyst) → Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Tamil | `ta-IN` | Sarvam Saarika | Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Telugu | `te-IN` | Sarvam Saarika | Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Bengali | `bn-IN` | Sarvam Saarika | Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Marathi | `mr-IN` | Sarvam Saarika | Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Gujarati | `gu-IN` | Sarvam Saarika | Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Punjabi | `pa-IN` | Sarvam Saarika | Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Malayalam | `ml-IN` | Sarvam Saarika | Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |
| Odia | `od-IN` | Sarvam Saarika | Gemini → Groq Whisper → OpenAI Whisper | Sarvam Bulbul v3 (stream) | — |

**Rule:** don't extend Zia beyond the three languages actually confirmed. If a future
Zia update adds more, update this table — don't assume coverage that hasn't been
verified against Zoho's own documentation.

### 6.3 Latency design (the "feels good to talk to" requirement)

- Sarvam's WebSocket streaming TTS; tight LLM output-token caps; Sarvam-M's
  "non-think" mode; ~15–20s recording cap. Full duplex streaming STT stays explicitly
  out of scope — say so plainly in the README.
- **The 0.75×/1.0×/1.25× playback speed toggle (Section 3) is a client-side
  `playbackRate` adjustment on already-received audio — it has nothing to do with
  how the audio was fetched.** It does not replace or substitute for the WebSocket
  streaming requirement above; both apply independently. Don't let "we added speed
  control" become a reason to build the batch HTTP endpoint instead of the streaming
  one — they solve different problems.

### 6.4 Sarvam key rotation for speech (now the STT primary for every language)

- `SARVAM_API_KEYS` — comma-separated pool (1–2 keys). Round-robin with cooldown on
  401/403/429/5xx, inside `providers/sarvam_stt.py` / `sarvam_tts.py`, before ever
  surfacing an error outward.
- **Every provider call in the STT chain — Sarvam included — has a 5–6 second
  timeout.** A provider that simply doesn't respond in that window is treated
  identically to an error response and the chain moves to the next tier immediately.
  Without this, a hung (not erroring, just silent) provider could stall the entire
  request indefinitely — a worse outcome than a clean fast failure, and directly
  against Section 6.3's "feels fast" requirement.
- Only once the entire Sarvam key pool is exhausted or times out does the chain fall
  to Zia (Zoho Catalyst, Tier-1 languages only — Section 6.4a), then Gemini, then Groq
  Whisper, then OpenAI Whisper, per the matrix in 6.2.

### 6.4a Zoho Catalyst OAuth providers — Zia (STT fallback) and QuickML/GLM-4.7-Flash (LLM)

**This is a different auth pattern from everything else in the system, and it must
not be confused with Section 6.11's "Sign in with Zoho."** Section 6.11 is an *end
user* proving who they are to log into VaaniTutor. This section is *our backend*
proving to Zoho Catalyst that it's allowed to call Zia/QuickML on its own behalf — a
service credential, with no end user involved at all. Two completely separate OAuth
relationships that happen to both say "Zoho."

- Catalyst issues a long-lived **refresh token** (generated once, manually, via the
  Catalyst API Console's self-client flow — Section 17) that `server-ai` exchanges for
  short-lived access tokens as needed, caching each until near expiry.
- `providers/zoho_zia_stt.py` and `providers/zoho_catalyst_llm.py` each wrap this
  token exchange, then call their respective Catalyst endpoint (`CATALYST-ORG` header
  + `Authorization: Zoho-oauthtoken <token>`).
- Neither reuses `openai_compatible_llm.py` — that adapter assumes simple bearer-key
  auth; Catalyst's OAuth token exchange is structurally different and deserves its own
  small, honestly-named files rather than being forced into the wrong abstraction.
- Env vars: `CATALYST_ORG_ID`, `CATALYST_REFRESH_TOKEN`, `CATALYST_CLIENT_ID`,
  `CATALYST_CLIENT_SECRET`.

### 6.5 LLM flow — the full chain

1. `sarvamai/sarvam-m` via OpenRouter — quality-first primary.
2. Zoho Catalyst GLM-4.7-Flash (Section 6.4a).
3. Gemini → Groq → NVIDIA NIM → Cloudflare Workers AI (`openai_compatible_llm.py`,
   one adapter, four configs).
4. Deterministic rule-based fallback.

Every tier returns the same structured JSON contract: `correctedText`,
`errors: [{ type, original, corrected, explanation }]`, `fluencyScore`,
`encouragement`. Roadmap generation and quiz generation use the same chain with their
own schemas (roadmap: `weeks[].days[]` as before, now with an added `quiz: [{
question, options, correctAnswerIndex }]` per day). On any failure, fall through; one
retry on malformed JSON before falling through.

### 6.6 Data isolation

Unchanged from prior versions — every query scoped to the JWT's `userId`, ownership
checked on every fetch-by-id, compound indexes, no cross-user aggregation, mandatory
two-account test in Phase 5.

### 6.7 `server-node` ↔ `server-ai` call map

| Caller | Route | Auth | Purpose |
|---|---|---|---|
| `server-node` → `server-ai` | `POST /internal/generate-roadmap` | `X-Internal-Key` | First-time generation and regeneration |
| Frontend → `server-ai` | `POST /api/practice/transcribe` | User JWT | Audio → transcript |
| Frontend → `server-ai` | `POST /api/practice/feedback` | User JWT | Transcript → structured assessment |
| Frontend → `server-ai` | `POST /api/practice/speak` | User JWT | Text → streamed audio |
| Frontend → `server-node` | everything else | User JWT | Auth, payments, profile, roadmap, sessions, progress |

### 6.8 Roadmap regeneration & multi-language state

Unchanged from prior versions: editing a language's level/duration in Settings
regenerates *only* that language's plan back to Day 1; `PracticeSessions` and
`UserLanguageStats` are preserved, never deleted; other languages are never touched;
"stop learning" is an archive toggle, not a delete.

### 6.9 Email verification (Zoho ZeptoMail)

Unchanged: 6-digit OTP, bcrypt-hashed before storage, 10-minute expiry, 5-attempt
cap, 1/60s resend limit, `OtpCodes` collection with a TTL index, reused for
password-reset. **Only applies to `authProvider: 'email'` accounts** — Google/Zoho
sign-ins skip this entirely (Section 4).

### 6.9a Resumable 3-activity sessions (Speak → Game → Quiz)

**The problem this solves:** a learner starts today's practice, finishes the Speak
activity, then has to leave. Coming back later must not make them redo Speak, and
must not silently skip them ahead either — it must land exactly on Game.

- A **`DailySessions`** document is created the first time a learner opens a given
  roadmap day's practice, `status: 'in_progress'`, `currentActivityIndex: 0`.
- `GET /api/practice/session/:languageCode` is the single entry point the frontend
  calls whenever `/practice/:languageCode` loads. It returns the current unlocked
  day's `DailySessions` document — creating one only if none exists yet for that day
  (this is also where the free-session cap in Section 6.10 is enforced, since
  *creating* a new `DailySessions` document is what counts as "starting a session").
  If one already exists and is `in_progress`, it's returned as-is — the frontend
  renders whichever activity `currentActivityIndex` points to. **No separate "resume"
  button, no separate "save" action — this is just what loading the page always
  does.**
- Completing **Speak** persists the existing `PracticeSessions` document as before
  (Sections 6.5/6.7), now also carrying `dailySessionId`, and advances
  `currentActivityIndex` to 1.
- Completing **Game** writes `DailySessions.gameResult` (`{ completed, correct,
  attempts }` — scoring is trivial string comparison against the unscrambled phrase,
  no AI call involved) and advances `currentActivityIndex` to 2.
- Completing **Quiz** writes `DailySessions.quizResult` (`{ answers, score }`),
  advances `currentActivityIndex` to 3, sets `status: 'completed'`, and — exactly as
  before — marks the parent roadmap day's `completedAt`, which is what unlocks
  tomorrow (Section 6.8's unlock logic is unchanged; it just now triggers off the
  3rd activity instead of the only activity).
- **No time limit anywhere in this flow** — a `DailySessions` document can sit
  `in_progress` indefinitely; nothing expires it, nothing forces a restart.

### 6.9b Conversational AI tutor (Premium enhancement to Speak)

**Scope, stated precisely so it doesn't drift into 6.3's out-of-scope territory:**
this is a **turn-based** exchange — record, receive a reply, record the next turn.
It is not simultaneous speak-while-listening, no interruption handling, no streaming
duplex audio. That distinction is what keeps this buildable inside the existing
batch STT → LLM → TTS pipeline instead of becoming a second, much harder project.

- Each roadmap day gains a `scenario` field (a short roleplay premise — "You're
  checking into a hotel in Mysuru" — generated by the same LLM chain as the rest of
  the day's content, Section 6.5).
- **Turn cap is the entire gate, nothing else changes:** `maxTurns = 1` for
  `!user.isPremium` (today's existing single-exchange Speak, byte-for-byte
  unchanged), `maxTurns = 5` for `user.isPremium`. The 2-free-session count (Section
  6.10) is untouched by this — it's an orthogonal gate on session *count*; this is a
  gate on per-session *depth*, checked purely off `isPremium`.
- Each `PracticeSessions` document gains `turnIndex` (0-based) and `aiReplyText`. The
  LLM call for turn *n* receives the scenario plus every prior turn in the
  conversation as context, and returns `{ aiReply, correctedText, errors[],
  fluencyScore, encouragement }` in one shot — `aiReply` is what TTS speaks: a
  natural, in-character continuation that folds the correction in rather than
  bolting a separate "here's your correction" readout onto a separate reply.
  `correctedText`/`errors` still drive the `FeedbackPanel`'s grammar breakdown as
  before — the two serve different UI purposes and both are kept.
- **Resume extends one level deeper than 6.9a's `currentActivityIndex`:** when
  `currentActivityIndex === 0` (still on Speak), `GET /api/practice/session/:code`
  also returns `speakTurnIndex` — how many turns of the conversation are already
  recorded — so reloading mid-roleplay lands on turn 3 of 5, not turn 1.
- Speak activity completes (advances `currentActivityIndex` to 1) once `turnIndex`
  reaches `maxTurns`, exactly mirroring the existing single-turn completion logic —
  free-tier's `maxTurns = 1` means this is a strict superset of the current design,
  not a rewrite of it.

### 6.10 Premium — Razorpay, real payment, server-verified

**Free tier:** `Users.freeSessionsUsed` increments by 1 every time a *new*
`DailySessions` document is created (Section 6.9a) — not on resume. Before creating
one, `server-node` checks: if `!user.isPremium && freeSessionsUsed >= 2`, respond
`402 Payment Required` instead of creating it. The frontend routes this straight to
`/paywall`.

**Purchase flow — the sequence matters, especially step 4:**
1. `POST /api/payments/create-order` — `server-node` calls Razorpay's Orders API
   *server-side*, for a fixed amount **set only by server-side config, never accepted
   from the client** (a client-supplied amount is a classic payment-bypass
   vulnerability — a malicious request could otherwise ask for a ₹1 order). Returns
   `{ orderId, amount, currency: 'INR', razorpayKeyId }` — `razorpayKeyId` is the
   *public* key, safe to expose; `RAZORPAY_KEY_SECRET` never leaves `server-node`.
2. Frontend opens Razorpay Checkout.js with that order. The learner pays by
   card/UPI/netbanking entirely inside Razorpay's own hosted widget — raw payment
   details never pass through our servers at all.
3. On completion, Checkout.js hands the frontend `{ razorpay_payment_id,
   razorpay_order_id, razorpay_signature }`.
4. **The frontend's claim that payment succeeded is not trusted.** It POSTs those
   three values to `POST /api/payments/verify`, which recomputes
   `HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)` and compares it to
   `razorpay_signature`. Only on a match does `server-node` set `Users.isPremium =
   true` and write a `Payments` record. Anything else — mismatch, missing field,
   tampered value — is rejected and nothing unlocks.
5. **`POST /api/payments/webhook`** is the authoritative backstop, independent of
   step 4 ever completing: Razorpay calls this directly, signed with a *separate*
   `RAZORPAY_WEBHOOK_SECRET` (via the `X-Razorpay-Signature` header), on
   `payment.captured` / `payment.failed`. This covers the case where a learner pays
   successfully but closes the tab before step 3–4 fire — without it, a real payment
   could go uncredited. Verify this signature too, independently of step 4's.

**Scope cut, stated plainly for the README:** this is a one-time unlock, not a
recurring subscription. Recurring billing (renewal webhooks, cancellation, dunning on
failed renewal charges) is real additional scope this version doesn't take on.

---

## 6.11 Sign in with Google / Sign in with Zoho

**Not to be confused with Section 6.4a** — this is an end user authenticating to
VaaniTutor, nothing to do with our backend calling Catalyst.

1. `GET /api/auth/google` (or `/zoho`) redirects the browser to the provider's OAuth
   consent screen with our registered redirect URI.
2. Provider redirects back to `GET /api/auth/google/callback` (or `/zoho/callback`)
   with an authorization code.
3. `server-node` exchanges the code for the provider's access token, fetches the
   user's email/name from the provider's profile endpoint.
4. Find-or-create a `User` by email. New accounts get `authProvider: 'google' |
   'zoho'`, `emailVerified: true` immediately (Section 4), no `passwordHash`.
5. Issue our JWT, redirect to `FRONTEND_URL/oauth-callback?token=...`; the frontend
   stores it exactly like any other login.

Env vars: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`ZOHO_OAUTH_CLIENT_ID`, `ZOHO_OAUTH_CLIENT_SECRET`.

---

## 7. Database Collections (all in `server-node` / MongoDB Atlas)

- **Users** — `name`, `email` (unique), `passwordHash` (nullable — only for
  `authProvider: 'email'`), `authProvider` (`'email' | 'google' | 'zoho'`),
  `googleId` / `zohoId` (nullable), `emailVerified`, `themePreference`,
  `isPremium` (default `false`), `premiumSince` (nullable), `freeSessionsUsed`
  (default `0`), `createdAt`, `lastLogin`.
- **OtpCodes** — `userId`, `email`, `codeHash`, `purpose`, `attempts`, `expiresAt`
  (TTL-indexed), `createdAt`.
- **UserLanguages** — `userId`, `languageCode`, `startLevel`, `level`, `status`
  (`'active' | 'archived'`), `sessionsCount`, `lastPracticedAt`, `currentStreak`,
  `longestStreak`, `lastStreakDate` (the calendar date last credited — incremented
  when a `DailySessions` completes on a new calendar date since this value, reset to
  1 on a missed day; deliberately independent of roadmap-day progress, since
  sequential unlock already lets a learner finish several days in one sitting).
- **Roadmaps** — `userId`, `languageCode`, `totalDays`, `generatedBy`, `createdAt`,
  `startedAt`, `regenerationCount`, `weeks: [{ weekNumber, theme, days: [{
  dayNumber, topic, targetPhrases, grammarFocus, promptText, translationEnglish,
  scenario, quiz: [{ question, options, correctAnswerIndex }], completedAt }] }]`.
- **DailySessions** — `userId`, `languageCode`, `roadmapDayId`, `status`
  (`'in_progress' | 'completed'`), `currentActivityIndex` (0–3), `gameResult`,
  `quizResult`, `startedAt`, `completedAt`.
- **PracticeSessions** — `userId`, `languageCode`, `dailySessionId`, `roadmapDayId`
  (soft reference — Section 6.8), `turnIndex`, `promptText`, `transcript`,
  `sttProvider`, `aiReplyText` (Premium conversational reply, null on free tier),
  `correctedText`, `errors`, `fluencyScore`, `encouragement`, `llmProvider`,
  `durationMs`, `createdAt`.
- **Payments** — `userId`, `razorpayOrderId`, `razorpayPaymentId` (nullable until
  captured), `amount`, `currency`, `status` (`'created' | 'captured' | 'failed'`),
  `createdAt`, `capturedAt`.
- **Prompts** — seed data for the deterministic roadmap fallback.
- **UserLanguageStats** — unchanged, survives roadmap regeneration.

---

## 8. API Endpoints

### 8.1 `server-node`

**Health & Auth**
- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `GET /api/auth/google`, `GET /api/auth/google/callback`
- `GET /api/auth/zoho`, `GET /api/auth/zoho/callback`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/auth/me`, `PATCH /api/auth/profile`

**Languages & Roadmap**
- `GET /api/languages`
- `POST /api/roadmap/generate`, `GET /api/roadmap/:languageCode`,
  `POST /api/roadmap/:languageCode/regenerate`
- `PATCH /api/languages/:languageCode/status`

**Practice sessions (3-activity, resumable, turn-aware within Speak)**
- `GET /api/practice/session/:languageCode` — the resume entry point (Sections
  6.9a/6.9b); returns `currentActivityIndex` and, while still on Speak,
  `speakTurnIndex` and `maxTurns`; `402` if the free-session cap is hit.
- `POST /api/practice/sessions` — persists a Speak exchange, advances the parent
  `DailySessions`.
- `POST /api/practice/session/:id/game`, `POST /api/practice/session/:id/quiz` —
  record Game/Quiz results, advance/complete the session.
- `GET /api/practice/sessions?language=kn-IN`, `GET /api/practice/sessions/:id`

**Progress**
- `GET /api/progress/:languageCode`

**Payments**
- `POST /api/payments/create-order`, `POST /api/payments/verify`,
  `POST /api/payments/webhook` (Razorpay-signed, not user-JWT)

### 8.2 `server-ai`

- `GET /health`
- `POST /internal/generate-roadmap` — now also generates each day's `quiz`.
- `POST /api/practice/transcribe`, `POST /api/practice/feedback`,
  `POST /api/practice/speak`

---

## 9. Folder Structure

```
project/
├── client/
│   └── src/
│       ├── components/
│       │   ├── AppShell/
│       │   ├── ThemeToggle/
│       │   ├── landing/               (Hero3D, ScrollRevealSection, FeatureCarousel
│       │   │                            — lazy-loaded, never imported outside `/`)
│       │   ├── OnboardingWizard/
│       │   ├── LanguageCard/
│       │   ├── RecorderButton/
│       │   ├── AudioPlayer/          (plays corrected audio + aiReply; 0.75x/1.0x/1.25x
│       │   │                          playbackRate toggle; consumes the streamed
│       │   │                          response from /api/practice/speak)
│       │   ├── SessionStepper/        (Speak -> Game -> Quiz, resumes at currentActivityIndex)
│       │   ├── WordOrderGame/
│       │   ├── QuizCard/
│       │   ├── RoadmapTimeline/
│       │   ├── PromptCard/
│       │   ├── FeedbackPanel/
│       │   ├── ProgressChart/
│       │   ├── PaywallModal/
│       │   └── ProtectedRoute/
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── VerifyEmail.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── ResetPassword.jsx
│       │   ├── OAuthCallback.jsx
│       │   ├── Onboarding.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Practice.jsx
│       │   ├── Paywall.jsx
│       │   ├── Roadmap.jsx
│       │   ├── Progress.jsx
│       │   ├── Settings.jsx
│       │   └── NotFound.jsx
│       ├── store/
│       │   ├── authStore.js
│       │   ├── themeStore.js
│       │   └── practiceStore.js
│       ├── services/
│       │   ├── api.js
│       │   ├── aiApi.js
│       │   └── recorder.js
│       ├── App.jsx
│       └── main.jsx
│
├── server-node/
│   └── src/
│       ├── server.js
│       ├── config/
│       │   ├── env.js
│       │   └── db.js
│       ├── routes/
│       │   ├── authRoutes.js          (incl. OAuth + OTP + profile)
│       │   ├── languageRoutes.js
│       │   ├── roadmapRoutes.js
│       │   ├── practiceRoutes.js      (incl. session/game/quiz)
│       │   ├── paymentRoutes.js
│       │   └── progressRoutes.js
│       ├── controllers/
│       ├── services/
│       │   ├── authService.js
│       │   ├── oauthService.js        (Google + Zoho user-login exchange)
│       │   ├── otpService.js
│       │   ├── emailService.js        (ZeptoMail — the only file that calls it)
│       │   ├── paymentService.js      (Razorpay order + signature verification)
│       │   ├── roadmapService.js
│       │   ├── sessionService.js      (DailySessions lifecycle, Section 6.9a)
│       │   ├── adaptiveService.js
│       │   └── statsService.js
│       ├── clients/
│       │   └── aiServiceClient.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── rateLimit.js
│       └── models/
│           ├── User.js
│           ├── OtpCode.js
│           ├── UserLanguage.js
│           ├── Roadmap.js
│           ├── DailySession.js
│           ├── PracticeSession.js
│           ├── Payment.js
│           ├── Prompt.js
│           └── UserLanguageStats.js
│
└── server-ai/
    └── app/
        ├── main.py
        ├── config.py
        ├── auth.py
        ├── routes/
        │   ├── internal.py
        │   └── practice.py
        ├── services/
        │   ├── stt_service.py
        │   ├── tts_service.py
        │   ├── llm_service.py
        │   └── prompt_bank_service.py
        ├── providers/
        │   ├── base_stt.py / sarvam_stt.py / zoho_zia_stt.py / gemini_stt.py /
        │   │   groq_whisper_stt.py / whisper_stt.py
        │   ├── base_tts.py / sarvam_tts.py / openai_tts.py
        │   ├── base_llm.py
        │   ├── openrouter_llm.py
        │   ├── zoho_catalyst_llm.py    (Section 6.4a -- its own OAuth handling)
        │   ├── openai_compatible_llm.py
        │   └── deterministic_llm.py
        ├── models/
        └── data/
            └── seed_prompts.json
```

---

## 10. Development Phases

Eight phases now. Verify each before starting the next.

- **Phase 1 — Foundation & all sign-in paths:** `server-node` skeleton, Mongo Atlas
  (in-memory fallback), email+OTP auth **and** Google **and** Zoho OAuth sign-in
  (Section 6.11), `server-ai` skeleton + JWT verify-only + `/health`.
  React+Vite+Tailwind scaffold, Zustand auth store, responsive `AppShell` with a
  working theme toggle. **Verify:** all three sign-in paths produce a working,
  isolated account; login before OTP-verifying an email account is rejected.

- **Phase 2 — Onboarding, roadmap, multi-language, regeneration:** unchanged in
  substance from prior versions, now generating each day's `quiz` alongside the rest.

- **Phase 3 — Speech input:** Sarvam primary for every language, Zia (Zoho Catalyst)
  as the first fallback for Tier-1 languages specifically, full fallback chain per
  6.2, 5–6s timeout per tier (Section 6.4). **Verify:** real Kannada/Hindi/English
  audio transcribes on Sarvam; force it down and confirm Zia picks up for those three
  languages only; confirm a Tamil recording correctly skips Zia entirely (it's not in
  Tamil's chain at all) and falls straight to Gemini if Sarvam is down.

- **Phase 4 — Assessment, the 7-tier LLM chain:** including Zoho Catalyst
  GLM-4.7-Flash (Section 6.4a). **Verify:** each tier's fall-through, including
  Catalyst's OAuth token refresh under a forced-expiry test. Trim tiers if this phase
  runs long — note the trim in the README.

- **Phase 5 — Speech output, the 3-activity session, conversation, streak,
  isolation:** TTS chain, `DailySessions` lifecycle (Speak → Game → Quiz), resume-on-
  reload including turn-level resume within Speak (Section 6.9b), the `isPremium`
  turn-cap branch (1 turn free / 5 turns Premium), streak increment/reset logic,
  sequential unlock now gated on full-session completion. **Verify:** leaving
  mid-Game and reloading lands back on Game, not Speak or Quiz; leaving mid-roleplay
  on turn 3 and reloading lands on turn 3, not turn 1; a free-tier account never
  reaches turn 2 regardless of what it sends; the streak increments once per
  calendar day and resets correctly after a missed day; the two-account isolation
  test.

- **Phase 6 — Progress & adaptive difficulty:** unchanged in substance.

- **Phase 7 — Payments:** Razorpay order creation, Checkout.js integration,
  server-side signature verification, webhook handler, the free-session cap and
  `/paywall` redirect. **Verify:** a real test-mode Razorpay payment unlocks Premium;
  tampering with the client-side verification payload is correctly rejected;
  simulate the webhook path independently of the verify-call path succeeding.

- **Phase 8 — Visual design, responsiveness & deployment:** the landing page's
  Three.js/GSAP/Swiper treatment (Section 11), full responsive pass, deploy all three
  units, full post-deploy checklist including a real payment and a real OTP email on
  the live domain.

---

## 11. UI & UX Requirements

**Visual identity — avoid the generic "AI app" look.** No purple-gradient-on-black
default. Pick one intentional, distinctive palette; build genuine Light **and** Dark
variants, each with its own considered contrast (WCAG AA). Consult the
`frontend-design` skill before writing component CSS.

**Animation is tiered, deliberately — this protects Section 6.3's latency
requirement, it isn't an oversight:**
- **`/` (landing) only:** the full treatment — a Three.js hero (inspiration: dense,
  isometric geometric shapes with a clean gradient accent, not a generic AI-purple
  gradient — the Catalyst-by-Zoho reference is a good example of this done well),
  GSAP ScrollTrigger reveals, a Swiper feature carousel. Code-split and lazy-loaded so
  none of it is in the bundle a learner downloads just to record a practice sentence.
- **Everywhere else (dashboard, practice, progress, settings):** light GSAP
  micro-interactions only — a record-button pulse while recording, a day-complete
  celebration, page transitions. No WebGL, no scroll-triggered scenes. These are
  functional, frequently-revisited, often-on-a-budget-Android-phone screens; a heavy
  3D scene here would work against the exact "feels fast" requirement this whole spec
  is built around.

Mobile-first Tailwind breakpoints, `AppShell` responsive nav, 44px touch targets, the
large thumb-reachable record button, `ResponsiveContainer` charts, skeleton loading
states, distinct human-readable error states, both themes checked on every component,
the standard device test matrix — all unchanged from prior versions.

---

## 12. Security Requirements

- Bcrypt cost 12; OTP codes hashed, 10-min expiry, 5-attempt cap, 1/60s resend limit.
- `JWT_SECRET` identical across both backend services; `INTERNAL_SERVICE_KEY` for the
  internal roadmap-generation call; both CORS lists restricted to `FRONTEND_URL`.
- **Payment-specific, non-negotiable:** the order amount is set server-side only,
  never accepted from the client. Payment success is only ever confirmed by an HMAC
  signature check (Section 6.10) — never by trusting a client POST that says "it
  worked." The webhook signature is verified independently of the checkout-flow
  signature, using its own secret.
- Catalyst's OAuth refresh token (Section 6.4a) is a service credential with broad
  access to your Catalyst org — treat it with at least the same care as `JWT_SECRET`,
  never log it, never commit it.
- Full environment variable list: `SARVAM_API_KEYS`, `OPENAI_API_KEY`,
  `OPENROUTER_API_KEY`, `GEMINI_API_KEYS`, `GROQ_API_KEYS`, `NVIDIA_NIM_API_KEYS`,
  `CLOUDFLARE_API_KEYS`, `CLOUDFLARE_ACCOUNT_ID`, `CATALYST_ORG_ID`,
  `CATALYST_REFRESH_TOKEN`, `CATALYST_CLIENT_ID`, `CATALYST_CLIENT_SECRET`,
  `MONGODB_URI`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, `ZEPTOMAIL_SEND_TOKEN`,
  `ZEPTOMAIL_FROM_EMAIL`, `ZEPTOMAIL_FROM_NAME`, `GOOGLE_OAUTH_CLIENT_ID`,
  `GOOGLE_OAUTH_CLIENT_SECRET`, `ZOHO_OAUTH_CLIENT_ID`, `ZOHO_OAUTH_CLIENT_SECRET`,
  `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.

---

## 13. Deployment

```
GitHub → Vercel        (client/,      npm run build,            output "dist")
                        → custom domain: learninglanguagesai.in
       → Render #1     (server-node/, npm install,               start: node src/server.js)
       → Render #2     (server-ai/,   pip install -r requirements.txt,
                                       start: uvicorn app.main:app --host 0.0.0.0 --port $PORT)
                        → MongoDB Atlas   (server-node only)
```

- **Custom domain, frontend:** `learninglanguagesai.in` is connected as Vercel's
  production domain (Project Settings → Domains → Add), not left on the default
  `*.vercel.app` URL. Vercel provides the A/CNAME records to add in GoDaddy's DNS —
  same DNS zone the ZeptoMail records live in, and Vercel auto-provisions the SSL
  certificate once DNS resolves. This depends on the same .in identity verification
  from Section 17 being complete; domain edits are unreliable before that.
- **This changes `FRONTEND_URL` everywhere it's used for CORS** (Section 12): once
  connected, `FRONTEND_URL` on both `server-node` and `server-ai` becomes
  `https://learninglanguagesai.in`, not the `*.vercel.app` URL. Keep the `.vercel.app`
  URL working as a fallback during the DNS cutover window rather than switching CORS
  over before the domain has actually finished propagating — a brief period where
  both origins are allowed is safer than a hard cutover that locks you out mid-test.
- **Render env vars — `server-node`:** all of Section 12's list that belong to it —
  Mongo, JWT/internal secrets, ZeptoMail, both OAuth login providers, Catalyst's OAuth
  credentials (if `server-node` proxies Catalyst calls) or note them on `server-ai`
  if it calls Catalyst directly, and all three Razorpay values.
- **Render env vars — `server-ai`:** `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, and every
  AI-provider credential including `CATALYST_*`.
- **OAuth redirect URIs** (Google Cloud Console, Zoho API Console) point at the
  *backend*'s callback routes (`server-node`'s Render URL, e.g.
  `.../api/auth/google/callback`), not the frontend domain — these must be updated to
  the deployed Render URL before Phase 1's Google/Zoho sign-in works in production; a
  local `localhost` redirect URI does not carry over automatically.
- **Post-deploy checklist:** every prior version's checklist, plus — the app loads
  correctly at `https://learninglanguagesai.in` with a valid SSL certificate, sign in
  via Google, sign in via Zoho, complete a real Speak→Game→Quiz session, confirm it
  resumes correctly if you reload mid-Game, hit the paywall on session 3, complete a
  real Razorpay test-mode payment and confirm Premium unlocks, confirm the *webhook*
  path also works independently (temporarily block the verify-call response and
  confirm the webhook alone still credits the payment).

---

## 14. Final Expected Outcome

A learner can sign in however they prefer, work through a resumable three-part daily
session in whichever language and theme they choose, and hit a real, honestly-built
paywall after their two free sessions — with payment confirmed the correct way, never
by trusting the browser. Premium isn't just "more sessions": it's a genuinely
different Speak experience, a short in-character roleplay that talks back and
corrects naturally as it goes, instead of one graded sentence. A real daily streak
tracks consistency independent of roadmap progress. Behind it, STT runs through
Sarvam first for every language, with Zoho's own Zia model as the Tier-1 fallback,
and the LLM chain now includes Zoho's own hosted GLM-4.7-Flash alongside five other
independent providers, and the landing page carries real motion design without any of
that weight reaching the actual practice loop. Everything must work identically on
the deployed URLs, not only on localhost.

---

## 15. Codex / AI Coding Agent Instructions

- Build phase by phase per Section 10.
- **Never let `server-node` call an AI provider SDK; never let `server-ai` touch a
  database.** Hard boundaries.
- **Never trust a client-reported payment result.** Every unlock traces back to a
  verified HMAC signature or a verified webhook — nothing else.
- **Never accept a payment amount from the client.** Server-side constant only.
- Keep Section 6.4a's two Zoho OAuth relationships (Catalyst service credential vs.
  end-user sign-in) in genuinely separate code paths — don't let them share a token
  cache or a client/secret pair even if it's tempting to reuse variables.
- `zoho_catalyst_llm.py` and `zoho_zia_stt.py` are their own files, not squeezed into
  `openai_compatible_llm.py` — the auth pattern doesn't fit that abstraction.
- Three.js/GSAP-heavy code lives only under `components/landing/` and is lazy-loaded
  — verify with a bundle-size check that `/practice` doesn't pull it in.
- Resume logic (Section 6.9a) has one entry point, `GET /api/practice/session/:code`
  — don't build a second, parallel way to start or resume a session.
- Note any AI coding assistant use in the README.

---

## 16. Submission Checklist

- [ ] Repo on GitHub, committed incrementally
- [ ] README: setup for all three services, both Zoho OAuth relationships explained
      distinctly, Razorpay test-mode setup, the account-level-quota rationale, the
      regeneration and resume semantics, AI-assistant note
- [ ] Deployed frontend works end-to-end, both themes
- [ ] Both deployed backends reachable
- [ ] A real test-mode payment completes successfully on the deployed URL
- [ ] Repo link submitted via the Google Form before **Monday, 11:59 PM**

---

## 17. What to actually do in the Zoho Catalyst console (and elsewhere)

Five separate manual setup tasks — none of these can be automated by the coding
agent, and several are easy to conflate with each other:

1. **"Sign in with Zoho" (end users logging in) —** in the **Zoho API Console**
   (api-console.zoho.com), create a **Server-based Application** client. Set the
   redirect URI to your deployed backend's `/api/auth/zoho/callback`. Copy the
   Client ID/Secret into `ZOHO_OAUTH_CLIENT_ID` / `ZOHO_OAUTH_CLIENT_SECRET`.
2. **"Sign in with Google" —** in **Google Cloud Console**, configure the OAuth
   consent screen, then create an OAuth Client ID (Web application), redirect URI
   pointing at `/api/auth/google/callback`. Into `GOOGLE_OAUTH_CLIENT_ID` /
   `GOOGLE_OAUTH_CLIENT_SECRET`.
3. **Catalyst service credential (for Zia + GLM-4.7-Flash, Section 6.4a) —** inside
   your Catalyst console, under QuickML → LLM Serving, deploy/create an endpoint for
   GLM-4.7-Flash, and separately for the Zia audio-transcription model. Generate a
   **self-client** refresh token for server-to-server access (Catalyst API Console's
   self-client flow, not the same screen as step 1). Note your `CATALYST_ORG_ID` from
   your org settings. These become `CATALYST_REFRESH_TOKEN`, `CATALYST_CLIENT_ID`,
   `CATALYST_CLIENT_SECRET`, `CATALYST_ORG_ID`.
4. **ZeptoMail —** separate product, zoho.com/zeptomail. Sign up, add and verify
   **`learninglanguagesai.in`** as the sending domain (the DNS records ZeptoMail
   gives you go into GoDaddy's DNS management for this domain — the .in identity
   verification from Section 17's earlier note must be complete first, or these
   records won't resolve reliably). Create a Mail Agent, generate a Send Mail Token
   → `ZEPTOMAIL_SEND_TOKEN`. `ZEPTOMAIL_FROM_EMAIL` becomes something like
   `noreply@learninglanguagesai.in`. This must be done before Phase 1's OTP email
   can be tested at all.
5. **Razorpay —** create an account at razorpay.com, stay in **Test Mode** for
   development (test card/UPI numbers, no real money moves), grab the Test Key
   ID/Secret from Settings → API Keys → `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
   Under Settings → Webhooks, add a webhook pointing at your deployed
   `/api/payments/webhook`, subscribe to `payment.captured` and `payment.failed`, and
   copy the webhook secret it generates → `RAZORPAY_WEBHOOK_SECRET`. Only switch to
   Live Mode keys once you're actually ready to take real money — don't do this for
   the submission unless you specifically want to.
