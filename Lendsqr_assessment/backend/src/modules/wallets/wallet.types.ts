export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}
