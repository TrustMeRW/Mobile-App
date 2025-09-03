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
import { ArrowLeft, MapPin, User as UserIcon, Mail, Phone, Search, X, Lock } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { useCurrentUser } from '@/hooks';
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
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
  const { t } = useTranslation();
  const { user } = useCurrentUser();
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
        text1: t('editProfile.success.title'),
        text2: t('editProfile.success.message'),
      });
      // Invalidate profile query to refresh user data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: t('editProfile.error.title'),
        text2: error.message || t('editProfile.error.message'),
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
        title = t('editProfile.location.selectProvince');
        data = rwandaLocations.getProvinces();
        break;
      case 'district':
        if (!formData.province) {
          Toast.show({
            type: 'error',
            text1: t('editProfile.location.error.selectProvinceFirst.title'),
            text2: t('editProfile.location.error.selectProvinceFirst.message'),
          });
          return;
        }
        title = t('editProfile.location.selectDistrict');
        data = rwandaLocations.getDistricts(formData.province);
        break;
      case 'sector':
        if (!formData.province || !formData.district) {
          Toast.show({
            type: 'error',
            text1: t('editProfile.location.error.selectLocationFirst.title'),
            text2: t('editProfile.location.error.selectLocationFirst.message'),
          });
          return;
        }
        title = t('editProfile.location.selectSector');
        data = rwandaLocations.getSectors(formData.province, formData.district);
        break;
      case 'cell':
        if (!formData.province || !formData.district || !formData.sector) {
          Toast.show({
            type: 'error',
            text1: t('editProfile.location.error.selectLocationFirst.title'),
            text2: t('editProfile.location.error.selectLocationFirst.message'),
          });
          return;
        }
        title = t('editProfile.location.selectCell');
        data = rwandaLocations.getCells(formData.province, formData.district, formData.sector);
        break;
      case 'village':
        if (!formData.province || !formData.district || !formData.sector || !formData.cell) {
          Toast.show({
            type: 'error',
            text1: t('editProfile.location.error.selectLocationFirst.title'),
            text2: t('editProfile.location.error.selectLocationFirst.message'),
          });
          return;
        }
        title = t('editProfile.location.selectVillage');
        data = rwandaLocations.getVillages(formData.province, formData.district, formData.sector, formData.cell);
        break;
    }

    // Only open modal if we have data
    if (!data || data.length === 0) {
      Toast.show({
        type: 'error',
        text1: t('editProfile.location.error.noData.title'),
        text2: t('editProfile.location.error.noData.message', { type }),
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
    // Only validate location fields since that's all we're updating
    if (!formData.province || !formData.district || !formData.sector || !formData.cell || !formData.village) {
      Alert.alert(t('editProfile.validation.error.title'), t('editProfile.validation.error.completeLocation'));
      return;
    }

    // Confirm action
    Alert.alert(
      t('editProfile.confirm.title'),
      t('editProfile.confirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('editProfile.confirm.updateButton'),
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
        <Text style={styles.title}>{t('editProfile.title')}</Text>
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
                <UserIcon color={colors.textSecondary} size={20} />
                <Text style={styles.sectionTitle}>{t('editProfile.sections.personalInfo.title')}</Text>
                <View style={styles.readOnlyBadge}>
                  <Lock color={colors.textSecondary} size={14} />
                  <Text style={styles.readOnlyText}>{t('editProfile.sections.personalInfo.readOnly')}</Text>
                </View>
              </View>
              
              <Input
                label={t('editProfile.fields.firstName')}
                placeholder={t('editProfile.fields.firstNamePlaceholder')}
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                style={styles.input}
                editable={false}
              />

              <Input
                label={t('editProfile.fields.lastName')}
                placeholder={t('editProfile.fields.lastNamePlaceholder')}
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                style={styles.input}
                editable={false}
              />

              <Input
                label={t('editProfile.fields.email')}
                placeholder={t('editProfile.fields.emailPlaceholder')}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                editable={false}
              />

              <Input
                label={t('editProfile.fields.phoneNumber')}
                placeholder={t('editProfile.fields.phoneNumberPlaceholder')}
                value={formData.phoneNumber}
                onChangeText={(value) => updateField('phoneNumber', value)}
                keyboardType="phone-pad"
                style={styles.input}
                editable={false}
              />
            </Card>

            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <MapPin color={colors.primary} size={20} />
                <Text style={styles.sectionTitle}>{t('editProfile.sections.location.title')}</Text>
                <View style={styles.editableBadge}>
                  <Text style={styles.editableText}>{t('editProfile.sections.location.editable')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => openLocationModal('province')}
              >
                <Text style={styles.locationButtonLabel}>{t('editProfile.location.province')}</Text>
                <Text style={[styles.locationButtonValue, !formData.province && styles.placeholderText]}>
                  {formData.province || t('editProfile.location.selectProvince')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationButton, !formData.province && styles.disabledButton]}
                onPress={() => openLocationModal('district')}
                disabled={!formData.province}
              >
                <Text style={styles.locationButtonLabel}>{t('editProfile.location.district')}</Text>
                <Text style={[styles.locationButtonValue, !formData.district && styles.placeholderText]}>
                  {formData.district || t('editProfile.location.selectDistrict')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationButton, !formData.district && styles.disabledButton]}
                onPress={() => openLocationModal('sector')}
                disabled={!formData.district}
              >
                <Text style={styles.locationButtonLabel}>{t('editProfile.location.sector')}</Text>
                <Text style={[styles.locationButtonValue, !formData.sector && styles.placeholderText]}>
                  {formData.sector || t('editProfile.location.selectSector')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationButton, !formData.sector && styles.disabledButton]}
                onPress={() => openLocationModal('cell')}
                disabled={!formData.sector}
              >
                <Text style={styles.locationButtonLabel}>{t('editProfile.location.cell')}</Text>
                <Text style={[styles.locationButtonValue, !formData.cell && styles.placeholderText]}>
                  {formData.cell || t('editProfile.location.selectCell')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.locationButton, !formData.cell && styles.disabledButton]}
                onPress={() => openLocationModal('village')}
                disabled={!formData.cell}
              >
                <Text style={styles.locationButtonLabel}>{t('editProfile.location.village')}</Text>
                <Text style={[styles.locationButtonValue, !formData.village && styles.placeholderText]}>
                  {formData.village || t('editProfile.location.selectVillage')}
                </Text>
              </TouchableOpacity>
            </Card>

            <View style={styles.buttonContainer}>
              <Button
                title={t('editProfile.updateButton')}
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
        searchPlaceholder={t('editProfile.location.search', { type: locationModal.type })}
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
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: Typography.fontSize.md,
      fontFamily: 'DMSans-Bold',
      color: colors.text,
      marginLeft: Spacing.sm,
      flex: 1,
    },
    readOnlyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.border,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    readOnlyText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Medium',
      color: colors.textSecondary,
      marginLeft: Spacing.xs,
    },
    editableBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    editableText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: 'DMSans-Medium',
      color: colors.white,
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
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 52,
    },
    searchInput: {
      flex: 1,
      marginLeft: Spacing.sm,
      marginBottom: 0,
      borderWidth: 0,
      height:50
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
