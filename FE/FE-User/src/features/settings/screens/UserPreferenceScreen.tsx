import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "UserPreference">;

interface RangePreference {
  min: number;
  max: number;
}

const UserPreferenceScreen = ({ navigation }: Props) => {
  // Preferences State
  const [showMe, setShowMe] = useState<"all" | "male" | "female">("all");
  const [ageRange, setAgeRange] = useState<RangePreference>({ min: 1, max: 10 });
  const [maxDistance, setMaxDistance] = useState(25);
  const [personality, setPersonality] = useState<string[]>(["playful", "gentle"]);
  const [breeds, setBreeds] = useState<string[]>([]);
  const [onlyPremium, setOnlyPremium] = useState(false);
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(true);
  const [onlyVaccinated, setOnlyVaccinated] = useState(false);

  const DISTANCES = [5, 10, 15, 25, 50, 100];
  const PERSONALITIES = [
    "Playful",
    "Gentle",
    "Energetic",
    "Calm",
    "Friendly",
    "Shy",
    "Curious",
    "Lazy",
  ];
  const CAT_BREEDS = [
    "Persian",
    "British Shorthair",
    "Maine Coon",
    "Siamese",
    "Bengal",
    "Scottish Fold",
    "Ragdoll",
    "Munchkin",
  ];

  const togglePersonality = (trait: string) => {
    setPersonality(prev =>
      prev.includes(trait.toLowerCase())
        ? prev.filter(t => t !== trait.toLowerCase())
        : [...prev, trait.toLowerCase()]
    );
  };

  const toggleBreed = (breed: string) => {
    setBreeds(prev =>
      prev.includes(breed)
        ? prev.filter(b => b !== breed)
        : [...prev, breed]
    );
  };

  const handleSave = () => {
    // TODO: Save preferences to API
    // POST /user-preference/{userId}/{attributeId}
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.background}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discovery Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Show Me - Cat Gender */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking for</Text>
            <View style={styles.optionsRow}>
              {[
                { value: "all", label: "All Cats", icon: "paw" },
                { value: "male", label: "Male", icon: "male" },
                { value: "female", label: "Female", icon: "female" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.genderOption}
                  onPress={() => setShowMe(option.value as any)}
                >
                  {showMe === option.value ? (
                    <LinearGradient
                      colors={gradients.primary}
                      style={styles.genderOptionGradient}
                    >
                      <Icon
                        name={option.icon}
                        size={24}
                        color={colors.white}
                      />
                      <Text style={styles.genderTextActive}>
                        {option.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <>
                      <Icon
                        name={`${option.icon}-outline`}
                        size={24}
                        color={colors.textMedium}
                      />
                      <Text style={styles.genderText}>
                        {option.label}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Age Range */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Age Range</Text>
              <Text style={styles.sectionValue}>
                {ageRange.min} - {ageRange.max} years
              </Text>
            </View>
            <View style={styles.rangeControls}>
              <View style={styles.rangeControl}>
                <Text style={styles.rangeLabel}>Min</Text>
                <View style={styles.rangeButtons}>
                  <TouchableOpacity
                    style={styles.rangeButton}
                    onPress={() =>
                      setAgeRange(prev => ({
                        ...prev,
                        min: Math.max(0, prev.min - 1),
                      }))
                    }
                  >
                    <Icon name="remove" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.rangeValue}>{ageRange.min}</Text>
                  <TouchableOpacity
                    style={styles.rangeButton}
                    onPress={() =>
                      setAgeRange(prev => ({
                        ...prev,
                        min: Math.min(prev.max - 1, prev.min + 1),
                      }))
                    }
                  >
                    <Icon name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.rangeControl}>
                <Text style={styles.rangeLabel}>Max</Text>
                <View style={styles.rangeButtons}>
                  <TouchableOpacity
                    style={styles.rangeButton}
                    onPress={() =>
                      setAgeRange(prev => ({
                        ...prev,
                        max: Math.max(prev.min + 1, prev.max - 1),
                      }))
                    }
                  >
                    <Icon name="remove" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.rangeValue}>{ageRange.max}</Text>
                  <TouchableOpacity
                    style={styles.rangeButton}
                    onPress={() =>
                      setAgeRange(prev => ({
                        ...prev,
                        max: Math.min(20, prev.max + 1),
                      }))
                    }
                  >
                    <Icon name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Maximum Distance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Maximum Distance</Text>
              <Text style={styles.sectionValue}>{maxDistance} km</Text>
            </View>
            <View style={styles.distanceOptions}>
              {DISTANCES.map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceChip,
                    maxDistance === distance && styles.distanceChipActive,
                  ]}
                  onPress={() => setMaxDistance(distance)}
                >
                  <Text
                    style={[
                      styles.distanceText,
                      maxDistance === distance && styles.distanceTextActive,
                    ]}
                  >
                    {distance} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cat Breeds */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Breeds</Text>
            <Text style={styles.sectionSubtitle}>
              Select cat breeds you're interested in (leave empty for all)
            </Text>
            <View style={styles.personalityTags}>
              {CAT_BREEDS.map((breed) => (
                <TouchableOpacity
                  key={breed}
                  style={[
                    styles.personalityTag,
                    breeds.includes(breed) && styles.personalityTagActive,
                  ]}
                  onPress={() => toggleBreed(breed)}
                >
                  <Text
                    style={[
                      styles.personalityTagText,
                      breeds.includes(breed) && styles.personalityTagTextActive,
                    ]}
                  >
                    {breed}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cat Personality */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Personality</Text>
            <Text style={styles.sectionSubtitle}>
              Select the traits you'd like in your cat match
            </Text>
            <View style={styles.personalityTags}>
              {PERSONALITIES.map((trait) => (
                <TouchableOpacity
                  key={trait}
                  style={[
                    styles.personalityTag,
                    personality.includes(trait.toLowerCase()) &&
                      styles.personalityTagActive,
                  ]}
                  onPress={() => togglePersonality(trait)}
                >
                  <Text
                    style={[
                      styles.personalityTagText,
                      personality.includes(trait.toLowerCase()) &&
                        styles.personalityTagTextActive,
                    ]}
                  >
                    {trait}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Filters</Text>
            
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Icon name="star-outline" size={24} color="#FFD700" />
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchTitle}>Premium Members Only</Text>
                  <Text style={styles.switchSubtitle}>
                    Show only VIP cat owners
                  </Text>
                </View>
              </View>
              <Switch
                value={onlyPremium}
                onValueChange={setOnlyPremium}
                trackColor={{ false: "#D1D1D1", true: "#FFE4B5" }}
                thumbColor={onlyPremium ? "#FFD700" : "#f4f3f4"}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Icon name="image-outline" size={24} color={colors.primary} />
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchTitle}>With Photos Only</Text>
                  <Text style={styles.switchSubtitle}>
                    Show cats with profile photos
                  </Text>
                </View>
              </View>
              <Switch
                value={onlyWithPhotos}
                onValueChange={setOnlyWithPhotos}
                trackColor={{ false: "#D1D1D1", true: colors.primaryLight }}
                thumbColor={onlyWithPhotos ? colors.primary : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save Button - Fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.saveGradient}
            >
              <Icon name="checkmark-circle" size={24} color={colors.white} />
              <Text style={styles.saveText}>Save Preferences</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 12,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },

  // Gender Options
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    gap: 8,
    minHeight: 90,
    justifyContent: "center",
    ...shadows.small,
  },
  genderOptionGradient: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  genderTextActive: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },

  // Range Controls
  rangeControls: {
    flexDirection: "row",
    gap: 16,
  },
  rangeControl: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 8,
  },
  rangeButtons: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    padding: 8,
    justifyContent: "space-between",
    ...shadows.small,
  },
  rangeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryPastel,
    justifyContent: "center",
    alignItems: "center",
  },
  rangeValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
  },

  // Distance Options
  distanceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  distanceChip: {
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  distanceChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPastel,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  distanceTextActive: {
    color: colors.primary,
  },

  // Personality Tags
  personalityTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  personalityTag: {
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  personalityTagActive: {
    borderColor: colors.purple,
    backgroundColor: colors.purplePastel,
  },
  personalityTagText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  personalityTagTextActive: {
    color: colors.purple,
  },

  // Switch Row
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 12,
    ...shadows.small,
  },
  switchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  switchSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: "transparent",
  },
  saveButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.button,
  },
  saveGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});

export default UserPreferenceScreen;
