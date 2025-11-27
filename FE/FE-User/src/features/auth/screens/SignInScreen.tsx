import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import * as Animatable from "react-native-animatable";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import HeartsBackground from "../components/HeartsBackground";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { login } from "../../../api";
import { setItem } from "../../../utils/storage";
import { gradients } from "../../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "SignIn">;

const SignInScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const buttonRef = useRef<Animatable.View & View>(null);

  const handlePressIn = () => {
    buttonRef.current?.animate(
      {
        0: { transform: [{ scale: 1 }] },
        0.5: { transform: [{ scale: 1.1 }] },
        1: { transform: [{ scale: 1 }] },
      },
      400
    );
  };

  const handleSignIn = async () => {
    // Validation
    if (!email.trim()) {
      showAlert({
        type: 'warning',
        title: 'Oops!',
        message: 'Vui lòng nhập email của bạn 📧',
      });
      return;
    }

    if (!pass.trim()) {
      showAlert({
        type: 'warning',
        title: 'Oops!',
        message: 'Vui lòng nhập mật khẩu 🔒',
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      showAlert({
        type: 'error',
        title: 'Email không hợp lệ',
        message: 'Vui lòng nhập đúng định dạng email 📧',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await login(email.trim(), pass.trim());

      // Save userId to AsyncStorage (handle both PascalCase and camelCase)
      const userId = response.UserId || (response as any).userId;
      if (userId) {
        await setItem('userId', userId.toString());
      }

      // Handle both PascalCase and camelCase from BE
      const isComplete = response.IsProfileComplete ?? (response as any).isProfileComplete ?? false;

      if (isComplete === true) {
        // Profile complete -> Navigate immediately to Home
        // Toast will be shown in Home screen
        await setItem('showLoginSuccess', 'true');
        navigation.replace("Home");
      } else {
        // Profile incomplete -> Continue onboarding
        showAlert({
          type: 'info',
          title: 'Hoàn thành hồ sơ',
          message: 'Hãy hoàn thành thông tin thú cưng để sử dụng ứng dụng!',
          confirmText: 'Tiếp tục',
          onClose: () => navigation.replace("AddPetBasicInfo", { isFromProfile: false }),
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Đăng nhập thất bại ',
        message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradients.auth.welcome}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* nhiều trái tim tách thành component riêng */}
      <HeartsBackground />

      {/* Avatar + Circle */}
      <View style={styles.circleWrapper}>
        <LinearGradient colors={gradients.auth.buttonPrimary} style={styles.circle} />
        <Image
          source={require("../../../assets/cat_avatar_signin.png")}
          style={styles.avatar}
        />
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>Sign in</Text>

        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          placeholderTextColor="#999"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
        />

        <Animatable.View ref={buttonRef} style={styles.btnShadow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPress={handleSignIn}
            disabled={loading}
          >
            <LinearGradient
              colors={gradients.auth.buttonPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in →</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        <Text style={styles.footer}>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("SignUp")}
          >
            Register Now!
          </Text>{" "}
          / <Text
            style={[styles.link, { color: "#666" }]}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            Forgot password
          </Text>
        </Text>
      </View>

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
  container: { flex: 1, alignItems: "center", padding: 20 },
  circleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    position: "relative",
    width: 210,
    height: 210,
  },
  circle: { width: 210, height: 210, borderRadius: 105 },
  avatar: {
    width: 350,
    height: 400,
    resizeMode: "contain",
    position: "absolute",
    top: -52,
  },
  form: { width: "100%", alignItems: "center", marginTop: 30 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 18, color: "#333" },
  input: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 15,
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  btnShadow: {
    marginTop: 8,
    borderRadius: 30,
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 70,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: { marginTop: 24, fontSize: 14, color: "#666" },
  link: { fontWeight: "bold", color: "#FF6EA7", textDecorationLine: "underline" },
});

export default SignInScreen;
