export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
  status: "active" | "inactive" | "suspended";
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  member_count: number;
  total_savings: number;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  term_months: number;
  interest_rate: number;
  status: "pending" | "active" | "paid" | "defaulted";
  application_date: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}
