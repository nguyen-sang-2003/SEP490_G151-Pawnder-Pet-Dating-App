import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";

type Props = NativeStackScreenProps<RootStackParamList, "PetProfile">;

const PetProfileScreen = ({ navigation, route }: Props) => {
  // Mock pet data - in production, fetch based on route.params.petId
  const pet = {
    id: route.params?.petId || "1",
    name: "Coco",
    breed: "British shorthair",
    age: "2 years",
    gender: "Female",
    color: "Grey",
    weight: "4.5kg",
    location: "Ha Noi, Viet Nam",
    personality: "Friendly, playful",
    avatar: require("../../../assets/cat_avatar.png"),
    owner: {
      name: "LQT",
      status: "Premium",
      avatar: require("../../../assets/cat_avatar_signin.png"),
    },
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEdit = () => {
    // Navigate to edit pet screen
    navigation.navigate("EditPet", { petId: pet.id });
  };

  const handleAddToFavorite = () => {
    // Add to favorite logic
    console.log("Added to favorite");
  };

  const handleSendMatchRequest = () => {
    // Send match request logic
    console.log("Match request sent");
  };

  const handleBlock = () => {
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${pet.owner.name}? You won't see their pets anymore.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            // TODO: Call Block API - POST /block/{fromUserId}/{toUserId}
            console.log("Blocked user");
            Alert.alert("Blocked", `${pet.owner.name} has been blocked.`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    // TODO: Navigate to Report screen
    navigation.navigate("Report" as any, { 
      userId: pet.id, 
      userName: pet.owner.name 
    });
  };

  return (
    <LinearGradient
      colors={["#FFF5F9", "#FDE8EF"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-back" size={26} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEdit}>
            <Icon name="pencil" size={24} color="#FF6EA7" />
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#C8A8D4", "#E8D5EE"]}
              style={styles.avatarGradient}
            >
              <Image source={pet.avatar} style={styles.avatar} />
            </LinearGradient>
            <TouchableOpacity style={styles.editIconBtn} onPress={handleEdit}>
              <LinearGradient
                colors={["#FF6EA7", "#FF9BC0"]}
                style={styles.editIconGradient}
              >
                <Icon name="pencil" size={16} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
        </View>

        {/* Pet Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet informations</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bread</Text>
              <Text style={styles.infoValue}>{pet.breed}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{pet.age}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{pet.gender}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Color</Text>
              <Text style={styles.infoValue}>{pet.color}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{pet.weight}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{pet.location}</Text>
            </View>
          </View>

          {/* Personality */}
          <View style={styles.personalityCard}>
            <Text style={styles.personalityText}>{pet.personality}</Text>
          </View>
        </View>

        {/* Owner Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owner</Text>

          <View style={styles.ownerCard}>
            <View style={styles.ownerInfo}>
              <Image source={pet.owner.avatar} style={styles.ownerAvatar} />
              <View>
                <Text style={styles.ownerName}>{pet.owner.name}</Text>
                <Text style={styles.ownerStatus}>{pet.owner.status}</Text>
              </View>
            </View>
            <TouchableOpacity>
              <Icon name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.btnShadow, styles.actionBtnWrapper]}
            activeOpacity={0.8}
            onPress={handleAddToFavorite}
          >
            <LinearGradient
              colors={["#C8A8D4", "#E8D5EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtn}
            >
              <Icon name="heart-outline" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Add to{"\n"}favorite</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnShadow, styles.actionBtnWrapper]}
            activeOpacity={0.8}
            onPress={handleSendMatchRequest}
          >
            <LinearGradient
              colors={["#C8A8D4", "#E8D5EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtn}
            >
              <Icon name="paw" size={24} color="#fff" />
              <Text style={styles.actionBtnText}>Send match{"\n"}request</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Safety Actions */}
        <View style={styles.safetyActions}>
          <TouchableOpacity 
            style={styles.safetyBtn}
            onPress={handleReport}
          >
            <Icon name="flag-outline" size={20} color="#FF9800" />
            <Text style={[styles.safetyBtnText, { color: "#FF9800" }]}>
              Report
            </Text>
          </TouchableOpacity>

          <View style={styles.safetyDivider} />

          <TouchableOpacity 
            style={styles.safetyBtn}
            onPress={handleBlock}
          >
            <Icon name="ban-outline" size={20} color="#E94D6B" />
            <Text style={[styles.safetyBtnText, { color: "#E94D6B" }]}>
              Block User
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  // Avatar Section
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  editIconBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },
  editIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  petName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },

  // Personality
  personalityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  personalityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Owner
  ownerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F0F7",
    borderRadius: 16,
    padding: 16,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  ownerStatus: {
    fontSize: 14,
    color: "#666",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtnWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
  btnShadow: {
    borderRadius: 20,
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 20,
    gap: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
  },

  // Safety Actions
  safetyActions: {
    flexDirection: "row",
    backgroundColor: "#FFF8FB",
    borderRadius: 16,
    marginTop: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  safetyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  safetyBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  safetyDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E0E0E0",
  },
});

export default PetProfileScreen;

