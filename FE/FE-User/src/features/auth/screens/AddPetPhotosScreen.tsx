import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
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
import { uploadPetPhotosMultipart, analyzePetImages, AIAttributeResult, getPetPhotos, deletePetPhoto } from "../../../api";
import { launchImageLibrary, Asset } from 'react-native-image-picker';

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 62) / 2;

// Image validation constants (đồng bộ với Backend)
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

type Props = NativeStackScreenProps<RootStackParamList, "AddPetPhotos">;

interface DBPhoto {
  id: string;
  uri: string;
  photoId: number;
  isFromDB: true;
}

interface LocalPhoto {
  id: string;
  uri: string;
  fileName?: string;
  type?: string;
  isFromDB: false;
}

type Photo = DBPhoto | LocalPhoto;

const computeFingerprint = (localPhotos: LocalPhoto[]): string => {
  return localPhotos
    .map(p => `${p.uri}|${p.fileName || ''}|${p.type || ''}`)
    .sort()
    .join('::');
};

const AddPetPhotosScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { petId, isFromProfile, petName, breed, description, aiResults: previousAiResults } = route.params;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [savedAiResults, setSavedAiResults] = useState<AIAttributeResult[] | undefined>(previousAiResults);
  const [analysisFingerprint, setAnalysisFingerprint] = useState<string | undefined>(undefined);
  const maxPhotos = 4;
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  // Bắt hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [petId, petName, breed, description, isFromProfile, savedAiResults])
  );

  useEffect(() => {
    if (previousAiResults) {
      setSavedAiResults(previousAiResults);
    }
  }, [previousAiResults]);

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
        // Silent fail
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

      if (result.didCancel) return;

      if (result.errorCode) {
        showAlert({ type: 'error', title: t('common.error'), message: t('auth.addPet.photos.selectError') });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        // Validate image files
        const invalidFiles: string[] = [];
        const validAssets: Asset[] = [];

        for (const asset of result.assets) {
          // Validate file size (max 5MB)
          if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
            invalidFiles.push(`${asset.fileName || 'Ảnh'}: vượt quá 5MB (${(asset.fileSize / (1024 * 1024)).toFixed(2)}MB)`);
            continue;
          }

          // Validate content type
          if (asset.type && !ALLOWED_IMAGE_TYPES.includes(asset.type.toLowerCase())) {
            invalidFiles.push(`${asset.fileName || 'Ảnh'}: định dạng không hợp lệ (${asset.type})`);
            continue;
          }

          validAssets.push(asset);
        }

        // Show warning if some files are invalid
        if (invalidFiles.length > 0) {
          showAlert({
            type: 'warning',
            title: t('auth.addPet.photos.invalidFiles'),
            message: `${t('auth.addPet.photos.invalidFilesMessage')}\n\n${invalidFiles.join('\n')}`,
          });
        }

        if (validAssets.length === 0) {
          return;
        }

        const newPhotos: LocalPhoto[] = validAssets.map((asset: Asset) => ({
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          uri: asset.uri || '',
          fileName: asset.fileName,
          type: asset.type,
          isFromDB: false as const,
        }));

        setPhotos(prev => [...prev, ...newPhotos]);
        setAnalysisFingerprint(undefined);
      }
    } catch (error) {
      showAlert({ type: 'error', title: t('common.error'), message: t('auth.addPet.photos.selectError') });
    }
  };

  const handleRemovePhoto = (photo: Photo) => {
    if (photo.isFromDB) {
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
      showAlert({
        type: 'warning',
        title: t('auth.addPet.photos.removePhoto'),
        message: t('auth.addPet.photos.removeConfirm'),
        showCancel: true,
        confirmText: t('auth.addPet.photos.removeButton'),
        cancelText: t('common.cancel'),
        onConfirm: () => {
          setPhotos(prev => prev.filter(p => p.id !== photo.id));
          setAnalysisFingerprint(undefined);
        },
      });
    }
  };

  const handleNext = async () => {
    const newPhotos = photos.filter(p => !p.isFromDB) as LocalPhoto[];

    if (photos.length < 1) {
      showAlert({
        type: 'warning',
        title: t('auth.addPet.photos.needMorePhotos'),
        message: t('auth.addPet.photos.minPhotosMessage', { current: photos.length }),
      });
      return;
    }

    try {
      if (newPhotos.length === 0) {
        navigation.navigate("AddPetCharacteristics", {
          petId,
          isFromProfile,
          petName,
          breed,
          description,
          aiResults: savedAiResults
        });
        return;
      }

      const currentFingerprint = computeFingerprint(newPhotos);

      if (currentFingerprint === analysisFingerprint && savedAiResults) {
        setUploading(true);
        await uploadPetPhotosMultipart(petId, newPhotos);
        setUploading(false);

        navigation.navigate("AddPetCharacteristics", {
          petId,
          isFromProfile,
          petName,
          breed,
          description,
          aiResults: savedAiResults
        });
        return;
      }

      setAnalyzingAI(true);
      
      let aiResults: AIAttributeResult[] | undefined;
      
      try {
        const analysisResponse = await analyzePetImages(newPhotos);

        if (analysisResponse.success && analysisResponse.attributes && analysisResponse.attributes.length > 0) {
          aiResults = analysisResponse.attributes;
          setSavedAiResults(aiResults);
          setAnalysisFingerprint(currentFingerprint);
        } else {
          const responseMessage = analysisResponse.message || '';
          const is503Error = responseMessage.includes('503') || 
                             responseMessage.includes('ServiceUnavailable') || 
                             responseMessage.includes('UNAVAILABLE') ||
                             responseMessage.includes('overloaded');
          
          if (is503Error) {
            showAlert({
              type: 'error',
              title: t('auth.addPet.photos.aiAnalysisFailed'),
              message: t('auth.addPet.photos.networkUnstable'),
            });
          } else if (savedAiResults && savedAiResults.length > 0) {
            showAlert({
              type: 'warning',
              title: t('auth.addPet.photos.aiAnalysisFailed'),
              message: t('auth.addPet.photos.usePreviousResultsMessage'),
              showCancel: true,
              confirmText: t('auth.addPet.photos.usePreviousResults'),
              cancelText: t('auth.addPet.photos.stayAndFix'),
              onConfirm: () => {
                navigation.navigate("AddPetCharacteristics", {
                  petId,
                  isFromProfile,
                  petName,
                  breed,
                  description,
                  aiResults: savedAiResults
                });
              },
            });
          } else {
            showAlert({
              type: 'error',
              title: t('auth.addPet.photos.aiAnalysisFailed'),
              message: responseMessage || t('auth.addPet.photos.aiAnalysisFailedMessage'),
            });
          }
          return;
        }
      } catch (aiError: any) {
        const statusCode = aiError?.response?.status;
        const serverError = aiError?.response?.data;
        const errorText = serverError?.message || aiError?.message || '';
        
        const is503Error = statusCode === 503 || 
                           errorText.includes('503') || 
                           errorText.includes('ServiceUnavailable') || 
                           errorText.includes('UNAVAILABLE') ||
                           errorText.includes('overloaded');

        if (is503Error) {
          showAlert({
            type: 'error',
            title: t('auth.addPet.photos.aiAnalysisFailed'),
            message: t('auth.addPet.photos.networkUnstable'),
          });
        } else if (savedAiResults && savedAiResults.length > 0) {
          showAlert({
            type: 'warning',
            title: t('auth.addPet.photos.aiAnalysisFailed'),
            message: t('auth.addPet.photos.usePreviousResultsMessage'),
            showCancel: true,
            confirmText: t('auth.addPet.photos.usePreviousResults'),
            cancelText: t('auth.addPet.photos.stayAndFix'),
            onConfirm: () => {
              navigation.navigate("AddPetCharacteristics", {
                petId,
                isFromProfile,
                petName,
                breed,
                description,
                aiResults: savedAiResults
              });
            },
          });
        } else {
          showAlert({
            type: 'error',
            title: t('auth.addPet.photos.aiAnalysisFailed'),
            message: errorText || t('auth.addPet.photos.aiAnalysisFailedMessage'),
          });
        }
        return;
      } finally {
        setAnalyzingAI(false);
      }

      setUploading(true);
      await uploadPetPhotosMultipart(petId, newPhotos);
      setUploading(false);

      showAlert({
        type: 'success',
        title: t('auth.addPet.photos.aiAnalysisComplete'),
        message: t('auth.addPet.photos.aiAnalysisMessage', { count: aiResults.length }),
        confirmText: t('common.continue'),
        onConfirm: () => {
          navigation.navigate("AddPetCharacteristics", {
            petId,
            isFromProfile,
            petName,
            breed,
            description,
            aiResults
          });
        },
      });
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
    // Back giữa các bước (2->1) - không xóa pet, chỉ quay lại step trước
    // Truyền savedAiResults để giữ lại kết quả AI khi back rồi next lại
    navigation.navigate("AddPetBasicInfo", {
      isFromProfile,
      petId,
      petName,
      breed,
      description,
      aiResults: savedAiResults,
    });
  };

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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>

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
          <Text style={styles.subtitle}>{t('auth.addPet.photos.subtitle')}</Text>
        </View>

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
                  
                  {photo.isFromDB && (
                    <View style={styles.dbBadge}>
                      <Icon name="cloud-done" size={12} color={colors.white} />
                    </View>
                  )}
                  
                  {!photo.isFromDB && (
                    <View style={styles.newBadge}>
                      <Icon name="add" size={12} color={colors.white} />
                    </View>
                  )}
                  
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

          <View style={styles.counterContainer}>
            <View style={[
              styles.counterBadge,
              photos.length >= 1 && styles.counterBadgeComplete
            ]}>
              <Icon
                name={photos.length >= 1 ? "checkmark-circle" : "images"}
                size={18}
                color={photos.length >= 1 ? colors.success : colors.textMedium}
              />
              <Text style={[
                styles.counterText,
                photos.length >= 1 && styles.counterTextComplete
              ]}>
                {photos.length >= 1 
                  ? t('auth.addPet.photos.photoCountReady', { count: photos.length, max: maxPhotos })
                  : t('auth.addPet.photos.photoCountNeed', { count: photos.length, max: maxPhotos, need: 1 - photos.length })}
              </Text>
            </View>
            
            {dbPhotoCount > 0 && (
              <Text style={styles.photoBreakdown}>
                {t('auth.addPet.photos.photoBreakdown', { db: dbPhotoCount, new: newPhotoCount })}
              </Text>
            )}
          </View>
        </View>

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

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.btnShadow, (photos.length < 1 || uploading || analyzingAI || loadingPhotos) && styles.btnDisabled]}
          onPress={handleNext}
          disabled={uploading || analyzingAI || photos.length < 1 || loadingPhotos}
        >
          <LinearGradient
            colors={photos.length < 1 ? [colors.textLight, colors.textLight] : gradients.auth.buttonPrimary}
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
