import { describe, expect, it } from 'vitest';
import { fromMinorUnits, toMinorUnits } from '../../src/shared/utils/money.js';

describe('money utilities', () => {
  it('converts decimal strings to minor units safely', () => {
    expect(toMinorUnits('100')).toBe(10000);
    expect(toMinorUnits('100.50')).toBe(10050);
    expect(toMinorUnits('0.01')).toBe(1);
  });

  it('rejects invalid amounts', () => {
    for (const value of ['0', '-1', '1.234', 'abc', 'Infinity', Number.NaN]) {
      expect(() => toMinorUnits(value)).toThrow();
    }
  });

  it('formats minor units for display', () => {
    expect(fromMinorUnits(12345)).toBe('123.45');
  });
});
