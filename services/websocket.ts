import { io, Socket } from 'socket.io-client';
import { TokenStorage } from '@/utils/tokenStorage';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  timestamp: string;
  read: boolean;
}

export interface WebSocketEventData {
  notification: NotificationData;
  unreadCount: number;
  timestamp: string;
}

export interface UnreadCountUpdate {
  unreadCount: number;
  timestamp: string;
}

export interface ConnectionData {
  message: string;
  userId: string;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private onNewNotificationCallback?: (data: WebSocketEventData) => void;
  private onUnreadCountUpdateCallback?: (data: UnreadCountUpdate) => void;
  private onConnectionCallback?: (data: ConnectionData) => void;
  private onDisconnectCallback?: () => void;
  private onErrorCallback?: (error: any) => void;

  async connect(): Promise<void> {
    try {
      const token = await TokenStorage.getAccessToken();
      if (!token) {
        console.warn('No access token found, cannot connect to WebSocket');
        return;
      }

      // Disconnect existing connection if any
      if (this.socket) {
        this.disconnect();
      }

      // Create new socket connection
      this.socket = io('ws://172.20.10.3:4000/notifications', {
        auth: {
          token: token
        },
        transports: ['websocket'],
        timeout: 10000,
        forceNew: true
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.onErrorCallback?.(error);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('connected', (data: ConnectionData) => {
      console.log('WebSocket authenticated:', data);
      this.onConnectionCallback?.(data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.onDisconnectCallback?.();
      
      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.onErrorCallback?.(error);
      this.attemptReconnect();
    });

    // Notification events
    this.socket.on('new-notification', (data: WebSocketEventData) => {
      console.log('New notification received:', data);
      this.onNewNotificationCallback?.(data);
    });

    this.socket.on('unread-count-update', (data: UnreadCountUpdate) => {
      console.log('Unread count updated:', data);
      this.onUnreadCountUpdateCallback?.(data);
    });

    this.socket.on('initial-unread-count', (data: UnreadCountUpdate) => {
      console.log('Initial unread count:', data);
      this.onUnreadCountUpdateCallback?.(data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.onErrorCallback?.(error);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  // Event subscription methods
  onNewNotification(callback: (data: WebSocketEventData) => void): void {
    this.onNewNotificationCallback = callback;
  }

  onUnreadCountUpdate(callback: (data: UnreadCountUpdate) => void): void {
    this.onUnreadCountUpdateCallback = callback;
  }

  onConnection(callback: (data: ConnectionData) => void): void {
    this.onConnectionCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  onError(callback: (error: any) => void): void {
    this.onErrorCallback = callback;
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Emit events (for future use)
  emit(event: string, data?: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Subscribe to specific event types
  subscribeToPaymentEvents(): void {
    this.emit('subscribeToPaymentEvents');
  }

  subscribeToSubscriptionEvents(): void {
    this.emit('subscribeToSubscriptionEvents');
  }

  subscribeToDebtPaymentEvents(): void {
    this.emit('subscribeToDebtPaymentEvents');
  }

  // Unsubscribe from event types
  unsubscribeFromPaymentEvents(): void {
    this.emit('unsubscribeFromPaymentEvents');
  }

  unsubscribeFromSubscriptionEvents(): void {
    this.emit('unsubscribeFromSubscriptionEvents');
  }

  unsubscribeFromDebtPaymentEvents(): void {
    this.emit('unsubscribeFromDebtPaymentEvents');
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
