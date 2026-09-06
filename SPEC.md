# Appointment Booking Application

## Product & Engineering Specification — v1.0

---

# 1. Project Objective

Build a small, production-ready Appointment Booking web application.

The application should allow:

### Users

* Sign up / log in
* View available appointment slots
* Select and book an available slot
* View upcoming appointments
* View past appointments
* Cancel an upcoming appointment

### Admins

* Log in
* Create appointment slots
* View the slots they have created

The system intentionally has a small feature set.

The goal is **not** to build a feature-rich scheduling platform.

The goal is to demonstrate that a small product can be designed, engineered, tested, and deployed with production-quality practices.

---

# 2. Product Philosophy

Follow this principle throughout the implementation:

> **Small scope, deep quality.**

Do not introduce functionality that is not required by this specification.

Do not build:

* Payments
* Email/SMS notifications
* Calendar integrations
* Recurring appointments
* Rescheduling
* Waitlists
* Multiple organizations
* Multiple clinics
* Doctor/provider management
* Reviews
* Analytics dashboards
* Chat
* Subscription management
* Complex scheduling rules
* Microservices
* Redis
* Kafka
* Kubernetes
* Event-driven architecture

Prefer the simplest architecture that correctly satisfies the requirements.

Production readiness should come from:

* Correctness
* Data consistency
* Authentication
* Authorization
* Validation
* Error handling
* Good UX
* Testing
* Database constraints
* Secure configuration
* Clean architecture

rather than unnecessary infrastructure.

---

# 3. Technology Stack

Use the following stack unless there is a compelling technical reason not to.

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui or a similarly minimal accessible component system

## Backend

Use the Next.js application as the backend as well.

* Next.js Route Handlers / server-side application logic
* REST-style API endpoints
* Zod for request validation

Do NOT create a separate Express server unless there is a strong reason.

The application is small enough that a single deployable Next.js application is preferable.

## Database

* PostgreSQL
* Drizzle ORM

The database should be treated as the authoritative source of truth.

## Authentication

Use a simple established authentication solution appropriate for Next.js.

Requirements:

* Email/password authentication
* Secure password hashing
* Session-based authentication
* User roles: USER and ADMIN
* Server-side authorization checks

Do not implement cryptographic primitives manually.

## Testing

* Vitest or Jest for unit/integration tests
* Playwright for a small number of critical end-to-end tests

Use whichever combination integrates most cleanly with the selected Next.js setup.

## Package management

* pnpm

## Deployment

* Vercel for the web application
* Neon PostgreSQL for the production database

---

# 4. Actors

There are two roles.

## USER

A normal authenticated customer.

Can:

* View available slots
* Book slots
* View own appointments
* Cancel own appointments

Cannot:

* Create slots
* Modify another user's appointments
* Access admin functionality

## ADMIN

A scheduling administrator.

Can:

* Create appointment slots
* View/manage slots they created

Admin functionality should remain intentionally small.

---

# 5. Core User Journey

The primary user journey is:

```text
Login
  ↓
View available slots
  ↓
Select slot
  ↓
Confirm booking
  ↓
Booking succeeds
  ↓
View appointment in Upcoming
  ↓
Later cancel appointment if required
```

Admin journey:

```text
Login
  ↓
Admin dashboard
  ↓
Create appointment slot
  ↓
Slot becomes available
  ↓
User can book it
```

This is the central product loop.

---

# 6. Functional Requirements

## FR-01 — Authentication

The system shall allow users to authenticate.

Requirements:

* User can register.
* User can log in.
* User can log out.
* Passwords must never be stored in plaintext.
* Authenticated sessions must be validated server-side.

Unauthenticated users attempting to access protected resources should receive an appropriate authentication response.

---

## FR-02 — Role-Based Authorization

The system shall distinguish between USER and ADMIN roles.

Only ADMIN users can create appointment slots.

A USER attempting to create a slot must receive a forbidden response.

Users must only be able to access and modify their own appointments.

Authorization must be enforced on the backend.

Never rely exclusively on hiding UI elements.

---

## FR-03 — Create Appointment Slot

An ADMIN can create an appointment slot.

Required fields:

* Start date/time
* End date/time

Validation:

* Start time must be before end time.
* Slot must be in the future.
* Invalid dates must be rejected.
* The system must reject invalid or malformed input.
* The system should prevent unintended overlapping slots if overlapping slots are not meaningful for this application's scheduling model.

A successful creation returns the created slot.

---

## FR-04 — View Available Slots

Authenticated users can view available future slots.

The UI should:

* Group slots logically by date.
* Display the start/end time clearly.
* Clearly distinguish available slots.
* Avoid displaying cancelled/expired/unavailable slots as bookable.

Past slots should not appear as available.

The backend must determine availability.

The frontend must not be considered authoritative.

---

## FR-05 — Book Appointment

An authenticated USER can book an available slot.

Booking must:

1. Verify that the user is authenticated.
2. Verify that the slot exists.
3. Verify that the slot is in the future.
4. Verify that the slot is currently available.
5. Create the appointment.
6. Ensure the slot cannot simultaneously be booked by another user.
7. Return a successful response.

After successful booking:

* The appointment should appear under Upcoming.
* The slot should no longer appear as available.

---

# 7. Critical Requirement — Concurrent Booking

This is one of the most important engineering requirements.

Consider:

```text
Slot #123 is available.

User A ────────┐
               ├── POST /appointments
User B ────────┘
```

Both users may see the slot as available.

The system must guarantee that:

```text
User A → SUCCESS

User B → CONFLICT
```

or vice versa.

It must NEVER result in:

```text
Slot #123
    ↓
Appointment A
Appointment B
```

The frontend must not be responsible for this guarantee.

The backend and database must enforce the invariant.

Use a PostgreSQL transaction and an appropriate database constraint/locking strategy.

A unique constraint should ensure that only one active appointment can exist for a slot.

The implementation should be race-condition safe.

---

# 8. FR-06 — View Appointments

Authenticated users can view their appointments.

Separate them into:

## Upcoming

Appointments whose scheduled time has not passed and which are not cancelled.

Each appointment should display:

* Date
* Start time
* End time
* Status
* Cancellation action where applicable

## Past

Appointments whose scheduled time has passed.

Past appointments should be read-only.

Cancelled appointments should retain their history and be clearly marked as cancelled where appropriate.

---

# 9. FR-07 — Cancel Appointment

Authenticated users can cancel their own upcoming appointments.

Cancellation requirements:

* User must own the appointment.
* Appointment must not already be cancelled.
* Appointment must not have already occurred.
* Cancellation should be persisted.
* The associated slot should become available again.

Do not allow a user to cancel another user's appointment.

Prefer marking an appointment as CANCELLED rather than permanently deleting the database row.

This preserves appointment history.

---

# 10. Business Rules

## BR-01

Only ADMIN users can create appointment slots.

## BR-02

Only authenticated users can book appointments.

## BR-03

A slot can have at most one active appointment.

## BR-04

A user cannot book the same slot twice.

## BR-05

A user can only cancel their own appointments.

## BR-06

Past appointments cannot be cancelled.

## BR-07

Cancelled appointments remain in the database for historical purposes.

## BR-08

A cancelled slot becomes available for booking again.

## BR-09

The backend is the source of truth for availability.

## BR-10

All client-provided input must be validated server-side.

---

# 11. Data Model

Use PostgreSQL.

Minimal entities:

```text
User
AppointmentSlot
Appointment
```

## User

```text
User
----------------
id
email
password_hash
role
created_at
updated_at
```

Role:

```text
USER
ADMIN
```

---

## AppointmentSlot

```text
AppointmentSlot
----------------
id
start_time
end_time
created_by
created_at
```

`created_by` references `User.id`.

Only ADMIN users may create slots.

---

## Appointment

```text
Appointment
----------------
id
slot_id
user_id
status
created_at
cancelled_at
```

Status:

```text
BOOKED
CANCELLED
```

Relationships:

```text
User
 │
 ├──────────── creates ────────────> AppointmentSlot
 │
 └──────────── books ──────────────> Appointment
                                      │
                                      │ belongs to
                                      ↓
                               AppointmentSlot
```

---

# 12. Database Constraints

Use the database to enforce important invariants.

At minimum:

### User

* Unique email.

### Appointment

* Foreign key to User.
* Foreign key to AppointmentSlot.

### Booking uniqueness

There must never be more than one active booking for a slot.

Design the PostgreSQL constraint/index accordingly.

If using a partial unique index:

```text
UNIQUE(slot_id) WHERE status = 'BOOKED'
```

This allows:

```text
Slot 1 → CANCELLED
Slot 1 → BOOKED
```

while preventing:

```text
Slot 1 → BOOKED
Slot 1 → BOOKED
```

The exact SQL/Drizzle implementation should be verified against PostgreSQL behavior.

---

# 13. ERD

Create an ERD documenting:

```text
┌─────────────┐
│    USER     │
├─────────────┤
│ id          │
│ email       │
│ password    │
│ role        │
└──────┬──────┘
       │
       │ 1:N
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌──────────────────┐     ┌────────────────┐
│ APPOINTMENT_SLOT │     │  APPOINTMENT   │
├──────────────────┤     ├────────────────┤
│ id               │◄────│ slot_id        │
│ start_time       │  1:1│ user_id        │
│ end_time         │     │ status         │
│ created_by       │     │ created_at     │
│ created_at       │     │ cancelled_at   │
└──────────────────┘     └────────────────┘
```

Note that the exact ERD cardinalities should reflect the database constraints actually implemented.

---

# 14. API Design

Use REST-style APIs.

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Slots

```text
GET  /api/slots
POST /api/slots
```

`POST /api/slots` requires ADMIN authorization.

## Appointments

```text
GET   /api/appointments
POST  /api/appointments
PATCH /api/appointments/:id/cancel
```

`POST /api/appointments` should accept a slot ID.

Example:

```json
{
  "slotId": "..."
}
```

---

# 15. API Response Principles

Use consistent JSON responses.

Success:

```json
{
  "data": {}
}
```

Validation error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data."
  }
}
```

Conflict:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "This appointment slot is no longer available."
  }
}
```

Unauthorized:

```text
401
```

Forbidden:

```text
403
```

Not found:

```text
404
```

Conflict:

```text
409
```

Validation failure:

```text
400
```

Unexpected server error:

```text
500
```

Do not expose internal stack traces or sensitive database information to clients.

---

# 16. API Validation

Use Zod or equivalent server-side validation.

Validate:

* Email format
* Password requirements
* Slot ID
* Dates
* Date ordering
* Future dates
* Required fields
* Enum values

Never assume frontend validation is sufficient.

Frontend validation improves UX.

Backend validation protects the application.

---

# 17. Architecture

Use a simple modular monolith.

```text
                         ┌──────────────────────┐
                         │       Browser        │
                         │ Next.js / React / TS │
                         └──────────┬───────────┘
                                    │
                                    │ HTTPS
                                    ▼
                         ┌──────────────────────┐
                         │     Next.js App      │
                         │                      │
                         │ UI                   │
                         │ API Routes           │
                         │ Auth                 │
                         │ Validation           │
                         │ Business Logic       │
                         └──────────┬───────────┘
                                    │
                                    │ Drizzle
                                    ▼
                         ┌──────────────────────┐
                         │     PostgreSQL       │
                         │        Neon          │
                         └──────────────────────┘
```

Do not introduce microservices.

The application is small enough that a modular monolith is the correct level of complexity.

---

# 18. Recommended Code Structure

Use feature-oriented organization.

Example:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── admin/
│   └── api/
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── schemas/
│   │   └── services/
│   │
│   ├── slots/
│   │   ├── components/
│   │   ├── schemas/
│   │   └── services/
│   │
│   └── appointments/
│       ├── components/
│       ├── schemas/
│       └── services/
│
├── components/
│   └── ui/
│
├── db/
│   ├── schema/
│   ├── migrations/
│   └── client.ts
│
├── lib/
│   ├── auth/
│   ├── validation/
│   └── errors/
│
└── tests/
```

Keep business logic outside route handlers where practical.

Route handlers should primarily:

```text
authenticate
    ↓
validate
    ↓
call service
    ↓
return response
```

Do not put the entire booking algorithm directly inside the HTTP route.

---

# 19. UI/UX Principles

The application should feel polished despite having only a few screens.

Primary UX principle:

> Make the next action obvious.

Avoid unnecessary UI complexity.

---

# 20. Screen 1 — Booking

Primary user screen.

Suggested hierarchy:

```text
┌───────────────────────────────────────────┐
│ Logo                    My Appointments   │
│                                           │
│ Book an appointment                       │
│ Choose a time that works for you.         │
│                                           │
│ Monday, September 7                       │
│                                           │
│ 09:00 AM   09:30 AM   10:00 AM   10:30  │
│                                           │
│ Tuesday, September 8                      │
│                                           │
│ 09:00 AM   09:30 AM   10:00 AM            │
│                                           │
└───────────────────────────────────────────┘
```

Slots should be visually obvious and easy to select.

Avoid a complicated calendar if the product only needs discrete time-slot selection.

---

# 21. Screen 2 — My Appointments

Organize information into:

```text
Upcoming
───────────────

Sep 7 · 10:00 AM
30 minute appointment

[Cancel]


Past
───────────────

Aug 28 · 02:00 PM
Completed
```

Upcoming appointments should receive visual priority.

Past appointments should be visually quieter.

Cancelled appointments should have an obvious status.

---

# 22. Screen 3 — Admin

Keep the admin interface minimal.

```text
Create appointment slot

Date
[ September 7 ]

Start
[ 10:00 AM ]

End
[ 10:30 AM ]

[ Create slot ]
```

Optionally show recently created slots underneath.

Do not build an elaborate analytics/admin dashboard.

---

# 23. Information Hierarchy

The interface should prioritize information in this order:

## Booking screen

1. Page purpose
2. Available dates
3. Available times
4. Selected time
5. Booking action
6. Secondary information

## Appointment screen

1. Upcoming appointment
2. Appointment date/time
3. Appointment status
4. Cancellation action
5. Past appointment history

The primary action should always be visually obvious.

---

# 24. UX States

Every asynchronous operation must have explicit UI states.

## Loading

When fetching slots:

```text
Loading available times...
```

Prefer skeleton UI where appropriate.

## Empty

If no slots are available:

```text
No appointments available

There are currently no available times.
Please check again later.
```

## Booking

When the booking request is running:

```text
Booking...
```

The booking action should be disabled to prevent accidental duplicate submissions.

## Booking success

```text
✓ Appointment booked

Monday, September 7
10:00 AM – 10:30 AM
```

## Booking conflict

If another user booked the slot:

```text
This time is no longer available.

Someone else just booked this slot.
Please choose another time.
```

## Network/server failure

```text
Something went wrong.

We couldn't complete your request.
Please try again.

[Try again]
```

## Cancellation

Use a confirmation step:

```text
Cancel appointment?

Sep 7 · 10:00 AM

This appointment will be cancelled and
the time slot will become available again.

[Keep appointment] [Cancel appointment]
```

Then show success feedback:

```text
✓ Appointment cancelled
```

---

# 25. Responsive Design

The application must work well on:

* Desktop
* Tablet
* Mobile

Do not simply shrink the desktop UI.

On mobile:

* Time slots should remain easy to tap.
* Buttons should have appropriate touch targets.
* Navigation should remain simple.
* Appointment cards should stack vertically.
* No horizontal overflow.

---

# 26. Accessibility

Follow basic accessibility principles.

Requirements:

* Semantic HTML.
* Proper labels for inputs.
* Keyboard navigation.
* Visible focus states.
* Sufficient contrast.
* Buttons must have meaningful accessible names.
* Error messages should be understandable.
* Do not communicate important information through color alone.

---

# 27. Visual Design Direction

The visual style should be:

* Clean
* Minimal
* Modern
* Professional
* Calm
* Spacious

Avoid:

* Excessive gradients
* Excessive animations
* Huge hero sections
* Unnecessary decorative elements
* Excessive cards
* Dense dashboards

The application should feel like a real SaaS product rather than a hackathon dashboard.

Use one clear accent color and neutral backgrounds.

Typography should establish hierarchy through:

* Size
* Weight
* Spacing

rather than excessive colors.

---

# 28. Product Details That Matter

Pay attention to:

* Button hover states
* Button disabled states
* Focus states
* Skeleton/loading states
* Toasts or inline success messages
* Error messages
* Empty states
* Confirmation dialogs
* Date/time formatting
* Consistent spacing
* Consistent border radius
* Consistent typography
* Mobile layout
* Preventing accidental double submission

These details are part of the product quality evaluation.

---

# 29. Time and Date Handling

Store appointment timestamps in UTC in PostgreSQL.

Convert timestamps to the user's intended display timezone at the presentation layer.

Avoid manually manipulating timezone offsets.

Use a reliable date/time library where necessary.

The UI should display human-readable values such as:

```text
Monday, September 7
10:00 AM – 10:30 AM
```

rather than raw ISO timestamps.

---

# 30. Security Requirements

Implement basic production security.

## Passwords

Never store plaintext passwords.

Use a reputable password hashing implementation.

## Authentication

Protected API routes must verify the session server-side.

## Authorization

Always check ownership:

```text
currentUser.id === appointment.userId
```

before allowing cancellation.

Admin endpoints must verify:

```text
currentUser.role === ADMIN
```

## Input

Validate all external input.

## Database

Use parameterized queries/ORM query APIs.

Never construct SQL using raw string concatenation from user input.

## Secrets

Never commit:

```text
DATABASE_URL
AUTH_SECRET
API keys
passwords
```

to Git.

Use environment variables.

---

# 31. Error Handling

Create a consistent application error model.

Suggested categories:

```text
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
SLOT_UNAVAILABLE
APPOINTMENT_ALREADY_CANCELLED
APPOINTMENT_IN_PAST
INTERNAL_ERROR
```

The frontend should map known errors to useful human-readable messages.

Do not expose implementation details.

---

# 32. Testing Strategy

Testing should focus on **business-critical behavior**, not achieving an arbitrary coverage percentage.

## Unit Tests

Test:

* Validation schemas
* Appointment status rules
* Cancellation rules
* Slot validation

## Integration Tests

Test:

### Authentication

* Register
* Login
* Unauthorized request

### Slots

* Admin can create slot
* User cannot create slot
* Invalid slot rejected
* Past slot rejected

### Booking

* User can book available slot
* User cannot book unavailable slot
* User cannot book same slot twice
* Unauthenticated user cannot book

### Cancellation

* User can cancel own appointment
* User cannot cancel another user's appointment
* Past appointment cannot be cancelled
* Cancelled appointment remains in history
* Cancelled slot becomes available

---

# 33. Critical Concurrency Test

Write a test specifically for concurrent booking.

Conceptually:

```text
Create slot X

Send booking request from User A
Send booking request from User B
at approximately the same time

Assert:

Exactly one request succeeds.

Exactly one active appointment exists.

The other request receives a conflict response.
```

This test is more valuable than dozens of superficial UI tests because concurrency is explicitly part of the assignment.

---

# 34. End-to-End Test

Implement at least one complete happy-path E2E test:

```text
Login
  ↓
View available slot
  ↓
Select slot
  ↓
Book
  ↓
Open appointments
  ↓
Verify appointment exists
  ↓
Cancel
  ↓
Verify cancelled state
```

Also include a conflict/error path if time permits.

---

# 35. Acceptance Criteria

## Availability

Given available future slots exist,

When an authenticated user opens the booking page,

Then available slots are displayed grouped by date.

---

## Booking

Given a slot is available,

When the user books it,

Then an appointment is created,

And the slot is no longer available,

And the appointment appears in Upcoming.

---

## Concurrent Booking

Given one slot is available,

When two users attempt to book it concurrently,

Then exactly one booking succeeds,

And exactly one active appointment exists.

---

## Cancellation

Given a user has an upcoming appointment,

When they cancel it,

Then the appointment becomes CANCELLED,

And the slot becomes available again.

---

## Authorization

Given User A owns Appointment A,

When User B attempts to cancel Appointment A,

Then the request is rejected.

---

## Admin

Given a user is not an admin,

When they attempt to create a slot,

Then the request is rejected.

---

# 36. Non-Functional Requirements

## NFR-01 — Reliability

The system must preserve booking consistency even under concurrent requests.

## NFR-02 — Security

Authentication, authorization, password hashing and server-side validation must be implemented.

## NFR-03 — Performance

The application should feel responsive under normal expected usage.

Loading states must be displayed during asynchronous operations.

## NFR-04 — Maintainability

Code should be organized by domain/feature.

Business logic should not be unnecessarily coupled to UI components.

## NFR-05 — Usability

Core tasks should be understandable without instructions.

## NFR-06 — Accessibility

Core workflows must be keyboard-accessible and use semantic controls.

## NFR-07 — Responsive Design

The core application must work on mobile and desktop.

## NFR-08 — Observability

Production errors should be logged in a way that allows debugging without exposing sensitive information to users.

---

# 37. Deployment Architecture

Production:

```text
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │     Vercel      │
              │                 │
              │    Next.js      │
              │  Frontend + API │
              └────────┬────────┘
                       │
                       │ TLS
                       ▼
              ┌─────────────────┐
              │      Neon       │
              │   PostgreSQL    │
              └─────────────────┘
```

Environment variables:

```text
DATABASE_URL
AUTH_SECRET
```

Do not hardcode secrets.

---

# 38. Development Environment

Local development:

```text
Developer
   │
   ▼
Next.js
   │
   ▼
Local PostgreSQL
```

or use a development Neon database.

Production:

```text
GitHub
   │
   ▼
Vercel
   │
   ▼
Neon PostgreSQL
```

---

# 39. Git Workflow

Use Git throughout development.

Commit logically:

```text
chore: initialize project
feat: add authentication
feat: add appointment slots
feat: add booking flow
feat: add appointment history
feat: add cancellation
test: add booking concurrency tests
feat: polish booking UX
chore: prepare production deployment
```

Do not commit:

* `.env`
* secrets
* build artifacts
* node_modules

---

# 40. README Requirements

The repository README should include:

## Project description

What the application does.

## Features

Short feature list.

## Tech stack

Frontend, backend, database, testing.

## Architecture

Short explanation.

## Local setup

Example:

```bash
pnpm install
pnpm dev
```

Explain environment variables.

## Database

Explain migrations and seeding.

## Testing

```bash
pnpm test
pnpm test:e2e
```

## Deployment

Explain production deployment at a high level.

## Engineering decisions

Briefly explain:

* Why PostgreSQL
* Why a modular monolith
* How concurrent booking is prevented
* How authentication/authorization works

---

# 41. Seed Data

Provide development seed data.

Create:

* One admin user
* One or two normal users
* Several future appointment slots
* At least one past appointment if useful for UI testing

Never use real credentials.

Development credentials should be documented only as local seed credentials.

---

# 42. Out of Scope

Do NOT implement:

* Recurring appointments
* Calendar synchronization
* Google Calendar integration
* Outlook integration
* Email notifications
* SMS
* Payments
* Rescheduling
* Waitlists
* Multiple providers
* Multiple clinics
* Organization management
* Subscription billing
* Analytics
* Reviews
* Chat
* Video calls
* Complex availability rules
* Time-off management
* Multi-timezone scheduling configuration
* Redis
* Kafka
* Microservices

If a requirement is not in this specification, prefer not to implement it.

---

# 43. AI Development Rules

The AI coding agent must follow these rules.

## Rule 1 — Do not expand scope

Do not introduce features outside this specification without explicit approval.

## Rule 2 — Backend is authoritative

Never trust the frontend for:

* Availability
* User identity
* User ownership
* Admin permissions
* Booking validity

## Rule 3 — Database protects invariants

Important consistency guarantees must be enforced at the database/backend level.

## Rule 4 — No fake production behavior

Do not create fake booking logic, mock persistence, or local-only state that pretends to be a real backend.

## Rule 5 — Validate server-side

Every API endpoint receiving external data must validate it.

## Rule 6 — Test critical behavior

Every major business rule should have automated coverage.

## Rule 7 — Keep architecture simple

Do not add infrastructure simply because it is commonly used by larger companies.

## Rule 8 — Explain significant decisions

When choosing between multiple reasonable approaches, document the decision.

## Rule 9 — Do not silently change requirements

If implementation reveals an ambiguity, stop and identify the ambiguity rather than inventing a large feature.

## Rule 10 — Run tests

After meaningful changes:

```text
typecheck
lint
unit/integration tests
build
```

must be run where practical.

Fix failures rather than ignoring them.

---

# 44. Implementation Order

Build in this order.

## Phase 1 — Foundation

* Initialize Next.js
* TypeScript
* Tailwind
* Component system
* ESLint
* Prettier if desired
* PostgreSQL connection
* Drizzle
* Database migrations
* Environment configuration

## Phase 2 — Database

Implement:

* User
* AppointmentSlot
* Appointment

Add:

* Foreign keys
* Unique constraints
* Booking uniqueness protection
* Migrations
* Seed data

## Phase 3 — Authentication

Implement:

* Registration
* Login
* Logout
* Session
* User roles
* Authorization helpers

## Phase 4 — Slot Management

Implement:

* Admin slot creation
* Slot validation
* Available slot API

## Phase 5 — Booking

Implement:

* Book endpoint
* Transaction
* Concurrency protection
* Conflict response
* Booking tests

This is the most important backend feature.

## Phase 6 — Appointments

Implement:

* Upcoming appointments
* Past appointments
* Cancellation
* Cancellation tests

## Phase 7 — Frontend

Implement:

* Login/register
* Booking screen
* Appointment screen
* Admin screen
* Responsive layout

## Phase 8 — UX Polish

Add:

* Loading states
* Empty states
* Error states
* Success feedback
* Confirmation dialogs
* Disabled states
* Responsive improvements
* Accessibility improvements

## Phase 9 — Testing

Add:

* Unit tests
* Integration tests
* Concurrency test
* E2E test

## Phase 10 — Production

Run:

```text
lint
typecheck
tests
build
```

Then deploy.

---

# 45. Definition of Done

The project is complete when:

### Product

* [ ] User can register/login.
* [ ] Admin can create slots.
* [ ] User can view available slots.
* [ ] User can book a slot.
* [ ] User can view upcoming appointments.
* [ ] User can view past appointments.
* [ ] User can cancel an upcoming appointment.

### Engineering

* [ ] PostgreSQL persistence works.
* [ ] Authentication works.
* [ ] Authorization works.
* [ ] Server-side validation exists.
* [ ] Database constraints protect booking consistency.
* [ ] Concurrent booking is handled correctly.
* [ ] API errors are consistent.
* [ ] Users cannot access other users' appointments.
* [ ] Admin-only endpoints are protected.

### UX

* [ ] Responsive desktop UI.
* [ ] Responsive mobile UI.
* [ ] Loading states.
* [ ] Empty states.
* [ ] Error states.
* [ ] Success feedback.
* [ ] Booking confirmation.
* [ ] Cancellation confirmation.
* [ ] Accessible forms and buttons.
* [ ] Clear information hierarchy.

### Testing

* [ ] Authentication tests.
* [ ] Authorization tests.
* [ ] Slot tests.
* [ ] Booking tests.
* [ ] Cancellation tests.
* [ ] Concurrency test.
* [ ] Critical E2E flow.

### Production

* [ ] Environment variables configured.
* [ ] Production database configured.
* [ ] Database migrations work.
* [ ] Production build succeeds.
* [ ] Application deployed.
* [ ] README completed.
* [ ] No secrets committed.

---

# 46. Final Engineering Principle

The application should demonstrate:

> **A small product implemented with production-level discipline.**

Do not optimize for the number of features.

Optimize for:

```text
Correctness
    +
Security
    +
Consistency
    +
Good UX
    +
Maintainability
    +
Testing
```

The final application should be small enough that a reviewer can understand the entire system, while polished enough that it feels appropriate to ship to real users.
