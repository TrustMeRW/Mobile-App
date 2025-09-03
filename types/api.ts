export interface User {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phoneNumber: string;
  userType: 'CLIENT' | 'SELLER';
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isTrustable: boolean;
  userSubscription?: UserSubscription;
  trustabilityPercentage?: number;
  totalDebts?: number;
  paidDebts?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  amount: string;
  features: {
    maxTrustabilityChecks: number;
    maxDebtsAllowed: number;
    maxDevices: number;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: string;
  durationInDays: number;
  status: 'ACTIVE' | 'INACTIVE';
  features: {
    maxTrustabilityChecks: number;
    maxDebtsAllowed: number;
    maxDevices: number;
  };
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
  debtId: string;
}

export interface TrustabilityAnalytics {
  userId: string;
  fullName: string;
  trustabilityPercentage: number;
  possiblePayments: number;
  completedPayments: number;
  paymentSuccessRate: number;
  paymentPatterns: {
    prefersInstallments: boolean;
    installmentPaymentRate: number;
    averageInstallments: number;
    prefersImmediatePayment: boolean;
    immediatePaymentRate: number;
  };
  recommendedDebtRanges: Array<{
    range: string;
    count: number;
    paymentRate: number;
    averagePaymentPeriod: number;
    isRecommended: boolean;
  }>;
  nonRecommendedDebtRanges: Array<{
    range: string;
    count: number;
    paymentRate: number;
    averagePaymentPeriod: number;
    isRecommended: boolean;
  }>;
  location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  };
  analyzedAt: string;
  accessInfo: {
    subscriptionType: 'FREE' | 'PAID';
    remainingChecks: number;
    maxChecks: number;
    usageRecorded: boolean;
    message: string;
  };
  note: string;
}

export interface TrustabilityAnalyticsResponse {
  message: string;
  payload: TrustabilityAnalytics;
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

// Employment Types
export interface Employment {
  id: string;
  employerId: string;
  employeeId: string;
  title: string;
  description?: string;
  salary?: number;
  paymentType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_RANGE' | 'AFTER_JOB';
  startDate?: string;
  status: 'PENDING' | 'ACTIVE' | 'RESIGNED' | 'TERMINATED' | 'CANCELLED' | 'PENDING_FINISH' | 'FINISHED';
  resignationStatus: 'NONE' | 'PENDING_EMPLOYEE' | 'PENDING_EMPLOYER' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  employer: User;
  employee: User;
  jobPayments?: JobPayment[];
  reports?: EmploymentReport[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmploymentDto {
  employeeId: string;
  title: string;
  description?: string;
  salary?: number;
  paymentType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM_RANGE' | 'AFTER_JOB';
  startDate?: string;
}

export interface EmploymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'PENDING' | 'ACTIVE' | 'RESIGNED' | 'TERMINATED' | 'CANCELLED' | 'PENDING_FINISH' | 'FINISHED';
  resignationStatus?: 'NONE' | 'PENDING_EMPLOYEE' | 'PENDING_EMPLOYER' | 'APPROVED' | 'REJECTED';
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface JobPayment {
  id: string;
  employmentId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'REJECTED';
  paidAt: string | null;
  paidBy: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  paymentNotes: string | null;
  confirmationNotes: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  employment: {
    id: string;
    title: string;
  };
}

export interface EmploymentReport {
  id: string;
  description: string;
  type: 'PAYMENT_ISSUES' | 'NOT_FOLLOWING_JOB_LAWS' | 'STEALING' | 'MISSING' | 'WORK_COMPLETED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reportDate: string;
  createdAt: string;
}

export interface EmploymentAnalytics {
  userId: string;
  fullName: string;
  totalEmployments: number;
  completedEmployments: number;
  averageRating: number;
  reliabilityScore: number;
  workHistory: Array<{
    employmentId: string;
    title: string;
    employer: string;
    duration: string;
    rating: number;
    completed: boolean;
  }>;
  skills: string[];
  availability: {
    isAvailable: boolean;
    preferredWorkTypes: string[];
    preferredPaymentTypes: string[];
  };
  location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  };
  analyzedAt: string;
}