# DoubtNest

DoubtNest is a college-focused academic discussion platform where students can
ask questions, share answers, and learn from peers and faculty. It combines a
searchable doubt feed with community features, role-based moderation, and an
optional Gemini-powered study assistant.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Supabase setup](#supabase-setup)
- [Accounts and roles](#accounts-and-roles)
- [Run, check, and build](#run-check-and-build)
- [Project structure](#project-structure)
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)

## Features

- **Academic doubt feed:** create questions with a subject, department,
  semester, category, and tags. Browse, search, filter, and sort doubts by
  newest, votes, or unanswered status.
- **Discussion and answers:** answer questions, comment on answers, upvote,
  vote on answer correctness, and mark a best answer where permitted.
- **Privacy controls:** post doubts or answers anonymously. Community views
  hide anonymous authors from other users; administrators can moderate content.
- **Personal account tools:** college-email registration, email confirmation,
  sign-in, password reset, profile/avatar editing, saved doubts, and a personal
  doubt view.
- **Community reputation:** reputation points, contributor leaderboard, and
  profile badges/verification indicators.
- **Notifications:** in-app alerts for relevant answer, comment, and moderation
  activity.
- **Moderation:** report doubts or answers and review reports in the admin
  dashboard.
- **Staff access requests:** faculty and administrator sign-ups start as
  pending requests; an existing administrator can review and approve them.
- **Nest AI:** ask the study assistant questions about the feed or general
  study topics. When Gemini is unavailable, the chat reports the service error
  rather than presenting an AI response as successful.
- **Responsive interface:** dark-mode styling, accessible controls, and
  layouts designed for desktop and mobile screens.

## Technology

- React 19 and TypeScript
- Vite 6 and Tailwind CSS 4
- Supabase Auth, PostgreSQL, Row Level Security (RLS), SQL views, and database
  functions
- Google Gemini API through the Nest AI endpoint
- Lucide icons, Motion, and Recharts

## Getting started

### Prerequisites

- Node.js with npm
- A Supabase project
- A Gemini API key if you want to use Nest AI

### Install and start

```powershell
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local` with the required settings described below, then start the
development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Vite server listens on
port `3000` and binds to `0.0.0.0` so it can be reached from the local network.

> The app expects the Supabase database migration to be installed. Without a
> working Supabase URL, key, and schema, the app cannot load community data.

## Configuration

The `.env.example` file lists the environment variables and contains placeholders
only. Create a root-level `.env.local` for local values. Environment files are
ignored by Git except for `.env.example`; do not commit real credentials.

### Supabase (required)

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Use the project's publishable key or legacy anon key. Never put a Supabase
`service_role` key or another secret in a `VITE_` variable: Vite exposes
`VITE_` values to browser code.

### Gemini (optional)

```env
GEMINI_API_KEY=your-gemini-api-key
```

Keep the Gemini key server-side without a `VITE_` prefix. The Nest AI endpoint
also accepts `VITE_GEMINI_API_KEY` for compatibility, but using a `VITE_` key
exposes it to the browser and is not recommended. The model can be overridden
with `GEMINI_MODEL`; the current default is `gemini-3.5-flash`.

### Gmail OAuth (optional endpoint configuration)

The Vite configuration includes Gmail OAuth settings for its development OTP
endpoint:

```env
GMAIL_CLIENT_ID=your-google-oauth-client-id
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_REFRESH_TOKEN=your-google-oauth-refresh-token
GMAIL_SENDER=your-authorized-sender@gmail.com
```

These are server-side secrets; never add a `VITE_` prefix. The current signup
form uses Supabase Auth to send, resend, and verify the signup email code. The
Gmail OTP endpoint is separate development middleware and is not the signup
form's verification flow.

Restart the development server after changing environment values.

## Supabase setup

### 1. Apply the database migration

In the Supabase Dashboard, open **SQL Editor** and run the complete migration:

[`supabase/migrations/20261001193000_doubtnest.sql`](./supabase/migrations/20261001193000_doubtnest.sql)

The migration defines the app's profiles, doubts, answers, votes, bookmarks,
comments, reports, and notifications; helper functions and triggers; community
views; and RLS policies. It should be run by a project owner with permission to
create and alter database objects. The browser-side publishable/anon key cannot
run privileged DDL.

If an older schema gives a permission error for the community data views, run
the complete repair script in the same project's SQL Editor:

[`supabase/fix_community_permissions.sql`](./supabase/fix_community_permissions.sql)

The repair script restores the intended view ownership and grants while keeping
the underlying tables private. Confirm that the verification query at the end
of that script reports all five community views with owner `postgres`.

### 2. Configure Supabase Auth

In **Authentication → Providers → Email**:

1. Enable email/password sign-up and email confirmation.
2. In **Authentication → Email Templates → Confirm signup**, include the OTP
   token, for example:

   ```html
   <h2>Confirm your DoubtNest account</h2>
   <p>Your verification code is: <strong>{{ .Token }}</strong></p>
   ```

3. Under **Authentication → URL Configuration → Redirect URLs**, allow the
   local URL `http://localhost:3000`. Add your deployed application URL before
   using password recovery or confirmation in production.

The registration flow checks for college email addresses ending in `.ac.in`.
Supabase email confirmation must be configured to deliver the code that users
enter in the app.

### 3. Bootstrap the first administrator

The first administrator must be promoted by the project owner after creating
and confirming that account. Replace the sample email with the confirmed
administrator's college email and run this in the SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where lower(email) = lower('your.name@college.ac.in')
);
```

Sign out and sign back in to refresh the account's permissions. Only grant
administrator access to trusted accounts.

## Accounts and roles

- **Student:** can ask and answer doubts and use the standard community tools.
- **Senior student:** a student account with the senior role for community
  identification.
- **Faculty:** requested during registration and kept as a student until an
  existing administrator approves the request.
- **Administrator:** requested during registration and kept as a student until
  approved by an existing administrator. Administrators can access moderation
  and staff approval tools.

The SQL trigger rejects new accounts that do not use a `.ac.in` email address.
Registration requires a password of at least eight characters and the profile
fields shown in the form. Existing browser-demo accounts and seed content are
not migrated into Supabase; users need to create new accounts and content.

## Run, check, and build

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000. |
| `npm run dev:clean` | Run the Vite process cleanup helper. |
| `npm run lint` | Run the TypeScript compiler without emitting files. |
| `npm run build` | Create the production frontend bundle in `dist/`. |
| `npm run preview` | Preview the built frontend with Vite. |
| `npm run test:gmail` | Check Gmail OAuth configuration using the current environment. |

`npm run clean` is also present in `package.json`; its current command uses
`rm -rf`, which is intended for a Unix-like shell. On Windows, remove generated
`dist` output using an appropriate PowerShell command if cleanup is needed.

## Project structure

```text
.
├── src/
│   ├── components/       # Feed, auth, discussion, profile, admin, and chat UI
│   ├── data/             # Local seed/demo data
│   ├── services/         # Supabase client and application data operations
│   ├── App.tsx           # Main application and feed state
│   ├── index.css         # Global styles
│   ├── main.tsx          # React entry point
│   └── types.ts          # Shared application types
├── supabase/
│   ├── migrations/       # Database schema, functions, views, and policies
│   └── fix_community_permissions.sql
├── scripts/              # Development cleanup and Gmail OAuth check
├── vite.config.ts        # Vite configuration and development API middleware
├── index.html
└── .env.example          # Safe environment-variable template
```

## Deployment notes

### Deploy to Vercel

The repository includes Vercel configuration for the Vite production build,
single-page application routes, and the serverless `/api/ai/chat` endpoint.

1. Import this Git repository in Vercel and keep the project root at the
   repository root. The checked-in `vercel.json` sets the build command to
   `npm run build` and the output directory to `dist`.
2. In **Project Settings → Environment Variables**, add these values for the
   environments where you plan to deploy:

   | Variable | Required | Notes |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | Yes | Supabase project URL. |
   | `VITE_SUPABASE_ANON_KEY` | Yes | Supabase publishable/anon key only; this is exposed to the browser. |
   | `GEMINI_API_KEY` | No | Server-side key for Nest AI. Do not use the `VITE_` prefix. |
   | `GEMINI_MODEL` | No | Optional Gemini model override. |

3. Deploy. Redeploy after changing environment variables.
4. In Supabase **Authentication → URL Configuration**, set the production site
   URL and add the deployed Vercel URL to the allowed redirect URLs. Confirm
   that the production database migration has been applied as described in
   [Supabase setup](#supabase-setup).
5. Test the app, sign-up/email confirmation, password recovery, and `/api/ai/chat`
   on the deployed URL.

The Gmail OTP endpoints in `vite.config.ts` are development middleware only
and are not deployed as Vercel functions. The current signup flow uses Supabase
Auth email confirmation instead, so Gmail OAuth variables are not needed for
this deployment. Do not expose service-role, Gemini, or Gmail OAuth secrets in
browser code.

## Troubleshooting

### The feed is empty or reports a database/network error

- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` point to the
  correct Supabase project.
- Confirm that the migration was run against that same project.
- If the error mentions permissions on community views, run
  `supabase/fix_community_permissions.sql` in the Supabase SQL Editor.
- Restart Vite after changing `.env.local`.

### Signup codes do not arrive

- Confirm that email/password sign-up and email confirmation are enabled in
  Supabase Auth.
- Confirm that the signup confirmation template contains `{{ .Token }}`.
- Check the Supabase Auth email delivery configuration and spam folder.

### Nest AI is unavailable

- Confirm that `GEMINI_API_KEY` is present in the server environment.
- Restart the development server after changing the key.
- In production, verify that a server-side `/api/ai/chat` endpoint is deployed;
  Vite's development middleware is not included in the static build.

## License

No license is currently declared in this repository. Ask the project owner
before reusing or redistributing the code.
