import type { Transaction, User, Wallet } from '../types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? 'Request failed');
  }
  return payload.data as T;
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  createUser: (body: { firstName: string; lastName: string; email: string; phone?: string; bvn?: string }) =>
    request<{ user: User; token: string }>('/api/v1/users', { method: 'POST', body: JSON.stringify(body) }),
  me: (token: string) => request<{ user: User }>('/api/v1/users/me', {}, token),
  wallet: (token: string) => request<{ wallet: Wallet }>('/api/v1/wallets/me', {}, token),
  fund: (token: string, amount: string) => request<{ wallet: Wallet }>('/api/v1/wallets/fund', { method: 'POST', body: JSON.stringify({ amount }) }, token),
  transfer: (token: string, recipientUserId: string, amount: string, description?: string) =>
    request<{ wallet: Wallet }>('/api/v1/wallets/transfer', { method: 'POST', body: JSON.stringify({ recipientUserId, amount, description }) }, token),
  withdraw: (token: string, amount: string) => request<{ wallet: Wallet }>('/api/v1/wallets/withdraw', { method: 'POST', body: JSON.stringify({ amount }) }, token),
  transactions: (token: string) => request<{ data: Transaction[]; total: number }>('/api/v1/transactions?page=1&limit=20', {}, token)
};
