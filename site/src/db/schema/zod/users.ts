import { z } from "zod";

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().optional(),
  email: z.email(),
  emailVerified: z.date().nullable().optional(),
  image: z.url().nullable().optional(),
  password: z.string().min(6).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
