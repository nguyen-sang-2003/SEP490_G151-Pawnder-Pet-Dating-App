import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { getPetById, updatePet, getUserById, getAddressById, getPetPhotos, uploadPetPhotosMultipart, deletePetPhoto, reorderPetPhotos } from "../../../api";
import { colors, gradients } from "../../../theme";
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import OptimizedImage from "../../../components/OptimizedImage";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 80) / 3;

type Props = NativeStackScreenProps<RootStackParamList, "EditPet">;

const EditPetScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const petIdStr = route.params?.petId || "0";
  const petId = parseInt(petIdStr, 10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [description, setDescription] = useState("");

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");

  const [photos, setPhotos] = useState<any[]>([]);
  const maxPhotos = 6;

  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  // Load pet data
  useEffect(() => {
    const loadPetData = async () => {
      try {
        setLoading(true);

        if (!petId) {
          showAlert({
            type: 'error',
            title: t('common.error'),
            message: t('profile.editPet.loadError'),
            onClose: () => navigation.goBack(),
          });
          return;
        }

        const petData = await getPetById(petId);

        setName(petData.Name || petData.name || '');
        setBreed(petData.Breed || petData.breed || '');
        setAge(petData.Age?.toString() || petData.age?.toString() || '');
        setGender(petData.Gender || petData.gender || 'Male');
        setDescription(petData.Description || petData.description || '');

        const userId = petData.UserId || petData.userId;

        if (userId) {
          try {
            const userData = await getUserById(userId);
            const addressId = userData.AddressId || userData.addressId;

            if (addressId) {
              const address = await getAddressById(addressId);
              setCity(address?.City || address?.city || '');
              setDistrict(address?.District || address?.district || '');
              setWard(address?.Ward || address?.ward || '');
            }
          } catch (error) {
            // Address not found
          }
        }

        try {
          const photosData = await getPetPhotos(petId);
          setPhotos(photosData || []);
        } catch (error) {
          setPhotos([]);
        }

      } catch (error: any) {

        showAlert({
          type: 'error',
          title: t('common.error'),
          message: error.response?.data?.message || t('profile.editPet.loadError'),
        });
      } finally {
        setLoading(false);
      }
    };

    loadPetData();
  }, [petId, t]);

  const handleSave = async () => {
    if (!petId) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('profile.editPet.loadError'),
      });
      return;
    }

    // Validation: Kiểm tra tên pet trống
    if (!name.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Bạn chưa nhập tên thú cưng',
      });
      return;
    }

    // Validation: Kiểm tra độ dài tên pet
    if (name.trim().length < 2) {
      showAlert({
        type: 'error',
        title: 'Tên quá ngắn',
        message: 'Vui lòng nhập dài hơn',
      });
      return;
    }

    if (name.trim().length > 50) {
      showAlert({
        type: 'error',
        title: 'Tên quá dài',
        message: 'Vui lòng nhập ngắn hơn',
      });
      return;
    }

    if (breed.trim().length > 50) {
      showAlert({
        type: 'error',
        title: 'Tên giống quá dài',
        message: 'Vui lòng nhập ngắn hơn',
      });
      return;
    }

    if (description.trim().length > 200) {
      showAlert({
        type: 'error',
        title: 'Mô tả quá dài',
        message: 'Vui lòng nhập ngắn hơn',
      });
      return;
    }

    // Validation: Kiểm tra tuổi hợp lệ
    if (age && parseInt(age) < 0) {
      showAlert({
        type: 'error',
        title: t('profile.editPet.validation.invalidAge'),
        message: t('profile.editPet.validation.ageNegative'),
      });
      return;
    }

    if (age && parseInt(age) > 30) {
      showAlert({
        type: 'error',
        title: t('profile.editPet.validation.invalidAge'),
        message: t('profile.editPet.validation.ageMax'),
      });
      return;
    }

    try {
      setSaving(true);

      await updatePet(petId, {
        Name: name.trim(),
        Breed: breed.trim() || undefined,
        Gender: gender,
        Age: age ? parseInt(age, 10) : undefined,
        Description: description.trim() || undefined,
        IsActive: true,
      });

      showAlert({
        type: 'success',
        title: t('common.success'),
        message: t('profile.editPet.saveSuccess'),
        onClose: () => navigation.goBack(),
      });
    } catch (error: any) {

      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.response?.data?.message || t('profile.editPet.saveError'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddPhoto = async () => {
    if (photos.length >= maxPhotos) {
      showAlert({
        type: 'warning',
        title: t('profile.editPet.photos.limitTitle'),
        message: t('profile.editPet.photos.limitMessage', { max: maxPhotos }),
      });
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

        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('profile.editPet.photos.uploadError'),
        });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setUploading(true);

        // Prepare photos for upload
        const newPhotos = result.assets.map((asset: Asset) => ({
          uri: asset.uri || '',
          type: asset.type,
          fileName: asset.fileName,
        }));

        const response = await uploadPetPhotosMultipart(petId, newPhotos);

        const photosData = await getPetPhotos(petId);
        setPhotos(photosData || []);

        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('profile.editPet.photos.uploadSuccess'),
        });
      }
    } catch (error: any) {

      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('profile.editPet.photos.uploadError'),
      });
    } finally {
      setUploading(false);
    }
  };


  const handleMovePhoto = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= photos.length) return;

    // Create new array with swapped positions
    const newPhotos = [...photos];
    const [movedItem] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedItem);

    // Update sortOrder for all photos
    const reorderData = newPhotos.map((photo, index) => ({
      photoId: photo.PhotoId || photo.photoId,
      sortOrder: index,
    }));

    try {
      // Optimistically update UI
      setPhotos(newPhotos);

      // Call API
      await reorderPetPhotos(reorderData);
    } catch (error: any) {


      // Revert on error
      setPhotos(photos);

      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('profile.editPet.photos.reorderError')
      });
    }
  };

  const handleDeletePhoto = async (photo: any) => {
    const photoId = photo.PhotoId || photo.photoId;

    // Không cho xóa nếu chỉ còn 1 ảnh duy nhất
    if (photos.length <= 1) {
      showAlert({
        type: 'warning',
        title: t('profile.editPet.photos.cannotDelete'),
        message: t('profile.editPet.photos.minPhotosRequired'),
      });
      return;
    }

    showAlert({
      type: 'warning',
      title: t('profile.editPet.photos.deleteTitle'),
      message: t('profile.editPet.photos.deleteMessage'),
      showCancel: true,
      confirmText: t('profile.editPet.photos.deleteConfirm'),
      onConfirm: async () => {
        try {
          await deletePetPhoto(photoId);

          // Reload photos (backend will auto-reorder by SortOrder)
          const photosData = await getPetPhotos(petId);
          setPhotos(photosData || []);

          showAlert({
            type: 'success',
            title: t('common.success'),
            message: t('profile.editPet.photos.deleteSuccess'),
          });
        } catch (error: any) {

          showAlert({
            type: 'error',
            title: t('common.error'),
            message: t('profile.editPet.photos.deleteError'),
          });
        }
      },
    });
  };

  // Show loading spinner
  if (loading) {
    return (
      <LinearGradient
        colors={["#FFF5F9", "#FDE8EF"]}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMedium }}>{t('profile.editPet.loading')}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#FFF5F9", "#FDE8EF"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.editPet.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#C8A8D4", "#E8D5EE"]}
              style={styles.avatarGradient}
            >
              {photos.length > 0 && photos[0] ? (
                <OptimizedImage
                  source={{ uri: photos[0].ImageUrl || photos[0].imageUrl || photos[0].Url || photos[0].url }}
                  style={styles.avatar}
                  resizeMode="cover"
                  imageSize="thumbnail"
                />
              ) : (
                <Image
                  source={require("../../../assets/cat_avatar.png")}
                  style={styles.avatar}
                />
              )}
            </LinearGradient>
          </View>
          <Text style={styles.changePhotoText}>{t('profile.editPet.changePhoto')}</Text>
        </View>

        {/* Photos Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.editPet.photos.count', { current: photos.length, max: maxPhotos })}</Text>
            <TouchableOpacity
              onPress={handleAddPhoto}
              disabled={uploading || photos.length >= maxPhotos}
              style={[styles.addPhotoBtn, (uploading || photos.length >= maxPhotos) && styles.addPhotoBtnDisabled]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FF6EA7" />
              ) : (
                <Icon name="add" size={20} color={photos.length >= maxPhotos ? "#CCC" : "#FF6EA7"} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.photosGrid}>
            {photos.map((photo: any, index: number) => (
              <View
                key={photo.PhotoId || photo.photoId || index}
                style={styles.photoItem}
              >
                <View style={styles.photoImageContainer}>
                  <OptimizedImage
                    source={{ uri: photo.ImageUrl || photo.imageUrl || photo.Url || photo.url }}
                    style={styles.photoImage}
                    resizeMode="cover"
                    imageSize="thumbnail"
                  />
                </View>

                {/* Primary star badge - bottom left (first photo only) */}
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Icon name="star" size={18} color="#FFD700" />
                  </View>
                )}

                {/* Reorder arrows - top center */}
                <View style={styles.reorderButtons}>
                  <TouchableOpacity
                    style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                    onPress={() => handleMovePhoto(index, index - 1)}
                    activeOpacity={0.7}
                    disabled={index === 0}
                  >
                    <Icon name="chevron-back" size={14} color={index === 0 ? "#666" : "#FFF"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reorderBtn, index === photos.length - 1 && styles.reorderBtnDisabled]}
                    onPress={() => handleMovePhoto(index, index + 1)}
                    activeOpacity={0.7}
                    disabled={index === photos.length - 1}
                  >
                    <Icon name="chevron-forward" size={14} color={index === photos.length - 1 ? "#666" : "#FFF"} />
                  </TouchableOpacity>
                </View>

                {/* Delete button - bottom right */}
                <TouchableOpacity
                  style={styles.deletePhotoBtn}
                  onPress={() => handleDeletePhoto(photo)}
                  activeOpacity={0.7}
                >
                  <Icon name="trash" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Empty slots */}
            {Array.from({ length: maxPhotos - photos.length }).map((_, index) => (
              <View key={`empty-${index}`} style={[styles.photoItem, styles.emptyPhotoSlot]}>
                <Icon name="image-outline" size={30} color="#DDD" />
              </View>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.editPet.form.title')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.editPet.form.name')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('profile.editPet.form.namePlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.editPet.form.breed')}</Text>
            <TextInput
              style={styles.input}
              value={breed}
              onChangeText={setBreed}
              placeholder={t('profile.editPet.form.breedPlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.editPet.form.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('profile.editPet.form.descriptionPlaceholder')}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Edit Characteristics Button */}
          <TouchableOpacity
            style={styles.editCharacteristicsBtn}
            onPress={() => navigation.navigate('AddPetCharacteristics', { petId, isFromProfile: true })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradients.primary}
              style={styles.editCharacteristicsBtnGradient}
            >
              <Icon name="create-outline" size={20} color="#FFF" />
              <Text style={styles.editCharacteristicsBtnText}>{t('profile.editPet.editCharacteristics')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Owner's Location (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.editPet.ownerLocation.title')}</Text>

            <View style={styles.readOnlyField}>
              <Icon name="location-outline" size={16} color="#666" />
              <Text style={styles.readOnlyText}>
                {[ward, district, city].filter(Boolean).join(', ') || t('profile.editPet.ownerLocation.noLocation')}
              </Text>
            </View>
          </View>

          {/* Note about location */}
          <View style={styles.noteCard}>
            <Icon name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.noteText}>
              {t('profile.editPet.ownerLocation.note')}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.btnShadow}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={saving ? ["#CCC", "#DDD"] : ["#FF6EA7", "#FF9BC0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>{t('profile.editPet.saving')}</Text>
              </>
            ) : (
              <Text style={styles.saveButtonText}>{t('profile.editPet.saveChanges')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
          onConfirm={alertConfig.onConfirm}
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel}
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },

  // Avatar Section
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  changePhotoText: {
    fontSize: 14,
    color: "#C8A8D4",
    fontWeight: "600",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addPhotoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF6EA7",
  },
  addPhotoBtnDisabled: {
    borderColor: "#DDD",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },
  photoImageContainer: {
    width: "100%",
    height: "100%",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  emptyPhotoSlot: {
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(255, 110, 167, 0.9)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  deletePhotoBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(255, 0, 0, 0.9)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  reorderButtons: {
    position: "absolute",
    top: 6,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    zIndex: 5,
  },
  reorderBtn: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  reorderBtnDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#333",
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  // Button
  btnShadow: {
    borderRadius: 26,
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  editCharacteristicsBtn: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editCharacteristicsBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  editCharacteristicsBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 26,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Read-only field
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 10,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
    color: "#666",
  },

  // Note
  noteCard: {
    flexDirection: "row",
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D0E8FF",
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
});

export default EditPetScreen;

