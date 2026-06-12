export type TransactionType = 'FUND' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'WITHDRAWAL';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface Transaction {
  id: string;
  wallet_id: string;
  related_wallet_id: string | null;
  transfer_group: string | null;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  status: TransactionStatus;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}
