import { z } from "zod";

export const createSlotSchema = z
    .object({
        startTime: z.string().datetime({ offset: true }),
        endTime: z.string().datetime({ offset: true }),
    })
    .refine(
        (data) => new Date(data.startTime) < new Date(data.endTime),
        {
            message: "End time must be after start time",
            path: ["endTime"],
        },
    );

export type CreateSlotInput = z.infer<typeof createSlotSchema>;