import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
  StatusBar,
  Pressable,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { getPetById, getPetCharacteristics, getPetPhotos, type PetCharacteristic, sendLike, blockUser } from "../../../api";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getItem } from "../../../utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

const { width, height } = Dimensions.get("window");
const IMAGE_HEIGHT = height * 0.55;

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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMedium }}>Loading pet profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Hero Image Section with Carousel */}
        <View style={styles.heroSection}>
          {/* Tap Zones for Photo Navigation */}
          {pet.photos && pet.photos.length > 1 && (
            <>
              <Pressable 
                style={styles.tapZoneLeft}
                onPress={handlePrevPhoto}
              />
              <Pressable 
                style={styles.tapZoneRight}
                onPress={handleNextPhoto}
              />
            </>
          )}
          
          {/* Hero Image */}
          <Image 
            source={pet.photos?.[activePhotoIndex] || pet.avatar} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          
          {/* Dark Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.heroGradient}
          />
          
          {/* Header Buttons Overlay */}
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            {isMyPet && (
              <TouchableOpacity onPress={handleEditPet} style={styles.editHeaderBtn}>
                <Icon name="pencil" size={22} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Photo Indicators */}
          {pet.photos && pet.photos.length > 1 && (
            <View style={styles.photoDotsContainer}>
              {pet.photos.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.photoDot,
                    index === activePhotoIndex && styles.photoDotActive
                  ]}
                />
              ))}
            </View>
          )}
          
          {/* Pet Info on Image */}
          <View style={styles.heroInfo}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName}>
                {pet.name}
                <Text style={pet.gender === "male" ? styles.maleSymbol : styles.femaleSymbol}>
                  {" "}{pet.gender === "male" ? "♂" : "♀"}
                </Text>
              </Text>
            </View>
            <View style={styles.heroMetaRow}>
              <Icon name="paw" size={16} color="#fff" />
              <Text style={styles.heroMeta}>{pet.breed} • {pet.age}</Text>
            </View>
            {pet.location && (
              <View style={styles.heroLocationRow}>
                <Icon name="location" size={16} color="#fff" />
                <Text style={styles.heroLocation}>{pet.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content Container - Modern Cards */}
        <View style={styles.contentContainer}>
          
          {/* Quick Stats Cards */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIconBg}>
                <Icon name="paw" size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickStatValue}>{pet.breed}</Text>
              <Text style={styles.quickStatLabel}>Breed</Text>
            </View>
            
            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIconBg}>
                <Icon name="calendar-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickStatValue}>{pet.age}</Text>
              <Text style={styles.quickStatLabel}>Age</Text>
            </View>
            
            <View style={styles.quickStatCard}>
              <View style={styles.quickStatIconBg}>
                <Icon 
                  name={pet.gender === "male" ? "male" : "female"} 
                  size={20} 
                  color={pet.gender === "male" ? colors.male : colors.female} 
                />
              </View>
              <Text style={styles.quickStatValue}>{pet.gender}</Text>
              <Text style={styles.quickStatLabel}>Gender</Text>
            </View>
          </View>

          {/* About Section */}
          {pet.description && pet.description !== 'No description available' && (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitleModern}>About {pet.name}</Text>
              <View style={styles.aboutCard}>
                <Text style={styles.aboutText}>{pet.description}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Pet Characteristics */}
        {characteristics.length > 0 && (
          <View style={styles.contentContainer}>
            <View style={styles.sectionHeaderModern}>
              <Text style={styles.sectionTitleModern}>Characteristics</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{characteristics.length}</Text>
              </View>
            </View>
            <View style={styles.characteristicsGrid}>
              {characteristics.map((char, index) => (
                <View key={index} style={styles.charCard}>
                  <View style={styles.charIconCircle}>
                    <Icon 
                      name={
                        char.typeValue === 'string' ? 'paw' : 
                        char.typeValue === 'float' || char.typeValue === 'number' ? 'fitness' : 
                        'information-circle'
                      } 
                      size={18} 
                      color={colors.white} 
                    />
                  </View>
                  <Text style={styles.charName}>{char.name || 'Unknown'}</Text>
                  <View style={styles.charValueContainer}>
                    {char.optionValue ? (
                      <Text style={styles.charValue}>{char.optionValue}</Text>
                    ) : char.value !== null && char.value !== undefined ? (
                      <Text style={styles.charValue}>
                        {char.value} {char.unit || ''}
                      </Text>
                    ) : (
                      <Text style={styles.charValueEmpty}>Not set</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Owner Section */}
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitleModern}>Owner</Text>

          <View style={styles.ownerCardModern}>
            <Image source={pet.owner.avatar} style={styles.ownerAvatarModern} />
            <View style={styles.ownerInfoContainer}>
              <Text style={styles.ownerNameModern}>{pet.owner.name}</Text>
              <Text style={styles.ownerStatusModern}>{pet.owner.status}</Text>
              
              {/* Email - Only show for my pet */}
              {isMyPet && pet.owner.email && (
                <View style={styles.ownerDetailRowModern}>
                  <Icon name="mail" size={14} color={colors.primary} />
                  <Text style={styles.ownerDetailTextModern}>{pet.owner.email}</Text>
                </View>
              )}

              {/* Location - Always show */}
              {pet.location && (
                <View style={styles.ownerDetailRowModern}>
                  <Icon name="location" size={14} color={colors.primary} />
                  <Text style={styles.ownerDetailTextModern}>{pet.location}</Text>
                </View>
              )}
            </View>
            
            {pet.owner.userId && !isMyPet && (
              <TouchableOpacity 
                style={styles.viewProfileBtn}
                onPress={() => {
                  console.log('View owner profile:', pet.owner.userId);
                }}
              >
                <Icon name="arrow-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Full Address Card - Only show for my pet */}
          {isMyPet && pet.fullAddress && (
            <View style={styles.addressCardModern}>
              <Icon name="map" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.addressTitleModern}>Full Address</Text>
                <Text style={styles.addressTextModern}>{pet.fullAddress}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons - Only show for other people's pets */}
        {!isMyPet && (
          <View style={styles.actionsContainer}>
            {/* Main Action Button */}
            <TouchableOpacity
              style={styles.matchButton}
              activeOpacity={0.9}
              onPress={handleSendMatchRequest}
              disabled={sendingMatchRequest}
            >
              <LinearGradient
                colors={sendingMatchRequest ? ["#CCC", "#DDD"] : gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.matchButtonGradient}
              >
                {sendingMatchRequest ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="heart" size={24} color="#fff" />
                )}
                <Text style={styles.matchButtonText}>
                  {sendingMatchRequest ? 'Sending...' : 'Send Match Request'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Safety Actions Row */}
            <View style={styles.safetyRow}>
              <TouchableOpacity 
                style={styles.safetyButton}
                onPress={handleReport}
                activeOpacity={0.7}
              >
                <View style={styles.safetyIconBg}>
                  <Icon name="flag" size={18} color="#FF9800" />
                </View>
                <Text style={styles.safetyButtonText}>Report</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.safetyButton}
                onPress={handleBlock}
                activeOpacity={0.7}
              >
                <View style={styles.safetyIconBg}>
                  <Icon name="ban" size={18} color="#E94D6B" />
                </View>
                <Text style={styles.safetyButtonText}>Block</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero Section
  heroSection: {
    position: "relative",
    height: IMAGE_HEIGHT,
    backgroundColor: "#000",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  tapZoneLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "35%",
    zIndex: 5,
  },
  tapZoneRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "35%",
    zIndex: 5,
  },
  
  // Header Overlay
  headerOverlay: {
    position: "absolute",
    top: StatusBar.currentHeight || 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    ...shadows.medium,
  },
  editHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    ...shadows.medium,
  },
  
  // Photo Dots
  photoDotsContainer: {
    position: "absolute",
    top: (StatusBar.currentHeight || 40) + 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 6,
    zIndex: 10,
  },
  photoDot: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
  },
  photoDotActive: {
    backgroundColor: "#fff",
  },
  
  // Hero Info
  heroInfo: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  heroName: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  maleSymbol: {
    color: "#64B5F6",
  },
  femaleSymbol: {
    color: "#FF9BC0",
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  heroMeta: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroLocation: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },

  // Content Container
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  
  // Quick Stats Row
  quickStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: "center",
    ...shadows.medium,
  },
  quickStatIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF0F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 4,
    textAlign: "center",
  },
  quickStatLabel: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: "500",
  },
  
  // Section Titles
  sectionTitleModern: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 16,
  },
  sectionHeaderModern: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeCount: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.white,
  },
  
  // About Section
  aboutSection: {
    marginBottom: 24,
  },
  aboutCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    ...shadows.small,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textDark,
  },
  
  // Characteristics Grid
  characteristicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  charCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    minWidth: "47%",
    flex: 1,
    maxWidth: "48%",
    ...shadows.medium,
    alignItems: "center",
  },
  charIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    ...shadows.button,
  },
  charName: {
    fontSize: 13,
    color: colors.textMedium,
    fontWeight: "600",
    textTransform: "capitalize",
    textAlign: "center",
    marginBottom: 6,
  },
  charValueContainer: {
    alignItems: "center",
  },
  charValue: {
    fontSize: 17,
    color: colors.textDark,
    fontWeight: "bold",
    textAlign: "center",
  },
  charValueEmpty: {
    fontSize: 14,
    color: colors.textLabel,
    fontStyle: "italic",
  },
  
  // Owner Card Modern
  ownerCardModern: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    ...shadows.medium,
  },
  ownerAvatarModern: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  ownerInfoContainer: {
    flex: 1,
  },
  ownerNameModern: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 4,
  },
  ownerStatusModern: {
    fontSize: 13,
    color: colors.textMedium,
    marginBottom: 8,
  },
  ownerDetailRowModern: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  ownerDetailTextModern: {
    fontSize: 13,
    color: colors.textMedium,
    flex: 1,
  },
  viewProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0F7",
    justifyContent: "center",
    alignItems: "center",
  },
  addressCardModern: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F8FF",
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#D0E8FF",
  },
  addressTitleModern: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 6,
  },
  addressTextModern: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  
  // Actions Container
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  matchButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.large,
    marginBottom: 16,
  },
  matchButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
  },
  matchButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  
  // Safety Row
  safetyRow: {
    flexDirection: "row",
    gap: 12,
  },
  safetyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.small,
  },
  safetyIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF8FB",
    justifyContent: "center",
    alignItems: "center",
  },
  safetyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
  },
});

export default PetProfileScreen;

