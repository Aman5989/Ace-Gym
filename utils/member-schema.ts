import { z } from "zod";


export const memberSchema = z.object({

  full_name: z
    .string()
    .min(3, "Name is required"),

  phone: z
    .string()
    .min(10, "Enter valid phone number"),

  gender: z
    .string()
    .optional(),

  membership_plan: z
    .string(),

  join_date: z
    .string(),

  monthly_fee: z
    .number()
    .min(1, "Fee required"),

  notes: z
    .string()
    .optional(),

});


export type MemberFormData =
  z.infer<typeof memberSchema>;
