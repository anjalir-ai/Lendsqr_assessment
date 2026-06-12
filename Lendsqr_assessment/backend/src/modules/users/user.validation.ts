import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(160).transform((email) => email.toLowerCase()),
    phone: z.string().trim().min(7).max(30).optional(),
    bvn: z.string().trim().min(5).max(20).optional()
  })
});
