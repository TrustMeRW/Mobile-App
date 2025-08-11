import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Track Your Debts',
    description: 'Keep track of money you owe and money owed to you in one simple app.',
    icon: '💰',
  },
  {
    id: '2',
    title: 'Secure & Trustworthy',
    description: 'Built with security in mind. Your financial data is safe and encrypted.',
    icon: '🔒',
  },
  {
    id: '3',
    title: 'Stay Connected',
    description: 'Get notified when debts are due and when payments are received.',
    icon: '🔔',
  },
  {
    id: '4',
    title: 'Ready to Start?',
    description: 'Join thousands of users who trust us with their financial relationships.',
    icon: '🚀',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const renderOnboardingItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.slide}>
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 600 }}
        style={styles.iconContainer}
      >
        <Text style={styles.icon}>{item.icon}</Text>
      </MotiView>
      
      <MotiView
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 200 }}
      >
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </MotiView>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => (
        <MotiView
          key={index}
          animate={{
            backgroundColor: index === currentIndex ? Colors.primary : Colors.gray[300],
            scale: index === currentIndex ? 1.2 : 1,
          }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.dot}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderOnboardingItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
      />

      {renderDots()}

      <View style={styles.buttonContainer}>
        {currentIndex === onboardingData.length - 1 ? (
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            style={styles.button}
          />
        ) : (
          <Button
            title="Next"
            onPress={handleNext}
            style={styles.button}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  skipText: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray[500],
    fontFamily: 'DMSans-Medium',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  button: {
    width: '100%',
  },
});