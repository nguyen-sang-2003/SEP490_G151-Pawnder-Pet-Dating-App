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
import { getItem } from "../../../services/storage";

type Props = NativeStackScreenProps<RootStackParamList, "AddPetBasicInfo">;

const AddPetBasicInfoScreen = ({ navigation, route }: Props) => {
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const isFromProfile = route.params?.isFromProfile || false;

  const handleContinue = async () => {
    // Validate
    if (!petName.trim()) {
      showAlert({
        type: 'warning',
        title: 'Name Required',
        message: 'Please enter your pet\'s name to continue.',
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
          title: 'Error',
          message: 'User information not found. Please login again.',
        });
        return;
      }

      const userId = parseInt(userIdStr, 10);

      // Create pet (Gender default to "Male", user will update in Characteristics screen)
      // IsActive: false by default - user can manually set active later
      // Only first pet during registration will be auto-active (handled by backend or onboarding)
      const petData = {
        UserId: userId,
        Name: petName.trim(),
        Gender: "Male", // Temporary default, will be updated in Characteristics screen
        Breed: breed.trim() || undefined,
        Description: description.trim() || undefined,
        IsActive: isFromProfile ? false : true, // Auto-active only for first pet (registration), not when adding from profile
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
        title: 'Success!',
        message: `${petName}'s profile created. Let's add some photos!`,
        confirmText: 'Continue',
        onClose: () => {
          navigation.navigate("AddPetPhotos", { petId, isFromProfile });
        },
      });
    } catch (error: any) {

      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to create pet profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isFromProfile) {
      navigation.navigate("Profile");
    } else {
      showAlert({
        type: 'warning',
        title: 'Complete Profile',
        message: 'You need to create at least one pet profile to continue.',
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

          {/* Step Indicator - Always show in Add Pet flow */}
          <View style={styles.stepIndicatorContainer}>
            <View style={styles.stepBarsContainer}>
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarInactive]} />
              <View style={[styles.stepBar, styles.stepBarInactive]} />
            </View>
            <Text style={styles.stepText}>Step 1 of 3</Text>
          </View>

          <Text style={styles.title}>Pet Profile</Text>
          <Text style={styles.subtitle}>
            Tell us about your furry friend
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Pet Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="What's your pet's name?"
                style={styles.input}
                placeholderTextColor={colors.textLabel}
                value={petName}
                onChangeText={setPetName}
                autoCapitalize="words"
              />
              {petName.length > 0 && (
                <Icon name="checkmark-circle" size={20} color={colors.success} style={styles.inputIcon} />
              )}
            </View>
          </View>

          {/* Breed */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="e.g., Persian, British Shorthair"
                style={styles.input}
                placeholderTextColor={colors.textLabel}
                value={breed}
                onChangeText={setBreed}
                autoCapitalize="words"
              />
            </View>
            <Text style={styles.helperText}>Optional</Text>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>About</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Describe your pet's personality and traits..."
                style={[styles.input, styles.textArea]}
                placeholderTextColor={colors.textLabel}
                value={description}
                onChangeText={(text) => setDescription(text.slice(0, 200))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
            <View style={styles.charCount}>
              <Text style={styles.helperText}>Optional • {description.length}/200</Text>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.btnShadow, !petName.trim() && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={loading || !petName.trim()}
          >
            <LinearGradient
              colors={!petName.trim() ? ['#E0E0E0', '#BDBDBD'] : gradients.auth.buttonPrimary}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue</Text>
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
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.textDark,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.small,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  helperText: {
    fontSize: 13,
    color: colors.textLabel,
    marginTop: 6,
    marginLeft: 4,
  },
  charCount: {
    alignItems: 'flex-end',
  },

  // Buttons
  btnShadow: {
    marginTop: 24,
    borderRadius: radius.xl,
    ...shadows.large,
  },
  btnDisabled: {
    opacity: 0.6,
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

export default AddPetBasicInfoScreen;

