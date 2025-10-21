import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddPetDetails">;

const AddPetDetailsScreen = ({ navigation, route }: Props) => {
  const photos = route.params?.photos || [];
  const isFromProfile = route.params?.isFromProfile || false;
  
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [description, setDescription] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const backDestination = isFromProfile ? "Profile" : "Home";

  const handleSave = () => {
    // Validate required fields
    if (!petName || !breed || !age || !gender) {
      Alert.alert("Missing Information", "Please fill in all required fields (*)");
      return;
    }

    // TODO: Save pet data to backend
    console.log({
      petName,
      breed,
      age,
      gender,
      height,
      weight,
      description,
      photos,
    });

    Alert.alert(
      "Success! 🎉",
      "Your cat profile has been created successfully!",
      [
        {
          text: "OK",
          onPress: () => {
            if (isFromProfile) {
              navigation.navigate(backDestination);
            } else {
              navigation.replace(backDestination);
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.stepText}>Step 2 of 2</Text>
          <Text style={styles.title}>Cat Details 🐱</Text>
          <Text style={styles.subtitle}>
            Tell us about your cat
          </Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos Preview */}
        {photos.length > 0 && (
          <View style={styles.photosPreview}>
            <View style={styles.photosPreviewHeader}>
              <Icon name="images" size={20} color={colors.primary} />
              <Text style={styles.photosPreviewTitle}>
                {photos.length} photo{photos.length > 1 ? 's' : ''} added
              </Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosPreviewScroll}
            >
              {photos.map((uri: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.photoPreviewItem}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Cat Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cat Name *</Text>
            <View style={styles.inputContainer}>
              <Icon name="paw" size={20} color={colors.textMedium} style={styles.inputIcon} />
              <TextInput
                placeholder="Enter your cat's name"
                style={styles.input}
                placeholderTextColor={colors.textLabel}
                value={petName}
                onChangeText={setPetName}
              />
            </View>
          </View>

          {/* Breed */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed *</Text>
            <View style={styles.inputContainer}>
              <Icon name="ribbon" size={20} color={colors.textMedium} style={styles.inputIcon} />
              <TextInput
                placeholder="e.g., Persian, British Shorthair"
                style={styles.input}
                placeholderTextColor={colors.textLabel}
                value={breed}
                onChangeText={setBreed}
              />
            </View>
          </View>

          {/* Gender Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[
                  styles.genderBtn,
                  gender === "male" && styles.genderBtnActiveMale,
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
                  gender === "female" && styles.genderBtnActiveFemale,
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
            <View style={styles.inputContainer}>
              <Icon name="calendar" size={20} color={colors.textMedium} style={styles.inputIcon} />
              <TextInput
                placeholder="e.g., 2 years, 6 months"
                style={styles.input}
                placeholderTextColor={colors.textLabel}
                value={age}
                onChangeText={setAge}
              />
            </View>
          </View>

          {/* Physical Attributes */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <View style={styles.inputContainer}>
                <Icon name="resize" size={20} color={colors.textMedium} style={styles.inputIcon} />
                <TextInput
                  placeholder="Height"
                  style={styles.input}
                  placeholderTextColor={colors.textLabel}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <View style={styles.inputContainer}>
                <Icon name="scale" size={20} color={colors.textMedium} style={styles.inputIcon} />
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
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputContainer}>
              <Icon name="chatbox-ellipses" size={20} color={colors.textMedium} style={styles.inputIconTop} />
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
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.btnShadow, { flex: 1 }]}
          onPress={handleSave}
        >
          <LinearGradient
            colors={gradients.primary}
            style={styles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="checkmark-circle" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Save Cat Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...shadows.small,
  },
  headerTextContainer: {},
  stepText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMedium,
  },

  // Photos Preview
  photosPreview: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
  },
  photosPreviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  photosPreviewTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  photosPreviewScroll: {
    gap: 12,
  },
  photoPreviewItem: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.cardBackground,
  },

  // Form
  form: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    ...shadows.small,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconTop: {
    marginRight: 12,
    alignSelf: "flex-start",
    marginTop: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
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
    paddingVertical: 16,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  genderBtnActiveMale: {
    backgroundColor: colors.male,
    borderColor: colors.male,
  },
  genderBtnActiveFemale: {
    backgroundColor: colors.female,
    borderColor: colors.female,
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
  },

  // Bottom Button
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: colors.whiteWarm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.large,
  },
  btnShadow: {
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
});

export default AddPetDetailsScreen;

