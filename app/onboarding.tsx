import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useOnboardingTranslations, useCommonTranslations } from '@/hooks';
import { MotiView } from 'moti';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const getOnboardingData = (onboarding: any) => [
  {
    id: '1',
    icon: '🏠',
    title: onboarding.step1.title,
    description: onboarding.step1.subtitle,
  },
  {
    id: '2',
    icon: '🔒',
    title: onboarding.step2.title,
    description: onboarding.step2.subtitle,
  },
  {
    id: '3',
    icon: '📱',
    title: onboarding.step3.title,
    description: onboarding.step3.subtitle,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { colors } = useTheme();
  const { setLanguage } = useTranslation();
  const onboarding = useOnboardingTranslations();
  const common = useCommonTranslations();
  const styles = getStyles(colors);
  const router = useRouter();

  // Memoize onboarding data to prevent unnecessary re-renders
  const onboardingData = useMemo(() => getOnboardingData(onboarding), [onboarding]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    await setLanguage('en'); // Set to English by default
    router.replace('/(auth)');
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    await setLanguage('en'); // Set to English by default
    router.replace('/(auth)');
  };

  const renderOnboardingItem = ({ item }: { item: any }) => (
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
            backgroundColor:
              index === currentIndex ? colors.primary : colors.textSecondary,
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
          <Text style={styles.skipText}>{common.skip}</Text>
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
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(newIndex);
        }}
      />

      {renderDots()}

      <View style={styles.buttonContainer}>
        {currentIndex === onboardingData.length - 1 ? (
          <Button title={common.done} onPress={handleGetStarted} />
        ) : (
          <Button title={common.next} onPress={handleNext} />
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    skipText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontFamily: 'DMSans-Medium',
    },
    slide: {
      width,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
    },
    icon: {
      fontSize: 60,
    },
    title: {
      fontSize: 28,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 15,
    },
    description: {
      fontSize: 18,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 20,
    },

    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 5,
    },
    buttonContainer: {
      paddingHorizontal: 30,
      paddingBottom: 40,
    },
  });
