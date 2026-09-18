# Teech

Teech is a web-based student-faculty consultation scheduling system built to make appointment requests, faculty availability, and consultation records easier to manage in one place.

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

## System Architecture

![Teech system architecture](docs/architecture/Teech%20System%20Architecture.svg)

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application runs on `http://localhost:3000`.

## Project Status

Teech is currently under development.
