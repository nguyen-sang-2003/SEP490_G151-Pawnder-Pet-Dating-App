import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
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
import { uploadPetPhotosBatch, completeUserProfile } from "../../../api";
import { getItem } from "../../../utils/storage";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 60) / 3; // 3 columns with padding

type Props = NativeStackScreenProps<RootStackParamList, "AddPetPhotos">;

interface Photo {
  id: string;
  uri: string;
}

const AddPetPhotosScreen = ({ navigation, route }: Props) => {
  const { petId, isFromProfile } = route.params;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const maxPhotos = 6;
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const handleAddPhoto = () => {
    // TODO: Implement image picker
    // For now, show placeholder
    if (photos.length >= maxPhotos) {
      Alert.alert("Limit Reached", `You can only add up to ${maxPhotos} photos`);
      return;
    }
    
    Alert.alert(
      "Add Photo",
      "Image picker will be implemented here",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Add Sample", 
          onPress: () => {
            const newPhoto: Photo = {
              id: Date.now().toString(),
              uri: `https://placekitten.com/400/400?image=${photos.length + 1}`,
            };
            setPhotos([...photos, newPhoto]);
          }
        },
      ]
    );
  };

  const handleRemovePhoto = (id: string) => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setPhotos(photos.filter(p => p.id !== id)),
        },
      ]
    );
  };

  const handleNext = async () => {
    if (photos.length === 0) {
      showAlert({
        type: 'warning',
        title: 'Chưa có ảnh',
        message: 'Vui lòng thêm ít nhất 1 ảnh cho thú cưng!',
      });
      return;
    }

    try {
      setUploading(true);

      // Upload photos to backend
      const imageUrls = photos.map(p => p.uri);
      await uploadPetPhotosBatch(petId, imageUrls);

      console.log('✅ Pet photos uploaded successfully');

      // Mark user profile as complete (if not from profile)
      if (!isFromProfile) {
        try {
          const userIdStr = await getItem('userId');
          console.log('Retrieved userId from storage:', userIdStr);
          
          if (userIdStr) {
            const userId = parseInt(userIdStr, 10);
            console.log('Parsed userId:', userId);
            
            if (isNaN(userId) || userId <= 0) {
              console.error('Invalid userId:', userId);
              throw new Error('Invalid userId');
            }
            
            await completeUserProfile(userId);
            console.log('✅ User profile marked as complete');
          } else {
            console.warn('No userId found in storage');
          }
        } catch (err) {
          console.warn('Failed to mark profile complete, but continuing:', err);
          // Don't block user if this fails
        }
      }

      showAlert({
        type: 'success',
        title: 'Hoàn tất! 🎉',
        message: 'Thú cưng của bạn đã được tạo thành công!',
        confirmText: 'Về trang chủ',
        onClose: () => {
          if (isFromProfile) {
            navigation.navigate("Profile");
          } else {
            navigation.replace("Home");
          }
        },
      });
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.',
      });
    } finally {
      setUploading(false);
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

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.stepText}>Step 3 of 3</Text>
          <Text style={styles.title}>Add Pet Photos 📸</Text>
          <Text style={styles.subtitle}>
            Add at least 1 photo (up to {maxPhotos})
          </Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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
                  <Icon name="close-circle" size={28} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add Photo Buttons */}
            {photos.length < maxPhotos && (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
              >
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.addPhotoGradient}
                >
                  <Icon name="camera" size={32} color={colors.white} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Photo Counter */}
          <View style={styles.counterContainer}>
            <Icon name="images" size={20} color={colors.primary} />
            <Text style={styles.counterText}>
              {photos.length} / {maxPhotos} photos
            </Text>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Icon name="bulb" size={24} color="#FFA500" />
            <Text style={styles.tipsTitle}>Photo Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.tipText}>Use clear, well-lit photos</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.tipText}>Show your cat's personality</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.tipText}>Include full body and close-up shots</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.tipText}>Avoid blurry or dark images</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.btnShadow, { flex: 1 }]}
          onPress={handleNext}
          disabled={uploading}
        >
          <LinearGradient
            colors={gradients.primary}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {uploading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.buttonText}>Finish</Text>
                <Icon name="checkmark-circle" size={20} color={colors.white} />
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
    paddingBottom: 140,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
  headerTextContainer: {},
  stepText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMedium,
  },

  // Photos
  photosContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  photoWrapper: {
    position: "relative",
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.cardBackground,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 14,
    ...shadows.medium,
  },
  addPhotoButton: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  addPhotoGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },

  // Counter
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.whiteWarm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    ...shadows.small,
  },
  counterText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },

  // Tips Card
  tipsCard: {
    marginHorizontal: 20,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.medium,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: colors.whiteWarm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.large,
  },
  btnShadow: {
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

