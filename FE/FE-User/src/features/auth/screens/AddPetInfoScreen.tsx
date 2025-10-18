import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddPetInfo">;

const AddPetInfoScreen = ({ navigation }: Props) => {
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [description, setDescription] = useState("");
  
  // Các thuộc tính từ database
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const handleContinue = () => {
    // Validate and save pet info
    if (!petName || !breed || !age || !gender) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    navigation.replace("Home");
  };

  const handleSkip = () => {
    navigation.replace("Home");
  };

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Your Cat 🐱</Text>
          <Text style={styles.subtitle}>
            Let others know about your lovely cat
          </Text>
        </View>

        {/* Cat Avatar Upload */}
        <TouchableOpacity style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.avatarGradient}
            >
              <Icon name="camera" size={40} color={colors.white} />
            </LinearGradient>
            <Text style={styles.avatarText}>Upload Cat Photo</Text>
          </View>
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          {/* Cat Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cat Name *</Text>
            <TextInput
              placeholder="Enter your cat's name"
              style={styles.input}
              placeholderTextColor={colors.textLabel}
              value={petName}
              onChangeText={setPetName}
            />
          </View>

          {/* Breed */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed *</Text>
            <TextInput
              placeholder="e.g., Persian, British Shorthair, Maine Coon"
              style={styles.input}
              placeholderTextColor={colors.textLabel}
              value={breed}
              onChangeText={setBreed}
            />
          </View>

          {/* Gender Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  gender === "male" && styles.genderBtnActive,
                ]}
                onPress={() => setGender("male")}
              >
                <Icon
                  name="male"
                  size={24}
                  color={gender === "male" ? colors.white : colors.male}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === "male" && styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  gender === "female" && styles.genderBtnActive,
                ]}
                onPress={() => setGender("female")}
              >
                <Icon
                  name="female"
                  size={24}
                  color={gender === "female" ? colors.white : colors.female}
                />
                <Text
                  style={[
                    styles.genderText,
                    gender === "female" && styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Age */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              placeholder="e.g., 2 years, 6 months"
              style={styles.input}
              placeholderTextColor={colors.textLabel}
              value={age}
              onChangeText={setAge}
            />
          </View>

          {/* Physical Attributes */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                placeholder="Height"
                style={styles.input}
                placeholderTextColor={colors.textLabel}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                placeholder="Weight"
                style={styles.input}
                placeholderTextColor={colors.textLabel}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Tell us about your cat's personality... (playful, calm, friendly, etc.)"
              style={[styles.input, styles.textArea]}
              placeholderTextColor={colors.textLabel}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.btnShadow}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={gradients.primary}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <Icon name="arrow-forward" size={20} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMedium,
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarPlaceholder: {
    alignItems: "center",
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.large,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },

  // Form
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
    ...shadows.small,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },

  // Gender
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.whiteWarm,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  genderBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  genderTextActive: {
    color: colors.white,
  },

  // Input Row
  inputRow: {
    flexDirection: "row",
    marginBottom: 20,
  },

  // Buttons
  btnShadow: {
    marginTop: 12,
    borderRadius: radius.lg,
    ...shadows.large,
  },
  button: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  skipBtn: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: colors.textMedium,
    textDecorationLine: "underline",
  },
});

export default AddPetInfoScreen;

