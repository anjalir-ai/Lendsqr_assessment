import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

const defaultDatabaseUrl = 'mysql://demo_credit:demo_credit@localhost:3306/demo_credit';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // In dev/test, fall back to a local connection so migrations/seeds can run.
  // In production, require this value.
  DATABASE_URL: z.string().url().default(defaultDatabaseUrl),
  ADJUTOR_BASE_URL: z.string().url().default('https://adjutor.lendsqr.com/v2'),
  // In dev/test, provide a dummy key so the app can boot.
  // In production, require a real key.
  ADJUTOR_API_KEY: z.string().min(1).default('dev_dummy_key'),
  ADJUTOR_BYPASS_ON_FAILURE: z.coerce.boolean().default(false),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120)
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'DATABASE_URL: Required', path: ['DATABASE_URL'] });
    }
    if (!process.env.ADJUTOR_API_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ADJUTOR_API_KEY: Required', path: ['ADJUTOR_API_KEY'] });
    }
  }
});


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`);
}

export const env = parsed.data;
