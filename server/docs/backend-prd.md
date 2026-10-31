# Backend Product Requirements: AI-Assisted Job Marketplace

## 1. Purpose

Add two optional AI-assisted workflows to the Express API using OpenRouter:

1. Recruiters can generate a job-description draft from job details.
2. Applicants can request profile-to-job match insights for a published job.

The backend owns all OpenRouter communication and credentials. Existing job creation, profile, and application flows must continue to work if AI is unavailable.

## 2. Functional requirements

### 2.1 Job-description draft

- `POST /api/ai/job-description` is available to recruiters and admins.
- Accept a required job title and optional skills, minimum experience, employment type, work mode, location, and additional context.
- Return an editable description draft only. Do not create, update, or publish a job.
- Return the description as plain text without Markdown syntax.
- The client saves the reviewed description through the existing job endpoint and marks the saved job `isAiGeneratedDescription: true`.
- Generate content only from supplied facts. Do not invent company benefits, requirements, policies, or claims.

### 2.2 Applicant job-match insights

- `POST /api/ai/job-match-insights` is available only to applicants.
- Require a job ObjectId and affirmative `consent: true`.
- Allow analysis only for a currently published, non-expired job and the authenticated applicant's own profile.
- Return a concise match summary, matching skills, skill gaps, practical suggestions, and a disclaimer. Do not return a numeric score or hiring recommendation.
- Send only selected profile fields (headline, summary, location, skills, experience title/description, education qualification/field) and job fields needed for comparison. Do not send the resume file, resume URL, account name, or email.
- Do not persist prompts or generated results. Require a new explicit consent action for each request.

### 2.3 Account settings and password recovery

- Authenticated users can update their name, email, and avatar. Changing email requires the current password and rejects duplicate addresses.
- Authenticated users can change their password by providing the current password; successful changes revoke refresh sessions.
- Public forgot-password requests always return the same confirmation to avoid revealing whether an email is registered.
- For a registered email, send a one-time reset link using configured SMTP. Store only a hash of the token, expire it after one hour, and rate-limit reset requests.
- Resetting a password consumes the token atomically and revokes refresh sessions.

### 2.4 Shareable applicant profile

- Applicants can enable or disable recruiter visibility through the existing `isDiscoverable` profile setting and copy a link to their profile page.
- Only authenticated recruiters can open a shared profile. Anonymous users, applicants, and admins cannot access the endpoint.
- Return only the applicant's name/avatar and professional headline, summary, location, skills, experience, and education. Never include the applicant's email, resume URL, salary expectations, or private job preferences.
- Disabling discoverability makes the shared profile unavailable and returns `404`.

## 3. API response and failure behavior

Success responses use the standard `{ "success": true, "data": ... }` envelope. Errors use the standard error envelope.

- Return `503` when `OPENROUTER_API_KEY` is not configured.
- Return `502` for provider HTTP/network failures or malformed/unexpected AI output. Do not expose provider response bodies or credentials to clients.
- Return `504` when the provider request times out.
- Return existing validation/authentication/authorization errors for invalid input or role.
- Apply an AI-specific rate limit of 10 requests per 15 minutes per client IP, as well as the general API limit.
- Validate the provider's JSON output before returning it to the frontend.

## 4. Configuration and privacy

Configure these variables only in the backend environment; never put the API key in a `VITE_` variable or browser bundle.

| Variable | Purpose | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | Server-side OpenRouter API key; unset disables AI endpoints | unset |
| `OPENROUTER_MODEL` | OpenRouter model identifier | `openai/gpt-4o-mini` |
| `OPENROUTER_API_URL` | OpenRouter chat completions URL | `https://openrouter.ai/api/v1/chat/completions` |
| `OPENROUTER_TIMEOUT_MS` | Maximum provider request duration | `30000` |

Requests to OpenRouter may include user-provided job text and, for match insights, selected applicant profile text. The user interface must disclose this transmission and obtain applicant consent before making the match request. Configure provider/model data-retention options according to the product's privacy requirements.

## 5. Acceptance criteria

- An authenticated recruiter can receive a job-description draft; applicants and anonymous visitors cannot.
- An authenticated applicant can receive insights only after consenting and only for a published, non-expired job.
- AI failures, unavailable configuration, invalid provider output, and throttling return clear non-success responses; no success-shaped fallback is returned.
- AI output requires user review and does not automatically alter persisted marketplace records.
- No OpenRouter key or resume URL/file is sent to the browser/provider respectively.
- Existing non-AI endpoints and workflows remain usable with AI configuration unset.
