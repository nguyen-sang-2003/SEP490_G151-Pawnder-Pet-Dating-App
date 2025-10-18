import React from "react";
import { StyleSheet } from "react-native";
import * as Animatable from "react-native-animatable";

// Danh sách hiệu ứng để random
const animations = [
  "pulse",
  "bounce",
  "swing",
  "jello",
  "fadeInDown",
  "fadeInUp",
  "zoomIn",
  "rotate",
];

// Tạo nhiều tim hơn
const heartPositions = [
  { top: 50, left: 30 },
  { top: 120, right: 40 },
  { top: 180, left: 80 },
  { top: 250, right: 100 },
  { top: 320, left: 50 },
  { top: 400, right: 150 },
  { top: 480, left: 20 },
  { bottom: 50, right: 40 },
  { bottom: 100, left: 70 },
  { bottom: 160, right: 120 },
  { bottom: 200, left: 100 },
  { bottom: 250, right: 60 },
  { bottom: 320, left: 40 },
  { bottom: 380, right: 20 },
  { top: 60, right: 80 },
  { top: 140, left: 20 },
  { top: 200, right: 140 },
  { top: 280, left: 120 },
  { top: 350, right: 90 },
  { bottom: 420, left: 60 },
];

export default function HeartsBackground() {
  return (
    <>
      {heartPositions.map((pos, i) => {
        const anim = animations[i % animations.length]; // phân bổ animation
        const dur = 3500 + (i % 5) * 800; // random duration
        return (
          <Animatable.Image
            key={i}
            animation={anim as any}
            iterationCount="infinite"
            duration={dur}
            easing="ease-in-out"
            source={require("../../../assets/heart.png")}
            style={[styles.heart, pos]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  heart: {
    position: "absolute",
    width: 24,
    height: 24,
    opacity: 0.2,
    tintColor: "#FF6EA7",
  },
});
