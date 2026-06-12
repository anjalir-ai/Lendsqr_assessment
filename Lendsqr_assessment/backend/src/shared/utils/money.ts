import { AppError } from '../errors/AppError.js';

const amountPattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

export function toMinorUnits(input: unknown): number {
  const value = typeof input === 'number' ? String(input) : String(input ?? '').trim();
  if (!amountPattern.test(value)) {
    throw new AppError(400, 'Amount must be a positive number with at most two decimal places', 'INVALID_AMOUNT');
  }
  const [whole, fraction = ''] = value.split('.');
  const minor = Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction.padEnd(2, '0') || '0', 10);
  if (!Number.isSafeInteger(minor) || minor <= 0) {
    throw new AppError(400, 'Amount must be greater than zero', 'INVALID_AMOUNT');
  }
  return minor;
}

export function fromMinorUnits(amount: number): string {
  return (amount / 100).toFixed(2);
}
