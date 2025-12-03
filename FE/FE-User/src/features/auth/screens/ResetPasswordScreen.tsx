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
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { verifyOtp, resetPassword } from "../api/otpApi";

type Props = NativeStackScreenProps<RootStackParamList, "ResetPassword">;

const ResetPasswordScreen = ({ navigation, route }: Props) => {
  const { t } = useTranslation();
  const { email } = route.params;
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleResetPassword = async () => {
    if (!otp.trim()) {
      showAlert({ type: 'warning', title: t('auth.resetPassword.error'), message: t('auth.resetPassword.enterOtp') });
      return;
    }

    if (!newPassword.trim()) {
      showAlert({ type: 'warning', title: t('auth.resetPassword.error'), message: t('auth.resetPassword.enterNewPassword') });
      return;
    }

    // Kiểm tra độ dài tối thiểu 8 ký tự
    if (newPassword.length < 8) {
      showAlert({ type: 'warning', title: t('auth.resetPassword.error'), message: t('auth.resetPassword.passwordMinLength') });
      return;
    }

    // Kiểm tra có chứa chữ hoa
    if (!/[A-Z]/.test(newPassword)) {
      showAlert({ type: 'error', title: t('auth.resetPassword.error'), message: t('auth.resetPassword.passwordNeedsUppercase') });
      return;
    }

    // Kiểm tra có chứa số
    if (!/\d/.test(newPassword)) {
      showAlert({ type: 'error', title: t('auth.resetPassword.error'), message: t('auth.resetPassword.passwordNeedsNumber') });
      return;
    }

    // Kiểm tra có ký tự đặc biệt
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      showAlert({ type: 'error', title: t('auth.resetPassword.error'), message: t('auth.resetPassword.passwordNeedsSpecial') });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({ type: 'warning', title: t('auth.resetPassword.error'), message: t('auth.resetPassword.passwordMismatch') });
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
        title: t('auth.resetPassword.success'),
        message: t('auth.resetPassword.resetSuccess'),
        onClose: () => navigation.navigate("SignIn"),
      });
    } catch (error: any) {
      const errorMessage = error.message || t('auth.resetPassword.resetFailed');
      showAlert({ type: 'error', title: t('auth.resetPassword.error'), message: errorMessage });
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
          <Text style={styles.title}>{t('auth.resetPassword.title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.resetPassword.subtitle', { email })}
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
              placeholder={t('auth.resetPassword.otpPlaceholder')}
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
              placeholder={t('auth.resetPassword.newPassword')}
              placeholderTextColor={colors.textLabel}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
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
              placeholder={t('auth.resetPassword.confirmPassword')}
              placeholderTextColor={colors.textLabel}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            {/* Show checkmark if passwords match, X if not match */}
            {confirmPassword && newPassword && (
              <Icon
                name={confirmPassword === newPassword ? "checkmark-circle" : "close-circle"}
                size={20}
                color={confirmPassword === newPassword ? "#4CAF50" : "#FF5252"}
                style={{ marginRight: 8 }}
              />
            )}
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

          {/* Password Requirements - Only show when focused or has input */}
          {(isPasswordFocused || newPassword.length > 0) && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>{t('auth.resetPassword.requirements.title')}</Text>
            
            {/* Ít nhất 8 ký tự */}
            <View style={styles.requirement}>
              <Icon
                name={
                  newPassword.length >= 8
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  newPassword.length >= 8 ? colors.success : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  newPassword.length >= 8 && styles.requirementMet,
                ]}
              >
                {t('auth.resetPassword.requirements.minLength')}
              </Text>
            </View>

            {/* Chứa chữ hoa */}
            <View style={styles.requirement}>
              <Icon
                name={
                  /[A-Z]/.test(newPassword)
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  /[A-Z]/.test(newPassword) ? colors.success : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  /[A-Z]/.test(newPassword) && styles.requirementMet,
                ]}
              >
                {t('auth.resetPassword.requirements.hasUppercase')}
              </Text>
            </View>

            {/* Chứa số */}
            <View style={styles.requirement}>
              <Icon
                name={
                  /\d/.test(newPassword)
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  /\d/.test(newPassword) ? colors.success : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  /\d/.test(newPassword) && styles.requirementMet,
                ]}
              >
                {t('auth.resetPassword.requirements.hasNumber')}
              </Text>
            </View>

            {/* Chứa ký tự đặc biệt */}
            <View style={styles.requirement}>
              <Icon
                name={
                  /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? colors.success : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) && styles.requirementMet,
                ]}
              >
                {t('auth.resetPassword.requirements.hasSpecial')}
              </Text>
            </View>
          </View>
          )}

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
                <Text style={styles.resetText}>{t('auth.resetPassword.resettingButton')}</Text>
              ) : (
                <Text style={styles.resetText}>{t('auth.resetPassword.resetButton')}</Text>
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

