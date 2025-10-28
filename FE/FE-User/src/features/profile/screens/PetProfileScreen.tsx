import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { getPetById, getPetCharacteristics, getPetPhotos, type PetCharacteristic, sendLike, blockUser } from "../../../api";
import { colors, radius, shadows } from "../../../theme";
import { getItem } from "../../../utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "PetProfile">;

const PetProfileScreen = ({ navigation, route }: Props) => {
  const petIdStr = route.params?.petId || "0";
  const petId = parseInt(petIdStr, 10);

  const [loading, setLoading] = useState(true);
  const [petData, setPetData] = useState<any>(null);
  const [characteristics, setCharacteristics] = useState<PetCharacteristic[]>([]);
  const [petPhotos, setPetPhotos] = useState<any[]>([]);
  const [isMyPet, setIsMyPet] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [sendingMatchRequest, setSendingMatchRequest] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const loadPetData = async () => {
    try {
      setLoading(true);

      if (!petId) {
        showAlert({ type: 'error', title: 'Lỗi', message: 'Không tìm thấy thông tin pet', onClose: () => navigation.goBack() });
        return;
      }

      console.log('📱 Loading pet profile for petId:', petId);

      // Get current user ID
      const userIdStr = await getItem('userId');
      const currentUserId = userIdStr ? parseInt(userIdStr, 10) : null;

      // Load pet data
      const pet = await getPetById(petId);
      setPetData(pet);
      console.log('✅ Pet data loaded:', pet);

      // Check if this is my pet
      const petUserId = pet.UserId || pet.userId;
      const isOwner = !!(currentUserId && petUserId === currentUserId);
      setIsMyPet(isOwner);
      console.log('🔍 Is my pet:', isOwner);

      // Load photos
      try {
        const photos = await getPetPhotos(petId);
        const sortedPhotos = photos.sort((a: any, b: any) => {
          if (a.IsPrimary || a.isPrimary) return -1;
          if (b.IsPrimary || b.isPrimary) return 1;
          const aSort = a.SortOrder ?? a.sortOrder ?? 0;
          const bSort = b.SortOrder ?? b.sortOrder ?? 0;
          return aSort - bSort;
        });
        setPetPhotos(sortedPhotos || []);
        console.log('📸 Pet photos loaded:', sortedPhotos.length);
      } catch (error) {
        console.log('⚠️ No photos found');
        setPetPhotos([]);
      }

      // Load characteristics
      try {
        const chars = await getPetCharacteristics(petId);
        setCharacteristics(chars);
        console.log('🎯 Characteristics loaded:', chars);
      } catch (error) {
        console.log('⚠️ No characteristics found');
        setCharacteristics([]);
      }

    } catch (error: any) {
      console.error('❌ Error loading pet data:', error);
      showAlert({ type: 'error', title: 'Lỗi', message: error.response?.data?.message || 'Không thể tải thông tin pet' });
    } finally {
      setLoading(false);
    }
  };

  // Auto reload when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 PetProfileScreen focused - reloading data');
      loadPetData();
    }, [petId])
  );

  // Parse owner and address from API response
  const ownerData = petData?.Owner || petData?.owner;
  const addressData = ownerData?.Address || ownerData?.address;

  console.log('🔍 PetProfile - ownerData:', ownerData);
  console.log('🔍 PetProfile - addressData:', addressData);

  // Format location - Only show city for other people's pets for privacy
  const city = addressData?.City || addressData?.city;
  const district = addressData?.District || addressData?.district;
  const ward = addressData?.Ward || addressData?.ward;
  
  const location = addressData 
    ? (isMyPet 
        ? [ward, district, city].filter(Boolean).join(', ') || 'Unknown location'
        : city || 'Unknown location')
    : null;

  const fullAddress = addressData?.FullAddress || addressData?.fullAddress;

  console.log('📍 PetProfile - location:', location);
  console.log('📍 PetProfile - fullAddress:', fullAddress);

  // Prepare photos array
  let photos;
  if (petPhotos && petPhotos.length > 0) {
    photos = petPhotos.map((photo: any) => ({
      uri: photo.ImageUrl || photo.imageUrl || photo.Url || photo.url
    }));
  } else {
    const avatarUrl = petData?.UrlImageAvatar || petData?.urlImageAvatar;
    photos = avatarUrl 
      ? [{ uri: avatarUrl }]
      : [require("../../../assets/cat_avatar.png")];
  }

  // Mock pet data for fallback
  const pet = petData ? {
    id: petIdStr,
    name: petData.Name || petData.name || 'Unknown',
    breed: petData.Breed || petData.breed || 'Unknown breed',
    age: petData.Age ? `${petData.Age} years` : (petData.age ? `${petData.age} years` : 'Unknown'),
    gender: petData.Gender || petData.gender || 'Unknown',
    description: petData.Description || petData.description || 'No description available',
    avatar: photos[0], // Use first photo as avatar
    photos, // All photos for swipe
    location,
    fullAddress,
    owner: {
      userId: ownerData?.UserId || ownerData?.userId,
      name: ownerData?.FullName || ownerData?.fullName || "Unknown Owner",
      email: ownerData?.Email || ownerData?.email,
      gender: ownerData?.Gender || ownerData?.gender,
      status: "Member", // TODO: Premium status
      avatar: require("../../../assets/cat_avatar_signin.png"), // TODO: User avatar
    },
  } : {
    id: petIdStr,
    name: "Loading...",
    breed: "...",
    age: "...",
    gender: "...",
    description: "...",
    avatar: require("../../../assets/cat_avatar.png"),
    location: null,
    fullAddress: null,
    owner: {
      userId: null,
      name: "...",
      email: null,
      gender: null,
      status: "...",
      avatar: require("../../../assets/cat_avatar_signin.png"),
    },
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => 
      prev === (pet.photos?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => 
      prev === 0 ? (pet.photos?.length || 1) - 1 : prev - 1
    );
  };

  const handleEditPet = () => {
    navigation.navigate("EditPet", { petId: petIdStr });
  };

  const handleBlock = async () => {
    try {
      const currentUserIdStr = await AsyncStorage.getItem('userId');
      if (!currentUserIdStr) {
        showAlert({ type: 'error', title: 'Lỗi', message: 'Không tìm thấy thông tin người dùng' });
        return;
      }
      const currentUserId = parseInt(currentUserIdStr, 10);

      showAlert({
        type: 'warning',
        title: "Chặn người dùng",
        message: `Bạn có chắc muốn chặn ${pet.owner.name}? Bạn sẽ không thấy thú cưng của họ nữa.`,
        showCancel: true,
        confirmText: "Chặn",
        onConfirm: async () => {
          try {
            await blockUser(currentUserId, pet.owner.userId);
            showAlert({
              type: 'success',
              title: "Đã chặn",
              message: `${pet.owner.name} đã bị chặn.`,
              onClose: () => navigation.navigate('Home'),
            });
          } catch (error: any) {
            console.error('❌ Block error:', error);
            showAlert({ type: 'error', title: 'Lỗi', message: error.message || 'Không thể chặn người dùng' });
          }
        },
      });
    } catch (error) {
      console.error('❌ Error:', error);
      showAlert({ type: 'error', title: 'Lỗi', message: 'Đã xảy ra lỗi' });
    }
  };

  const handleReport = () => {
    // TODO: Navigate to Report screen
    navigation.navigate("Report" as any, { 
      userId: pet.id, 
      userName: pet.owner.name 
    });
  };

  const handleSendMatchRequest = async () => {
    try {
      setSendingMatchRequest(true);
      console.log('💘 Sending match request...');
      
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        showAlert({ type: 'error', title: 'Lỗi', message: 'Vui lòng đăng nhập trước' });
        return;
      }
      
      const currentUserId = parseInt(userIdStr);
      const ownerUserId = petData?.Owner?.UserId || petData?.Owner?.userId || ownerData?.UserId || ownerData?.userId;
      
      if (!ownerUserId) {
        showAlert({ type: 'error', title: 'Lỗi', message: 'Không tìm thấy thông tin chủ pet' });
        return;
      }
      
      const response = await sendLike({
        fromUserId: currentUserId,
        toUserId: ownerUserId
      });
      
      console.log('✅ Match request sent:', response);
      
      if (response.isMatch) {
        showAlert({
          type: 'success',
          title: "It's a Match! 🎉",
          message: `You matched with ${pet.owner.name}! You can now chat with them.`,
          confirmText: 'Go to Chat',
          onConfirm: () => navigation.navigate('Chat', {}),
        });
      } else {
        showAlert({
          type: 'success',
          title: 'Match Request Sent! 💌',
          message: `Your match request has been sent to ${pet.owner.name}. They will see it in their Favorites.`,
          onClose: () => navigation.goBack(),
        });
      }
    } catch (error: any) {
      console.error('❌ Error sending match request:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send match request';
      showAlert({ type: 'error', title: 'Lỗi', message: errorMsg });
    } finally {
      setSendingMatchRequest(false);
    }
  };

  // Show loading
  if (loading) {
    return (
      <LinearGradient
        colors={["#FFF5F9", "#FDE8EF"]}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMedium }}>Loading pet profile...</Text>
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
          {/* Edit button - only show for my pet */}
          {isMyPet && (
            <TouchableOpacity onPress={handleEditPet}>
              <Icon name="pencil" size={24} color="#FF6EA7" />
            </TouchableOpacity>
          )}
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#C8A8D4", "#E8D5EE"]}
              style={styles.avatarGradient}
            >
              <Image source={pet.photos?.[activePhotoIndex] || pet.avatar} style={styles.avatar} />
              
              {/* Photo Navigation */}
              {pet.photos && pet.photos.length > 1 && (
                <>
                  <TouchableOpacity 
                    style={[styles.photoNavBtn, styles.photoNavBtnLeft]}
                    onPress={handlePrevPhoto}
                  >
                    <Icon name="chevron-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.photoNavBtn, styles.photoNavBtnRight]}
                    onPress={handleNextPhoto}
                  >
                    <Icon name="chevron-forward" size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  {/* Photo Indicators */}
                  <View style={styles.photoIndicators}>
                    {pet.photos.map((_: any, index: number) => (
                      <View
                        key={index}
                        style={[
                          styles.photoIndicator,
                          index === activePhotoIndex && styles.photoIndicatorActive
                        ]}
                      />
                    ))}
                  </View>
                </>
              )}
            </LinearGradient>
            
            {/* Edit button - only show for my pet */}
            {isMyPet && (
              <TouchableOpacity style={styles.editIconBtn} onPress={handleEditPet}>
                <LinearGradient
                  colors={["#FF6EA7", "#FF9BC0"]}
                  style={styles.editIconGradient}
                >
                  <Icon name="pencil" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
        </View>

        {/* Pet Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Breed</Text>
              <Text style={styles.infoValue}>{pet.breed}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{pet.age}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{pet.gender}</Text>
            </View>
          </View>

          {/* Description */}
          {pet.description && pet.description !== 'No description available' && (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{pet.description}</Text>
            </View>
          )}
        </View>

        {/* Pet Characteristics */}
        {characteristics.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Characteristics</Text>
              <Text style={styles.sectionSubtitle}>{characteristics.length} attributes</Text>
            </View>
            <View style={styles.characteristicsGrid}>
              {characteristics.map((char, index) => (
                <View key={index} style={styles.characteristicCard}>
                  <View style={styles.characteristicHeader}>
                    <Icon 
                      name={
                        char.typeValue === 'string' ? 'paw' : 
                        char.typeValue === 'float' || char.typeValue === 'number' ? 'fitness' : 
                        'information-circle'
                      } 
                      size={16} 
                      color={colors.primary} 
                    />
                    <Text style={styles.characteristicName}>{char.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.characteristicValueContainer}>
                    {char.optionValue ? (
                      <Text style={styles.characteristicValue}>{char.optionValue}</Text>
                    ) : char.value !== null && char.value !== undefined ? (
                      <Text style={styles.characteristicValue}>
                        {char.value} {char.unit || ''}
                      </Text>
                    ) : (
                      <Text style={styles.characteristicValueEmpty}>Not set</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Owner Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owner Information</Text>

          <View style={styles.ownerCard}>
            <View style={styles.ownerInfo}>
              <Image source={pet.owner.avatar} style={styles.ownerAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerName}>{pet.owner.name}</Text>
                <Text style={styles.ownerStatus}>{pet.owner.status}</Text>
                
                {/* Email - Only show for my pet */}
                {isMyPet && pet.owner.email && (
                  <View style={styles.ownerDetailRow}>
                    <Icon name="mail-outline" size={14} color={colors.textMedium} />
                    <Text style={styles.ownerDetailText}>{pet.owner.email}</Text>
                  </View>
                )}

                {/* Location - Always show */}
                <View style={styles.ownerDetailRow}>
                  <Icon name="location-outline" size={14} color={colors.textMedium} />
                  <Text style={[styles.ownerDetailText, !pet.location && { color: '#999', fontStyle: 'italic' }]}>
                    {pet.location || 'No location set'}
                  </Text>
                </View>
              </View>
            </View>

            {pet.owner.userId && (
              <TouchableOpacity 
                onPress={() => {
                  // TODO: Navigate to owner profile
                  console.log('View owner profile:', pet.owner.userId);
                }}
              >
                <Icon name="chevron-forward" size={24} color={colors.textMedium} />
              </TouchableOpacity>
            )}
          </View>

          {/* Full Address Card - Only show for my pet */}
          {isMyPet && pet.fullAddress && (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Icon name="location" size={18} color={colors.primary} />
                <Text style={styles.addressTitle}>Full Address</Text>
              </View>
              <Text style={styles.addressText}>{pet.fullAddress}</Text>
            </View>
          )}
        </View>

        {/* Send Match Request Button - Only show for other people's pets */}
        {!isMyPet && (
          <>
            <View style={styles.matchRequestSection}>
              <TouchableOpacity
                style={styles.matchRequestButton}
                activeOpacity={0.8}
                onPress={handleSendMatchRequest}
                disabled={sendingMatchRequest}
              >
                <LinearGradient
                  colors={sendingMatchRequest ? ["#CCC", "#DDD"] : ["#FF6EA7", "#FF9BC0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.matchRequestGradient}
                >
                  {sendingMatchRequest ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Icon name="heart" size={24} color="#fff" />
                  )}
                  <Text style={styles.matchRequestText}>
                    {sendingMatchRequest ? 'Sending...' : 'Send Match Request'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Safety Actions */}
            <View style={styles.safetyActions}>
              <TouchableOpacity 
                style={styles.safetyBtn}
                onPress={handleReport}
              >
                <Icon name="flag-outline" size={20} color="#FF9800" />
                <Text style={[styles.safetyBtnText, { color: "#FF9800" }]}>
                  Report
                </Text>
              </TouchableOpacity>

              <View style={styles.safetyDivider} />

              <TouchableOpacity 
                style={styles.safetyBtn}
                onPress={handleBlock}
              >
                <Icon name="ban-outline" size={20} color="#E94D6B" />
                <Text style={[styles.safetyBtnText, { color: "#E94D6B" }]}>
                  Block User
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    position: "relative",
  },
  photoNavBtn: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  photoNavBtnLeft: {
    left: -5,
  },
  photoNavBtnRight: {
    right: -5,
  },
  photoIndicators: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    gap: 6,
    zIndex: 10,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  photoIndicatorActive: {
    backgroundColor: "#fff",
    width: 16,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  editIconBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },
  editIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  petName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  descriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
  },

  // Characteristics
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
  },
  characteristicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  characteristicCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 12,
    minWidth: "47%",
    flex: 1,
    maxWidth: "48%",
    ...shadows.medium,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  characteristicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  characteristicName: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: "600",
    textTransform: "capitalize",
    flex: 1,
  },
  characteristicValueContainer: {
    marginTop: 2,
  },
  characteristicValue: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: "700",
  },
  characteristicValueEmpty: {
    fontSize: 13,
    color: colors.textLabel,
    fontStyle: "italic",
  },

  // Owner
  ownerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    borderRadius: 16,
    padding: 16,
    ...shadows.medium,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ownerName: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 4,
  },
  ownerStatus: {
    fontSize: 13,
    color: colors.textMedium,
    marginBottom: 8,
  },
  ownerDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  ownerDetailText: {
    fontSize: 13,
    color: colors.textMedium,
    flex: 1,
  },
  addressCard: {
    backgroundColor: "#F0F8FF",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#D0E8FF",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  addressText: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },

  // Safety Actions
  safetyActions: {
    flexDirection: "row",
    backgroundColor: "#FFF8FB",
    borderRadius: 16,
    marginTop: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  safetyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  safetyBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  safetyDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E0E0E0",
  },

  // Match Request Button
  matchRequestSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.whiteWarm,
  },
  matchRequestButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.large,
  },
  matchRequestGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  matchRequestText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default PetProfileScreen;

