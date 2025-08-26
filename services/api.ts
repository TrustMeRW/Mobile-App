import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Base response types
export interface ApiResponse<T = any> {
  message: string;
  payload: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Subscription Plan type
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

// User Subscription type
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

// User type
export interface User {
  id: string;
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
  role: 'USER' | 'ADMIN';
  isTrustable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  userSubscription?: UserSubscription;
  trustabilityPercentage?: number;
  totalDebts?: number;
  paidDebts?: number;
  createdAt: string;
  updatedAt: string;
}

// Debt type
export interface Debt {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAID_PENDING_CONFIRMATION' | 'OVERDUE' | 'REJECTED';
  amount: string;
  amountPaid: string;
  paidInstallmentsCount: number;
  initiationType: 'REQUESTED' | 'OFFERED';
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
  issuer: User;
  requester: User;
  payments:any[];items:any[]
}

const BASE_URL = 'http://5.189.134.45:8787/api';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`, response.data);
        return response;
      },
      async (error) => {
        const errorCategory = this.categorizeError(error);
        console.error(`[API] Request failed (${errorCategory}):`, error.response?.data || error.message);
        
        // Handle missing/invalid JWT token - only redirect for authentication-related errors
        if (errorCategory === 'authentication') {
          console.log('[API] Redirecting to login due to authentication error');
          router.replace('/(auth)/login');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Helper method to clean parameters by removing undefined values
  private cleanParams(params?: Record<string, any>): Record<string, string> | undefined {
    if (!params) return undefined;
    
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = String(value);
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  // Helper method to check if an error should trigger login redirect
  private shouldRedirectToLogin(error: any): boolean {
    if (error.response?.status !== 401) return false;
    
    const errorMessage = error.response?.data?.message?.toLowerCase() || '';
    const errorType = error.response?.data?.error?.toLowerCase() || '';
    
    // Only redirect for JWT/token/authentication errors, not for business logic errors
    return (
      errorMessage.includes('jwt') ||
      errorMessage.includes('token') ||
      errorType.includes('jwt') ||
      errorType.includes('token') 
    );
  }

  // Helper method to check if an error is a business logic error
  public isBusinessLogicError(error: any): boolean {
    return this.categorizeError(error) === 'business';
  }

  // Helper method to categorize errors for better handling
  private categorizeError(error: any): 'authentication' | 'business' | 'network' | 'unknown' {
    if (this.shouldRedirectToLogin(error)) {
      return 'authentication';
    }
    
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return 'business';
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return 'network';
    }
    
    return 'unknown';
  }

  // Helper method to extract user-friendly error messages
  public getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  // Auth endpoints
  async login(identifier: string, pin: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/login', {
      identifier,
      pin,
    });
    return response.data;
  }

  async register(userData: any) {
    const response = await this.axiosInstance.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/register', userData);
    return response.data;
  }

  async getProfile() {
    const response = await this.axiosInstance.get<ApiResponse<{
      user: any;
      currentSubscription: any;
      subscriptionStatus: string;
      subscriptionFeatures: any;
      subscriptionDetails: any;
      subscriptionSummary: any;
    }>>('/auth/profile');
    return response.data;
  }

  async changePin(currentPin: string, newPin: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ message: string }>>('/auth/change-pin', {
      currentPin,
      newPin,
    });
    return response.data;
  }

  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  }) {
    const response = await this.axiosInstance.put<ApiResponse<{ user: any }>>('/auth/profile', profileData);
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, newPin: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, newPin });
    return response.data;
  }

  // Debt endpoints
  async requestDebt(otherPartyId: string, items: Array<{ name: string; description: string; quantity: number; amount: number }>, paymentDate: string) {
    const response = await this.axiosInstance.post<ApiResponse<Debt>>('/debt/request', { 
      otherPartyId, 
      initiationType: 'REQUESTED',
      items,
      dueDate:paymentDate 
    });
    return response.data;
  }

  async offerDebt(otherPartyId: string, items: Array<{ name: string; description: string; quantity: number; amount: number }>, paymentDate: string) {
    const response = await this.axiosInstance.post<ApiResponse<Debt>>('/debt/offer', { 
      otherPartyId, 
      initiationType: 'OFFERED',
      items,
      dueDate:paymentDate 
    });
    return response.data;
  }

  async payDebt(id: string, amount: number) {
    const response = await this.axiosInstance.post<ApiResponse<Debt>>(`/debt/${id}/pay`, { amount });
    return response.data;
  }

  async confirmDebtPayment(id: string, pin: string) {
    const response = await this.axiosInstance.post<ApiResponse<Debt>>(`/debt/${id}/confirm-paid`, { pin });
    return response.data;
  }

  async confirmPayment(paymentId: string, pin: string) {
    const response = await this.axiosInstance.post<ApiResponse<{ message: string }>>(`/debt/payment/${paymentId}/confirm`, { pin });
    return response.data;
  }

  async rejectDebt(id: string) {
    const response = await this.axiosInstance.post<ApiResponse<Debt>>(`/debt/${id}/reject`, {});
    return response.data;
  }

  async approveDebt(id: string, pin: string) {
    const response = await this.axiosInstance.post<ApiResponse<Debt>>(`/debt/${id}/approve`, { pin });
    return response.data;
  }

  async createDebt(debtData: { amount: string, dueDate: Date, debtorId: string, creditorId: string }) {
    const response = await this.axiosInstance.post<Debt>('/debts', debtData);
    return response.data;
  }

  // Debt queries
  async getDebtsRequested(params: {
    status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAID_PENDING_CONFIRMATION' | 'OVERDUE';
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    page?: number;
  } = { limit: 10, page: 1 }): Promise<PaginatedResponse<Debt>> {
    // Define the expected response structure
    interface DebtsApiResponsePayload {
      data: Debt[];
      total: number;
      page: number;
      limit: number;
    }
    
    interface DebtsApiResponse {
      message: string;
      payload: DebtsApiResponsePayload;
    }

    try {
      const response = await this.axiosInstance.get<DebtsApiResponse>('/debt/debts-requested', {
        params: { 
          status: params.status,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          limit: params.limit || 10, 
          page: params.page || 1 
        }
      });
      
      // If no response or payload, return default values
      if (!response.data?.payload) {
        console.warn('No payload in getDebtsRequested response');
        return { data: [], total: 0, page: 1, limit: 10 };
      }
      
      // Safely extract values from the payload with proper type checking
      const payload = response.data.payload;
      const data = Array.isArray(payload?.data) ? payload.data : [];
      const total = typeof payload?.total === 'number' ? payload.total : 0;
      const page = typeof payload?.page === 'number' ? payload.page : 1;
      const limit = typeof payload?.limit === 'number' ? payload.limit : 10;
      
      // Return the properly typed PaginatedResponse
      return { data, total, page, limit };
    } catch (error) {
      console.error('Error in getDebtsRequested:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  }

  async getDebtsOffered(params: {
    status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAID_PENDING_CONFIRMATION' | 'OVERDUE';
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    page?: number;
  } = { limit: 10, page: 1 }): Promise<PaginatedResponse<Debt>> {
    // Define the expected response structure
    interface DebtsApiResponsePayload {
      data: Debt[];
      total: number;
      page: number;
      limit: number;
    }
    
    interface DebtsApiResponse {
      message: string;
      payload: DebtsApiResponsePayload;
    }

    try {
      const response = await this.axiosInstance.get<DebtsApiResponse>('/debt/debts-offered', {
        params: { 
          status: params.status,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          limit: params.limit || 10, 
          page: params.page || 1 
        }
      });
      
      // If no response or payload, return default values
      if (!response.data?.payload) {
        console.warn('No payload in getDebtsOffered response');
        return { data: [], total: 0, page: 1, limit: 10 };
      }
      
      // Safely extract values from the payload with proper type checking
      const payload = response.data.payload;
      const data = Array.isArray(payload?.data) ? payload.data : [];
      const total = typeof payload?.total === 'number' ? payload.total : 0;
      const page = typeof payload?.page === 'number' ? payload.page : 1;
      const limit = typeof payload?.limit === 'number' ? payload.limit : 10;
      
      // Return the properly typed PaginatedResponse
      return { data, total, page, limit };
    } catch (error) {
      console.error('Error in getDebtsOffered:', error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  }

  /**
   * Get a specific debt by ID
   * @param id The ID of the debt to fetch
   * @returns The debt details or null if not found
   */
  async getDebtById(id: string): Promise<Debt | null> {
    try {
      if (!id) {
        console.warn('No ID provided to getDebtById');
        return null;
      }

      // Make the API request - the response will be ApiResponse<Debt>
      const response = await this.axiosInstance.get<ApiResponse<Debt>>(`/debt/by-id/${id}`);
      
      // Log the response for debugging
      console.log('getDebtById response:', response.data);
      
      // Check if we have a valid response with payload
      if (!response.data?.payload) {
        console.warn('No payload in getDebtById response');
        return null;
      }

      // Extract the debt data from the response payload
      const debtData = response.data.payload;
      
      // Validate required fields
      if (!debtData.id || !debtData.status || !debtData.amount) {
        console.warn('Invalid debt data in response:', debtData);
        return null;
      }
      
      // Create a default user object to avoid repetition
      const defaultUser: User = {
        id: '',
        firstName: 'Unknown',
        lastName: 'User',
        nationalId: '',
        email: '',
        phoneNumber: '',
        userType: 'CLIENT',
        province: '',
        district: '',
        sector: '',
        cell: '',
        village: '',
        role: 'USER',
        isTrustable: false,
        status: 'INACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create a properly typed debt object with all required fields and fallbacks
      const debt: Debt = {
        id: debtData.id,
        status: debtData.status,
        amount: debtData.amount,
        amountPaid: debtData.amountPaid ?? '0',
        paidInstallmentsCount: debtData.paidInstallmentsCount ?? 0,
        initiationType: debtData.initiationType ?? 'REQUESTED',
        paymentDate: debtData.paymentDate ?? '',
        createdAt: debtData.createdAt ?? new Date().toISOString(),
        updatedAt: debtData.updatedAt ?? new Date().toISOString(),
        issuer: debtData.issuer ?? { ...defaultUser },
        requester: debtData.requester ?? { ...defaultUser },
        payments: debtData.payments ?? [],
        items: debtData.items ?? []
      };
      
      return debt;
      
    } catch (error) {
      console.error('Error in getDebtById:', error);
      return null;
    }
  }

  // User management
  async searchUsers(query: string) {
    const response = await this.axiosInstance.get<ApiResponse<PaginatedResponse<User>>>('/users', {
      params: { search: query }
    });
    return response.data;
  }

  async getUserProfile() {
    const response = await this.axiosInstance.get<ApiResponse<{ user: User }>>('/auth/profile');
    return response.data;
  }

  // Notifications endpoints
  async getNotifications(params?: any) {
    const response = await this.axiosInstance.get<ApiResponse<PaginatedResponse<any>>>('/notifications', {
      params
    });
    return response.data;
  }

  async markNotificationsAsRead(notificationIds: string[]) {
    const response = await this.axiosInstance.put<ApiResponse<any>>('/notifications/mark-as-read', { notificationIds });
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await this.axiosInstance.delete<ApiResponse<any>>(`/notifications/${id}`);
    return response.data;
  }

  // Trustability API
  async getUsersWithCalculatedTrustability(params?: {
    minTrustability?: number;
    maxTrustability?: number;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    const response = await this.axiosInstance.get<ApiResponse<PaginatedResponse<User>>>(
      '/users/trustability/calculated',
      { params }
    );
    return response.data;
  }

  async getUserTrustabilityAnalytics(userId: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/users/${userId}/trustability-analytics`);
    return response.data;
  }

  async getUserTrustabilityAnalyticsByCode(code: string) {
    const response = await this.axiosInstance.get<ApiResponse<any>>(`/users/trustability-analytics/${code}`);
    return response.data;
  }

  async getUserAnalytics(params?: {
    period?: 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'LAST_6_MONTHS' | 'THIS_YEAR' | 'CUSTOM';
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.axiosInstance.get<ApiResponse<any>>('/auth/analytics', { params });
    return response.data;
  }

  // Subscription plans
  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await this.axiosInstance.get<SubscriptionPlan[]>('/subscription-plans');
    return response.data;
  }

  async subscribeToPlan(planId: string): Promise<ApiResponse<any>> {
    const response = await this.axiosInstance.post<ApiResponse<any>>('/subscriptions/subscribe', {
      planId,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();