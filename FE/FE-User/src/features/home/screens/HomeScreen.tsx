import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    Animated,
    PanResponder,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getPetsForMatching, PetForMatching } from "../../../api/pet";
import { sendLike } from "../../../api/match";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = height * 0.75; // Tăng từ 0.62 lên 0.75
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
  ownerId: number; // Add ownerId for API calls
}

const HomeScreen = ({ navigation }: Props) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [pets, setPets] = useState<PetProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchedPet, setMatchedPet] = useState<PetProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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

    const onSwipeComplete = async (direction: "left" | "right") => {
        const currentPet = pets[currentIndex];
        
        // Safety check
        if (!currentPet || !currentPet.id || !currentUserId) {
            console.log("⚠️ No valid pet at index:", currentIndex);
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex(prev => prev + 1);
            return;
        }
        
        if (direction === "right") {
            // Send like via API
            try {
                console.log("❤️ Liked pet:", currentPet.id, "Owner:", currentPet.owner);
                
                const response = await sendLike({
                    fromUserId: currentUserId,
                    toUserId: currentPet.ownerId
                });
                
                console.log("✅ Like response:", response);
                
                // Check if it's a match
                if (response.isMatch) {
                    setMatchedPet(currentPet);
                    setShowMatchModal(true);
                    // Auto hide after 4 seconds
                    setTimeout(() => {
                        setShowMatchModal(false);
                        setMatchedPet(null);
                    }, 4000);
                }
            } catch (error) {
                console.error("❌ Error sending like:", error);
            }
        } else if (direction === "left") {
            // Just pass - no need to save to database
            console.log("👎 Passed pet:", currentPet.id);
        }
        
        position.setValue({ x: 0, y: 0 });
        setCurrentIndex(prev => prev + 1);
    };

    // Load pets from API
    useEffect(() => {
        loadPets();
    }, []);

    const loadPets = async () => {
        try {
            setLoading(true);
            // Get current user ID from storage
            const userIdStr = await AsyncStorage.getItem('userId');
            if (!userIdStr) {
                console.log('❌ No userId found in storage');
                setLoading(false);
                return;
            }

            const userId = parseInt(userIdStr);
            
            if (!userId || isNaN(userId)) {
                console.log('❌ Invalid userId');
                setLoading(false);
                return;
            }

            console.log('👤 Current userId:', userId);
            setCurrentUserId(userId); // Save for later use
            
            // Fetch pets for matching
            const matchingPets = await getPetsForMatching(userId);
            console.log('📦 Fetched pets:', matchingPets.length);

            // Convert API data to PetProfile format
            const formattedPets: PetProfile[] = matchingPets
                .filter((pet: PetForMatching) => pet && pet.petId && pet.name) // Filter out invalid pets
                .map((pet: PetForMatching) => ({
                    id: pet.petId.toString(),
                    name: pet.name,
                    age: pet.age ? `${pet.age} years` : 'N/A',
                    breed: pet.breed || 'Unknown',
                    gender: pet.gender?.toLowerCase() === 'male' ? 'male' : 'female',
                    distance: pet.owner?.address ? calculateDistance(pet.owner.address) : 'N/A',
                    bio: pet.description || 'No description',
                    image: pet.photos && pet.photos.length > 0 
                        ? { uri: pet.photos[0] } 
                        : require("../../../assets/cat_avatar.png"),
                    personality: [], // TODO: Add from pet characteristics
                    owner: pet.owner?.fullName || 'Unknown',
                    ownerId: pet.userId, // Store owner ID for API calls
                }));

            console.log('✅ Formatted pets:', formattedPets.length);
            setPets(formattedPets);
        } catch (error) {
            console.error('❌ Error loading pets:', error);
            setPets([]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate distance from address (placeholder logic)
    const calculateDistance = (address: any): string => {
        if (address && (address.City || address.city)) {
            return `${address.City || address.city}`;
        }
        if (address && (address.District || address.district)) {
            return `${address.District || address.district}`;
        }
        return 'Location unknown';
    };

    const handleLike = () => forceSwipe("right");
    const handleNope = () => forceSwipe("left");
    
    const handleViewPetDetail = (petId: string) => {
        console.log('📱 Opening pet detail:', petId);
        navigation.navigate("PetProfile", { petId });
    };

    const renderCard = (pet: PetProfile, index: number) => {
        if (index < currentIndex) return null;
        if (!pet || !pet.id) return null; // Safety check
        
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
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => handleViewPetDetail(pet.id)}
                        style={styles.imageContainer}
                    >
                        <Image source={pet.image} style={styles.petImage} />
                        
                        {/* Info Button Overlay */}
                        <View style={styles.infoButtonOverlay}>
                            <View style={styles.infoButton}>
                                <Icon name="information-circle" size={24} color={colors.white} />
                            </View>
                        </View>
                    </TouchableOpacity>
                    
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

                            {/* Action Buttons on Card */}
                            {isCurrentCard && (
                                <View style={styles.cardActions}>
                                    <TouchableOpacity 
                                        style={styles.cardActionBtnNope} 
                                        onPress={handleNope}
                                        activeOpacity={0.8}
                                    >
                                        <Icon name="close" size={36} color="#FF3B30" />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.cardActionBtnLike} 
                                        onPress={handleLike}
                                        activeOpacity={0.8}
                                    >
                                        <Icon name="heart" size={36} color="#FF6EA7" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </View>
            </Animated.View>
        );
    };

    // Show loading state
    if (loading) {
        return (
            <LinearGradient
                colors={gradients.background}
                style={styles.container}
            >
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <SafeAreaView style={{ flex: 0 }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading pets...</Text>
                </View>
                <BottomNav active="Home" />
            </LinearGradient>
        );
    }

    if (currentIndex >= pets.length) {
        return (
            <LinearGradient
                colors={gradients.background}
                style={styles.container}
            >
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <SafeAreaView style={{ flex: 0 }} />
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
                        onPress={() => {
                            setCurrentIndex(0);
                            loadPets(); // Reload pets from API
                        }}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            style={styles.resetGradient}
                        >
                            <Icon name="refresh" size={24} color={colors.white} />
                            <Text style={styles.resetText}>Reload Pets</Text>
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
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <SafeAreaView style={{ flex: 0 }} />
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
                {pets
                    .map((pet, index) => renderCard(pet, index))
                    .filter(card => card !== null)
                    .reverse()}
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
        paddingTop: 16, // Giảm từ 50 xuống 16
        paddingBottom: 12,
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
        marginTop: -20, // Đẩy card lên gần header hơn
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
    imageContainer: {
        width: "100%",
        height: "100%",
        position: "relative",
    },
    petImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    infoButtonOverlay: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 5,
    },
    infoButton: {
        backgroundColor: "rgba(0,0,0,0.5)",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.medium,
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

    // Card Actions (X and Heart buttons)
    cardActions: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        marginTop: 20,
        paddingBottom: 16,
    },
    cardActionBtnNope: {
        backgroundColor: colors.whiteWarm,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.large,
        borderWidth: 3,
        borderColor: "#FF3B30",
    },
    cardActionBtnLike: {
        backgroundColor: colors.whiteWarm,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        ...shadows.large,
        borderWidth: 3,
        borderColor: "#FF6EA7",
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

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 100,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: colors.textMedium,
        fontWeight: "600",
    },
});

export default HomeScreen;
