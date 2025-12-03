import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import * as Animatable from "react-native-animatable";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import HeartsBackground from "../components/HeartsBackground";
import { gradients } from "../../../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

const WelcomeScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={gradients.auth.welcome}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Trái tim bay */}
      <HeartsBackground />

      {/* Wave / diagonal mờ */}
      <View style={styles.wave} />

      {/* Avatar mèo với hiệu ứng "breathing" */}
      <Animatable.Image
        animation={{
          0: { transform: [{ scale: 1 }] },
          0.5: { transform: [{ scale: 1.05 }] }, // phóng to nhẹ 5%
          1: { transform: [{ scale: 1 }] },
        }}
        iterationCount="infinite"
        duration={4000} // chậm rãi 4s 1 nhịp
        easing="ease-in-out"
        source={require("../../../assets/cat_welcome.png")}
        style={styles.image}
      />

      {/* Tagline */}
      <Animatable.Text animation="fadeInUp" delay={600} style={styles.tagline}>
        {t('auth.welcome.tagline')}
      </Animatable.Text>

      {/* Nút welcome */}
      <Animatable.View
        animation="pulse"
        easing="ease-in-out"
        iterationCount="infinite"
        duration={2000} // nút pulse cũng chậm rãi
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.buttonWrap}
          onPress={() => navigation.navigate("SignIn")}
        >
          <LinearGradient
            colors={gradients.auth.buttonWelcome}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>{t('auth.welcome.button')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  wave: {
    position: "absolute",
    width: "200%",
    height: 300,
    backgroundColor: "rgba(255, 122, 174, 0.15)",
    borderRadius: 200,
    top: -80,
    transform: [{ rotate: "-15deg" }],
  },
  image: {
    width: 400,
    height: 400,
    resizeMode: "contain",
    marginBottom: 20,
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  tagline: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 40,
  },
  buttonWrap: {
    borderRadius: 26,
    shadowColor: "#FF6EA7",
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
    letterSpacing: 0.6,
  },
});

export default WelcomeScreen;
