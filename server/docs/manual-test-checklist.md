# Manual Feature Test Checklist

Use this checklist to verify the API manually in a local development environment. Check off each item as it passes and note any failures beside it.

## Test setup

- [ ] Start MongoDB and the server with the local development configuration.
- [ ] Confirm `GET /api/health` returns `{ "success": true }` and reports `data.database: "connected"`.
- [ ] Seed a disposable development database with `npm run seed`.
- [ ] Sign in with the locally configured admin account and the recruiter/applicant seed accounts. Keep credentials out of screenshots and test notes.
- [ ] Keep an access token for each role available. Use a cookie-aware client for refresh-token flows.
- [ ] Verify `GET /api/jobs` returns published jobs. Use a returned job `_id` for detail and application tests; do not rely on IDs from earlier seed runs.

## Authentication and access control

- [*] Register an applicant with valid details; verify the user and access token are returned.
- [ ] Register a recruiter; verify the role is recruiter.
- [*] Attempt to register an admin; verify self-registration is rejected.
- [*] Log in with valid credentials and verify an access token is returned.
- [*] Try a wrong password and malformed registration/login payloads; verify clear non-success responses.
- [ ] Call `GET /api/auth/me` with and without a valid access token.
- [*] Refresh a session and verify the refresh cookie rotates; log out and verify the session is revoked.
- [ ] Update account name in settings; verify the user menu reflects the change.
- [ ] Upload a valid JPEG, PNG, and WebP profile photo when Cloudinary is configured; verify the returned user and user menu show the new photo.
- [ ] Try an unsupported, invalid-signature, and oversized profile photo; verify each upload is rejected and the existing photo remains unchanged.
- [ ] Remove the profile photo and verify the user menu returns to its default avatar.
- [ ] Verify the account email is disabled in settings and cannot be changed through `PATCH /auth/account` or a self-update to `PATCH /users/:id`.
- [ ] Verify admins can still update another user's email through user management and duplicate emails are rejected.
- [ ] Change password with the current password; verify all refresh sessions are revoked and the user is sent to sign in again.
- [*] Request password reset for a registered and an unregistered email; verify the public confirmation is identical.
- [*] With SMTP configured, use the emailed reset link before and after its expiry; verify the valid token works once and expired/reused tokens fail.
- [*] Verify a successful password reset invalidates existing refresh sessions.
- [ ] Try a protected route without a token and a role-restricted route with the wrong role; verify `401`/`403` behavior.

## Public marketplace

- [*] Load the job list anonymously; verify only published, non-expired jobs appear.
- [*] Search and filter jobs by text, category, company, location, employment type, and work mode.
- [ ] Move between pages and verify the returned items and pagination totals are consistent.
- [*] Open a published job by its current ID; verify the job, company, and category details are returned.
- [*] Request a nonexistent or malformed job ID; verify the expected not-found or validation response.
- [*] Load the company directory and a company detail page; verify company details and its published jobs.
- [*] Load active job categories and verify category details.
- [*] Verify draft, paused, closed, and archived jobs are not exposed to anonymous users.

## Applicant profile and applications

- [*] Load the applicant's own profile before and after saving profile details.
- [*] Update headline, summary, location, skills, experience, education, preferences, and email-recommendation opt-in.
- [*] Enable recruiter profile sharing, save, copy the link, and verify a recruiter can open it while signed in.
- [*] Verify the shared profile hides email, resume URL, salary expectations, and job preferences.
- [*] Disable recruiter profile sharing and verify the link returns `404`; verify applicants, anonymous visitors, and admins cannot access the page/API.
- [*] Verify profile completion updates after profile changes.
- [*] Upload a valid PDF resume when Cloudinary is configured; verify the returned URL is saved to the profile.
- [ ] Try a non-PDF or oversized resume; verify the upload is rejected.
- [ ] Apply to a published job with and without a cover letter/resume; verify the application is created.
- [ ] Apply twice to the same job; verify duplicates are rejected.
- [ ] View the applicant's application list and confirm job/company summaries and status.
- [ ] Withdraw an eligible application and verify its status changes.
- [ ] Try applying to a draft, closed, expired, or nonexistent job; verify the request is rejected.

## Recruiter company and jobs

- [ ] Load and update the recruiter's profile and company details.
- [ ] Create a company and verify it is linked to the recruiter.
- [ ] Create a draft job with required fields; verify it appears in the recruiter's job list but not public search.
- [ ] Edit the draft, publish it, and verify it becomes visible to the public.
- [ ] Verify job detail works for the owner on private jobs and hides those jobs from other roles.
- [ ] Test job search filters, salary validation, invalid categories, and past deadlines for published jobs.
- [ ] Verify a recruiter cannot create or edit jobs for a company they do not manage.
- [ ] Open applicants for a job; verify applicant and discoverable profile details are available to the job owner.
- [ ] Delete a job without applications; verify it is removed.
- [ ] Delete a job with applications; verify it is archived rather than physically removed.

## Application review

- [ ] As the job-owning recruiter, move an application through valid status transitions and add an internal note.
- [ ] Try an invalid status transition and verify the update is rejected.
- [ ] Verify another recruiter cannot view or update applications for a job they do not own.
- [ ] Verify terminal application statuses cannot be advanced further and only eligible applications can be withdrawn.

## Recommendations and AI

- [ ] As an applicant, generate job recommendations and verify the results correspond to the applicant profile.
- [ ] As a recruiter, generate candidate recommendations and verify the results correspond to recruiter-owned jobs.
- [ ] Mark a recommendation viewed or dismissed; verify the update is visible to the recipient.
- [ ] As a recruiter/admin, request an AI job-description draft; verify it returns editable plain text without Markdown markers and does not create or publish a job.
- [ ] Verify an applicant cannot request a job-description draft.
- [ ] Save a reviewed AI draft through normal job creation/update and verify it is marked `isAiGeneratedDescription`.
- [ ] As an applicant, request match insights without consent and with an unpublished/expired job; verify both are rejected.
- [ ] Request insights for a published job with consent and a populated profile; verify the response has a summary, matching skills, gaps, suggestions, and disclaimer, but no score or hiring recommendation.
- [ ] Verify AI endpoints return clear errors when provider configuration is absent or the provider fails, without exposing credentials/provider response bodies.
- [ ] Verify AI requests are rate limited and that normal non-AI features still work when AI is unavailable.

## Messaging and notifications

- [ ] Create a valid applicant/recruiter conversation, including a job- or application-related conversation.
- [ ] Try invalid participant combinations and unauthorized conversation access; verify they are rejected.
- [ ] Send a message, reload the conversation, and verify message order and read state.
- [ ] Verify message validation rejects empty text and text over the maximum length.
- [ ] Load notifications and verify pagination and unread filtering.
- [ ] Mark one notification read and then mark all notifications read; verify unread counts update.

## Admin

- [ ] List users with pagination and role/status filters.
- [ ] Update an allowed user field; verify users cannot change their own role or status.
- [ ] Deactivate a test user and verify the account can no longer use authenticated features.
- [ ] Create, update, and deactivate a job category.
- [ ] Verify deleting a category referenced by a job is rejected.
- [ ] List jobs with admin status filters and inspect non-public job details.
- [ ] Verify non-admin users cannot access admin-only user/category management.

## Optional integrations and regression

- [ ] When SMTP is configured, verify an opted-in applicant can receive a recommendation digest and an opted-out applicant does not.
- [ ] When SMTP is not configured, verify the API starts and the rest of the application remains usable.
- [ ] When Cloudinary is not configured, verify resume uploads fail clearly without preventing other profile updates.
- [ ] When Cloudinary is not configured, verify profile photo uploads fail clearly without preventing account name or email updates.
- [ ] Confirm responses use the standard success/error envelope and do not expose passwords, refresh tokens, or provider secrets.
- [ ] Repeat key flows after reseeding and confirm tests use the newly returned IDs rather than stale database IDs.

## Findings

| Date | Feature/test | Result or issue | Follow-up |
|---|---|---|---|
| | | | |
