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
import { getLikesReceived, respondToLike, LikeReceivedItem } from "../../../api/match";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [pets, setPets] = useState<LikeCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedPet, setMatchedPet] = useState<LikeCat | null>(null);
  const [currentPhotoIndices, setCurrentPhotoIndices] = useState<{ [key: string]: number }>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  // Reload likes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Favorite screen focused - reloading likes...');
      loadLikes();
    }, [])
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
      
      const likesData = await getLikesReceived(userId);
      console.log('✅ Received likes:', likesData);

      // Convert API data to LikeCat format
      const formattedPets: LikeCat[] = likesData.map((item: LikeReceivedItem) => {
        const photos = item.petPhotos && item.petPhotos.length > 0
          ? item.petPhotos.map((url: string) => ({ uri: url }))
          : [require("../../../assets/cat_avatar.png")];
        
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

      // Show match modal
      setMatchedPet(pet);
      setShowMatchModal(true);

      // Hide modal after 3 seconds
      setTimeout(() => {
        setShowMatchModal(false);
        setMatchedPet(null);
      }, 3000);
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

  const handleChat = (matchId: string, ownerId: number, ownerName: string) => {
    console.log('💬 Opening chat:', { matchId, ownerId, ownerName });
    navigation.navigate('ChatDetail', { 
      matchId: parseInt(matchId),
      otherUserId: ownerId,
      userName: ownerName,
      userAvatar: require("../../../assets/cat_avatar.png"),
    });
  };

  const handleViewProfile = (petId: string) => {
    console.log('🐾 Opening pet profile:', petId);
    navigation.navigate("PetProfile", { petId });
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
                  <Icon name="paw" size={14} color={colors.white} />
                  <Text style={styles.metaText}>{item.age} • {item.breed}</Text>
                </View>
                <View style={styles.ownerRow}>
                  <Icon name="person-outline" size={14} color={colors.white} />
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
                    handleChat(item.id, item.ownerId, item.ownerName);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="chatbubble" size={22} color={colors.white} />
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
                  <Icon name="close-circle-outline" size={22} color={colors.error} />
                  <Text style={styles.actionTextDanger}>Unmatch</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Not matched yet - show Pass and Match
              <>
                <TouchableOpacity 
                  style={styles.actionBtnPass}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePass(item.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Icon name="close" size={28} color="#FF6B6B" />
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
                    colors={gradients.primary}
                    style={styles.actionBtnMatchGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="heart" size={28} color={colors.white} />
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
              colors={gradients.primary}
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

        {/* Modern Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsGradient}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, styles.statIconLikes]}>
                <Icon name="heart" size={20} color={colors.white} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>{pets.length}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, styles.statIconMatches]}>
                <Icon name="people" size={20} color={colors.white} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statNumber}>
                  {pets.filter((c) => c.isMatch).length}
                </Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* List or Empty State */}
      {pets.length === 0 ? (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={["rgba(255,110,167,0.1)", "rgba(255,155,192,0.05)"]}
            style={styles.emptyIconBg}
          >
            <Icon name="heart-dislike-outline" size={60} color={colors.primary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            When other pets like you, they'll appear here.{'\n'}
            Keep swiping to find your perfect match!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradients.primary}
              style={styles.emptyButtonGradient}
            >
              <Icon name="paw" size={20} color={colors.white} />
              <Text style={styles.emptyButtonText}>Start Swiping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={pets}
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
      )}

      {/* Match Modal */}
      {showMatchModal && matchedPet && (
        <View style={styles.matchModal}>
          <LinearGradient
            colors={["rgba(255,110,167,0.97)", "rgba(255,155,192,0.97)"]}
            style={styles.matchGradient}
          >
            <View style={styles.matchIconContainer}>
              <Icon name="heart" size={80} color={colors.white} />
            </View>
            <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
            <Text style={styles.matchText}>
              You and {matchedPet.ownerName} liked each other's pets
            </Text>
            <View style={styles.matchPetContainer}>
              <Image source={matchedPet.image} style={styles.matchPetImage} />
              <Text style={styles.matchPetName}>{matchedPet.catName}</Text>
            </View>
            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={() => {
                if (matchedPet) {
                  handleChat(matchedPet.id, matchedPet.ownerId, matchedPet.ownerName);
                }
                setShowMatchModal(false);
                setMatchedPet(null);
              }}
              activeOpacity={0.9}
            >
              <Icon name="chatbubble" size={20} color={colors.primary} />
              <Text style={styles.sendMessageText}>Send Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.keepSwipingButton}
              onPress={() => {
                setShowMatchModal(false);
                setMatchedPet(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.keepSwipingText}>Keep Browsing</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

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

  // Modern Stats Card
  statsCard: {
    marginHorizontal: CARD_PADDING,
    marginTop: 16,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.medium,
  },
  statsGradient: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,110,167,0.15)",
    borderRadius: radius.xl,
    backgroundColor: "#FFF8FB", // Màu hồng kem dịu mắt
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  statIconLikes: {
    backgroundColor: colors.primary,
  },
  statIconMatches: {
    backgroundColor: "#4CAF50",
  },
  statTextContainer: {
    alignItems: "flex-start",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: "600",
    marginTop: -2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,110,167,0.2)",
    marginHorizontal: 8,
  },

  // List
  listContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Card Wrapper
  cardWrapper: {
    marginHorizontal: CARD_PADDING,
    marginBottom: 20,
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
    height: 400,
    position: "relative",
    backgroundColor: colors.cardBackgroundLight,
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 16,
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
    fontSize: 26,
    fontWeight: "bold",
    color: colors.white,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
    gap: 6,
  },
  metaText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: "500",
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ownerTextOnImage: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "500",
  },

  // Actions Container
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: colors.white,
  },

  // Action Buttons - Matched State
  actionBtnChat: {
    flex: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    ...shadows.button,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  actionTextWhite: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: 0.3,
  },
  actionBtnUnmatch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "rgba(233,77,107,0.3)",
  },
  actionTextDanger: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.error,
  },

  // Action Buttons - Not Matched State
  actionBtnPass: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF6B6B",
    ...shadows.medium,
  },
  actionBtnMatch: {
    flex: 1,
    height: 64,
    borderRadius: 32,
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

  // Match Modal
  matchModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  matchGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  matchIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  matchTitle: {
    fontSize: 38,
    fontWeight: "bold",
    color: colors.white,
    marginTop: 24,
    textAlign: "center",
  },
  matchText: {
    fontSize: 17,
    color: colors.white,
    textAlign: "center",
    marginTop: 12,
    opacity: 0.95,
    lineHeight: 24,
  },
  matchPetContainer: {
    alignItems: "center",
    marginTop: 32,
    gap: 12,
  },
  matchPetImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: colors.white,
    ...shadows.large,
  },
  matchPetName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
  },
  sendMessageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: radius.lg,
    marginTop: 32,
    ...shadows.large,
  },
  sendMessageText: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.primary,
  },
  keepSwipingButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  keepSwipingText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    opacity: 0.9,
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

