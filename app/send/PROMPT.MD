Sep 13 2026 8am

wemail/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── google/
│   │   │   │   └── route.ts
│   │   │   ├── google/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts
│   │   │   └── me/
│   │   │       └── route.ts
│   │   │
│   │   ├── gmail/
│   │   │   └── messages/
│   │   │       └── route.ts       ← NEXT
│   │   │
│   │   ├── send-email/
│   │   │   └── route.ts
│   │   │
│   │   └── test-db/
│   │       └── route.ts
│   │
│   ├── send/
│   │   └── page.tsx
│   │
│   └── ...other Next.js files
│
├── components/
│   └── RichTextEditor.tsx
│
├── lib/
│   ├── gmail.ts
│   ├── prisma.ts
│   └── session.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── dev.db
│   └── migrations/
│       └── ...init migration
│
├── .env.local
├── prisma.config.ts
├── package.json
└── ...

Current Prisma schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())

  emailConnections EmailConnection[]
}

model EmailConnection {
  id           String   @id @default(cuid())
  userId       String
  provider     String
  email        String
  refreshToken String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
}

What is already working
Google authentication
Google OAuth is working with:

https://www.googleapis.com/auth/gmail.send
openid
email

The Google callback:

Gets the OAuth code.
Gets the Google tokens.
Gets the Google account email.
Creates/updates the Prisma User.
Creates/updates the Prisma EmailConnection.
Calls setCurrentUserId(user.id).
Session
lib/session.ts currently contains:

import { cookies } from "next/headers";

const SESSION_COOKIE = "wemail_user_id";

export async function getCurrentUserId() {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

export async function setCurrentUserId(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearCurrentUserId() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}

/api/auth/me successfully returns:

{
  "authenticated": true,
  "user": {
    "id": "...",
    "email": "...",
    "name": null,
    "emailConnections": [
      {
        "id": "...",
        "provider": "google",
        "email": "..."
      }
    ]
  }
}

Gmail sending
Sending email through Gmail is working.

The backend now gets the authenticated user using:

const userId = await getCurrentUserId();

Then gets their Google connection from Prisma:

const connection = await prisma.emailConnection.findUnique({
  where: {
    userId_provider: {
      userId,
      provider: "google",
    },
  },
});

Then it uses:

connection.refreshToken
connection.email

instead of trusting a from address supplied by the browser.

A test email has successfully been sent.

Compose page
/send works with:

Recipient
Subject
Rich text body
Attachments
Loading state
Sending state
Logged-in user's email displayed
/api/auth/me used to determine the current user
Database
Prisma 7.10.0 is currently being used.

Important: this project originally had Prisma 8 RC installed, but we switched back to Prisma 7 because of compatibility issues with the CLI/config.

Current successful commands included:

npx prisma migrate dev --name init

and:

npx prisma generate

SQLite is currently being used for development.

Immediate next step
We were about to build the Inbox.

The next file should be:

app/api/gmail/messages/route.ts

Before implementing it, inspect the existing:

lib/gmail.ts

and extend it rather than breaking the existing sendGmail() implementation.

The Inbox API should:

Authenticate the current Wemail user.
Get userId using getCurrentUserId().
Find their Google EmailConnection.
Create an OAuth client using the stored refresh token.
Fetch Gmail messages.
Return useful message metadata.
Eventually support pagination.
Then create:

app/inbox/page.tsx

to display the messages.

Next development roadmap
Phase 1 — Core email client
Build:

Inbox
Sent
Email detail
Reply
Reply all
Forward
Compose
Drafts
Attachments
Search

The basic UI should eventually look conceptually like:

┌────────────────────────────────────────────────────────────┐
│ WEMAIL                                      Account ▼       │
├───────────────┬────────────────────────────────────────────┤
│               │                                            │
│ Inbox         │  Inbox                                     │
│ Sent          │                                            │
│ Drafts        │  ┌──────────────────────────────────────┐  │
│ Starred       │  │ John       Meeting tomorrow     9:42 │  │
│ Trash         │  │ Sarah      Project update        8:31 │  │
│               │  │ Alex       Invoice                 7:15 │  │
│ + Compose     │  │ ...                                  │  │
│               │  └──────────────────────────────────────┘  │
└───────────────┴────────────────────────────────────────────┘

Phase 2 — Gmail functionality
Add Gmail API functionality for:

Inbox
Sent
Drafts
Trash
Starred
Labels
Read/unread
Star/unstar
Archive
Delete
Mark read/unread
Move between labels
Search
Pagination
Phase 3 — Compose
Improve the existing composer with:

CC
BCC
Multiple recipients
Reply
Reply all
Forward
Draft autosave
Attachments
Remove attachments
HTML formatting
Links
Images
Signature
Phase 4 — Accounts
Build account management:

Settings
├── Profile
├── Connected accounts
│   └── Google
├── Connect another account
├── Disconnect account
└── Sign out

Eventually support additional providers:

Google
Microsoft
Yahoo
Custom IMAP/SMTP

Phase 5 — Security
Before production:

Replace the simple user-ID cookie with a proper session mechanism.
Encrypt OAuth refresh tokens at rest.
Add secure cookie configuration.
Add CSRF protection where appropriate.
Add rate limiting.
Validate email addresses server-side.
Restrict attachment size.
Restrict dangerous attachment types.
Add authentication checks to every private API route.
Never trust user identity or from values supplied by the client.
Add proper logout.
Handle revoked Google OAuth tokens.
Handle expired/disconnected accounts.
Phase 6 — Production infrastructure
Move away from development SQLite when appropriate.

Potential production stack:

Next.js
   │
   ├── PostgreSQL
   │
   ├── Google Gmail API
   │
   ├── Object storage for attachments if needed
   │
   └── Secure session/auth infrastructure

Ultimate goal
The ultimate goal is to turn Wemail into a full web-based email client, not just a Gmail sending form.

The user should be able to:

Sign in
   ↓
Connect email account
   ↓
See inbox
   ↓
Open messages
   ↓
Reply / Reply All / Forward
   ↓
Compose new emails
   ↓
Attach files
   ↓
Save drafts
   ↓
Search mail
   ↓
Manage messages
   ↓
Manage connected accounts

while Wemail handles the provider-specific Gmail API work behind the scenes.

The architecture should remain provider-independent, so Gmail is the first provider but the application can eventually support Microsoft/Outlook and others without rewriting the entire UI.

Copy/paste continuation prompt
Save this entire prompt:

I am continuing development of my Wemail project.

Wemail is a Next.js email client that is being built from scratch.

CURRENT STACK:
- Next.js 16.3.5
- React 19
- TypeScript 5.9
- Prisma 7.10.0
- @prisma/client 7.10.0
- SQLite for development
- googleapis
- Nodemailer is installed but Gmail sending now uses the Gmail API
- Tiptap for the rich text editor
- Tailwind CSS

IMPORTANT PRISMA NOTE:
We previously had Prisma 8 RC installed, but switched back to Prisma 7.10.0 because Prisma 8 RC had incompatible CLI/config behavior for this project.
Do NOT tell me to upgrade Prisma unless there is a specific reason.

CURRENT PROJECT STRUCTURE:

wemail/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── google/
│   │   │   │   └── route.ts
│   │   │   ├── google/callback/
│   │   │   │   └── route.ts
│   │   │   └── me/
│   │   │       └── route.ts
│   │   ├── gmail/
│   │   │   └── messages/
│   │   │       └── route.ts   ← THIS IS THE NEXT FILE TO BUILD
│   │   ├── send-email/
│   │   │   └── route.ts
│   │   └── test-db/
│   │       └── route.ts
│   ├── send/
│   │   └── page.tsx
│   └── ...
├── components/
│   └── RichTextEditor.tsx
├── lib/
│   ├── gmail.ts
│   ├── prisma.ts
│   └── session.ts
├── prisma/
│   ├── schema.prisma
│   ├── dev.db
│   └── migrations/
├── .env.local
├── prisma.config.ts
└── package.json

CURRENT PRISMA SCHEMA:

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())

  emailConnections EmailConnection[]
}

model EmailConnection {
  id           String   @id @default(cuid())
  userId       String
  provider     String
  email        String
  refreshToken String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
}

AUTHENTICATION:
Google OAuth is working.

Google scopes currently include:
- https://www.googleapis.com/auth/gmail.send
- openid
- email

Google callback:
- gets OAuth code
- gets tokens
- gets Google user info
- creates/updates User in Prisma
- creates/updates EmailConnection
- calls setCurrentUserId(user.id)

SESSION:
lib/session.ts currently contains:

import { cookies } from "next/headers";

const SESSION_COOKIE = "wemail_user_id";

export async function getCurrentUserId() {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

export async function setCurrentUserId(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearCurrentUserId() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}

DO NOT create a second auth/session system.
Use:
import { getCurrentUserId } from "@/lib/session";

The /api/auth/me route already works and returns authenticated=true with the user's Prisma record and EmailConnection.

GMAIL:
Gmail sending works successfully.

The secure send API:
- gets current user with getCurrentUserId()
- looks up EmailConnection using:
  userId_provider: {
    userId,
    provider: "google"
  }
- uses connection.refreshToken
- uses connection.email
- does NOT trust a from address supplied by the browser

The user has successfully sent test emails.

COMPOSE PAGE:
app/send/page.tsx works.
It has:
- To
- Subject
- Rich text body
- Attachments
- Sending state
- User loading state
- Gets user email from /api/auth/me
- Displays the connected email
- Sends form data to /api/send-email

IMPORTANT:
The backend is authoritative for the sending account.
Do not reintroduce hard-coded email addresses or google-token.json as the source of truth.

CURRENT NEXT STEP:
Build the Inbox.

First, inspect the existing lib/gmail.ts before changing anything.

Then create:
app/api/gmail/messages/route.ts

The Gmail messages API should:
1. Get current user with getCurrentUserId()
2. Return 401 if unauthenticated
3. Find the user's Google EmailConnection in Prisma
4. Use the stored refresh token to authenticate with Google
5. Fetch Gmail inbox messages
6. Return useful metadata such as:
   - id
   - threadId
   - sender
   - subject
   - date
   - snippet
   - unread state
7. Eventually support pagination

After the API works, create:
app/inbox/page.tsx

The Inbox UI should show a clean email list with:
- sender
- subject
- preview/snippet
- date
- unread styling
- loading state
- error state
- empty state

Do NOT implement everything at once.
Work incrementally and give me exact files/code to replace or create.
After each step, have me test it before moving on.

ULTIMATE GOAL:
Build Wemail into a full web-based email client.

Eventually support:
- Inbox
- Sent
- Drafts
- Starred
- Trash
- Labels
- Search
- Read/unread
- Archive
- Delete
- Reply
- Reply all
- Forward
- Compose
- CC/BCC
- Attachments
- Draft autosave
- Signatures
- Account settings
- Google account disconnect
- Multiple email providers eventually
- Microsoft/Outlook eventually
- Secure production authentication
- Encrypted OAuth refresh tokens
- Production database
- Rate limiting
- Secure attachment handling

ARCHITECTURE GOAL:
The UI should be provider-independent.

Conceptually:

User
 ↓
Session
 ↓
EmailConnection
 ↓
Provider adapter
 ↓
Gmail / Microsoft / other provider
 ↓
Inbox / Send / Reply / Search

The immediate task is Gmail Inbox.
Before writing the Inbox code, ask me to paste my current lib/gmail.ts so you can extend the existing working implementation without breaking email sending.

Current checkpoint: authentication, Prisma, sessions, Google connection, and secure email sending are all working. The next concrete task is Gmail Inbox API → Inbox UI.