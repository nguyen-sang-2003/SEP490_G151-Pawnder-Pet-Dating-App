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
import { changePassword } from "../../auth/api/authApi";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePassword">;

const ChangePasswordScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const validatePassword = () => {
    if (!currentPassword) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.enterCurrentPassword') });
      return false;
    }

    if (!newPassword) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.enterNewPassword') });
      return false;
    }

    // Kiểm tra độ dài tối thiểu 8 ký tự
    if (newPassword.length < 8) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.passwordMinLength') });
      return false;
    }

    // Kiểm tra độ dài tối đa 100 ký tự (đồng bộ với BE)
    if (newPassword.length > 100) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.passwordMaxLength') });
      return false;
    }

    // Kiểm tra có chứa chữ hoa (đồng bộ với BE)
    if (!/[A-Z]/.test(newPassword)) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.passwordNeedsUppercase') });
      return false;
    }

    // Kiểm tra có chứa chữ thường (đồng bộ với BE)
    if (!/[a-z]/.test(newPassword)) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.passwordNeedsLowercase') });
      return false;
    }

    // Kiểm tra có chứa số
    if (!/\d/.test(newPassword)) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.passwordNeedsNumber') });
      return false;
    }

    // Kiểm tra có ký tự đặc biệt
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.passwordNeedsSpecial') });
      return false;
    }

    if (newPassword === currentPassword) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.passwordSameAsCurrent') });
      return false;
    }

    if (newPassword !== confirmPassword) {
      showAlert({ type: 'warning', title: t('common.error'), message: t('settings.changePassword.errors.passwordMismatch') });
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);

    try {
      const response = await changePassword(currentPassword, newPassword);
      const message = response.Message || response.message || t('settings.changePassword.successMessage');
      
      showAlert({
        type: 'success',
        title: t('settings.changePassword.successTitle'),
        message: message,
        onClose: () => {
          // Quay về màn hình trước sau khi đổi mật khẩu thành công
          navigation.goBack();
        },
      });
    } catch (error: any) {
      const errorMessage = error.message || t('settings.changePassword.errors.changeFailed');
      showAlert({ type: 'error', title: t('common.error'), message: errorMessage });
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
          <Text style={styles.headerTitle}>{t('settings.changePassword.title')}</Text>
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
            {t('settings.changePassword.subtitle')}
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
              placeholder={t('settings.changePassword.currentPassword')}
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
              placeholder={t('settings.changePassword.newPassword')}
              placeholderTextColor={colors.textLabel}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
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
              placeholder={t('settings.changePassword.confirmPassword')}
              placeholderTextColor={colors.textLabel}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
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
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Icon
                name={showConfirm ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.textMedium}
              />
            </TouchableOpacity>
          </View>

          {/* Password Requirements - Only show when focused */}
          {isPasswordFocused && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>{t('settings.changePassword.requirements.title')}</Text>
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
                {t('settings.changePassword.requirements.minLength')}
              </Text>
            </View>

            {/* Chứa ít nhất 1 chữ hoa */}
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
                {t('settings.changePassword.requirements.hasUppercase')}
              </Text>
            </View>

            {/* Chứa ít nhất 1 chữ thường */}
            <View style={styles.requirement}>
              <Icon
                name={
                  /[a-z]/.test(newPassword)
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={16}
                color={
                  /[a-z]/.test(newPassword) ? colors.success : colors.textLabel
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  /[a-z]/.test(newPassword) && styles.requirementMet,
                ]}
              >
                {t('settings.changePassword.requirements.hasLowercase')}
              </Text>
            </View>

            {/* Chứa ít nhất 1 số */}
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
                {t('settings.changePassword.requirements.hasNumber')}
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
                {t('settings.changePassword.requirements.hasSpecial')}
              </Text>
            </View>

            {/* Khác mật khẩu hiện tại */}
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
                  newPassword && newPassword !== currentPassword
                    ? styles.requirementMet
                    : null,
                ]}
              >
                {t('settings.changePassword.requirements.differentFromCurrent')}
              </Text>
            </View>
          </View>
          )}

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
                <Text style={styles.changeText}>{t('settings.changePassword.changingButton')}</Text>
              ) : (
                <Text style={styles.changeText}>{t('settings.changePassword.changeButton')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotText}>{t('settings.changePassword.forgotPassword')}</Text>
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

