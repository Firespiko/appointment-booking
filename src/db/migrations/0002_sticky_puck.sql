ALTER TABLE "appointment_slots" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "appointment_slots" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;