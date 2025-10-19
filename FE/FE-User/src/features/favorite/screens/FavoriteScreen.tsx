import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Favorite">;

interface LikeCat {
  id: string;
  catName: string;
  ownerName: string;
  gender: "male" | "female";
  age: string;
  breed: string;
  image: any;
  likedAt: string;
  isMatch: boolean;
}

const likedCats: LikeCat[] = [
  {
    id: "1",
    catName: "Milu",
    ownerName: "Nguyễn Văn A",
    gender: "female",
    age: "2 years",
    breed: "Persian Cat",
    image: require("../../../assets/cat_avatar.png"),
    likedAt: "2 hours ago",
    isMatch: true,
  },
  {
    id: "2",
    catName: "Simba",
    ownerName: "Trần Thị B",
    gender: "male",
    age: "1 year",
    breed: "British Shorthair",
    image: require("../../../assets/cat_avatar.png"),
    likedAt: "5 hours ago",
    isMatch: false,
  },
  {
    id: "3",
    catName: "Bella",
    ownerName: "Lê Văn C",
    gender: "female",
    age: "3 years",
    breed: "Maine Coon",
    image: require("../../../assets/cat_avatar.png"),
    likedAt: "Yesterday",
    isMatch: true,
  },
];

const FavoriteScreen = ({ navigation }: Props) => {
  const renderLikeItem = ({ item }: { item: LikeCat }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={item.image} style={styles.catImage} />
      
      {/* Match Badge */}
      {item.isMatch && (
        <View style={styles.matchBadge}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.matchGradient}
          >
            <Icon name="heart" size={16} color={colors.white} />
            <Text style={styles.matchText}>Match!</Text>
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
          <TouchableOpacity style={styles.actionBtn}>
            <Icon name="chatbubble-ellipses" size={20} color={colors.primary} />
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtnPrimary}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.actionGradient}
            >
              <Icon name="information-circle" size={20} color={colors.white} />
              <Text style={styles.actionTextWhite}>View Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <TouchableOpacity>
          <Icon name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{likedCats.length}</Text>
          <Text style={styles.statLabel}>Likes Received</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {likedCats.filter((c) => c.isMatch).length}
          </Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={likedCats}
        keyExtractor={(item) => item.id}
        renderItem={renderLikeItem}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      />

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
  matchGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  matchText: {
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
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
});

export default FavoriteScreen;

