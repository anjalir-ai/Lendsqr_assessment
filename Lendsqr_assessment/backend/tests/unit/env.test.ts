import { describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';

describe('environment validation', () => {
  it('loads required test environment', () => {
    expect(env.NODE_ENV).toBe('test');
    expect(env.ADJUTOR_API_KEY).toBeTruthy();
  });
});
