export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  bvn: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bvn?: string;
}
