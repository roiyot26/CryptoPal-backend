# CryptoPal – Personalized Crypto Investor Dashboard

CryptoPal is a full-stack web app that learns each investor’s style through onboarding, then delivers a personalized daily dashboard with market news, coin prices, AI insights, and crypto memes. All content is preference-aware and supports thumbs up/down feedback for future tuning.

> **Live Deployment:** https://cryptopal-blond.vercel.app/

---

## Architecture & Tech Stack

| Layer | Details |
| --- | --- |
| Frontend | React + Vite, React Router, Context API (theme + auth), Recharts, CSS modules, shared HTTP/service layer |
| Backend | Node.js + Express, JWT auth, bcrypt, custom caching layer (Mongo cache + in-memory), controller/service separation |
| Database | MongoDB Atlas (users, preferences, votes, cache metadata) |
| External APIs | CryptoPanic (news), CoinGecko (prices + charts), OpenRouter (AI insight), APILeague (memes) |
| Deployment | Vercel (single serverless function that serves both API + static frontend) |

Key behaviors:
- Light/dark mode toggle with CSS variables.
- Auth + onboarding flow stores preferences (assets, investor type, content types).
- Dashboard sections render only the content types selected by the user and can be toggled on the fly.
- Votes are persisted with `contentType`, `contentId`, and derived keywords for future model training.
- Multi-layer caching (Mongo + in-memory + client-side storage) keeps API usage low.
- Controllers (Express) and React components talk to dedicated domain services, keeping transport logic thin and re-usable.

---

## Project Structure

```
MoveoHomeTask/
├── api/                  # Express backend served as Vercel function
│   ├── public/           # Copied frontend `dist` output (served statically)
│   └── src/
│       ├── config/       # Mongo connection, cache config
│       ├── controllers/  # HTTP request handling only
│       ├── services/     # Domain logic (auth, users, prices, news, AI, memes, votes)
│       ├── middleware/   # Auth guard, error handler
│       ├── models/       # User, Vote, Cache schemas
│       └── utils/        # API clients, logger, memory cache
├── frontend/             # Vite SPA
│   ├── src/components/   # Header, dashboard sections, onboarding, etc.
│   ├── src/context/      # Theme + auth providers
│   ├── src/pages/        # Home, Auth, Onboarding, Dashboard
│   ├── src/services/     # httpClient + domain APIs (auth, prices, news, AI, memes, votes)
│   └── src/utils/        # Shared helpers (styles, constants, etc.)
├── package.json          # Monorepo scripts (dev + Vercel build)
└── vercel.json           # Routes `api/index.js` as the only serverless entry
```

---

## Getting Started (Local Development)

> Prerequisites: Node.js ≥ 20.17 (Vite warns below 20.19 but builds succeed), npm 9+.

Install dependencies for both workspaces once:
```bash
npm --prefix frontend install
npm --prefix api install
```

### Run the backend
```bash
npm run dev:api
```
Backend defaults to `http://localhost:5001` (set in `.env`).

### Run the frontend
```bash
npm run dev:frontend
```
Frontend runs at `http://localhost:5173` and proxies API calls to `/api/*`.

---

## Feature Highlights

- **Home page:** marketing hero with CTA, global header, responsive layout, bright green palette.
- **Auth + JWT:** email + password (with confirmation) plus full-name capture, login/signup toggle on one page, tokens stored securely, route guards for onboarding/dashboard.
- **Onboarding quiz:** multi-step form capturing crypto assets, investor type (HODLer / Day Trader / NFT Collector), and content preferences (Market News / Charts / Social / Fun). Results persist to Mongo user doc.
- **Daily dashboard:** 
  - Coin Prices (CoinGecko) with price cards, pagination, time-range buttons (D / 1W / 1M / 1Y), dynamic chart colors, and fallbacks to BTC/ETH when data is missing.
  - Market News (CryptoPanic) with richer cards, descriptions, Google “More” button, pagination, and logging to debug sources.
  - AI Insight (OpenRouter) uses investor type + trending assets for tailored copy.
  - Fun Meme (APILeague) tied deterministically to user ID per day, cached to honor API limits.
- **Voting:** thumbs up/down for every card; votes stored as `{contentType, contentId, voteType, keywords}` to drive future models. UI intentionally hides counts per latest request.
- **Content filters:** Buttons show/toggle the content types selected during onboarding; at least one must remain active.
- **Caching & performance:** 
  - Mongo `Cache` collection to store expensive API responses with TTL (two fetches before fallback).
  - In-memory `memoryCache` to avoid DB hits for hot keys.
  - Frontend storage cache (local/session) for auth tokens and dashboard payloads with TTL.
  - Deterministic meme selection ensures the same image for 24 hours per user.
---

## Scripts Reference

| Command | Description |
| --- | --- |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run dev:api` | Start Express server with Nodemon |

---
