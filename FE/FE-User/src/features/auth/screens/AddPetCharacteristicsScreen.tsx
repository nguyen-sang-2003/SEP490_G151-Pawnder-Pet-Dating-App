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

  useEffect(() => {
    if (!petId) {
      console.error('ERROR: petId is undefined!');
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Không tìm thấy thông tin Pet. Vui lòng thử lại.',
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
      
      // Filter out invalid attributes
      const validAttrs = attrs.filter(attr => attr.AttributeId != null);
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
          
          existingChars.forEach((char: any) => {
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
          
          setSelectedOptions(tempSelectedOptions);
          setNumericValues(tempNumericValues);
        } catch (error) {
          console.log('⚠️ No existing characteristics or error loading:', error);
        }
      }
    } catch (error: any) {
      console.error('Error loading attributes:', error);
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tải thông tin thuộc tính. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    try {
      setSaving(true);

      const savePromises: Promise<any>[] = [];
      const apiFunction = isFromProfile ? updatePetCharacteristic : createPetCharacteristic;

      // Save selected options (string types)
      Object.entries(selectedOptions).forEach(([attributeId, optionId]) => {
        console.log(`${isFromProfile ? 'Updating' : 'Creating'} option: attributeId=${attributeId}, optionId=${optionId}`);
        savePromises.push(
          apiFunction(petId, parseInt(attributeId, 10), { OptionId: optionId })
        );
      });

      // Save numeric values (number types)
      Object.entries(numericValues).forEach(([attributeId, value]) => {
        if (value && value.trim()) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            console.log(`${isFromProfile ? 'Updating' : 'Creating'} numeric: attributeId=${attributeId}, value=${numValue}`);
            savePromises.push(
              apiFunction(petId, parseInt(attributeId, 10), { Value: numValue })
            );
          }
        }
      });

      console.log(`Total promises: ${savePromises.length}`);
      await Promise.all(savePromises);

      console.log(`✅ Pet characteristics ${isFromProfile ? 'updated' : 'saved'} successfully`);

      if (isFromProfile) {
        // Navigate back to EditPet if editing from profile
        showAlert({
          type: 'success',
          title: 'Thành công! 🎉',
          message: 'Đã cập nhật đặc điểm thú cưng!',
          onClose: () => navigation.goBack(),
        });
      } else {
        // Navigate to AddPetPhotos if creating new pet
        showAlert({
          type: 'success',
          title: 'Thành công! 🎉',
          message: 'Đặc điểm thú cưng đã được lưu. Bây giờ hãy thêm ảnh!',
          confirmText: 'Tiếp tục',
          onClose: () => {
            navigation.navigate("AddPetPhotos", { petId, isFromProfile });
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving characteristics:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Không thể lưu đặc điểm. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert({
        type: 'error',
        title: 'Lỗi',
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
      // Nếu chưa hoàn thành profile, không cho back
      showAlert({
        type: 'warning',
        title: 'Cần hoàn thành hồ sơ',
        message: 'Bạn cần hoàn tất tạo thú cưng để tiếp tục sử dụng app.',
      });
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={gradients.background}
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
      colors={gradients.background}
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
          {!isFromProfile && <Text style={styles.stepText}>Step 2 of 3</Text>}
          <Text style={styles.title}>
            {isFromProfile ? 'Edit Pet Characteristics 🎨' : 'Pet Characteristics 🎨'}
          </Text>
          <Text style={styles.subtitle}>
            {isFromProfile ? 'Update your pet\'s characteristics' : 'Help others know more about your pet'}
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
                  <TextInput
                    style={styles.numericInput}
                    placeholder={`Nhập ${attr.Name?.toLowerCase() || 'giá trị'}`}
                    placeholderTextColor={colors.textLabel}
                    keyboardType="decimal-pad"
                    value={numericValues[attr.AttributeId!] || ''}
                    onChangeText={(text) => {
                      if (attr.AttributeId) {
                        setNumericValues({ ...numericValues, [attr.AttributeId]: text });
                      }
                    }}
                  />
                ) : (
                  // Option Selection
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    <View style={styles.optionsRow}>
                      {attributeOptions[attr.AttributeId]?.map((option) => {
                        if (!option.OptionId) return null;
                        
                        return (
                          <TouchableOpacity
                            key={`option-${option.OptionId}`}
                            style={[
                              styles.optionBtn,
                              selectedOptions[attr.AttributeId!] === option.OptionId && styles.optionBtnActive,
                            ]}
                            onPress={() => {
                              if (attr.AttributeId && option.OptionId) {
                                setSelectedOptions({ ...selectedOptions, [attr.AttributeId]: option.OptionId });
                              }
                            }}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                selectedOptions[attr.AttributeId!] === option.OptionId && styles.optionTextActive,
                              ]}
                            >
                              {option.Name || 'Unknown'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>
            );
          })}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Icon name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.infoText}>
              These characteristics help match your pet with compatible friends! You can always update them later.
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.btnShadow}
            onPress={handleContinue}
            disabled={saving}
          >
            <LinearGradient
              colors={gradients.primary}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue</Text>
                  <Icon name="arrow-forward" size={20} color={colors.white} />
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
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...shadows.small,
  },
  stepText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMedium,
  },

  // Form
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 8,
  },

  // Dynamic Options
  optionsScroll: {
    flexGrow: 0,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  optionBtn: {
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  optionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
  },
  optionTextActive: {
    color: colors.white,
  },

  // Numeric Input
  numericInput: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textDark,
    ...shadows.small,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },

  // Buttons
  btnShadow: {
    marginTop: 12,
    borderRadius: radius.lg,
    ...shadows.large,
  },
  button: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
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

