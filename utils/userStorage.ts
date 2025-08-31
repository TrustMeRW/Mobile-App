import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '@/services/auth';

const USER_DATA_KEY = 'user_data';
const USER_PROFILE_KEY = 'user_profile';

export interface StoredUserData {
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
  // Add any additional fields that might be needed
  userType?: 'CLIENT' | 'SELLER';
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  role?: 'USER' | 'ADMIN';
  isTrustable?: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export const UserStorage = {
  /**
   * Store user data securely
   */
  async setUserData(userData: StoredUserData): Promise<void> {
    try {
      const userDataString = JSON.stringify(userData);
      await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
      
      // Also store a simplified profile for quick access
      const profile: UserProfile = {
        id: userData.id,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        firstName: userData.firstName,
        lastName: userData.lastName,
        nationalId: userData.nationalId,
        passportNumber: userData.passportNumber,
        profilePicture: userData.profilePicture,
        isVerified: userData.isVerified,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };
      
      const profileString = JSON.stringify(profile);
      await SecureStore.setItemAsync(USER_PROFILE_KEY, profileString);
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  },

  /**
   * Get stored user data
   */
  async getUserData(): Promise<StoredUserData | null> {
    try {
      const userDataString = await SecureStore.getItemAsync(USER_DATA_KEY);
      if (!userDataString) return null;
      
      return JSON.parse(userDataString) as StoredUserData;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Get stored user profile
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileString = await SecureStore.getItemAsync(USER_PROFILE_KEY);
      if (!profileString) return null;
      
      return JSON.parse(profileString) as UserProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  /**
   * Update specific user data fields
   */
  async updateUserData(updates: Partial<StoredUserData>): Promise<void> {
    try {
      const currentData = await this.getUserData();
      if (!currentData) {
        throw new Error('No user data found to update');
      }

      const updatedData = { ...currentData, ...updates };
      await this.setUserData(updatedData);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  },

  /**
   * Clear all stored user data
   */
  async clearUserData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      await SecureStore.deleteItemAsync(USER_PROFILE_KEY);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  },

  /**
   * Check if user data exists
   */
  async hasUserData(): Promise<boolean> {
    try {
      const userData = await this.getUserData();
      return !!userData;
    } catch (error) {
      return false;
    }
  },
};
