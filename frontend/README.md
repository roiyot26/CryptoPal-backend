# CryptoPal Frontend

React + Vite single-page application that renders the personalized dashboard, onboarding, and auth flows for CryptoPal.

## Key Folders

```
frontend/src
├── components/     # UI widgets (dashboard sections, header, auth forms)
├── pages/          # Route-level screens (Home, Auth, Onboarding, Dashboard)
├── services/       # httpClient plus feature-specific API clients
├── contexts/       # Theme provider, etc.
├── providers/      # Context wrappers
└── styles/         # Global styles + CSS modules
```

## HTTP / Service Layer

- `services/httpClient.js` centralizes fetch calls, attaches JWT headers, and normalizes JSON/error handling.
- `services/authService.js` owns token + user persistence (localStorage) and configures the HTTP client with token + 401 handlers.
- Feature services (`priceService`, `newsService`, `aiService`, `memeService`, `voteService`) expose semantic methods consumed by dashboard components instead of calling `fetch` directly. This keeps components focused on rendering logic and simplifies future caching or data-library adoption.

## Development

```bash
npm install
npm run dev
```

Vite runs at `http://localhost:5173` and proxies `/api/*` to the Express backend.

To build the production bundle (copied into `api/public` during the root `vercel-build` step):

```bash
npm run build
```

## Auth Helpers

UI code should import `authService` from `src/services/authService`. It exposes:

- `login`, `signup`, `logout`, `getCurrentUser`
- `savePreferences`, `getPreferences`
- `getToken`, `getUser`, `subscribe` (event-based updates for header/dashboard)

This mirrors the backend service organization and prevents components from reaching into `localStorage` directly.
