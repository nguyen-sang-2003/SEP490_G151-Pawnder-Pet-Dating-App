import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
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
import { uploadPetPhotosMultipart, analyzePetImage, AIAttributeResult } from "../../../api";
import { launchImageLibrary, Asset } from 'react-native-image-picker';

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 60) / 3; // 3 columns with padding

type Props = NativeStackScreenProps<RootStackParamList, "AddPetPhotos">;

interface Photo {
  id: string;
  uri: string;
  fileName?: string;
  type?: string;
}

const AddPetPhotosScreen = ({ navigation, route }: Props) => {
  const { petId, isFromProfile } = route.params;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const maxPhotos = 6;
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const handleAddPhoto = async () => {
    if (photos.length >= maxPhotos) {
      showAlert({ type: 'warning', title: "Photo Limit", message: `Maximum ${maxPhotos} photos allowed` });
      return;
    }
    
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: maxPhotos - photos.length,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.error('ImagePicker Error: ', result.errorMessage);
        showAlert({ type: 'error', title: 'Error', message: 'Unable to select photo. Please try again.' });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newPhotos: Photo[] = result.assets.map((asset: Asset) => ({
          id: Date.now().toString() + Math.random().toString(),
          uri: asset.uri || '',
          fileName: asset.fileName,
          type: asset.type,
        }));
        
        setPhotos([...photos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert({ type: 'error', title: 'Error', message: 'Unable to select photo. Please try again.' });
    }
  };

  const handleRemovePhoto = (id: string) => {
    showAlert({
      type: 'warning',
      title: "Remove Photo",
      message: "Are you sure you want to remove this photo?",
      showCancel: true,
      confirmText: "Remove",
      onConfirm: () => setPhotos((prev) => prev.filter((photo) => photo.id !== id)),
    });
  };

  const handleNext = async () => {
    if (photos.length < 3) {
      showAlert({
        type: 'warning',
        title: 'More Photos Needed',
        message: `Please add at least 3 photos! (Current: ${photos.length}/3)`,
      });
      return;
    }

    try {
      setUploading(true);

      // Step 1: Upload photos
      await uploadPetPhotosMultipart(petId, photos);
      console.log('✅ Pet photos uploaded successfully');

      setUploading(false);
      setAnalyzingAI(true);

      // Step 2: Analyze first photo with AI
      let aiResults: AIAttributeResult[] | undefined;
      try {
        console.log('🤖 Starting AI analysis...');
        const analysisResponse = await analyzePetImage(photos[0]);
        
        if (analysisResponse.success && analysisResponse.attributes) {
          aiResults = analysisResponse.attributes;
          console.log('✅ AI analysis successful:', aiResults);
          
          showAlert({
            type: 'success',
            title: 'AI Analysis Complete! 🤖',
            message: `Found ${aiResults.length} characteristics. You can review and edit them next.`,
            confirmText: 'Continue',
            onClose: () => {
              navigation.navigate("AddPetCharacteristics", { 
                petId, 
                isFromProfile,
                aiResults 
              });
            },
          });
        } else {
          throw new Error('AI analysis failed');
        }
      } catch (aiError: any) {
        console.warn('⚠️ AI analysis failed, continuing without AI:', aiError);
        
        // AI failed, but still allow user to continue manually
        showAlert({
          type: 'info',
          title: 'Photos Uploaded!',
          message: 'AI analysis unavailable. You can add characteristics manually.',
          confirmText: 'Continue',
          onClose: () => {
            navigation.navigate("AddPetCharacteristics", { 
              petId, 
              isFromProfile,
              aiResults: undefined 
            });
          },
        });
      }
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Unable to upload photos. Please try again.',
      });
    } finally {
      setUploading(false);
      setAnalyzingAI(false);
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

  return (
    <LinearGradient
      colors={gradients.auth.signup}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          
          {/* Step Indicator */}
          <View style={styles.stepIndicatorContainer}>
            <View style={styles.stepBarsContainer}>
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarActive]} />
              <View style={[styles.stepBar, styles.stepBarInactive]} />
            </View>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>
          
          <Text style={styles.title}>
            {isFromProfile ? 'Pet Photos' : 'Add Photos'}
          </Text>
          <Text style={styles.subtitle}>
            Add at least 3 photos to showcase your pet
          </Text>
        </View>
        {/* Photos Grid */}
        <View style={styles.photosContainer}>
          <View style={styles.photosGrid}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoWrapper}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePhoto(photo.id)}
                >
                  <View style={styles.removeButtonInner}>
                    <Icon name="close" size={16} color={colors.white} />
                  </View>
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add Photo Button */}
            {photos.length < maxPhotos && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
                activeOpacity={0.8}
              >
                <View style={styles.addPhotoContent}>
                  <Icon name="add" size={36} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Photo Counter */}
          <View style={styles.counterContainer}>
            <View style={[
              styles.counterBadge,
              photos.length >= 3 && styles.counterBadgeComplete
            ]}>
              <Icon 
                name={photos.length >= 3 ? "checkmark-circle" : "images"} 
                size={18} 
                color={photos.length >= 3 ? colors.success : colors.textMedium} 
              />
              <Text style={[
                styles.counterText,
                photos.length >= 3 && styles.counterTextComplete
              ]}>
                {photos.length}/{maxPhotos} photos{photos.length >= 3 ? ' (Ready!)' : ` (${3 - photos.length} more needed)`}
              </Text>
            </View>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsIcon}>
            <Icon name="bulb" size={20} color={colors.primary} />
          </View>
          <Text style={styles.tipsTitle}>Photo Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Use clear, well-lit photos</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Show your pet's personality</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Include full body and close-up shots</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.btnShadow, (photos.length < 3 || uploading || analyzingAI) && styles.btnDisabled]}
          onPress={handleNext}
          disabled={uploading || analyzingAI || photos.length < 3}
        >
          <LinearGradient
            colors={photos.length < 3 ? [colors.textLight, colors.textLight] : gradients.auth.buttonPrimary}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {uploading ? (
              <>
                <ActivityIndicator color={colors.white} />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>Uploading...</Text>
              </>
            ) : analyzingAI ? (
              <>
                <ActivityIndicator color={colors.white} />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>AI Analyzing...</Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonText}>Continue with AI</Text>
                <Icon name="sparkles" size={22} color={colors.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
  },
  scrollContent: {
    paddingTop: 50,
    paddingBottom: 140,
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

  // Photos
  photosContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 20,
  },
  photoWrapper: {
    position: "relative",
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.lg,
    backgroundColor: colors.cardBackground,
  },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  removeButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: "center",
    alignItems: "center",
    ...shadows.medium,
  },
  addPhotoButton: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.lg,
    backgroundColor: colors.whiteWarm,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    borderStyle: 'dashed',
    ...shadows.small,
  },
  addPhotoContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  addPhotoText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMedium,
  },

  // Counter
  counterContainer: {
    alignItems: "center",
  },
  counterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  counterBadgeComplete: {
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderColor: 'rgba(76,175,80,0.2)',
  },
  counterText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  counterTextComplete: {
    color: colors.success,
    fontWeight: "700",
  },

  // Tips Card
  tipsCard: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tipsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,107,129,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },

  // Bottom Buttons
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 24,
    backgroundColor: colors.whiteWarm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.large,
  },
  btnShadow: {
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
  skipBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: colors.textMedium,
    textDecorationLine: "underline",
  },
});

export default AddPetPhotosScreen;

