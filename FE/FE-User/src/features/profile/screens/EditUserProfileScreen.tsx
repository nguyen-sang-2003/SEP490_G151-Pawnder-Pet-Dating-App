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
import { getUserById, updateUser, getAddressById, updateAddressManual } from "../../../api";
import { getItem } from "../../../utils/storage";
import { colors } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

const EditUserProfileScreen = ({ navigation, route }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [addressId, setAddressId] = useState<number | undefined>(undefined);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Get userId from route params or storage
        let uid = route.params?.userId;
        if (!uid) {
          const userIdStr = await getItem('userId');
          uid = userIdStr ? parseInt(userIdStr, 10) : undefined;
        }
        
        if (!uid) {
          Alert.alert('Error', 'User not found');
          navigation.goBack();
          return;
        }
        
        setUserId(uid);
        console.log('📱 Loading user data for userId:', uid);
        
        // Fetch user data
        const userData = await getUserById(uid);
        console.log('✅ User data loaded:', userData);
        
        // Fill form
        setName(userData.FullName || userData.fullName || '');
        setEmail(userData.Email || userData.email || '');
        setGender(userData.Gender || userData.gender || 'Male');
        
        // Load address data
        const addrId = userData.AddressId || userData.addressId;
        if (addrId) {
          try {
            const address = await getAddressById(addrId);
            console.log('📍 Address loaded in Edit Profile:', address);
            setAddressId(addrId);
            setCity(address?.City || address?.city || '');
            setDistrict(address?.District || address?.district || '');
            setWard(address?.Ward || address?.ward || '');
          } catch (error) {
            console.log('⚠️ No address found');
          }
        }
        
      } catch (error: any) {
        console.error('❌ Error loading user data:', error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [route.params?.userId]);

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving user data...');
      
      await updateUser(userId, {
        RoleId: 2,
        FullName: name.trim(),
        Gender: gender,
        AddressId: undefined,
        NewPassword: undefined,
      });
      
      // Update address if addressId exists
      if (addressId && (city.trim() || district.trim() || ward.trim())) {
        console.log('💾 Updating address...');
        await updateAddressManual(addressId, city.trim(), district.trim(), ward.trim());
      }
      
      console.log('✅ User updated successfully');
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('❌ Error saving user data:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChangeAvatar = () => {
    // Image picker logic
    Alert.alert("Change Avatar", "Feature coming soon!");
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#FF6EA7", "#FFC2D6"]}
              style={styles.avatarGradient}
            >
              <Image
                source={require("../../../assets/cat_avatar_signin.png")}
                style={styles.avatar}
              />
            </LinearGradient>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={handleChangeAvatar}
            >
              <LinearGradient
                colors={["#FF6EA7", "#FF9BC0"]}
                style={styles.editIconGradient}
              >
                <Icon name="camera" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>Change profile photo</Text>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              editable={false}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
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
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === "Other" && styles.genderButtonActive,
                ]}
                onPress={() => setGender("Other")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "Other" && styles.genderTextActive,
                  ]}
                >
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Enter city"
              placeholderTextColor="#999"
            />
          </View>

          {/* District */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>District</Text>
            <TextInput
              style={styles.input}
              value={district}
              onChangeText={setDistrict}
              placeholder="Enter district"
              placeholderTextColor="#999"
            />
          </View>

          {/* Ward */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ward</Text>
            <TextInput
              style={styles.input}
              value={ward}
              onChangeText={setWard}
              placeholder="Enter ward"
              placeholderTextColor="#999"
            />
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
    shadowColor: "#FF6EA7",
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
    color: "#FF6EA7",
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
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#999",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
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
    borderColor: "#FF6EA7",
    backgroundColor: "#FFF0F5",
  },
  genderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  genderTextActive: {
    color: "#FF6EA7",
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
});

export default EditUserProfileScreen;

