import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, User, Mail, Phone, Search, X } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { apiClient } from '@/services/api';
import Toast from 'react-native-toast-message';
import { MotiView } from 'moti';
import rwandaLocations from '@/services/location';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
  title: string;
  data: string[];
  searchPlaceholder: string;
}

const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  onClose,
  onSelect,
  title,
  data,
  searchPlaceholder,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const styles = getModalStyles(colors);

  // Ensure data is always an array to prevent filter errors
  const safeData = Array.isArray(data) ? data : [];
  
  const filteredData = safeData.filter(item =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (location: string) => {
    onSelect(location);
    onClose();
    setSearchQuery('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search color={colors.textSecondary} size={20} />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={filteredData}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.locationText}>{item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuthContext();
  const styles = getStyles(colors);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    province: user?.province || '',
    district: user?.district || '',
    sector: user?.sector || '',
    cell: user?.cell || '',
    village: user?.village || '',
  });

  const [locationModal, setLocationModal] = useState<{
    visible: boolean;
    type: 'province' | 'district' | 'sector' | 'cell' | 'village';
    title: string;
  }>({
    visible: false,
    type: 'province',
    title: '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => apiClient.updateProfile(data),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully',
      });
      // Invalidate profile query to refresh user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message || 'Failed to update profile. Please try again.',
      });
    },
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openLocationModal = (type: 'province' | 'district' | 'sector' | 'cell' | 'village') => {
    let title = '';
    let data: string[] = [];

    switch (type) {
      case 'province':
        title = 'Select Province';
        data = rwandaLocations.getProvinces();
        break;
      case 'district':
        if (!formData.province) {
          Toast.show({
            type: 'error',
            text1: 'Select Province First',
            text2: 'Please select a province before selecting a district',
          });
          return;
        }
        title = 'Select District';
        data = rwandaLocations.getDistricts(formData.province);
        break;
      case 'sector':
        if (!formData.province || !formData.district) {
          Toast.show({
            type: 'error',
            text1: 'Select Location First',
            text2: 'Please select province and district before selecting a sector',
          });
          return;
        }
        title = 'Select Sector';
        data = rwandaLocations.getSectors(formData.province, formData.district);
        break;
      case 'cell':
        if (!formData.province || !formData.district || !formData.sector) {
          Toast.show({
            type: 'error',
            text1: 'Select Location First',
            text2: 'Please select province, district, and sector before selecting a cell',
          });
          return;
        }
        title = 'Select Cell';
        data = rwandaLocations.getCells(formData.province, formData.district, formData.sector);
        break;
      case 'village':
        if (!formData.province || !formData.district || !formData.sector || !formData.cell) {
          Toast.show({
            type: 'error',
            text1: 'Select Location First',
            text2: 'Please select province, district, sector, and cell before selecting a village',
          });
          return;
        }
        title = 'Select Village';
        data = rwandaLocations.getVillages(formData.province, formData.district, formData.sector, formData.cell);
        break;
    }

    // Only open modal if we have data
    if (!data || data.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Data Available',
        text2: `No ${type} data found for the selected location`,
      });
      return;
    }

    setLocationModal({
      visible: true,
      type,
      title,
    });
  };

  const handleLocationSelect = (location: string) => {
    const { type } = locationModal;
    updateField(type, location);

    // Clear dependent fields when parent location changes
    if (type === 'province') {
      updateField('district', '');
      updateField('sector', '');
      updateField('cell', '');
      updateField('village', '');
    } else if (type === 'district') {
      updateField('sector', '');
      updateField('cell', '');
      updateField('village', '');
    } else if (type === 'sector') {
      updateField('cell', '');
      updateField('village', '');
    } else if (type === 'cell') {
      updateField('village', '');
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    if (!formData.province || !formData.district || !formData.sector || !formData.cell || !formData.village) {
      Alert.alert('Error', 'Please complete all location fields');
      return;
    }

    // Confirm action
    Alert.alert(
      'Confirm Update',
      'Are you sure you want to update your profile information?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update Profile',
          onPress: () => {
            updateProfileMutation.mutate(formData);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
          >
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <User color={colors.primary} size={20} />
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>
              
              <Input
                label="First Name"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                style={styles.input}
              />

              <Input
                label="Last Name"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                style={styles.input}
              />

              <Input
                label="Email (Optional)"
                placeholder="Enter your email address"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <Input
                label="Phone Number"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChangeText={(value) => updateField('phoneNumber', value)}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </Card>

            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MapPin color={colors.primary} size={20} />
                <Text style={styles.sectionTitle}>Location Information</Text>
              </View>

              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => openLocationModal('province')}
              >
                <Text style={styles.locationButtonLabel}>Province</Text>
                <Text style={[styles.locationButtonValue, !formData.province && styles.placeholderText]}>
                  {formData.province || 'Select province'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationButton, !formData.province && styles.disabledButton]}
                onPress={() => openLocationModal('district')}
                disabled={!formData.province}
              >
                <Text style={styles.locationButtonLabel}>District</Text>
                <Text style={[styles.locationButtonValue, !formData.district && styles.placeholderText]}>
                  {formData.district || 'Select district'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationButton, !formData.district && styles.disabledButton]}
                onPress={() => openLocationModal('sector')}
                disabled={!formData.district}
              >
                <Text style={styles.locationButtonLabel}>Sector</Text>
                <Text style={[styles.locationButtonValue, !formData.sector && styles.placeholderText]}>
                  {formData.sector || 'Select sector'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationButton, !formData.sector && styles.disabledButton]}
                onPress={() => openLocationModal('cell')}
                disabled={!formData.sector}
              >
                <Text style={styles.locationButtonLabel}>Cell</Text>
                <Text style={[styles.locationButtonValue, !formData.cell && styles.placeholderText]}>
                  {formData.cell || 'Select cell'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationButton, !formData.cell && styles.disabledButton]}
                onPress={() => openLocationModal('village')}
                disabled={!formData.cell}
              >
                <Text style={styles.locationButtonLabel}>Village</Text>
                <Text style={[styles.locationButtonValue, !formData.village && styles.placeholderText]}>
                  {formData.village || 'Select village'}
                </Text>
              </TouchableOpacity>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                title="Update Profile"
                onPress={handleSubmit}
                loading={updateProfileMutation.isPending}
                disabled={updateProfileMutation.isPending}
                style={styles.updateButton}
              />
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>

      <LocationModal
        visible={locationModal.visible}
        onClose={() => setLocationModal(prev => ({ ...prev, visible: false }))}
        onSelect={handleLocationSelect}
        title={locationModal.title}
        data={
          locationModal.type === 'province' ? (rwandaLocations.getProvinces() || []) :
          locationModal.type === 'district' ? (rwandaLocations.getDistricts(formData.province) || []) :
          locationModal.type === 'sector' ? (rwandaLocations.getSectors(formData.province, formData.district) || []) :
          locationModal.type === 'cell' ? (rwandaLocations.getCells(formData.province, formData.district, formData.sector) || []) :
          (rwandaLocations.getVillages(formData.province, formData.district, formData.sector, formData.cell) || [])
        }
        searchPlaceholder={`Search ${locationModal.type}...`}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: Spacing.sm,
    },
    title: {
      fontSize: Typography.fontSize.xl,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
    },
    sectionCard: {
      marginBottom: Spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
    },
    input: {
      marginBottom: Spacing.md,
    },
    locationButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    disabledButton: {
      opacity: 0.5,
    },
    locationButtonLabel: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Medium',
      color: colors.text,
    },
    locationButtonValue: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
      flex: 1,
      textAlign: 'right',
      marginLeft: Spacing.sm,
    },
    placeholderText: {
      color: colors.textSecondary,
    },
    buttonContainer: {
      marginTop: Spacing.lg,
    },
    updateButton: {
      width: '100%',
    },
  });

const getModalStyles = (colors: any) =>
  StyleSheet.create({
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    searchInput: {
      flex: 1,
      marginLeft: Spacing.sm,
      marginBottom: 0,
    },
    locationItem: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    locationText: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Regular',
      color: colors.text,
    },
  });
