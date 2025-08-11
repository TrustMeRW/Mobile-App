import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TextInputProps
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, ArrowLeft, Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api';
import { User } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash.debounce';


// Extend the API client types
declare module '@/services/api' {
  interface ApiClient {
    requestDebt: (data: { otherPartyId: string; amount: number; paymentDate?: string }) => Promise<any>;
    offerDebt: (data: { otherPartyId: string; amount: number; paymentDate?: string }) => Promise<any>;
  }
}

export default function AddDebtScreen() {
  const router = useRouter();
  const [debtType, setDebtType] = useState<'request' | 'offer'>('request');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { user: currentUser } = useAuthContext();
  const queryClient = useQueryClient();
  // Debounce search input
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
      }, 300),
    []
  ) as ReturnType<typeof debounce>;

  // Clear debounce on unmount
  React.useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Handle search input changes
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSearchError(null);
    if (selectedUser) {
      setSelectedUser(null);
    }
    debouncedSearch(text);
  };

  // Search users API call
  const { data: searchResults = [], isFetching: isSearchingUsers } = useQuery<User[]>({
    queryKey: ['searchUsers', searchQuery],
    queryFn: async (): Promise<User[]> => {
      if (!searchQuery.trim()) return [];
      try {
        const response = await apiClient.searchUsers(searchQuery);
        // Filter out the current user from search results
        return (response.payload?.data || []).filter((user: User) => user.id !== currentUser?.id);
      } catch (error) {
        console.error('Error searching users:', error);
        return [];
      }
    },
    enabled: searchQuery.trim().length > 1,
  });

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setSearchQuery('');
  };

  const createDebtMutation = useMutation({
    mutationFn: async (debtData: { otherPartyId: string; amount: string; paymentDate?: string }) => {
      const amount = parseFloat(debtData.amount);
      
      if (debtType === 'request') {
        return apiClient.requestDebt(debtData.otherPartyId, amount, debtData.paymentDate);
      } else {
        return apiClient.offerDebt(debtData.otherPartyId, amount, debtData.paymentDate);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Debt ${debtType === 'request' ? 'request' : 'offer'} created successfully!`,
      });
      router.back();
    },
    onError: (error: any) => {
      console.error('Error creating debt:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to create debt. Please try again.',
      });
    },
  });

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item)}
    >
      <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      {item.phoneNumber && <Text style={styles.userPhone}>{item.phoneNumber}</Text>}
    </TouchableOpacity>
  );

  // Handle form submission with validation
  const handleFormSubmit = useCallback(() => {
    if (!selectedUser) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a user',
      });
      return;
    }

    if (!amount) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter an amount',
      });
      return;
    }

    createDebtMutation.mutate({
      otherPartyId: selectedUser.id,
      amount,
      paymentDate: paymentDate || undefined,
    });
  }, [selectedUser, amount, paymentDate, createDebtMutation]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {debtType === 'request' ? 'Request Money' : 'Offer Loan'}
            </Text>
          </View>
          <ScrollView style={styles.content}>
            <Card style={styles.typeSelector}>
              <Text style={styles.sectionTitle}>Debt Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    debtType === 'request' && styles.typeButtonActive,
                  ]}
                  onPress={() => setDebtType('request')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      debtType === 'request' && styles.typeButtonTextActive,
                    ]}
                  >
                    Request Money
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    debtType === 'offer' && styles.typeButtonActive,
                  ]}
                  onPress={() => setDebtType('offer')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      debtType === 'offer' && styles.typeButtonTextActive,
                    ]}
                  >
                    Offer Loan
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>
                {debtType === 'request' ? 'Request from User' : 'Offer to User'}
              </Text>
              <View style={styles.searchContainer}>
                <Search size={20} color={Colors.gray[500]} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a user..."
                  placeholderTextColor={Colors.gray[400]}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
                    <X size={18} color={Colors.gray[500]} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {searchQuery && (
                <View style={styles.usersList}>
                  {isSearchingUsers ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                      <Text style={styles.loadingText}>Searching...</Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.userItem,
                            selectedUser?.id === item.id && styles.userItemSelected
                          ]}
                          onPress={() => handleSelectUser(item)}
                        >
                          <View style={styles.userInfo}>
                            <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
                            <Text style={styles.userEmail}>{item.email}</Text>
                            {item.phoneNumber && <Text style={styles.userPhone}>{item.phoneNumber}</Text>}
                          </View>
                          <View style={styles.userSelectIndicator}>
                            {selectedUser?.id === item.id && <View style={styles.selectedIndicator} />}
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  ) : searchQuery && !isSearchingUsers ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No users found</Text>
                      <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
                    </View>
                  ) : null}
                </View>
              )}

              {selectedUser && (
                <View style={styles.selectedUserContainer}>
                  <View style={styles.selectedUserCard}>
                    <Text style={styles.selectedUserName}>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </Text>
                    <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
                    {selectedUser.phoneNumber && (
                      <Text style={styles.userPhone}>{selectedUser.phoneNumber}</Text>
                    )}
                    <TouchableOpacity 
                      onPress={clearSelection}
                      style={styles.changeUserButton}
                    >
                      <Text style={styles.changeUserText}>Change User</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Card>

            <Card>
              <Input
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                required
              />
              <Input
                label="Due Date (Optional)"
                value={paymentDate}
                onChangeText={setPaymentDate}
                placeholder="YYYY-MM-DD"
              />
              <Button
                title={debtType === 'request' ? 'Request Money' : 'Offer Loan'}
                onPress={handleFormSubmit}
                loading={createDebtMutation.isPending}
                disabled={!selectedUser || !amount}
                style={styles.submitButton}
              />
            </Card>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
    marginLeft: Spacing.md,
  },
  
  // Type Selector
  typeSelector: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.md,
    padding: 2,
    marginTop: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonText: {
    fontFamily: 'DMSans-Medium',
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  typeButtonTextActive: {
    color: Colors.white,
    fontFamily: 'DMSans-Bold',
  },
  
  // Search and User Selection
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.md,
    fontFamily: 'DMSans-Regular',
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  
  // User List
  usersList: {
    maxHeight: 300,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  userItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    backgroundColor: Colors.white,
  },
  userItemSelected: {
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'DMSans-Medium',
    fontSize: Typography.fontSize.md,
    color: Colors.gray[900],
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'DMSans-Regular',
    color: Colors.gray[600],
    marginTop: Spacing.xs,
  },
  userPhone: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: 2,
  },
  userNationalId: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: 2,
  },
  
  // Selected User
  selectedUserContainer: {
    marginTop: Spacing.md,
  },
  selectedUserCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  selectedUserName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'DMSans-Bold',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  selectedUserEmail: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray[600],
    marginBottom: Spacing.sm,
  },
  
  // Buttons
  changeUserButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.sm,
  },
  changeUserText: {
    color: Colors.primary,
    fontFamily: 'DMSans-Medium',
    fontSize: Typography.fontSize.sm,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  
  // Loading and Empty States
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.gray[600],
    fontSize: Typography.fontSize.md,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '500',
    color: Colors.gray[800],
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  
  // Form Elements
  idInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  idInput: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  validateButton: {
    width: 100,
  },
  userSelectIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  selectedIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
  },
});