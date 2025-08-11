import { createContext, useContext, useState, useEffect, ReactNode, ReactElement } from 'react';
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

  const markAsRead = async (ids: string[]): Promise<boolean> => {
    if (!ids.length) return true;
    
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => 
        ids.includes(n.id) ? { ...n, read: true } : n
      )
    );
    
    const previousUnreadCount = unreadCount;
    const updatedUnreadCount = Math.max(0, unreadCount - ids.length);
    setUnreadCount(updatedUnreadCount);
    
    try {
      // API call - using the correct method signature
      await apiClient.markNotificationsAsRead(ids);
      
      // Refresh to ensure consistency
      await refresh();
      
      return true;
    } catch (error) {
      // Revert on error
      setNotifications(prev => 
        prev.map(n => 
          ids.includes(n.id) ? { ...n, read: false } : n
        )
      );
      setUnreadCount(previousUnreadCount);
      console.error('Failed to mark notifications as read:', error);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return true;
    
    const unreadIds = unreadNotifications.map(n => n.id);
    return markAsRead(unreadIds);
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
