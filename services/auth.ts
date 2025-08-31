import { apiClient } from './api';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: any;
  message?: string;
}

export interface RegisterRequest {
  phoneNumber: string;
  idCardUpper: string;
  idCardLower: string;
  selfie: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  userId?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  passportNumber?: string;
  profilePicture?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse {
  success: boolean;
  user?: UserProfile;
  message?: string;
}

export class AuthService {
  /**
   * Authenticate user with identifier and password
   */
  static async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.login(data.identifier, data.password);
      return {
        success: true,
        token: response.payload.accessToken,
        refreshToken: response.payload.refreshToken,
        user: response.payload.user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.register(data);
      return {
        success: true,
        message: 'Registration successful',
        userId: response.payload.user?.id,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  }

  /**
   * Request password reset
   */
  static async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiClient.forgotPassword(data.email);
      return {
        success: true,
        message: response.payload.message || 'Password reset link sent',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Password reset request failed',
      };
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const response = await apiClient.resetPassword(data.token, data.newPassword);
      return {
        success: true,
        message: response.payload.message || 'Password reset successful',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Password reset failed',
      };
    }
  }

  /**
   * Validate authentication token
   */
  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      // Note: The API client doesn't have a refresh method, so we'll need to implement this
      // For now, we'll return an error
      return {
        success: false,
        message: 'Token refresh not implemented yet',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Token refresh failed',
      };
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(token: string): Promise<UserProfileResponse> {
    try {
      const response = await apiClient.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return {
        success: true,
        user: response.data.payload?.user || response.data.user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch user profile',
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(token: string): Promise<boolean> {
    try {
      // Note: The API client doesn't have a logout method, so we'll just return true
      // The token clearing is handled by the hook
      return true;
    } catch (error) {
      return false;
    }
  }
}
