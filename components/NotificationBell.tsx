import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useWebSocketNotifications } from '@/hooks';
import { MotiView } from 'moti';
import { Bell, BellRing } from 'lucide-react-native';

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  
  const { unreadCount, isConnected } = useWebSocketNotifications();
  const hasUnread = unreadCount > 0;

  const handlePress = () => {
    router.push('/notifications');
  };

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
            <BellRing size={24} color={colors.primary} />
          </MotiView>
        )}
        {!hasUnread && (
          <Bell 
            size={24} 
            color={isConnected ? colors.white : colors.white + '80'} 
          />
        )}
      </MotiView>
      
      {hasUnread && (
        <MotiView
          style={[styles.badge, { backgroundColor: colors.error, borderColor: '#ffffff' }]}
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
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 10,
  },
  badgeTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.xs,
    fontFamily: 'DMSans-Bold',
    textAlign: 'center',
  },
});
