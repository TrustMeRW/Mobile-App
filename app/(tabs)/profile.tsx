import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCurrentUser, useLogout, useChangeCode } from '@/hooks';
import { TokenStorage } from '@/utils/tokenStorage';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { ChangeCodeModal } from '@/components/ui/ChangeCodeModal';
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
  UserIcon,
  Globe,
} from 'lucide-react-native';
import { Image } from 'react-native';

export default function ProfileScreen() {
  const { user: currentUser } = useCurrentUser();
  const logoutMutation = useLogout(() => {
    // Navigate to auth screen after successful logout
    router.replace('/(auth)');
  });
  const changeCodeMutation = useChangeCode();
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const styles = getStyles(colors);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangeCodeModal, setShowChangeCodeModal] = useState(false);

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
      showSuccess(t('profile.refresh.success.title'), t('profile.refresh.success.message'));
    } catch (error) {
      showError(t('profile.refresh.error.title'), t('profile.refresh.error.message'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      // Get current token and logout
      const token = await TokenStorage.getAccessToken();
      if (token) {
        setShowLogoutModal(false);
        await logoutMutation.mutateAsync(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
      showError(t('profile.logout.error.title'), t('profile.logout.error.message'));
      setShowLogoutModal(false);
    }
  };

  const handleChangeCode = async (pin: string) => {
    try {
      await changeCodeMutation.mutateAsync(pin);
      setShowChangeCodeModal(false);
      // The hook will handle success message and profile refresh
    } catch (error) {
      console.error('Change code error:', error);
      // Error is handled by the hook
    }
  };

  const unreadCount = notifications?.data?.length || 0;

  const profileItems = [
    {
      icon: <Edit3 color={colors.textSecondary} size={20} />,
      title: t('profile.menu.editProfile'),
      subtitle: t('profile.menu.editProfileSubtitle'),
      onPress: () => {
        router.push('/edit-profile');
      },
    },
    {
      icon: <Shield color={colors.textSecondary} size={20} />,
      title: t('profile.menu.changePin'),
      subtitle: t('profile.menu.changePinSubtitle'),
      onPress: () => {
        router.push('/change-pin');
      },
    },
    {
      icon: <Bell color={colors.textSecondary} size={20} />,
      title: t('profile.menu.notifications'),
      // subtitle: t('profile.menu.notificationsSubtitle'u),
      onPress: () => {
        // Navigate to notifications screen
        router.push('/notifications');
      },
    },
    // {
    //   icon: <Globe color={colors.textSecondary} size={20} />,
    //   title: t('profile.menu.language'),
    //   subtitle: t('profile.menu.languageSubtitle'),
    //   onPress: () => {
    //     router.push('/language-settings');
    //   },
    // },
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
                  {currentUser?.firstName.charAt(0)}
                  {currentUser?.lastName.charAt(0)}
                </Text>
              </View>
              <Text style={styles.userName}>
                {currentUser?.firstName} {currentUser?.lastName}
              </Text>
              <Text style={styles.userEmail}>{currentUser?.email}</Text>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Mail color={colors.textSecondary} size={20} />
                <Text style={styles.infoText}>{currentUser?.email}</Text>
              </View>

              <View style={styles.infoItem}>
                <Phone color={colors.textSecondary} size={20} />
                <Text style={styles.infoText}>{currentUser?.phoneNumber}</Text>
              </View>

              <View style={styles.infoItem}>
                <UserIcon color={colors.textSecondary} size={20} />
                <Text style={styles.infoText}>{currentUser?.nationalId}</Text>
              </View>

              <View style={styles.infoItem}>
                <MapPin color={colors.textSecondary} size={20} />
                <Text style={styles.infoText}>
                  {currentUser?.village}, {currentUser?.cell}, {currentUser?.sector}
                </Text>
              </View>
            </View>
          </Card>

          {/* User Code & QR Code Card */}
          <Card style={styles.qrCodeCard}>
            <View style={styles.qrCodeHeader}>
              <QrCode color={colors.primary} size={24} />
              <Text style={styles.qrCodeTitle}>{t('profile.qrCode.title')}</Text>
            </View>
            <Text style={styles.qrCodeSubtitle}>
              {t('profile.qrCode.subtitle')}
            </Text>

            <View style={styles.qrCodeContent}>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={currentUser?.code || 'default-code'}
                  size={300}
                  color={colors.text}
                  logo={require('@/assets/images/icon.png')}
                  logoBorderRadius={10}
                  backgroundColor={colors.white}            
                />
              </View>

              <View style={styles.codeSection}>
                <Text style={styles.codeLabel}>{t('profile.qrCode.codeLabel')}</Text>
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>{currentUser?.code || 'N/A'}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => {
                      // Copy to clipboard functionality
                      showSuccess(t('profile.qrCode.copySuccess.title'), t('profile.qrCode.copySuccess.message'));
                    }}
                  >
                    <Copy color={colors.primary} size={16} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeDescription}>
                  {t('profile.qrCode.description')}
                </Text>
                <Text style={styles.codeNote}>
                  {t('profile.qrCode.note')}
                </Text>
                
                {/* <TouchableOpacity
                  style={styles.changeCodeButton}
                  onPress={() => setShowChangeCodeModal(true)}
                >
                  <QrCode color={colors.primary} size={16} />
                  <Text style={styles.changeCodeButtonText}>{t('profile.qrCode.changeCode')}</Text>
                </TouchableOpacity> */}
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
              <Text style={styles.logoutText}>{t('profile.logout.button')}</Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.version}>{t('profile.version')}</Text>
        </MotiView>
      </ScrollView>
      <LogoutModal
        isVisible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
      <ChangeCodeModal
        isVisible={showChangeCodeModal}
        onClose={() => setShowChangeCodeModal(false)}
        onConfirm={handleChangeCode}
        isLoading={changeCodeMutation.isPending}
      />
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
      fontSize: Typography.fontSize.sm,
      color: colors.textSecondary,
      fontFamily: 'DMSans-Regular',
    },
    infoSection: {
      width: '100%',
      paddingTop: Spacing.lg,
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
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
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
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    qrCodeTitle: {
      fontSize: Typography.fontSize.md,
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
      height: 300,
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
    changeCodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      borderRadius: 8,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    changeCodeButtonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'DMSans-Medium',
      color: colors.primary,
      marginLeft: Spacing.sm,
    },
  });
