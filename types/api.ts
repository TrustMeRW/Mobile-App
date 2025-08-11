export interface User {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phoneNumber: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isTrustable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  email: string;
  pin: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phoneNumber: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  pin: string;
}

export interface Debt {
  id: string;
  requesterId: string;
  issuerId: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'PAID_PENDING_CONFIRMATION' | 'REJECTED' | 'OVERDUE';
  initiationType: 'REQUESTED' | 'OFFERED';
  requester: User;
  issuer: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtDto {
  requesterId: string;
  issuerId: string;
  amount: number;
  paymentDate?: string;
  initiationType: 'REQUESTED' | 'OFFERED';
}

export interface PayDebtDto {
  amount: number;
  paymentMethod: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}