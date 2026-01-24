import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";
import { refreshBadgesForActivePet } from "../../../utils/badgeRefresh";
import { getLikesReceived, respondToLike, type LikeReceivedItem } from "../../match/api/matchApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { resetFavoriteBadge, showMatchModal as showGlobalMatchModal, selectActivePetId, markChatAsRead } from "../../badge/badgeSlice";
import { AppDispatch } from "../../../app/store";
import { getPetsByUserId, getPetMatchDetails, MatchedAttribute } from "../../pet/api/petApi";
import OptimizedImage from "../../../components/OptimizedImage";
import { MatchDetailsModal } from "../../../components/MatchDetailsModal";
import { cache, CACHE_KEYS, CACHE_TTL, invalidateCache } from "../../../services/cache";
import signalRService from "../../../services/signalr.service";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

const { width, height } = Dimensions.get("window");
const CARD_PADDING = 16;

type Props = NativeStackScreenProps<RootStackParamList, "Favorite">;

interface LikeCat {
  id: string;          // matchId for actions
  petId: string;       // actual petId for navigation
  ownerId: number;     // owner userId for chat
  catName: string;
  ownerName: string;
  gender: "male" | "female";
  age: string;
  breed: string;
  image: any;          // First image for backward compatibility
  images: any[];       // All images for carousel
  isMatch: boolean;
  // Match data - how well this pet matches MY preferences
  matchPercent?: number;
  matchedAttributes?: MatchedAttribute[];
  totalFilters?: number;
}

const FavoriteScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const activePetId = useSelector(selectActivePetId); // Get current active pet ID
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [pets, setPets] = useState<LikeCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPhotoIndices, setCurrentPhotoIndices] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'likes' | 'matches'>('likes');
  const scrollY = useRef(new Animated.Value(0)).current;
  const [reloadTrigger, setReloadTrigger] = useState(0); // Trigger for reload

  // Match details modal state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchModalLoading, setMatchModalLoading] = useState(false);
  const [selectedPetForMatch, setSelectedPetForMatch] = useState<{
    petId: string;
    petName: string;
    matchPercent: number;
    matchScore: number;
    totalPercent: number;
    matchedAttributes: MatchedAttribute[];
    totalFilters: number;
  } | null>(null);

  // Reload likes when activePetId changes
  useEffect(() => {
    if (activePetId !== null) {
      loadLikes(true);
    }
  }, [activePetId]);

  // Setup realtime listeners for instant UI updates
  useEffect(() => {
    const handleMatchSuccess = (data: any) => {
      setReloadTrigger(prev => prev + 1);
    };

    const handleNewLike = (data: any) => {
      setReloadTrigger(prev => prev + 1);
    };

    const handleMatchDeleted = (data: any) => {
      const matchId = data.matchId || data.MatchId;
      
      if (matchId) {
        setPets(prevPets => prevPets.filter(pet => pet.id !== matchId.toString()));
      }
    };

    signalRService.on('MatchSuccess', handleMatchSuccess);
    signalRService.on('NewLikeBadge', handleNewLike);
    signalRService.on('MatchDeleted', handleMatchDeleted);

    return () => {
      signalRService.off('MatchSuccess', handleMatchSuccess);
      signalRService.off('NewLikeBadge', handleNewLike);
      signalRService.off('MatchDeleted', handleMatchDeleted);
    };
  }, []);

  // Reload when reloadTrigger changes
  useEffect(() => {
    if (reloadTrigger > 0) {
      loadLikes(true);
    }
  }, [reloadTrigger]);

  // Reload likes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      dispatch(resetFavoriteBadge());
      loadLikes(true);

      const refreshBadges = async () => {
        try {
          const userIdStr = await AsyncStorage.getItem('userId');
          if (userIdStr) {
            const userId = parseInt(userIdStr);
            await refreshBadgesForActivePet(userId, true);
          }
        } catch (error) {
          // Failed to refresh badges
        }
      };
      
      refreshBadges();
    }, [dispatch])
  );

  // Load likes with parallel API calls and caching
  const loadLikes = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setLoading(false);
        return;
      }

      const userId = parseInt(userIdStr);

      // Get active pet with cache
      let activePetId: number | undefined;
      try {
        const userPets = await cache.getOrFetch(
          CACHE_KEYS.USER_PETS(userId),
          () => getPetsByUserId(userId),
          CACHE_TTL.MEDIUM
        );

        const activePet = userPets.find(p => p.IsActive === true || p.isActive === true);
        if (activePet) {
          activePetId = activePet.PetId || activePet.petId;
        }
      } catch (error) {
        // Could not get active pet
      }

      // Check cache first (unless force refresh)
      const cacheKey = CACHE_KEYS.LIKES(userId, activePetId);
      if (!forceRefresh) {
        const cachedLikes = cache.get<LikeCat[]>(cacheKey, CACHE_TTL.SHORT);
        if (cachedLikes) {
          setPets(cachedLikes);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data with petId filter
      let likesData: LikeReceivedItem[] = [];
      try {
        const initialLikes = await getLikesReceived(userId, activePetId);
        likesData = initialLikes;
      } catch (error) {
        try {
          likesData = await getLikesReceived(userId);
        } catch (e) {

        }
      }

      // Convert API data to LikeCat format
      const formattedPets: LikeCat[] = likesData.map((item: LikeReceivedItem) => {
        const photos = item.petPhotos && item.petPhotos.length > 0
          ? item.petPhotos
            .filter((url: string) => url && url.trim() !== '') // Filter empty URLs
            .map((url: string) => ({ uri: url }))
          : [require("../../../assets/cat_avatar.png")];

        // Fallback if all URLs are invalid
        if (photos.length === 0) {
          photos.push(require("../../../assets/cat_avatar.png"));
        }

        return {
          id: item.matchId.toString(),                      // matchId for match/unmatch actions
          petId: item.pet?.petId?.toString() || '0',        // actual petId for navigation
          ownerId: item.owner?.userId || item.fromUserId,   // owner userId for chat
          catName: item.pet?.name || '',
          ownerName: item.owner?.fullName || '',
          gender: item.pet?.gender?.toLowerCase() === 'male' ? 'male' : 'female',
          age: item.pet?.age ? item.pet.age.toString() : '',
          breed: item.pet?.breed || '',
          image: photos[0],              // First image for backward compatibility
          images: photos,                // All images for carousel
          isMatch: item.isMatch,
        };
      });

      // Load match details for each pet
      const petsWithMatch = await Promise.all(
        formattedPets.map(async (pet) => {
          try {
            const matchDetails = await getPetMatchDetails(userId, parseInt(pet.petId));
            return {
              ...pet,
              matchPercent: matchDetails?.data?.matchPercent ?? 0,
              matchedAttributes: matchDetails?.data?.matchedAttributes ?? [],
              totalFilters: matchDetails?.totalPreferences ?? 0,
            };
          } catch (error) {
            return pet;
          }
        })
      );

      // Cache the result
      cache.set(cacheKey, petsWithMatch);

      setPets(petsWithMatch);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadLikes(true);
    } catch (error) {
      // Error refreshing
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Memoize filtered pets by tab
  const filteredPets = useMemo(() => {
    if (activeTab === 'likes') {
      return pets.filter(p => !p.isMatch);
    } else {
      return pets.filter(p => p.isMatch);
    }
  }, [pets, activeTab]);

  // Memoize handlers to prevent re-renders
  const handleMatch = useCallback(async (petId: string) => {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;

    try {
      const response = await respondToLike({
        matchId: parseInt(petId),
        action: 'match'
      });

      setPets(prevPets =>
        prevPets.map(p =>
          p.id === petId ? { ...p, isMatch: true } : p
        )
      );

      // Invalidate cache after action
      const userIdStr = await AsyncStorage.getItem('userId');
      if (userIdStr) {
        const userId = parseInt(userIdStr);
        invalidateCache.likes(userId);
        invalidateCache.chats(userId);
      }

      const petPhotoUrl = typeof pet.image === 'string' ? pet.image : pet.image?.uri;
      dispatch(showGlobalMatchModal({
        otherUserName: pet.ownerName,
        otherUserId: pet.ownerId,
        matchId: parseInt(petId),
        petName: pet.catName,
        petPhotoUrl: petPhotoUrl,
      }));
    } catch (error) {

    }
  }, [pets, dispatch]);

  const handlePass = useCallback(async (petId: string) => {
    try {
      await respondToLike({
        matchId: parseInt(petId),
        action: 'pass'
      });

      setPets(prevPets => prevPets.filter(pet => pet.id !== petId));

      // Invalidate cache after action
      const userIdStr = await AsyncStorage.getItem('userId');
      if (userIdStr) {
        const userId = parseInt(userIdStr);
        invalidateCache.likes(userId);
      }
    } catch (error) {

    }
  }, []);

  const handleUnmatch = useCallback((petId: string) => {
    const pet = pets.find(p => p.id === petId);
    const petName = pet?.catName || t('favorite.unmatch.petName');
    
    showAlert({
      type: 'warning',
      title: t('favorite.unmatch.title'),
      message: t('favorite.unmatch.message', { name: petName }),
      showCancel: true,
      confirmText: t('favorite.unmatch.confirm'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        try {
          await respondToLike({
            matchId: parseInt(petId),
            action: 'pass'
          });

          const matchId = parseInt(petId);
          dispatch(markChatAsRead(matchId));

          setPets(prevPets => prevPets.filter(pet => pet.id !== petId));

          // Invalidate cache after action
          const userIdStr = await AsyncStorage.getItem('userId');
          if (userIdStr) {
            const userId = parseInt(userIdStr);
            invalidateCache.likes(userId);
            invalidateCache.chats(userId);
          }

          showAlert({
            type: 'success',
            title: t('favorite.unmatch.success'),
            message: t('favorite.unmatch.successMessage', { name: petName }),
          });
        } catch (error: any) {
          showAlert({
            type: 'error',
            title: t('common.error'),
            message: error.message || t('favorite.unmatch.error'),
          });
        }
      },
    });
  }, [dispatch, pets, t, showAlert]);

  const handleChat = useCallback((matchId: string, ownerId: number, petName: string, petAvatar: any) => {
    navigation.navigate('ChatDetail', {
      matchId: parseInt(matchId),
      otherUserId: ownerId,
      userName: petName,
      userAvatar: petAvatar || require("../../../assets/cat_avatar.png"),
    });
  }, [navigation]);

  const handleViewProfile = useCallback((petId: string) => {
    navigation.navigate("PetProfile", { petId, fromFavorite: true } as any);
  }, [navigation]);

  const handleShowMatchDetails = useCallback(async (petId: string, petName: string) => {
    try {
      setMatchModalLoading(true);
      setShowMatchModal(true);
      
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) return;
      const userId = parseInt(userIdStr);

      const matchDetails = await getPetMatchDetails(userId, parseInt(petId));
      
      if (matchDetails?.data) {
        setSelectedPetForMatch({
          petId,
          petName,
          matchPercent: matchDetails.data.matchPercent ?? 0,
          matchScore: matchDetails.data.matchScore ?? 0,
          totalPercent: matchDetails.data.totalPercent ?? 0,
          matchedAttributes: matchDetails.data.matchedAttributes ?? [],
          totalFilters: matchDetails.totalPreferences ?? 0,
        });
      }
    } catch (error) {
      setShowMatchModal(false);
    } finally {
      setMatchModalLoading(false);
    }
  }, []);

  // Memoize renderLikeItem
  const renderLikeItem = useCallback(({ item, index }: { item: LikeCat; index: number }) => {
    const currentPhotoIndex = currentPhotoIndices[item.id] || 0;
    const hasMultiplePhotos = item.images.length > 1;

    return (
      <Animated.View style={[styles.cardWrapper]}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleViewProfile(item.petId)}
          activeOpacity={0.95}
        >
          {/* Image Container with Photo Navigation */}
          <View style={styles.imageContainer}>
            <OptimizedImage source={item.images[currentPhotoIndex]} style={styles.catImage} resizeMode="cover" showLoader={true} imageSize="card" />

            {/* Photo Navigation - Left/Right tap areas */}
            {hasMultiplePhotos && (
              <>
                <TouchableOpacity
                  style={styles.photoTapLeft}
                  activeOpacity={1}
                  onPress={(e) => {
                    e.stopPropagation();
                    const newIdx = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : item.images.length - 1;
                    setCurrentPhotoIndices(prev => ({ ...prev, [item.id]: newIdx }));
                  }}
                />
                <TouchableOpacity
                  style={styles.photoTapRight}
                  activeOpacity={1}
                  onPress={(e) => {
                    e.stopPropagation();
                    const newIdx = (currentPhotoIndex + 1) % item.images.length;
                    setCurrentPhotoIndices(prev => ({ ...prev, [item.id]: newIdx }));
                  }}
                />
              </>
            )}

            {/* Photo Dots Pagination */}
            {hasMultiplePhotos && (
              <View style={styles.photoDots}>
                {item.images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.photoDot,
                      idx === currentPhotoIndex && styles.photoDotActive
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Top Badges Row */}
            <View style={styles.topBadgesRow}>
              {/* Match Badge */}
              {item.isMatch && (
                <View style={styles.matchBadge}>
                  <LinearGradient
                    colors={["#4CAF50", "#81C784"]}
                    style={styles.matchBadgeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="heart" size={14} color={colors.white} />
                    <Text style={styles.matchBadgeText}>{t('favorite.card.matched')}</Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Gradient Overlay for better text readability */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.75)"]}
              style={styles.imageGradient}
            >
              {/* Pet Info on Image */}
              <View style={styles.imageInfo}>
                <View style={styles.petNameRow}>
                  <Text style={styles.catNameOnImage}>
                    {item.catName}
                    <Text style={item.gender === "male" ? styles.maleSymbol : styles.femaleSymbol}>
                      {" "}{item.gender === "male" ? "♂" : "♀"}
                    </Text>
                  </Text>
                  {/* Match % Badge - Only show if we have match data */}
                  {item.matchPercent !== undefined && item.matchPercent > 0 && (
                    <TouchableOpacity
                      style={styles.matchBadgeOnCard}
                      onPress={(e) => {
                        e.stopPropagation();
                        // Open modal directly with cached data
                        setSelectedPetForMatch({
                          petId: item.petId,
                          petName: item.catName,
                          matchPercent: item.matchPercent || 0,
                          matchScore: 0,
                          totalPercent: 0,
                          matchedAttributes: item.matchedAttributes || [],
                          totalFilters: item.totalFilters || 0,
                        });
                        setShowMatchModal(true);
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="star" size={12} color={colors.primary} />
                      <Text style={styles.matchBadgeOnCardText}>{item.matchPercent}%</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.metaRow}>
                  <Icon name="paw" size={16} color={colors.white} />
                  <Text style={styles.metaText}>{item.age ? t('favorite.card.age', { age: item.age }) : t('favorite.card.unknownAge')} • {item.breed || t('favorite.card.unknownBreed')}</Text>
                </View>
                {/* Owner name hidden for privacy - CHỈ MÌNH TÔI THẤY TÔI */}
              </View>
            </LinearGradient>
          </View>

          {/* Action Buttons Below Image */}
          <View style={styles.actionsContainer}>
            {item.isMatch ? (
              // Already matched - show Chat and Unmatch
              <>
                <TouchableOpacity
                  style={styles.actionBtnChat}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleChat(item.id, item.ownerId, item.catName, item.image);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradients.favorite}
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="chatbubble" size={25} color={colors.white} />
                    <Text style={styles.actionTextWhite}>{t('favorite.actions.sendMessage')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnUnmatch}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleUnmatch(item.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="close-circle" size={20} color="#FF6B6B" />
                  <Text style={styles.actionTextDanger}>{t('favorite.actions.unmatch')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Not matched yet - show Pass and Match
              <>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePass(item.id);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#FF6B6B", "#FF8E8E"]}
                    style={styles.actionBtnPass}
                  >
                    <Icon name="close" size={20} color={colors.white} />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnMatch}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleMatch(item.id);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradients.favorite}
                    style={styles.actionBtnMatchGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="heart" size={22} color={colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [currentPhotoIndices, handleMatch, handlePass, handleUnmatch, handleChat, handleViewProfile]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <LinearGradient
              colors={["#FF6B9D", "#EF476F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIconGradient}
            >
              <Icon name="heart" size={22} color={colors.white} />
            </LinearGradient>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{t('favorite.title')}</Text>
              <Text style={styles.headerSubtitle}>{t('favorite.subtitle')}</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF476F" />
          <Text style={styles.loadingText}>{t('favorite.loading')}</Text>
        </View>
        <BottomNav active="Favorite" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Animated Header with Gradient */}
      <LinearGradient
        colors={["rgba(255,240,247,1)", "rgba(250,251,252,0)"]}
        style={styles.headerGradient}
      >
        <SafeAreaView style={{ flex: 0 }} />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <LinearGradient
              colors={gradients.favorite}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerIconGradient}
            >
              <Icon name="heart" size={24} color={colors.white} />
            </LinearGradient>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{t('favorite.title')}</Text>
              <Text style={styles.headerSubtitle}>{t('favorite.subtitle')}</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'likes' && styles.tabActive]}
            onPress={() => setActiveTab('likes')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={activeTab === 'likes' ? gradients.favorite : ['transparent', 'transparent']}
              style={styles.tabGradient}
            >
              <Icon
                name="heart"
                size={20}
                color={activeTab === 'likes' ? colors.white : colors.textMedium}
              />
              <Text style={[
                styles.tabText,
                activeTab === 'likes' && styles.tabTextActive
              ]}>
                {t('favorite.tabs.likesCount', { count: pets.filter(p => !p.isMatch).length })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'matches' && styles.tabActive]}
            onPress={() => setActiveTab('matches')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={activeTab === 'matches' ? gradients.favorite : ['transparent', 'transparent']}
              style={styles.tabGradient}
            >
              <Icon
                name="people"
                size={20}
                color={activeTab === 'matches' ? colors.white : colors.textMedium}
              />
              <Text style={[
                styles.tabText,
                activeTab === 'matches' && styles.tabTextActive
              ]}>
                {t('favorite.tabs.matchesCount', { count: pets.filter(p => p.isMatch).length })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* List or Empty State */}
      {(() => {
        const filteredPets = pets.filter(pet =>
          activeTab === 'likes' ? !pet.isMatch : pet.isMatch
        );

        if (filteredPets.length === 0) {
          return (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={["rgba(255,110,167,0.1)", "rgba(255,155,192,0.05)"]}
                style={styles.emptyIconBg}
              >
                <Icon
                  name={activeTab === 'likes' ? "heart-dislike-outline" : "people-outline"}
                  size={60}
                  color={colors.primary}
                />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {activeTab === 'likes' ? t('favorite.empty.likes.title') : t('favorite.empty.matches.title')}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'likes'
                  ? t('favorite.empty.likes.message')
                  : t('favorite.empty.matches.message')
                }
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Home')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={gradients.favorite}
                  style={styles.emptyButtonGradient}
                >
                  <Icon name="paw" size={20} color={colors.white} />
                  <Text style={styles.emptyButtonText}>{t('favorite.startSwiping')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View >
          );
        }

        return (
          <Animated.FlatList
            data={filteredPets}
            keyExtractor={(item) => item.id}
            renderItem={renderLikeItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        );
      })()}

      {/* Bottom Navigation */}
      <BottomNav active="Favorite" />

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          showCancel={alertConfig.showCancel}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
          onConfirm={alertConfig.onConfirm}
          onClose={hideAlert}
        />
      )}

      {/* Match Details Modal */}
      {showMatchModal && (
        matchModalLoading ? (
          <View style={styles.matchModalLoading}>
            <View style={styles.matchModalLoadingBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.matchModalLoadingText}>{t('common.loading')}</Text>
            </View>
          </View>
        ) : selectedPetForMatch ? (
          <MatchDetailsModal
            visible={showMatchModal}
            onClose={() => {
              setShowMatchModal(false);
              setSelectedPetForMatch(null);
            }}
            petName={selectedPetForMatch.petName}
            matchPercent={selectedPetForMatch.matchPercent}
            matchedAttributes={selectedPetForMatch.matchedAttributes}
            totalFilters={selectedPetForMatch.totalFilters}
          />
        ) : null
      )}
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },

  // Header with Gradient
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: 12,
  },
  header: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.medium,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
    fontWeight: "500",
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: CARD_PADDING,
    marginTop: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.whiteWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    borderColor: colors.primary,
    ...shadows.medium,
  },
  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: "700",
  },

  // List
  listContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Card Wrapper
  cardWrapper: {
    marginHorizontal: CARD_PADDING,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.large,
  },

  // Image Container
  imageContainer: {
    width: "100%",
    height: 240,
    position: "relative",
    backgroundColor: "#F0F0F0",
  },
  catImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Photo Navigation - Reduced height to not cover info section
  photoTapLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "60%", // Only cover top 60% to leave space for pet info
    width: "35%",
    zIndex: 2,
  },
  photoTapRight: {
    position: "absolute",
    right: 0,
    top: 0,
    height: "60%", // Only cover top 60% to leave space for pet info
    width: "35%",
    zIndex: 2,
  },
  photoDots: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 3,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  photoDotActive: {
    backgroundColor: colors.white,
    width: 18,
  },

  // Top Badges
  topBadgesRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 4,
  },
  matchBadge: {
    borderRadius: radius.md,
    overflow: "hidden",
    ...shadows.button,
  },
  matchBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Image Gradient Overlay
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 14,
    zIndex: 5, // Above photo tap areas
  },
  imageInfo: {
    gap: 6,
  },
  petNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // Badge stays close to name
    flexWrap: "wrap",
  },
  catNameOnImage: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  matchBadgeOnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  matchBadgeOnCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  matchModalLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  matchModalLoadingBox: {
    backgroundColor: colors.white,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  matchModalLoadingText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  maleSymbol: {
    color: "#64B5F6",
  },
  femaleSymbol: {
    color: "#FF9BC0",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ownerTextOnImage: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Actions Container
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: colors.white,
  },

  // Action Buttons - Matched State
  actionBtnChat: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.button,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  actionTextWhite: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
  actionBtnUnmatch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#FFF5F5",
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: "#FFE0E0",
    ...shadows.small,
  },
  actionTextDanger: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF5252",
    letterSpacing: 0.3,
  },

  // Action Buttons - Not Matched State
  actionBtnPass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    ...shadows.medium,
  },
  actionBtnMatch: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    ...shadows.button,
  },
  actionBtnMatchGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 140,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 28,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.button,
  },
  emptyButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 120,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
    fontWeight: "600",
  },
});

export default FavoriteScreen;

