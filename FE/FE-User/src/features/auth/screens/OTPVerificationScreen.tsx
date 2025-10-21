import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "OTPVerification">;

const OTPVerificationScreen = ({ navigation, route }: Props) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

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
      Alert.alert("Error", "Please enter complete OTP code");
      return;
    }

    // TODO: API call to verify OTP
    console.log("Verifying OTP:", otpCode, "for email:", email);
    
    // Mock success - Navigate to add pet after email verification
    Alert.alert("Success", "Email verified successfully!", [
      { text: "OK", onPress: () => navigation.replace("AddPetPhotos", { isFromProfile: false }) }
    ]);
  };

  const handleResend = async () => {
    if (!canResend) return;

    // TODO: API call to resend OTP
    console.log("Resending OTP to:", email);
    
    setTimer(60);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    
    Alert.alert("Success", "OTP code has been resent to your email");
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
              colors={gradients.primary}
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
          >
            <LinearGradient
              colors={gradients.primary}
              style={styles.verifyGradient}
            >
              <Text style={styles.verifyText}>Verify Email</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendText}>
                  Didn't receive code?{" "}
                  <Text style={styles.resendLink}>Resend</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerNumber}>{timer}s</Text>
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: 40,
    lineHeight: 22,
  },
  email: {
    fontWeight: "600",
    color: colors.primary,
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

