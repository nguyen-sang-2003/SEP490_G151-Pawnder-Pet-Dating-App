import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    Animated,
    PanResponder,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = height * 0.62;
const SWIPE_THRESHOLD = width * 0.25;

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface PetProfile {
  id: string;
  name: string;
  age: string;
  breed: string;
  gender: "male" | "female";
  distance: string;
  bio: string;
  image: any;
  personality: string[];
  owner: string;
}

const MOCK_PETS: PetProfile[] = [
  {
        id: "1",
    name: "Luna",
    age: "2 years",
    breed: "Persian Cat",
    gender: "female",
    distance: "2 km away",
    bio: "Playful and loves cuddles! 🐱",
    image: require("../../../assets/cat_avatar.png"),
    personality: ["Playful", "Gentle", "Curious"],
    owner: "Sarah",
  },
  {
    id: "2",
    name: "Max",
    age: "3 years",
    breed: "Golden Retriever",
    gender: "male",
    distance: "5 km away",
    bio: "Energetic boy who loves to run! 🎾",
    image: require("../../../assets/cat_avatar_signin.png"),
    personality: ["Energetic", "Friendly", "Loyal"],
    owner: "John",
  },
  {
    id: "3",
        name: "Mimi",
    age: "1.5 years",
    breed: "British Shorthair",
        gender: "female",
    distance: "1 km away",
    bio: "Sweet and calm, loves naps ☀️",
        image: require("../../../assets/cat_avatar.png"),
    personality: ["Calm", "Affectionate", "Lazy"],
    owner: "Emma",
  },
  {
    id: "4",
    name: "Charlie",
    age: "4 years",
    breed: "Beagle",
    gender: "male",
    distance: "3 km away",
    bio: "Adventure seeker! 🏃‍♂️",
    image: require("../../../assets/cat_avatar_signin.png"),
    personality: ["Active", "Curious", "Friendly"],
    owner: "Mike",
  },
];

const HomeScreen = ({ navigation }: Props) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [pets] = useState<PetProfile[]>(MOCK_PETS);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchedPet, setMatchedPet] = useState<PetProfile | null>(null);

    const position = useRef(new Animated.ValueXY()).current;
    const rotate = position.x.interpolate({
        inputRange: [-CARD_WIDTH, 0, CARD_WIDTH],
        outputRange: ["-30deg", "0deg", "30deg"],
        extrapolate: "clamp",
    });

    const likeOpacity = position.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    const nopeOpacity = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    forceSwipe("right");
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    forceSwipe("left");
                } else {
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    const forceSwipe = (direction: "left" | "right") => {
        const x = direction === "right" ? width + 100 : -width - 100;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 250,
            useNativeDriver: false,
        }).start(() => onSwipeComplete(direction));
    };

    const onSwipeComplete = (direction: "left" | "right") => {
        const currentPet = pets[currentIndex];
        
        if (direction === "right") {
            // TODO: API call - Save like to database
            console.log("Liked pet:", currentPet.id);
            
            // TODO: API call - Check if other pet already liked us
            // If yes (mutual like) -> create match
            const didTheyLikeUs = checkIfMutualLike(currentPet.id); // Mock function
            
            if (didTheyLikeUs) {
                // It's a match! Show modal
                setMatchedPet(currentPet);
                setShowMatchModal(true);
                // Auto hide after 4 seconds if user doesn't interact
                setTimeout(() => {
                    if (showMatchModal) {
                        setShowMatchModal(false);
                        setMatchedPet(null);
                    }
                }, 4000);
            }
            // If not matched, just save the like silently
        } else if (direction === "left") {
            // TODO: API call - Save "pass/nope" to database
            console.log("Passed pet:", currentPet.id);
        }
        
        position.setValue({ x: 0, y: 0 });
        setCurrentIndex(prev => prev + 1);
    };

    // Mock function - Replace with actual API call
    const checkIfMutualLike = (petId: string): boolean => {
        // TODO: Call API to check if the other pet already liked us
        // For demo: 30% chance of mutual like
        return Math.random() > 0.7;
    };

    const handleLike = () => forceSwipe("right");
    const handleNope = () => forceSwipe("left");

    const renderCard = (pet: PetProfile, index: number) => {
        if (index < currentIndex) return null;
        
        const isCurrentCard = index === currentIndex;
        const cardStyle = isCurrentCard
            ? {
                ...styles.card,
                transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate },
                ],
            }
            : styles.card;

        return (
            <Animated.View
                key={pet.id}
                style={[cardStyle, { zIndex: pets.length - index }]}
                {...(isCurrentCard ? panResponder.panHandlers : {})}
            >
                <View style={styles.cardContent}>
                    <Image source={pet.image} style={styles.petImage} />
                    
                    {/* Swipe Indicators */}
                    {isCurrentCard && (
                        <>
                            <Animated.View
                                style={[styles.likeLabel, { opacity: likeOpacity }]}
                            >
                                <LinearGradient
                                    colors={["#4CAF50", "#81C784"]}
                                    style={styles.labelGradient}
                                >
                                    <Icon name="heart" size={40} color={colors.white} />
                                    <Text style={styles.labelText}>LIKE</Text>
                                </LinearGradient>
                            </Animated.View>

                            <Animated.View
                                style={[styles.nopeLabel, { opacity: nopeOpacity }]}
                            >
                                <LinearGradient
                                    colors={["#E94D6B", "#FF8A9B"]}
                                    style={styles.labelGradient}
                                >
                                    <Icon name="close" size={40} color={colors.white} />
                                    <Text style={styles.labelText}>NOPE</Text>
                                </LinearGradient>
                            </Animated.View>
                        </>
                    )}

                    {/* Pet Info */}
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.8)"]}
                        style={styles.infoGradient}
                    >
                        <View style={styles.petInfo}>
                            <View style={styles.petHeader}>
                                <View>
                                    <Text style={styles.petName}>
                                        {pet.name}{" "}
                                        <Text style={pet.gender === "male" ? styles.male : styles.female}>
                                            {pet.gender === "male" ? "♂" : "♀"}
                                        </Text>
                                    </Text>
                                    <Text style={styles.petMeta}>
                                        {pet.age} • {pet.breed}
                                    </Text>
                                    <View style={styles.distanceRow}>
                                        <Icon name="location" size={14} color={colors.white} />
                                        <Text style={styles.distance}>{pet.distance}</Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.bio}>{pet.bio}</Text>

                            <View style={styles.personalityTags}>
                                {pet.personality.map((trait, idx) => (
                                    <View key={idx} style={styles.tag}>
                                        <Text style={styles.tagText}>{trait}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.ownerInfo}>
                                <Icon name="person-outline" size={14} color={colors.white} />
                                <Text style={styles.ownerText}>Owner: {pet.owner}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </Animated.View>
        );
    };

    if (currentIndex >= pets.length) {
        return (
            <LinearGradient
                colors={gradients.background}
                style={styles.container}
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

                <View style={styles.noMoreCards}>
                    <Icon name="paw" size={80} color={colors.primary} />
                    <Text style={styles.noMoreTitle}>No More Pets!</Text>
                    <Text style={styles.noMoreText}>
                        Check back later for more adorable matches
                    </Text>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={() => setCurrentIndex(0)}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            style={styles.resetGradient}
                        >
                            <Icon name="refresh" size={24} color={colors.white} />
                            <Text style={styles.resetText}>Start Over</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                <BottomNav active="Home" />
            </LinearGradient>
        );
    }

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

            {/* Cards */}
            <View style={styles.cardsContainer}>
                {pets.map((pet, index) => renderCard(pet, index)).reverse()}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtnLarge} onPress={handleNope}>
                    <Icon name="close" size={32} color={colors.error} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionBtnSmall}
                    onPress={() => navigation.navigate("UserPreference")}
                >
                    <Icon name="options-outline" size={26} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtnHeart} onPress={handleLike}>
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

            {/* Match Modal */}
            {showMatchModal && matchedPet && (
                <View style={styles.matchModal}>
                    <LinearGradient
                        colors={["rgba(255,110,167,0.95)", "rgba(255,155,192,0.95)"]}
                        style={styles.matchGradient}
                    >
                        <Icon name="heart" size={80} color={colors.white} />
                        <Text style={styles.matchTitle}>It's a Match!</Text>
                        <Text style={styles.matchText}>
                            You and {matchedPet.owner} liked each other's pets
                        </Text>
                        <TouchableOpacity
                            style={styles.sendMessageButton}
                            onPress={() => {
                                setShowMatchModal(false);
                                setMatchedPet(null);
                                navigation.navigate("Chat");
                            }}
                        >
                            <Text style={styles.sendMessageText}>Send Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.keepSwipingButton}
                            onPress={() => {
                                setShowMatchModal(false);
                                setMatchedPet(null);
                            }}
                        >
                            <Text style={styles.keepSwipingText}>Keep Swiping</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            )}

            {/* Bottom Navigation */}
            <BottomNav active="Home" />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
    },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
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

    // Cards
    cardsContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
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
        ...shadows.large,
    },
    petImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },

    // Swipe Labels
    likeLabel: {
        position: "absolute",
        top: 50,
        right: 30,
        zIndex: 10,
        transform: [{ rotate: "20deg" }],
    },
    nopeLabel: {
        position: "absolute",
        top: 50,
        left: 30,
        zIndex: 10,
        transform: [{ rotate: "-20deg" }],
    },
    labelGradient: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: radius.lg,
        alignItems: "center",
        gap: 4,
    },
    labelText: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.white,
    },

    // Pet Info
    infoGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    petInfo: {
        gap: 8,
    },
    petHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    petName: {
        fontSize: 28,
        fontWeight: "bold", 
        color: colors.white,
    },
    male: { 
        color: "#64B5F6",
    },
    female: { 
        color: "#FF9BC0",
    },
    petMeta: {
        fontSize: 16,
        color: colors.white,
        marginTop: 4,
    },
    distanceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        gap: 4,
    },
    distance: {
        fontSize: 14,
        color: colors.white,
    },
    bio: {
        fontSize: 15, 
        color: colors.white,
        lineHeight: 22,
    },
    personalityTags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    tag: {
        backgroundColor: "rgba(255,255,255,0.25)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.full,
    },
    tagText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.white,
    },
    ownerInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
    },
    ownerText: {
        fontSize: 14,
        color: colors.white,
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
    
    actionBtnSmall: {
        backgroundColor: colors.whiteWarm,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.medium,
    },
    
    actionBtnLarge: {
        backgroundColor: colors.whiteWarm,
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.large,
    },
    
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

    // No More Cards
    noMoreCards: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingBottom: 100,
    },
    noMoreTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: colors.textDark,
        marginTop: 20,
    },
    noMoreText: {
        fontSize: 16,
        color: colors.textMedium,
        textAlign: "center",
        marginTop: 12,
    },
    resetButton: {
        marginTop: 30,
        borderRadius: radius.lg,
        overflow: "hidden",
    },
    resetGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 32,
        paddingVertical: 16,
        gap: 8,
    },
    resetText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.white,
    },

    // Match Modal
    matchModal: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    matchGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    matchTitle: {
        fontSize: 36,
        fontWeight: "bold",
        color: colors.white,
        marginTop: 20,
    },
    matchText: {
        fontSize: 18,
        color: colors.white,
        textAlign: "center",
        marginTop: 12,
    },
    sendMessageButton: {
        backgroundColor: colors.white,
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: radius.lg,
        marginTop: 30,
        ...shadows.large,
    },
    sendMessageText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.primary,
    },
    keepSwipingButton: {
        marginTop: 16,
        paddingVertical: 12,
    },
    keepSwipingText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.white,
    },
});

export default HomeScreen;
