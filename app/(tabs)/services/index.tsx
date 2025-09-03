import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { Card } from '@/components/ui/Card';
import { MotiView } from 'moti';
import {
  CreditCard,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function ServicesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const styles = getStyles(colors);

  const services = [
    {
      id: 'debts',
      title: 'Debt Management',
      description: 'Manage your debts, track payments, and monitor debt status',
      icon: CreditCard,
      color: colors.primary,
      route: '/services/debts',
    },
    {
      id: 'employments',
      title: 'Employment Services',
      description: 'Find employment opportunities and manage job applications',
      icon: Briefcase,
      color: colors.success,
      route: '/services/employments',
    },
  ];

  const handleServicePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>Choose a service to get started</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          {/* Services Grid */}
          <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <MotiView
                key={service.id}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ 
                  type: 'timing', 
                  duration: 600,
                  delay: index * 100 
                }}
              >
                <TouchableOpacity
                  style={styles.serviceCard}
                  onPress={() => handleServicePress(service.route)}
                  activeOpacity={0.8}
                >
                  <Card style={styles.card}>
                    <View style={styles.serviceHeader}>
                      <View style={[styles.iconContainer, { backgroundColor: service.color + '15' }]}>
                        <service.icon color={service.color} size={28} />
                      </View>
                      <ArrowRight color={colors.textSecondary} size={20} />
                    </View>
                    
                    <View style={styles.serviceContent}>
                      <Text style={styles.serviceTitle}>{service.title}</Text>
                      <Text style={styles.serviceDescription}>
                        {service.description}
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  servicesGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  serviceCard: {
    
  },
  card: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  serviceDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statsTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginLeft: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Medium',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
