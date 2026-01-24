import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { getUserById, updateUser, getAddressById, createAddressForUser, updateAddress } from "../../../api";
import { getItem } from "../../../services/storage";
import { colors } from "../../../theme";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { requestLocationAndGetCoordinates } from "../../../services/location.service";
import { formatFullAddress } from "../../../utils/addressFormatter";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

const EditUserProfileScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [addressId, setAddressId] = useState<number | undefined>(undefined);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [city, setCity] = useState(""); // Read-only, for display from GPS
  const [district, setDistrict] = useState(""); // Read-only, for display from GPS
  const [ward, setWard] = useState(""); // Read-only, for display from GPS
  const [gettingLocation, setGettingLocation] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

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
          showAlert({ type: 'error', title: t('common.error'), message: t('profile.userNotFound'), onClose: () => navigation.goBack() });
          return;
        }

        setUserId(uid);

        const userData = await getUserById(uid);

        // Fill form
        setName(userData.FullName || userData.fullName || '');
        setEmail(userData.Email || userData.email || '');
        setGender(userData.Gender || userData.gender || 'Male');

        // Load address data
        const addrId = userData.AddressId || userData.addressId;
        if (addrId) {
          try {
            const address = await getAddressById(addrId);
            setAddressId(addrId);
            setCity(address?.City || address?.city || '');
            setDistrict(address?.District || address?.district || '');
            setWard(address?.Ward || address?.ward || '');
          } catch (error) {
            // Address not found
          }
        }

      } catch (error: any) {

        showAlert({ type: 'error', title: t('common.error'), message: error.response?.data?.message || t('profile.loadError') });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [route.params?.userId, t]);

  const handleSave = async () => {
    if (!userId) {
      showAlert({ type: 'error', title: t('common.error'), message: t('profile.userNotFound') });
      return;
    }

    // Validation: Kiểm tra tên trống
    if (!name.trim()) {
      showAlert({ type: 'warning', title: 'Thiếu thông tin', message: 'Bạn chưa nhập tên' });
      return;
    }

    // Validation: Kiểm tra độ dài tên
    if (name.trim().length < 2) {
      showAlert({ type: 'error', title: 'Tên quá ngắn', message: 'Vui lòng nhập dài hơn' });
      return;
    }

    if (name.trim().length > 50) {
      showAlert({ type: 'error', title: 'Tên quá dài', message: 'Vui lòng nhập ngắn hơn' });
      return;
    }

    try {
      setSaving(true);

      await updateUser(userId, {
        RoleId: 2,
        FullName: name.trim(),
        Gender: gender,
        NewPassword: undefined,
      });
      showAlert({ type: 'success', title: t('common.success'), message: t('profile.edit.saveSuccess'), onClose: () => navigation.goBack() });
    } catch (error: any) {

      showAlert({ type: 'error', title: t('common.error'), message: error.response?.data?.message || t('profile.edit.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleGetGPSLocation = async () => {
    if (gettingLocation) return;

    try {
      setGettingLocation(true);
      const coordinates = await requestLocationAndGetCoordinates();

      if (!coordinates) {
        showAlert({
          type: 'warning',
          title: t('common.error'),
          message: t('profile.edit.locationDenied'),
        });
        return;
      }

      if (userId) {
        if (addressId) {
          await updateAddress(addressId, coordinates.latitude, coordinates.longitude);
        } else {
          await createAddressForUser(userId, coordinates.latitude, coordinates.longitude);
        }

        const user = await getUserById(userId);
        const addrId = user.AddressId || user.addressId;

        if (addrId) {
          const address = await getAddressById(addrId);
          setAddressId(addrId);
          setCity(address?.City || address?.city || '');
          setDistrict(address?.District || address?.district || '');
          setWard(address?.Ward || address?.ward || '');
        }

        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('profile.edit.locationSuccess'),
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('profile.edit.locationError'),
      });
    } finally {
      setGettingLocation(false);
    }
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
        <Text style={{ marginTop: 16, color: colors.textMedium }}>{t('common.loading')}</Text>
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
          <Text style={styles.headerTitle}>{t('profile.edit.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.edit.personalInfo')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.edit.fullName')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('profile.edit.fullNamePlaceholder')}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.edit.email')}</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              placeholder={t('profile.edit.emailPlaceholder')}
              placeholderTextColor="#999"
              keyboardType="email-address"
              editable={false}
            />
            <Text style={styles.helperText}>{t('profile.edit.emailCannotChange')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.edit.gender')}</Text>
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
                  {t('profile.edit.male')}
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
                  {t('profile.edit.female')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location - GPS Only */}
          <Text style={styles.sectionTitle}>{t('profile.edit.location')}</Text>

          <View style={styles.gpsInfoBox}>
            <Icon name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.gpsInfoText}>
              {t('profile.edit.gpsInfo')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.gpsButton}
            onPress={handleGetGPSLocation}
            disabled={gettingLocation}
          >
            <LinearGradient
              colors={gettingLocation ? ["#CCC", "#DDD"] : ["#FF6EA7", "#FF9BC0"]}
              style={styles.gpsButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {gettingLocation ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.gpsButtonText}>{t('profile.edit.gettingLocation')}</Text>
                </>
              ) : (
                <>
                  <Icon name="navigate" size={20} color="#fff" />
                  <Text style={styles.gpsButtonText}>{t('profile.edit.getGpsLocation')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Show current location */}
          {(city || district || ward) && (
            <View style={styles.currentLocationBox}>
              <Icon name="location" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.currentLocationLabel}>{t('profile.edit.currentLocation')}</Text>
                <Text style={styles.currentLocationText}>
                  {formatFullAddress(ward, district, city) || t('profile.edit.noCurrentLocation')}
                </Text>
              </View>
            </View>
          )}
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
                <Text style={styles.saveButtonText}>{t('profile.edit.saving')}</Text>
              </>
            ) : (
              <Text style={styles.saveButtonText}>{t('profile.edit.saveChanges')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          onClose={hideAlert}
          onConfirm={alertConfig.onConfirm}
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel}
        />
      )}
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

  // GPS Mode
  gpsInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  gpsInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  gpsButton: {
    marginBottom: 16,
  },
  gpsButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gpsButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  currentLocationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FFE8F0",
  },
  currentLocationLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  currentLocationText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
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

