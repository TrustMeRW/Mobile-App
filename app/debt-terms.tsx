import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, Typography } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function DebtTermsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ArrowLeft color={colors.text} size={24} onPress={() => router.back()} />
        <Text style={styles.title}>Debt Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          These Terms & Conditions govern your use of Trust Me's debt-related features, including creating, offering, requesting, approving, and settling debts. By continuing, you acknowledge that you understand and agree to these terms.
        </Text>

        <Text style={styles.sectionTitle}>2. Definitions</Text>
        <Text style={styles.paragraph}>
          - "Debt" means an obligation to pay or deliver value between two registered users. {'\n'}
          - "Creditor" means the user to whom the debt is owed. {'\n'}
          - "Debtor" means the user who owes the debt. {'\n'}
          - "Due Date" means the date by which the debt should be settled.
        </Text>

        <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          You agree to provide accurate information when creating or responding to debts. You are solely responsible for verifying the identity, trustability, and creditworthiness of other users before initiating transactions.
        </Text>

        <Text style={styles.sectionTitle}>4. Creation and Acceptance</Text>
        <Text style={styles.paragraph}>
          A debt may be created as a request or an offer. A debt becomes active only after acceptance by the counterparty. Trust Me records all actions for transparency and dispute resolution.
        </Text>

        <Text style={styles.sectionTitle}>5. Payment and Settlement</Text>
        <Text style={styles.paragraph}>
          Debts should be settled on or before the due date. Late settlements may impact your trustability score. Payment confirmations may require additional verification (e.g., PIN/Password, OTP) for security.
        </Text>

        <Text style={styles.sectionTitle}>6. Disputes</Text>
        <Text style={styles.paragraph}>
          In case of disputes, Trust Me may review available records and take reasonable steps to mediate. However, Trust Me is not a party to the transaction and does not guarantee recovery of funds.
        </Text>

        <Text style={styles.sectionTitle}>7. Prohibited Conduct</Text>
        <Text style={styles.paragraph}>
          You agree not to misuse the platform, including but not limited to creating fraudulent debts, impersonating others, or manipulating trustability metrics. Violations may lead to account suspension.
        </Text>

        <Text style={styles.sectionTitle}>8. Data and Privacy</Text>
        <Text style={styles.paragraph}>
          We process your data in accordance with our Privacy Policy. Debt details may be used to compute trustability and payment rates to help users make informed decisions.
        </Text>

        <Text style={styles.sectionTitle}>9. Liability</Text>
        <Text style={styles.paragraph}>
          Trust Me provides tooling for recording and managing debts but does not assume liability for any loss arising from transactions between users. Use the platform responsibly.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact</Text>
        <Text style={styles.paragraph}>
          For questions about these terms, please contact support via the app's Help section.
        </Text>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    title: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    content: {
      paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    paragraph: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });



