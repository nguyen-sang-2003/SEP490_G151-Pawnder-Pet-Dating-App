import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { colors, radius } from "../theme";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 24;
const CARD_HEIGHT = height * 0.72;

interface PetCardSkeletonProps {
  count?: number;
}

const PetCardSkeleton: React.FC<PetCardSkeletonProps> = ({ count = 3 }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnimation]);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH, CARD_WIDTH],
  });

  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={[
        styles.card,
        {
          zIndex: count - index,
          transform: [
            { scale: 1 - index * 0.02 },
            { translateY: index * -8 },
          ],
        },
      ]}
    >
      <View style={styles.cardContent}>
        {/* Image placeholder (70% height) */}
        <View style={styles.imagePlaceholder}>
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX }],
              },
            ]}
          />
        </View>

        {/* Info section placeholder (30% height) */}
        <View style={styles.infoPlaceholder}>
          {/* Name placeholder - 2 lines */}
          <View style={styles.namePlaceholder}>
            <View style={styles.shimmerBox} />
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>

          {/* Meta info placeholder - 1 line */}
          <View style={styles.metaPlaceholder}>
            <View style={styles.shimmerBox} />
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>

          {/* Bio placeholder - 2-3 lines */}
          <View style={styles.bioPlaceholder}>
            <View style={[styles.shimmerBox, { width: "100%" }]} />
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
          <View style={styles.bioPlaceholder}>
            <View style={[styles.shimmerBox, { width: "90%" }]} />
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
          <View style={styles.bioPlaceholder}>
            <View style={[styles.shimmerBox, { width: "70%" }]} />
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <>
      {Array.from({ length: count }).map((_, index) =>
        renderSkeletonCard(index)
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardContent: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.whiteWarm,
    borderWidth: 2,
    borderColor: "rgba(233, 30, 99, 0.1)",
  },
  imagePlaceholder: {
    width: "100%",
    height: "70%",
    backgroundColor: "#E0E0E0",
    position: "relative",
    overflow: "hidden",
  },
  infoPlaceholder: {
    width: "100%",
    height: "30%",
    padding: 20,
    gap: 12,
  },
  namePlaceholder: {
    height: 28,
    width: "60%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  metaPlaceholder: {
    height: 16,
    width: "40%",
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  bioPlaceholder: {
    height: 14,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  shimmerBox: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E0E0E0",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F5F5F5",
    width: "100%",
    height: "100%",
  },
});

export default PetCardSkeleton;
