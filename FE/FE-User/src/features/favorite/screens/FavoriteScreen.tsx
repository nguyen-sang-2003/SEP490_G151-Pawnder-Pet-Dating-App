import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
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
  image: any;
  likedAt: string;
  isMatch: boolean;
}

const FavoriteScreen = ({ navigation }: Props) => {
  const [pets, setPets] = React.useState<LikeCat[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showMatchModal, setShowMatchModal] = React.useState(false);
  const [matchedPet, setMatchedPet] = React.useState<LikeCat | null>(null);

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
      const formattedPets: LikeCat[] = likesData.map((item: LikeReceivedItem) => ({
        id: item.matchId.toString(),                      // matchId for match/unmatch actions
        petId: item.pet?.petId?.toString() || '0',        // actual petId for navigation
        ownerId: item.owner?.userId || item.fromUserId,   // owner userId for chat
        catName: item.pet?.name || 'Unknown',
        ownerName: item.owner?.fullName || 'Unknown',
        gender: item.pet?.gender?.toLowerCase() === 'male' ? 'male' : 'female',
        age: item.pet?.age ? `${item.pet.age} years` : 'N/A',
        breed: item.pet?.breed || 'Unknown',
        image: item.petPhotos && item.petPhotos.length > 0
          ? { uri: item.petPhotos[0] }
          : require("../../../assets/cat_avatar.png"),
        likedAt: getTimeAgo(item.createdAt),
        isMatch: item.isMatch,
      }));

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

  const renderLikeItem = ({ item }: { item: LikeCat }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleViewProfile(item.petId)}  // Use petId instead of matchId
      activeOpacity={0.9}
    >
      <Image source={item.image} style={styles.catImage} />
      
      {/* Match Badge */}
      {item.isMatch && (
        <View style={styles.matchBadge}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.matchBadgeGradient}
          >
            <Icon name="heart" size={16} color={colors.white} />
            <Text style={styles.matchBadgeText}>Match!</Text>
          </LinearGradient>
        </View>
      )}

      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.catName}>
            {item.catName}{" "}
            <Text style={item.gender === "male" ? styles.male : styles.female}>
              {item.gender === "male" ? "♂" : "♀"}
            </Text>
          </Text>
          <Text style={styles.likedTime}>{item.likedAt}</Text>
        </View>
        
        <Text style={styles.ownerName}>Owner: {item.ownerName}</Text>
        <Text style={styles.catMeta}>
          {item.age} • {item.breed}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {item.isMatch ? (
            // Already matched - show Chat and Unmatch
            <>
              <TouchableOpacity 
                style={styles.actionBtnPrimary}
                onPress={(e) => {
                  e.stopPropagation();
                  handleChat(item.id, item.ownerId, item.ownerName);
                }}
              >
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.actionGradient}
                >
                  <Icon name="chatbubble" size={20} color={colors.white} />
                  <Text style={styles.actionTextWhite}>Chat</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionBtnSecondary}
                onPress={(e) => {
                  e.stopPropagation();
                  handleUnmatch(item.id);
                }}
              >
                <Icon name="close-circle" size={20} color={colors.error} />
                <Text style={styles.actionTextDanger}>Unmatch</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Not matched yet - show Pass and Match
            <>
              <TouchableOpacity 
                style={styles.actionBtnSecondary}
                onPress={(e) => {
                  e.stopPropagation();
                  handlePass(item.id);
                }}
              >
                <Icon name="close" size={20} color={colors.textMedium} />
                <Text style={styles.actionTextSecondary}>Pass</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionBtnPrimary}
                onPress={(e) => {
                  e.stopPropagation();
                  handleMatch(item.id);
                }}
              >
                <LinearGradient
                  colors={gradients.primary}
                  style={styles.actionGradient}
                >
                  <Icon name="heart" size={20} color={colors.white} />
                  <Text style={styles.actionTextWhite}>Match</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Show loading state
  if (loading) {
    return (
      <LinearGradient
        colors={gradients.background}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Favorites</Text>
            <Text style={styles.headerSubtitle}>Pets who liked you</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading likes...</Text>
        </View>
        <BottomNav active="Favorite" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Favorites</Text>
          <Text style={styles.headerSubtitle}>Pets who liked you</Text>
        </View>
        <TouchableOpacity>
          <Icon name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pets.length}</Text>
          <Text style={styles.statLabel}>Likes Received</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {pets.filter((c) => c.isMatch).length}
          </Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
      </View>

      {/* List */}
      {pets.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="heart-dislike-outline" size={80} color={colors.textLabel} />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyText}>
            Keep swiping to find your perfect match!
          </Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={renderLikeItem}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Match Modal */}
      {showMatchModal && matchedPet && (
        <View style={styles.matchModal}>
          <LinearGradient
            colors={["rgba(255,110,167,0.95)", "rgba(255,155,192,0.95)"]}
            style={styles.matchGradient}
          >
            <Icon name="heart" size={80} color={colors.white} />
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchText}>
              You and {matchedPet.ownerName} liked each other's pets
            </Text>
            <View style={styles.matchPets}>
              <Image source={matchedPet.image} style={styles.matchPetImage} />
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
            >
              <Text style={styles.sendMessageText}>Send Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.keepSwipingButton}
              onPress={() => {
                setShowMatchModal(false);
                setMatchedPet(null);
              }}
            >
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="Favorite" />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
  },

  // Stats
  stats: {
    flexDirection: "row",
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.medium,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.textLabel,
    opacity: 0.2,
  },

  // Card
  card: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: "hidden",
    ...shadows.large,
  },
  catImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    backgroundColor: colors.cardBackgroundLight,
  },
  matchBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  matchBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  matchBadgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  cardInfo: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
  },
  male: {
    color: colors.male,
  },
  female: {
    color: colors.female,
  },
  likedTime: {
    fontSize: 12,
    color: colors.textMedium,
  },
  ownerName: {
    fontSize: 15,
    color: colors.textDark,
    marginBottom: 4,
    fontWeight: "500",
  },
  catMeta: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 12,
  },

  // Actions
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.cardBackgroundLight,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.textLabel,
  },
  actionTextSecondary: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  actionBtnPrimary: {
    flex: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  actionTextWhite: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  actionBtnDanger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFE5E5",
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  actionTextDanger: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 120,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 12,
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
  matchTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: colors.white,
    marginTop: 20,
  },
  matchText: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    marginTop: 12,
    opacity: 0.95,
  },
  matchPets: {
    flexDirection: "row",
    marginTop: 30,
    gap: 20,
  },
  matchPetImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.white,
  },
  sendMessageButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: radius.lg,
    marginTop: 30,
    ...shadows.large,
  },
  sendMessageText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  keepSwipingButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  keepSwipingText: {
    fontSize: 16,
    fontWeight: "600",
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

