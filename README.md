# Teech

Student and faculty consultation booking web app. *Teacher within your reach.*

Live site: https://teech-app.vercel.app

## Overview

We built Teech because booking a consultation with a teacher at our school is honestly a hassle. You message them, wait, they reply late, the time doesn't work anymore, and you start over. Teech puts everything in one place: faculty post the dates and rooms they're free, students pick a slot and send a request, and faculty just confirm or decline. It has a mobile layout for phones and a full desktop layout for computers, both on the same URLs.

## Tech Stack

- Next.js
- React
- TypeScript
- CSS Modules
- Supabase (Postgres, Auth, Storage, Realtime)
- Google Gemini (help chat fallback)
- Vercel

## Features

- Students and faculty sign in with email; students confirm their email with a 6-digit code when signing up
- Students sign up with just a name, email, and password, then submit their Student ID, department, and ID photo from inside the app; booking unlocks once an admin approves it
- Admin console at `/admin` with a live dashboard and separate Students and Faculty verification queues
- Faculty upload a photo of their Faculty ID when signing up and can't sign in until an admin approves it; they get an email with the decision
- Admin portal at `/admin`, protected by password plus authenticator-app two-step verification
- Book a consultation by picking a faculty member, an open date, and a time slot
- Faculty publish their available dates, time ranges, and meeting rooms
- Faculty confirm, decline, or cancel requests, and students can cancel their own
- Request tracking by status: pending, confirmed, and closed
- In-app notifications whenever a request changes
- Daily login streaks, points, a points shop, and collectible badges
- Profile photo, badge showcase, and account deletion
- Password reset by email, with security questions as a fallback for students
- Reminder for students who haven't set up account recovery yet
- Rotating study tips and a built-in help chat
- Separate mobile and desktop layouts, picked automatically for each device
- Animated loading screens and page skeletons while pages load

## Local Setup

```bash
npm ci
```

Copy `.env.example` to `.env.local` and fill in the Supabase project URL, the publishable key, and a Gemini API key (ask us, they're not in the repo):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
GEMINI_API_KEY=...
```

```bash
npm run dev
```

Open `http://localhost:3000`.

### Admin account

1. Create a normal faculty account at `/faculty/create-account` with the admin's email (any image works for the ID photo) and confirm it.
2. In the Supabase SQL Editor, run `select public.promote_to_admin('admin@school.edu');`.
3. Sign in at `/admin/sign-in` and scan the QR code with an authenticator app.

In Supabase Auth settings, turn on **Confirm email**, set up custom SMTP, and add `<site>/auth/confirm` to the redirect URLs.

Verification decision emails are sent over SMTP (a Gmail app password works). Set `SMTP_USER`, `SMTP_PASS`, and `NEXT_PUBLIC_SITE_URL` (plus `SMTP_HOST`/`SMTP_PORT` if not Gmail) in `.env.local` and in Vercel. Without them, decisions still save and show up as in-app notifications, but no email goes out. Email templates for Supabase Auth live in `supabase/templates/`.

To share a demo with groupmates' phones, run `npm run tunnel` in a second terminal and send them the ngrok link.

## Project Structure

- `app/mobile/` contains the mobile pages and their `_components`
- `app/desktop/` contains the desktop pages and their `_components`
- `app/auth/callback/` finishes email sign-in links like faculty password resets
- `app/auth/confirm/` finishes sign-up email confirmation links
- `app/admin/` is the admin verification portal (served the same on every device)
- `app/api/support/` powers the help chat's Gemini fallback
- `proxy.ts` protects signed-in pages and serves the mobile or desktop layout for each device
- `lib/` holds the Supabase clients and small shared helpers
- `supabase/migrations/` stores every database change, named by date (run them oldest first on a fresh Supabase project)
- `public/` stores the logo and images

## Purpose

We built Teech as a school project to make student and faculty consultations easier to book, track, and manage, without the back-and-forth messaging.
