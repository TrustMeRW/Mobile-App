import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { MotiView } from 'moti';
import { User, Mail, Phone, MapPin, Settings, Shield, LogOut, CreditCard as Edit3, Moon, Sun, Bell } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuthContext();
  const [darkMode, setDarkMode] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.getNotifications({ unreadOnly: true }),
    select: (data) => ({
      ...data,
      data: data.payload?.data || []
    }),
  });

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to sign out?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigate to login screen after successful logout
              // @ts-ignore - expo-router types might not be up to date
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
              Toast.show({
                type: 'error',
                text1: 'Logout Failed',
                text2: 'An error occurred while signing out. Please try again.',
              });
            }
          } 
        },
      ]
    );
  };

  const unreadCount = notifications?.data?.length || 0;

  const profileItems = [
    {
      icon: <Edit3 color={Colors.gray[600]} size={20} />,
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => {},
    },
    {
      icon: <Shield color={Colors.gray[600]} size={20} />,
      title: 'Change PIN',
      subtitle: 'Update your security PIN',
      onPress: () => {},
    },
    {
      icon: <Bell color={Colors.gray[600]} size={20} />,
      title: 'Notifications',
      subtitle: `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`,
      onPress: () => {
        // Navigate to notifications screen
        router.push('/notifications');
      },
    },
    {
      icon: darkMode ? <Sun color={Colors.gray[600]} size={20} /> : <Moon color={Colors.gray[600]} size={20} />,
      title: 'Dark Mode',
      subtitle: darkMode ? 'Switch to light mode' : 'Switch to dark mode',
      onPress: () => setDarkMode(!darkMode),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>

          <Card style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.firstName.charAt(0)}{user?.lastName.charAt(0)}
                </Text>
              </View>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Mail color={Colors.gray[500]} size={20} />
                <Text style={styles.infoText}>{user?.email}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Phone color={Colors.gray[500]} size={20} />
                <Text style={styles.infoText}>{user?.phoneNumber}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <MapPin color={Colors.gray[500]} size={20} />
                <Text style={styles.infoText}>
                  {user?.village}, {user?.cell}, {user?.sector}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.menuCard}>
            {profileItems.map((item, index) => (
              <MotiView
                key={item.title}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 400, delay: index * 100 }}
              >
                <TouchableOpacity
                  onPress={item.onPress}
                  style={styles.menuItem}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      {item.icon}
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            ))}
          </Card>

          <Card style={styles.dangerCard}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut color={Colors.error} size={20} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.version}>Trust Me v1.0.0</Text>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
  },
  profileCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: Colors.white,
  },
  userName: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
  },
  infoSection: {
    width: '100%',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  infoText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: Colors.dark,
    marginLeft: Spacing.md,
    flex: 1,
  },
  menuCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.dark,
  },
  menuSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  dangerCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  logoutText: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
  version: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
});