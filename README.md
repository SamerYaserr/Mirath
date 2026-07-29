# Mirath

**Mirath** (ميراث) is a production-grade academic social platform built for researchers and academics. It combines a structured research-paper library with a rich social layer: users can follow peers, create and share reading lists, annotate papers with color-coded XPath highlights, engage in threaded discussions, converse with an AI assistant that understands multi-modal input (text, images, and voice) with real-time streaming responses, and study papers with an AI assistant that can explain, summarize, and translate research content.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Modules](#api-modules)
- [Authentication and Security](#authentication-and-security)
- [AI Chatbot](#ai-chatbot)
- [Search System](#search-system)
- [Background Processes](#background-processes)
- [Push Notification System](#push-notification-system)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running the Project](#running-the-project)
- [Database Management](#database-management)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Scripts Reference](#scripts-reference)

---

## Overview

Mirath serves as a unified hub where researchers can:

- **Discover** academic papers through full-text fuzzy search powered by PostgreSQL's `pg_trgm` extension
- **Read and annotate** papers inline with XPath-based color-coded highlights and personal notes
- **Study papers with an AI assistant** that can explain, summarize, and translate research content
- **Organize** their library via saved papers, reading history, and shareable reading lists
- **Discuss** papers and research topics with an upvote/downvote threaded comment system
- **Connect** with other researchers via a follow graph, interest tags, and field-of-study profiles
- **Chat with an AI assistant** that supports text, image, and voice messages with real-time SSE-streamed responses
- **Stay updated** through a personalized activity feed aggregating events from followed researchers
- **Search globally** across papers, discussions, researchers, and reading lists from a single endpoint
- **Stay notified** through push (FCM) and in-app notifications for new followers, replies, @mentions, upvotes, and a weekly research digest; fully configurable per-notification-type preferences
- **Customize** the experience with granular appearance, feed, and privacy settings accessible through a dedicated settings API

---

## Tech Stack

| Layer              | Technology                                                     |
| ------------------ | -------------------------------------------------------------- |
| Runtime            | Node.js, TypeScript 5 (ES2023, strict mode)                    |
| Framework          | NestJS 11                                                      |
| Database           | PostgreSQL 15                                                  |
| ORM                | Prisma 7 with `@prisma/adapter-pg` connection pooling          |
| Authentication     | JWT (access + refresh + reset), Google OAuth 2.0, bcrypt       |
| Email              | Nodemailer + Handlebars templates via `@nestjs-modules/mailer` |
| File Storage       | Cloudinary v2                                                  |
| Push Notifications | Firebase Admin SDK (`firebase-admin`)                          |
| Job Queue          | BullMQ + `@nestjs/bullmq`                                      |
| API Docs           | `@nestjs/swagger` + Scalar UI                                  |
| Logging            | Winston + `winston-daily-rotate-file` + `nest-winston`         |
| Scheduling         | `@nestjs/schedule`                                             |
| Validation         | `class-validator` + `class-transformer` + Zod                  |
| Dev Tooling        | ESLint, Prettier, Faker.js, `cross-env`, `tsx`                 |

---

## Architecture

Mirath follows NestJS's **modular architecture** with a strict **Repository pattern** separating all data access from business logic. Each feature domain lives in its own self-contained module with a controller, service, and one or more typed repository classes. The `PrismaModule` is declared `@Global()` so `PrismaService` is available application-wide without repeated imports.

```
Client
  │
  ▼
NestJS App (port 3000)
  ├── Global JWT Auth Guard     (opt-out via @Public())
  ├── Global Roles Guard        (opt-in via @Roles())
  ├── Global Validation Pipe    (whitelist + transform)
  ├── Cookie Parser Middleware
  │
  ├── AuthModule            <- JWT, OTP, Google OAuth, password reset
  ├── UsersModule           <- Profiles, follow graph, onboarding
  ├── PapersModule          <- Catalog, pg_trgm search, save/unsave
  ├── PaperAnnotationsModule<- XPath highlights, notes, AI explain/summarize/translate
  ├── LibraryModule         <- Saved papers, reading history, stats
  ├── ReadingListsModule    <- Create, share, and save curated lists
  ├── DiscussionsModule     <- Forum threads with up/down voting
  ├── CommentsModule        <- Nested threaded comments with voting
  ├── FeedModule            <- Personalized activity feed and timeline aggregation
  ├── SearchModule          <- Global + entity-scoped search + history
  ├── ChatbotModule         <- AI sessions (text/image/audio), SSE streaming
  ├── InterestsModule       <- Interest taxonomy + custom interests
  ├── MailModule            <- Transactional email (OTP, welcome)
  ├── CloudinaryModule      <- File upload/delete abstraction
  ├── UserSettingsModule    <- Appearance, account, feed, notification prefs, privacy
  ├── NotificationsModule   <- FCM push, in-app notification center, BullMQ processor
  ├── HealthModule          <- Health checks and service readiness
  └── PrismaModule          <- Global database service (pooled)
        │
        ▼
  PostgreSQL 15 (via pg.Pool connection pool)
```

All HTTP responses follow a consistent envelope format:

```json
{
  "message": "Human-readable result",
  "data": {},
  "size": 10
}
```

Repositories accept an optional `Prisma.TransactionClient` parameter, enabling cross-repository atomic operations without leaking transaction logic into service methods.

---

## Database Schema

The schema is fully managed by Prisma migrations. Below is a comprehensive summary of every model, enum, and notable index.

### Enumerations

| Enum               | Values                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `UserStatus`       | `PENDING_VERIFICATION`, `ONBOARDING`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`, `BANNED`                              |
| `Role`             | `USER`, `ADMIN`                                                                                                   |
| `LevelOfEducation` | `HIGH_SCHOOL`, `UNDERGRADUATE`, `GRADUATE`                                                                        |
| `OtpPurpose`       | `REGISTER`, `RESET_PASSWORD`, `EMAIL_CHANGE`                                                                      |
| `VoteType`         | `UP`, `DOWN`                                                                                                      |
| `HighlightColor`   | `YELLOW`, `GREEN`, `BLUE`, `PURPLE`, `PINK`, `RED`                                                                |
| `MessageRole`      | `USER`, `ASSISTANT`                                                                                               |
| `MessageType`      | `TEXT`, `IMAGE`, `AUDIO`                                                                                          |
| `AttachmentType`   | `IMAGE`, `AUDIO`                                                                                                  |
| `FeedbackType`     | `THUMBS_UP`, `THUMBS_DOWN`                                                                                        |
| `NotificationType` | `FOLLOW`, `READING_LIST_SAVED`, `COMMENT`, `REPLY`, `MENTION`, `VOTE_DISCUSSION`, `VOTE_COMMENT`, `WEEKLY_DIGEST` |
| `ColorMode`        | `LIGHT`, `DARK`, `SYSTEM`                                                                                         |
| `FontSize`         | `SMALL`, `MEDIUM`, `LARGE`, `EXTRA_LARGE`                                                                         |

### Models

**Identity and Auth**

| Model             | Key Fields                                                                                  | Notes                                                          |
| ----------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `User`            | `id (UUID)`, `username`, `email`, `password?`, `providerId?`, `status`, `role`, `isPremium` | Supports both password and OAuth accounts                      |
| `OtpVerification` | `userId`, `otpCode`, `purpose`, `expiresAt`, `isUsed`                                       | Scoped by `OtpPurpose` to prevent cross-purpose replay         |
| `RefreshToken`    | `userId`, `sessionId (UUID)`, `expiresAt`                                                   | One record per active device session; rotated on every refresh |

**Social Graph**

| Model          | Key Fields                               | Notes                                               |
| -------------- | ---------------------------------------- | --------------------------------------------------- |
| `Follows`      | `(followerId, followingId)` composite PK | No self-follows enforced at service layer           |
| `Interest`     | `id`, `name`, `custom (bool)`            | Pre-seeded taxonomy + user-created custom interests |
| `UserInterest` | `(userId, interestId)` composite PK      | Many-to-many join                                   |
| `FieldOfStudy` | `id`, `name`                             | 20 pre-seeded academic disciplines                  |
| `UserField`    | `(userId, fieldId)` composite PK         | Many-to-many join                                   |

**Papers and Library**

| Model            | Key Fields                                                                                        | Notes                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `Paper`          | `id`, `citation`, `title`, `abstract`, `authors[]`, `categories[]`, `content (JSONB)`, `fullText` | GIN indexes on `authors`, `categories`, and `fullText` (with `gin_trgm_ops`) |
| `SavedPaper`     | `(userId, paperId)` composite PK                                                                  |                                                                              |
| `SearchHistory`  | `userId`, `query`, `createdAt`                                                                    | Per-user recent searches; non-blocking async write                           |
| `ReadingHistory` | `(userId, paperId)` unique                                                                        | `viewedAt` updated on re-visit via upsert                                    |

**Reading Lists**

| Model              | Key Fields                                           | Notes                                    |
| ------------------ | ---------------------------------------------------- | ---------------------------------------- |
| `ReadingList`      | `id`, `title`, `description?`, `isPublic`, `ownerId` |                                          |
| `ReadingListPaper` | `(readingListId, paperId)` composite PK              |                                          |
| `SavedReadingList` | `(userId, readingListId)` composite PK               | Users can save other users' public lists |

**Discussions and Comments**

| Model             | Key Fields                                                                           | Notes                                      |
| ----------------- | ------------------------------------------------------------------------------------ | ------------------------------------------ |
| `Discussion`      | `id`, `title`, `content`, `upvoteCount`, `downvoteCount`, `commentCount`, `authorId` | Denormalized vote counts for fast reads    |
| `DiscussionTopic` | `(discussionId, interestId)` composite PK                                            | Tags a discussion with interest topics     |
| `DiscussionPaper` | `(discussionId, paperId)` composite PK                                               | Links discussions to referenced papers     |
| `DiscussionVote`  | `(userId, discussionId)` composite PK, `type`                                        |                                            |
| `Comment`         | `id`, `content`, `authorId`, `discussionId`, `parentId?`                             | Self-referential for nested thread replies |
| `CommentVote`     | `(userId, commentId)` composite PK, `type`                                           |                                            |

**Paper Annotations**

| Model       | Key Fields                                                                                                  | Notes                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `Highlight` | `userId`, `paperId`, `color`, `xpathStart`, `xpathEnd`, `startOffset`, `endOffset`, `selectedText`, `note?` | Full XPath location data stored for accurate cross-session restoration |

**AI Chatbot**

| Model               | Key Fields                                                              | Notes                                                           |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| `ChatSession`       | `userId`, `title`, `isTemporary`, `expiresAt?`                          | Temporary sessions have a sliding 24h TTL                       |
| `ChatMessage`       | `sessionId`, `role`, `type`, `content`                                  | Supports `TEXT`, `IMAGE`, and `AUDIO` roles                     |
| `MessageAttachment` | `messageId`, `type`, `url`, `mimeType`, `sizeBytes`, `durationSeconds?` |                                                                 |
| `MessageFeedback`   | `messageId`, `userId`, `type`                                           | Thumbs up/down; toggleable and updatable                        |
| `ChatFile`          | `userId`, `sessionId?`, `url`, `mimeType`                               | Staging table for uploads before they are attached to a message |

**User Settings**

| Model                    | Key Fields                                                                                                                                                            | Notes                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `UserSettings`           | `userId`, `colorMode`, `defaultFontSize`, `defaultReadingListVisibility`, `annotationHighlightColors[]`, 6 notification booleans, 4 privacy booleans, 2 feed booleans | 1:1 with `User`; auto-upserted on first access; defaults match schema      |
| `RecommendationInterest` | `(settingsId, interestId)` composite PK                                                                                                                               | Separate from `UserInterest`; used exclusively for AI/feed recommendations |

**Notifications**

| Model            | Key Fields                                                                         | Notes                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `DeviceFcmToken` | `userId`, `token`, `deviceId?`                                                     | Unique on `(userId, token)`; indexed on `updatedAt` for stale-token pruning after FCM failure |
| `Notification`   | `recipientId`, `actorId?`, `type`, `isRead`, `jobId?` (unique), `metadata (JSONB)` | `jobId` maps to BullMQ job ID for idempotent delivery; actor nullable for system events       |

---

## API Modules

### Auth: `/auth`

| Method | Endpoint               | Auth   | Description                                                        |
| ------ | ---------------------- | ------ | ------------------------------------------------------------------ |
| `POST` | `/signup`              | Public | Register with email, username, and password. Sends OTP to email.   |
| `POST` | `/verify-email`        | Public | Submit OTP to activate account. Returns access and refresh tokens. |
| `POST` | `/resend-verification` | Public | Re-send verification OTP (rate-limited).                           |
| `POST` | `/google`              | Public | Authenticate via Google ID token. Creates or logs in an account.   |
| `POST` | `/login`               | Public | Login with email/username and password.                            |
| `POST` | `/logout`              | Bearer | Revoke current session's refresh token and clear the cookie.       |
| `POST` | `/refresh`             | Cookie | Rotate refresh token; issue a new access token and refresh token.  |
| `POST` | `/forget-password`     | Public | Send password-reset OTP (anti-enumeration: always returns 200).    |
| `POST` | `/verify-reset-code`   | Public | Validate reset OTP; returns a short-lived reset JWT.               |
| `POST` | `/reset-password`      | Public | Set new password using reset JWT. Invalidates all sessions.        |
| `POST` | `/is-verified`         | Public | Check whether an email address has been verified.                  |
| `GET`  | `/check-setup`         | Bearer | Check whether the authenticated user has completed onboarding.     |

### Users: `/users`

| Method   | Endpoint         | Description                                                                                         |
| -------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `POST`   | `/setup-profile` | Complete onboarding (name, education, interests, optional photo). `multipart/form-data`.            |
| `GET`    | `/me`            | Get authenticated user's full profile. Supports sparse field selection via `?fields=`.              |
| `PATCH`  | `/profile`       | Partially update profile fields with optional photo upload. Old photo auto-deleted from Cloudinary. |
| `GET`    | `/:id/profile`   | Get another user's public profile (context-aware: `isMe`, `isFollowing`, email visibility).         |
| `POST`   | `/:id/follow`    | Follow a user. Idempotent (no error if already following).                                          |
| `DELETE` | `/:id/follow`    | Unfollow a user. Idempotent (no error if not following).                                            |
| `GET`    | `/:id/followers` | Paginated list of followers with viewer's follow status for each.                                   |
| `GET`    | `/:id/following` | Paginated list of followed users with viewer's follow status for each.                              |

### Papers: `/papers`

| Method   | Endpoint      | Description                                                                                          |
| -------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `GET`    | `/`           | Full-text trigram search with pagination. Saves to search history asynchronously.                    |
| `GET`    | `/categories` | List all distinct paper categories with pagination.                                                  |
| `GET`    | `/:id`        | Get full paper detail (`content` JSONB included, `fullText` excluded).                               |
| `GET`    | `/:id/search` | Find all zero-indexed character-offset positions of a query string inside a paper via recursive CTE. |
| `POST`   | `/:id/save`   | Save a paper to the authenticated user's library.                                                    |
| `DELETE` | `/:id/save`   | Remove a paper from the saved library.                                                               |

### Paper Annotations: `/papers/:id/annotations`

| Method   | Endpoint                        | Description                                                            |
| -------- | ------------------------------- | ---------------------------------------------------------------------- |
| `POST`   | `/highlights`                   | Create a highlight with XPath location data, color, and optional note. |
| `GET`    | `/highlights`                   | Get paginated highlights for a paper scoped to the authenticated user. |
| `PATCH`  | `/highlights/:highlightId`      | Update a highlight's color or note.                                    |
| `DELETE` | `/highlights/:highlightId`      | Delete a highlight.                                                    |
| `POST`   | `/highlights/:highlightId/note` | Add a note to an existing highlight.                                   |
| `PATCH`  | `/highlights/:highlightId/note` | Update the note on an existing highlight.                              |
| `DELETE` | `/highlights/:highlightId/note` | Remove a note from a highlight without deleting the highlight itself.  |
| `GET`    | `/notes`                        | Get the current user's noted highlights for the paper with pagination. |
| `POST`   | `/summarize`                    | Summarize a text snippet from the paper via the AI service.            |
| `POST`   | `/explain`                      | Explain highlighted text via the AI service.                           |
| `POST`   | `/translate`                    | Translate highlighted text into a target language via the AI service.  |

### Library: `/library`

| Method   | Endpoint                    | Description                                                                                 |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| `GET`    | `/stats`                    | Library overview: total lists (owned + saved), created lists, saved papers, projects count. |
| `GET`    | `/saved`                    | Get saved papers with pagination and sort order (`asc`/`desc`).                             |
| `POST`   | `/reading-history/:paperId` | Record or update a paper view (upsert on `(userId, paperId)`).                              |
| `GET`    | `/reading-history`          | Get paginated reading history ordered by `viewedAt`.                                        |
| `DELETE` | `/reading-history`          | Clear all reading history for the authenticated user.                                       |
| `DELETE` | `/reading-history/:paperId` | Remove a single paper from reading history.                                                 |

### Reading Lists: `/reading-lists`

| Method   | Endpoint               | Description                                                                               |
| -------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `POST`   | `/`                    | Create a reading list (title, description, visibility).                                   |
| `GET`    | `/`                    | Get reading lists. Filter by `ownerId`, or pass `saved=true` for saved-from-others lists. |
| `GET`    | `/:id`                 | Get a single reading list with all its papers.                                            |
| `PATCH`  | `/:id`                 | Update title, description, or visibility (owner only).                                    |
| `DELETE` | `/:id`                 | Delete a reading list and all its paper associations (owner only).                        |
| `POST`   | `/:id/papers`          | Add a paper to a reading list.                                                            |
| `DELETE` | `/:id/papers/:paperId` | Remove a paper from a reading list.                                                       |
| `POST`   | `/:id/save`            | Save another user's public list to your library.                                          |
| `DELETE` | `/:id/save`            | Unsave a previously saved reading list.                                                   |

### Discussions: `/discussions`

| Method   | Endpoint        | Description                                                                    |
| -------- | --------------- | ------------------------------------------------------------------------------ |
| `POST`   | `/`             | Create a discussion with optional topic IDs and linked paper IDs.              |
| `GET`    | `/`             | List discussions. Filter by `topicId`, `authorId`; sort by `new` or `top`.     |
| `GET`    | `/:id`          | Get a single discussion with full details.                                     |
| `DELETE` | `/:id`          | Delete a discussion (author only).                                             |
| `POST`   | `/:id/vote`     | Cast or change a vote (`UP`/`DOWN`). Updates denormalized counters atomically. |
| `DELETE` | `/:id/vote`     | Remove existing vote. Updates denormalized counters atomically.                |
| `POST`   | `/:id/comments` | Post a top-level comment or a threaded reply (via `parentId`).                 |
| `GET`    | `/:id/comments` | Get all comments for a discussion in a nested thread structure.                |

### Comments: `/comments`

| Method   | Endpoint    | Description                                                                    |
| -------- | ----------- | ------------------------------------------------------------------------------ |
| `POST`   | `/:id/vote` | Cast or change a vote on a comment. Switching vote type is handled atomically. |
| `DELETE` | `/:id/vote` | Remove an existing comment vote.                                               |

### Feed: `/feed`

| Method | Endpoint | Description                                                                                                                                                                           |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/`      | Get the authenticated user's personalized activity feed, aggregating recent events from followed researchers (new discussions, reading lists, saved papers, and comments). Paginated. |

### Search: `/search`

| Method   | Endpoint         | Description                                                                          |
| -------- | ---------------- | ------------------------------------------------------------------------------------ |
| `GET`    | `/global`        | Aggregated search across discussions, reading lists, and researchers simultaneously. |
| `GET`    | `/discussions`   | Paginated discussion search (title + content, case-insensitive).                     |
| `GET`    | `/reading-lists` | Paginated reading list search (title, public or user-accessible only).               |
| `GET`    | `/researchers`   | Fuzzy search across username, full name, and bio.                                    |
| `GET`    | `/history`       | Get the authenticated user's recent search queries (configurable limit).             |
| `DELETE` | `/history`       | Clear all search history.                                                            |
| `DELETE` | `/history/:id`   | Delete a single search history entry.                                                |

### Chatbot: `/chatbot`

| Method   | Endpoint                                     | Description                                                              |
| -------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `POST`   | `/sessions`                                  | Create a persistent chat session.                                        |
| `POST`   | `/sessions/temporary`                        | Create a temporary session with a 24h sliding TTL.                       |
| `GET`    | `/sessions`                                  | List all persistent sessions for the authenticated user (paginated).     |
| `GET`    | `/sessions/:id`                              | Get a single session.                                                    |
| `DELETE` | `/sessions/:id`                              | Delete a session and all its messages.                                   |
| `GET`    | `/sessions/:id/messages`                     | Get paginated message history including attachments and feedback.        |
| `POST`   | `/sessions/:id/messages/stream`              | Send a text message; AI response streamed as SSE.                        |
| `POST`   | `/sessions/:id/messages/stream/image`        | Upload and send an image message; SSE-streamed response.                 |
| `POST`   | `/sessions/:id/messages/stream/audio`        | Upload and send a voice message; SSE response includes transcription.    |
| `POST`   | `/files`                                     | Pre-upload a file to the staging table before attaching it to a message. |
| `POST`   | `/sessions/:id/messages/:messageId/feedback` | Submit or toggle thumbs-up/down feedback on an AI response.              |

### User Settings: `/users/settings`

All endpoints require Bearer authentication. Settings are auto-created with schema defaults on the first upsert.

**Appearance**

| Method  | Endpoint              | Description                                                                          |
| ------- | --------------------- | ------------------------------------------------------------------------------------ |
| `GET`   | `/appearance`         | Get current appearance and reading preferences (color mode, font, highlight colors). |
| `PATCH` | `/appearance/display` | Update color mode (`LIGHT`/`DARK`/`SYSTEM`) and font size.                           |
| `PATCH` | `/appearance/reading` | Update default reading list visibility and annotation highlight color palette.       |

**Account**

| Method   | Endpoint                        | Description                                                                              |
| -------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| `PATCH`  | `/account/username`             | Change username (uniqueness-checked; current session preserved).                         |
| `POST`   | `/account/email/request-change` | Initiate email change; sends OTP to the new address.                                     |
| `POST`   | `/account/email/confirm-change` | Confirm email change with OTP (atomic DB write).                                         |
| `PATCH`  | `/account/password`             | Update password; all other sessions revoked on success; FCM tokens cleared.              |
| `DELETE` | `/account/linked/google`        | Unlink Google OAuth (requires a password to be set first to prevent lockout).            |
| `GET`    | `/account/sessions`             | List all active sessions with a `isCurrent` marker.                                      |
| `DELETE` | `/account/sessions`             | Revoke all sessions except the current one (logout all other devices).                   |
| `POST`   | `/account/deactivate`           | Deactivate account (password required); clears FCM tokens and all sessions.              |
| `POST`   | `/account/delete`               | Schedule permanent deletion in 30 days; sends a deletion-warning email; clears sessions. |

**Feed and AI**

| Method  | Endpoint          | Description                                                                           |
| ------- | ----------------- | ------------------------------------------------------------------------------------- |
| `GET`   | `/feed`           | Get feed and AI preferences (`showRecommendedPapers`, `hideAlreadyReadPapers`, etc.). |
| `PATCH` | `/feed`           | Update feed and AI preferences.                                                       |
| `GET`   | `/feed/interests` | Get research interests used for AI-powered paper recommendations.                     |
| `PUT`   | `/feed/interests` | Replace research interests (full replace, not partial update).                        |

**Notification Preferences**

| Method  | Endpoint         | Description                                                                                            |
| ------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `GET`   | `/notifications` | Get all notification preference toggles grouped into research, social, and system sections.            |
| `PATCH` | `/notifications` | Update one or more toggles (partial update); `securityAlerts` is always `true` and cannot be disabled. |

**Privacy and Data Export**

| Method  | Endpoint                        | Description                                                                               |
| ------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| `GET`   | `/privacy`                      | Get privacy and visibility settings.                                                      |
| `PATCH` | `/privacy`                      | Update privacy settings (enabling `isPrivateAccount` auto-disables `allowProfileSearch`). |
| `POST`  | `/privacy/export/data`          | Initiate full account data export; user notified by email when ready (HTTP 202 accepted). |
| `GET`   | `/privacy/export/reading-lists` | Download all reading lists as a JSON file attachment.                                     |
| `GET`   | `/privacy/export/annotations`   | Download all highlights and notes as a JSON file attachment.                              |

### Notifications: `/notifications` and `/users/notifications/tokens`

**Notification Center**

| Method   | Endpoint                      | Description                                               |
| -------- | ----------------------------- | --------------------------------------------------------- |
| `GET`    | `/notifications`              | Paginated list of the authenticated user's notifications. |
| `GET`    | `/notifications/unread-count` | Count of unread notifications.                            |
| `PATCH`  | `/notifications/read`         | Mark all notifications as read.                           |
| `PATCH`  | `/notifications/:id/read`     | Mark a single notification as read.                       |
| `DELETE` | `/notifications/:id`          | Delete a single notification.                             |
| `DELETE` | `/notifications`              | Delete all notifications.                                 |

**Device Token Management**

| Method   | Endpoint                      | Description                                                           |
| -------- | ----------------------------- | --------------------------------------------------------------------- |
| `POST`   | `/users/notifications/tokens` | Register or refresh a device FCM token (upsert on `(userId, token)`). |
| `GET`    | `/users/notifications/tokens` | List all registered FCM device tokens for the authenticated user.     |
| `DELETE` | `/users/notifications/tokens` | Remove a specific device token by value.                              |

---

## Authentication and Security

**Token Strategy**

- **Access token**: Short-lived JWT (default 15 minutes) sent as `Authorization: Bearer <token>`.
- **Refresh token**: Long-lived JWT (default 7 days) stored in an `HttpOnly`, `Secure`, `SameSite=lax` cookie AND returned in the response body. Token rotation is enforced on every `/auth/refresh` call: the old token is deleted and a new pair is issued.
- **Reset token**: A short-lived JWT (10 minutes) signed with a separate `JWT_RESET_SECRET`, issued after OTP verification and consumed exactly once on password reset. All refresh tokens for the user are invalidated on password change.

**OTP Flow**

OTP codes are generated and stored scoped by `OtpPurpose` (`REGISTER`, `RESET_PASSWORD`, `EMAIL_CHANGE`) to prevent cross-purpose replay attacks. Pending OTPs are invalidated before issuing a new one, and rate limiting via `countRecentOtps` prevents OTP flooding.

**Google OAuth**

The backend receives a Google ID token from the client and verifies it server-side using `google-auth-library`. No OAuth redirect flows; this is a token-based, mobile-friendly integration. Existing accounts are matched by email; new accounts enter the `ONBOARDING` flow.

**Route Protection**

All routes are protected by a global `AuthGuard`. Endpoints opt out via the `@Public()` decorator. Role-based access uses the `@Roles(Role.ADMIN)` decorator enforced by a separate `RolesGuard`.

**Other Security Measures**

- Passwords hashed with bcrypt (cost factor 10)
- Anti-enumeration: `/forget-password` always returns HTTP 200 regardless of whether the email exists
- HTML sanitization via `sanitize-html` on user-supplied rich content
- Field whitelisting and blacklisting on sparse profile queries prevents accidental sensitive-field exposure
- Slow-query detection: Prisma queries over 200ms are automatically logged as warnings

---

## AI Chatbot

The chatbot proxies requests to an **external AI microservice** (`EXTERNAL_API_BASE_URL`) and streams the response back to the client using **Server-Sent Events (SSE)**.

**Streaming event types**

| `type` field    | Payload                 | Description                                                     |
| --------------- | ----------------------- | --------------------------------------------------------------- |
| `status`        | `content: string`       | Processing status update (e.g. "Thinking...")                   |
| `model_answer`  | `content: string`       | Incremental response delta from the model                       |
| `chat_title`    | `content: string`       | Suggested session title, auto-applied on the first message      |
| `transcription` | `transcription: string` | Audio transcription (voice messages only)                       |
| `end`           | (none)                  | Stream complete; assistant message is persisted to the database |
| `error`         | `content: string`       | Service-level error description                                 |

**Session types**

- **Persistent sessions**: Stored permanently. Title is auto-generated from the first message content or set manually via rename.
- **Temporary sessions**: Carry a 24h sliding TTL stored in `expiresAt`. Each new message extends expiry by another 24 hours. A scheduled job hard-deletes expired sessions along with all their messages and attachments.

**File handling**

Files are pre-uploaded to Cloudinary and a `ChatFile` staging record is created. When the message is sent, a `MessageAttachment` record is created and the staging `ChatFile` is cleaned up asynchronously. A separate scheduled job purges abandoned `ChatFile` records that were never attached to a message.

---

## Search System

Mirath implements two distinct and complementary search mechanisms.

**Cross-paper full-text search** uses PostgreSQL's `pg_trgm` extension. Queries run against the indexed `fullText` column using `ILIKE` for filtering and `SIMILARITY()` for relevance scoring. A single raw query with a `LEFT JOIN` on `SavedPaper` computes the `isSaved` flag per result in one round-trip, avoiding N+1 lookups entirely.

**In-paper word search** uses a recursive CTE to find every character offset of a query term inside a single paper's `fullText`. The base case locates the first match using `strpos`; the recursive case advances past each found position until no further matches exist. Results are returned as a zero-indexed integer array, which the client uses to highlight every occurrence in the rendered document.

**Global and scoped search** covers discussions (title + content), reading lists (title, filtered to public or user-owned), and researcher profiles (username, full name, bio). Every result set is annotated with the authenticated viewer's follow and save status, computed in-query to avoid extra round-trips. Search queries are persisted to `SearchHistory` in a non-blocking fire-and-forget write that logs a warning on failure without surfacing errors to the caller.

---

## Background Processes

Mirath uses `@nestjs/schedule` for cron-based maintenance tasks:

| Job                             | Description                                                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cleanExpiredOtps`              | Deletes `OtpVerification` records past their `expiresAt` timestamp.                                                                                                                               |
| `cleanExpiredRefreshTokens`     | Prunes expired `RefreshToken` rows.                                                                                                                                                               |
| `cleanExpiredTemporarySessions` | Removes `ChatSession` records with `isTemporary = true` past `expiresAt`, cascading to all messages and attachments; also calls the external AI service to clean up its in-memory thread state.   |
| `cleanAbandonedChatFiles`       | Removes `ChatFile` staging records that were never attached to a message.                                                                                                                         |
| `handleWeeklyDigest`            | Runs every Monday at 08:00. Finds papers published in the last 7 days, matches them to each user's interests, persists a `WEEKLY_DIGEST` notification record, and sends an FCM push notification. |
| `handleExpiredAccountDeletion`  | Runs every day at midnight. Permanently hard-deletes `User` records whose `scheduledDeletionAt` has passed (created when a user requests account deletion with a 30-day grace period).            |

A standalone **paper export script** (`prisma/scripts/export-papers.ts`) cursor-paginates all `Paper` rows and writes batched JSON files to disk (40 papers per file), useful for backups or seeding fresh environments.

---

## Push Notification System

Mirath delivers push notifications via **Firebase Cloud Messaging (FCM)** using the `firebase-admin` SDK, backed by a **BullMQ** async job queue for reliable, decoupled delivery.

**Architecture**

When a notifiable event occurs (a follow, a comment, a vote, etc.), the responsible service enqueues a job to the `notifications` BullMQ queue via `@nestjs/event-emitter`. The `NotificationProcessor` (`@Processor('notifications')`) picks up the job and:

1. Checks the recipient's notification preferences from `UserSettings`; if the relevant toggle is disabled, delivery is skipped.
2. Persists an in-app `Notification` record to the database using the BullMQ `jobId` as an idempotency key to prevent duplicates on retry.
3. Fetches the recipient's registered `DeviceFcmToken` records and calls `firebase-admin`'s `sendEachForMulticast` to deliver the push.
4. Automatically prunes any tokens that respond with `messaging/registration-token-not-registered`.

**Supported notification event types**

| Event                | Trigger                                           | Preference Flag             |
| -------------------- | ------------------------------------------------- | --------------------------- |
| `FOLLOW`             | A user starts following another                   | `notifyNewFollowers`        |
| `READING_LIST_SAVED` | A user saves another's public reading list        | `notifyReadingListActivity` |
| `COMMENT`            | A comment is posted on the user's discussion      | `notifyDiscussionReplies`   |
| `REPLY`              | A reply is posted on the user's comment           | `notifyDiscussionReplies`   |
| `MENTION`            | A user is `@mentioned` in a comment               | `notifyCommentMentions`     |
| `VOTE_DISCUSSION`    | An upvote is cast on the user's discussion        | `notifyVotesOnContent`      |
| `VOTE_COMMENT`       | An upvote is cast on the user's comment           | `notifyVotesOnContent`      |
| `WEEKLY_DIGEST`      | Scheduled cron job; new papers matching interests | `notifyNewPapersInField`    |

**Device token management**

Clients register their FCM token via `POST /users/notifications/tokens`. Tokens are stored in `DeviceFcmToken` with a unique constraint on `(userId, token)` preventing duplicates. On each failed FCM delivery, stale tokens are cleaned up inline without a separate cron job.

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL 15 with the `pg_trgm` extension available

### Environment Variables

Copy the block below into a `.env` file at the project root and fill in your values before starting.

```dotenv
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database
POSTGRES_DB=mirath
POSTGRES_USER=mirath_user
POSTGRES_PASSWORD=mirath_pass
DATABASE_URL=postgres://mirath_user:mirath_pass@localhost:5432/mirath

# JWT
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_RESET_SECRET=<strong-random-secret>
JWT_ACCESS_EXPIRATION_MINUTES=15
JWT_REFRESH_EXPIRATION_DAYS=7
JWT_RESET_EXPIRATION_MINUTES=10
OTP_EXPIRATION_MINUTES=10

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# SMTP (Mailtrap recommended for development)
EMAIL_FROM=Mirath <noreply@mirath.app>
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=<mailtrap-user>
SMTP_PASS=<mailtrap-pass>

# Frontend (used in email template links and CORS)
FRONTEND_URL=http://localhost:3000

# External AI Service
EXTERNAL_API_BASE_URL=https://<your-ai-service-url>

# Seeder
SEED_PASSWORD=StrongP@ssw0rd!
```

### Running the Project

```bash
# Clone the repository
git clone https://github.com/your-org/mirath.git
cd mirath

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Apply migrations (ensure PostgreSQL is running)
npm run db:migrate

# Seed the database
npm run db:seed

# Start with hot-reload
npm run start:dev
```

The API will be available at `http://localhost:3000` and the interactive API docs at `http://localhost:3000/reference`.

---

## Database Management

| Command                   | Description                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| `npm run db:migrate`      | Create and apply a new migration (`prisma migrate dev`)                |
| `npm run db:seed`         | Run the full seeder pipeline                                           |
| `npm run db:reset`        | Drop all tables, re-apply migrations, re-seed (`prisma migrate reset`) |
| `npm run db:studio`       | Open Prisma Studio at `http://localhost:5555`                          |
| `npm run prisma:generate` | Regenerate the Prisma client after any schema changes                  |

**Seeder pipeline** (dependency-safe execution order):

1. Interests and Fields of Study (static taxonomy data)
2. Papers (loaded from JSON files in `prisma/seeds/data/papers/`)
3. Users (1 admin + 19 randomized researchers, all sharing `SEED_PASSWORD`)
4. User relations (interests, fields of study, follow graph, search history)
5. Reading lists (per-user lists with paper assignments; cross-user saves)
6. Discussions (50 threads with votes, interest topics, and linked papers)
7. Comments (threaded comments with votes, linked to each discussion)

---

## API Documentation

Mirath ships with interactive API documentation built from inline Swagger/OpenAPI decorators, rendered via the **Scalar** UI. Every endpoint, request body, query parameter, and response schema is documented with examples.

```
http://localhost:3000/reference
```

The raw OpenAPI JSON spec is available at `/reference`.

---

## Project Structure

```
mirath/
├── logs/
├── prisma/
│   ├── migrations/            # Sequential SQL migration files
│   ├── scripts/               # Utility scripts (e.g. paper export)
│   ├── seeds/
│   ├── prisma-client.ts
│   ├── schema.prisma
│   └── seed.ts                # Main seeder orchestrator
├── src/
│   ├── common/
│   │   ├── decorators/        # @Public(), @Roles(), @CurrentUser(), @Match()
│   │   ├── dto/               # Shared DTOs: PaginationDto, IdDto, VoteTypeDto
│   │   ├── interceptors/      # Request/response transformation and logging
│   │   ├── pipes/             # File validation pipes (type, size)
│   │   ├── types/             # HttpResponse<T> generic envelope
│   │   └── utils/             # User field exclusion, misc helpers
│   ├── config/
│   │   ├── configuration.ts   # Typed env config factory
│   │   └── logger.config.ts   # Winston instance + daily rotation
│   ├── modules/
│   │   ├── auth/
│   │   ├── chatbot/           # Sessions, SSE streaming, file staging, feedback
│   │   ├── cloudinary/        # Upload/delete service and provider
│   │   ├── comments/          # Threaded comments and voting
│   │   ├── discussions/       # Discussion threads and voting
│   │   ├── feed/              # Personalized activity feed and timeline aggregation
│   │   ├── health/            # Health checks and service readiness endpoints
│   │   ├── interests/         # Interest taxonomy + user interests
│   │   ├── library/           # Saved papers, reading history, stats
│   │   ├── mail/              # Email service + Handlebars templates
│   │   ├── notifications/     # FCM push, BullMQ processor, in-app notification center
│   │   ├── paper-annotations/ # XPath highlights, AI agent endpoints
│   │   ├── papers/            # Catalog, search, save/unsave, in-paper search
│   │   ├── prisma/            # Global PrismaService (pooled, event-logged)
│   │   ├── reading-lists/     # List CRUD, paper management, save/unsave
│   │   ├── search/            # Global + scoped search, history management
│   │   ├── user-settings/     # Appearance, account, feed, notifications, privacy settings
│   │   └── users/             # Profiles, follow graph, onboarding, sparse select
│   ├── app.module.ts          # Root module composition
│   └── main.ts                # Bootstrap, global middleware, Swagger setup
├── nest-cli.json
├── package.json
├── prisma.config.ts
├── tsconfig.build.json
└── tsconfig.json
```

---

## Scripts Reference

| Script                    | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `npm run start:dev`       | Start with hot-reload (`NODE_ENV=development`)    |
| `npm run start:prod`      | Start compiled production build from `dist/`      |
| `npm run build`           | Compile TypeScript to `dist/`                     |
| `npm run prisma:generate` | Regenerate Prisma client after schema changes     |
| `npm run db:migrate`      | Apply pending migrations (`prisma migrate dev`)   |
| `npm run db:seed`         | Run the full seed pipeline                        |
| `npm run db:reset`        | Full schema reset + re-apply migrations + re-seed |
| `npm run db:studio`       | Open Prisma Studio at `http://localhost:5555`     |
