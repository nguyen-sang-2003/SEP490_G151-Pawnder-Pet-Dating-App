import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
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
import { getLikesReceived, respondToLike, LikeReceivedItem } from "../../../api/match";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { resetFavoriteBadge, showMatchModal } from "../../badge/badgeSlice";
import { AppDispatch } from "../../../app/store";
import { getPetsByUserId } from "../../../api/pet";

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
  const [pets, setPets] = useState<LikeCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndices, setCurrentPhotoIndices] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'likes' | 'matches'>('likes');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Reload likes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Favorite screen focused - reloading likes...');
      // Reset favorite badge when user views this screen
      console.log('🔔 Resetting favorite badge to 0');
      dispatch(resetFavoriteBadge());
      loadLikes();
      
      // Don't refresh badges here - they are managed by useBadgeNotifications hook
    }, [dispatch])
  );

  const loadLikes = async () => {
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
      
      // Get user's active pet ID
      let activePetId: number | undefined;
      try {
        const userPets = await getPetsByUserId(userId);
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
      
      const likesData = await getLikesReceived(userId, activePetId);
      console.log('✅ Received likes:', likesData);

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
          catName: item.pet?.name || 'Unknown',
          ownerName: item.owner?.fullName || 'Unknown',
          gender: item.pet?.gender?.toLowerCase() === 'male' ? 'male' : 'female',
          age: item.pet?.age ? `${item.pet.age} years` : 'N/A',
          breed: item.pet?.breed || 'Unknown',
          image: photos[0],              // First image for backward compatibility
          images: photos,                // All images for carousel
          likedAt: getTimeAgo(item.createdAt),
          isMatch: item.isMatch,
        };
      });

      setPets(formattedPets);
    } catch (error) {
      console.error('❌ Error loading likes:', error);
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

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const handleMatch = async (petId: string) => {
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
      console.error('❌ Error matching:', error);
    }
  };

  const handlePass = async (petId: string) => {
    try {
      console.log('👎 Passing on:', petId);
      
      // Call API to reject/pass
      await respondToLike({
        matchId: parseInt(petId),
        action: 'pass'
      });

      // Remove from list immediately
      setPets(prevPets => prevPets.filter(pet => pet.id !== petId));
      console.log('✅ Passed successfully');
    } catch (error) {
      console.error('❌ Error passing:', error);
    }
  };

  const handleUnmatch = async (petId: string) => {
    try {
      console.log('💔 Unmatching:', petId);
      
      // Call API to unmatch (pass on already matched)
      await respondToLike({
        matchId: parseInt(petId),
        action: 'pass'
      });

      // Remove from list immediately
      setPets(prevPets => prevPets.filter(pet => pet.id !== petId));
      console.log('✅ Unmatched successfully');
    } catch (error) {
      console.error('❌ Error unmatching:', error);
    }
  };

  const handleChat = (matchId: string, ownerId: number, ownerName: string, petAvatar: any) => {
    console.log('💬 Opening chat:', { matchId, ownerId, ownerName });
    navigation.navigate('ChatDetail', { 
      matchId: parseInt(matchId),
      otherUserId: ownerId,
      userName: ownerName,
      userAvatar: petAvatar || require("../../../assets/cat_avatar.png"),
    });
  };

  const handleViewProfile = (petId: string) => {
    console.log('🐾 Opening pet profile:', petId);
    navigation.navigate("PetProfile", { petId, fromFavorite: true } as any);
  };

  const renderLikeItem = ({ item, index }: { item: LikeCat; index: number }) => {
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
            <Image source={item.images[currentPhotoIndex]} style={styles.catImage} />
            
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
                    <Text style={styles.matchBadgeText}>Match!</Text>
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
                  <Text style={styles.metaText}>{item.age} • {item.breed}</Text>
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
                    <Text style={styles.actionTextWhite}>Send Message</Text>
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
                  <Text style={styles.actionTextDanger}>Unmatch</Text>
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
  };

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
            <View>
              <Text style={styles.headerTitle}>Favorites</Text>
              <Text style={styles.headerSubtitle}>Pets who liked you</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF476F" />
          <Text style={styles.loadingText}>Loading likes...</Text>
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
                Likes ({pets.filter(p => !p.isMatch).length})
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
                Matches ({pets.filter(p => p.isMatch).length})
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
                {activeTab === 'likes' ? 'No Likes Yet' : 'No Matches Yet'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'likes' 
                  ? "When other pets like you, they'll appear here.\nKeep swiping to find your perfect match!"
                  : "When you match with someone, they'll appear here.\nStart liking pets to create matches!"
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
                  <Text style={styles.emptyButtonText}>Start Swiping</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
    </View>
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

