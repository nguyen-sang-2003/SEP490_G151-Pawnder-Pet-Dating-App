import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import CustomAlert from "../../../components/CustomAlert";
import { getAttributes, getAttributeOptions, createPetCharacteristic, updatePetCharacteristic, getPetCharacteristics, completeUserProfile, Attribute, AttributeOption, AIAttributeResult } from "../../../api";
import { getItem } from "../../../services/storage";

type Props = NativeStackScreenProps<RootStackParamList, "AddPetCharacteristics">;

const AddPetCharacteristicsScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { petId, isFromProfile, aiResults, petName, breed, description } = route.params;

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<Record<number, AttributeOption[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [numericValues, setNumericValues] = useState<Record<number, string>>({});
  const [aiFilledAttributes, setAiFilledAttributes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const [existingCharacteristicIds, setExistingCharacteristicIds] = useState<Set<number>>(new Set());
  const [existingCharacteristics, setExistingCharacteristics] = useState<Record<number, { optionValue?: string; value?: number; unit?: string }>>({});

  const isEditingExistingPet = isFromProfile && existingCharacteristicIds.size > 0;

  // Bắt hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isEditingExistingPet, petId, petName, breed, description, isFromProfile, aiResults])
  );

  useEffect(() => {
    if (!petId) {
      showAlert({
        type: 'error',
        title: t('auth.addPet.characteristics.error'),
        message: t('auth.addPet.characteristics.petNotFound'),
        onClose: () => navigation.goBack(),
      });
      return;
    }
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
    try {
      setLoading(true);
      const attrs = await getAttributes();

      const validAttrs = attrs.filter(attr => {
        if (attr.AttributeId == null) return false;
        const name = attr.Name?.toLowerCase() || '';
        if (name.includes('khoảng cách') || name.includes('distance') || name.includes('km')) {
          return false;
        }
        if (name.includes('loại')) {
          return false;
        }
        return true;
      });
      setAttributes(validAttrs);

      const optionsMap: Record<number, AttributeOption[]> = {};
      for (const attr of validAttrs) {
        if (!attr.AttributeId) continue;
        const options = await getAttributeOptions(attr.AttributeId);
        optionsMap[attr.AttributeId] = options;
      }
      setAttributeOptions(optionsMap);

      const tempSelectedOptions: Record<number, number> = {};
      const tempNumericValues: Record<number, string> = {};
      const tempExistingIds = new Set<number>();
      const tempAiFilledIds = new Set<number>();

      if (isFromProfile) {
        try {
          const existingChars = await getPetCharacteristics(petId);
          const tempExistingChars: Record<number, { optionValue?: string; value?: number; unit?: string }> = {};
          
          existingChars.forEach((char: any) => {
            if (char.attributeId) {
              tempExistingIds.add(char.attributeId);
              tempExistingChars[char.attributeId] = {
                optionValue: char.optionValue,
                value: char.value,
                unit: char.unit
              };
            }

            if (char.optionValue && char.attributeId) {
              const options = optionsMap[char.attributeId];
              const option = options?.find(opt => opt.Name === char.optionValue);
              if (option?.OptionId) {
                tempSelectedOptions[char.attributeId] = option.OptionId;
              }
            }
            if (char.value != null && char.attributeId) {
              tempNumericValues[char.attributeId] = char.value.toString();
            }
          });
          
          setExistingCharacteristics(tempExistingChars);
        } catch (error) {
          // Silent fail
        }
      }

      if (aiResults && aiResults.length > 0) {
        aiResults.forEach((aiAttr: AIAttributeResult) => {
          if (!aiAttr.attributeId) return;
          tempAiFilledIds.add(aiAttr.attributeId);

          if (aiAttr.optionId && aiAttr.optionName) {
            tempSelectedOptions[aiAttr.attributeId] = aiAttr.optionId;
          }

          if (aiAttr.value != null) {
            tempNumericValues[aiAttr.attributeId] = aiAttr.value.toString();
          }
        });
      }

      setExistingCharacteristicIds(tempExistingIds);
      setSelectedOptions(tempSelectedOptions);
      setNumericValues(tempNumericValues);
      setAiFilledAttributes(tempAiFilledIds);
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('auth.addPet.characteristics.error'),
        message: t('auth.addPet.characteristics.loadFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Validation ranges cho các thuộc tính của mèo (đồng bộ với Backend)
  const ATTRIBUTE_RANGES: Record<string, { min: number; max: number; unit: string }> = {
    'Cân nặng': { min: 0.5, max: 15, unit: 'kg' },
    'Chiều cao': { min: 15, max: 45, unit: 'cm' },
    'Tuổi': { min: 0, max: 25, unit: 'năm' },
  };

  const validateNumericValues = (): string | null => {
    for (const [attributeId, value] of Object.entries(numericValues)) {
      if (value && value.trim()) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) continue;
        
        const attr = attributes.find(a => a.AttributeId === parseInt(attributeId, 10));
        if (!attr?.Name) continue;
        
        const range = ATTRIBUTE_RANGES[attr.Name];
        if (range && (numValue < range.min || numValue > range.max)) {
          return `${attr.Name} phải từ ${range.min} đến ${range.max} ${range.unit}`;
        }
      }
    }
    return null;
  };

  const handleContinue = async () => {
    // Validate: Kiểm tra tất cả fields phải được điền
    for (const attr of attributes) {
      if (!attr.AttributeId) continue;
      
      const isNumeric = attr.TypeValue === 'float' || attr.TypeValue === 'number';
      
      if (isNumeric) {
        const value = numericValues[attr.AttributeId];
        if (!value || !value.trim()) {
          showAlert({
            type: 'warning',
            title: 'Thiếu thông tin',
            message: `Vui lòng nhập ${attr.Name}`,
          });
          return;
        }
      } else {
        const selectedOption = selectedOptions[attr.AttributeId];
        if (!selectedOption) {
          showAlert({
            type: 'warning',
            title: 'Thiếu thông tin',
            message: `Vui lòng chọn ${attr.Name}`,
          });
          return;
        }
      }
    }

    // Validate numeric values trước khi gửi
    const validationError = validateNumericValues();
    if (validationError) {
      showAlert({
        type: 'error',
        title: t('auth.addPet.characteristics.error'),
        message: validationError,
      });
      return;
    }

    try {
      setSaving(true);

      // Fetch lại existing characteristics để đảm bảo data mới nhất
      let currentExistingIds = new Set<number>(existingCharacteristicIds);
      try {
        const existingChars = await getPetCharacteristics(petId);
        currentExistingIds = new Set(existingChars.map((char: any) => char.attributeId).filter(Boolean));
      } catch (error) {
        // Silent fail - use cached existingCharacteristicIds
      }

      const savePromises: Promise<any>[] = [];

      Object.entries(selectedOptions).forEach(([attributeId, optionId]) => {
        const attrId = parseInt(attributeId, 10);
        // Check nếu đã tồn tại thì update, không thì create
        const shouldUpdate = currentExistingIds.has(attrId);
        const apiFunction = shouldUpdate ? updatePetCharacteristic : createPetCharacteristic;

        savePromises.push(
          apiFunction(petId, attrId, { OptionId: optionId })
        );
      });

      Object.entries(numericValues).forEach(([attributeId, value]) => {
        if (value && value.trim()) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            const attrId = parseInt(attributeId, 10);
            // Check nếu đã tồn tại thì update, không thì create
            const shouldUpdate = currentExistingIds.has(attrId);
            const apiFunction = shouldUpdate ? updatePetCharacteristic : createPetCharacteristic;

            savePromises.push(
              apiFunction(petId, attrId, { Value: numValue })
            );
          }
        }
      });

      await Promise.all(savePromises);

      if (!isFromProfile) {
        try {
          const userIdStr = await getItem('userId');
          if (userIdStr) {
            const userId = parseInt(userIdStr, 10);
            if (!isNaN(userId) && userId > 0) {
              await completeUserProfile(userId);
            }
          }
        } catch (err) {
          // Silent fail
        }
      }

      showAlert({
        type: 'success',
        title: t('auth.addPet.characteristics.success'),
        message: isEditingExistingPet 
          ? t('auth.addPet.characteristics.characteristicsUpdated')
          : t('auth.addPet.characteristics.profileCreated'),
        confirmText: isEditingExistingPet ? t('auth.addPet.characteristics.backToProfile') : t('common.continue'),
        onConfirm: () => {
          if (isEditingExistingPet) {
            navigation.navigate("Profile");
          } else if (isFromProfile) {
            navigation.navigate("Profile");
          } else {
            navigation.replace("OnboardingPreferences");
          }
        },
      });
    } catch (error: any) {
      let errorMessage = isEditingExistingPet 
        ? t('auth.addPet.characteristics.updateFailed')
        : t('auth.addPet.characteristics.saveFailed');

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showAlert({
        type: 'error',
        title: t('auth.addPet.characteristics.error'),
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isEditingExistingPet) {
      // Editing existing pet -> just go back
      navigation.goBack();
    } else {
      // Adding new pet flow -> go back to AddPetPhotos (back giữa các bước)
      navigation.navigate("AddPetPhotos", {
        petId,
        isFromProfile,
        petName,
        breed,
        description,
        aiResults: aiResults,
      });
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={gradients.auth.signup}
        style={[styles.container, styles.centerContent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('auth.addPet.characteristics.loading')}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.auth.signup}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>

          {!isEditingExistingPet && (
            <View style={styles.stepIndicatorContainer}>
              <View style={styles.stepBarsContainer}>
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
                <View style={[styles.stepBar, styles.stepBarActive]} />
              </View>
              <Text style={styles.stepText}>{t('auth.addPet.characteristics.step')}</Text>
            </View>
          )}

          <Text style={styles.title}>
            {isEditingExistingPet ? t('auth.addPet.characteristics.editTitle') : t('auth.addPet.characteristics.title')}
          </Text>
          <Text style={styles.subtitle}>
            {isEditingExistingPet ? t('auth.addPet.characteristics.editSubtitle') : t('auth.addPet.characteristics.subtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          {aiResults && aiResults.length > 0 && (
            <View style={styles.aiBanner}>
              <View style={styles.aiIcon}>
                <Icon name="sparkles" size={20} color={colors.primary} />
              </View>
              <View style={styles.aiBannerContent}>
                <Text style={styles.aiBannerTitle}>{t('auth.addPet.characteristics.aiBanner.title')}</Text>
                <Text style={styles.aiBannerText}>
                  {t('auth.addPet.characteristics.aiBanner.message', { count: aiResults.length })}
                </Text>
              </View>
            </View>
          )}

          {attributes
            .filter((attr) => !!attr.AttributeId)
            .map((attr) => {
            if (!attr.AttributeId) return null;

            const isNumeric = attr.TypeValue === 'float' || attr.TypeValue === 'number';
            const existingChar = existingCharacteristics[attr.AttributeId!];
            const hasExistingValue = isEditingExistingPet && existingChar && (existingChar.optionValue || existingChar.value != null);
            
            return (
              <View key={`attr-${attr.AttributeId}`} style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>
                    {attr.Name || t('fallback.unknown')}
                    {attr.Unit ? ` (${attr.Unit})` : ''}
                  </Text>
                  {aiFilledAttributes.has(attr.AttributeId!) && (
                    <View style={styles.aiBadge}>
                      <Icon name="sparkles" size={12} color={colors.white} />
                      <Text style={styles.aiBadgeText}>{t('auth.addPet.characteristics.aiBadge')}</Text>
                    </View>
                  )}
                </View>
                
                {hasExistingValue && (
                  <View style={styles.currentValueContainer}>
                    <Icon name="checkmark-circle" size={14} color={colors.primary} />
                    <Text style={styles.currentValueLabel}>
                      {t('auth.addPet.characteristics.currentValue')}: 
                    </Text>
                    <Text style={styles.currentValueText}>
                      {existingChar.optionValue || `${existingChar.value}${existingChar.unit ? ' ' + existingChar.unit : ''}`}
                    </Text>
                  </View>
                )}

                {isNumeric ? (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.numericInput}
                      placeholder={t('auth.addPet.characteristics.enterValue', { name: attr.Name?.toLowerCase() || '' })}
                      placeholderTextColor={colors.textLabel}
                      keyboardType="decimal-pad"
                      value={numericValues[attr.AttributeId!] || ''}
                      onChangeText={(text) => {
                        if (attr.AttributeId) {
                          setNumericValues({ ...numericValues, [attr.AttributeId]: text });
                        }
                      }}
                    />
                    {attr.Unit && (
                      <Text style={styles.unitLabel}>{attr.Unit}</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.optionsContainer}>
                    {attributeOptions[attr.AttributeId]?.map((option) => {
                      if (!option.OptionId) return null;
                      const isSelected = selectedOptions[attr.AttributeId!] === option.OptionId;

                      return (
                        <TouchableOpacity
                          key={`option-${option.OptionId}`}
                          style={[
                            styles.optionChip,
                            isSelected && styles.optionChipActive,
                          ]}
                          onPress={() => {
                            if (attr.AttributeId && option.OptionId) {
                              setSelectedOptions({ ...selectedOptions, [attr.AttributeId]: option.OptionId });
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {isSelected && (
                            <Icon name="checkmark-circle" size={16} color={colors.white} style={styles.checkIcon} />
                          )}
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && styles.optionTextActive,
                            ]}
                          >
                            {option.Name || t('fallback.unknown')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Icon name="bulb" size={20} color={colors.primary} />
            </View>
            <Text style={styles.infoText}>
              {t('auth.addPet.characteristics.infoCard')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btnShadow}
            onPress={handleContinue}
            disabled={saving}
          >
            <LinearGradient
              colors={gradients.auth.buttonPrimary}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.buttonText}>{isEditingExistingPet ? t('auth.addPet.characteristics.saveButton') : t('auth.addPet.characteristics.continueButton')}</Text>
                  <Icon name="arrow-forward" size={22} color={colors.white} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          onConfirm={alertConfig.onConfirm}
          showCancel={alertConfig.showCancel}
          cancelText={alertConfig.cancelText}
          onClose={hideAlert}
        />
      )}
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...shadows.small,
  },
  stepIndicatorContainer: {
    marginBottom: 24,
  },
  stepBarsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepBarActive: {
    backgroundColor: colors.primary,
  },
  stepBarInactive: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  stepText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textMedium,
    lineHeight: 24,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: 'rgba(255,107,129,0.1)',
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,107,129,0.2)',
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,129,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 4,
  },
  aiBannerText: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 32,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
    letterSpacing: 0.2,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },
  inputContainer: {
    position: 'relative',
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...shadows.small,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.medium,
  },
  checkIcon: {
    marginRight: 2,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  numericInput: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingRight: 60,
    fontSize: 16,
    color: colors.textDark,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.small,
  },
  unitLabel: {
    position: 'absolute',
    right: 18,
    top: 18,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMedium,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.lg,
    padding: 18,
    marginTop: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,129,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  currentValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,129,0.08)',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  currentValueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  currentValueText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDark,
  },
  btnShadow: {
    marginTop: 8,
    borderRadius: radius.xl,
    ...shadows.large,
  },
  button: {
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.3,
  },
});

export default AddPetCharacteristicsScreen;
