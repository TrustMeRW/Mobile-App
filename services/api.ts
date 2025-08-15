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

// User type
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
  role: 'USER' | 'ADMIN';
  isTrustable: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
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
}

const BASE_URL = 'https://trustme-xxko.onrender.com/api';

class ApiClient {
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const headers = await this.getHeaders();
      const url = `${BASE_URL}${endpoint}`;
      
      console.log(`[API] ${options.method || 'GET'} ${url}`, {
        headers,
        body: options.body ? JSON.parse(options.body as string) : undefined,
      });
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...options.headers,
        },
      });

      const responseData = await response.json().catch(() => ({}));
      
      console.log(`[API] ${options.method || 'GET'} ${url} - Status: ${response.status}`, responseData);

      if (!response.ok) {
        const errorMessage = responseData?.message || 
                           responseData?.error || 
                           `HTTP error! status: ${response.status}`;
        console.error('[API] Request failed:', errorMessage);
        // Handle missing/invalid JWT token
        if (
          errorMessage.toLowerCase().includes('jwt') ||
          errorMessage.toLowerCase().includes('token') ||
          errorMessage.toLowerCase().includes('unauthorized')
        ) {
          // Optionally clear the token here if needed
          // await SecureStore.deleteItemAsync('access_token');
          router.replace('/(auth)/login');
        }
        throw new Error(errorMessage);
      }

      // Return the entire response data, which should match the expected type T
      return responseData as T;
    } catch (error) {
      console.error('[API] Request failed:', error);
      throw error;
    }
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

  // Generic HTTP methods with type safety
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const cleanedParams = this.cleanParams(params);
    const query = cleanedParams ? `?${new URLSearchParams(cleanedParams).toString()}` : '';
    return this.request<ApiResponse<T>>(`${endpoint}${query}`, { method: 'GET' });
  }

  // Method for endpoints that return data directly (not wrapped in ApiResponse)
  async getDirect<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const cleanedParams = this.cleanParams(params);
    const query = cleanedParams ? `?${new URLSearchParams(cleanedParams).toString()}` : '';
    return this.request<T>(`${endpoint}${query}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<ApiResponse<T>>(`${endpoint}${query}`, { method: 'DELETE' });
  }

  // Auth endpoints
  async login(identifier: string, pin: string) {
    return this.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
      identifier,
      pin,
    });
  }

  async register(userData: any) {
    return this.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', userData);
  }

  // User endpoints

  // Debt endpoints - Using the generic post method for consistency

  async getProfile() {
    return this.request<ApiResponse<any>>('/auth/profile');
  }

  async forgotPassword(email: string) {
    return this.request<ApiResponse<any>>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPin: string) {
    return this.request<ApiResponse<any>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPin }),
    });
  }

  // Debt endpoints
  async requestDebt(otherPartyId: string, amount: number, paymentDate?: string) {
    return this.post<ApiResponse<Debt>>('/debt/request', { otherPartyId, amount, paymentDate });
  }

  async offerDebt(otherPartyId: string, amount: number, paymentDate?: string) {
    return this.post<ApiResponse<Debt>>('/debt/offer', { otherPartyId, amount, paymentDate });
  }

  async payDebt(id: string, amount: number, paymentMethod: string) {
    return this.post<ApiResponse<Debt>>(`/debt/${id}/pay`, { amount, paymentMethod });
  }

  async confirmDebtPayment(id: string, pin: string) {
    return this.post<ApiResponse<Debt>>(`/debt/${id}/confirm-paid`, { pin });
  }

  async rejectDebt(id: string) {
    return this.post<ApiResponse<Debt>>(`/debt/${id}/reject`, {});
  }

  async approveDebt(id: string, pin: string) {
    return this.post<ApiResponse<Debt>>(`/debt/${id}/approve`, { pin });
  }

  async createDebt(debtData: { amount: string, dueDate: Date, debtorId: string, creditorId: string }) {
    return this.post<Debt>('/debts', debtData);
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
      const response = await this.get<DebtsApiResponse>(
        '/debt/debts-requested',
        { 
          status: params.status,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          limit: params.limit || 10, 
          page: params.page || 1 
        }
      );
      
      // If no response or payload, return default values
      if (!response?.payload) {
        console.warn('No payload in getDebtsRequested response');
        return { data: [], total: 0, page: 1, limit: 10 };
      }
      
      // Safely extract values from the payload with proper type checking
      const payload = (response as unknown as { payload: DebtsApiResponsePayload }).payload;
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
      const response = await this.get<DebtsApiResponse>(
        '/debt/debts-offered',
        { 
          status: params.status,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          limit: params.limit || 10, 
          page: params.page || 1 
        }
      );
      
      // If no response or payload, return default values
      if (!response?.payload) {
        console.warn('No payload in getDebtsOffered response');
        return { data: [], total: 0, page: 1, limit: 10 };
      }
      
      // Safely extract values from the payload with proper type checking
      const payload = (response as unknown as { payload: DebtsApiResponsePayload }).payload;
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
      const response = await this.get<Debt>(`/debt/by-id/${id}`);
      
      // Log the response for debugging
      console.log('getDebtById response:', response);
      
      // Check if we have a valid response with payload
      if (!response?.payload) {
        console.warn('No payload in getDebtById response');
        return null;
      }

      // Extract the debt data from the response payload
      const debtData = response.payload;
      
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
        requester: debtData.requester ?? { ...defaultUser }
      };
      
      return debt;
      
    } catch (error) {
      console.error('Error in getDebtById:', error);
      return null;
    }
  }

  // User management
  async searchUsers(query: string) {
    return this.get<PaginatedResponse<User>>('/users', { search: query });
  }

  async getUserProfile() {
    return this.get<{ user: User }>('/auth/profile');
  }

  // Notifications endpoints
  async getNotifications(params?: any) {
    return this.get<PaginatedResponse<any>>('/notifications', params);
  }

  async markNotificationsAsRead(notificationIds: string[]) {
    return this.put<ApiResponse<any>>('/notifications/mark-as-read', { notificationIds });
  }

  async deleteNotification(id: string) {
    return this.delete<ApiResponse<any>>(`/notifications/${id}`);
  }

  // Trustability API
  async getUsersWithCalculatedTrustability(params?: {
    minTrustability?: number;
    maxTrustability?: number;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    return this.get<PaginatedResponse<User & { trustability: number }>>(
      '/users/trustability/calculated',
      params
    );
  }
}

export const apiClient = new ApiClient();