import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { getPetById, updatePet, getUserById, getAddressById } from "../../../api";
import { colors } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "EditPet">;

const EditPetScreen = ({ navigation, route }: Props) => {
  const petIdStr = route.params?.petId || "0";
  const petId = parseInt(petIdStr, 10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [description, setDescription] = useState("");
  
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");

  // Load pet data
  useEffect(() => {
    const loadPetData = async () => {
      try {
        setLoading(true);
        
        if (!petId) {
          Alert.alert('Error', 'Pet ID not found');
          navigation.goBack();
          return;
        }
        
        console.log('📱 Loading pet data for petId:', petId);
        
        // Fetch pet data
        const petData = await getPetById(petId);
        console.log('✅ Pet data loaded:', petData);
        
        // Fill form
        setName(petData.Name || petData.name || '');
        setBreed(petData.Breed || petData.breed || '');
        setAge(petData.Age?.toString() || petData.age?.toString() || '');
        setGender(petData.Gender || petData.gender || 'Male');
        setDescription(petData.Description || petData.description || '');
        
        // Load owner's address - giống EditUserProfile
        const userId = petData.UserId || petData.userId;
        console.log('👤 Pet UserId:', userId);
        
        if (userId) {
          try {
            const userData = await getUserById(userId);
            console.log('✅ User data loaded:', userData);
            
            const addressId = userData.AddressId || userData.addressId;
            console.log('🔍 User addressId:', addressId);
            
            if (addressId) {
              const address = await getAddressById(addressId);
              console.log('📍 Address loaded:', address);
              setCity(address?.City || address?.city || '');
              setDistrict(address?.District || address?.district || '');
              setWard(address?.Ward || address?.ward || '');
            }
          } catch (error) {
            console.log('⚠️ No address found for user');
          }
        }
        
      } catch (error: any) {
        console.error('❌ Error loading pet data:', error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to load pet data');
      } finally {
        setLoading(false);
      }
    };
    
    loadPetData();
  }, [petId]);

  const handleSave = async () => {
    if (!petId) {
      Alert.alert('Error', 'Pet ID not found');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Pet name is required');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving pet data...');
      
      await updatePet(petId, {
        Name: name.trim(),
        Breed: breed.trim() || undefined,
        Gender: gender,
        Age: age ? parseInt(age, 10) : undefined,
        Description: description.trim() || undefined,
        IsActive: true,
      });
      
      console.log('✅ Pet updated successfully');
      Alert.alert("Success", "Pet profile updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('❌ Error saving pet data:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save pet profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Photo", "Feature coming soon!");
  };

  // Show loading spinner
  if (loading) {
    return (
      <LinearGradient
        colors={["#FFF5F9", "#FDE8EF"]}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textMedium }}>Loading...</Text>
      </LinearGradient>
    );
  }

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
          <Text style={styles.headerTitle}>Edit Pet Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#C8A8D4", "#E8D5EE"]}
              style={styles.avatarGradient}
            >
              <Image
                source={require("../../../assets/cat_avatar.png")}
                style={styles.avatar}
              />
            </LinearGradient>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={handleChangePhoto}
            >
              <LinearGradient
                colors={["#FF6EA7", "#FF9BC0"]}
                style={styles.editIconGradient}
              >
                <Icon name="camera" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>Change pet photo</Text>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pet Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter pet name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              value={breed}
              onChangeText={setBreed}
              placeholder="Enter breed"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (years)</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter age in years"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "Male" && styles.genderButtonActive,
                ]}
                onPress={() => setGender("Male")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "Male" && styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "Female" && styles.genderButtonActive,
                ]}
                onPress={() => setGender("Female")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "Female" && styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your pet"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Owner's Location (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Owner's Location</Text>
            
            <View style={styles.readOnlyField}>
              <Icon name="location-outline" size={16} color="#666" />
              <Text style={styles.readOnlyText}>
                {[ward, district, city].filter(Boolean).join(', ') || 'No location set'}
              </Text>
            </View>
          </View>

          {/* Note about location */}
          <View style={styles.noteCard}>
            <Icon name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.noteText}>
              Pet location is inherited from your account. Update your location in your profile settings.
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.btnShadow}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={saving ? ["#CCC", "#DDD"] : ["#FF6EA7", "#FF9BC0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </>
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
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
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  editIconBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
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
  changePhotoText: {
    fontSize: 14,
    color: "#C8A8D4",
    fontWeight: "600",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },

  // Input
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#333",
    shadowColor: "#C8A8D4",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  // Gender
  genderContainer: {
    flexDirection: "row",
    gap: 10,
  },
  genderButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  genderButtonActive: {
    borderColor: "#C8A8D4",
    backgroundColor: "#F5F0F7",
  },
  genderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  genderTextActive: {
    color: "#C8A8D4",
  },

  // Button
  btnShadow: {
    borderRadius: 26,
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 26,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  
  // Read-only field
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 10,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
    color: "#666",
  },
  
  // Note
  noteCard: {
    flexDirection: "row",
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D0E8FF",
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
});

export default EditPetScreen;

