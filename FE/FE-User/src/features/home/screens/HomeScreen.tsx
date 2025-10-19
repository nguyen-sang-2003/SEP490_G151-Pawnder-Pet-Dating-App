import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const HomeScreen = ({ navigation }: Props) => {
    const cat = {
        id: "1",
        name: "Mimi",
        gender: "female",
        age: "2 years",
        breed: "British Shorthair",
        personality: "Playful & Gentle",
        image: require("../../../assets/cat_avatar.png"),
    };

    return (
        <LinearGradient
            colors={gradients.background}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={gradients.primary}
                            style={styles.avatarGradient}
                        >
                            <Image
                                source={require("../../../assets/cat_avatar_signin.png")}
                                style={styles.avatar}
                            />
                        </LinearGradient>
                    </View>
                    <View>
                        <Text style={styles.locationLabel}>Location</Text>
                        <Text style={styles.locationText}>Ha Noi, Viet Nam</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    style={styles.notificationButton}
                    onPress={() => navigation.navigate("Notification")}
                >
                    <Icon name="notifications-outline" size={24} color={colors.primary} />
                    <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>2</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Card */}
            <View style={styles.card}>
                <Image source={cat.image} style={styles.catImage} />
                <View style={styles.cardInfo}>
                    <View style={styles.cardInfoRow}>
                        <View>
                            <Text style={styles.catName}>
                                {cat.name}{" "}
                                <Text style={cat.gender === "male" ? styles.male : styles.female}>
                                    {cat.gender === "male" ? "♂" : "♀"}
                                </Text>
                            </Text>
                            <Text style={styles.catMeta}>
                                {cat.age} • {cat.breed}
                            </Text>
                        </View>
                        <View style={styles.personalityTag}>
                            <Text style={styles.personality}>{cat.personality}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                {/* Nút X bên trái */}
                <TouchableOpacity style={styles.actionBtnLarge}>
                    <Icon name="close" size={32} color={colors.error} />
                </TouchableOpacity>

                {/* Nút Info ở giữa */}
                <TouchableOpacity style={styles.actionBtnSmall}>
                    <Icon name="information-circle-outline" size={26} color={colors.primary} />
                </TouchableOpacity>

                {/* Nút Tim bên phải - gradient đẹp */}
                <TouchableOpacity style={styles.actionBtnHeart}>
                    <LinearGradient
                        colors={gradients.primary}
                        style={styles.heartGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Icon name="heart" size={36} color={colors.white} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Bottom Navigation */}
            <BottomNav
                active="Home"
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingHorizontal: 20, 
        paddingTop: 50,
        paddingBottom: 100,
    },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    headerLeft: { 
        flexDirection: "row", 
        alignItems: "center" 
    },
    avatarWrapper: {
        marginRight: 12,
    },
    avatarGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.small,
    },
    avatar: { 
        width: 46, 
        height: 46, 
        borderRadius: 23,
    },
    locationLabel: { 
        fontSize: 12, 
        color: colors.textLabel,
        fontWeight: "500",
    },
    locationText: { 
        fontSize: 16, 
        fontWeight: "bold", 
        color: colors.textDark 
    },
    notificationButton: {
        position: "relative",
    },
    notificationBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#FF3B30",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.whiteWarm,
    },
    notificationBadgeText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: "bold",
    },

    // Card
    card: {
        backgroundColor: colors.whiteWarm,
        borderRadius: radius.lg,
        overflow: "hidden",
        ...shadows.large,
        marginBottom: 20,
    },
    catImage: {
        width: width - 40,
        height: width * 1.1,
        resizeMode: "cover",
        backgroundColor: colors.cardBackgroundLight,
    },
    cardInfo: { 
        padding: 16,
    },
    cardInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    catName: { 
        fontSize: 22, 
        fontWeight: "bold", 
        color: colors.textDark 
    },
    male: { 
        color: colors.male 
    },
    female: { 
        color: colors.female 
    },
    catMeta: { 
        fontSize: 15, 
        color: colors.textMedium, 
        marginTop: 4,
        fontWeight: "500",
    },
    personalityTag: {
        backgroundColor: colors.purplePastel,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.sm,
    },
    personality: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.purple,
    },

    // Actions
    actions: {
        position: "absolute",
        bottom: 100,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        paddingHorizontal: 40,
    },
    
    // Nút nhỏ ở giữa
    actionBtnSmall: {
        backgroundColor: colors.whiteWarm,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.medium,
    },
    
    // Nút lớn (nút X trái)
    actionBtnLarge: {
        backgroundColor: colors.whiteWarm,
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.large,
    },
    
    // Nút tim phải - to nhất và nổi bật
    actionBtnHeart: {
        width: 70,
        height: 70,
        borderRadius: 35,
        shadowColor: colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    
    heartGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default HomeScreen;
