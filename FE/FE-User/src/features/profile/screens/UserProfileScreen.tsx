import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getUserById, getPetsByUserId, getAddressById, getPetCharacteristics, getPetPhotos, setActivePet as setActivePetAPI, deletePet, type UserResponse, type PetResponse, type PetCharacteristic } from "../../../api";
import { getItem } from "../../../services/storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { getVipStatus } from "../../payment/api/paymentApi";
import { refreshBadgesForActivePet } from "../../../utils/badgeRefresh";
import { invalidateCache } from "../../../services/cache";
import OptimizedImage from "../../../components/OptimizedImage";

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
  const { t } = useTranslation();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [activePet, setActivePet] = useState<PetResponse | null>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [characteristics, setCharacteristics] = useState<PetCharacteristic[]>([]);
  const [petPhotos, setPetPhotos] = useState<any[]>([]);
  const [isVip, setIsVip] = useState(false);
  const [showAllCharacteristics, setShowAllCharacteristics] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      // Get userId from storage
      const userIdStr = await getItem('userId');
      if (!userIdStr) {
        showAlert({ type: 'error', title: t('common.error'), message: t('profile.userNotFound') });
        return;
      }

      const userId = parseInt(userIdStr, 10);

      const [user, petsData] = await Promise.all([
        getUserById(userId),
        getPetsByUserId(userId)
      ]);

      setUserData(user);

      // Find active pet from server data
      const active = petsData.find(p => p.IsActive === true || p.isActive === true);
      
      // If no pet is marked as active but there are pets, mark the first one as active locally
      if (!active && petsData.length > 0) {
        petsData[0] = {
          ...petsData[0],
          IsActive: true,
          isActive: true,
        };
        setActivePet(petsData[0]);
      } else {
        setActivePet(active || null);
      }
      
      setPets(petsData);

      getVipStatus(userId)
        .then(vipStatus => {
          setIsVip(vipStatus.isVip);
        })
        .catch(() => {
          setIsVip(false);
        });

      const addressId = user.AddressId || user.addressId;

      if (addressId) {
        getAddressById(addressId)
          .then(address => {
            setAddressData(address);
          })
          .catch((error: any) => {
            setAddressData(null);
          });
      } else {
        setAddressData(null);
      }

    } catch (error: any) {

      showAlert({ type: 'error', title: t('common.error'), message: error.response?.data?.message || t('profile.loadError') });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  // Load characteristics and photos for active pet
  useEffect(() => {
    const loadPetDetails = async () => {
      // Reset photo index and characteristics collapse state when pet changes
      setActivePhotoIndex(0);
      setShowAllCharacteristics(false);

      if (!activePet) {
        setCharacteristics([]);
        setPetPhotos([]);
        return;
      }

      try {
        const petId = activePet.PetId || activePet.petId;
        if (!petId) return;

        const [chars, photos] = await Promise.all([
          getPetCharacteristics(petId),
          getPetPhotos(petId)
        ]);

        // Filter out distance-related characteristics (those are user preferences, not pet characteristics)
        // Also filter out "Loại" attribute (not used)
        const filteredChars = chars.filter((char: any) => {
          const name = char.name?.toLowerCase() || '';
          if (name.includes('khoảng cách') || name.includes('distance') || name.includes('km')) {
            return false;
          }
          if (name.includes('loại')) {
            return false;
          }
          return true;
        });

        setCharacteristics(filteredChars);

        // Sort photos by sortOrder (first photo = primary/avatar)
        const sortedPhotos = photos.sort((a: any, b: any) => {
          const aSort = a.SortOrder ?? a.sortOrder ?? 0;
          const bSort = b.SortOrder ?? b.sortOrder ?? 0;
          return aSort - bSort;
        });

        setPetPhotos(sortedPhotos || []);
      } catch (error: any) {
        setCharacteristics([]);
        setPetPhotos([]);
      }
    };

    loadPetDetails();
  }, [activePet]);

  // Helper function to get age from characteristics
  const getAgeFromCharacteristics = (chars: PetCharacteristic[]): string => {
    const ageChar = chars.find((char: any) => {
      const name = (char.name || char.attributeName || '').toLowerCase();
      return name.includes('tuổi') || name.includes('age');
    });

    if (ageChar) {
      const value = ageChar.value || ageChar.optionValue;
      if (value) {
        // Return raw value, UI will format it
        return value.toString();
      }
    }

    return '';
  };

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
      name: activePet.Name || activePet.name || '',
      breed: activePet.Breed || activePet.breed || '',
      age: getAgeFromCharacteristics(characteristics), // Get from characteristics instead of pet model
      gender: (activePet.Gender || activePet.gender || 'male').toLowerCase() as "male" | "female",
      bio: activePet.Description || activePet.description || t('profile.noDescription'),
      photos,
    };
  })() : {
    id: "0",
    name: "",
    breed: "",
    age: "0",
    gender: "male" as "male" | "female",
    bio: "",
    photos: [require("../../../assets/cat_avatar.png")],
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
    name: userData?.FullName || userData?.fullName || "",
    location: shortLocation || t('profile.owner.noLocation'),
    fullAddress: fullAddress,
    isPremium: isVip, // Use actual VIP status
    email: userData?.Email || userData?.email || "",
    memberSince: (() => {
      const dateStr = userData?.CreatedAt || userData?.createdAt;
      if (!dateStr) return "";
      // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
      let dateString = dateStr;
      if (!dateString.endsWith('Z') && !dateString.includes('+')) {
        dateString = dateString + 'Z';
      }
      return new Date(dateString).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    })(),
  };

  // My Pets List (convert from PetResponse[] to PetItem[])
  // Sort: active pet first, then by PetId descending (newest first - higher ID = created later)
  const sortedPets = [...pets].sort((a, b) => {
    const aActive = a.IsActive === true || a.isActive === true;
    const bActive = b.IsActive === true || b.isActive === true;
    
    // Active pet always first
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    
    // Then sort by PetId descending (higher ID = newer pet)
    const aId = a.PetId || a.petId || 0;
    const bId = b.PetId || b.petId || 0;
    return bId - aId;
  });

  const myPets: PetItem[] = sortedPets.map(pet => {
    const isThisActive = pet.IsActive === true || pet.isActive === true;
    const petId = pet.PetId || pet.petId || 0;
    
    return {
      id: petId.toString(),
      name: pet.Name || pet.name || '',
      breed: pet.Breed || pet.breed || '',
      age: '', // Age not displayed in pet list
      gender: (pet.Gender || pet.gender || 'male').toLowerCase() as "male" | "female",
      image: pet.UrlImageAvatar || pet.urlImageAvatar
        ? { uri: pet.UrlImageAvatar || pet.urlImageAvatar }
        : require("../../../assets/cat_avatar.png"),
      isActive: isThisActive,
    };
  });

  const handleEditProfile = () => {
    const userId = userData?.UserId || userData?.userId;
    if (userId) {
      navigation.navigate("EditProfile", { userId });
    } else {
      showAlert({ type: 'error', title: t('common.error'), message: t('profile.userNotFound') });
    }
  };

  const handleDeletePet = async (petIdStr: string) => {
    // Check if user has only 1 active (non-deleted) pet - cannot delete
    const activePets = pets.filter(p => !(p.IsDeleted || p.isDeleted));
    if (activePets.length <= 1) {
      showAlert({
        type: 'warning',
        title: t('profile.deletePet.cannotDelete'),
        message: t('profile.deletePet.mustHaveOnePet'),
        confirmText: 'OK'
      });
      return;
    }

    const petId = parseInt(petIdStr, 10);
    const pet = pets.find(p => (p.PetId || p.petId) === petId);

    if (!pet) return;

    const petName = pet.Name || pet.name || 'This pet';

    // Confirmation alert
    showAlert({
      type: 'warning',
      title: t('profile.deletePet.title'),
      message: t('profile.deletePet.message', { name: petName }),
      showCancel: true,
      confirmText: t('profile.deletePet.confirmText'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          // Check if deleted pet was active
          const wasActive = pet.IsActive === true || pet.isActive === true;
          
          await deletePet(petId);

          // If deleted pet was active, set first remaining pet as active in database
          if (wasActive) {
            const remainingPets = pets.filter(p => (p.PetId || p.petId) !== petId);
            
            if (remainingPets.length > 0) {
              const newActivePetId = remainingPets[0].PetId || remainingPets[0].petId;
              
              // Call API to set new active pet in database
              try {
                await setActivePetAPI(newActivePetId);
              } catch (error) {
                console.error('Failed to set new active pet:', error);
              }
            }
          }

          // Reload data to ensure sync with server
          await fetchProfileData();

          showAlert({
            type: 'success',
            title: t('profile.deletePet.successTitle'),
            message: t('profile.deletePet.successMessage', { name: petName }),
            confirmText: 'OK'
          });
        } catch (error: any) {

          showAlert({
            type: 'error',
            title: t('common.error'),
            message: error.response?.data?.Message || t('profile.deletePet.error'),
            confirmText: 'OK'
          });
        }
      }
    });
  };

  const handleSetActivePet = async (petIdStr: string) => {
    const petId = parseInt(petIdStr, 10);
    const pet = pets.find(p => (p.PetId || p.petId) === petId);

    if (!pet) return;

    // Nếu đã active rồi thì không làm gì
    if (pet.IsActive === true || pet.isActive === true) {
      showAlert({
        type: 'info',
        title: t('profile.myPets.alreadyActive'),
        message: t('profile.myPets.alreadyActiveMessage', { name: pet.Name || pet.name }),
        confirmText: 'Got it'
      });
      return;
    }

    const petName = pet.Name || pet.name || 'This pet';

    showAlert({
      type: 'warning',
      title: t('profile.myPets.setActiveTitle'),
      message: t('profile.myPets.setActiveMessage', { name: petName }),
      showCancel: true,
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          // Call API để update DB
          await setActivePetAPI(petId);

          // Reload pets data
          const userIdStr = await getItem('userId');
          if (userIdStr) {
            const userId = parseInt(userIdStr, 10);

            invalidateCache.all();

            const petsData = await getPetsByUserId(userId);
            setPets(petsData);

            // Set new active pet
            const newActivePet = petsData.find(p => (p.PetId || p.petId) === petId);
            setActivePet(newActivePet || null);

            // Refresh badges for the new active pet
            await refreshBadgesForActivePet(userId);
          }

          // Show success message
          showAlert({
            type: 'success',
            title: t('common.success'),
            message: t('profile.myPets.setActiveSuccess', { name: petName }),
            confirmText: 'OK'
          });
        } catch (error: any) {

          showAlert({
            type: 'error',
            title: t('common.error'),
            message: t('profile.myPets.setActiveError'),
          });
        }
      },
    });
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
        <Text style={{ marginTop: 16, color: colors.textMedium }}>{t('profile.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ backgroundColor: colors.whiteWarm }} />

      {/* Top Header with Settings */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={gradients.profile}
            style={styles.headerIconGradient}
          >
            <Icon name="person" size={20} color={colors.white} />
          </LinearGradient>
          <Text style={styles.topHeaderTitle}>{t('profile.title')}</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <LinearGradient
            colors={gradients.profile}
            style={styles.settingsIconGradient}
          >
            <Icon name="settings-outline" size={20} color={colors.white} />
          </LinearGradient>
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

          <View style={styles.photoWrapper}>
            <OptimizedImage
              source={myCat.photos[activePhotoIndex]}
              style={styles.mainPhoto}
              imageSize="full"
            />
          </View>

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
                <Icon name="diamond" size={14} color="#fff" />
                <Text style={styles.premiumText}>{t('badges.vip')}</Text>
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
                  colors={gradients.profile}
                  style={styles.editBtnGradient}
                >
                  <Icon name="pencil" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.breedText}>{myCat.breed || t('profile.unknownBreed')} • {myCat.age ? t('profile.ageYears', { age: myCat.age }) : t('profile.unknownAge')}</Text>
          </View>
        </View>

        {/* About My Cat */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about', { name: myCat.name || t('profile.aboutPet') })}</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{myCat.bio || t('profile.noDescription')}</Text>
          </View>
        </View>

        {/* Pet Characteristics */}
        {characteristics.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('profile.characteristics')}</Text>
              <Text style={styles.sectionSubtitle}>{t('profile.attributeCount', { count: characteristics.length })}</Text>
            </View>
            <View style={styles.characteristicsGrid}>
              {(showAllCharacteristics ? characteristics : characteristics.slice(0, 6)).map((char, index) => (
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
                    <Text style={styles.characteristicName}>{char.name || 'Không rõ'}</Text>
                  </View>
                  <View style={styles.characteristicValueContainer}>
                    {char.optionValue ? (
                      <Text style={styles.characteristicValue}>{char.optionValue}</Text>
                    ) : char.value !== null && char.value !== undefined ? (
                      <Text style={styles.characteristicValue}>
                        {char.value} {char.unit || ''}
                      </Text>
                    ) : (
                      <Text style={styles.characteristicValueEmpty}>{t('profile.notSet')}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Show More/Less Button */}
            {characteristics.length > 6 && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllCharacteristics(!showAllCharacteristics)}
              >
                <Text style={styles.showMoreText}>
                  {showAllCharacteristics ? t('profile.showLess') : t('profile.showMore', { count: characteristics.length - 6 })}
                </Text>
                <Icon
                  name={showAllCharacteristics ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* My Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>{t('profile.myPets.count', { count: myPets.length })}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('profile.myPets.subtitle')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addPetButton, myPets.length >= 3 && styles.addPetButtonDisabled]}
              onPress={() => {
                const MAX_PETS = 3;
                if (myPets.length >= MAX_PETS) {
                  showAlert({
                    type: 'warning',
                    title: t('profile.myPets.maxPetsReached'),
                    message: t('profile.myPets.maxPetsMessage', { max: MAX_PETS }),
                  });
                  return;
                }
                navigation.navigate("AddPet");
              }}
            >
              <LinearGradient
                colors={myPets.length >= 3 ? ['#BDBDBD', '#9E9E9E'] : gradients.profile}
                style={styles.addPetGradient}
              >
                <Icon name="add" size={18} color="#fff" />
                <Text style={styles.addPetText}>{t('profile.myPets.addPet')}</Text>
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
                  <OptimizedImage source={pet.image} style={styles.petImage} imageSize="thumbnail" />

                  {/* Active Badge */}
                  {pet.isActive && (
                    <View style={styles.activeBadge}>
                      <LinearGradient
                        colors={["#4CAF50", "#66BB6A"]}
                        style={styles.activeBadgeGradient}
                      >
                        <Icon name="checkmark-circle" size={14} color="#fff" />
                        <Text style={styles.activeBadgeText}>{t('profile.myPets.active')}</Text>
                      </LinearGradient>
                    </View>
                  )}

                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>
                      {pet.name || t('profile.unknownAge')}{" "}
                      <Text style={pet.gender === "male" ? styles.male : styles.female}>
                        {pet.gender === "male" ? "♂" : "♀"}
                      </Text>
                    </Text>
                    <Text style={styles.petBreed}>{pet.breed || t('profile.unknownBreed')}</Text>
                  </View>

                  {/* Edit Button */}
                  <TouchableOpacity
                    style={styles.editPetBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate("EditPet", { petId: pet.id });
                    }}
                  >
                    <Icon name="pencil" size={16} color={colors.primary} />
                  </TouchableOpacity>

                  {/* Delete Button - Only show if user has more than 1 active pet */}
                  {pets.filter(p => !(p.IsDeleted || p.isDeleted)).length > 1 && (
                    <TouchableOpacity
                      style={styles.deletePetBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeletePet(pet.id);
                      }}
                    >
                      <Icon name="trash" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {/* Set Active Button */}
                {!pet.isActive && (
                  <TouchableOpacity
                    style={styles.setActiveBtn}
                    onPress={() => handleSetActivePet(pet.id)}
                  >
                    <Icon name="radio-button-off" size={18} color={colors.textMedium} />
                    <Text style={styles.setActiveText}>{t('profile.myPets.setActive')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Owner Info - SIMPLE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.owner.title')}</Text>
            <TouchableOpacity
              style={styles.editOwnerButton}
              onPress={handleEditProfile}
            >
              <Icon name="pencil" size={18} color={colors.primary} />
              <Text style={styles.editOwnerText}>{t('profile.owner.edit')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ownerCard}>
            <View style={styles.ownerRow}>
              <Icon name="person-outline" size={20} color={colors.textMedium} />
              <View style={{ flex: 1 }}>
                <View style={styles.ownerNameRow}>
                  <Text style={styles.ownerText}>{owner.name}</Text>
                  {owner.isPremium && (
                    <View style={styles.vipBadgeInline}>
                      <Icon name="diamond" size={14} color="#FFD700" />
                      <Text style={styles.vipBadgeText}>{t('badges.vip')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.ownerSubtext}>{t('profile.owner.memberSince', { date: owner.memberSince })}</Text>
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
                {owner.location && owner.location !== t('profile.owner.noLocation') ? (
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
                    {t('profile.owner.noLocation')}
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
    backgroundColor: "#F8F9FA",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.whiteWarm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  topHeaderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
  },
  settingsButton: {
    borderRadius: 20,
  },
  settingsIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: width - 32,
    height: width * 1.2,
    marginHorizontal: 16,
    marginTop: 8,
  },
  photoWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: "#000",
    ...shadows.large,
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
  sectionHeaderLeft: {
    flex: 1,
    marginRight: 12,
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
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.15)",
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
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    minWidth: "47%",
    flex: 1,
    maxWidth: "48%",
    ...shadows.small,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.15)",
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
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.small,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    width: 160,
    ...shadows.small,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.15)",
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
  deletePetBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: radius.full,
    padding: 8,
    ...shadows.small,
  },
  activeBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
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
    flexShrink: 0,
  },
  addPetButtonDisabled: {
    opacity: 0.6,
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
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.15)",
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
  ownerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vipBadgeInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  vipBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFD700",
    letterSpacing: 0.5,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.15)",
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

