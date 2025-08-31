import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import AuthLayout from '@/components/AuthLayout';
import LoginTab from '@/app/(auth)/tabs/LoginTab';
import RegisterTab from '@/app/(auth)/tabs/RegisterTab';
import ForgotPasswordTab from '@/app/(auth)/tabs/ForgotPasswordTab';

type AuthTab = 'login' | 'register' | 'forgot-password';

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  const handleSwitchTab = (tab: AuthTab) => {
    setActiveTab(tab);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'login':
        return <LoginTab onSwitchTab={handleSwitchTab} />;
      case 'register':
        return <RegisterTab onSwitchTab={handleSwitchTab} />;
      case 'forgot-password':
        return <ForgotPasswordTab onSwitchTab={handleSwitchTab} />;
      default:
        return <LoginTab onSwitchTab={handleSwitchTab} />;
    }
  };

  return (
    <AuthLayout>
      <View style={styles.container}>
        <MotiView
          key={activeTab}
          from={{ 
            opacity: 0, 
            translateY: 30,
            scale: 0.95
          }}
          animate={{ 
            opacity: 1, 
            translateY: 0,
            scale: 1
          }}
          exit={{ 
            opacity: 0, 
            translateY: -30,
            scale: 0.95
          }}
          transition={{ 
            type: 'spring',
            damping: 20,
            stiffness: 300,
            mass: 0.8
          }}
          style={styles.tabContainer}
        >
          {renderTab()}
        </MotiView>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flex: 1,
  },
});
