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
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";
import { refreshBadgesForActivePet } from "../../../utils/badgeRefresh";
import { getLikesReceived, respondToLike, type LikeReceivedItem } from "../../match/api/matchApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { resetFavoriteBadge, showMatchModal, selectActivePetId, markChatAsRead } from "../../badge/badgeSlice";
import { AppDispatch } from "../../../app/store";
import { getPetsByUserId } from "../../pet/api/petApi";
import OptimizedImage from "../../../components/OptimizedImage";
import { cache, CACHE_KEYS, CACHE_TTL, invalidateCache } from "../../../services/cache";
import signalRService from "../../../services/signalr.service";

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
  likedAt: string;
  isMatch: boolean;
}

const FavoriteScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const activePetId = useSelector(selectActivePetId); // Get current active pet ID
  const [pets, setPets] = useState<LikeCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndices, setCurrentPhotoIndices] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'likes' | 'matches'>('likes');
  const scrollY = useRef(new Animated.Value(0)).current;
  const [reloadTrigger, setReloadTrigger] = useState(0); // Trigger for reload

  // ✅ Reload likes when activePetId changes
  useEffect(() => {
    if (activePetId !== null) {
      console.log('🔄 Active pet changed, reloading likes...');
      loadLikes(true); // Force refresh
    }
  }, [activePetId]);

  // ✅ Setup realtime listeners for instant UI updates
  useEffect(() => {
    const handleMatchSuccess = (data: any) => {
      console.log('🎉 [FavoriteScreen] Match success received:', data);
      // Trigger reload
      setReloadTrigger(prev => prev + 1);
    };

    const handleNewLike = (data: any) => {
      console.log('💗 [FavoriteScreen] New like received:', data);
      // Trigger reload
      setReloadTrigger(prev => prev + 1);
    };

    const handleMatchDeleted = (data: any) => {
      console.log('💔 [FavoriteScreen] Match deleted:', data);
      const matchId = data.matchId || data.MatchId;
      
      if (matchId) {
        // ✅ Remove from UI immediately without full reload
        setPets(prevPets => prevPets.filter(pet => pet.id !== matchId.toString()));
        console.log('✅ Removed matchId from FavoriteScreen:', matchId);
      }
    };

    // Listen to SignalR events
    signalRService.on('MatchSuccess', handleMatchSuccess);
    signalRService.on('NewLikeBadge', handleNewLike);
    signalRService.on('MatchDeleted', handleMatchDeleted);

    return () => {
      // Cleanup listeners
      signalRService.off('MatchSuccess', handleMatchSuccess);
      signalRService.off('NewLikeBadge', handleNewLike);
      signalRService.off('MatchDeleted', handleMatchDeleted);
    };
  }, []); // Empty deps - listeners stay consistent

  // ✅ Reload when reloadTrigger changes
  useEffect(() => {
    if (reloadTrigger > 0) {
      console.log('🔄 Reload triggered by realtime event');
      loadLikes(true);
    }
  }, [reloadTrigger]);

  // Reload likes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Favorite screen focused - reloading likes...');
      // Reset favorite badge when user views this screen
      console.log('🔔 Resetting favorite badge to 0');
      dispatch(resetFavoriteBadge());

      // 🚀 FORCE REFRESH: Always fetch fresh data when entering screen
      loadLikes(true); // Force refresh = true

      // ✅ FORCE badge refresh to ensure all badges are up-to-date
      const refreshBadges = async () => {
        try {
          const userIdStr = await AsyncStorage.getItem('userId');
          if (userIdStr) {
            const userId = parseInt(userIdStr);
            console.log('🔄 [FavoriteScreen] Force refreshing all badges on focus');
            await refreshBadgesForActivePet(userId, true);
          }
        } catch (error) {
          console.error('❌ [FavoriteScreen] Failed to refresh badges:', error);
        }
      };
      
      refreshBadges();
    }, [dispatch])
  );

  // 🚀 OPTIMIZED: Load likes with parallel API calls and caching
  const loadLikes = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        console.log('❌ No userId found');
        setLoading(false);
        return;
      }

      const userId = parseInt(userIdStr);
      console.log('📞 Loading likes for user:', userId);

      // 🚀 OPTIMIZATION 1: Get active pet with cache
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
          console.log('🐾 Active pet for likes filtering:', activePetId);
        } else {
          console.log('⚠️ No active pet found - showing all likes');
        }
      } catch (error) {
        console.log('⚠️ Could not get active pet - showing all likes');
      }

      // 🚀 OPTIMIZATION 2: Check cache first (unless force refresh)
      const cacheKey = CACHE_KEYS.LIKES(userId, activePetId);
      if (!forceRefresh) {
        const cachedLikes = cache.get<LikeCat[]>(cacheKey, CACHE_TTL.SHORT);
        if (cachedLikes) {
          console.log('✅ Using cached likes');
          setPets(cachedLikes);
          setLoading(false);
          return;
        }
      }

      // 🚀 OPTIMIZATION 3: Fetch fresh data with petId filter
      let likesData: LikeReceivedItem[] = [];
      try {
        // Pass activePetId to API so backend filters correctly
        const initialLikes = await getLikesReceived(userId, activePetId);
        console.log('📊 Total likes from API (filtered by pet):', initialLikes.length);
        likesData = initialLikes;
      } catch (error) {
        console.log('⚠️ Error loading data:', error);
        // Fallback: try to load likes without pet filter
        try {
          likesData = await getLikesReceived(userId);
        } catch (e) {

        }
      }

      console.log('✅ Final likes to display:', likesData.length);

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
          likedAt: getTimeAgo(item.createdAt),
          isMatch: item.isMatch,
        };
      });

      // 🚀 OPTIMIZATION 4: Cache the result
      cache.set(cacheKey, formattedPets);
      console.log('💾 Cached likes for future use');

      setPets(formattedPets);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  // Helper to format time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    return `${diffDays} ngày trước`;
  };

  // 🚀 OPTIMIZATION 2: Memoize filtered pets by tab
  const filteredPets = useMemo(() => {
    if (activeTab === 'likes') {
      return pets.filter(p => !p.isMatch);
    } else {
      return pets.filter(p => p.isMatch);
    }
  }, [pets, activeTab]);

  // 🚀 OPTIMIZATION 3: Memoize handlers to prevent re-renders
  const handleMatch = useCallback(async (petId: string) => {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;

    try {
      console.log('💘 Matching with:', petId);

      // Call API to accept the match
      const response = await respondToLike({
        matchId: parseInt(petId),
        action: 'match'
      });

      console.log('✅ Match response:', response);

      // Update UI immediately - change to matched
      setPets(prevPets =>
        prevPets.map(p =>
          p.id === petId ? { ...p, isMatch: true } : p
        )
      );

      // 🚀 OPTIMIZATION: Invalidate cache after action
      const userIdStr = await AsyncStorage.getItem('userId');
      if (userIdStr) {
        const userId = parseInt(userIdStr);
        invalidateCache.likes(userId);
        invalidateCache.chats(userId); // Also invalidate chats since we have a new match
      }

      // Show global match modal
      const petPhotoUrl = typeof pet.image === 'string' ? pet.image : pet.image?.uri;
      dispatch(showMatchModal({
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
      console.log('👎 Passing on:', petId);

      // Call API to reject/pass
      await respondToLike({
        matchId: parseInt(petId),
        action: 'pass'
      });

      // Remove from list immediately
      setPets(prevPets => prevPets.filter(pet => pet.id !== petId));

      // 🚀 OPTIMIZATION: Invalidate cache after action
      const userIdStr = await AsyncStorage.getItem('userId');
      if (userIdStr) {
        const userId = parseInt(userIdStr);
        invalidateCache.likes(userId);
      }

      console.log('✅ Passed successfully');
    } catch (error) {

    }
  }, []);

  const handleUnmatch = useCallback(async (petId: string) => {
    try {
      console.log('💔 Unmatching:', petId);

      // Call API to unmatch (pass on already matched)
      await respondToLike({
        matchId: parseInt(petId),
        action: 'pass'
      });

      // ✅ Remove badge for this chat immediately
      const matchId = parseInt(petId);
      dispatch(markChatAsRead(matchId));
      console.log('✅ Removed badge for matchId:', matchId);

      // Remove from list immediately
      setPets(prevPets => prevPets.filter(pet => pet.id !== petId));

      // 🚀 OPTIMIZATION: Invalidate cache after action
      const userIdStr = await AsyncStorage.getItem('userId');
      if (userIdStr) {
        const userId = parseInt(userIdStr);
        invalidateCache.likes(userId);
        invalidateCache.chats(userId); // Also invalidate chats
      }

      console.log('✅ Unmatched successfully');
    } catch (error) {

    }
  }, [dispatch]);

  const handleChat = useCallback((matchId: string, ownerId: number, ownerName: string, petAvatar: any) => {
    console.log('💬 Opening chat:', { matchId, ownerId, ownerName });
    navigation.navigate('ChatDetail', {
      matchId: parseInt(matchId),
      otherUserId: ownerId,
      userName: ownerName,
      userAvatar: petAvatar || require("../../../assets/cat_avatar.png"),
    });
  }, [navigation]);

  const handleViewProfile = useCallback((petId: string) => {
    console.log('🐾 Opening pet profile:', petId);
    navigation.navigate("PetProfile", { petId, fromFavorite: true } as any);
  }, [navigation]);

  // 🚀 OPTIMIZATION 4: Memoize renderLikeItem
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
                    <Text style={styles.matchBadgeText}>Ghép đôi!</Text>
                  </LinearGradient>
                </View>
              )}

              {/* Time Badge */}
              <View style={styles.timeBadge}>
                <Icon name="time-outline" size={12} color={colors.white} />
                <Text style={styles.timeBadgeText}>{item.likedAt}</Text>
              </View>
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
                </View>
                <View style={styles.metaRow}>
                  <Icon name="paw" size={16} color={colors.white} />
                  <Text style={styles.metaText}>{item.age ? `${item.age} tuổi` : 'Không rõ'} • {item.breed || 'Không rõ'}</Text>
                </View>
                <View style={styles.ownerRow}>
                  <Icon name="person-outline" size={16} color={colors.white} />
                  <Text style={styles.ownerTextOnImage}>{item.ownerName}</Text>
                </View>
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
                    handleChat(item.id, item.ownerId, item.ownerName, item.image);
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
                    <Text style={styles.actionTextWhite}>Gửi tin nhắn</Text>
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
                  <Text style={styles.actionTextDanger}>Hủy ghép đôi</Text>
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
              <Text style={styles.headerTitle}>Yêu thích</Text>
              <Text style={styles.headerSubtitle}>Thú cưng đã thích bạn</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF476F" />
          <Text style={styles.loadingText}>Đang tải...</Text>
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
              <Text style={styles.headerTitle}>Favorites</Text>
              <Text style={styles.headerSubtitle}>Pets who liked you</Text>
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
                Lượt thích ({pets.filter(p => !p.isMatch).length})
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
                Ghép đôi ({pets.filter(p => p.isMatch).length})
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
                {activeTab === 'likes' ? 'Chưa có lượt thích' : 'Chưa có ghép đôi'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'likes'
                  ? "Khi thú cưng khác thích bạn, chúng sẽ xuất hiện ở đây.\nTiếp tục vuốt để tìm cặp đôi hoàn hảo!"
                  : "Khi bạn ghép đôi với ai đó, họ sẽ xuất hiện ở đây.\nBắt đầu thích thú cưng để tạo ghép đôi!"
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
                  <Text style={styles.emptyButtonText}>Bắt đầu vuốt</Text>
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
          />
        );
      })()}

      {/* Bottom Navigation */}
      <BottomNav active="Favorite" />
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

  // Photo Navigation
  photoTapLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: "35%",
    zIndex: 2,
  },
  photoTapRight: {
    position: "absolute",
    right: 0,
    top: 0,
    height: "100%",
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
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  timeBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
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
  },
  imageInfo: {
    gap: 6,
  },
  petNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  catNameOnImage: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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

