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
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import CustomAlert from "../../../components/CustomAlert";
import { getAttributes, getAttributeOptions, createPetCharacteristic, updatePetCharacteristic, getPetCharacteristics, Attribute, AttributeOption } from "../../../api";

type Props = NativeStackScreenProps<RootStackParamList, "AddPetCharacteristics">;

const AddPetCharacteristicsScreen = ({ navigation, route }: Props) => {
  const { petId, isFromProfile } = route.params;
  
  console.log('AddPetCharacteristicsScreen - petId:', petId, 'isFromProfile:', isFromProfile);
  
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<Record<number, AttributeOption[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [numericValues, setNumericValues] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  
  // Track which characteristics already exist (for UPDATE vs CREATE decision)
  const [existingCharacteristicIds, setExistingCharacteristicIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!petId) {
      console.error('ERROR: petId is undefined!');
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Pet information not found. Please try again.',
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
      console.log('Loaded attributes:', attrs);
      
      // Filter out invalid attributes and distance-related attributes (those are user preferences, not pet characteristics)
      const validAttrs = attrs.filter(attr => {
        if (attr.AttributeId == null) return false;
        
        // Filter out distance/range attributes - these are user preferences, not pet characteristics
        const name = attr.Name?.toLowerCase() || '';
        if (name.includes('khoảng cách') || name.includes('distance') || name.includes('km')) {
          console.log('🚫 Filtering out distance attribute:', attr.Name);
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

      // If editing from profile, load existing characteristics
      if (isFromProfile) {
        try {
          const existingChars = await getPetCharacteristics(petId);
          console.log('📝 Loaded existing characteristics:', existingChars);
          
          const tempSelectedOptions: Record<number, number> = {};
          const tempNumericValues: Record<number, string> = {};
          const tempExistingIds = new Set<number>();
          
          existingChars.forEach((char: any) => {
            if (char.attributeId) {
              tempExistingIds.add(char.attributeId);
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
          
          setExistingCharacteristicIds(tempExistingIds);
          setSelectedOptions(tempSelectedOptions);
          setNumericValues(tempNumericValues);
          
          console.log('📋 Existing characteristic IDs:', Array.from(tempExistingIds));
        } catch (error) {
          console.log('⚠️ No existing characteristics or error loading:', error);
        }
      }
    } catch (error: any) {
      console.error('Error loading attributes:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load characteristics. Please try again.',
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
        
        console.log(`${shouldUpdate ? 'Updating' : 'Creating'} option: attributeId=${attributeId}, optionId=${optionId}`);
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
            
            console.log(`${shouldUpdate ? 'Updating' : 'Creating'} numeric: attributeId=${attributeId}, value=${numValue}`);
            savePromises.push(
              apiFunction(petId, attrId, { Value: numValue })
            );
          }
        }
      });

      console.log(`Total promises: ${savePromises.length}`);
      await Promise.all(savePromises);

      console.log(`✅ Pet characteristics saved successfully`);

      // Always navigate to AddPetPhotos (step 3)
      showAlert({
        type: 'success',
        title: 'Success!',
        message: 'Characteristics saved! Now let\'s add some photos.',
        confirmText: 'Continue',
        onClose: () => {
          navigation.navigate("AddPetPhotos", { petId, isFromProfile });
        },
      });
    } catch (error: any) {
      console.error('Error saving characteristics:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save characteristics. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isFromProfile) {
      navigation.goBack();
    } else {
      showAlert({
        type: 'warning',
        title: 'Complete Profile',
        message: 'You need to complete your pet profile to continue.',
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
        <Text style={styles.loadingText}>Loading attributes...</Text>
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
          
          {/* Step Indicator - Always show in Add Pet flow */}
          <View style={styles.stepIndicatorContainer}>
            <View style={styles.stepBarsContainer}>
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarInactive]} />
            </View>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>
          
          <Text style={styles.title}>
            {isFromProfile ? 'Edit Characteristics' : 'Pet Characteristics'}
          </Text>
          <Text style={styles.subtitle}>
            {isFromProfile ? 'Update your pet\'s details' : 'Help others get to know your pet better'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Dynamic Attributes */}
          {attributes.map((attr) => {
            if (!attr.AttributeId) return null;
            
            // Check if this is a numeric input (float/number type)
            const isNumeric = attr.TypeValue === 'float' || attr.TypeValue === 'number';
            
            return (
              <View key={`attr-${attr.AttributeId}`} style={styles.inputGroup}>
                <Text style={styles.label}>
                  {attr.Name || 'Unknown'}
                  {attr.Unit ? ` (${attr.Unit})` : ''}
                </Text>
                
                {isNumeric ? (
                  // Numeric Input
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.numericInput}
                      placeholder={`Enter ${attr.Name?.toLowerCase() || 'value'}`}
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
                            {option.Name || 'Unknown'}
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
              These details help us find the perfect matches for your pet. You can update anytime.
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
                  <Text style={styles.buttonText}>{isFromProfile ? 'Save Changes' : 'Continue'}</Text>
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
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 12,
    letterSpacing: 0.2,
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

