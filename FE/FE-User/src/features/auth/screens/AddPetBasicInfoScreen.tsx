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
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import CustomAlert from "../../../components/CustomAlert";
import { createPet, getPetsByUserId, updatePet } from "../../../api";
import { getItem } from "../../../services/storage";

const MAX_PETS_PER_USER = 3;

type Props = NativeStackScreenProps<RootStackParamList, "AddPetBasicInfo">;

const AddPetBasicInfoScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  
  // Get params - petId will exist if user came back from step 2
  const isFromProfile = route.params?.isFromProfile || false;
  const existingPetId = route.params?.petId;
  
  // Pre-fill form with existing data if available (when coming back from step 2)
  const [petName, setPetName] = useState(route.params?.petName || "");
  const [breed, setBreed] = useState(route.params?.breed || "");
  const [description, setDescription] = useState(route.params?.description || "");
  const [loading, setLoading] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const handleContinue = async () => {
    // Validation: Kiểm tra tên thú cưng trống
    if (!petName.trim()) {
      showAlert({
        type: 'warning',
        title: t('auth.addPet.basicInfo.missingInfo'),
        message: t('auth.addPet.basicInfo.enterPetName'),
      });
      return;
    }

    // Validation: Kiểm tra độ dài tên
    if (petName.trim().length < 2) {
      showAlert({
        type: 'error',
        title: t('auth.addPet.basicInfo.invalidName'),
        message: t('auth.addPet.basicInfo.nameMinLength'),
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
          title: t('auth.addPet.basicInfo.error'),
          message: t('auth.addPet.basicInfo.userNotFound'),
        });
        return;
      }

      const userId = parseInt(userIdStr, 10);

      // If we already have a petId (user came back from step 2), UPDATE instead of CREATE
      if (existingPetId) {
        const updateData = {
          Name: petName.trim(),
          Gender: "Male", // Keep default, will be updated in Characteristics screen
          Breed: breed.trim() || undefined,
          Description: description.trim() || undefined,
        };

        await updatePet(existingPetId, updateData);

        showAlert({
          type: 'success',
          title: t('auth.addPet.basicInfo.success'),
          message: t('auth.addPet.basicInfo.petUpdated', { name: petName }),
          confirmText: t('common.continue'),
          onClose: () => {
            navigation.navigate("AddPetPhotos", { 
              petId: existingPetId, 
              isFromProfile,
              petName: petName.trim(),
              breed: breed.trim(),
              description: description.trim(),
            });
          },
        });
        return;
      }

      // Kiểm tra số lượng pet hiện tại (tối đa 3 pet) - only for NEW pet creation
      if (isFromProfile) {
        try {
          const existingPets = await getPetsByUserId(userId);
          if (existingPets && existingPets.length >= MAX_PETS_PER_USER) {
            showAlert({
              type: 'warning',
              title: t('profile.myPets.maxPetsReached'),
              message: t('profile.myPets.maxPetsMessage', { max: MAX_PETS_PER_USER }),
            });
            setLoading(false);
            return;
          }
        } catch (error) {
          // Silent fail
        }
      }

      // Create NEW pet (Gender default to "Male", user will update in Characteristics screen)
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

      const response = await createPet(petData);
      const petId = response.PetId || response.petId;

      if (!petId) {
        throw new Error('Không nhận được PetId từ server');
      }

      showAlert({
        type: 'success',
        title: t('auth.addPet.basicInfo.success'),
        message: t('auth.addPet.basicInfo.petCreated', { name: petName }),
        confirmText: t('common.continue'),
        onClose: () => {
          navigation.navigate("AddPetPhotos", { 
            petId, 
            isFromProfile,
            petName: petName.trim(),
            breed: breed.trim(),
            description: description.trim(),
          });
        },
      });
    } catch (error: any) {

      showAlert({
        type: 'error',
        title: t('auth.addPet.basicInfo.error'),
        message: error.message || t('auth.addPet.basicInfo.createFailed'),
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
        title: t('auth.addPet.basicInfo.completeProfile'),
        message: t('auth.addPet.basicInfo.needPetProfile'),
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
            <Text style={styles.stepText}>{t('auth.addPet.basicInfo.step')}</Text>
          </View>

          <Text style={styles.title}>{t('auth.addPet.basicInfo.title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.addPet.basicInfo.subtitle')}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Pet Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.addPet.basicInfo.name')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder={t('auth.addPet.basicInfo.namePlaceholder')}
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
            <Text style={styles.label}>{t('auth.addPet.basicInfo.breed')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder={t('auth.addPet.basicInfo.breedPlaceholder')}
                style={styles.input}
                placeholderTextColor={colors.textLabel}
                value={breed}
                onChangeText={setBreed}
                autoCapitalize="words"
              />
            </View>
            <Text style={styles.helperText}>{t('auth.addPet.basicInfo.optional')}</Text>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.addPet.basicInfo.description')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder={t('auth.addPet.basicInfo.descriptionPlaceholder')}
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
              <Text style={styles.helperText}>{t('auth.addPet.basicInfo.charCount', { count: description.length })}</Text>
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
                  <Text style={styles.buttonText}>{t('auth.addPet.basicInfo.continueButton')}</Text>
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

