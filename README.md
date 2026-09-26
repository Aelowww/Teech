# Teech

## Overview

This project provides a centralized platform for students and faculty members to organize consultation appointments. Students can view faculty availability and request a consultation, while faculty members can manage their schedules and respond to requests.

Teech is designed to reduce scheduling conflicts, missed consultations, and scattered communication between students and faculty.

## Tech Stack

- Next.js
- React
- TypeScript
- CSS / CSS Modules
- Supabase
- PostgreSQL
- Supabase Authentication

## Features

- Student, faculty, and administrator accounts
- Faculty profile and availability management
- Consultation appointment requests
- Appointment approval, rejection, and cancellation
- Upcoming appointment and consultation history views
- System record and account management

## Project Structure

```text
TEECH/
	app/
	components/
	lib/
	public/
```

## Planned System Architecture

The planned backend connects the Next.js application to Supabase for authentication and PostgreSQL data. The application screens are currently prototypes; database tables, row-level security policies, and user flows are not connected yet.

## Supabase Setup

Create a Supabase project, then copy `.env.example` to `.env.local` and replace the placeholders with the project URL and anon key from the Supabase dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Setup

Install the locked dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

The application runs on `http://localhost:3000`.

## Project Status

Teech is currently under development. Supabase browser and server clients are set up, but the database schema, row-level security policies, and application authentication and data flows still need to be implemented. Supabase credentials are not included; each developer should create `.env.local` from `.env.example` and use the team's Supabase project values.
