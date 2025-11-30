import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePassword">;

const ChangePasswordScreen = ({ navigation }: Props) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    if (!currentPassword) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Vui lòng nhập mật khẩu hiện tại" });
      return false;
    }

    if (!newPassword) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Vui lòng nhập mật khẩu mới" });
      return false;
    }

    if (newPassword.length < 6) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Mật khẩu phải có ít nhất 6 ký tự" });
      return false;
    }

    if (newPassword === currentPassword) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Mật khẩu mới phải khác mật khẩu hiện tại" });
      return false;
    }

    if (newPassword !== confirmPassword) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Mật khẩu không khớp" });
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);

    try {
      // TODO: API call to change password
      console.log("Changing password");

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      showAlert({
        type: 'success',
        title: "Thành công",
        message: "Đã thay đổi mật khẩu thành công!",
        onClose: () => navigation.goBack(),
      });
    } catch (error) {
      showAlert({ type: 'error', title: "Lỗi", message: "Không thể thay đổi mật khẩu. Vui lòng thử lại." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={gradients.primary}
              style={styles.iconGradient}
            >
              <Icon name="lock-closed-outline" size={40} color={colors.white} />
            </LinearGradient>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Đảm bảo mật khẩu mới của bạn mạnh và an toàn
          </Text>

          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Icon
              name="lock-closed-outline"
              size={20}
              color={colors.textMedium}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu hiện tại"
              placeholderTextColor={colors.textLabel}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Icon
                name={showCurrent ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.textMedium}
              />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Icon
              name="key-outline"
              size={20}
              color={colors.textMedium}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới"
              placeholderTextColor={colors.textLabel}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Icon
                name={showNew ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.textMedium}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Icon
              name="checkmark-circle-outline"
              size={20}
              color={colors.textMedium}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu mới"
              placeholderTextColor={colors.textLabel}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Icon
                name={showConfirm ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.textMedium}
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
            <View style={styles.requirement}>
              <Icon
                name={
                  newPassword.length >= 6
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  newPassword.length >= 6 ? colors.success : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  newPassword.length >= 6 && styles.requirementMet,
                ]}
              >
                Ít nhất 6 ký tự
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={
                  newPassword && newPassword !== currentPassword
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  newPassword && newPassword !== currentPassword
                    ? colors.success
                    : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  (newPassword && newPassword !== currentPassword) ? styles.requirementMet : null,
                ]}
              >
                Khác với mật khẩu hiện tại
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={
                  newPassword && confirmPassword && newPassword === confirmPassword
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  newPassword && confirmPassword && newPassword === confirmPassword
                    ? colors.success
                    : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  (newPassword && confirmPassword && newPassword === confirmPassword) ? styles.requirementMet : null,
                ]}
              >
                Mật khẩu khớp
              </Text>
            </View>
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            style={styles.changeButton}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#CCC", "#AAA"] : gradients.primary}
              style={styles.changeGradient}
            >
              {loading ? (
                <Text style={styles.changeText}>Đang thay đổi...</Text>
              ) : (
                <Text style={styles.changeText}>Đổi mật khẩu</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotText}>Quên mật khẩu hiện tại?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  iconContainer: {
    alignSelf: "center",
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.medium,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...shadows.small,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.textDark,
  },
  requirementsContainer: {
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 12,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  requirementMet: {
    color: colors.success,
    fontWeight: "500",
  },
  changeButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 16,
  },
  changeGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  changeText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  forgotLink: {
    alignItems: "center",
    paddingVertical: 10,
  },
  forgotText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
});

export default ChangePasswordScreen;

