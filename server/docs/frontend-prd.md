# Frontend Product Requirements Document

## 1. Product overview

Build a responsive recruitment marketplace where applicants discover and apply to jobs, recruiters publish jobs and manage applicants, and administrators manage users and job categories.

The frontend must use:

- Vite + React
- `react-router-dom`
- Redux Toolkit for shared client state
- RTK Query for server state and API integration
- Tailwind CSS; shadcn/ui components where they improve consistency and accessibility

The API is an Express JSON API. Its base path is `/api`; configure the origin with `VITE_API_BASE_URL` (for example, `http://localhost:5000/api`).

## 2. User roles and access

Roles are exactly `applicant`, `recruiter`, and `admin`.

- **Applicant:** maintain a profile, find jobs, apply, track applications, receive recommendations, and message recruiters.
- **Recruiter:** manage a company profile, create and manage jobs, use an AI job-description assistant, review applicants, discover candidates, and message applicants.
- **Admin:** manage users and job categories, and access admin-level job and candidate views.
- **Anonymous visitor:** browse published jobs, companies, and active categories; registration/login is required for personal actions.

Use the authenticated user's `role` for route guards and role-specific navigation. The API still enforces authorization; the frontend must handle `401` and `403` responses rather than treating client-side guards as security.

## 3. Application routes and screens

Suggested routes:

### Public

- `/` — landing page and featured/recent jobs
- `/jobs` — searchable/filterable job listing
- `/jobs/:jobId` — job details and apply CTA
- `/companies` — company directory
- `/companies/:companyId` — company profile and open jobs
- `/login`, `/register`

### Applicant

- `/applicant/dashboard` — profile completion, recent applications, recommendations
- `/applicant/profile` — personal details, skills, experience, education, resume upload/link, job preferences, and job-email opt-in
- `/applicant/applications` — application history and status timeline; allow withdrawal where eligible
- `/applicant/recommendations` — generated job matches
- Job details/apply flow — request AI match insights for a published job
- `/messages`, `/messages/:conversationId`
- `/notifications`

### Recruiter

- `/recruiter/dashboard` — job and application overview
- `/recruiter/company` — company details
- `/recruiter/jobs` — owned jobs, status, applicant count
- `/recruiter/jobs/new`, `/recruiter/jobs/:jobId/edit`
- Job create/edit form — generate an editable AI job-description draft
- `/recruiter/jobs/:jobId/applicants` — applicant list and profile details
- `/recruiter/candidates` — generated candidate recommendations
- `/messages`, `/messages/:conversationId`
- `/notifications`

### Admin

- `/admin/users` — filter, inspect, update, and deactivate users
- `/admin/categories` — create, edit, activate/deactivate, and remove unused categories
- `/admin/jobs` — use job listing with status filters
- `/admin/recommendations` — candidate recommendations, if desired

Use loading, empty, error, and success states on every data-driven screen. Confirm destructive or irreversible actions. Prefer category deactivation over deletion when jobs use that category.

## 4. Recommended frontend architecture

Organize the code by product feature, with shared UI and API infrastructure separated from route-level screens. Keep pages focused on composing feature components; put reusable forms, data tables, and workflow logic in their feature folders.

Suggested structure:

```text
src/
  app/
    App.jsx
    router.jsx
    store.js
    providers.jsx
  features/
    auth/
      authSlice.js
      AuthGate.jsx
      LoginPage.jsx
      RegisterPage.jsx
    jobs/
      api.js
      pages/
      components/
      schemas.js
    applications/
      api.js
      pages/
      components/
      schemas.js
    companies/
    profiles/
    recommendations/
    messaging/
    notifications/
    categories/
    users/
  layouts/
    PublicLayout.jsx
    ApplicantLayout.jsx
    RecruiterLayout.jsx
    AdminLayout.jsx
  components/
    ui/
    shared/
  lib/
    baseApi.js
    utils.js
  hooks/
  styles/
    index.css
```

The tree is a suggested starting point, not a requirement to create empty files for every folder. Use feature-level route components (for example `JobListPage`, `JobDetailsPage`, `ApplicantProfilePage`, `RecruiterJobsPage`, and `AdminCategoriesPage`) and keep role-specific navigation/layout concerns in the corresponding layout. Use nested React Router routes and a shared role-aware route guard. Preserve a requested destination when redirecting an unauthenticated user to login.

### UI and component system

- Use Tailwind CSS for layout, spacing, responsive behavior, and application-specific styling.
- Prefer accessible **shadcn/ui** components for common UI patterns: buttons, inputs, selects, textareas, badges, cards, tables, dialogs/alert dialogs, dropdowns, tabs, sheets, toasts, skeletons, and form controls. Add only the components that are actually used.
- Keep shared presentation primitives in `components/ui`; compose domain-specific components in their feature folder (for example `JobCard`, `ApplicationStatusBadge`, `ConversationList`, and `CategoryForm`).
- Use consistent public and authenticated shells, but keep applicant, recruiter, and admin navigation distinct and role-appropriate.
- Build mobile-first layouts. On small screens, use a collapsible navigation sheet and convert wide tables into readable cards or horizontally scrollable tables.
- Follow accessible interaction patterns: visible focus, keyboard-operable controls, associated labels, dialog focus management, and status text/icons in addition to color.

### Forms and validation

- Use **React Hook Form** for form state and submission handling.
- Use **Zod** schemas with `@hookform/resolvers/zod` (`zodResolver`) for client-side validation. Keep schemas near the feature form (`features/<feature>/schemas.js`) and match the backend constraints/enums documented below.
- Reuse schemas for create/edit forms where practical; edit forms should initialize from the fetched record and submit only allowed fields.
- Display client validation inline. Map API `errors[].field` messages back to matching fields; show the API `message` as a form-level error when it cannot be mapped.
- Use controlled shadcn form components with React Hook Form's `Controller` when required (for example select, date picker, or multi-select controls).
- For resume uploads, use a file input and `FormData`; do not run the JSON Zod body schema on the multipart request. Validate the selected file type/size for immediate feedback and still display server errors.
- Disable submit while pending, prevent accidental duplicate submissions, and provide clear success/error feedback.

### AI-assisted workflows

- In recruiter job create/edit forms, offer an explicit **Generate description** action using the entered title and optional skills, experience, employment type, work mode, location, and additional context. Show the generated description in the normal editable field; never publish or save it automatically. Set `isAiGeneratedDescription: true` when the recruiter saves a job containing the generated description.
- In an applicant's job details/apply flow, offer **Get AI match insights** for published jobs. Before every request, clearly disclose that the applicant profile and selected job details are sent to the configured AI provider and require affirmative consent. Do not send the resume file or resume URL.
- Present the match summary, matching skills, skill gaps, and actionable suggestions as guidance—not as a hiring decision, guarantee, or numeric match score. Let applicants review profile information before sharing it.
- Render AI output as escaped text; do not interpret generated content as HTML.
- Render loading, failure, and retry states. If the API reports AI is unavailable or rate-limited, explain that the feature is temporarily unavailable and keep normal job and profile workflows usable.
- AI output is untrusted draft content. Require human review before it is saved or used; do not allow AI output to change job status, applications, or profile data automatically.

## 5. API integration conventions

### Headers, authentication, and cookies

- JSON requests use `Content-Type: application/json`.
- Protected endpoints require an `Authorization` header using the HTTP Bearer scheme and the current access token.
- The refresh token is an **httpOnly cookie**, not a JSON field. Set `credentials: "include"` for `/auth/login`, `/auth/register`, `/auth/refresh`, and `/auth/logout`; using credentials on all API calls is also acceptable.
- Keep the access token in Redux memory (or another short-lived in-memory store); do not attempt to read or persist the refresh cookie from JavaScript.
- On app startup, call `POST /auth/refresh` with credentials to restore the session. On an access-token `401`, attempt a single refresh and retry the original request once; if refresh fails, clear auth state and send the user to login.
- The API cookie is scoped to `/api/auth`. The backend must allow the frontend origin via `CLIENT_URL` and credentials via CORS.

### Response envelope

Success responses follow:

```json
{ "success": true, "data": {} }
```

Errors follow:

```json
{ "success": false, "message": "Readable error message" }
```

Validation errors may include:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

Use the HTTP status code and `message` for user feedback. Common statuses include `400` invalid input/state, `401` unauthenticated/expired session, `403` forbidden, `404` missing resource, and `409` duplicate/conflicting state.

### AI-assisted features

AI requests use the authenticated backend API. The browser must never call OpenRouter directly or contain an OpenRouter API key. The server may return `503` when AI is not configured, `502` for provider/response failures, `504` for provider timeouts, and `429` when rate-limited; display a recoverable error and keep non-AI workflows available.

### Identifier and date conventions

- IDs are MongoDB ObjectId strings (24 hexadecimal characters).
- Send dates as ISO-8601 strings; responses contain ISO date strings.
- Enum strings are case-sensitive and use the exact values below.
- Unknown request body keys are stripped by backend validation. Do not send backend-managed fields such as `createdBy`, `publishedAt`, or `closedAt`.

### Pagination

Paginated endpoints use `page` (1-based) and `limit`. Responses contain:

```json
{ "items": [], "total": 0, "page": 1, "pages": 1 }
```

The `limit` is clamped server-side. Job listing defaults to 10 and maxes at 50; user and notification listing have their own defaults/maxima below.

## 6. API endpoint reference

`{BASE}` below means `VITE_API_BASE_URL`, normally `http://localhost:5000/api`.

### Health

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET {BASE}/health` | Public | None | `{ status: "ok", database: "connected" }`; the health route waits for MongoDB and returns an error if the database is unavailable |

### Authentication — `/auth`

| Method and path | Access | Payload | Response data |
|---|---|---|---|
| `POST /auth/register` | Public | `{ "name": "Jane Doe", "email": "jane@example.com", "password": "Password123", "role": "applicant" }` | `{ user, accessToken }`; also sets refresh cookie. `role` may be `applicant` or `recruiter`, defaults to `applicant`. |
| `POST /auth/login` | Public | `{ "email": "jane@example.com", "password": "Password123" }` | `{ user, accessToken }`; sets/rotates refresh cookie. |
| `POST /auth/refresh` | Refresh cookie | No JSON body; include credentials | `{ user, accessToken }`; rotates refresh cookie. |
| `POST /auth/logout` | Refresh cookie if present | No JSON body; include credentials | `null`; revokes only the current refresh session and clears cookie. |
| `GET /auth/me` | Authenticated (access token) | None | `{ user }` |

Password registration requirements: at least 8 characters, including one letter and one number. Email is normalized to lowercase. Admin accounts cannot self-register.

User fields commonly returned: `_id`, `name`, `email`, `role`, `status`, `avatar`, `lastLoginAt`, `isProfileCompleted`, timestamps. Password and refresh token data are not returned.

### Job categories — `/job-categories`

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET /job-categories` | Public; admin can include inactive categories | Optional admin query `?includeInactive=true` | Array of categories with `publishedJobsCount` |
| `GET /job-categories/:id` | Public for active categories; admin can view inactive | ObjectId path | Category |
| `POST /job-categories` | Admin | `{ "name": "Software Development", "slug": "software-development", "description": "Build software", "isActive": true }` | Created category. `slug`, `description`, `isActive` are optional; slug is generated from name if omitted. |
| `PATCH /job-categories/:id` | Admin | Any non-empty subset of `{ "name", "slug", "description", "isActive" }` | Updated category |
| `DELETE /job-categories/:id` | Admin | No body | `null`; returns `409` if any job references the category. Deactivate instead. |

Category fields: `_id`, `name`, `slug`, `description`, `isActive`, timestamps; list items also include `publishedJobsCount`. Slugs must be lowercase URL-friendly text with hyphens. Names are 2–100 characters; descriptions max 500.

### Jobs — `/jobs`

Employment type values: `full_time`, `part_time`, `contract`, `internship`, `freelance`.  
Work mode values: `onsite`, `remote`, `hybrid`.  
Job status values: `draft`, `published`, `paused`, `closed`, `archived`.

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET /jobs` | Public; optional access token | Query: `page`, `limit`, `q`, `category` (category ID or slug), `company` (ID), `location`, `employmentType`, `workMode`; admin may additionally use a job `status` | Paginated `{ items, total, page, pages }`; items populate company and category summaries. Public/applicant/recruiter results are published jobs with unexpired/no deadline. Admin can select a status such as `draft` or `closed`; `status=all` currently returns the same published-job view, so do not use `all` to request every status. |
| `GET /jobs/mine` | Recruiter/admin | None | Array of owned jobs, each with `applicationsCount`, populated company and category |
| `POST /jobs` | Recruiter/admin | Required fields: `company`, `category`, `title`, `description`, `employmentType`, `workMode`. Optional fields in create schema: `requiredSkills`, `minExperienceYears`, `location`, `salaryMin`, `salaryMax`, `currency`, `applicationDeadline`, `vacancies`, `status`, `isAiGeneratedDescription`. | Created job |
| `GET /jobs/:id` | Public; optional access token | ObjectId path | Job with detailed company/category. Draft/non-public jobs are visible only to owner or admin. |
| `PATCH /jobs/:id` | Job owner/admin | Any subset of job create fields. Do not send `publishedAt` or `closedAt`. | Updated job |
| `DELETE /jobs/:id` | Job owner/admin | No body | `null` if it had no applications; otherwise archives it and returns the archived job. |
| `POST /jobs/:id/apply` | Applicant | `{ "coverLetter": "Optional message", "resume": "https://.../resume.pdf" }` | Created application (`201`). `resume` is an optional URL; the applicant profile resume is used if omitted. |
| `POST /jobs/:id/applications` | Applicant | Same as `/apply` (legacy alias) | Same as `/apply`; use `/apply` for new frontend code. |
| `GET /jobs/:id/applications` | Job owner/admin | ObjectId path | Array of applications with applicant user and `applicantProfile`. |

Job create payload example:

```json
{
  "company": "507f1f77bcf86cd799439011",
  "category": "507f1f77bcf86cd799439012",
  "title": "Backend Engineer",
  "description": "Build and maintain backend services for our product.",
  "requiredSkills": ["Node.js", "MongoDB"],
  "minExperienceYears": 2,
  "employmentType": "full_time",
  "workMode": "hybrid",
  "location": "Dhaka",
  "salaryMin": 50000,
  "salaryMax": 80000,
  "currency": "USD",
  "applicationDeadline": "2026-12-31T23:59:59.000Z",
  "vacancies": 1,
  "status": "draft",
  "isAiGeneratedDescription": false
}
```

Notes:

- `company` and `category` are ObjectId strings. Category must be active.
- Salary values are numeric and non-negative; minimum cannot exceed maximum.
- A published job must have a future deadline if a deadline is supplied.
- Recruiters may create jobs only for a company they manage. Admins can create jobs for any company.
- `PATCH` is partial; send only changed fields. When publishing, set `status: "published"`.
- Filters with unknown category return an empty paginated result rather than an error.

### Applications — `/applications`

Application statuses: `submitted`, `reviewing`, `shortlisted`, `interviewing`, `offered`, `hired`, `rejected`, `withdrawn`.

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET /applications/mine` | Applicant | None | Array of the caller's applications with job and company summaries |
| `PATCH /applications/:id/status` | Recruiter/admin; job owner enforced | `{ "status": "reviewing", "note": "Optional internal note" }` | Updated application including `statusHistory` |
| `POST /applications/:id/withdraw` | Applicant who owns application | No body | Updated application |

Recruiter transitions are constrained: `submitted` → `reviewing`, `shortlisted`, or `rejected`; `reviewing` → `shortlisted`, `interviewing`, or `rejected`; `shortlisted` → `interviewing`, `offered`, or `rejected`; `interviewing` → `offered` or `rejected`; `offered` → `hired` or `rejected`. `hired`, `rejected`, and `withdrawn` are terminal. Applicants can withdraw unless the application is already withdrawn, hired, or rejected.

### Companies — `/companies`

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET /companies` | Public | None | Array of company summaries |
| `POST /companies` | Recruiter/admin | `{ "name": "Acme", "description": "About us", "website": "https://example.com", "industry": "Technology", "companySize": "11-50", "headquarters": "Dhaka", "logo": "https://..." }` | Created company; creating one also links it to the recruiter's profile. |
| `GET /companies/:id` | Public | ObjectId path | `{ company, jobs }`; jobs are published jobs for the company. |
| `PATCH /companies/:id` | Company owner/admin | Non-empty subset of company fields from create payload | Updated company |
| `DELETE /companies/:id` | Company owner/admin | No body | `null`; returns `409` while any job (including archived jobs) still references the company. |

`companySize` values: `1-10`, `11-50`, `51-200`, `201-500`, `501-1000`, `1000+`. `website` must be a URL if supplied (empty string is accepted).

### Profiles — `/profiles`

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET /profiles/me` | Authenticated | None | Applicant or recruiter profile; may be `null` before profile creation |
| `PATCH /profiles/applicant` | Applicant | Partial applicant profile payload (example below) | Saved profile with `profileCompletion` |
| `POST /profiles/applicant/resume` | Applicant | `multipart/form-data` with a `resume` PDF file (max 5 MB) | `{ "resume": "https://...", "profile": { ... } }`; uploads the resume to Cloudinary and stores the returned secure URL in the profile |
| `PATCH /profiles/recruiter` | Recruiter | Partial `{ "jobTitle": "Talent Partner", "phone": "+...", "company": "ObjectId or null", "onboardingCompleted": true }` | Saved recruiter profile |
| `GET /profiles/applicants/:id` | Recruiter/admin | Applicant user ObjectId | Public/discoverable applicant profile plus user name/avatar; non-discoverable/missing profile returns `404` |

Applicant profile payload example:

```json
{
  "headline": "Backend Engineer",
  "summary": "Experienced in building APIs.",
  "location": "Dhaka",
  "skills": ["Node.js", "MongoDB"],
  "experience": [{
    "company": "Example Co",
    "title": "Engineer",
    "description": "Built APIs",
    "startDate": "2022-01-01T00:00:00.000Z",
    "endDate": null,
    "current": true
  }],
  "education": [{
    "institution": "Example University",
    "qualification": "BSc",
    "fieldOfStudy": "Computer Science",
    "startDate": "2018-01-01T00:00:00.000Z",
    "endDate": "2022-01-01T00:00:00.000Z"
  }],
  "resume": "https://res.cloudinary.com/example/raw/upload/job-marketplace/resumes/user-id/resume-id.pdf",
  "preferredJobTitles": ["Backend Engineer"],
  "preferredLocations": ["Dhaka"],
  "preferredEmploymentTypes": ["full_time"],
  "preferredWorkModes": ["remote", "hybrid"],
  "expectedSalaryMin": 50000,
  "expectedSalaryMax": 90000,
  "currency": "USD",
  "isDiscoverable": true,
  "emailJobRecommendations": false
}
```

Resume values are Cloudinary secure URL strings, not `FileAsset` references. Upload a PDF with `FormData` to `POST /profiles/applicant/resume` using the field name `resume`; do not set the multipart `Content-Type` header manually because the browser must add its boundary. Uploads are limited to one PDF file up to 5 MB. The endpoint updates the applicant's profile and returns the URL; send that URL in the profile `resume` field when editing profile data or optionally in an application payload. Configure Cloudinary server-side using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`, with optional `CLOUDINARY_RESUME_FOLDER`. Until those credentials are set, uploads return `503`.

`emailJobRecommendations` is an explicit applicant opt-in for scheduled job digest emails. It defaults to `false` for new and existing profiles. Include it in the applicant onboarding form and let applicants change it later in profile/email preferences. The server sends digests only when it is `true`; setting it to `false` stops future digests.

### AI features — `/ai`

| Method and path | Access | Payload | Response data |
|---|---|---|---|
| `POST /ai/job-description` | Recruiter/admin | `{ "title": "Backend Engineer", "requiredSkills": ["Node.js", "MongoDB"], "minExperienceYears": 3, "employmentType": "full_time", "workMode": "hybrid", "location": "Dhaka", "additionalContext": "..." }`; all fields except `title` are optional | `{ "description": "..." }`; use as an editable draft and save through the normal job endpoint |
| `POST /ai/job-match-insights` | Applicant | `{ "jobId": "24-character-job-id", "consent": true }` | `{ "matchSummary": "...", "matchingSkills": [], "skillGaps": [], "suggestions": [], "disclaimer": "..." }` |

Job-description generation accepts a 3–180 character title, up to 50 skills, and up to 2,000 characters of additional context. It returns an editable plain-text description without Markdown syntax and does not create or publish a job; when the user saves the draft, set `isAiGeneratedDescription: true` on the normal job payload.

Match insights are available only for published, non-expired jobs and require an applicant profile with at least some profile details. The backend sends selected profile text and job details to OpenRouter; it does not send the resume file or URL and does not persist the AI prompt or result. The request's `consent: true` is required. AI responses are untrusted guidance, not a hiring decision or numeric score. Requests are limited to 10 per 15 minutes per client IP in addition to the general API limit.

### Recommendations — `/recommendations`

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `POST /recommendations/jobs/generate` | Applicant | No body | Array of job recommendations with populated job/company/category |
| `POST /recommendations/candidates/generate` | Recruiter/admin | No body | Array of candidate recommendations with job and applicant summaries |
| `PATCH /recommendations/:id` | Recommendation recipient | At least one of `{ "isViewed": true, "isDismissed": true }` | Updated recommendation |

Recommendations include `matchScore` (0–100), `reason`, `type`, `job`, `applicant`, `isViewed`, and `isDismissed`. Generating recommendations recomputes matches; trigger from an explicit refresh action or after meaningful profile/job changes, not on every render.

### Scheduled recommendation emails

The backend runs a daily scheduled job at midnight in `Asia/Dhaka` by default. It considers jobs newly published (including republished jobs) during the previous 24 hours, excludes expired jobs, jobs the applicant already applied to, and jobs the applicant dismissed, scores the remaining jobs against the applicant's skills, experience, location/work-mode preferences, and salary, saves the match/recommendation records, and emails up to five matches scoring at least 40 by default. Delivery is only to active applicant accounts whose `emailJobRecommendations` profile preference is `true`. A per-applicant daily delivery record prevents duplicate digests if multiple server instances run; SMTP failures receive up to three attempts.

Digest emails include an individual **View job** link to `${FRONTEND_URL}/jobs/:jobId`, matching the frontend route above, and a link to the applicant profile's email preference settings. Emails are sent by the backend through SMTP; the browser never sends email credentials.

Configure these server environment variables:

| Variable | Purpose | Default |
|---|---|---|
| `SMTP_HOST` | SMTP server hostname | unset (email scheduler disabled) |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use implicit TLS (`true` for port 465) | `false` |
| `SMTP_USER` | SMTP username | unset |
| `SMTP_PASSWORD` | SMTP password/app password | unset |
| `EMAIL_FROM` | Sender name/address, e.g. `HireHub <jobs@example.com>` | unset |
| `FRONTEND_URL` | Frontend origin used to build job/profile links | `http://localhost:5173` |
| `RECOMMENDATION_EMAIL_CRON` | Cron expression for the digest | `0 0 * * *` |
| `APP_TIMEZONE` | IANA timezone for cron and digest deduplication | `Asia/Dhaka` |
| `RECOMMENDATION_EMAIL_MAX_JOBS` | Maximum jobs in one applicant digest (1–10) | `5` |
| `RECOMMENDATION_EMAIL_MIN_SCORE` | Minimum match score to include (0–100) | `40` |

Set all SMTP credentials and `EMAIL_FROM` to enable the schedule. Without them the API starts normally, logs that scheduled email is disabled, and does not send mail. The scheduler requires the API process to remain running; production deployments with multiple replicas use the persisted digest claim to avoid duplicate sends.

### Conversations and messages

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET /conversations` | Authenticated participant | None | Array of conversations with participants, job summary, and last message |
| `POST /conversations` | Applicant/recruiter | `{ "recipient": "userId" }`; optionally add **either** `"job": "jobId"` **or** `"application": "applicationId"` | Conversation (`201`) |
| `GET /conversations/:id/messages` | Conversation participant | Optional `?limit=30` (max 100) | Array of messages, chronological; fetching marks received messages as read for the caller |
| `POST /conversations/:id/messages` | Conversation participant | `{ "text": "Hello" }` | Created message (`201`) |

Job/application-related messages must be between the applicant and recruiter for that job/application. Direct conversations also require one applicant and one recruiter. Message text is required, trimmed, and max 5,000 characters. Message fields include `conversation`, `sender`, `text`, `readBy`, and timestamps.

### Notifications — `/notifications`

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET /notifications` | Authenticated recipient | `?page=1&limit=20`; optional `unread=true` | `{ items, total, unread, page, pages }` |
| `PATCH /notifications/:id` | Recipient | `{ "isRead": true }` (omitted defaults to true) | Updated notification |
| `PATCH /notifications/read-all` | Authenticated | No body | `null` |

Notification types include `application_submitted`, `application_status_changed`, `new_message`, `job_recommendation`, `candidate_recommendation`, and `system`. Use `resourceType`/`resourceId` for in-app navigation when available.

### Users — `/users`

| Method and path | Access | Payload / query | Response data |
|---|---|---|---|
| `GET /users` | Admin | `?page=1&limit=20`; optional `role=applicant\|recruiter\|admin`, `status=active\|suspended\|deleted` | Paginated user list |
| `PATCH /users/:id` | User self or admin | Any subset of `{ "name": "Jane Doe", "email": "jane@example.com", "avatar": "https://...", "role": "recruiter", "status": "active" }` | Updated user |
| `DELETE /users/:id` | Self or admin | No body | `null`; deactivates/marks account deleted rather than physically removing it |

Only admins can change `role` or `status`; users cannot change their own role or deactivate themselves through `PATCH`. The delete action for self marks the account deleted. Admins cannot change their own role through the update endpoint.

## 7. RTK Query and Redux recommendations

- Create a single `baseApi` with `fetchBaseQuery`, set the `Authorization` header from auth state, and use `credentials: "include"`.
- Implement one shared reauthorization wrapper for access-token refresh; ensure concurrent `401`s do not cause multiple refresh rotations.
- Keep server data in RTK Query caches. Avoid copying jobs, applications, or notifications into hand-managed Redux slices.
- Keep a small auth slice for `user` and the in-memory `accessToken`; clear it on logout or failed refresh.
- Define tag types such as `Auth`, `Jobs`, `Job`, `Applications`, `Companies`, `Categories`, `Profile`, `Recommendations`, `Conversations`, `Messages`, `Notifications`, and `Users`. Invalidate only related tags after mutations.
- Query job results by normalized query params so category/filter changes produce the correct cache key.
- Use RTK Query loading/error states for skeletons, retries, and inline validation. Avoid duplicate requests on component remount where cache data is still fresh.
- For messaging, poll or refetch conversations/messages as a first iteration; this API does not expose a WebSocket endpoint.

## 8. UX and accessibility requirements

- Responsive layouts for mobile, tablet, and desktop; mobile navigation must expose all role-appropriate sections.
- Semantic headings, labels, keyboard-accessible dialogs/menus, visible focus states, and accessible form errors.
- Provide clear status labels and color-independent status indicators for jobs and applications.
- Use confirm dialogs before withdrawing applications, deleting categories/companies, and deactivating users.
- Do not show application or message actions to anonymous users; route them to login and preserve the return URL.
- Support empty states (no jobs, no applications, no recommendations, no messages), and distinguish empty data from API failures.
- Surface backend validation messages adjacent to their form fields when `errors[].field` maps to a field.

## 9. Out of scope / backend dependencies

- No password-reset, email-verification, or account-session-management endpoint is currently implemented.
- No chat WebSocket/push transport is implemented; the frontend must poll/refetch to see new messages.
- No server-side dashboard aggregate endpoint exists; build dashboard counts from available endpoints or request a dedicated aggregate endpoint later.
- Some backend endpoints currently return unpaginated arrays (for example `/jobs/mine`, `/companies`, `/conversations`, and generated recommendations); design for those response shapes.
