import { createContext, useContext, useState, useEffect, useCallback, ReactNode, ReactElement } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api';

export interface NotificationMetadata {
  debtId?: string;
  debtAmount?: number;
  issuerName?: string;
  requesterName?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    [key: string]: unknown;
  };
}

interface PaginatedNotificationResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

interface NotificationContextType {
  unreadCount: number;
  refresh: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refresh: async () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = async (): Promise<void> => {
    try {
      const response = await apiClient.getNotifications({ 
        limit: 1,
        page: 1,
        unreadOnly: true
      });
      
      // Update the unread count based on the response
      if (response?.payload) {
        setUnreadCount(response.payload.total || 0);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    void refresh();
  }, []);

  const contextValue: NotificationContextType = {
    unreadCount,
    refresh,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  });

  const queryClient = useQueryClient();



  const fetchNotifications = async (page = 1, limit = 20, isRefresh = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    if (isRefresh) {
      setIsRefreshing(true);
    }
    
    setError(null);
    
    try {
      const response = await apiClient.getNotifications({ 
        limit,
        page,
        unreadOnly: false,
      });
      
      if (response?.payload) {
        const { data, total, page: currentPage } = response.payload;
        
        // Calculate unread count from the data if not provided in the response
        const newUnreadCount = 'unreadCount' in response.payload 
          ? (response.payload as any).unreadCount 
          : data.filter((n: Notification) => !n.read).length;
        
        setNotifications(prev => {
          // If refreshing or first page, replace the list, otherwise append
          return isRefresh || currentPage === 1 
            ? [...data] 
            : [...prev, ...data];
        });
        
        setUnreadCount(newUnreadCount);
        setPagination(prev => ({
          ...prev,
          page: currentPage,
          total,
          hasMore: (currentPage * limit) < total,
        }));
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch notifications');
      setError(error);
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMore = () => {
    if (isLoading || !pagination.hasMore) return;
    fetchNotifications(pagination.page + 1, pagination.limit);
  };

  const refresh = async () => {
    await fetchNotifications(1, pagination.limit, true);
  };

  const markAsRead = async (notificationIds: string[]): Promise<boolean> => {
    try {
      // Mark each notification as read individually
      await Promise.all(
        notificationIds.map(id => apiClient.markNotificationAsRead(id))
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Update unread count
      const markedCount = notificationIds.filter(id => 
        notifications.find(n => n.id === id && !n.read)
      ).length;
      setUnreadCount(prev => Math.max(0, prev - markedCount));
      
      // Refetch unread count from API to ensure accuracy
      try {
        const unreadCountResponse = await apiClient.getUnreadNotificationCount();
        setUnreadCount(unreadCountResponse.unreadCount);
        
        // Also invalidate the WebSocket unread count query to trigger a refetch
        queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
      } catch (countError) {
        console.warn('Failed to refetch unread count:', countError);
        // Keep the local count if API call fails
      }
      
      return true;
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    try {
      await apiClient.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      // Refetch unread count from API to ensure accuracy
      try {
        const unreadCountResponse = await apiClient.getUnreadNotificationCount();
        setUnreadCount(unreadCountResponse.unreadCount);
        
        // Also invalidate the WebSocket unread count query to trigger a refetch
        queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
      } catch (countError) {
        console.warn('Failed to refetch unread count:', countError);
        // Keep the local count if API call fails
      }
      
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    try {
      await apiClient.deleteNotification(id);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  };

  // Auto-mark notifications as read after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length > 0) {
        const timer = setTimeout(() => {
          const unreadIds = unreadNotifications.map(n => n.id);
          markAsRead(unreadIds);
        }, 5000); // 5 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    pagination,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

export default useNotifications;
