# Appointment Booking — AI Development Rules

## Source of truth

Read `SPEC.md` before making architectural or implementation decisions.

The specification defines the product scope and requirements.

Do not add features that are not explicitly required.

## Product philosophy

Build a small appointment booking system with production-level quality.

Prioritize:

- Correctness
- Reliability
- Security
- Data consistency
- UX quality
- Maintainability
- Testing

Do not optimize for feature count.

## Architecture

Use a modular monolith.

The application is a single Next.js application containing:

- React frontend
- Server-side API
- Business logic
- PostgreSQL persistence

Do not introduce microservices.

Do not introduce Redis, Kafka, queues, Kubernetes, or other infrastructure unless explicitly requested.

## Database

PostgreSQL is the source of truth.

Use Drizzle ORM.

Important business invariants must be enforced by the database where possible.

Booking must be safe against concurrent requests.

A slot must never have more than one active booking.

## Authentication

Authentication must be handled server-side.

Never trust client-provided user IDs.

Never trust client-provided roles.

Authorization must be checked on protected operations.

## Validation

All external API input must be validated server-side.

Frontend validation is for user experience only.

## Booking

The backend is authoritative for availability.

Never rely on the frontend's representation of availability.

Booking must use a transaction and appropriate database constraints/locking.

Concurrent booking attempts must result in exactly one successful active booking.

## Authorization

Users may only access and modify their own appointments.

Only administrators may create appointment slots.

Authorization must be enforced on the server.

## Cancellation

Cancellation should preserve appointment history.

Prefer marking appointments as CANCELLED rather than deleting historical records.

Cancelled slots should become available again according to the specification.

## Code organization

Organize code by domain/feature.

Keep business logic out of UI components where practical.

Keep route handlers thin.

Prefer:

request
→ authentication
→ validation
→ service/business logic
→ database
→ response

## UI

The application should feel polished and production-ready.

Every asynchronous workflow should consider:

- Loading
- Success
- Error
- Empty
- Disabled
- Conflict

Do not build unnecessary UI.

Prioritize the primary user journey.

## Testing

Critical business logic must have automated tests.

At minimum test:

- Authentication
- Authorization
- Slot creation
- Slot validation
- Booking
- Double booking
- Concurrent booking
- Cancellation
- Ownership checks

Include an end-to-end test covering:

login
→ view slot
→ book
→ view appointment
→ cancel

## Dependencies

Do not add dependencies without a reason.

Prefer existing platform/framework capabilities when they are sufficient.

## Development process

Work incrementally.

Before implementing a major phase:

1. Read the relevant specification.
2. Explain the intended approach.
3. Implement the smallest correct change.
4. Run relevant tests.
5. Run type checking.
6. Run linting.
7. Fix failures.
8. Report what changed.

Do not implement the entire application in one pass.

## Ambiguity

If a requirement is ambiguous and the decision materially affects:

- database design
- security
- API design
- user experience
- business logic

stop and explain the ambiguity before making a major assumption.

Minor implementation details may be chosen using reasonable engineering judgment.

## No fake functionality

Do not create fake APIs, fake persistence, fake authentication, or mock implementations in the actual application.

Mocks may be used in tests only.

## Security

Never commit secrets.

Never expose:

- passwords
- session secrets
- database credentials
- API keys

Do not expose internal errors or stack traces to users.

## Quality standard

The final application should feel like a small real product, not a CRUD demo.