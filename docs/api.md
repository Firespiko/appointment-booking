````md
# Appointly API Documentation

## Overview

Appointly exposes a REST-style JSON API through Next.js App Router route handlers.

Authentication is session-based and protected endpoints require a valid session cookie.

All request and response bodies use JSON where applicable.

---

## Base URL

### Local Development

```text
http://localhost:3000
````

### Production

```text
https://<your-vercel-domain>
```

---

# Authentication

## POST `/api/auth/register`

Creates a new user account and starts an authenticated session.

### Request

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Success

**201 Created**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

A session is created and stored in a secure session cookie.

### Errors

**400 Bad Request**

Returned when the request fails validation.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid registration details.",
    "details": {}
  }
}
```

**409 Conflict**

Returned when the email address is already registered.

---

## POST `/api/auth/login`

Authenticates an existing user and creates a session.

### Request

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Success

**200 OK**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

A session is created and stored in a secure session cookie.

### Errors

**400 Bad Request**

Invalid request data.

**401 Unauthorized**

The supplied credentials are invalid.

---

## POST `/api/auth/logout`

Logs out the currently authenticated user.

### Request

No request body is required.

### Success

**200 OK**

```json
{
  "success": true
}
```

The active session is removed and the session cookie is cleared.

---

## GET `/api/auth/me`

Returns the currently authenticated user.

### Success

**200 OK**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Errors

**401 Unauthorized**

```json
{
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "You must be logged in."
  }
}
```

---

# Health Check

## GET `/api/health`

Returns the basic application health status.

This endpoint does not require authentication.

### Success

**200 OK**

```json
{
  "status": "ok"
}
```

---

# Appointment Slots

## GET `/api/slots`

Returns future appointment slots that are currently available for booking.

Slots with an active `BOOKED` appointment are excluded.

### Authentication

Required.

### Success

**200 OK**

```json
{
  "slots": [
    {
      "id": "slot-id",
      "startTime": "2026-09-10T10:00:00.000Z",
      "endTime": "2026-09-10T10:30:00.000Z"
    }
  ]
}
```

### Errors

**401 Unauthorized**

The user is not authenticated.

**500 Internal Server Error**

The application could not retrieve available slots.

---

## POST `/api/slots`

Creates an appointment slot.

### Authentication

Required.

### Authorization

Admin only.

### Request

```json
{
  "startTime": "2026-09-10T10:00:00.000Z",
  "endTime": "2026-09-10T10:30:00.000Z"
}
```

The admin UI provides the following supported durations:

* 15 minutes
* 30 minutes
* 45 minutes
* 60 minutes

### Validation Rules

The slot:

* must start in the future
* must end after it starts
* must not overlap an existing slot

### Success

**201 Created**

```json
{
  "slot": {
    "id": "slot-id",
    "startTime": "2026-09-10T10:00:00.000Z",
    "endTime": "2026-09-10T10:30:00.000Z",
    "createdBy": "admin-user-id"
  }
}
```

### Errors

**400 Bad Request**

Invalid slot data.

```json
{
  "error": {
    "code": "INVALID_SLOT_TIME",
    "message": "Appointment slots must be in the future."
  }
}
```

**401 Unauthorized**

The user is not authenticated.

**403 Forbidden**

The authenticated user is not an admin.

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required."
  }
}
```

**409 Conflict**

The requested time overlaps an existing slot.

```json
{
  "error": {
    "code": "SLOT_TIME_CONFLICT",
    "message": "This time overlaps with an existing appointment slot."
  }
}
```

---

## GET `/api/slots/admin`

Returns future appointment slots created by the authenticated admin.

Each slot indicates whether it currently has an active booking.

### Authentication

Required.

### Authorization

Admin only.

### Success

**200 OK**

```json
{
  "slots": [
    {
      "id": "slot-id",
      "startTime": "2026-09-10T10:00:00.000Z",
      "endTime": "2026-09-10T10:30:00.000Z",
      "isBooked": false
    }
  ]
}
```

### Errors

**401 Unauthorized**

The user is not authenticated.

**403 Forbidden**

The authenticated user is not an admin.

---

## DELETE `/api/slots/:id`

Deletes an appointment slot.

### Authentication

Required.

### Authorization

Admin only.

The admin can only delete slots they created.

### Restrictions

A slot cannot be deleted while it has an active `BOOKED` appointment.

Cancelled appointments do not count as active bookings.

### Success

**200 OK**

```json
{
  "success": true
}
```

### Errors

**401 Unauthorized**

The user is not authenticated.

**403 Forbidden**

The authenticated user is not an admin.

**404 Not Found**

The slot does not exist or does not belong to the current admin.

**409 Conflict**

The slot currently has an active appointment.

```json
{
  "error": {
    "code": "SLOT_HAS_APPOINTMENT",
    "message": "This slot has an active appointment and cannot be deleted."
  }
}
```

---

# Appointments

## GET `/api/appointments`

Returns appointments belonging to the authenticated user.

### Authentication

Required.

### Success

**200 OK**

```json
{
  "appointments": [
    {
      "id": "appointment-id",
      "status": "BOOKED",
      "createdAt": "2026-09-07T12:00:00.000Z",
      "cancelledAt": null,
      "slot": {
        "id": "slot-id",
        "startTime": "2026-09-10T10:00:00.000Z",
        "endTime": "2026-09-10T10:30:00.000Z"
      }
    }
  ]
}
```

The frontend uses the returned data to separate upcoming appointments from appointment history.

### Errors

**401 Unauthorized**

The user is not authenticated.

---

## POST `/api/appointments`

Books an available appointment slot.

### Authentication

Required.

### Authorization

Only users with the `USER` role can book appointments.

Admins cannot book appointments.

### Request

```json
{
  "slotId": "slot-id"
}
```

### Validation Rules

The slot:

* must exist
* must be in the future
* must currently be available
* must have a valid identifier

### Success

**201 Created**

```json
{
  "appointment": {
    "id": "appointment-id",
    "slotId": "slot-id",
    "userId": "user-id",
    "status": "BOOKED"
  }
}
```

---

## Concurrent Booking Protection

Appointly guarantees that a slot can have only one active booking.

This is enforced at the database level using a partial unique index for:

```text
slot_id WHERE status = 'BOOKED'
```

Therefore, if two users attempt to book the same slot concurrently:

```text
User A ──────┐
             ├──> Database
User B ──────┘
                │
                ├── One request succeeds
                └── One request receives 409
```

### Conflict Response

**409 Conflict**

```json
{
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "This slot is no longer available. Someone else booked it just before you."
  }
}
```

The frontend refreshes availability after receiving this response.

### Other Errors

**400 Bad Request**

Invalid appointment details.

**401 Unauthorized**

The user is not authenticated.

**403 Forbidden**

The authenticated user is an admin.

**404 Not Found**

The requested slot does not exist or has already passed.

---

## PATCH `/api/appointments/:id/cancel`

Cancels an existing appointment.

### Authentication

Required.

### Authorization

Users may only cancel their own appointments.

### Success

**200 OK**

The appointment status is changed from:

```text
BOOKED
```

to:

```text
CANCELLED
```

and `cancelledAt` is populated.

### Errors

**401 Unauthorized**

The user is not authenticated.

**403 Forbidden**

The appointment does not belong to the authenticated user.

**404 Not Found**

The appointment does not exist.

**409 Conflict**

The appointment cannot be cancelled because it is no longer eligible for cancellation.

---

# Error Response Format

API errors follow a consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Validation errors may include field-level details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid appointment details.",
    "details": {
      "slotId": [
        "Invalid slot ID"
      ]
    }
  }
}
```

---

# HTTP Status Codes

| Status | Meaning                                          |
| ------ | ------------------------------------------------ |
| `200`  | Request completed successfully                   |
| `201`  | Resource created successfully                    |
| `400`  | Invalid request or validation failure            |
| `401`  | Authentication required                          |
| `403`  | Authenticated but not authorized                 |
| `404`  | Requested resource was not found                 |
| `409`  | Request conflicts with current application state |
| `500`  | Unexpected server-side error                     |

---

# Authentication and Security Notes

* Passwords are stored as password hashes.
* Sessions are stored server-side.
* Protected endpoints validate the current session.
* Role authorization is enforced server-side.
* Appointment ownership is verified server-side.
* Client-side UI restrictions are not treated as security boundaries.
* Concurrent booking protection is enforced by the database.
* Appointment cancellation preserves historical records instead of deleting them.

```
