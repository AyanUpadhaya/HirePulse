# Product Requirements Document (PRD)
## AI-Powered Recruitment Platform — Backend

**Product:** AI-Powered Recruitment Platform  
**Document type:** Backend Product Requirements Document  
**Version:** 1.0  
**Status:** Draft for development  
**Backend stack:** Node.js, Express.js, MongoDB, Mongoose, Multer, Cloudinary  
**Authentication:** JWT access tokens with cookie-based refresh tokens  
**AI integration:** OpenRouter API for AI-assisted job description generation, with an extensible design for other AI providers  
**Frontend:** To be developed separately using React and RTK Query

---

# 1. Product Overview

## 1.1 Purpose

The platform connects applicants with recruiters and clients who publish job or internship opportunities.

Applicants can create profiles, upload resumes, discover relevant opportunities, apply for jobs, communicate with recruiters, and receive personalized job recommendations.

Recruiters can create company profiles, publish opportunities, review applications, discover suitable candidates, communicate with applicants, and receive candidate recommendations.

The backend will provide a centralized API for authentication, profile management, job management, application processing, candidate matching, AI-assisted functionality, messaging, and notifications.

## 1.2 Product Vision

Build a recruitment platform that reduces manual screening effort by matching applicants with opportunities based on their profiles and job requirements.

The platform should:

- Simplify applicant and recruiter onboarding.
- Support manual and AI-assisted job creation.
- Provide secure resume and document management.
- Automatically calculate job-to-applicant compatibility.
- Allow recruiters to request ranked candidate recommendations.
- Deliver personalized recommendations through nightly scheduled jobs.
- Support messaging between platform users.
- Provide real-time or near-real-time notification delivery.
- Maintain transparent, explainable matching results.

## 1.3 Core Product Principles

1. **Manual-first, AI-assisted:** Every important profile and job field must be editable manually, regardless of whether AI generated it.
2. **Human-controlled decisions:** AI recommendations must not automatically reject applicants or make final hiring decisions.
3. **Secure document access:** Resume URLs and private documents must not be publicly exposed without appropriate access controls.
4. **Backend-owned business logic:** Matching, authorization, application status transitions, and recommendation scheduling must be implemented on the backend.
5. **API-first architecture:** The backend must expose predictable REST APIs suitable for integration with React and RTK Query.
6. **Incremental development:** The initial release should prioritize a reliable recruitment workflow over excessive features.

---

# 2. User Roles and Permissions

## 2.1 Applicant

An applicant can:

- Register and authenticate.
- Create and update a personal profile.
- Add skills, experience, education, qualifications, location, and job preferences.
- Upload a resume or CV.
- Browse and search published jobs.
- View job-match scores and explanations.
- Apply for jobs.
- View their own applications and application statuses.
- Withdraw an application when permitted.
- Receive recommended jobs.
- Receive notifications.
- Message recruiters or other users when permitted by platform rules.
- Manage notification preferences and account settings.

## 2.2 Recruiter / Client

A recruiter is a user who represents a company or organization and hires applicants.

A recruiter can:

- Register and create a recruiter or company profile.
- Create and update company information.
- Create, edit, publish, close, and archive job listings.
- Generate a job description using AI or write one manually.
- Define job requirements, preferred qualifications, salary or stipend, location, and employment type.
- View applications submitted to their own jobs.
- Access authorized applicant profiles and resumes.
- View match scores and matching explanations.
- Request ranked candidate recommendations for a particular job.
- Update application statuses.
- Communicate with applicants.
- Receive notifications and candidate recommendations.
- Manage their job listings and hiring activity.

Recruiters must not access another recruiter's private applications or unpublished jobs.

## 2.3 Platform Administrator

Administrator functionality may be added as a separate phase.

Potential permissions include:

- Managing users and reported content.
- Suspending accounts.
- Reviewing suspicious activity.
- Managing platform-wide configuration.
- Auditing sensitive administrative actions.

Administrative privileges must be explicitly assigned and must never be inferred from a user's profile data.

## 2.4 Account and Role Model

Use one central user account collection with an explicit account type, rather than maintaining separate authentication systems for applicants and recruiters.

Suggested account types:

- `applicant`
- `recruiter`
- `admin` (future or restricted)

Applicants and recruiters should have separate profile collections linked to the central user account.

The initial product should support one primary account type per user. If dual-role accounts become necessary, introduce an explicit multi-role authorization model rather than relying on frontend role switching.

---

# 3. Functional Requirements

## 3.1 Authentication and Account Management

### Registration

Users must be able to register using:

- Name
- Email
- Password
- Account type

Requirements:

- Email addresses must be normalized before storage.
- Duplicate email registrations must be rejected.
- Passwords must be hashed using a suitable password-hashing algorithm such as Argon2id or bcrypt.
- Request validation must reject invalid inputs.
- Email verification should be supported before enabling sensitive account operations.
- The backend must create the appropriate applicant or recruiter onboarding record.

### Login

The login endpoint must:

1. Validate the credentials.
2. Verify the password.
3. Issue a short-lived JWT access token.
4. Issue a rotating refresh token using a secure HTTP-only cookie.
5. Record the refresh-token session securely.

### Token Refresh

The refresh endpoint must:

- Validate the refresh token.
- Verify that the session remains active.
- Rotate the refresh token.
- Reject expired, revoked, or reused tokens according to the session security policy.
- Revoke the affected session or token family when refresh-token reuse is detected.

Refresh tokens should be stored hashed in a dedicated session collection. The raw token must not be stored in the database.

Cookie settings must include appropriate `HttpOnly`, `Secure`, and `SameSite` attributes based on the deployment environment. The application must also address CSRF risks and restrict CORS to trusted frontend origins.

### Logout

The logout endpoint must revoke the current session and clear the refresh cookie.

The system should support logging out from all sessions.

### Account Management

Users must be able to:

- Retrieve their own account information.
- Update permitted account fields.
- Change their password.
- Request account deletion.
- Revoke active sessions.

Account deletion must follow a documented retention policy, including treatment of applications, messages, uploaded documents, and audit records.

---

## 3.2 Applicant Onboarding and Profile Management

Applicant onboarding should be incremental, allowing users to complete their profiles manually or use AI assistance where appropriate.

### Applicant Profile Fields

Suggested fields:

- `userId`
- `fullName`
- `headline`
- `summary`
- `profilePicture`
- `phone` (optional)
- `location`
- `skills`
- `experience`
- `education`
- `certifications`
- `projects`
- `resume`
- `preferredJobTitles`
- `preferredLocations`
- `preferredEmploymentTypes`
- `preferredWorkModes`
- `expectedSalary` or `expectedStipend`
- `noticePeriod` (optional)
- `availability`
- `profileCompletionPercentage`
- `createdAt`
- `updatedAt`

Use structured subdocuments for education, experience, certifications, and projects.

### Profile Completion

The backend must calculate profile completion from required fields.

The frontend may display the percentage, but the backend must remain the source of truth.

A user should be able to save a partially completed profile and return later.

### Resume Parsing

Resume parsing may be implemented as an optional AI-assisted feature.

Potential workflow:

1. The applicant uploads a resume.
2. The backend validates and securely stores the file.
3. A parsing service extracts relevant information.
4. The backend returns a proposed profile update.
5. The applicant reviews and edits the extracted information.
6. Only explicitly accepted fields are written to the applicant profile.

Parsing must not silently overwrite user-entered profile information.

For the initial release, manual profile completion and resume upload are mandatory; AI resume parsing can be implemented after the core application workflow.

---

## 3.3 Recruiter and Company Onboarding

Recruiter onboarding should create a recruiter profile and optionally a company profile.

### Recruiter Profile

Suggested fields:

- `userId`
- `companyId`
- `jobTitle`
- `department`
- `phone` (optional)
- `profilePicture`
- `onboardingCompleted`
- `createdAt`
- `updatedAt`

### Company Profile

Suggested fields:

- `name`
- `slug`
- `description`
- `website`
- `industry`
- `companySize`
- `headquarters`
- `locations`
- `logo`
- `verificationStatus`
- `createdBy`
- `createdAt`
- `updatedAt`

A company may eventually have multiple recruiter accounts. Therefore, job ownership should be associated with a company or organization, with an explicit recruiter ownership or membership relationship.

For the MVP, one recruiter may create and manage their own company profile.

### Permissions

- Recruiters can edit only authorized company profiles.
- Recruiters can manage only jobs belonging to their company.
- Company verification must be handled separately from ordinary profile completion.
- Unverified companies may be restricted from publishing jobs, depending on the platform policy.

---

## 3.4 Job Management

### Job Creation

Recruiters must be able to create job listings manually or with AI assistance.

Suggested job fields:

- `companyId`
- `createdBy`
- `title`
- `slug`
- `description`
- `responsibilities`
- `requiredSkills`
- `preferredSkills`
- `requiredQualifications`
- `minimumExperience`
- `maximumExperience`
- `employmentType`
- `workMode`
- `location`
- `salaryMin`
- `salaryMax`
- `salaryCurrency`
- `stipendMin`
- `stipendMax`
- `applicationDeadline`
- `vacancies`
- `status`
- `publishedAt`
- `closedAt`
- `createdAt`
- `updatedAt`

Salary and stipend fields should be optional where appropriate. The backend must validate that minimum values do not exceed maximum values.

Use consistent enumerations for employment type, work mode, and job status.

Example employment types:

- `full_time`
- `part_time`
- `contract`
- `internship`
- `freelance`

Example work modes:

- `onsite`
- `remote`
- `hybrid`

Example job statuses:

- `draft`
- `published`
- `paused`
- `closed`
- `archived`

### Job Lifecycle

A job should normally follow this lifecycle:

Draft → Published → Paused or Closed → Archived

Rules:

- Only authorized recruiters may change a job's status.
- Only published jobs can receive new applications.
- Closed jobs must not accept new applications.
- Expired jobs must be excluded from active recommendations.
- Published jobs must have all required fields.
- The backend must validate the deadline and other business rules.

### Job Search

Applicants should be able to search jobs using:

- Keywords
- Skills
- Location
- Work mode
- Employment type
- Salary or stipend range
- Experience requirements
- Publication date

Implement server-side filtering, sorting, and pagination.

Use database indexes for common query fields. Avoid returning entire unbounded job collections.

---

## 3.5 AI-Assisted Job Description Generation

The frontend will provide a job-description generator using OpenRouter, but the backend must own the business rules and AI-provider integration.

Recommended design: expose a backend endpoint that calls OpenRouter rather than placing the OpenRouter API key in the browser.

The frontend sends job details; the backend validates them and generates a draft.

### Input

- Job title
- Location
- Employment type
- Work mode
- Required skills
- Preferred skills
- Experience requirements
- Salary or stipend
- Company context (optional)

### Output

A structured job-description draft containing:

- Job summary
- Responsibilities
- Required qualifications
- Preferred qualifications
- Required and preferred skills
- Experience requirements
- Benefits or compensation summary, where supplied

### Requirements

- The generated description must be editable.
- AI-generated content must not be published automatically.
- The backend must validate and normalize the AI response.
- The AI must not invent salary, company benefits, or job conditions that the recruiter did not supply.
- API failures and rate limits must return predictable errors.
- Generation requests should be rate-limited.
- Provider keys must be stored in server-side environment variables.
- Prompts and model selection should be configurable.
- Usage and errors should be logged without recording unnecessary sensitive information.

This module should be provider-agnostic so OpenRouter can be replaced or supplemented later.

---

## 3.6 Application Management

### Applying for a Job

An applicant must be able to apply to a published job.

An application should contain:

- `jobId`
- `applicantId`
- `companyId`
- `resumeAssetId` or a reference to the submitted resume version
- `coverLetter` (optional)
- `screeningAnswers` (optional)
- `status`
- `submittedAt`
- `updatedAt`
- `withdrawnAt` (optional)

The application should reference a specific resume version or file asset, not merely the applicant's current resume field.

This ensures that if an applicant updates their resume later, recruiters can still review the version submitted with the original application.

### Application Rules

- Only authenticated applicants may apply.
- Applicants cannot apply to unpublished or closed jobs.
- Duplicate active applications for the same job should be prevented.
- The backend must validate that the applicant is applying as an applicant.
- The applicant may withdraw an application when permitted.
- Each application must be linked to its job, applicant, and company.
- Application creation should trigger a notification for the recruiter or designated hiring team.

### Application Statuses

Suggested statuses:

- `submitted`
- `reviewing`
- `shortlisted`
- `interviewing`
- `offered`
- `hired`
- `rejected`
- `withdrawn`

Status transitions must be validated by the backend.

Applicants may withdraw their own eligible applications, but they must not set themselves to shortlisted, offered, or hired.

Recruiters may update application status only for applications belonging to jobs they are authorized to manage.

The system should maintain a status history for auditing and user-facing progress tracking.

### Recruiter Application Review

Recruiters must be able to:

- View applications for their jobs.
- Filter applications by status.
- Sort applications by submission date or match score.
- View applicant profiles.
- Access the resume attached to each application.
- Update application status.
- Add private internal notes in a later phase.

---

## 3.7 Resume and File Management

Multer will handle incoming multipart form-data requests, while Cloudinary will provide file storage.

### Supported Files

Initial supported attachment types:

- PDF resumes
- DOC/DOCX resumes, if required
- Profile pictures
- Company logos

The allowed formats must be configured explicitly.

### Upload Workflow

1. Authenticate the user.
2. Authorize the upload operation.
3. Validate the file type, size, and upload category.
4. Upload the file to Cloudinary using a server-controlled configuration.
5. Store the Cloudinary asset metadata in the database.
6. Associate the asset with the relevant user, profile, or application.
7. Return safe metadata to the frontend.

### Asset Metadata

Suggested fields:

- `ownerId`
- `resourceType`
- `publicId`
- `secureUrl` (only when safe and appropriate)
- `format`
- `bytes`
- `originalFilename`
- `uploadedAt`
- `isPrivate`
- `deletedAt` (optional)

Avoid storing file contents directly in MongoDB.

### Resume Security

Resumes contain personal information and should be treated as private documents.

- Store resumes using private Cloudinary delivery where supported.
- Do not expose permanent public resume URLs.
- Generate authorized, short-lived access URLs or use a backend-mediated delivery mechanism.
- Verify that the requesting recruiter has access to the application or document.
- Ensure applicants can access their own documents.
- Validate actual file content, not just the supplied extension or MIME type.
- Limit upload size and prevent unauthorized file deletion.
- Use a cleanup workflow for orphaned uploads and deleted assets.

The frontend must never be trusted to decide whether a resume can be accessed.

---

## 3.8 Candidate Matching Engine

Candidate matching is a core backend feature.

The backend must calculate how well an applicant matches a job using job requirements and applicant profile data.

### Matching Inputs

Job-side data:

- Required skills
- Preferred skills
- Minimum experience
- Required qualifications
- Location and work mode
- Employment type
- Salary or stipend, where relevant
- Other explicit eligibility requirements

Applicant-side data:

- Skills
- Experience
- Education and qualifications
- Preferred locations
- Preferred work modes
- Preferred employment types
- Expected salary or stipend

### Initial Matching Strategy

Start with a deterministic weighted scoring algorithm rather than relying entirely on an LLM.

Example initial weights:

| Matching dimension | Weight |
|---|---:|
| Required skills | 40% |
| Preferred skills | 15% |
| Experience | 15% |
| Qualifications | 10% |
| Location and work mode | 10% |
| Employment preferences and compensation | 10% |
| Total | 100% |

These weights are initial configuration values and should be tuned through testing.

The implementation must define how each component is scored, how missing information is handled, and whether particular requirements are mandatory eligibility filters.

### Matching Process

1. Load the job's structured requirements.
2. Retrieve eligible applicant profiles.
3. Apply mandatory eligibility filters.
4. Calculate component scores.
5. Calculate the overall score.
6. Generate a concise explanation of matching and missing requirements.
7. Sort the results by score.
8. Return paginated results to the recruiter.

Example response:

- Applicant profile reference
- Overall match score
- Matched required skills
- Missing required skills
- Matched preferred skills
- Experience comparison
- Location compatibility
- Score breakdown
- Last calculated timestamp

### Matching Rules

- A missing skill must not automatically be interpreted as a confirmed lack of that skill.
- Missing profile information should be identified separately from a genuine mismatch.
- Do not use protected characteristics such as race, religion, or gender to rank applicants.
- Do not use a match score as an automatic hiring or rejection decision.
- The recruiter must be able to inspect the underlying reasons for a recommendation.
- Matching must not reveal private information about applicants to unauthorized recruiters.

### Match Persistence and Recalculation

Store match results in a dedicated collection or use a cache for frequently accessed results.

A match record should reference the job, applicant, score breakdown, algorithm version, and calculation timestamp.

Recalculate results when relevant job requirements or applicant profile fields change, or when the recruiter explicitly requests refreshed recommendations.

For the MVP, calculate matches on demand and persist results for reuse. A later phase can introduce queued background recalculation.

---

## 3.9 Recruiter-Requested Candidate Recommendations

Recruiters must be able to request suitable candidates for a particular job.

### Workflow

1. The recruiter selects a job they are authorized to manage.
2. The backend retrieves the job requirements.
3. The matching service filters eligible applicant profiles.
4. The service calculates and ranks matching candidates.
5. The backend returns paginated results with explanations.
6. The recruiter opens a candidate profile or authorized resume.
7. The recruiter may shortlist the candidate or initiate permitted communication.

Recommendations must exclude applicants who have opted out of recruiter discovery, where such a preference is supported, and must follow the platform's privacy policy.

Candidates who have not applied to a job may still appear in recommendations if their profiles are discoverable and platform rules permit it.

The backend must not create an application automatically merely because a candidate is recommended.

---

## 3.10 Applicant Job Recommendations

Applicants should receive personalized job recommendations based on their profiles and preferences.

### Recommendation Inputs

- Applicant skills
- Work experience
- Qualifications
- Preferred job titles
- Preferred locations
- Employment type
- Work mode
- Salary or stipend preferences
- Job availability and deadline

### Workflow

1. Retrieve eligible applicants.
2. Retrieve currently published and open jobs.
3. Calculate or retrieve match scores.
4. Exclude jobs already applied to or otherwise ineligible.
5. Rank the remaining jobs.
6. Store or update recommendation records.
7. Notify applicants according to their notification preferences.

The backend must return recommendations through an authenticated API.

Recommendations should include the job, match score, explanation, and generation timestamp.

---

## 3.11 Nightly Recommendation Cron Job

A scheduled background process should generate recommendations once every night.

### Applicant Recommendations

For each eligible applicant:

- Retrieve the current profile and preferences.
- Find relevant open jobs.
- Calculate or retrieve match scores.
- Exclude already-applied jobs.
- Select a limited number of high-quality recommendations.
- Store the recommendation results.
- Create in-app notifications.
- Optionally send email notifications according to user preferences.

### Recruiter Recommendations

For each eligible published job:

- Retrieve current job requirements.
- Find discoverable, potentially suitable applicants.
- Exclude candidates already associated with the job where appropriate.
- Rank candidates.
- Store the recommendation results.
- Create recruiter notifications for new or meaningfully improved recommendations.

### Scheduling Requirements

- Run at a configurable local or UTC time.
- Use a suitable scheduler, such as `node-cron`, for a single-instance MVP.
- Prevent overlapping executions.
- Make processing idempotent.
- Process records in batches.
- Handle partial failures and retries.
- Record execution status, duration, counts, and errors.
- Avoid sending duplicate notifications for unchanged recommendations.

For production with multiple backend instances, use a distributed lock or a durable job queue such as BullMQ with Redis. Do not assume an in-process cron job will execute exactly once across multiple servers.

### Recommendation Freshness

Recommendations must be refreshed when relevant data changes or when the user explicitly requests them.

The nightly job is a scheduled refresh, not the only mechanism for maintaining accurate results.

---

## 3.12 Notification System

The backend must provide an in-app notification system.

### Notification Events

Applicant notifications:

- Application submitted successfully.
- Application status changed.
- Recruiter sends a message.
- New matching jobs are recommended.
- Important account or security event.

Recruiter notifications:

- New application received.
- Applicant replies to a conversation.
- New candidate recommendations are available.
- Job deadline is approaching, where supported.
- Important account or company event.

### Notification Schema

Suggested fields:

- `recipientId`
- `type`
- `title`
- `message`
- `resourceType`
- `resourceId`
- `isRead`
- `readAt`
- `createdAt`
- `deduplicationKey` (optional)

### Requirements

- Notifications must be scoped to the intended recipient.
- Users must be able to list, paginate, and mark notifications as read.
- Support marking a notification as read without exposing another user's notifications.
- Support unread notification counts.
- Notification creation should be triggered by domain events or a dedicated notification service.
- Duplicate events must not produce repeated notifications.
- Email delivery should be a separate channel with configurable preferences.

A notification must not expose private resume contents, confidential recruiter notes, or sensitive account information.

### Delivery Strategy

For the MVP, persist notifications in MongoDB and provide polling APIs.

Real-time delivery can be introduced using Socket.IO or another supported transport. Socket connections must authenticate users and enforce room-level authorization.

---

## 3.13 Messaging System

The platform should support conversations between applicants, recruiters, and other permitted users.

### Conversation Types

- Direct conversation between two users.
- Job-related conversation between an applicant and a recruiter.
- Optional group conversations in a later phase.

### Conversation Schema

Suggested fields:

- `type`
- `participantIds`
- `jobId` (optional)
- `applicationId` (optional)
- `lastMessageId`
- `lastMessageAt`
- `createdAt`
- `updatedAt`

### Message Schema

Suggested fields:

- `conversationId`
- `senderId`
- `messageType`
- `text`
- `attachmentAssetIds` (optional)
- `createdAt`
- `editedAt` (optional)
- `deletedAt` (optional)
- `readBy` or an appropriate read-receipt structure

### Requirements

- Only conversation participants may read or send messages.
- The backend must validate all participant IDs and conversation permissions.
- Users must not be able to add themselves to unauthorized conversations.
- Message text must be validated and size-limited.
- Message history must be paginated.
- Notifications should be generated for new messages.
- Read receipts may be supported.
- Message attachments must use the secure file-management workflow.
- Abuse prevention, blocking, reporting, and rate limits should be included as the platform matures.

For the MVP, use REST APIs for sending and retrieving messages. Add Socket.IO for live delivery after the underlying authorization and persistence logic is working.

---

# 4. API Design

All endpoints should use a versioned API prefix:

`/api/v1`

Authentication is required for private endpoints. Public endpoints must still apply rate limits and validation where appropriate.

## 4.1 Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register an account |
| POST | `/auth/login` | Authenticate and issue tokens |
| POST | `/auth/refresh` | Rotate the refresh token |
| POST | `/auth/logout` | Revoke the current session |
| POST | `/auth/logout-all` | Revoke all sessions |
| GET | `/auth/me` | Retrieve the authenticated user |
| POST | `/auth/forgot-password` | Request password recovery |
| POST | `/auth/reset-password` | Reset a password |

## 4.2 Applicant Profiles

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/applicants/me` | Retrieve own profile |
| PUT | `/applicants/me` | Create or replace editable profile data |
| PATCH | `/applicants/me` | Update selected profile fields |
| GET | `/applicants/me/completion` | Retrieve profile completion |
| POST | `/applicants/me/resume` | Upload a resume |
| DELETE | `/applicants/me/resume/:assetId` | Remove an eligible resume asset |
| GET | `/applicants/me/recommendations` | Retrieve recommended jobs |
| PATCH | `/applicants/me/preferences` | Update job preferences |

## 4.3 Recruiter and Company Profiles

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/recruiters/me` | Retrieve own recruiter profile |
| PATCH | `/recruiters/me` | Update recruiter profile |
| POST | `/companies` | Create a company |
| GET | `/companies/:companyId` | Retrieve an authorized or public company profile |
| PATCH | `/companies/:companyId` | Update an authorized company |
| POST | `/companies/:companyId/logo` | Upload a company logo |

## 4.4 Jobs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/jobs` | Create a job draft |
| GET | `/jobs` | Search published jobs |
| GET | `/jobs/:jobId` | Retrieve a job |
| PATCH | `/jobs/:jobId` | Update an authorized job |
| PATCH | `/jobs/:jobId/status` | Change job status |
| DELETE | `/jobs/:jobId` | Archive or delete an eligible job |
| POST | `/jobs/ai/generate-description` | Generate a job-description draft |

## 4.5 Applications

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/jobs/:jobId/applications` | Apply for a job |
| GET | `/applications/me` | List own applications |
| GET | `/applications/:applicationId` | Retrieve an authorized application |
| POST | `/applications/:applicationId/withdraw` | Withdraw an application |
| GET | `/jobs/:jobId/applications` | List applications for an authorized job |
| PATCH | `/applications/:applicationId/status` | Update an authorized application status |
| GET | `/applications/:applicationId/resume` | Obtain authorized resume access |

## 4.6 Matching and Recommendations

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/jobs/:jobId/candidates` | Retrieve ranked candidate recommendations |
| POST | `/jobs/:jobId/candidates/refresh` | Request refreshed matching results |
| GET | `/applicants/me/recommendations` | Retrieve recommended jobs |
| POST | `/recommendations/refresh` | Request a refresh of the user's eligible recommendations |

Recommendation endpoints must enforce role checks, pagination, rate limits, and data-access permissions.

## 4.7 Notifications

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/notifications` | List own notifications |
| GET | `/notifications/unread-count` | Retrieve unread count |
| PATCH | `/notifications/:notificationId/read` | Mark one notification as read |
| PATCH | `/notifications/read-all` | Mark all own notifications as read |

## 4.8 Messaging

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/conversations` | Create an authorized conversation |
| GET | `/conversations` | List conversations for the current user |
| GET | `/conversations/:conversationId` | Retrieve conversation details |
| GET | `/conversations/:conversationId/messages` | Retrieve paginated messages |
| POST | `/conversations/:conversationId/messages` | Send a message |
| PATCH | `/messages/:messageId` | Edit an eligible message |
| DELETE | `/messages/:messageId` | Delete or soft-delete an eligible message |

The exact route structure may be refined during implementation. All routes must have consistent validation, authentication, authorization, and response formats.

---

# 5. Data Model and Mongoose Collections

The initial database should contain the following collections.

## Core Collections

### `users`

Stores account identity, authentication information, role, account status, and verification state.

### `sessions`

Stores hashed refresh-token information, session metadata, expiry, and revocation status.

### `applicantProfiles`

Stores applicant-specific professional information, preferences, education, skills, and experience.

### `recruiterProfiles`

Stores recruiter-specific information and company membership.

### `companies`

Stores organization information and verification status.

### `jobs`

Stores job descriptions, requirements, compensation, lifecycle state, and ownership.

### `applications`

Stores submitted applications, resume snapshots or references, status, and status history.

### `fileAssets`

Stores Cloudinary metadata and document ownership/access information.

### `matchResults`

Stores candidate-job scores, score breakdowns, algorithm version, and calculation timestamps.

### `recommendations`

Stores applicant-job and recruiter-candidate recommendation records, score information, and recommendation timestamps.

### `notifications`

Stores recipient-specific notification records and read status.

### `conversations`

Stores conversation metadata and participant references.

### `messages`

Stores message content, sender, conversation reference, timestamps, and read receipts.

### `auditLogs`

Stores important security and business events, especially sensitive status changes and administrative actions.

## Relationships

- One user has one primary account type.
- One applicant user has one applicant profile.
- One recruiter user has one recruiter profile.
- A company can have multiple recruiters.
- A company can have multiple jobs.
- A job can have many applications.
- An applicant can have many applications.
- An application references a particular resume asset or submitted document version.
- A job and applicant can have a persisted match result.
- A user can have many notifications.
- A conversation has multiple authorized participants.
- A conversation has many messages.

## Data Integrity

- Create appropriate unique indexes, including normalized email and any necessary application uniqueness constraints.
- Index frequently queried fields such as job status, publication date, location, company, applicant ID, job ID, application status, recipient ID, and conversation ID.
- Use `.lean()` for read-only Mongoose queries where appropriate.
- Use `.select()` to return only necessary fields.
- Use pagination for all potentially large lists.
- Use MongoDB transactions when a workflow requires multiple related writes to succeed atomically and the deployment supports transactions.
- Validate references and ownership at the service layer rather than assuming that a valid MongoDB ObjectId implies permission.

---

# 6. Recommended Backend Architecture

Use a modular Express.js application.

Suggested structure:

```text
src/
├── app.js
├── server.js
├── config/
│   ├── database.js
│   ├── cloudinary.js
│   ├── env.js
│   └── aiProvider.js
├── modules/
│   ├── auth/
│   ├── users/
│   ├── applicants/
│   ├── recruiters/
│   ├── companies/
│   ├── jobs/
│   ├── applications/
│   ├── files/
│   ├── matching/
│   ├── recommendations/
│   ├── notifications/
│   ├── messaging/
│   └── audit/
├── services/
│   ├── email/
│   ├── cloudinary/
│   ├── ai/
│   └── queue/
├── jobs/
│   ├── nightlyRecommendations.js
│   └── cleanupOrphanedAssets.js
├── middleware/
│   ├── authenticate.js
│   ├── authorize.js
│   ├── validate.js
│   ├── rateLimit.js
│   └── errorHandler.js
├── utils/
├── validators/
└── tests/
```

Each feature module should separate:

- **Routes:** Define HTTP endpoints.
- **Controllers:** Handle request and response orchestration.
- **Services:** Implement business rules and workflows.
- **Models:** Define Mongoose schemas and indexes.
- **Validators:** Validate request payloads and query parameters.

Controllers should remain thin. Matching, application status transitions, recommendation generation, and file authorization should live in services or dedicated domain modules.

Use a centralized error handler and a consistent API response contract.

Example successful response:

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {}
  }
}
```

Example error response:

```json
{
  "success": false,
  "message": "You have already applied for this job",
  "code": "DUPLICATE_APPLICATION"
}
```

Validation errors should identify the relevant fields without exposing stack traces or internal infrastructure details.

---

# 7. Security Requirements

The backend must implement the following security controls:

1. Password hashing and credential validation.
2. Short-lived access tokens and rotating refresh tokens.
3. Secure refresh-token cookies and CSRF protection appropriate to the deployment.
4. Authentication middleware for protected routes.
5. Role-based authorization and resource-level ownership checks.
6. Request validation and sanitization.
7. Rate limiting on authentication, messaging, uploads, and AI endpoints.
8. Secure file validation and private document delivery.
9. Restricted CORS configuration.
10. Safe MongoDB query construction and protection against NoSQL injection.
11. Request-size limits and safe error responses.
12. Server-side secrets management.
13. Audit logging for sensitive actions.
14. Protection against unauthorized resume, application, message, and company access.
15. Privacy controls for candidate discoverability and profile visibility.

The application must never trust a client-supplied user ID to determine who is making a request. Identity must come from the authenticated session or token.

AI-generated content must be treated as untrusted input. The backend must validate AI output before using it in database writes or business decisions.

---

# 8. Background Processing and Reliability

The backend will have work that should not block normal HTTP requests.

Background tasks include:

- Nightly recommendation generation.
- Recommendation refreshes.
- Email notification delivery.
- AI resume parsing.
- Cleanup of orphaned Cloudinary assets.
- Optional stale-job closure.
- Optional retry of failed asynchronous tasks.

For a local or single-instance MVP, a simple scheduled job may be sufficient.

For a multi-instance deployment, use a durable queue and distributed coordination to prevent duplicated processing.

Long-running tasks must record success or failure and be safe to retry.

The API should not wait for every recommendation email or candidate match to finish before responding to an ordinary user request.

---

# 9. Testing Requirements

## Unit Tests

Test:

- Password validation and token-related utilities.
- Profile completion calculations.
- Job eligibility rules.
- Application status transitions.
- Match score calculations.
- Recommendation filtering and ranking.
- File validation.
- Authorization decisions.

## Integration Tests

Test:

- Registration and login.
- Refresh-token rotation and logout.
- Applicant onboarding.
- Recruiter onboarding.
- Job creation and publishing.
- Application submission and duplicate prevention.
- Authorized resume access.
- Recruiter application review.
- Candidate recommendation endpoints.
- Notification creation and read permissions.
- Conversation and message authorization.
- AI description generation using a mocked provider.

## Critical Acceptance Tests

The following workflows must pass before submission:

1. An applicant registers, completes their profile, and uploads a resume.
2. A recruiter registers, creates a company, and publishes a job.
3. An applicant finds the job and applies.
4. The recruiter sees the application and accesses its authorized resume.
5. The backend returns explainable candidate-job match results.
6. The applicant receives relevant job recommendations.
7. The recruiter receives relevant candidate recommendations.
8. Notifications are generated without duplication.
9. Unauthorized users cannot access private resources.
10. The main workflow remains functional when the AI provider is unavailable.

---

# 10. Implementation Phases

## Phase 1 — Foundation

Implement:

- Express application setup.
- MongoDB connection and Mongoose models.
- Environment validation.
- Error handling and request validation.
- Authentication and refresh-token sessions.
- Authorization middleware.
- Git repository and initial tests.

**Deliverable:** A secure API foundation.

## Phase 2 — Onboarding and Profiles

Implement:

- Applicant onboarding.
- Recruiter onboarding.
- Company profiles.
- Profile completion.
- Cloudinary upload integration.
- Secure resume access.

**Deliverable:** Applicants and recruiters can create usable profiles and manage their documents.

## Phase 3 — Jobs and Applications

Implement:

- Job CRUD and lifecycle.
- Job search and pagination.
- Application submission.
- Duplicate application prevention.
- Application status history.
- Recruiter application management.

**Deliverable:** A complete end-to-end recruitment workflow.

## Phase 4 — Candidate Matching

Implement:

- Structured matching inputs.
- Weighted match score calculation.
- Candidate ranking.
- Match explanations.
- Persisted match results.
- Recruiter-requested candidate discovery.

**Deliverable:** Recruiters can retrieve relevant candidates for a job.

## Phase 5 — AI and Recommendations

Implement:

- Server-side OpenRouter integration.
- AI-assisted job description generation.
- Applicant job recommendations.
- Nightly recommendation processing.
- Recruiter candidate recommendations.
- Recommendation persistence and deduplication.

**Deliverable:** AI-assisted job creation and automated recommendations.

## Phase 6 — Notifications and Messaging

Implement:

- In-app notifications.
- Unread counts and read status.
- Conversation management.
- Message persistence and pagination.
- Message notifications.
- Optional Socket.IO delivery.

**Deliverable:** Users can communicate and receive updates.

## Phase 7 — Quality and Submission

Implement:

- Critical unit and integration tests.
- Security review.
- API documentation.
- README and `.env.example`.
- Demo data and test accounts.
- Deployment and live demonstration preparation.

**Deliverable:** A testable, documented backend suitable for technical review.

---

# 11. MVP Scope and Priorities

## Must Have

- JWT authentication with secure refresh sessions.
- Applicant and recruiter onboarding.
- Applicant and company profiles.
- Resume uploads through Multer and Cloudinary.
- Job CRUD, publishing, and searching.
- Application submission and recruiter review.
- Application status transitions.
- Secure resume access.
- Explainable rule-based candidate matching.
- Recruiter-requested candidate recommendations.
- AI-assisted job description generation.
- In-app notifications.
- Nightly recommendation job.
- README, environment example, and critical tests.

## Should Have

- Personalized applicant job recommendations.
- Basic messaging.
- Match-result persistence and recalculation.
- Email notifications.
- AI-assisted resume parsing.
- Recommendation preferences and candidate discoverability settings.

## Could Have

- Real-time messaging.
- Recruiter teams and granular company permissions.
- Interview scheduling.
- Advanced analytics.
- Admin moderation dashboard.
- Advanced semantic matching using embeddings.
- Recommendation quality evaluation dashboards.

The initial release should not depend on every optional feature being complete. Prioritize the core workflow from registration to job application, recruiter review, and matching.

---

# 12. Acceptance Criteria

The backend is ready for its first assessment demo when:

- An applicant and recruiter can independently register and log in.
- Refresh sessions are handled securely.
- Applicants and recruiters can complete and update their profiles.
- Recruiters can create, publish, and manage jobs.
- Applicants can search and apply for eligible jobs.
- Recruiters can view applications and access authorized submitted resumes.
- The backend can rank candidates using a documented matching algorithm.
- The recruiter can request candidate recommendations for an owned job.
- AI can generate an editable job-description draft from validated inputs.
- Nightly recommendation processing can run without creating duplicate records or notifications.
- Notifications can be listed and marked as read securely.
- Unauthorized resource access is rejected.
- At least one critical workflow has automated tests.
- Setup instructions and environment-variable documentation are complete.
- The developer can explain the architecture, database, security, matching algorithm, and known limitations.

---

# 13. Decisions to Finalize Before Implementation

The following choices should be settled before their corresponding modules are built:

1. Whether recruiter accounts require company verification before publishing jobs.
2. Whether direct messaging is available to all users or restricted to job-related relationships.
3. Whether resumes are private Cloudinary assets with signed access or delivered through an authenticated backend route.
4. Which matching weights and mandatory eligibility rules should be used initially.
5. How many recommendations should be generated per user per nightly run.
6. Whether email verification is required before applying or publishing jobs.
7. Whether AI resume parsing is part of the MVP or a later release.
8. Whether the first deployment is single-instance or requires a distributed job queue.

These decisions should be documented as explicit product rules instead of being scattered across controllers.

---

# 14. Final Product Outcome

The completed backend should provide a secure and modular recruitment system in which:

- Applicants manage profiles and apply for jobs.
- Recruiters publish jobs and review applications.
- Cloudinary stores resume and profile assets.
- The matching service ranks candidates based on structured job and applicant information.
- AI assists with job description generation.
- Scheduled processing creates personalized job and candidate recommendations.
- Notifications keep users informed.
- Messaging supports communication between authorized participants.
- The REST API remains ready for a separate React and RTK Query frontend.

The primary objective is a reliable, explainable, testable recruitment workflow—not the largest possible feature set.
