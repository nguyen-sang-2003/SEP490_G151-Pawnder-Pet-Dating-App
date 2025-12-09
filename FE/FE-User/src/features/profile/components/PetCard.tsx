import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { colors, gradients, radius, shadows } from "../../../theme";
import OptimizedImage from "../../../components/OptimizedImage";

interface PetCardProps {
  id: string;
  name: string;
  location: string;
  image: any;
  onPress: (petId: string) => void;
  onMenuPress?: (petId: string) => void;
}

const PetCard: React.FC<PetCardProps> = ({
  id,
  name,
  location,
  image,
  onPress,
  onMenuPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => onPress(id)}
      activeOpacity={0.7}
    >
      <View style={styles.petInfo}>
        <View style={styles.petAvatarWrapper}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.petAvatarGradient}
          >
            <OptimizedImage source={image} style={styles.petAvatar} imageSize="thumbnail" />
          </LinearGradient>
        </View>
        <View>
          <Text style={styles.petName}>{name}</Text>
          <Text style={styles.petLocation}>{location}</Text>
        </View>
      </View>
      {onMenuPress && (
        <TouchableOpacity onPress={() => onMenuPress(id)}>
          <Icon name="ellipsis-vertical" size={20} color={colors.textMedium} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  petCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
    ...shadows.small,
  },
  petInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  petAvatarWrapper: {
    marginRight: 12,
  },
  petAvatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  petAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  petName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 2,
  },
  petLocation: {
    fontSize: 14,
    color: colors.textMedium,
  },
});

export default PetCard;

