import {
    pgEnum,
    pgTable,
    timestamp,
    uuid,
    varchar,
    uniqueIndex,
    index,
    check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["USER", "ADMIN"]);

export const appointmentStatus = pgEnum("appointment_status", [
    "BOOKED",
    "CANCELLED",
]);

export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        email: varchar("email", { length: 255 }).notNull(),

        passwordHash: varchar("password_hash", { length: 255 }).notNull(),

        role: userRole("role").default("USER").notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp("updated_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        emailUnique: uniqueIndex("users_email_unique").on(table.email),
    }),
);

export const sessions = pgTable(
    "sessions",
    {
        id: varchar("id", { length: 64 }).primaryKey(),

        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        expiresAt: timestamp("expires_at", {
            withTimezone: true,
        }).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        userIndex: index("sessions_user_id_idx").on(table.userId),

        expiresAtIndex: index("sessions_expires_at_idx").on(table.expiresAt),
    }),
);

export const appointmentSlots = pgTable(
    "appointment_slots",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        startTime: timestamp("start_time", {
            withTimezone: true,
        }).notNull(),

        endTime: timestamp("end_time", {
            withTimezone: true,
        }).notNull(),

        createdBy: uuid("created_by")
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
            }),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        startTimeIndex: index("appointment_slots_start_time_idx").on(
            table.startTime,
        ),

        creatorIndex: index("appointment_slots_created_by_idx").on(
            table.createdBy,
        ),

        validTimeRange: check(
            "appointment_slots_valid_time_range",
            sql`${table.startTime} < ${table.endTime}`,
        ),
    }),
);

export const appointments = pgTable(
    "appointments",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        slotId: uuid("slot_id")
            .notNull()
            .references(() => appointmentSlots.id, {
                onDelete: "restrict",
            }),

        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "restrict",
            }),

        status: appointmentStatus("status").default("BOOKED").notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        cancelledAt: timestamp("cancelled_at", {
            withTimezone: true,
        }),
    },
    (table) => ({
        userIndex: index("appointments_user_id_idx").on(table.userId),

        slotIndex: index("appointments_slot_id_idx").on(table.slotId),

        activeBookingUnique: uniqueIndex(
            "appointments_one_active_booking_per_slot",
        )
            .on(table.slotId)
            .where(sql`${table.status} = 'BOOKED'`),
    }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type AppointmentSlot = typeof appointmentSlots.$inferSelect;
export type NewAppointmentSlot = typeof appointmentSlots.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;