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

- Book a consultation by picking a faculty member, an open date, and a time slot
- Faculty publish their available dates, time ranges, and meeting rooms
- Faculty confirm, decline, or cancel requests, and students can cancel their own
- Request tracking by status: pending, confirmed, and closed
- In-app notifications whenever a request changes
- Daily login streaks, points, a points shop, and collectible badges
- Profile photo, badge showcase, and account deletion
- Password reset with security questions for students and email for faculty
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

To share a demo with groupmates' phones, run `npm run tunnel` in a second terminal and send them the ngrok link.

## Project Structure

- `app/mobile/` contains the mobile pages and their `_components`
- `app/desktop/` contains the desktop pages and their `_components`
- `app/auth/callback/` finishes email sign-in links like faculty password resets
- `app/api/support/` powers the help chat's Gemini fallback
- `proxy.ts` protects signed-in pages and serves the mobile or desktop layout for each device
- `lib/` holds the Supabase clients and small shared helpers
- `supabase/migrations/` stores every database change, named by date (run them oldest first on a fresh Supabase project)
- `public/` stores the logo and images

## Purpose

We built Teech as a school project to make student and faculty consultations easier to book, track, and manage, without the back-and-forth messaging.
