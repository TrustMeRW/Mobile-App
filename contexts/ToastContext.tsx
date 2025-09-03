import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { CheckCircle, XCircle, X } from 'lucide-react-native';
import { useTheme } from './ThemeContext';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Individual Toast Component
const ToastItem: React.FC<{
  toast: ToastMessage;
  onHide: (id: string) => void;
  index: number;
}> = ({ toast, onHide, index }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    // Animate out
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          borderColor: '#059669',
          icon: <CheckCircle size={20} color="#ffffff" />,
        };
      case 'error':
        return {
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          icon: <XCircle size={20} color="#ffffff" />,
        };
      default:
        return {
          backgroundColor: '#6b7280',
          borderColor: '#4b5563',
          icon: null,
        };
    }
  };

  const toastStyles = getToastStyles(toast.type);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: toastStyles.backgroundColor,
          borderColor: toastStyles.borderColor,
          transform: [{ translateY }],
          opacity,
          zIndex: 99999 + index,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <View style={styles.toastIcon}>
          {toastStyles.icon}
        </View>
        <View style={styles.toastText}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          {toast.message && (
            <Text style={styles.toastMessage}>{toast.message}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
        >
          <X size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration: number = 4000) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    showToast('success', title, message, duration);
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    showToast('error', title, message, duration);
  }, [showToast]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, hideToast }}>
      {children}
      
      {/* Toast Container - Absolutely positioned at bottom */}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onHide={hideToast}
            index={index}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 99999,
    elevation: 99999,
  },
  toast: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 99999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    marginBottom: 2,
  },
  toastMessage: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
