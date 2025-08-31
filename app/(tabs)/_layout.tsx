import { Tabs } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { Home, CreditCard, BarChart3, User as UserIcon, Crown } from 'lucide-react-native';
import { AnimatedTabBarIcon } from '@/components/AnimatedTabBarIcon';
import { NotificationBell } from '@/components/NotificationBell';
import { View } from 'react-native';

export default function TabLayout() {
  const { colors } = useTheme();
  const { t, currentLanguage } = useTranslation();

  return (
    <Tabs
      key={currentLanguage} // Force re-render when language changes
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Medium',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              icon={Home}
              size={size}
              color={color}
              isFocused={focused}
            />
          ),
          headerRight: () => (
            <View style={{ marginRight: 15 }}>
              <NotificationBell />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: t('navigation.debts'),
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              icon={CreditCard}
              size={size}
              color={color}
              isFocused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: t('navigation.subscriptions'),
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              icon={Crown}
              size={size}
              color={color}
              isFocused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              icon={UserIcon}
              size={size}
              color={color}
              isFocused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
