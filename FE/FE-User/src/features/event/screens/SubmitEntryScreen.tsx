/**
 * SubmitEntryScreen
 * Modern form to submit entry to an event
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { submitEntry, selectEventSubmitting, selectEventError, clearError } from '../eventSlice';
import { EventService } from '../event.service';
import { SubmitEntryRequest, MediaType } from '../../../types/event.types';
import { getPetsByUserId, PetResponse } from '../../pet/api/petApi';
import { colors, gradients, radius, shadows, spacing, typography } from '../../../theme';
import CustomAlert from '../../../components/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';
import { useAuthCheck } from '../../../hooks/useAuthCheck';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<any, 'SubmitEntry'>;

interface SelectedMedia {
  uri: string;
  type: MediaType;
  fileName?: string;
}

const SubmitEntryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId } = route.params as { eventId: number };
  const dispatch = useAppDispatch();
  const submitting = useAppSelector(selectEventSubmitting);
  const error = useAppSelector(selectEventError);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const { requireAuth, getUserId } = useAuthCheck();

  const [pets, setPets] = useState<PetResponse[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadPets = async () => {
      const isAuth = await requireAuth('EventDetail', { eventId });
      if (!isAuth) return;

      try {
        setLoadingPets(true);
        const userId = await getUserId();
        if (!userId) {
          showAlert({
            type: 'error',
            title: 'Lỗi',
            message: 'Vui lòng đăng nhập để tiếp tục',
            onConfirm: () => navigation.goBack(),
          });
          return;
        }

        const userPets = await getPetsByUserId(userId);
        setPets(userPets);

        if (userPets.length === 1) {
          const pet = userPets[0];
          setSelectedPetId(pet.PetId || pet.petId || null);
        }
      } catch (err) {
        showAlert({
          type: 'error',
          title: 'Lỗi',
          message: 'Không thể tải danh sách thú cưng',
        });
      } finally {
        setLoadingPets(false);
      }
    };

    checkAuthAndLoadPets();

    return () => {
      dispatch(clearError());
    };
  }, [dispatch, navigation, showAlert, requireAuth, getUserId, eventId]);

  const handleSelectMedia = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.6, // Giảm quality xuống 0.6 để file nhỏ hơn
        maxWidth: 1280, // Giảm xuống 1280px (đủ cho mobile)
        maxHeight: 1280,
        selectionLimit: 1,
        videoQuality: 'low', // Giảm video quality
      });

      if (result.didCancel) return;

      if (result.errorCode) {
        showAlert({
          type: 'error',
          title: 'Lỗi',
          message: 'Không thể chọn ảnh/video',
        });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo = asset.type?.startsWith('video') || false;

        // Check file size (max 10MB)
        const fileSizeInMB = (asset.fileSize || 0) / (1024 * 1024);
        if (fileSizeInMB > 10) {
          showAlert({
            type: 'warning',
            title: 'File quá lớn',
            message: `File của bạn có kích thước ${fileSizeInMB.toFixed(1)}MB. Vui lòng chọn file nhỏ hơn 10MB.`,
          });
          return;
        }

        setSelectedMedia({
          uri: asset.uri || '',
          type: isVideo ? 'video' : 'image',
          fileName: asset.fileName,
        });
      }
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể chọn ảnh/video',
      });
    }
  }, [showAlert]);

  const handleSelectPet = useCallback((petId: number) => {
    setSelectedPetId(petId);
    setShowPetPicker(false);
  }, []);

  const getSelectedPet = useCallback(() => {
    if (!selectedPetId) return null;
    return pets.find(p => (p.PetId || p.petId) === selectedPetId);
  }, [pets, selectedPetId]);

  const isFormValid = selectedPetId && selectedMedia;

  const handleSubmit = useCallback(async () => {
    if (!selectedPetId || !selectedMedia) {
      showAlert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn thú cưng và ảnh/video dự thi',
      });
      return;
    }

    const isAuth = await requireAuth('EventDetail', { eventId });
    if (!isAuth) return;

    try {
      // Step 1: Upload media to cloud first
      setUploading(true);

      const uploadResult = await EventService.uploadMedia(
        selectedMedia.uri,
        selectedMedia.fileName,
        selectedMedia.type === 'video' ? 'video/mp4' : 'image/jpeg'
      );

      // Step 2: Submit entry with cloud URL
      const request: SubmitEntryRequest = {
        petId: selectedPetId,
        mediaUrl: uploadResult.mediaUrl,
        mediaType: uploadResult.mediaType,
        caption: caption.trim() || undefined,
      };

      await dispatch(submitEntry({ eventId, request })).unwrap();
      
      setUploading(false);
      
      // Hiển thị thông báo thành công trước
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Đã đăng bài dự thi thành công!',
        onConfirm: () => {
          // Sau khi user đóng alert, quay về EventDetail
          navigation.goBack();
        },
      });
    } catch (err: any) {
      setUploading(false);
      
      // Parse error message
      let errorMessage = 'Không thể đăng bài dự thi';
      if (err.message) {
        if (err.message.includes('upload')) {
          errorMessage = 'Lỗi khi tải ảnh/video lên. Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Quá thời gian chờ. Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else {
          errorMessage = err.message;
        }
      }
      
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: errorMessage,
      });
    }
  }, [dispatch, eventId, selectedPetId, selectedMedia, caption, navigation, showAlert, requireAuth]);

  const selectedPet = getSelectedPet();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tham gia cuộc thi</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Pet Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.sectionTitle}>Chọn thú cưng</Text>
            </View>
            
            {loadingPets ? (
              <View style={styles.loadingPets}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : pets.length === 0 ? (
              <View style={styles.noPets}>
                <View style={styles.noPetsIcon}>
                  <Icon name="paw-outline" size={32} color={colors.textLight} />
                </View>
                <Text style={styles.noPetsText}>Bạn chưa có thú cưng nào</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.petSelector}
                onPress={() => setShowPetPicker(!showPetPicker)}
              >
                {selectedPet ? (
                  <View style={styles.selectedPetRow}>
                    <Image
                      source={{
                        uri:
                          selectedPet.UrlImageAvatar ||
                          selectedPet.urlImageAvatar ||
                          'https://via.placeholder.com/50',
                      }}
                      style={styles.petAvatar}
                    />
                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>
                        {selectedPet.Name || selectedPet.name}
                      </Text>
                      <Text style={styles.petBreed}>
                        {selectedPet.Breed || selectedPet.breed || 'Không rõ giống'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.petPlaceholder}>Chọn thú cưng của bạn</Text>
                )}
                <View style={styles.chevronBg}>
                  <Icon
                    name={showPetPicker ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textMedium}
                  />
                </View>
              </TouchableOpacity>
            )}

            {/* Pet Picker Dropdown */}
            {showPetPicker && pets.length > 0 && (
              <View style={styles.petDropdown}>
                {pets.map(pet => {
                  const petId = pet.PetId || pet.petId;
                  const isSelected = petId === selectedPetId;
                  return (
                    <TouchableOpacity
                      key={petId}
                      style={[styles.petOption, isSelected && styles.petOptionSelected]}
                      onPress={() => handleSelectPet(petId!)}
                    >
                      <Image
                        source={{
                          uri:
                            pet.UrlImageAvatar ||
                            pet.urlImageAvatar ||
                            'https://via.placeholder.com/40',
                        }}
                        style={styles.petOptionAvatar}
                      />
                      <View style={styles.petOptionInfo}>
                        <Text style={styles.petOptionName}>{pet.Name || pet.name}</Text>
                        <Text style={styles.petOptionBreed}>
                          {pet.Breed || pet.breed || 'Không rõ giống'}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Icon name="checkmark" size={16} color={colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Step 2: Media Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.sectionTitle}>Ảnh/Video dự thi</Text>
            </View>
            
            <TouchableOpacity style={styles.mediaSelector} onPress={handleSelectMedia}>
              {selectedMedia ? (
                <View style={styles.mediaPreview}>
                  <Image source={{ uri: selectedMedia.uri }} style={styles.mediaImage} />
                  {selectedMedia.type === 'video' && (
                    <View style={styles.videoOverlay}>
                      <View style={styles.playButton}>
                        <Icon name="play" size={32} color={colors.white} />
                      </View>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => setSelectedMedia(null)}
                  >
                    <Icon name="close" size={18} color={colors.white} />
                  </TouchableOpacity>
                  <View style={styles.changeMediaBadge}>
                    <Icon name="camera-outline" size={14} color={colors.white} />
                    <Text style={styles.changeMediaText}>Đổi ảnh</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.mediaPlaceholder}>
                  <View style={styles.mediaIconBg}>
                    <Icon name="camera" size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.mediaPlaceholderText}>
                    Nhấn để chọn ảnh hoặc video
                  </Text>
                  <Text style={styles.mediaHint}>Hỗ trợ JPG, PNG, MP4</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Step 3: Caption */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepBadge, styles.stepBadgeOptional]}>
                <Text style={[styles.stepNumber, styles.stepNumberOptional]}>3</Text>
              </View>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.optionalLabel}>(tùy chọn)</Text>
            </View>
            
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Viết vài dòng về bé cưng của bạn..."
                placeholderTextColor={colors.textLight}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{caption.length}/500</Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || submitting || uploading}
          >
            <LinearGradient
              colors={isFormValid ? gradients.primary : ['#D0D0D0', '#D0D0D0']}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {(submitting || uploading) ? (
                <>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.submitButtonText}>
                    {uploading ? 'Đang tải ảnh...' : 'Đang gửi...'}
                  </Text>
                </>
              ) : (
                <>
                  <Icon name="send" size={20} color={colors.white} />
                  <Text style={styles.submitButtonText}>Gửi bài dự thi</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={hideAlert}
          onConfirm={alertConfig.onConfirm}
          showCancel={alertConfig.showCancel}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FAFBFC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerRight: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeOptional: {
    backgroundColor: colors.textLight,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  stepNumberOptional: {
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  optionalLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  loadingPets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  noPets: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 16,
    gap: spacing.sm,
  },
  noPetsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPetsText: {
    fontSize: 15,
    color: colors.textMedium,
  },
  petSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 16,
    ...shadows.small,
  },
  selectedPetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  petBreed: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },
  petPlaceholder: {
    fontSize: 15,
    color: colors.textLight,
  },
  chevronBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petDropdown: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.small,
  },
  petOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  petOptionSelected: {
    backgroundColor: colors.primaryPastel,
  },
  petOptionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.md,
  },
  petOptionInfo: {
    flex: 1,
  },
  petOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  petOptionBreed: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaSelector: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadows.small,
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.sm,
  },
  mediaIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primaryPastel,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mediaPlaceholderText: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '500',
  },
  mediaHint: {
    fontSize: 13,
    color: colors.textLight,
  },
  mediaPreview: {
    position: 'relative',
    aspectRatio: 1,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeMediaButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeMediaBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  changeMediaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  captionContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.small,
  },
  captionInput: {
    fontSize: 15,
    color: colors.textDark,
    minHeight: 100,
    padding: 0,
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.button,
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default SubmitEntryScreen;
