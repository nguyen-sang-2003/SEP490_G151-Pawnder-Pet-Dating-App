import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { sendOtp } from "../api/otpApi";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Vui lòng nhập email" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert({ type: 'warning', title: "Lỗi", message: "Vui lòng nhập email hợp lệ" });
      return;
    }

    setLoading(true);

    try {
      await sendOtp(email);

      showAlert({
        type: 'success',
        title: "Thành công",
        message: "Mã đặt lại mật khẩu đã được gửi đến email của bạn",
        onClose: () => navigation.navigate("ResetPassword", { email }),
      });
    } catch (error: any) {
      const errorMessage = error.message || "Không thể gửi mã. Vui lòng thử lại.";
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

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={gradients.auth.buttonSecondary}
              style={styles.iconGradient}
            >
              <Icon name="lock-closed-outline" size={48} color={colors.white} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Don't worry! Enter your email address and we'll send you a code to
            reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Icon
              name="mail-outline"
              size={20}
              color={colors.textMedium}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={colors.textLabel}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendOTP}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#CCC", "#AAA"] : gradients.auth.buttonPrimary}
              style={styles.sendGradient}
            >
              {loading ? (
                <Text style={styles.sendText}>Sending...</Text>
              ) : (
                <Text style={styles.sendText}>Send Reset Code</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Sign In */}
          <TouchableOpacity
            style={styles.backToSignIn}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Icon name="arrow-back-outline" size={16} color={colors.primary} />
            <Text style={styles.backToSignInText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
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
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    marginBottom: 24,
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
  sendButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 20,
  },
  sendGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  sendText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  backToSignIn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  backToSignInText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },
});

export default ForgotPasswordScreen;

