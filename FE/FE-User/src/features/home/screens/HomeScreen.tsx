import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    PanResponder,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getRecommendedPets, RecommendedPet, getPetsByUserId } from "../../../api/pet";
import { sendLike } from "../../../api/match";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppSelector } from "../../../app/hooks";
import { selectNotificationBadge } from "../../badge/badgeSlice";
import { getVipStatus } from "../../../api/payment";
import { LimitReachedModal } from "../../../components/LimitReachedModal";
import signalRService from "../../../services/signalr.service";
import { refreshBadgesForActivePet } from "../../../utils/badgeRefresh";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import { getItem, removeItem } from "../../../utils/storage";
import OptimizedImage from "../../../components/OptimizedImage";
import PetCardSkeleton from "../../../components/PetCardSkeleton";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 24; // Padding 12px each side
const CARD_HEIGHT = height * 0.72; // 72% of screen height
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
  image: any; // First image for backward compatibility
  images: any[]; // All images for carousel
  personality: string[];
  owner: string;
  ownerId: number; // Add ownerId for API calls
  matchPercent: number; // Match percentage (0-100)
  ownerIsVip?: boolean; // VIP status of pet owner
}

const HomeScreen = ({ navigation }: Props) => {
    const notificationBadge = useAppSelector(selectNotificationBadge);
    const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [pets, setPets] = useState<PetProfile[]>([]);
    const [currentPhotoIndices, setCurrentPhotoIndices] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [matchedPet, setMatchedPet] = useState<PetProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [activePetId, setActivePetId] = useState<number | null>(null); // User's active pet ID
    const [showMatchLimitModal, setShowMatchLimitModal] = useState(false);
    const [limitMessage, setLimitMessage] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    
    // Fade-in animation for loaded pets
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    // Scale animations for Like/Pass buttons
    const likeButtonScale = useRef(new Animated.Value(1)).current;
    const passButtonScale = useRef(new Animated.Value(1)).current;
    
    // Fade-in animation for next card
    const nextCardFadeAnim = useRef(new Animated.Value(1)).current;
    
    // Fade-in animation for empty state
    const emptyStateAnim = useRef(new Animated.Value(0)).current;
    
    // Bounce animation for empty state icon
    const bounceAnim = useRef(new Animated.Value(0)).current;
    

    // Use refs to access latest values in PanResponder callbacks
    const petsRef = useRef<PetProfile[]>([]);
    const currentUserIdRef = useRef<number | null>(null);
    const activePetIdRef = useRef<number | null>(null);
    const currentIndexRef = useRef(0);
    const prevLoadingRef = useRef(true);

    // Trigger fade-in animation when loading changes from true to false
    useEffect(() => {
        if (prevLoadingRef.current === true && loading === false) {
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false, // Must match position.x driver for Animated.multiply
            }).start();
        }
        prevLoadingRef.current = loading;
    }, [loading, fadeAnim]);
    
    // Trigger fade-in animation for next card when currentIndex changes
    useEffect(() => {
        if (currentIndex > 0 && currentIndex < pets.length) {
            nextCardFadeAnim.setValue(0);
            Animated.timing(nextCardFadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false, // Must match position.x driver for consistency
            }).start();
        }
    }, [currentIndex, pets.length, nextCardFadeAnim]);
    
    // Trigger fade-in animation for empty state when no more pets
    useEffect(() => {
        if (currentIndex >= pets.length && pets.length > 0) {
            emptyStateAnim.setValue(0);
            Animated.timing(emptyStateAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [currentIndex, pets.length, emptyStateAnim]);
    
    // Bounce animation for empty state icon
    useEffect(() => {
        if (currentIndex >= pets.length && pets.length > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [currentIndex, pets.length, bounceAnim]);

    // Update refs when state changes
    useEffect(() => {
        petsRef.current = pets;
    }, [pets]);

    useEffect(() => {
        currentUserIdRef.current = currentUserId;
    }, [currentUserId]);

    // Track previous pet ID to detect actual pet switches
    const prevActivePetIdRef = useRef<number | null>(null);
    
    useEffect(() => {
        activePetIdRef.current = activePetId;
        
        // Only refresh badges when pet ACTUALLY changes (not on initial mount)
        if (activePetId && currentUserId && prevActivePetIdRef.current !== null && prevActivePetIdRef.current !== activePetId) {
            console.log(`🔄 Pet switched from ${prevActivePetIdRef.current} to ${activePetId}, refreshing badges...`);
            refreshBadgesForActivePet(currentUserId);
        }
        
        // Update previous pet ID
        prevActivePetIdRef.current = activePetId;
    }, [activePetId, currentUserId]);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // Setup SignalR connection for match notifications
    useEffect(() => {
        const userId = currentUserIdRef.current;
        if (!userId) return;

        // Match success handler
        const handleMatchSuccess = (data: any) => {
            console.log('🎉 Match notification received:', data);
            
            // Create a temporary PetProfile for the matched pet
            const matchedPetData: PetProfile = {
                id: data.MatchId?.toString() || '0',
                name: data.PetName || 'Unknown Pet',
                age: '',
                breed: '',
                gender: 'male',
                distance: '',
                bio: '',
                image: data.PetPhotoUrl ? { uri: data.PetPhotoUrl } : require("../../../assets/cat_avatar.png"),
                images: data.PetPhotoUrl ? [{ uri: data.PetPhotoUrl }] : [require("../../../assets/cat_avatar.png")],
                personality: [],
                owner: data.OtherUserName || 'Someone',
                ownerId: data.OtherUserId || 0,
                matchPercent: 100,
            };
            
            // Show match modal
            setMatchedPet(matchedPetData);
            setShowMatchModal(true);
            
            // Auto hide after 4 seconds
            setTimeout(() => {
                setShowMatchModal(false);
                setMatchedPet(null);
            }, 4000);
        };

        // Setup SignalR (NewNotification listener is in AppNavigator globally)
        const setupSignalR = async () => {
            try {
                await signalRService.connect(userId);
                console.log('✅ SignalR connected in HomeScreen');
                signalRService.on('MatchSuccess', handleMatchSuccess);
            } catch (error) {
                console.error('❌ Failed to setup SignalR:', error);
            }
        };

        setupSignalR();

        // Cleanup listener on unmount
        return () => {
            signalRService.off('MatchSuccess', handleMatchSuccess);
        };
    }, [currentUserId, navigation]);

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
    
    // Card fade-out during swipe
    const cardOpacity = position.x.interpolate({
        inputRange: [-CARD_WIDTH, 0, CARD_WIDTH],
        outputRange: [0.3, 1, 0.3],
        extrapolate: "clamp",
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gesture) => {
                // Only capture horizontal swipes, let vertical gestures pass through for pull-to-refresh
                const isHorizontalSwipe = Math.abs(gesture.dx) > Math.abs(gesture.dy);
                return isHorizontalSwipe;
            },
            onPanResponderMove: (_, gesture) => {
                // Only update position for horizontal swipes
                const isHorizontalSwipe = Math.abs(gesture.dx) > Math.abs(gesture.dy);
                if (isHorizontalSwipe) {
                    position.setValue({ x: gesture.dx, y: gesture.dy });
                }
            },
            onPanResponderRelease: (_, gesture) => {
                console.log("👆 Gesture released:", {
                    dx: gesture.dx,
                    dy: gesture.dy,
                    threshold: SWIPE_THRESHOLD,
                    willSwipeRight: gesture.dx > SWIPE_THRESHOLD,
                    willSwipeLeft: gesture.dx < -SWIPE_THRESHOLD,
                    currentIndex: currentIndexRef.current,
                    petsLength: petsRef.current.length,
                    hasPets: petsRef.current.length > 0
                });
                
                // Only process horizontal swipes
                const isHorizontalSwipe = Math.abs(gesture.dx) > Math.abs(gesture.dy);
                if (!isHorizontalSwipe) {
                    console.log("↕️ Vertical gesture detected, ignoring for swipe");
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start();
                    return;
                }
                
                if (gesture.dx > SWIPE_THRESHOLD) {
                    console.log("➡️ Triggering RIGHT swipe");
                    forceSwipe("right");
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    console.log("⬅️ Triggering LEFT swipe");
                    forceSwipe("left");
                } else {
                    console.log("🔙 Gesture too small, returning to center");
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    const forceSwipe = (direction: "left" | "right") => {
        // Use refs to get latest values
        const latestPets = petsRef.current;
        const latestIndex = currentIndexRef.current;
        const latestUserId = currentUserIdRef.current;
        
        console.log("💨 Force swipe called:", {
            direction,
            currentIndex: latestIndex,
            petsLength: latestPets.length,
            currentPet: latestPets[latestIndex]?.name,
            currentUserId: latestUserId,
            ownerId: latestPets[latestIndex]?.ownerId
        });
        
        const x = direction === "right" ? width + 100 : -width - 100;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 250,
            useNativeDriver: false,
        }).start(() => {
            console.log("✨ Animation complete, calling onSwipeComplete");
            onSwipeComplete(direction);
        });
    };

    const onSwipeComplete = async (direction: "left" | "right") => {
        // Haptic feedback for swipe complete
        try {
            ReactNativeHapticFeedback.trigger("impactLight", {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: false,
            });
        } catch (error) {
            console.log('Haptic feedback not supported:', error);
        }
        
        // Use refs to get latest values
        const latestPets = petsRef.current;
        const latestIndex = currentIndexRef.current;
        const latestUserId = currentUserIdRef.current;
        const currentPet = latestPets[latestIndex];
        
        console.log("🔄 Swipe complete:", {
            direction,
            currentIndex: latestIndex,
            petId: currentPet?.id,
            ownerId: currentPet?.ownerId,
            currentUserId: latestUserId,
            hasPet: !!currentPet
        });
        
        // Safety check
        if (!currentPet || !currentPet.id) {
            console.log("⚠️ No valid pet at index:", latestIndex);
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex(prev => prev + 1);
            return;
        }
        
        if (!latestUserId) {
            console.error("❌ No currentUserId - cannot send like");
            position.setValue({ x: 0, y: 0 });
            setCurrentIndex(prev => prev + 1);
            return;
        }
        
        if (direction === "right") {
            // Send like via API
            try {
                const latestActivePetId = activePetIdRef.current;
                
                console.log("❤️ Sending like for pet:", {
                    fromPetId: latestActivePetId,
                    toPetId: currentPet.id,
                    petName: currentPet.name,
                    ownerId: currentPet.ownerId,
                    fromUserId: latestUserId
                });
                
                if (!currentPet.ownerId) {
                    console.error("❌ Pet has no ownerId - cannot send like");
                    position.setValue({ x: 0, y: 0 });
                    setCurrentIndex(prev => prev + 1);
                    return;
                }
                
                if (!latestActivePetId) {
                    console.error("❌ No active pet - cannot send like");
                    position.setValue({ x: 0, y: 0 });
                    setCurrentIndex(prev => prev + 1);
                    return;
                }
                
                const response = await sendLike({
                    fromUserId: latestUserId,
                    toUserId: currentPet.ownerId,
                    fromPetId: latestActivePetId,
                    toPetId: parseInt(currentPet.id)
                });
                
                console.log("✅ Like sent successfully:", response);
                
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
            } catch (error: any) {
                // Check if it's a 429 limit error
                if (error.response?.status === 429) {
                    const errorData = error.response?.data;
                    setLimitMessage(errorData?.message || "Bạn đã hết lượt gửi match hôm nay!");
                    setShowMatchLimitModal(true);
                    
                    // Reset card position
                    position.setValue({ x: 0, y: 0 });
                    return; // Don't advance to next card
                } else {
                    // Only log non-limit errors
                    console.error("❌ Error sending like:", error);
                }
            }
        } else if (direction === "left") {
            // Just pass - no need to save to database
            console.log("👎 Passed pet:", currentPet.id);
        }
        
        position.setValue({ x: 0, y: 0 });
        setCurrentIndex(prev => prev + 1);
    };


    // 🚀 OPTIMIZED: Load pets with lazy loading and parallel API calls
    const loadPets = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading pets with optimizations...');
            
            // Get current user ID from storage
            const userIdStr = await AsyncStorage.getItem('userId');
            if (!userIdStr) {
                console.log('❌ No userId found in storage');
                setLoading(false);
                return;
            }

            const userId = parseInt(userIdStr);
            
            if (!userId || isNaN(userId)) {
                setLoading(false);
                return;
            }

            setCurrentUserId(userId);
            
            // 🚀 OPTIMIZATION 1: Parallel API calls instead of sequential
            const [userPets, recommendedPets] = await Promise.all([
                getPetsByUserId(userId),
                getRecommendedPets(userId)
            ]);
            
            // Get user's active pet ID
            const activePet = userPets.find(p => p.IsActive === true || p.isActive === true);
            if (activePet) {
                const petId = activePet.PetId || activePet.petId;
                setActivePetId(petId ?? null);
                console.log('🐾 User active pet:', petId);
            } else {
                console.log('⚠️ No active pet found for user');
            }

            // 🚀 OPTIMIZATION 2: Lazy loading - Only process first 10 pets initially
            const INITIAL_LOAD_COUNT = 10;
            const petsToLoad = recommendedPets.slice(0, INITIAL_LOAD_COUNT);
            
            // Convert recommended pets to PetProfile format
            const formattedPets: PetProfile[] = petsToLoad
                .filter((pet: RecommendedPet) => pet && pet.petId && pet.name)
                .map((pet: RecommendedPet) => {
                    const photos = pet.photos && pet.photos.length > 0
                        ? pet.photos.map((url: string) => ({ uri: url }))
                        : [require("../../../assets/cat_avatar.png")];
                    
                    const matchPercent = pet.matchPercent ?? 0;
                    
                    return {
                        id: pet.petId.toString(),
                        name: pet.name,
                        age: pet.age ? `${pet.age} years` : 'N/A',
                        breed: pet.breed || 'Unknown',
                        gender: pet.gender?.toLowerCase() === 'male' ? 'male' : 'female',
                        distance: pet.distanceKm ? `${pet.distanceKm} km` : (pet.owner?.address ? `${pet.owner.address.city || pet.owner.address.district || ''}` : 'N/A'),
                        bio: pet.description || 'No description',
                        image: photos[0],
                        images: photos,
                        personality: [],
                        owner: pet.owner?.fullName || 'Unknown',
                        ownerId: pet.userId,
                        matchPercent: matchPercent,
                    };
                });

            // 🚀 OPTIMIZATION 3: Only check VIP for first 5 pets (visible ones)
            const VIP_CHECK_COUNT = 5;
            const uniqueOwnerIds = Array.from(new Set(
                formattedPets.slice(0, VIP_CHECK_COUNT).map(p => p.ownerId)
            ));
            const vipStatuses: { [userId: number]: boolean } = {};
            
            // Parallel VIP checks
            await Promise.all(
                uniqueOwnerIds.map(async (ownerId) => {
                    try {                
                        const status = await getVipStatus(ownerId);
                        vipStatuses[ownerId] = status.isVip;
                    } catch (error: any) {
                        vipStatuses[ownerId] = false;
                    }
                })
            );

            // Add VIP status to pets
            const petsWithVip = formattedPets.map(pet => ({
                ...pet,
                ownerIsVip: vipStatuses[pet.ownerId] || false,
            }));

            setPets(petsWithVip);
            setCurrentIndex(0);
            setCurrentPhotoIndices({});
            
            // 🚀 OPTIMIZATION 4: Load remaining pets in background
            if (recommendedPets.length > INITIAL_LOAD_COUNT) {
                loadMorePetsInBackground(recommendedPets.slice(INITIAL_LOAD_COUNT), userId);
            }
        } catch (error) {
            console.error('❌ Error loading pets:', error);
            setPets([]);
        } finally {
            setLoading(false);
        }
    };
    
    // 🚀 OPTIMIZATION 5: Background loading for remaining pets
    const loadMorePetsInBackground = async (remainingPets: RecommendedPet[], userId: number) => {
        try {
            console.log(`🔄 Loading ${remainingPets.length} more pets in background...`);
            
            const formattedPets: PetProfile[] = remainingPets
                .filter((pet: RecommendedPet) => pet && pet.petId && pet.name)
                .map((pet: RecommendedPet) => {
                    const photos = pet.photos && pet.photos.length > 0
                        ? pet.photos.map((url: string) => ({ uri: url }))
                        : [require("../../../assets/cat_avatar.png")];
                    
                    return {
                        id: pet.petId.toString(),
                        name: pet.name,
                        age: pet.age ? `${pet.age} years` : 'N/A',
                        breed: pet.breed || 'Unknown',
                        gender: pet.gender?.toLowerCase() === 'male' ? 'male' : 'female',
                        distance: pet.distanceKm ? `${pet.distanceKm} km` : (pet.owner?.address ? `${pet.owner.address.city || pet.owner.address.district || ''}` : 'N/A'),
                        bio: pet.description || 'No description',
                        image: photos[0],
                        images: photos,
                        personality: [],
                        owner: pet.owner?.fullName || 'Unknown',
                        ownerId: pet.userId,
                        matchPercent: pet.matchPercent ?? 0,
                        ownerIsVip: false, // Will be updated later if needed
                    };
                });
            
            // Append to existing pets
            setPets(prev => [...prev, ...formattedPets]);
            console.log(`✅ Loaded ${formattedPets.length} more pets in background`);
        } catch (error) {
            console.error('❌ Error loading more pets:', error);
        }
    };

    // Reload pets when screen comes into focus (e.g., after sending match request from PetProfile)
    useFocusEffect(
        useCallback(() => {
            loadPets();
            // Badges are refreshed automatically when activePetId changes (useEffect above)
            
            // Check if should show login success alert
            const checkLoginSuccess = async () => {
                const showSuccess = await getItem('showLoginSuccess');
                if (showSuccess === 'true') {
                    await removeItem('showLoginSuccess');
                    // Show success alert without blocking navigation
                    setTimeout(() => {
                        showAlert({
                            type: 'success',
                            title: 'Chào mừng! 🎉',
                            message: 'Đăng nhập thành công',
                        });
                    }, 500); // Small delay to let screen render first
                }
            };
            checkLoginSuccess();
        }, [showAlert])
    );

    // 🚀 OPTIMIZATION 6: Memoize handlers to prevent re-renders
    const handleLike = useCallback(() => {
        // Haptic feedback for Like button
        try {
            ReactNativeHapticFeedback.trigger("impactMedium", {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: false,
            });
        } catch (error) {
            console.log('Haptic feedback not supported:', error);
        }
        
        // Scale animation for Like button - run in parallel with swipe
        Animated.sequence([
            Animated.timing(likeButtonScale, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(likeButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        
        // Trigger swipe animation
        forceSwipe("right");
    }, [likeButtonScale]);
    
    const handleNope = useCallback(() => {
        // Haptic feedback for Pass button
        try {
            ReactNativeHapticFeedback.trigger("impactLight", {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: false,
            });
        } catch (error) {
            console.log('Haptic feedback not supported:', error);
        }
        
        // Scale animation for Pass button - run in parallel with swipe
        Animated.sequence([
            Animated.timing(passButtonScale, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(passButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        
        // Trigger swipe animation
        forceSwipe("left");
    }, [passButtonScale]);
    
    const handleViewPetDetail = useCallback((petId: string) => {
        console.log('📱 Opening pet detail:', petId);
        navigation.navigate("PetProfile", { petId });
    }, [navigation]);

    // Pull-to-refresh handler
    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            console.log('🔄 Pull-to-refresh triggered');
            await loadPets();
        } catch (error) {
            console.error('❌ Error refreshing pets:', error);
            showAlert({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể tải lại danh sách pets. Vui lòng thử lại.',
            });
        } finally {
            setRefreshing(false);
        }
    }, [showAlert]);

    // 🚀 OPTIMIZATION 7: Memoize renderCard to prevent unnecessary re-renders
    const renderCard = useCallback((pet: PetProfile, index: number) => {
        if (index < currentIndex) return null;
        if (!pet || !pet.id) return null; // Safety check
        
        const isCurrentCard = index === currentIndex;
        const isNextCard = index === currentIndex + 1;
        const cardStyle = isCurrentCard
            ? {
                ...styles.card,
                opacity: Animated.multiply(fadeAnim, cardOpacity),
                transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate },
                ],
            }
            : isNextCard
            ? {
                ...styles.card,
                opacity: nextCardFadeAnim,
            }
            : styles.card;

        return (
            <Animated.View
                key={pet.id}
                style={[cardStyle, { zIndex: pets.length - index }]}
                {...(isCurrentCard ? panResponder.panHandlers : {})}
            >
                <View style={styles.cardContent}>
                    <View style={styles.imageContainer}>
                        {/* Current Photo */}
                        <OptimizedImage 
                            source={pet.images[currentPhotoIndices[pet.id] || 0]} 
                            style={styles.petImage}
                            resizeMode="cover"
                            showLoader={true}
                            imageSize="full"
                        />
                        
                        {/* Photo Navigation Tap Areas */}
                        {pet.images.length > 1 && (
                            <>
                                {/* Left tap area - Previous photo */}
                                <TouchableOpacity
                                    style={styles.photoTapAreaLeft}
                                    activeOpacity={1}
                                    onPress={() => {
                                        const currentIdx = currentPhotoIndices[pet.id] || 0;
                                        const newIdx = currentIdx > 0 ? currentIdx - 1 : pet.images.length - 1;
                                        setCurrentPhotoIndices(prev => ({...prev, [pet.id]: newIdx}));
                                    }}
                                />
                                
                                {/* Right tap area - Next photo */}
                                <TouchableOpacity
                                    style={styles.photoTapAreaRight}
                                    activeOpacity={1}
                                    onPress={() => {
                                        const currentIdx = currentPhotoIndices[pet.id] || 0;
                                        const newIdx = (currentIdx + 1) % pet.images.length;
                                        setCurrentPhotoIndices(prev => ({...prev, [pet.id]: newIdx}));
                                    }}
                                />
                            </>
                        )}
                        
                        {/* Photo Pagination Dots */}
                        {pet.images.length > 1 && (
                            <View style={styles.paginationDots}>
                                {pet.images.map((_, idx) => (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.dot,
                                            idx === (currentPhotoIndices[pet.id] || 0) && styles.dotActive
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                        
                        {/* Info Button Overlay - Only button is clickable */}
                        <View style={styles.infoButtonOverlay}>
                            <TouchableOpacity 
                                style={styles.infoButton}
                                activeOpacity={0.7}
                                onPress={() => handleViewPetDetail(pet.id)}
                            >
                                <View style={styles.infoButtonGradient}>
                                    <LinearGradient
                                        colors={gradients.home}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" }}
                                    >
                                        <Icon name="information" size={20} color={colors.white} />
                                    </LinearGradient>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                    
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
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={styles.petName}>
                                            {pet.name}{" "}
                                            <Text style={pet.gender === "male" ? styles.male : styles.female}>
                                                {pet.gender === "male" ? "♂" : "♀"}
                                            </Text>
                                        </Text>
                                        {pet.matchPercent > 0 && (
                                            <View style={styles.matchBadge}>
                                                <Icon name="star" size={12} color={colors.primary} />
                                                <Text style={styles.matchBadgeText}>{pet.matchPercent}%</Text>
                                            </View>
                                        )}
                                    </View>
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
                                {pet.ownerIsVip && (
                                    <View style={styles.vipBadgeSmall}>
                                        <Icon name="diamond" size={12} color="#FFD700" />
                                    </View>
                                )}
                            </View>

                            {/* Action Buttons on Card */}
                            {isCurrentCard && (
                                <View style={styles.cardActions}>
                                    <Animated.View style={{ transform: [{ scale: passButtonScale }] }}>
                                        <TouchableOpacity 
                                            onPress={handleNope}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={["#FF6B6B", "#FF8E8E"]}
                                                style={styles.cardActionBtnNope}
                                            >
                                                <Icon name="close" size={32} color={colors.white} />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </Animated.View>
                                    
                                    <Animated.View style={{ transform: [{ scale: likeButtonScale }] }}>
                                        <TouchableOpacity 
                                            onPress={handleLike}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={gradients.home}
                                                style={styles.cardActionBtnLike}
                                            >
                                                <Icon name="heart" size={32} color={colors.white} />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </Animated.View>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </View>
            </Animated.View>
        );
    }, [currentIndex, currentPhotoIndices, position.x, position.y, rotate, panResponder.panHandlers, handleViewPetDetail, handleLike, handleNope, fadeAnim, likeButtonScale, passButtonScale, cardOpacity, nextCardFadeAnim]);

    // Show loading state with skeleton
    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                
                {/* Skeleton Cards */}
                <View style={styles.cardsContainer}>
                    <PetCardSkeleton count={5} />
                </View>

                {/* Tinder-style Header - Overlay */}
                <LinearGradient
                    colors={["rgba(250,251,252,0.98)", "rgba(250,251,252,0)"]}
                    style={styles.headerGradient}
                >
                    <SafeAreaView style={{ flex: 0 }} />
                    <View style={styles.header}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={gradients.home}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.logoGradient}
                            >
                                <Icon name="paw" size={24} color={colors.white} />
                            </LinearGradient>
                            <Text style={styles.logoText}>Pawnder</Text>
                        </View>

                        {/* Right Actions */}
                        <View style={styles.headerRight}>
                            <TouchableOpacity 
                                style={styles.iconButton}
                                onPress={() => (navigation as any).navigate("FilterScreen")}
                            >
                                <Icon name="options-outline" size={26} color={colors.textDark} />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.iconButton}
                                onPress={() => navigation.navigate("Notification")}
                            >
                                <Icon name="notifications-outline" size={26} color={colors.textDark} />
                                {notificationBadge > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {notificationBadge > 99 ? '99+' : notificationBadge}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                <BottomNav active="Home" />
            </View>
        );
    }

    if (currentIndex >= pets.length) {
        const translateY = bounceAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10],
        });
        
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                
                {/* No More Cards Content */}
                <Animated.View style={[styles.noMoreCards, { opacity: emptyStateAnim }]}>
                    <Animated.View style={{ transform: [{ translateY }] }}>
                        <LinearGradient
                            colors={gradients.home}
                            style={styles.noMoreIconGradient}
                        >
                            <Icon name="paw" size={60} color={colors.white} />
                        </LinearGradient>
                    </Animated.View>
                    <Text style={styles.noMoreTitle}>No More Pets!</Text>
                    <Text style={styles.noMoreText}>
                        Check back later for more adorable matches
                    </Text>
                    <Text style={styles.noMoreSubtitle}>
                        Or adjust your filters to see more pets
                    </Text>
                    <View style={styles.emptyStateButtons}>
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={() => {
                                setCurrentIndex(0);
                                loadPets(); // Reload pets from API
                            }}
                        >
                            <LinearGradient
                                colors={gradients.home}
                                style={styles.resetGradient}
                            >
                                <Icon name="refresh" size={24} color={colors.white} />
                                <Text style={styles.resetText}>Reload Pets</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.adjustFiltersButton}
                            onPress={() => (navigation as any).navigate("FilterScreen")}
                        >
                            <Icon name="options-outline" size={24} color={colors.primary} />
                            <Text style={styles.adjustFiltersText}>Adjust Filters</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Tinder-style Header - Overlay with glow */}
                <LinearGradient
                    colors={["rgba(250,251,252,0.98)", "rgba(250,251,252,0)"]}
                    style={styles.headerGradient}
                >
                    <SafeAreaView style={{ flex: 0 }} />
                    <View style={styles.header}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={gradients.home}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.logoGradient}
                        >
                            <Icon name="paw" size={24} color={colors.white} />
                        </LinearGradient>
                        <Text style={styles.logoText}>Pawnder</Text>
                    </View>

                    {/* Right Actions */}
                    <View style={styles.headerRight}>
                        <TouchableOpacity 
                            style={styles.iconButton}
                            onPress={() => (navigation as any).navigate("FilterScreen")}
                        >
                            <Icon name="options-outline" size={26} color={colors.textDark} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.iconButton}
                            onPress={() => navigation.navigate("Notification")}
                        >
                            <Icon name="notifications-outline" size={26} color={colors.textDark} />
                            {notificationBadge > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {notificationBadge > 99 ? '99+' : notificationBadge}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                    </View>
                </LinearGradient>

                <BottomNav active="Home" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            {/* Cards - Render first so header overlays on top */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary, colors.homeStart]}
                        tintColor={colors.primary}
                        progressViewOffset={100}
                    />
                }
            >
                <View style={styles.cardsContainer}>
                    {pets
                        .map((pet, index) => renderCard(pet, index))
                        .filter(card => card !== null)
                        .reverse()}
                </View>
            </ScrollView>

            {/* Tinder-style Header - Overlay with glow */}
            <LinearGradient
                colors={["rgba(250,251,252,0.98)", "rgba(250,251,252,0)"]}
                style={styles.headerGradient}
            >
                <SafeAreaView style={{ flex: 0 }} />
                <View style={styles.header}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <LinearGradient
                        colors={gradients.home}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.logoGradient}
                    >
                        <Icon name="paw" size={24} color={colors.white} />
                    </LinearGradient>
                    <Text style={styles.logoText}>Pawnder</Text>
                </View>

                {/* Right Actions */}
                <View style={styles.headerRight}>
                    <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => (navigation as any).navigate("FilterScreen")}
                    >
                        <Icon name="options-outline" size={26} color={colors.textDark} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => navigation.navigate("Notification")}
                    >
                        <Icon name="notifications-outline" size={26} color={colors.textDark} />
                        {notificationBadge > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>
                                    {notificationBadge > 99 ? '99+' : notificationBadge}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
                </View>
            </LinearGradient>

            {/* Match Modal */}
            {showMatchModal && matchedPet && (
                <View style={styles.matchModal}>
                    <LinearGradient
                        colors={["rgba(255,110,167,0.95)", "rgba(255,155,192,0.95)"]}
                        style={styles.matchGradient}
                    >
                        <Icon name="heart" size={80} color={colors.white} />
                        <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
                        <Text style={styles.matchText}>
                            You and {matchedPet.owner}'s pet {matchedPet.name} liked each other!
                        </Text>
                        <TouchableOpacity
                            style={styles.sendMessageButton}
                            onPress={() => {
                                setShowMatchModal(false);
                                setMatchedPet(null);
                                navigation.navigate("Chat", {});
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

            {/* Match Limit Modal */}
            <LimitReachedModal
                visible={showMatchLimitModal}
                onClose={() => setShowMatchLimitModal(false)}
                message={limitMessage}
                actionType="match"
            />

            {/* Custom Alert for Login Success */}
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

            {/* Bottom Navigation */}
            <BottomNav active="Home" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1,
        backgroundColor: "#FAFBFC", // Brighter background để hiệu ứng nổi bật hơn
    },
    scrollContent: {
        flex: 1,
    },

    // Tinder-style Header - Overlay
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: StatusBar.currentHeight || 0,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: "transparent",
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    logoGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#FF6EA7",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    logoText: {
        fontSize: 26,
        fontWeight: "bold",
        color: colors.primary,
        letterSpacing: -0.5,
        textShadowColor: "rgba(255,110,167,0.15)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.whiteWarm,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255,110,167,0.15)",
        shadowColor: "#FF6EA7",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        position: "relative",
    },
    iconButtonActive: {
        backgroundColor: colors.primaryPastel,
        borderColor: colors.primary,
    },
    modeIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginTop: 8,
        alignSelf: "center",
    },
    modeText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.primary,
    },
    notificationBadge: {
        position: "absolute",
        top: -2,
        right: -2,
        backgroundColor: "#FF3B30",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.whiteWarm,
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 8,
    },
    notificationBadgeText: {
        color: colors.white,
        fontSize: 11,
        fontWeight: "bold",
    },

    // Cards - Tinder Style with padding
    cardsContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 80, // Space for header
        paddingBottom: 110, // Increased space for bottom nav
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
        borderWidth: 2,
        borderColor: "rgba(233, 30, 99, 0.3)",
        shadowColor: "#E91E63",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 18,
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
        borderRadius: 24,
    },
    infoButtonGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.95)",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    
    // Photo Navigation
    photoTapAreaLeft: {
        position: "absolute",
        left: 0,
        top: 0,
        height: "35%", // Chỉ chiếm 35% chiều cao phía trên
        width: "40%",
        zIndex: 2,
    },
    photoTapAreaRight: {
        position: "absolute",
        right: 0,
        top: 0,
        height: "35%", // Chỉ chiếm 35% chiều cao phía trên
        width: "40%",
        zIndex: 2,
    },
    paginationDots: {
        position: "absolute",
        top: 12,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        zIndex: 3,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.5)",
    },
    dotActive: {
        backgroundColor: colors.white,
        width: 20,
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
        textShadowColor: "rgba(0, 0, 0, 0.8)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
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
        textShadowColor: "rgba(0, 0, 0, 0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
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
        textShadowColor: "rgba(0, 0, 0, 0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 6,
    },
    bio: {
        fontSize: 15, 
        color: colors.white,
        lineHeight: 22,
        textShadowColor: "rgba(0, 0, 0, 0.6)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
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
        textShadowColor: "rgba(0, 0, 0, 0.6)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    vipBadgeSmall: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 6,
    },

    // Card Actions (X and Heart buttons)
    cardActions: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        marginTop: 20,
        paddingBottom: 8,
    },
    cardActionBtnNope: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
        shadowColor: "#FF6B6B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    cardActionBtnLike: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
        shadowColor: colors.homeStart,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 12,
    },

    // No More Cards
    noMoreCards: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingBottom: 100,
        backgroundColor: colors.whiteWarm,
    },
    noMoreIconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        ...shadows.large,
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
    noMoreSubtitle: {
        fontSize: 14,
        color: colors.textLight,
        textAlign: "center",
        marginTop: 8,
    },
    emptyStateButtons: {
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        marginTop: 30,
    },
    resetButton: {
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
    adjustFiltersButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 32,
        paddingVertical: 16,
        gap: 8,
        borderRadius: radius.lg,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: "transparent",
    },
    adjustFiltersText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.primary,
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

    // Match Badge
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    matchBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 100,
        backgroundColor: colors.whiteWarm,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: colors.textDark,
        fontWeight: "600",
    },
});

export default HomeScreen;
