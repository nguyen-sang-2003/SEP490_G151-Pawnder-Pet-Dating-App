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
import { verifyOtp, resetPassword } from "../api/otpApi";

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">;

const ResetPasswordScreen = ({ navigation, route }: Props) => {
  const { email } = route.params;
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!otp.trim()) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Vui lòng nhập mã OTP" });
      return;
    }

    if (!newPassword.trim()) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Vui lòng nhập mật khẩu mới" });
      return;
    }

    if (newPassword.length < 6) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Mật khẩu phải có ít nhất 6 ký tự" });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Mật khẩu không khớp" });
      return;
    }

    setLoading(true);

    try {
      // Verify OTP first
      await verifyOtp(email, otp);

      // Reset password after OTP verification
      await resetPassword(email, newPassword);

      showAlert({
        type: 'success',
        title: "Thành công",
        message: "Đã đặt lại mật khẩu thành công!",
        onClose: () => navigation.navigate("SignIn"),
      });
    } catch (error: any) {
      const errorMessage = error.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
      showAlert({ type: 'error', title: "Lỗi", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradients.auth.forgot}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={gradients.auth.buttonSecondary}
              style={styles.iconGradient}
            >
              <Icon name="key-outline" size={48} color={colors.white} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Đặt lại mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập mã đã gửi đến{" "}
            <Text style={styles.email}>{email}</Text> và tạo mật khẩu mới
          </Text>

          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="mail-outline"
              size={20}
              color={colors.textMedium}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập mã OTP"
              placeholderTextColor={colors.textLabel}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="lock-closed-outline"
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
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Icon
                name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.textMedium}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="lock-closed-outline"
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
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.textMedium}
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Mật khẩu phải:</Text>
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
                Có ít nhất 6 ký tự
              </Text>
            </View>
            <View style={styles.requirement}>
              <Icon
                name={
                  newPassword && newPassword === confirmPassword
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  newPassword && newPassword === confirmPassword
                    ? colors.success
                    : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  newPassword && newPassword === confirmPassword ? styles.requirementMet : null,
                ]}
              >
                Khớp với mật khẩu xác nhận
              </Text>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#CCC", "#AAA"] : gradients.auth.buttonPrimary}
              style={styles.resetGradient}
            >
              {loading ? (
                <Text style={styles.resetText}>Đang đặt lại...</Text>
              ) : (
                <Text style={styles.resetText}>Đặt lại mật khẩu</Text>
              )}
            </LinearGradient>
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
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 80,
  },
  iconContainer: {
    alignSelf: "center",
    marginBottom: 30,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.large,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: colors.primary,
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
  resetButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  resetGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  resetText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});

export default ResetPasswordScreen;

