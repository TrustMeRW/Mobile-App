import { Tabs } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, CreditCard, User, BadgeDollarSign } from 'lucide-react-native';
import { AnimatedTabBarIcon } from '@/components/AnimatedTabBarIcon';
import { NotificationBell } from '@/components/NotificationBell';
import { View } from 'react-native';

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
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
          title: 'Home',
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
          title: 'Debts',
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
          href: "/(tabs)/subscriptions",
          title: 'Subscriptions',
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              icon={BadgeDollarSign}
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
          title: 'Profile',
          tabBarIcon: ({ size, color, focused }) => (
            <AnimatedTabBarIcon
              icon={User}
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
