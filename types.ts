export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  budgetLimit: number; // 0 means no limit
  color: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  userId: string;
  date: string; // ISO string
  description: string;
  photoUrl?: string;
  location?: GeoLocation;
}

export interface BudgetStatus {
  categoryId: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'EXCEEDED';
}
