import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius } from '../../../theme';

export const ChatSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.skeletonItem}>
          <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
          <View style={styles.skeletonContent}>
            <Animated.View style={[styles.skeletonName, { opacity }]} />
            <Animated.View style={[styles.skeletonMessage, { opacity }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  skeletonItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.whiteWarm,
    marginBottom: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,110,167,0.08)',
  },
  skeletonAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    marginRight: 14,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonName: {
    width: '60%',
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonMessage: {
    width: '80%',
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 4,
  },
});
