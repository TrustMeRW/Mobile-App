import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useNavigation } from 'expo-router';
import { useNotifications, Notification as NotificationType } from '@/services/notifications';
import { Typography, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { Bell, BellOff, Check, ArrowLeft } from 'lucide-react-native';
import { MotiView } from 'moti';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    refresh, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const handleMarkAsRead = useCallback(async (id: string) => {
    await markAsRead([id]);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const renderNotification = useCallback(({ item }: { item: NotificationType }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title || 'New Notification'}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>
      {!item.read ? (
        <TouchableOpacity 
          onPress={() => handleMarkAsRead(item.id)}
          style={styles.markAsReadButton}
        >
          <Check size={16} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </MotiView>
  ), [handleMarkAsRead, colors.primary]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{
          title: 'Notifications',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      
      {notifications.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <BellOff size={48} color={colors.gray[400]} />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>We'll let you know when something new arrives</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  markAllButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  markAllText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Bold',
    color: '#007bff',
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
    paddingLeft: Spacing.md - 3, // Compensate for border
  },
  notificationContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: '#343a40', // Changed from colors.gray[900] to '#343a40'
    marginBottom: Spacing.xs,
  },
  notificationMessage: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: '#6c757d', // Changed from colors.gray[700] to '#6c757d'
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: '#adb5bd', // Changed from colors.gray[500] to '#adb5bd'
  },
  markAsReadButton: {
    padding: Spacing.xs,
    borderRadius: 16,
    backgroundColor: '#e9ecef', // Changed from colors.gray[100] to '#e9ecef'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    marginTop: Spacing.md,
    color: '#495057', // Changed from colors.gray[700] to '#495057'
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: '#6c757d', // Changed from colors.gray[500] to '#6c757d'
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
