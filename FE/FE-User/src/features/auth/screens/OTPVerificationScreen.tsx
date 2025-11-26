import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { sendOtp, verifyOtp, register, createAddressForUser, login } from "../../../api";
import { requestLocationAndGetCoordinates } from "../../../services/location.service";
import { setItem } from "../../../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "OTPVerification">;

const OTPVerificationScreen = ({ navigation, route }: Props) => {
  const { email, userData } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const [otpValidTimer, setOtpValidTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  // Resend timer (60s)
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // OTP validity timer (5 minutes)
  useEffect(() => {
    if (otpValidTimer > 0 && !isOtpExpired) {
      const interval = setInterval(() => {
        setOtpValidTimer((prev) => {
          if (prev <= 1) {
            setIsOtpExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpValidTimer, isOtpExpired]);

  // Show alert when OTP expires
  useEffect(() => {
    if (isOtpExpired) {
      showAlert({
        type: 'warning',
        title: 'OTP đã hết hạn ⏰',
        message: 'Mã OTP đã hết hiệu lực. Vui lòng nhấn "Gửi lại mã" để nhận mã mới.',
      });
    }
  }, [isOtpExpired]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      showAlert({
        type: 'warning',
        title: 'OTP chưa đầy đủ',
        message: 'Vui lòng nhập đủ 6 số 🔢',
      });
      return;
    }

    if (isOtpExpired) {
      showAlert({
        type: 'error',
        title: 'OTP đã hết hạn ⏰',
        message: 'Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới.',
      });
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify OTP with backend
      console.log('🔐 Verifying OTP...');
      await verifyOtp(email, otpCode);
      console.log('✅ OTP verified successfully');

      // Show OTP success message first
      showAlert({
        type: 'success',
        title: 'OTP đúng! ✅',
        message: 'Mã xác thực chính xác. Tiếp tục tạo tài khoản...',
        confirmText: 'Tiếp tục',
        onClose: async () => {
          // Step 2: Create account in database
          if (userData) {
            try {
              setLoading(true);
              console.log('OTP verified successfully. Creating account...');
              const registerResponse = await register(userData);
              const newUserId = registerResponse.userId || registerResponse.UserId;

              if (!newUserId) {
                throw new Error('Không thể lấy UserId từ response');
              }

              console.log('✅ Account created. UserId:', newUserId);

              // Save userId to AsyncStorage for later use
              await setItem('userId', newUserId.toString());
              console.log('💾 UserId saved to storage');

              // 🔐 AUTO-LOGIN: Get access and refresh tokens
              // This is critical because register API doesn't return tokens
              console.log('🔐 Auto-logging in to get access tokens...');
              try {
                await login(userData.Email, userData.Password);
                console.log('✅ Auto-login successful - tokens stored in Keychain');
              } catch (loginError: any) {
                console.error('⚠️ Auto-login failed:', loginError);
                // Don't block the flow - user can login manually later
                // But this means subsequent API calls might fail due to missing tokens
              }

              setLoading(false);

              // Step 3: Request location permission and get GPS
              showAlert({
                type: 'info',
                title: 'Cấp quyền vị trí 📍',
                message: 'Để tìm thú cưng gần bạn, vui lòng cho phép Pawnder truy cập vị trí của bạn.',
                confirmText: 'Đồng ý',
                onClose: () => {
                  // Request location in background
                  handleLocationSetup(newUserId);
                },
              });
            } catch (error: any) {
              setLoading(false);
              console.error('Registration error:', error);

              let errorTitle = 'Tạo tài khoản thất bại';
              let errorMessage = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';

              // Check if error is from registration
              if (error.message?.includes('Email') || error.message?.includes('đã tồn tại')) {
                errorTitle = 'Email đã được sử dụng';
                errorMessage = 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.';
              }

              showAlert({
                type: 'error',
                title: errorTitle,
                message: errorMessage,
              });
            }
          } else {
            // If no userData (e.g., forgot password flow), just navigate
            setLoading(false);
            showAlert({
              type: 'success',
              title: 'Xác thực thành công! ✅',
              message: 'Email đã được xác thực.',
              confirmText: 'Tiếp tục',
              onClose: () => navigation.replace("Home"),
            });
          }
        },
      });
    } catch (error: any) {
      console.error('OTP Verification error:', error);

      showAlert({
        type: 'error',
        title: 'Xác thực thất bại',
        message: error.message || 'Mã OTP không chính xác. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSetup = async (newUserId: number) => {
    try {
      setLoading(true);

      // Get GPS coordinates
      console.log('Requesting location permission...');
      const coordinates = await requestLocationAndGetCoordinates();

      if (!coordinates) {
        // User denied permission, skip and navigate
        console.warn('Location permission denied');
        showAlert({
          type: 'warning',
          title: 'Bỏ qua vị trí',
          message: 'Bạn có thể cập nhật vị trí sau trong cài đặt. Tiếp tục thêm thông tin thú cưng!',
          confirmText: 'Tiếp tục',
          onClose: () => navigation.replace("AddPetBasicInfo", { isFromProfile: false }),
        });
        return;
      }

      // Create address in database
      console.log('Creating address with coordinates:', coordinates);
      await createAddressForUser(newUserId, coordinates.latitude, coordinates.longitude);

      showAlert({
        type: 'success',
        title: 'Đăng ký hoàn tất! 🎉',
        message: 'Vị trí đã được lưu. Bây giờ hãy thêm thông tin thú cưng của bạn!',
        confirmText: 'Tiếp tục',
        onClose: () => navigation.replace("AddPetBasicInfo", { isFromProfile: false }),
      });
    } catch (error: any) {
      console.error('Location setup error:', error);

      // Show error but allow user to continue
      showAlert({
        type: 'warning',
        title: 'Không thể lưu vị trí',
        message: error.message + ' Bạn có thể cập nhật sau. Tiếp tục thêm thông tin thú cưng!',
        confirmText: 'Tiếp tục',
        onClose: () => navigation.replace("AddPetBasicInfo", { isFromProfile: false }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      console.log('📧 Resending OTP to:', email);
      await sendOtp(email);

      setResendTimer(60);
      setOtpValidTimer(300); // Reset to 5 minutes
      setCanResend(false);
      setIsOtpExpired(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      showAlert({
        type: 'success',
        title: 'Đã gửi lại! 📧',
        message: 'Mã OTP mới đã được gửi đến email của bạn.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Lỗi gửi OTP',
        message: error.message || 'Không thể gửi lại OTP. Vui lòng thử lại.',
      });
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
              <Icon name="mail-outline" size={48} color={colors.white} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>

          {/* OTP Validity Timer */}
          <View style={styles.validityContainer}>
            <Icon
              name="time-outline"
              size={16}
              color={isOtpExpired ? colors.error : otpValidTimer <= 60 ? colors.warning : colors.primary}
            />
            <Text style={[
              styles.validityText,
              isOtpExpired && styles.expiredText,
              otpValidTimer <= 60 && !isOtpExpired && styles.warningText,
            ]}>
              {isOtpExpired
                ? "Mã đã hết hạn! Vui lòng gửi lại"
                : `Mã có hiệu lực: ${Math.floor(otpValidTimer / 60)}:${String(otpValidTimer % 60).padStart(2, '0')}`}
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerify}
            disabled={loading}
          >
            <LinearGradient
              colors={gradients.auth.buttonPrimary}
              style={styles.verifyGradient}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.verifyText}>Verify Email</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={loading}>
                <Text style={styles.resendText}>
                  Không nhận được mã?{" "}
                  <Text style={styles.resendLink}>Gửi lại</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Gửi lại sau <Text style={styles.timerNumber}>{resendTimer}s</Text>
              </Text>
            )}
          </View>
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
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconContainer: {
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
    marginBottom: 16,
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: colors.primary,
  },
  validityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.cardBackgroundLight,
    borderRadius: radius.lg,
    marginBottom: 24,
  },
  validityText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  warningText: {
    color: colors.warning,
  },
  expiredText: {
    color: colors.error,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 40,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.whiteWarm,
    borderWidth: 2,
    borderColor: colors.cardBackgroundLight,
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
    textAlign: "center",
    ...shadows.small,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  verifyButton: {
    width: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 20,
  },
  verifyGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  verifyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  timerText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  timerNumber: {
    fontWeight: "600",
    color: colors.primary,
  },
});

export default OTPVerificationScreen;

