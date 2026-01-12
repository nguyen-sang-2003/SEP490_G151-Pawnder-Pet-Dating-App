import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import {
  getAttributesForFilter,
  AttributeForFilter
} from "../../home/api/attributesApi";
import { saveUserPreferencesBatch } from "../../home/api/preferencesApi";
import { getItem } from "../../../services/storage";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import CustomAlert from "../../../components/CustomAlert";
import { getPendingPolicies } from "../../policy/api/policyApi";
import { enablePolicyCheck } from "../../../services/policyEventEmitter";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "OnboardingPreferences">;

interface ActiveFilter {
  optionId?: number;
  minValue?: number;
  maxValue?: number;
}

const OnboardingPreferencesScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<AttributeForFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<{ [key: number]: ActiveFilter }>({});

  const totalSteps = 4;
  const maxDistanceLimit = 100; // km

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const userIdStr = await getItem('userId');
      if (!userIdStr) {
        showAlert({ type: 'error', title: t('auth.onboarding.error'), message: t('auth.onboarding.userNotFound') });
        return;
      }

      const uid = parseInt(userIdStr, 10);
      setUserId(uid);

      const { attributes: attrs } = await getAttributesForFilter();
      setAttributes(attrs);
    } catch (error: any) {

      showAlert({ type: 'error', title: t('auth.onboarding.error'), message: t('auth.onboarding.loadFailed') });
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (attributeId: number, optionId: number) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      const currentFilter = newFilters[attributeId];

      if (currentFilter?.optionId === optionId) {
        delete newFilters[attributeId];
      } else {
        newFilters[attributeId] = { optionId };
      }
      return newFilters;
    });
  };

  const updateFilterRange = (attributeId: number, field: "minValue" | "maxValue", value: number | undefined) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      const currentFilter = newFilters[attributeId] || {};

      const updatedFilter = {
        ...currentFilter,
        [field]: value,
      };

      if (updatedFilter.minValue === undefined && updatedFilter.maxValue === undefined) {
        delete newFilters[attributeId];
      } else {
        newFilters[attributeId] = updatedFilter;
      }

      return newFilters;
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    // Re-enable policy checks after registration flow
    enablePolicyCheck();
    
    // Bỏ qua trực tiếp đến Home mà không lưu sở thích
    navigation.replace("Home");
  };

  const handleFinish = async () => {
    if (!userId) {
      showAlert({ type: 'error', title: t('auth.onboarding.error'), message: t('auth.onboarding.userNotFound') });
      return;
    }

    try {
      setSaving(true);

      // Filter and prepare preferences
      const preferences = Object.entries(activeFilters)
        .filter(([attributeIdStr, filter]) => {
          const attrId = parseInt(attributeIdStr);
          const attr = attributes.find(a => a.AttributeId === attrId);

          if (filter.optionId !== undefined) return true;
          if (filter.minValue === undefined && filter.maxValue === undefined) return false;

          if (attr?.Name?.toLowerCase() === "khoảng cách") {
            return filter.maxValue !== undefined && filter.maxValue < maxDistanceLimit;
          }

          const maxLimit = attr?.Name?.toLowerCase().includes("cao") ? 100 : 50;
          const min = filter.minValue || 0;
          const max = filter.maxValue || maxLimit;

          if (min === 0 && max === maxLimit) {
            return false;
          }

          return true;
        })
        .map(([attributeId, filter]) => ({
          AttributeId: parseInt(attributeId),
          OptionId: filter.optionId,
          MinValue: filter.minValue,
          MaxValue: filter.maxValue,
        }));

      if (preferences.length > 0) {
        await saveUserPreferencesBatch(userId, preferences);
      }

      // Re-enable policy checks after registration flow is complete
      // This ensures policy modal only shows AFTER user has created pet and set preferences
      enablePolicyCheck();

      // Check for pending policies after registration completion
      try {
        const pendingPolicies = await getPendingPolicies();
        
        if (pendingPolicies && pendingPolicies.length > 0) {
          // Navigate to PolicyAcceptanceScreen with pending policies
          showAlert({
            type: 'success',
            title: t('auth.onboarding.complete'),
            message: preferences.length > 0
              ? t('auth.onboarding.completeWithPrefs', { count: preferences.length })
              : t('auth.onboarding.completeWithoutPrefs'),
            onClose: () => {
              navigation.replace("PolicyAcceptance", {
                pendingPolicies,
                fromRegistration: true,
              });
            },
          });
          return;
        }
      } catch (policyError) {
        // If policy check fails, continue to Home (non-blocking)
        console.warn('Policy check failed:', policyError);
      }

      // No pending policies, navigate to Home
      showAlert({
        type: 'success',
        title: t('auth.onboarding.complete'),
        message: preferences.length > 0
          ? t('auth.onboarding.completeWithPrefs', { count: preferences.length })
          : t('auth.onboarding.completeWithoutPrefs'),
        onClose: () => {
          navigation.replace("Home");
        },
      });
    } catch (error: any) {

      showAlert({
        type: 'error',
        title: t('auth.onboarding.error'),
        message: error.response?.data?.message || t('auth.onboarding.saveFailed')
      });
    } finally {
      setSaving(false);
    }
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.progressStepContainer}>
            <View
              style={[
                styles.progressDot,
                step <= currentStep && styles.progressDotActive,
              ]}
            >
              {step < currentStep ? (
                <Icon name="checkmark" size={12} color="#FFF" />
              ) : (
                <Text style={[styles.progressDotText, step === currentStep && styles.progressDotTextActive]}>
                  {step}
                </Text>
              )}
            </View>
            {step < 4 && (
              <View
                style={[
                  styles.progressLine,
                  step < currentStep && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('auth.onboarding.loading')}</Text>
        </View>
      );
    }

    switch (currentStep) {
      case 1:
        return renderGenderStep();
      case 2:
        return renderAppearanceStep();
      case 3:
        return renderSizeStep();
      case 4:
        return renderDistanceStep();
      default:
        return null;
    }
  };

  const renderGenderStep = () => {
    const genderAttr = attributes.find(a => a.Name?.toLowerCase() === 'giới tính');
    if (!genderAttr || !genderAttr.Options) return null;

    return (
      <View style={styles.stepContainer}>
        <Icon name="male-female" size={60} color={colors.primary} style={styles.stepIcon} />
        <Text style={styles.stepTitle}>{t('auth.onboarding.steps.gender.title')}</Text>
        <Text style={styles.stepSubtitle}>{t('auth.onboarding.steps.gender.subtitle')}</Text>

        <View style={styles.optionsContainer}>
          {genderAttr.Options.map((option) => {
            const isSelected = activeFilters[genderAttr.AttributeId]?.optionId === option.OptionId;
            return (
              <TouchableOpacity
                key={option.OptionId}
                onPress={() => toggleOption(genderAttr.AttributeId, option.OptionId)}
                activeOpacity={0.7}
                style={styles.largeOptionButton}
              >
                <LinearGradient
                  colors={isSelected ? gradients.primary : ["#F5F5F5", "#F5F5F5"]}
                  style={styles.largeOptionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon
                    name={option.Name === 'Đực' ? 'male' : 'female'}
                    size={40}
                    color={isSelected ? '#FFF' : colors.textMedium}
                  />
                  <Text style={[styles.largeOptionText, isSelected && styles.largeOptionTextSelected]}>
                    {option.Name}
                  </Text>
                  {isSelected && (
                    <Icon name="checkmark-circle" size={24} color="#FFF" style={styles.checkIcon} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderAppearanceStep = () => {
    const appearanceAttrs = attributes.filter(
      a => a.TypeValue?.toLowerCase() === 'string' &&
        a.Name?.toLowerCase() !== 'giới tính' &&
        a.Name?.toLowerCase() !== 'loại'
    );

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          <Icon name="color-palette" size={60} color={colors.primary} style={styles.stepIcon} />
          <Text style={styles.stepTitle}>{t('auth.onboarding.steps.appearance.title')}</Text>
          <Text style={styles.stepSubtitle}>{t('auth.onboarding.steps.appearance.subtitle')}</Text>

          {appearanceAttrs.map((attr) => (
            <View key={attr.AttributeId} style={styles.attributeSection}>
              <Text style={styles.attributeLabel}>{attr.Name}</Text>
              <View style={styles.chipsContainer}>
                {attr.Options?.map((option) => {
                  const isSelected = activeFilters[attr.AttributeId]?.optionId === option.OptionId;
                  return (
                    <TouchableOpacity
                      key={option.OptionId}
                      onPress={() => toggleOption(attr.AttributeId, option.OptionId)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={isSelected ? gradients.primary : ["#F5F5F5", "#F5F5F5"]}
                        style={styles.chip}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {isSelected && (
                          <Icon name="checkmark-circle" size={16} color="#FFF" style={styles.chipIcon} />
                        )}
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {option.Name}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderSizeStep = () => {
    const weightAttr = attributes.find(a => a.Name?.toLowerCase() === 'cân nặng');
    const heightAttr = attributes.find(a => a.Name?.toLowerCase() === 'chiều cao');

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stepContainer}>
          <Icon name="resize" size={60} color={colors.primary} style={styles.stepIcon} />
          <Text style={styles.stepTitle}>{t('auth.onboarding.steps.size.title')}</Text>
          <Text style={styles.stepSubtitle}>{t('auth.onboarding.steps.size.subtitle')}</Text>

          {weightAttr && (
            <View style={styles.rangeSection}>
              <Text style={styles.rangeLabel}>{t('auth.onboarding.steps.size.weight')}</Text>
              <View style={styles.rangeInputs}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeInputLabel}>{t('auth.onboarding.steps.size.from')}</Text>
                  <View style={styles.rangeInputWrapper}>
                    <TouchableOpacity
                      onPress={() => {
                        const current = activeFilters[weightAttr.AttributeId]?.minValue || 0;
                        updateFilterRange(weightAttr.AttributeId, 'minValue', Math.max(0, current - 1));
                      }}
                      style={styles.rangeButton}
                    >
                      <Icon name="remove" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.rangeValue}>
                      {activeFilters[weightAttr.AttributeId]?.minValue || 0}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const current = activeFilters[weightAttr.AttributeId]?.minValue || 0;
                        updateFilterRange(weightAttr.AttributeId, 'minValue', Math.min(50, current + 1));
                      }}
                      style={styles.rangeButton}
                    >
                      <Icon name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.rangeSeparator}>→</Text>

                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeInputLabel}>{t('auth.onboarding.steps.size.to')}</Text>
                  <View style={styles.rangeInputWrapper}>
                    <TouchableOpacity
                      onPress={() => {
                        const current = activeFilters[weightAttr.AttributeId]?.maxValue || 50;
                        updateFilterRange(weightAttr.AttributeId, 'maxValue', Math.max(0, current - 1));
                      }}
                      style={styles.rangeButton}
                    >
                      <Icon name="remove" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.rangeValue}>
                      {activeFilters[weightAttr.AttributeId]?.maxValue || 50}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const current = activeFilters[weightAttr.AttributeId]?.maxValue || 50;
                        updateFilterRange(weightAttr.AttributeId, 'maxValue', Math.min(50, current + 1));
                      }}
                      style={styles.rangeButton}
                    >
                      <Icon name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {heightAttr && (
            <View style={styles.rangeSection}>
              <Text style={styles.rangeLabel}>{t('auth.onboarding.steps.size.height')}</Text>
              <View style={styles.rangeInputs}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeInputLabel}>{t('auth.onboarding.steps.size.from')}</Text>
                  <View style={styles.rangeInputWrapper}>
                    <TouchableOpacity
                      onPress={() => {
                        const current = activeFilters[heightAttr.AttributeId]?.minValue || 0;
                        updateFilterRange(heightAttr.AttributeId, 'minValue', Math.max(0, current - 5));
                      }}
                      style={styles.rangeButton}
                    >
                      <Icon name="remove" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.rangeValue}>
                      {activeFilters[heightAttr.AttributeId]?.minValue || 0}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const current = activeFilters[heightAttr.AttributeId]?.minValue || 0;
                        updateFilterRange(heightAttr.AttributeId, 'minValue', Math.min(100, current + 5));
                      }}
                      style={styles.rangeButton}
                    >
                      <Icon name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.rangeSeparator}>→</Text>

                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeInputLabel}>{t('auth.onboarding.steps.size.to')}</Text>
                  <View style={styles.rangeInputWrapper}>
                    <TouchableOpacity
                      onPress={() => {
                        const current = activeFilters[heightAttr.AttributeId]?.maxValue || 100;
                        updateFilterRange(heightAttr.AttributeId, 'maxValue', Math.max(0, current - 5));
                      }}
                      style={styles.rangeButton}
                    >
                      <Icon name="remove" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.rangeValue}>
                      {activeFilters[heightAttr.AttributeId]?.maxValue || 100}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const current = activeFilters[heightAttr.AttributeId]?.maxValue || 100;
                        updateFilterRange(heightAttr.AttributeId, 'maxValue', Math.min(100, current + 5));
                      }}
                      style={styles.rangeButton}
                    >
                      <Icon name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderDistanceStep = () => {
    const distanceAttr = attributes.find(a => a.Name?.toLowerCase() === 'khoảng cách');
    if (!distanceAttr) return null;

    const distances = [5, 10, 15, 25, 50, 100];
    const selectedDistance = activeFilters[distanceAttr.AttributeId]?.maxValue;

    return (
      <View style={styles.stepContainer}>
        <Icon name="location" size={60} color={colors.primary} style={styles.stepIcon} />
        <Text style={styles.stepTitle}>{t('auth.onboarding.steps.distance.title')}</Text>
        <Text style={styles.stepSubtitle}>{t('auth.onboarding.steps.distance.subtitle')}</Text>

        <View style={styles.distanceOptionsContainer}>
          {distances.map((distance) => {
            const isSelected = selectedDistance === distance;
            return (
              <TouchableOpacity
                key={distance}
                onPress={() => updateFilterRange(distanceAttr.AttributeId, 'maxValue', distance)}
                activeOpacity={0.7}
                style={styles.distanceOption}
              >
                <LinearGradient
                  colors={isSelected ? gradients.primary : ["#F5F5F5", "#F5F5F5"]}
                  style={styles.distanceOptionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="navigate" size={24} color={isSelected ? '#FFF' : colors.textMedium} />
                  <Text style={[styles.distanceOptionText, isSelected && styles.distanceOptionTextSelected]}>
                    {distance} km
                  </Text>
                  {isSelected && (
                    <Icon name="checkmark-circle" size={20} color="#FFF" style={styles.checkIconSmall} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#FAFAFA", "#FFFFFF"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>{t('auth.onboarding.skip')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.onboarding.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Icon name="arrow-back" size={24} color={colors.primary} />
              <Text style={styles.backButtonText}>{t('auth.onboarding.back')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            disabled={saving}
            style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={saving ? ["#CCC", "#DDD"] : gradients.primary}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === totalSteps ? t('auth.onboarding.finish') : t('auth.onboarding.continue')}
                  </Text>
                  <Icon name={currentStep === totalSteps ? "checkmark" : "arrow-forward"} size={24} color="#FFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          onConfirm={alertConfig.onConfirm}
          onClose={hideAlert}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 20,
    paddingBottom: 16,
  },
  skipButton: {
    width: 60,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMedium,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
  },
  progressDotTextActive: {
    color: '#FFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMedium,
  },
  scrollContainer: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepIcon: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  largeOptionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.medium,
  },
  largeOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 16,
  },
  largeOptionText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    flex: 1,
  },
  largeOptionTextSelected: {
    color: '#FFF',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  checkIconSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  attributeSection: {
    marginBottom: 24,
  },
  attributeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    ...shadows.small,
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
  },
  chipTextSelected: {
    color: '#FFF',
  },
  rangeSection: {
    marginBottom: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    ...shadows.medium,
  },
  rangeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 16,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
    marginBottom: 8,
  },
  rangeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 8,
  },
  rangeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  rangeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  rangeSeparator: {
    fontSize: 20,
    color: colors.textMedium,
    marginHorizontal: 12,
  },
  distanceOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  distanceOption: {
    width: (width - 64) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.medium,
  },
  distanceOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  distanceOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  distanceOptionTextSelected: {
    color: '#FFF',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  nextButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.large,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default OnboardingPreferencesScreen;

