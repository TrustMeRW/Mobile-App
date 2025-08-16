import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, ArrowLeft, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import {
  lightColors,
  Spacing,
  Typography,
  BorderRadius,
} from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  apiClient,
  type User,
  type ApiResponse,
  type PaginatedResponse,
} from '@/services/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Calendar, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const debtSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  dueDate: z.date(),
  debtorId: z.string().min(1, 'User is required'),
  creditorId: z.string().min(1, 'User is required'),
});

interface UserSearchItem extends User {
  id: string;
}

export default function AddDebtScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthContext();

  const [debtType, setDebtType] = useState<'request' | 'offer'>('request');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalVisible, setUserModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Replace searchUsers with trustability API
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery<
    ApiResponse<PaginatedResponse<User & { trustability: number }>>
  >({
    queryKey: ['users-trustability', searchQuery],
    queryFn: async () => {
      if (!searchQuery)
        return {
          message: '',
          payload: { data: [], total: 0, page: 1, limit: 10 },
        };
      const response = await apiClient.getUsersWithCalculatedTrustability({
        search: searchQuery,
        limit: 20,
      });
      // Filter out current user
      response.payload.data = response.payload.data.filter(
        (u: User) => u.id !== currentUser?.id
      );
      return response;
    },
    enabled: isUserModalVisible && searchQuery.length > 0,
  });
  const users = usersResponse?.payload.data || [];

  const createDebtMutation = useMutation({
    mutationFn: (newDebt: z.infer<typeof debtSchema>) => {
      const { amount, dueDate, debtorId, creditorId } = newDebt;
      if (debtType === 'request') {
        // current user is creditor, selected user is debtor
        return apiClient.requestDebt(
          debtorId,
          Number(amount),
          dueDate.toISOString()
        );
      } else {
        // current user is debtor, selected user is creditor
        return apiClient.offerDebt(
          creditorId,
          Number(amount),
          dueDate.toISOString()
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create debt');
    },
  });

  const handleSubmit = () => {
    const debtData = {
      amount,
      dueDate,
      debtorId:
        debtType === 'offer' ? currentUser?.id ?? '' : selectedUser?.id ?? '',
      creditorId:
        debtType === 'request' ? currentUser?.id ?? '' : selectedUser?.id ?? '',
    };

    const result = debtSchema.safeParse(debtData);
    if (!result.success) {
      const firstError = result.error.issues[0].message;
      Alert.alert('Invalid data', firstError);
      return;
    }

    createDebtMutation.mutate(result.data);
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  // Update renderUserItem to show trustability
  const renderUserItem = ({
    item,
  }: {
    item: User & { trustability?: number };
  }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        setSelectedUser(item);
        setUserModalVisible(false);
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={styles.userName}>
          {item.firstName} {item.lastName}
        </Text>
        {typeof item.trustability === 'number' && (
          <Text style={{ color: colors.primary, fontSize: 14, marginLeft: 8 }}>
            {Math.round(item.trustability)}% Trustable
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <X color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Debt</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.label}>What is this for?</Text>
            <View style={styles.segmentControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  debtType === 'request' && styles.segmentButtonActive,
                ]}
                onPress={() => setDebtType('request')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    debtType === 'request' && styles.segmentTextActive,
                  ]}
                >
                  I Owe Someone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  debtType === 'offer' && styles.segmentButtonActive,
                ]}
                onPress={() => setDebtType('offer')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    debtType === 'offer' && styles.segmentTextActive,
                  ]}
                >
                  Someone Owes Me
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Amount</Text>
            <Input
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>
                {dueDate.toLocaleDateString()}
              </Text>
              <Calendar color={colors.textSecondary} size={20} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <Text style={styles.label}>
              {debtType === 'request' ? 'Who do you owe?' : 'Who owes you?'}
            </Text>
            <TouchableOpacity
              style={styles.userSelectorButton}
              onPress={() => setUserModalVisible(true)}
            >
              <Text style={styles.userSelectorText}>
                {selectedUser
                  ? `${selectedUser.firstName} ${selectedUser.lastName}`
                  : 'Select User'}
              </Text>
              <ChevronDown color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </Card>

          <Button
            title="Create Debt"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={createDebtMutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isUserModalVisible}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a User</Text>
              <TouchableOpacity
                onPress={() => setUserModalVisible(false)}
                style={styles.closeButton}
              >
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {isLoadingUsers ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <Text style={styles.emptyListText}>No users found.</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: typeof lightColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      padding: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: Spacing.md,
    },
    title: {
      fontSize: Typography.fontSize.xxxl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    card: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    segmentControl: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary,
      overflow: 'hidden',
    },
    segmentButton: {
      flex: 1,
      padding: Spacing.md,
      alignItems: 'center',
    },
    segmentButtonActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.primary,
    },
    segmentTextActive: {
      color: colors.white,
    },
    input: {
      marginBottom: Spacing.lg,
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    datePickerText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    userSelectorButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userSelectorText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
    submitButton: {
      marginTop: Spacing.lg,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: Spacing.lg,
      height: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    modalTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    closeButton: {
      padding: Spacing.sm,
    },
    searchInput: {
      marginBottom: Spacing.md,
    },
    userItem: {
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    userName: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    emptyListText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.lg,
      alignItems: 'center',
      marginLeft: Spacing.md,
    },
    selectedIndicator: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.primary,
    },
  });
