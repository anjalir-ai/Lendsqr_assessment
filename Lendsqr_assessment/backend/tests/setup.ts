process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'mysql://demo_credit:demo_credit@localhost:3306/demo_credit_test';
process.env.ADJUTOR_API_KEY = process.env.ADJUTOR_API_KEY ?? 'test-key';
process.env.ADJUTOR_BASE_URL = process.env.ADJUTOR_BASE_URL ?? 'https://adjutor.test';
process.env.ADJUTOR_BYPASS_ON_FAILURE = 'true';
