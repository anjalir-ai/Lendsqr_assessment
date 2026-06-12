export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  bvn: string | null;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  balanceMajor: string;
  currency: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  status: string;
  description: string | null;
  created_at: string;
}
