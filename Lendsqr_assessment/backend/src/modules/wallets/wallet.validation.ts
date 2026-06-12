import { z } from 'zod';

const amount = z.union([z.string(), z.number()]);

export const fundSchema = z.object({ body: z.object({ amount, reference: z.string().trim().max(80).optional() }) });
export const withdrawSchema = z.object({ body: z.object({ amount, reference: z.string().trim().max(80).optional() }) });
export const transferSchema = z.object({
  body: z.object({
    recipientUserId: z.string().uuid(),
    amount,
    reference: z.string().trim().max(80).optional(),
    description: z.string().trim().max(255).optional()
  })
});
