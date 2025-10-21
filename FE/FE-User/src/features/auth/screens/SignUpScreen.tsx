import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore: bỏ qua warning type
import Icon from "react-native-vector-icons/MaterialIcons";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import HeartsBackground from "../components/HeartsBackground";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

const SignUpScreen = ({ navigation }: Props) => {
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);

  return (
    <LinearGradient
      colors={["#FDE8EF", "#F9C9D6"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      {/* Background tim */}
      <HeartsBackground />

      {/* Nút Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>

      {/* Avatar + Circle */}
      <View style={styles.circleWrapper}>
        <LinearGradient
          colors={["#FF6EA7", "#FFC2D6"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.circle}
        />
        <Image
          source={require("../../../assets/cat_avatar.png")}
          style={styles.avatar}
        />
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          value={fullName}
          onChangeText={setFullName}
        />

        {/* Gender Selection */}
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              gender === "Male" && styles.genderBtnActive,
            ]}
            onPress={() => setGender("Male")}
          >
            <Icon
              name="male"
              size={20}
              color={gender === "Male" ? "#fff" : "#FF7AAE"}
            />
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
              styles.genderBtn,
              gender === "Female" && styles.genderBtnActive,
            ]}
            onPress={() => setGender("Female")}
          >
            <Icon
              name="female"
              size={20}
              color={gender === "Female" ? "#fff" : "#FF7AAE"}
            />
            <Text
              style={[
                styles.genderText,
                gender === "Female" && styles.genderTextActive,
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
        />
        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          placeholderTextColor="#6B6B6B"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <Pressable style={styles.checkRow} onPress={() => setAgree((v) => !v)}>
          <View style={[styles.checkbox, agree && styles.checkboxOn]} />
          <Text style={styles.checkText}>I accept the terms and policy</Text>
        </Pressable>

        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.btnShadow}
          onPress={() => {
            // TODO: API call to register and send OTP
            navigation.navigate("OTPVerification", { email });
          }}
        >
          <LinearGradient
            colors={["#FF7AAE", "#FF9BC0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Already a member?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("SignIn")}
          >
            sign in
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20 },

  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    padding: 6,
  },

  circleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    position: "relative",
    width: 210,
    height: 210,
  },
  circle: {
    width: 210,
    height: 210,
    borderRadius: 105,
  },
  avatar: {
    width: 250,
    height: 280,
    resizeMode: "contain",
    position: "absolute",
  },

  form: {
    width: "100%",
    alignItems: "center",
    marginTop: 30, // đẩy form xuống dưới avatar
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
    color: "#333",
  },
  input: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  // Gender
  genderRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  genderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  genderBtnActive: {
    backgroundColor: "#FF7AAE",
    borderColor: "#FF7AAE",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  genderTextActive: {
    color: "#fff",
  },

  checkRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FF7AAE",
    marginRight: 8,
    backgroundColor: "transparent",
  },
  checkboxOn: { backgroundColor: "#FF7AAE" },
  checkText: { color: "#222" },

  btnShadow: {
    marginTop: 10,
    borderRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 64,
    borderRadius: 26,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  footer: { marginTop: 18, fontSize: 14 },
  link: { fontWeight: "bold", textDecorationLine: "underline" },
});

export default SignUpScreen;
