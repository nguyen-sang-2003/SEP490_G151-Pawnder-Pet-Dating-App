import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
  const { petId, isFromProfile, aiResults } = route.params;

  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<Record<number, AttributeOption[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [numericValues, setNumericValues] = useState<Record<number, string>>({});
  const [aiFilledAttributes, setAiFilledAttributes] = useState<Set<number>>(new Set()); // Track AI-filled fields
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  // Track which characteristics already exist (for UPDATE vs CREATE decision)
  const [existingCharacteristicIds, setExistingCharacteristicIds] = useState<Set<number>>(new Set());
  
  // Store existing characteristics for display (optionValue and value)
  const [existingCharacteristics, setExistingCharacteristics] = useState<Record<number, { optionValue?: string; value?: number; unit?: string }>>({});

  // Determine if this is "editing existing pet" vs "adding new pet"
  // Only true when editing from profile AND pet has existing characteristics saved
  const isEditingExistingPet = isFromProfile && existingCharacteristicIds.size > 0;

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

      // Filter out invalid attributes and distance-related attributes (those are user preferences, not pet characteristics)
      const validAttrs = attrs.filter(attr => {
        if (attr.AttributeId == null) return false;

        // Filter out distance/range attributes - these are user preferences, not pet characteristics
        const name = attr.Name?.toLowerCase() || '';
        if (name.includes('khoảng cách') || name.includes('distance') || name.includes('km')) {
          return false;
        }

        return true;
      });
      setAttributes(validAttrs);

      // Load options for each attribute
      const optionsMap: Record<number, AttributeOption[]> = {};
      for (const attr of validAttrs) {
        if (!attr.AttributeId) continue;

        const options = await getAttributeOptions(attr.AttributeId);
        optionsMap[attr.AttributeId] = options;
      }
      setAttributeOptions(optionsMap);

      // Pre-fill from AI results or existing characteristics
      const tempSelectedOptions: Record<number, number> = {};
      const tempNumericValues: Record<number, string> = {};
      const tempExistingIds = new Set<number>();
      const tempAiFilledIds = new Set<number>();

      // If editing from profile, load existing characteristics
      if (isFromProfile) {
        try {
          const existingChars = await getPetCharacteristics(petId);
          const tempExistingChars: Record<number, { optionValue?: string; value?: number; unit?: string }> = {};
          
          existingChars.forEach((char: any) => {
            if (char.attributeId) {
              tempExistingIds.add(char.attributeId);
              
              // Store existing values for display
              tempExistingChars[char.attributeId] = {
                optionValue: char.optionValue,
                value: char.value,
                unit: char.unit
              };
            }

            if (char.optionValue && char.attributeId) {
              // Find the option by name
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

      // Pre-fill from AI results (if available)
      if (aiResults && aiResults.length > 0) {
        aiResults.forEach((aiAttr: AIAttributeResult) => {
          if (!aiAttr.attributeId) return;

          // Mark as AI-filled
          tempAiFilledIds.add(aiAttr.attributeId);

          // Fill option-based attributes
          if (aiAttr.optionId && aiAttr.optionName) {
            tempSelectedOptions[aiAttr.attributeId] = aiAttr.optionId;
          }

          // Fill numeric attributes
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

  const handleContinue = async () => {
    try {
      setSaving(true);

      const savePromises: Promise<any>[] = [];

      // Save selected options (string types)
      Object.entries(selectedOptions).forEach(([attributeId, optionId]) => {
        const attrId = parseInt(attributeId, 10);
        const shouldUpdate = isFromProfile && existingCharacteristicIds.has(attrId);
        const apiFunction = shouldUpdate ? updatePetCharacteristic : createPetCharacteristic;

        savePromises.push(
          apiFunction(petId, attrId, { OptionId: optionId })
        );
      });

      // Save numeric values (number types)
      Object.entries(numericValues).forEach(([attributeId, value]) => {
        if (value && value.trim()) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            const attrId = parseInt(attributeId, 10);
            const shouldUpdate = isFromProfile && existingCharacteristicIds.has(attrId);
            const apiFunction = shouldUpdate ? updatePetCharacteristic : createPetCharacteristic;

            savePromises.push(
              apiFunction(petId, attrId, { Value: numValue })
            );
          }
        }
      });

      await Promise.all(savePromises);

      // Complete profile after characteristics
      if (!isFromProfile) {
        try {
          const userIdStr = await getItem('userId');

          if (userIdStr) {
            const userId = parseInt(userIdStr, 10);

            if (isNaN(userId) || userId <= 0) {
              throw new Error('Invalid userId');
            }

            await completeUserProfile(userId);
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
        onClose: () => {
          if (isEditingExistingPet) {
            // Editing existing pet → go back to profile
            navigation.navigate("Profile");
          } else if (isFromProfile) {
            // Adding new pet from profile → go back to profile
            navigation.navigate("Profile");
          } else {
            // Adding new pet during registration → go to onboarding
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
      // Editing from EditPetScreen → just go back (pop from stack)
      navigation.goBack();
    } else {
      // Adding new pet flow → go back to AddPetPhotos
      navigation.navigate("AddPetPhotos", {
        petId,
        isFromProfile,
        aiResults: aiResults, // Truyền kết quả AI hiện tại để giữ lại
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>

          {/* Step Indicator - Show when adding new pet (step 3), hide when editing existing */}
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

        {/* Form */}
        <View style={styles.form}>
          {/* AI Success Banner */}
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

          {/* Dynamic Attributes - Show ALL attributes for both add and edit */}
          {attributes
            .filter((attr) => {
              // Only filter out invalid attributes
              if (!attr.AttributeId) return false;
              
              // Always show ALL attributes - for both adding new pet and editing existing pet
              // This allows users to see which ones are filled and fill in missing ones
              return true;
            })
            .map((attr) => {
            if (!attr.AttributeId) return null;

            // Check if this is a numeric input (float/number type)
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
                
                {/* Show current value when editing */}
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
                  // Numeric Input
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
                  // Option Selection - Chips
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

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Icon name="bulb" size={20} color={colors.primary} />
            </View>
            <Text style={styles.infoText}>
              {t('auth.addPet.characteristics.infoCard')}
            </Text>
          </View>

          {/* Buttons */}
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

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
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

  // Header
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

  // Form
  form: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // AI Banner
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

  // Input Container
  inputContainer: {
    position: 'relative',
  },

  // Option Chips
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

  // Numeric Input
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

  // Info Card
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

  // Current Value Display (when editing)
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

  // Buttons
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
  skipBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: colors.textMedium,
    textDecorationLine: "underline",
  },
});

export default AddPetCharacteristicsScreen;
