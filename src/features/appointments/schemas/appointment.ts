import { z } from "zod";

export const createAppointmentSchema = z.object({
    slotId: z.string().uuid("Invalid slot ID"),
});

export type CreateAppointmentInput = z.infer<
    typeof createAppointmentSchema
>;