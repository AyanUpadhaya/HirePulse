# MERN Auth + RBAC Template

Reusable starter: **Vite + React (JS) + Redux Toolkit + RTK Query** on the front, **Express + Mongoose** on the back.
Demo domain: a job board (clients post jobs, users apply, admins manage everything). Swap it for your own domain by copying the `Job` pattern.

## Quick start

```bash
# 1. API
cd server
cp .env.example .env        # set MONGO_URI + two long random JWT secrets
npm install
npm run seed                # optional: admin / client / user demo accounts + 2 jobs
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api -> :5000)
```

Seeded logins: `admin@example.com / Admin12345`, `client@example.com / Client12345`, `user@example.com / User12345`.

## Auth design

| Token | Lifetime | Where it lives |
|---|---|---|
| Access JWT | **20 min** (`ACCESS_TOKEN_EXPIRES`) | Redux memory only, sent as `Authorization: Bearer` |
| Refresh JWT | 7 days (`REFRESH_TOKEN_DAYS`) | `httpOnly` cookie scoped to `/api/auth`, SHA-256 hash stored in DB |

- When the API returns `401`, the RTK Query `baseQueryWithReauth` calls `POST /auth/refresh` once (shared across all concurrent requests), then retries the original request. If refresh fails the user is logged out.
- On page load the app calls `/auth/refresh` to restore the session, so a reload does not log you out.
- **Rotation + reuse detection:** each refresh issues a new refresh token and invalidates the old one. Presenting an old token revokes all of that user's sessions.
- Up to 5 concurrent sessions (devices) per user. Logout revokes only the current one.
- Known trade-off: two tabs refreshing at the *exact* same instant can trip reuse detection and log you out. Rare, and fails safe.

## Roles and access control

Roles: `user` (applicant), `client` (employer), `admin`. Public registration only allows `user` / `client`; admins come from the seed script or from another admin in the Admin Panel.

| Action | Rule |
|---|---|
| Create job | client, admin |
| Update / delete job | **owner or admin** |
| Apply to job | user only (one application per job) |
| View applicants / change status | job owner or admin |
| Withdraw application | the applicant or admin |
| Update / delete user | the user themself or admin (only admins change roles) |
| List users | admin |

Enforced on the server by `protect`, `authorize(...roles)` and `ownerOrAdmin(Model, ownerField)` (`server/src/middleware`). The frontend mirrors this for UX only: `ProtectedRoute roles=[...]`, `<RoleGate>`, role-filtered sidebar, `canModify(user, owner)`, and a separate dashboard per role (`/dashboard/user|client|admin`).

## Security defaults

helmet, CORS allow-list with credentials, body size limit, `express-mongo-sanitize`, zod validation that strips unknown fields (no mass assignment), bcrypt (cost 12), generic login errors, and rate limiting:

- all `/api`: 300 req / 15 min
- `/auth/login`, `/auth/register`: 10 / 15 min (successful logins not counted)
- `/auth/refresh`: 60 / 15 min

Behind a proxy (Render, Railway, Nginx) set `TRUST_PROXY=true` so limits apply per client IP.

## API summary

```
POST   /api/auth/register | login | refresh | logout      GET /api/auth/me
GET    /api/jobs?q=&type=&location=&page=&limit=          GET /api/jobs/mine        GET /api/jobs/:id
POST   /api/jobs   PATCH /api/jobs/:id   DELETE /api/jobs/:id
POST   /api/jobs/:id/apply                GET /api/jobs/:id/applications
GET    /api/applications/mine             PATCH /api/applications/:id/status   DELETE /api/applications/:id
GET    /api/users  PATCH /api/users/:id   DELETE /api/users/:id
```
Responses are `{ success, data }` or `{ success: false, message }`; the RTK Query base query unwraps `data` for you.

## Adding your own resource

1. Server: model in `models/`, zod schema in `validators/`, controller, then a route file using `protect`, `authorize`, `ownerOrAdmin(YourModel, 'owner')`; mount in `app.js`.
2. Client: `services/yourApi.js` using `api.injectEndpoints` (add a tag in `api.js` `tagTypes`), import it in `app/store.js`, add a page and route.

## Deploying

- Frontend (Netlify/Vercel): set `VITE_API_URL=https://your-api.com/api`, add an SPA redirect (`/* /index.html 200`).
- API: set `CLIENT_URL` to the frontend origin. If frontend and API are on different *sites*, set `COOKIE_SAMESITE=none` (requires HTTPS). Same parent domain (`app.x.com` + `api.x.com`) works with `lax`.
