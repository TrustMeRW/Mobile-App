import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Typography, Spacing } from '@/constants/theme';
import { apiClient } from '@/services/api';
import { MotiView } from 'moti';
import QRCode from 'react-native-qrcode-svg';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  Shield,
  LogOut,
  CreditCard as Edit3,
  Moon,
  Sun,
  Bell,
  BadgeDollarSign,
  QrCode,
  Copy,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme, colors } = useTheme();
  const darkMode = theme === 'dark';
  const styles = getStyles(colors);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.getNotifications({ unreadOnly: true }),
    select: (data) => ({
      ...data,
      data: data.payload?.data || [],
    }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh profile data
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Refresh notifications
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile information has been refreshed',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Failed to refresh profile data',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
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
        },
      },
    ]);
  };

  const unreadCount = notifications?.data?.length || 0;

  const profileItems = [
    {
      icon: <Edit3 color={colors.textSecondary} size={20} />,
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => {
        router.push('/edit-profile');
      },
    },
    {
      icon: <Shield color={colors.textSecondary} size={20} />,
      title: 'Change PIN',
      subtitle: 'Update your security PIN',
      onPress: () => {
        router.push('/change-pin');
      },
    },
    {
      icon: <Bell color={colors.textSecondary} size={20} />,
      title: 'Notifications',
      subtitle: `${unreadCount} unread notification${
        unreadCount !== 1 ? 's' : ''
      }`,
      onPress: () => {
        // Navigate to notifications screen
        router.push('/notifications');
      },
    },
    // Only show Subscriptions for SELLER users
    ...(user?.userType === 'SELLER'
      ? [
          {
            icon: <BadgeDollarSign color={colors.textSecondary} size={20} />,
            title: 'Subscriptions',
            subtitle: 'View available subscription plans',
            onPress: () => {
              // Navigate to subscriptions screen
              router.push('/subscriptions');
            },
          },
        ]
      : []),
    {
      icon: darkMode ? (
        <Sun color={colors.textSecondary} size={20} />
      ) : (
        <Moon color={colors.textSecondary} size={20} />
      ),
      title: 'Dark Mode',
      subtitle: darkMode ? 'Switch to light mode' : 'Switch to dark mode',
      onPress: toggleTheme,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Card style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.firstName.charAt(0)}
                  {user?.lastName.charAt(0)}
                </Text>
              </View>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Mail color={colors.textSecondary} size={20} />
                <Text style={styles.infoText}>{user?.email}</Text>
              </View>

              <View style={styles.infoItem}>
                <Phone color={colors.textSecondary} size={20} />
                <Text style={styles.infoText}>{user?.phoneNumber}</Text>
              </View>

              <View style={styles.infoItem}>
                <User color={colors.textSecondary} size={20} />
                <Text style={styles.infoText}>{user?.nationalId}</Text>
              </View>

              <View style={styles.infoItem}>
                <MapPin color={colors.textSecondary} size={20} />
                <Text style={styles.infoText}>
                  {user?.village}, {user?.cell}, {user?.sector}
                </Text>
              </View>
            </View>
          </Card>

          {/* User Code & QR Code Card */}
          <Card style={styles.qrCodeCard}>
            <View style={styles.qrCodeHeader}>
              <QrCode color={colors.primary} size={24} />
              <Text style={styles.qrCodeTitle}>Your QR Code</Text>
            </View>
            <Text style={styles.qrCodeSubtitle}>
              Share this code with others to connect and create debts
            </Text>

            <View style={styles.qrCodeContent}>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={user?.code || 'default-code'}
                  size={200}
                  color={colors.text}
                  backgroundColor={colors.white}
                />
              </View>

              <View style={styles.codeSection}>
                <Text style={styles.codeLabel}>Your Code</Text>
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>{user?.code || 'N/A'}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => {
                      // Copy to clipboard functionality
                      Toast.show({
                        type: 'success',
                        text1: 'Code Copied',
                        text2: 'Your code has been copied to clipboard',
                      });
                    }}
                  >
                    <Copy color={colors.primary} size={16} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeDescription}>
                  This unique code identifies you in the Trust Me system
                </Text>
                <Text style={styles.codeNote}>
                  Others can scan your QR code or use this code to connect with
                  you
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
                transition={{
                  type: 'timing',
                  duration: 400,
                  delay: index * 100,
                }}
              >
                <TouchableOpacity
                  onPress={item.onPress}
                  style={styles.menuItem}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>{item.icon}</View>
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
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <LogOut color={colors.error} size={20} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.version}>Trust Me v1.0.0</Text>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.text,
    },
    profileCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    avatarContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    avatarText: {
      fontSize: Typography.fontSize.xxxl,
      fontFamily: 'DMSans-Bold',
      color: colors.white,
    },
    userName: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      textAlign: 'center',
    },
    userEmail: {
      fontSize: Typography.fontSize.md,
      color: colors.textSecondary,
      fontFamily: 'DMSans-Regular',
      textAlign: 'center',
    },
    infoSection: {
      width: '100%',
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    infoText: {
      marginLeft: Spacing.md,
      fontSize: Typography.fontSize.md,
      color: colors.text,
      fontFamily: 'DMSans-Regular',
    },
    menuCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuContent: {
      marginLeft: Spacing.md,
    },
    menuTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    menuSubtitle: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
      fontFamily: 'DMSans-Regular',
    },
    dangerCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
    },
    logoutText: {
      marginLeft: Spacing.md,
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.error,
    },
    version: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontFamily: 'DMSans-Regular',
      marginBottom: Spacing.lg,
    },
    qrCodeCard: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    qrCodeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    qrCodeTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.md,
    },
    qrCodeSubtitle: {
      fontSize: Typography.fontSize.md,
      color: colors.textSecondary,
      fontFamily: 'DMSans-Regular',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      textAlign: 'center',
    },
    qrCodeContent: {
      padding: Spacing.lg,
      alignItems: 'center',
      width: '100%',
    },
    qrCodeContainer: {
      width: '100%',
      height: 220,
      borderRadius: 10,
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    codeSection: {
      alignItems: 'center',
      width: '100%',
    },
    codeLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    codeDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
    },
    codeText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginRight: Spacing.sm,
      flex: 1,
      textAlign: 'center',
    },
    copyButton: {
      padding: Spacing.sm,
      backgroundColor: colors.primary + '10',
      borderRadius: 6,
    },
    codeDescription: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
      fontFamily: 'DMSans-Regular',
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
      lineHeight: 20,
    },
    codeNote: {
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
      fontFamily: 'DMSans-Regular',
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
    },
  });
