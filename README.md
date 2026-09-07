# Appointer

A small, production-ready appointment booking application built with Next.js, TypeScript, PostgreSQL, and Drizzle ORM.

**Live Demo:** https://appointly-ochre.vercel.app/

---

## Overview

Appointly is a focused appointment booking application with two roles:

- **Users** can browse available appointment slots, book appointments, view their appointment history, and cancel upcoming appointments.
- **Administrators** can create appointment slots that become available for users to book.

The project intentionally keeps the product scope small while focusing on the areas that matter most for a reliable booking system:

- Correctness
- Database consistency
- Authentication and authorization
- Server-side validation
- Concurrent booking protection
- Clear UX feedback
- Automated testing
- Production deployment

> **Product philosophy:** small scope, deep quality.

---

## Features

### Users

- Create an account
- Sign in and sign out
- View available appointment slots
- Book an appointment
- View upcoming appointments
- View past and cancelled appointments
- Cancel upcoming appointments
- Receive clear loading, success, and error feedback

### Administrators

- Sign in with administrator privileges
- Create future appointment slots
- Make newly-created slots available to users

### Reliability

- Database-level protection against double booking
- Server-side input validation
- Role-based authorization
- Appointment ownership checks
- Soft cancellation preserving appointment history
- Explicit API error responses
- Automated unit and integration tests

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | Next.js |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL |
| Database hosting | Neon |
| ORM | Drizzle ORM |
| Validation | Zod |
| Password hashing | bcrypt |
| Testing | Vitest |
| Deployment | Vercel |
| Package manager | pnpm |

---

## Architecture

The application uses a **modular monolith** architecture.

```text
                         Browser
                            |
                            v
                    ┌───────────────┐
                    │    Next.js    │
                    │               │
                    │ React UI      │
                    │ Route Handlers│
                    │ Auth          │
                    │ Validation    │
                    └───────┬───────┘
                            |
                            | DATABASE_URL
                            v
                    ┌───────────────┐
                    │     Neon      │
                    │  PostgreSQL   │
                    └───────────────┘

The frontend and backend are deployed together through Vercel.

There is intentionally no separate Express service, message queue, cache, or microservice layer. The application's scope does not justify that complexity.

---

## Project Structure

```text
app/
├── api/
│   ├── auth/
│   ├── appointments/
│   ├── health/
│   └── slots/
├── globals.css
├── layout.tsx
└── page.tsx

src/
├── db/
│   ├── client.ts
│   ├── migrations/
│   └── schema/
├── features/
│   ├── appointments/
│   ├── auth/
│   └── slots/
└── lib/
    ├── api.ts
    ├── auth/
    └── errors/

tests/
├── integration/
└── unit/

docs/
├── api.md
├── architecture.md
├── erd.md
└── ux.md
```

---

# Data Model

The application uses three primary domain entities.

### User

Stores authentication information and role.

```text
User
├── id
├── email
├── password_hash
├── role
├── created_at
└── updated_at
```

Roles:

```text
USER
ADMIN
```

### Appointment Slot

Represents a time period that can be booked.

```text
AppointmentSlot
├── id
├── start_time
├── end_time
├── created_by
└── created_at
```

### Appointment

Represents a user's booking.

```text
Appointment
├── id
├── slot_id
├── user_id
├── status
├── created_at
└── cancelled_at
```

Appointment status:

```text
BOOKED
CANCELLED
```

Cancellation is implemented as a state change rather than deleting the appointment. This preserves appointment history.

---

# Preventing Double Booking

Concurrent booking is one of the most important correctness requirements of the application.

The database contains a partial unique index:

```text
appointments_one_active_booking_per_slot
```

Only appointments with:

```text
status = BOOKED
```

participate in the constraint.

Conceptually:

```text
                    Appointment Slot
                           |
             ┌─────────────┴─────────────┐
             |                           |
        User A books                 User B books
             |                           |
             v                           v
        BOOKED row                  BOOKED row
             |                           |
             └─────────────┬─────────────┘
                           |
                           v
                  PostgreSQL constraint
                           |
                  only one succeeds
```

If a second booking reaches the database, PostgreSQL rejects it with a uniqueness violation.

The API converts that database error into:

```text
HTTP 409 Conflict
SLOT_ALREADY_BOOKED
```

This means the database—not the frontend—is the final authority for booking consistency.

---

# Authentication & Authorization

Authentication uses server-side sessions stored in PostgreSQL and an HTTP-only session cookie.

Authorization is enforced on the server.

### USER

Can:

* View available slots
* Book slots
* View their own appointments
* Cancel their own appointments

### ADMIN

Can additionally:

* Create appointment slots

A client cannot bypass these restrictions simply by calling the API directly.

---

# API

| Method | Endpoint                       | Purpose                         |
| ------ | ------------------------------ | ------------------------------- |
| POST   | `/api/auth/register`           | Register a user                 |
| POST   | `/api/auth/login`              | Sign in                         |
| POST   | `/api/auth/logout`             | Sign out                        |
| GET    | `/api/auth/me`                 | Get current user                |
| GET    | `/api/slots`                   | Get available slots             |
| POST   | `/api/slots`                   | Create a slot (ADMIN)           |
| GET    | `/api/appointments`            | Get current user's appointments |
| POST   | `/api/appointments`            | Book a slot                     |
| PATCH  | `/api/appointments/:id/cancel` | Cancel an appointment           |
| GET    | `/api/health`                  | Health check                    |

Detailed API documentation is available in:

```text
docs/api.md
```

---

# Validation

Input is validated on the server using Zod.

Examples include:

* Valid email format
* Password length
* UUID format
* Appointment slot time ordering
* Future slot requirements
* Appointment ownership
* Role authorization

The frontend provides usability validation, but the backend remains authoritative.

---

# UX

The UI is intentionally minimal and focused on the primary booking journey.

The application provides explicit states for:

* Initial loading
* Loading appointment data
* Empty available-slot state
* Empty appointment history
* Booking in progress
* Booking success
* Booking conflict
* Cancellation confirmation
* Cancellation in progress
* Cancellation success
* Authentication errors
* API errors

The interface is responsive across desktop and mobile layouts.

Detailed UX decisions are documented in:

```text
docs/ux.md
```

---

# Testing

The project includes automated tests covering business rules and database booking consistency.

Run all tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Run linting:

```bash
pnpm lint
```

Run TypeScript validation:

```bash
pnpm exec tsc --noEmit
```

Run the production build:

```bash
pnpm build
```

The integration suite verifies that the database prevents multiple active bookings for the same appointment slot.

---

# Local Development

## Requirements

* Node.js 22+
* pnpm
* PostgreSQL-compatible database

Neon can be used for local development.

## Installation

```bash
pnpm install
```

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
```

See `.env.example` for the required environment variables.

## Database Setup

Generate migrations:

```bash
pnpm db:generate
```

Apply migrations:

```bash
pnpm db:migrate
```

Seed development data:

```bash
pnpm db:seed
```

## Start Development Server

```bash
pnpm dev
```

Then open:

```text
http://localhost:3000
```

---

# Demo Account

The development seed creates an administrator account:

```text
Email: admin@example.com
Password: Admin123!
Role: ADMIN
```

This account is intended for local/demo evaluation.

Production credentials should be changed before exposing an application publicly.

---

# Deployment

The production application uses:

```text
Vercel
   |
   | DATABASE_URL
   v
Neon PostgreSQL
```

The Next.js application—including its API Route Handlers—is deployed to Vercel.

Required Vercel environment variable:

```text
DATABASE_URL
```

The database credentials are never committed to the repository.

---

# Production Verification

The deployed application has been verified through the primary production journey:

```text
Register / Login
       |
       v
View available slots
       |
       v
Book appointment
       |
       v
View upcoming appointment
       |
       v
Cancel appointment
       |
       v
View appointment history
```

The administrator journey is:

```text
Admin Login
     |
     v
Create appointment slot
     |
     v
Slot becomes available
     |
     v
User books slot
```

---

# Design Decisions

### Why Next.js Route Handlers?

The application's backend requirements are small enough that a separate backend service would add unnecessary deployment and operational complexity.

Using Next.js Route Handlers keeps the frontend and backend in one deployable application while maintaining a clear API boundary.

### Why PostgreSQL?

Appointment booking requires strong consistency guarantees.

PostgreSQL provides the relational constraints and transactional guarantees needed to protect the booking invariant.

### Why soft cancellation?

Cancelled appointments remain available as historical records.

This avoids losing useful information while allowing the underlying slot to become bookable again.

### Why database-level double-booking protection?

Application-level checks alone are vulnerable to race conditions.

The database constraint provides the final guarantee regardless of how many requests arrive concurrently.

---

# Out of Scope

The following features were deliberately excluded to keep the project focused:

* Payments
* Email/SMS notifications
* Calendar integrations
* Recurring appointments
* Rescheduling
* Waitlists
* Multiple organizations
* Multiple clinics
* Multiple providers
* Reviews
* Analytics
* Chat
* Subscriptions
* Complex scheduling rules
* Microservices
* Redis
* Kafka
* Kubernetes
* Event-driven architecture

The goal was to maximize quality within a small, realistic product scope rather than maximize feature count.

---

# Development Philosophy

The implementation follows several principles:

1. Keep the product scope intentionally small.
2. Treat the backend as the source of truth.
3. Enforce critical invariants at the database level.
4. Validate all external input on the server.
5. Enforce authorization server-side.
6. Provide explicit UI feedback for asynchronous operations.
7. Prefer simple architecture over unnecessary infrastructure.
8. Test critical business behavior.
9. Keep production deployment straightforward.

---

# License

This project was created as a take-home assignment.
