import React, { useState } from "react";
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
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";

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

  // Cat Profile - MAIN FOCUS
  const myCat = {
    id: "1",
    name: "Luna",
    breed: "Persian Cat",
    age: "2 years",
    gender: "female" as "male" | "female",
    bio: "Cat mom 😺 | Love cozy evenings with my Persian | Looking for playmates for my furry baby!",
    personality: ["Playful", "Gentle", "Indoor Cat"],
    vaccinated: true,
    photos: [
      require("../../../assets/cat_avatar.png"),
      require("../../../assets/cat_avatar_signin.png"),
      require("../../../assets/cat_avatar.png"),
    ],
  };

  // Stats data - CAT STATS
  const catStats = {
    matches: 24,
    likes: 156,
    visits: 89,
  };

  // Owner Info - SIMPLE
  const owner = {
    name: "Sarah Johnson",
    location: "Ha Noi, Vietnam",
    isPremium: false, // Set false để hiển thị "Go Premium" card
    email: "sarah.johnson@gmail.com",
    phone: "+84 999 999 999",
    memberSince: "January 2024",
  };

  // My Pets List
  const [myPets, setMyPets] = useState<PetItem[]>([
    {
      id: "1",
      name: "Luna",
      breed: "Persian Cat",
      age: "2 years",
      gender: "female",
      image: require("../../../assets/cat_avatar.png"),
      isActive: true, // Pet mặc định được chọn
    },
    {
      id: "2",
      name: "Milo",
      breed: "British Shorthair",
      age: "1 year",
      gender: "male",
      image: require("../../../assets/cat_avatar_signin.png"),
      isActive: false,
    },
  ]);

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleEditCat = () => {
    navigation.navigate("EditPet", { petId: myCat.id });
  };

  const handleSetActivePet = (petId: string) => {
    Alert.alert(
      "Set Active Pet",
      "Use this pet for matching and dating?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set Active",
          onPress: () => {
            setMyPets((prevPets) =>
              prevPets.map((pet) => ({
                ...pet,
                isActive: pet.id === petId,
              }))
            );
            Alert.alert("Success", "Active pet updated!");
          },
        },
      ]
    );
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
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#FF9800", "#FFB74D"]}
              style={styles.statGradient}
            >
              <Text style={styles.statNumber}>{catStats.visits}</Text>
              <Text style={styles.statLabel}>Visits</Text>
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

        {/* Cat Personality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personality</Text>
          <View style={styles.personalityContainer}>
            {myCat.personality.map((trait, index) => (
              <View key={index} style={styles.personalityTag}>
                <Icon name="paw" size={14} color={colors.primary} />
                <Text style={styles.personalityText}>{trait}</Text>
              </View>
            ))}
            {myCat.vaccinated && (
              <View style={styles.vaccinatedTag}>
                <Icon name="shield-checkmark" size={14} color="#4CAF50" />
                <Text style={styles.vaccinatedText}>Vaccinated</Text>
              </View>
            )}
          </View>
        </View>

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
              <Text style={styles.ownerText}>{owner.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.ownerRow}>
              <Icon name="location-outline" size={20} color={colors.textMedium} />
              <Text style={styles.ownerText}>{owner.location}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.ownerRow}>
              <Icon name="mail-outline" size={20} color={colors.textMedium} />
              <Text style={styles.ownerText}>{owner.email}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav active="Profile" />
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

  // Personality Tags
  personalityContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  personalityTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  personalityText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  vaccinatedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  vaccinatedText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
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
    flex: 1,
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

