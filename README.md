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

## Environment Variables

Create `api/.env` (never commit real secrets):

```
PORT=5001
MONGODB_URI=...
JWT_SECRET=...
CRYPTOPANIC_API_KEY=...
COINGECKO_API_KEY=...
OPENROUTER_API_KEY=...
MEME_API_KEY=...
FRONTEND_URL=http://localhost:5173
```

On Vercel, add the same env vars in the project settings (Production + Preview). The backend treats `FRONTEND_URL` plus all `*.vercel.app` origins as valid for CORS.

---

## Build & Deployment Workflow

The root `package.json` exposes a helper script that Vercel also uses:

```json
"vercel-build": "npm --prefix frontend install && npm --prefix frontend run build && rm -rf api/public && cp -R frontend/dist api/public && npm --prefix api install"
```

Manual build steps:
1. `npm --prefix frontend run build`
2. `rm -rf api/public && cp -R frontend/dist api/public`
3. `npm --prefix api run build` *(not required today; backend is ES modules)*
4. Commit + push → Vercel deploys automatically because the repo is connected.

`vercel.json` forces all routes (except `/api/*`) through `api/index.js`, so the Express app must serve `api/public/index.html` for SPA navigation. If the static bundle is missing, Vercel returns `text/html` for the requested JS path and browsers show the “Expected a JavaScript module but got text/html” error.

**Tip:** If you ever see that MIME error on production, rebuild + copy `frontend/dist` into `api/public`, commit, push, and re-deploy. Locally you can simulate the hosted build with:
```bash
npm run vercel-build
npm --prefix api run dev
```
Then open http://localhost:5001 to confirm the bundled app serves correctly.

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

## Troubleshooting & Verification

1. **Blank dashboard / MIME errors**
   - Cause: `api/public` missing the latest bundle.
   - Fix: `npm --prefix frontend run build && rm -rf api/public && cp -R frontend/dist api/public`, commit, redeploy.
   - On the client, perform a hard refresh (Cmd/Ctrl + Shift + R) to bypass cached filenames.

2. **CORS errors in production**
   - Ensure `FRONTEND_URL` is set to the deployed origin (e.g., `https://cryptopal-blond.vercel.app`) and redeploy so the CORS whitelist includes it.

3. **API rate limits**
   - Each backend controller uses `Cache.getOrCreate` + `memoryCache`. Inspect `api/src/utils/logger.js` output to confirm when cached data is served.
   - For debugging fresh data, optional query params (e.g., `?bypassCache=true`) can be temporarily enabled.

4. **OpenRouter “No endpoints found”**
   - The AI service cycles through fallback models. Confirm the provided API key has access to those models or update the list in `api/src/services/aiService.js`.

---

## Scripts Reference

| Command | Description |
| --- | --- |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run dev:api` | Start Express server with Nodemon |
| `npm run vercel-build` | Build frontend, copy to `api/public`, install backend deps |
| `npm --prefix frontend run build` | Build SPA only |
| `npm --prefix api run lint` *(if configured)* | Lint backend code |

---

## License

This project was created as part of the Moveo home assignment. Use it for evaluation or personal learning only.

