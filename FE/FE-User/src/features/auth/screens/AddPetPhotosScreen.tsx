import React, { useState, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import CustomAlert from "../../../components/CustomAlert";
import { uploadPetPhotosMultipart, analyzePetImage, AIAttributeResult, getPetPhotos, deletePetPhoto } from "../../../api";
import { launchImageLibrary, Asset } from 'react-native-image-picker';

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 60) / 3; // 3 columns with padding

type Props = NativeStackScreenProps<RootStackParamList, "AddPetPhotos">;

// Photo from database (already uploaded)
interface DBPhoto {
  id: string;
  uri: string;
  photoId: number;
  isFromDB: true;
}

// Photo selected from device (not yet uploaded)
interface LocalPhoto {
  id: string;
  uri: string;
  fileName?: string;
  type?: string;
  isFromDB: false;
}

type Photo = DBPhoto | LocalPhoto;

const AddPetPhotosScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { petId, isFromProfile, petName, breed, description } = route.params;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const maxPhotos = 6;
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  // Load existing photos from DB when screen mounts
  useEffect(() => {
    const loadExistingPhotos = async () => {
      try {
        setLoadingPhotos(true);
        const existingPhotos = await getPetPhotos(petId);
        
        if (existingPhotos && existingPhotos.length > 0) {
          const dbPhotos: DBPhoto[] = existingPhotos.map((photo: any) => {
            const photoUrl = photo.Url || photo.url || photo.ImageUrl || photo.imageUrl || photo.UrlPhoto || photo.urlPhoto;
            return {
              id: `db-${photo.PhotoId || photo.photoId}`,
              uri: photoUrl,
              photoId: photo.PhotoId || photo.photoId,
              isFromDB: true as const,
            };
          });
          setPhotos(dbPhotos);
        }
      } catch (error) {
        // Silent fail - no photos yet
      } finally {
        setLoadingPhotos(false);
      }
    };

    loadExistingPhotos();
  }, [petId]);

  const handleAddPhoto = async () => {
    if (photos.length >= maxPhotos) {
      showAlert({ type: 'warning', title: t('auth.addPet.photos.photoLimit'), message: t('auth.addPet.photos.maxPhotos', { max: maxPhotos }) });
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: maxPhotos - photos.length,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showAlert({ type: 'error', title: t('common.error'), message: t('auth.addPet.photos.selectError') });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newPhotos: LocalPhoto[] = result.assets.map((asset: Asset) => ({
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          uri: asset.uri || '',
          fileName: asset.fileName,
          type: asset.type,
          isFromDB: false as const,
        }));

        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      showAlert({ type: 'error', title: t('common.error'), message: t('auth.addPet.photos.selectError') });
    }
  };

  const handleRemovePhoto = (photo: Photo) => {
    if (photo.isFromDB) {
      // DB photo - confirm and delete from server
      showAlert({
        type: 'warning',
        title: t('auth.addPet.photos.removePhoto'),
        message: t('auth.addPet.photos.removeDbPhotoConfirm'),
        showCancel: true,
        confirmText: t('auth.addPet.photos.removeButton'),
        cancelText: t('common.cancel'),
        onConfirm: async () => {
          try {
            setDeletingPhotoId(photo.id);
            await deletePetPhoto((photo as DBPhoto).photoId);
            setPhotos(prev => prev.filter(p => p.id !== photo.id));
          } catch (error) {
            showAlert({
              type: 'error',
              title: t('common.error'),
              message: t('auth.addPet.photos.deleteError'),
            });
          } finally {
            setDeletingPhotoId(null);
          }
        },
      });
    } else {
      // Local photo - just remove from state
      showAlert({
        type: 'warning',
        title: t('auth.addPet.photos.removePhoto'),
        message: t('auth.addPet.photos.removeConfirm'),
        showCancel: true,
        confirmText: t('auth.addPet.photos.removeButton'),
        cancelText: t('common.cancel'),
        onConfirm: () => {
          setPhotos(prev => prev.filter(p => p.id !== photo.id));
        },
      });
    }
  };

  const handleNext = async () => {
    // Separate DB photos from new local photos FIRST
    const dbPhotos = photos.filter(p => p.isFromDB) as DBPhoto[];
    const newPhotos = photos.filter(p => !p.isFromDB) as LocalPhoto[];

    // Validation: Kiểm tra số lượng ảnh tối thiểu (tổng DB + mới)
    if (photos.length < 3) {
      showAlert({
        type: 'warning',
        title: t('auth.addPet.photos.needMorePhotos'),
        message: t('auth.addPet.photos.minPhotosMessage', { current: photos.length }),
      });
      return;
    }

    try {
      // Step 1: Upload new photos if any
      if (newPhotos.length > 0) {
        setUploading(true);
        await uploadPetPhotosMultipart(petId, newPhotos);
        setUploading(false);
      }

      // Step 2: Analyze with AI if we have new photos
      if (newPhotos.length > 0) {
        setAnalyzingAI(true);
        let aiResults: AIAttributeResult[] | undefined;
        
        try {
          const analysisResponse = await analyzePetImage(newPhotos[0]);

          if (analysisResponse.success && analysisResponse.attributes && analysisResponse.attributes.length > 0) {
            aiResults = analysisResponse.attributes;

            showAlert({
              type: 'success',
              title: t('auth.addPet.photos.aiAnalysisComplete'),
              message: t('auth.addPet.photos.aiAnalysisMessage', { count: aiResults.length }),
              confirmText: t('common.continue'),
              onClose: () => {
                navigation.navigate("AddPetCharacteristics", {
                  petId,
                  isFromProfile,
                  aiResults
                });
              },
            });
          } else {
            // AI returned but no attributes or failed
            throw new Error(analysisResponse.message || 'AI analysis returned no attributes');
          }
        } catch (aiError: any) {
          // Get error message from server response
          const serverError = aiError?.response?.data;
          let errorMessage = t('auth.addPet.photos.aiAnalysisFailedMessage');
          
          if (serverError?.message) {
            // Check for specific error types
            if (serverError.message.includes('không khả dụng') || serverError.message.includes('region')) {
              errorMessage = t('auth.addPet.photos.aiNotAvailable');
            } else if (serverError.message.includes('API key')) {
              errorMessage = t('auth.addPet.photos.aiApiKeyError');
            } else if (serverError.message.includes('quota') || serverError.message.includes('giới hạn')) {
              errorMessage = t('auth.addPet.photos.aiQuotaExceeded');
            } else {
              errorMessage = serverError.message;
            }
          } else if (aiError?.message) {
            errorMessage = aiError.message;
          }

          showAlert({
            type: 'info',
            title: t('auth.addPet.photos.aiAnalysisFailed'),
            message: errorMessage,
            confirmText: t('common.continue'),
            onClose: () => {
              navigation.navigate("AddPetCharacteristics", {
                petId,
                isFromProfile,
                aiResults: undefined
              });
            },
          });
        } finally {
          setAnalyzingAI(false);
        }
      } else {
        // No new photos - just continue to characteristics (skip AI)
        navigation.navigate("AddPetCharacteristics", {
          petId,
          isFromProfile,
          aiResults: undefined
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('auth.addPet.photos.uploadFailed'),
      });
    } finally {
      setUploading(false);
      setAnalyzingAI(false);
    }
  };

  const handleBack = () => {
    if (isFromProfile) {
      navigation.navigate("AddPetBasicInfo", {
        isFromProfile: true,
        petId,
        petName,
        breed,
        description,
      });
    } else {
      showAlert({
        type: 'info',
        title: t('auth.addPet.photos.editBasicInfo'),
        message: t('auth.addPet.photos.editBasicInfoMessage'),
        showCancel: true,
        confirmText: t('common.edit'),
        cancelText: t('common.cancel'),
        onConfirm: () => {
          navigation.navigate("AddPetBasicInfo", {
            isFromProfile: false,
            petId,
            petName,
            breed,
            description,
          });
        },
      });
    }
  };

  // Count photos by type
  const dbPhotoCount = photos.filter(p => p.isFromDB).length;
  const newPhotoCount = photos.filter(p => !p.isFromDB).length;

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
            <Text style={styles.stepText}>{t('auth.addPet.photos.step')}</Text>
          </View>

          <Text style={styles.title}>
            {isFromProfile ? t('auth.addPet.photos.editTitle') : t('auth.addPet.photos.title')}
          </Text>
          <Text style={styles.subtitle}>
            {t('auth.addPet.photos.subtitle')}
          </Text>
        </View>

        {/* Photos Grid */}
        <View style={styles.photosContainer}>
          {loadingPhotos ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('auth.addPet.photos.loadingPhotos')}</Text>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  
                  {/* Badge for DB photos */}
                  {photo.isFromDB && (
                    <View style={styles.dbBadge}>
                      <Icon name="cloud-done" size={12} color={colors.white} />
                    </View>
                  )}
                  
                  {/* Badge for new photos */}
                  {!photo.isFromDB && (
                    <View style={styles.newBadge}>
                      <Icon name="add" size={12} color={colors.white} />
                    </View>
                  )}
                  
                  {/* Remove button */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemovePhoto(photo)}
                    disabled={deletingPhotoId === photo.id}
                  >
                    <View style={[
                      styles.removeButtonInner,
                      deletingPhotoId === photo.id && styles.removeButtonDisabled
                    ]}>
                      {deletingPhotoId === photo.id ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Icon name="close" size={16} color={colors.white} />
                      )}
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
                    <Text style={styles.addPhotoText}>{t('auth.addPet.photos.addPhoto')}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Photo Counter with breakdown */}
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
                {photos.length >= 3 
                  ? t('auth.addPet.photos.photoCountReady', { count: photos.length, max: maxPhotos })
                  : t('auth.addPet.photos.photoCountNeed', { count: photos.length, max: maxPhotos, need: 3 - photos.length })}
              </Text>
            </View>
            
            {/* Show breakdown if there are both types */}
            {dbPhotoCount > 0 && (
              <Text style={styles.photoBreakdown}>
                {t('auth.addPet.photos.photoBreakdown', { db: dbPhotoCount, new: newPhotoCount })}
              </Text>
            )}
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsIcon}>
            <Icon name="bulb" size={20} color={colors.primary} />
          </View>
          <Text style={styles.tipsTitle}>{t('auth.addPet.photos.tips.title')}</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{t('auth.addPet.photos.tips.clearPhoto')}</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{t('auth.addPet.photos.tips.showPersonality')}</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{t('auth.addPet.photos.tips.includeVariety')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.btnShadow, (photos.length < 3 || uploading || analyzingAI || loadingPhotos) && styles.btnDisabled]}
          onPress={handleNext}
          disabled={uploading || analyzingAI || photos.length < 3 || loadingPhotos}
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
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>{t('auth.addPet.photos.uploading')}</Text>
              </>
            ) : analyzingAI ? (
              <>
                <ActivityIndicator color={colors.white} />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>{t('auth.addPet.photos.analyzing')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {newPhotoCount > 0 
                    ? t('auth.addPet.photos.continueWithAI')
                    : t('common.continue')
                  }
                </Text>
                {newPhotoCount > 0 && <Icon name="sparkles" size={22} color={colors.white} />}
                {newPhotoCount === 0 && <Icon name="arrow-forward" size={22} color={colors.white} />}
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

  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMedium,
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
  removeButtonDisabled: {
    opacity: 0.5,
  },
  
  // Badges
  dbBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: colors.success,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  newBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
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
  photoBreakdown: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textLabel,
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
});

export default AddPetPhotosScreen;
