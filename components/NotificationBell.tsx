import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Bell, BellRing } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useNotificationContext } from '@/services/notifications';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { unreadCount, refresh } = useNotificationContext();
  
  const hasUnread = unreadCount > 0;
  
  const handlePress = useCallback(() => {
    router.push('/notifications');
  }, [router]);

  return (
    <TouchableOpacity 
      onPress={handlePress}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MotiView
        from={{ scale: 1, rotate: '0deg' }}
        animate={{ 
          scale: 1,
          rotate: '0deg',
        }}
        exit={{ 
          scale: 1,
          rotate: '0deg',
        }}
        transition={{
          type: 'timing',
          duration: 500,
        }}
      >
        {hasUnread && (
          <MotiView
            from={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: ['0deg', '10deg', '-10deg', '0deg']
            }}
            transition={{
              type: 'timing',
              duration: 500,
              loop: true,
              repeat: 2,
            }}
      >
            <BellRing size={24} color={Colors.primary} />
          </MotiView>
        )}
        {!hasUnread && (
          <Bell size={24} color={Colors.gray[700]} />
        )}
      </MotiView>
      
      {hasUnread && (
        <MotiView
          style={styles.badge}
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <MotiView
            style={styles.badgeTextContainer}
            from={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.2, 1],
            }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
            }}
          >
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </MotiView>
        </MotiView>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
    marginRight: -8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 10,
  },
  badgeTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
});
