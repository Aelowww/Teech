# Teech: Student–Faculty Consultation Booking System

*Teach within your reach.*

## About

We built Teech because booking a consultation with a teacher at our school is honestly a hassle. You message them, wait, they reply late, the time doesn't work anymore, and you start over. Teech puts everything in one place: teachers post the dates and rooms they're free, students pick a slot and send a request, and the teacher just confirms or declines.

## Features

For students:
- Book a consultation by picking a faculty member, a date, and a time
- Track requests (pending, confirmed, declined, cancelled) and cancel if plans change
- Reset a forgotten password with security questions (student accounts use a Student ID, not an email)

For faculty:
- Publish available dates, time ranges, and the meeting room
- Confirm, decline, or cancel consultation requests
- Reset a forgotten password through email

For everyone:
- In-app notifications whenever a request changes
- Daily login streaks, points, and badges (you can exchange points for streak freezes and collectible badges)
- Profile photo, badge showcase, and account deletion

## Tech Stack

- Next.js, React, and TypeScript
- CSS Modules
- Supabase (Postgres, Auth, Storage, Realtime)

## Project Structure

```text
app/
  mobile/     the mobile version (pages + _components)
  desktop/    the desktop version (in progress)
  auth/       shared auth callback
lib/          Supabase clients and small helpers
supabase/
  migrations/ database changes, numbered in the order we ran them
public/       logo and images
proxy.ts      sign-in protection and phone vs computer routing
```

Both versions use the same URLs. `proxy.ts` checks if you're on a phone or a computer and serves the right folder. Desktop pages only switch on once their path is added to `desktopPages` in `proxy.ts`, so anything not built yet falls back to mobile.

## Getting Started

1. Install everything:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env.local` and put in our Supabase project URL and publishable key (ask me for them, they're not in the repo):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```

3. Start it:

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000.

## Database Setup

If you're using a fresh Supabase project, open the SQL Editor and run every file in `supabase/migrations/` in order, oldest date first (the numbers at the start of each name are dates, so sorting by name works). Our shared project already has all of them.

## Sharing a Demo

We use ngrok so groupmates can try it on their phones. With the dev server running, open a second terminal:

```bash
npm run tunnel
```

Then share the https link it gives you. The first time, you need to connect ngrok to your account:

```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

## Project Status

The mobile version works end to end: accounts, booking, requests, notifications, streaks, points, and badges. The desktop version is being built in `app/desktop/` on the `desktop` branch.
