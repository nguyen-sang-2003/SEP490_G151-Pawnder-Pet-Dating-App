import React, { useState } from "react";
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
import { createPet } from "../../../api";
import { getItem } from "../../../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "AddPetBasicInfo">;

const AddPetBasicInfoScreen = ({ navigation, route }: Props) => {
  const [petName, setPetName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const isFromProfile = route.params?.isFromProfile || false;

  const handleContinue = async () => {
    // Validate
    if (!petName.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên thú cưng!',
      });
      return;
    }

    if (!gender) {
      showAlert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn giới tính!',
      });
      return;
    }

    try {
      setLoading(true);

      // Get userId from storage
      const userIdStr = await getItem('userId');
      if (!userIdStr) {
        showAlert({
          type: 'error',
          title: 'Lỗi',
          message: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.',
        });
        return;
      }

      const userId = parseInt(userIdStr, 10);

      // Create pet
      const petData = {
        UserId: userId,
        Name: petName.trim(),
        Gender: gender,
        Breed: breed.trim() || undefined,
        Age: age.trim() ? parseInt(age.trim(), 10) : undefined,
        Description: description.trim() || undefined,
        IsActive: true,
      };

      console.log('Creating pet with data:', petData);
      const response = await createPet(petData);
      console.log('Create pet response:', response);
      
      const petId = response.PetId || response.petId;

      if (!petId) {
        throw new Error('Không nhận được PetId từ server');
      }

      console.log('✅ Pet created successfully. PetId:', petId);

      showAlert({
        type: 'success',
        title: 'Thành công! 🎉',
        message: `${petName} đã được tạo. Tiếp tục thêm thông tin chi tiết!`,
        confirmText: 'Tiếp tục',
        onClose: () => {
          // Navigate to characteristics screen with petId
          navigation.navigate("AddPetCharacteristics", { petId, isFromProfile });
        },
      });
    } catch (error: any) {
      console.error('Error creating pet:', error);
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể tạo thú cưng. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isFromProfile) {
      navigation.navigate("Profile");
    } else {
      // Nếu chưa hoàn thành profile, không cho back
      showAlert({
        type: 'warning',
        title: 'Cần hoàn thành hồ sơ',
        message: 'Bạn cần tạo ít nhất 1 thú cưng để tiếp tục sử dụng app.',
      });
    }
  };

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
          <Text style={styles.stepText}>Step 1 of 3</Text>
          <Text style={styles.title}>Basic Pet Info 🐱</Text>
          <Text style={styles.subtitle}>
            Let's start with the basics
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Pet Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pet Name *</Text>
            <TextInput
              placeholder="Enter your pet's name"
              style={styles.input}
              placeholderTextColor={colors.textLabel}
              value={petName}
              onChangeText={setPetName}
            />
          </View>

          {/* Gender Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  gender === "Male" && styles.genderBtnActive,
                ]}
                onPress={() => setGender("Male")}
              >
                <Icon
                  name="male"
                  size={24}
                  color={gender === "Male" ? colors.white : colors.male}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === "Male" && styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  gender === "Female" && styles.genderBtnActive,
                ]}
                onPress={() => setGender("Female")}
              >
                <Icon
                  name="female"
                  size={24}
                  color={gender === "Female" ? colors.white : colors.female}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === "Female" && styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Breed */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed (Optional)</Text>
            <TextInput
              placeholder="e.g., Persian, British Shorthair, Ragdoll..."
              style={styles.input}
              placeholderTextColor={colors.textLabel}
              value={breed}
              onChangeText={setBreed}
            />
          </View>

          {/* Age */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (Optional)</Text>
            <TextInput
              placeholder="Enter age in years (e.g., 2)"
              style={styles.input}
              placeholderTextColor={colors.textLabel}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              placeholder="Tell us about your pet's personality... (playful, calm, friendly, etc.)"
              style={[styles.input, styles.textArea]}
              placeholderTextColor={colors.textLabel}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.btnShadow}
            onPress={handleContinue}
            disabled={loading}
          >
            <LinearGradient
              colors={gradients.auth.buttonPrimary}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
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
  input: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
    ...shadows.small,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },

  // Gender
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.whiteWarm,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  genderBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  genderTextActive: {
    color: colors.white,
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

export default AddPetBasicInfoScreen;

