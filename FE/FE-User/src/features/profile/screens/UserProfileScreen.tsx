import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getUserById, getPetsByUserId, getAddressById, getPetCharacteristics, getPetPhotos, setActivePet as setActivePetAPI, getMatchStats, type UserResponse, type PetResponse, type PetCharacteristic } from "../../../api";
import { getItem } from "../../../utils/storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

interface PetItem {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: "male" | "female";
  image: any;
  isActive?: boolean; // Pet đang được chọn để match
}

const UserProfileScreen = ({ navigation }: Props) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [activePet, setActivePet] = useState<PetResponse | null>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [characteristics, setCharacteristics] = useState<PetCharacteristic[]>([]);
  const [petPhotos, setPetPhotos] = useState<any[]>([]);
  const [stats, setStats] = useState({ matches: 0, likes: 0 });
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  // Fetch user and pets data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Get userId from storage
        const userIdStr = await getItem('userId');
        if (!userIdStr) {
          Alert.alert('Error', 'User not found. Please login again.');
          return;
        }
        
        const userId = parseInt(userIdStr, 10);
        console.log('📱 Loading profile for userId:', userId);

        // Fetch user data
        const user = await getUserById(userId);
        setUserData(user);
        console.log('👤 User data loaded:', user);

        // Fetch stats
        try {
          const statsData = await getMatchStats(userId);
          setStats(statsData);
          console.log('📊 Stats loaded:', statsData);
        } catch (error) {
          console.error('⚠️ Error loading stats:', error);
          setStats({ matches: 0, likes: 0 });
        }

        // Fetch pets data
        const petsData = await getPetsByUserId(userId);
        setPets(petsData);
        console.log('🐾 Pets data loaded:', petsData);

        // Find active pet (IsActive = true)
        const active = petsData.find(p => p.IsActive === true || p.isActive === true);
        setActivePet(active || petsData[0] || null);
        console.log('✅ Active pet:', active);

        // Fetch address data if user has addressId
        const addressId = user.AddressId || user.addressId;
        console.log('🔍 User addressId:', addressId);
        
        if (addressId) {
          try {
            const address = await getAddressById(addressId);
            console.log('📍 Address data loaded:', address);
            console.log('📍 Address.City:', address?.City);
            console.log('📍 Address.District:', address?.District);
            console.log('📍 Address.FullAddress:', address?.FullAddress);
            setAddressData(address);
          } catch (error: any) {
            console.error('⚠️ No address found for user:', error);
            setAddressData(null);
          }
        } else {
          console.log('⚠️ User has no addressId');
          setAddressData(null);
        }
        
      } catch (error: any) {
        console.error('❌ Error loading profile:', error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Load characteristics and photos for active pet
  useEffect(() => {
    const loadPetDetails = async () => {
      // Reset photo index when pet changes
      setActivePhotoIndex(0);
      
      if (!activePet) {
        setCharacteristics([]);
        setPetPhotos([]);
        return;
      }

      try {
        const petId = activePet.PetId || activePet.petId;
        if (!petId) return;

        // Load characteristics
        const chars = await getPetCharacteristics(petId);
        setCharacteristics(chars);
        console.log('🎯 Characteristics loaded:', chars);

        // Load all photos from PetPhotos table
        const photos = await getPetPhotos(petId);
        
        // Sort photos: isPrimary first, then by sortOrder
        const sortedPhotos = photos.sort((a: any, b: any) => {
          // Primary photo goes first
          if (a.IsPrimary || a.isPrimary) return -1;
          if (b.IsPrimary || b.isPrimary) return 1;
          // Then sort by sortOrder
          const aSort = a.SortOrder ?? a.sortOrder ?? 0;
          const bSort = b.SortOrder ?? b.sortOrder ?? 0;
          return aSort - bSort;
        });
        
        setPetPhotos(sortedPhotos || []);
        console.log('📸 Pet photos loaded:', sortedPhotos.length, 'photos');
      } catch (error: any) {
        console.log('⚠️ No characteristics found for pet');
        setCharacteristics([]);
        setPetPhotos([]);
      }
    };

    loadPetDetails();
  }, [activePet]);

  // Convert active pet to display format
  const myCat = activePet ? (() => {
    // Use photos from PetPhotos table (already sorted by isPrimary and sortOrder)
    let photos;
    if (petPhotos && petPhotos.length > 0) {
      // Map all photos from PetPhotos table
      photos = petPhotos.map((photo: any) => ({
        uri: photo.ImageUrl || photo.imageUrl || photo.Url || photo.url
      }));
    } else {
      // Fallback to UrlImageAvatar or default
      const avatarUrl = activePet.UrlImageAvatar || activePet.urlImageAvatar;
      photos = avatarUrl 
        ? [{ uri: avatarUrl }]
        : [require("../../../assets/cat_avatar.png")];
    }
    
    return {
      id: (activePet.PetId || activePet.petId || 0).toString(),
      name: activePet.Name || activePet.name || 'Unknown',
      breed: activePet.Breed || activePet.breed || 'Unknown breed',
      age: activePet.Age ? `${activePet.Age} years` : (activePet.age ? `${activePet.age} years` : 'Unknown'),
      gender: (activePet.Gender || activePet.gender || 'male').toLowerCase() as "male" | "female",
      bio: activePet.Description || activePet.description || "No description available",
      photos,
    };
  })() : {
    id: "0",
    name: "No Pet",
    breed: "Unknown",
    age: "0 years",
    gender: "male" as "male" | "female",
    bio: "Please add a pet",
    photos: [require("../../../assets/cat_avatar.png")],
  };

  // Stats data - CAT STATS (loaded from API)
  const catStats = {
    matches: stats.matches,
    likes: stats.likes,
  };

  // Parse address data
  const getAddressField = (field: string) => {
    if (!addressData) return null;
    return addressData[field] || addressData[field.toLowerCase()] || null;
  };

  const city = getAddressField('City');
  const district = getAddressField('District');
  const ward = getAddressField('Ward');
  const fullAddress = getAddressField('FullAddress');

  // Format short location
  const shortLocation = [district, city].filter(Boolean).join(', ');

  // Owner Info
  const owner = {
    name: userData?.FullName || userData?.fullName || "Unknown User",
    location: shortLocation || 'No location set',
    fullAddress: fullAddress,
    isPremium: false, // TODO: Add Premium status to User model
    email: userData?.Email || userData?.email || "",
    memberSince: userData?.CreatedAt 
      ? new Date(userData.CreatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : (userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Unknown"),
  };

  // My Pets List (convert from PetResponse[] to PetItem[])
  const myPets: PetItem[] = pets.map(pet => ({
    id: (pet.PetId || pet.petId || 0).toString(),
    name: pet.Name || pet.name || 'Unknown',
    breed: pet.Breed || pet.breed || 'Unknown',
    age: pet.Age ? `${pet.Age} years` : (pet.age ? `${pet.age} years` : 'Unknown'),
    gender: (pet.Gender || pet.gender || 'male').toLowerCase() as "male" | "female",
    image: pet.UrlImageAvatar || pet.urlImageAvatar 
      ? { uri: pet.UrlImageAvatar || pet.urlImageAvatar }
      : require("../../../assets/cat_avatar.png"),
    isActive: pet.IsActive === true || pet.isActive === true,
  }));

  const handleEditProfile = () => {
    const userId = userData?.UserId || userData?.userId;
    if (userId) {
      navigation.navigate("EditProfile", { userId });
    } else {
      Alert.alert('Error', 'User ID not found');
    }
  };

  const handleSetActivePet = async (petIdStr: string) => {
    const petId = parseInt(petIdStr, 10);
    const pet = pets.find(p => (p.PetId || p.petId) === petId);
    
    if (!pet) return;
    
    // Nếu đã active rồi thì không làm gì
    if (pet.IsActive === true || pet.isActive === true) {
      showAlert({
        type: 'info',
        title: 'Already Active 🐾',
        message: `${pet.Name || pet.name} is already your active pet for matching!`,
        confirmText: 'Got it'
      });
      return;
    }
    
    const petName = pet.Name || pet.name || 'This pet';
    
    Alert.alert(
      '🐾 Set Active Pet',
      `Do you want to set ${petName} as your active pet for matching?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Set Active',
          onPress: async () => {
            try {
              // Call API để update DB
              await setActivePetAPI(petId);
              
              // Reload pets data
              const userIdStr = await getItem('userId');
              if (userIdStr) {
                const userId = parseInt(userIdStr, 10);
                const petsData = await getPetsByUserId(userId);
                setPets(petsData);
                
                // Set new active pet
                const newActivePet = petsData.find(p => (p.PetId || p.petId) === petId);
                setActivePet(newActivePet || null);
              }
              
              // Show success message
              showAlert({
                type: 'success',
                title: 'Success! 🎉',
                message: `${petName} is now your active pet for matching and dating!`,
                confirmText: 'Awesome!'
              });
            } catch (error: any) {
              console.error('Error setting active pet:', error);
              showAlert({
                type: 'error',
                title: 'Oops! 😿',
                message: 'Failed to set active pet. Please try again.',
                confirmText: 'OK'
              });
            }
          }
        }
      ]
    );
  };

  const handleEditCat = () => {
    navigation.navigate("EditPet", { petId: myCat.id });
  };


  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => 
      prev === myCat.photos.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => 
      prev === 0 ? myCat.photos.length - 1 : prev - 1
    );
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMedium }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header with Settings */}
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Icon name="settings-outline" size={22} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* CAT Photo Carousel - MAIN FOCUS */}
        <View style={styles.photoSection}>
          {/* Tap zones for navigation */}
          <Pressable 
            style={styles.tapZoneLeft} 
            onPress={handlePrevPhoto}
          />
          <Pressable 
            style={styles.tapZoneRight} 
            onPress={handleNextPhoto}
          />
          
          <Image
            source={myCat.photos[activePhotoIndex]}
            style={styles.mainPhoto}
          />
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.photoGradient}
          />

          {/* Premium Badge */}
          {owner.isPremium && (
            <View style={styles.premiumBadge}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.premiumGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="star" size={14} color="#fff" />
                <Text style={styles.premiumText}>Premium</Text>
              </LinearGradient>
            </View>
          )}

          {/* Photo Indicators */}
          <View style={styles.photoIndicators}>
            {myCat.photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === activePhotoIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          {/* CAT Info Overlay */}
          <View style={styles.catInfoOverlay}>
            <View style={styles.nameRow}>
              <Text style={styles.catNameLarge}>
                {myCat.name}{" "}
                <Text style={myCat.gender === "male" ? styles.male : styles.female}>
                  {myCat.gender === "male" ? "♂" : "♀"}
                </Text>
              </Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={handleEditCat}
              >
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.editBtnGradient}
                >
                  <Icon name="pencil" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.breedText}>{myCat.breed} • {myCat.age}</Text>
          </View>
        </View>

        {/* Cat Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#FF6EA7", "#FF9BC0"]}
              style={styles.statGradient}
            >
              <Text style={styles.statNumber}>{catStats.matches}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#9C27B0", "#BA68C8"]}
              style={styles.statGradient}
            >
              <Text style={styles.statNumber}>{catStats.likes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </LinearGradient>
          </View>
        </View>

        {/* About My Cat */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {myCat.name}</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{myCat.bio}</Text>
          </View>
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
                      size={18} 
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

        {/* My Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>My Pets ({myPets.length})</Text>
              <Text style={styles.sectionSubtitle}>
                Tap to set active pet for matching
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addPetButton}
              onPress={() => navigation.navigate("AddPet")}
            >
              <LinearGradient
                colors={gradients.primary}
                style={styles.addPetGradient}
              >
                <Icon name="add" size={18} color="#fff" />
                <Text style={styles.addPetText}>Add Pet</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsScrollContent}
          >
            {myPets.map((pet) => (
              <View key={pet.id} style={styles.petCardWrapper}>
                <TouchableOpacity
                  style={[
                    styles.petCard,
                    pet.isActive && styles.petCardActive,
                  ]}
                  onPress={() => navigation.navigate("PetProfile", { petId: pet.id })}
                  onLongPress={() => handleSetActivePet(pet.id)}
                >
                  <Image source={pet.image} style={styles.petImage} />
                  
                  {/* Active Badge */}
                  {pet.isActive && (
                    <View style={styles.activeBadge}>
                      <LinearGradient
                        colors={["#4CAF50", "#66BB6A"]}
                        style={styles.activeBadgeGradient}
                      >
                        <Icon name="checkmark-circle" size={14} color="#fff" />
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </LinearGradient>
                    </View>
                  )}

                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>
                      {pet.name}{" "}
                      <Text style={pet.gender === "male" ? styles.male : styles.female}>
                        {pet.gender === "male" ? "♂" : "♀"}
                      </Text>
                    </Text>
                    <Text style={styles.petBreed}>{pet.breed}</Text>
                    <Text style={styles.petAge}>{pet.age}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.editPetBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate("EditPet", { petId: pet.id });
                    }}
                  >
                    <Icon name="pencil" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Set Active Button */}
                {!pet.isActive && (
                  <TouchableOpacity
                    style={styles.setActiveBtn}
                    onPress={() => handleSetActivePet(pet.id)}
                  >
                    <Icon name="radio-button-off" size={18} color={colors.textMedium} />
                    <Text style={styles.setActiveText}>Set Active</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Owner Info - SIMPLE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Owner Information</Text>
            <TouchableOpacity 
              style={styles.editOwnerButton}
              onPress={handleEditProfile}
            >
              <Icon name="pencil" size={18} color={colors.primary} />
              <Text style={styles.editOwnerText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ownerCard}>
            <View style={styles.ownerRow}>
              <Icon name="person-outline" size={20} color={colors.textMedium} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ownerText}>{owner.name}</Text>
                <Text style={styles.ownerSubtext}>Member since {owner.memberSince}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.ownerRow}>
              <Icon name="mail-outline" size={20} color={colors.textMedium} />
              <Text style={styles.ownerText}>{owner.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.ownerRow}>
              <Icon name="location-outline" size={20} color={colors.textMedium} />
              <View style={{ flex: 1 }}>
                {owner.location && owner.location !== 'No location set' ? (
                  <>
                    <Text style={styles.ownerText}>{owner.location}</Text>
                    {owner.fullAddress && (
                      <Text style={styles.ownerSubtext} numberOfLines={2}>
                        {owner.fullAddress}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={[styles.ownerText, { color: '#999', fontStyle: 'italic' }]}>
                    No location set
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav active="Profile" />

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#F8F9FA",
  },
  topHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Photo Section
  photoSection: {
    position: "relative",
    height: width * 1.15,
    backgroundColor: "#000",
  },
  mainPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoGradient: {
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
    bottom: 100,
    width: "40%",
    zIndex: 2,
  },
  tapZoneRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 100,
    width: "40%",
    zIndex: 2,
  },
  premiumBadge: {
    position: "absolute",
    top: 120,
    left: 20,
    borderRadius: radius.lg,
    overflow: "hidden",
    zIndex: 10,
  },
  premiumGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  premiumText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  photoIndicators: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 10,
  },
  indicator: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: "#fff",
  },
  catInfoOverlay: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  catNameLarge: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  editBtn: {
    borderRadius: 22,
    overflow: "hidden",
  },
  editBtnGradient: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  breedText: {
    fontSize: 16,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    fontWeight: "500",
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -40,
    gap: 12,
    zIndex: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.large,
  },
  statGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 4,
  },

  // Bio
  bioCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textDark,
  },

  // Characteristics
  characteristicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  characteristicCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 14,
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
    gap: 8,
    marginBottom: 8,
  },
  characteristicName: {
    fontSize: 13,
    color: colors.textMedium,
    fontWeight: "600",
    textTransform: "capitalize",
    flex: 1,
  },
  characteristicValueContainer: {
    marginTop: 4,
  },
  characteristicValue: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: "700",
  },
  characteristicValueEmpty: {
    fontSize: 14,
    color: colors.textLabel,
    fontStyle: "italic",
  },

  // Gender
  male: {
    color: colors.male,
  },
  female: {
    color: colors.female,
  },

  // My Pets Section
  petsScrollContent: {
    paddingRight: 20,
  },
  petCardWrapper: {
    marginRight: 16,
  },
  petCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 12,
    width: 160,
    ...shadows.medium,
    position: "relative",
  },
  petCardActive: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    ...shadows.large,
  },
  petImage: {
    width: "100%",
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.cardBackgroundLight,
    marginBottom: 10,
  },
  petInfo: {
    gap: 4,
  },
  petName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
  },
  petBreed: {
    fontSize: 13,
    color: colors.textMedium,
  },
  petAge: {
    fontSize: 12,
    color: colors.textLabel,
  },
  editPetBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radius.full,
    padding: 8,
    ...shadows.small,
  },
  activeBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    borderRadius: radius.sm,
    overflow: "hidden",
    zIndex: 10,
  },
  activeBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  setActiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.cardBackground,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setActiveText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMedium,
  },
  addPetButton: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  addPetGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addPetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Edit Owner Button
  editOwnerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editOwnerText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Owner Card - SIMPLE
  ownerCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  ownerText: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: "500",
  },
  ownerSubtext: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 4,
    lineHeight: 18,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: colors.textDark,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

});

export default UserProfileScreen;

