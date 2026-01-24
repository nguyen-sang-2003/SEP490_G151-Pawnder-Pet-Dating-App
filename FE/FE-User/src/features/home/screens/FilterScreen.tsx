import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StatusBar,
    Animated,
    Dimensions,
    Alert,
    PanResponder,
} from "react-native";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors, gradients, radius, shadows } from "../../../theme";
import { getAttributesForFilter, AttributeForFilter, FilterSuggestion } from "../api/attributesApi";
import { saveUserPreferencesBatch, getUserPreferences } from "../api/preferencesApi";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import CustomAlert from "../../../components/CustomAlert";

const { width } = Dimensions.get("window");

type RootStackParamList = {
    FilterScreen: undefined;
    Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "FilterScreen">;

interface ActiveFilter {
    optionId?: number;
    minValue?: number;
    maxValue?: number;
}

const FilterScreen = ({ navigation }: Props) => {
    const { t } = useTranslation();
    const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [attributes, setAttributes] = useState<AttributeForFilter[]>([]);
    const [suggestion, setSuggestion] = useState<FilterSuggestion | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ [key: number]: ActiveFilter }>({});
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Animation values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(50))[0];

    // Load data on focus
    useFocusEffect(
        useCallback(() => {
            loadFilterData();
        }, [])
    );

    // Animate on mount
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const loadFilterData = async () => {
        try {
            setLoading(true);

            const userIdStr = await AsyncStorage.getItem("userId");
            if (!userIdStr) {
                return;
            }

            const userId = parseInt(userIdStr);
            setCurrentUserId(userId);

            // Load attributes
            const { attributes: attributesData, suggestion: suggestionData } = await getAttributesForFilter();
            setAttributes(attributesData);
            setSuggestion(suggestionData);

            // Load existing preferences
            const preferencesData = await getUserPreferences(userId);

            const filtersMap: { [key: number]: ActiveFilter } = {};
            preferencesData.forEach((pref: any) => {
                const attr = attributesData.find((a: any) => a.AttributeId === pref.AttributeId);
                const attrName = attr?.Name?.toLowerCase() || '';
                
                // Convert gram to kg for weight attribute
                let minValue = pref.MinValue;
                let maxValue = pref.MaxValue;
                
                if (attrName.includes('cân') || attrName.includes('nặng') || attrName.includes('weight')) {
                    // Backend stores as gram, convert to kg for display
                    if (minValue !== undefined) minValue = minValue / 1000;
                    if (maxValue !== undefined) maxValue = maxValue / 1000;
                }
                
                // Clamp old values to new BR limits (0.5-12kg, 15-40cm, 0-25 năm)
                if (minValue !== undefined || maxValue !== undefined) {
                    let maxLimit = 100;
                    let minLimit = 0;
                    
                    if (attrName.includes('cân') || attrName.includes('nặng') || attrName.includes('weight')) {
                        maxLimit = 12;
                        minLimit = 0.5;
                    } else if (attrName.includes('cao') || attrName.includes('height')) {
                        maxLimit = 40;
                        minLimit = 15;
                    } else if (attrName.includes('tuổi') || attrName.includes('age')) {
                        maxLimit = 25;
                        minLimit = 0;
                    }
                    
                    // Clamp to valid range
                    if (minValue !== undefined) {
                        minValue = Math.max(minLimit, Math.min(maxLimit, minValue));
                    }
                    if (maxValue !== undefined) {
                        maxValue = Math.max(minLimit, Math.min(maxLimit, maxValue));
                    }
                }
                
                filtersMap[pref.AttributeId] = {
                    optionId: pref.OptionId || undefined,
                    minValue: minValue,
                    maxValue: maxValue,
                };
            });

            setActiveFilters(filtersMap);
        } catch (error: any) {

        } finally {
            setLoading(false);
        }
    };

    const toggleOption = (attributeId: number, optionId: number) => {
        setActiveFilters((prev) => {
            const newFilters = { ...prev };
            const currentFilter = newFilters[attributeId];

            if (currentFilter?.optionId === optionId) {
                delete newFilters[attributeId];
            } else {
                newFilters[attributeId] = { optionId };
            }
            return newFilters;
        });
    };

    const updateFilterRange = (attributeId: number, field: "minValue" | "maxValue", value: number | undefined) => {
        setActiveFilters((prev) => {
            const newFilters = { ...prev };
            const currentFilter = newFilters[attributeId] || {};

            const updatedFilter = {
                ...currentFilter,
                [field]: value,
            };

            if (updatedFilter.minValue === undefined && updatedFilter.maxValue === undefined) {
                delete newFilters[attributeId];
            } else {
                newFilters[attributeId] = updatedFilter;
            }

            return newFilters;
        });
    };

    const handleSaveFilters = async () => {
        if (!currentUserId) {

            return;
        }

        try {
            setSaving(true);

            // Filter out "Any" selections (full range = no preference)
            const preferences = Object.entries(activeFilters)
                .filter(([attributeIdStr, filter]) => {
                    const attrId = parseInt(attributeIdStr);
                    const attr = attributes.find(a => a.AttributeId === attrId);

                    // Always include if has optionId (string type attribute)
                    if (filter.optionId !== undefined) return true;

                    // Skip if no min/max values (no numeric filter set)
                    if (filter.minValue === undefined && filter.maxValue === undefined) return false;

                    // For Distance (single max handle) - attribute "Khoảng cách"
                    if (attr?.Name?.toLowerCase() === "khoảng cách") {
                        // Only save if user has set a specific distance limit (not unlimited)
                        // Backend will use this to filter pets by distance
                        return filter.maxValue !== undefined && filter.maxValue < maxDistanceLimit;
                    }

                    // For Height/Weight (dual handles) - other float attributes
                    const maxLimit = attr?.Name?.toLowerCase().includes("cao") ? 100 : 50;
                    const min = filter.minValue || 0;
                    const max = filter.maxValue || maxLimit;

                    // Skip if full range (= "Any" selection)
                    if (min === 0 && max === maxLimit) {
                        return false;
                    }

                    return true;
                })
                .map(([attributeId, filter]) => {
                    const attrId = parseInt(attributeId);
                    const attr = attributes.find(a => a.AttributeId === attrId);
                    
                    // Convert weight from kg to gram for backend storage
                    if (attr?.Name?.toLowerCase() === "cân nặng") {
                        return {
                            AttributeId: attrId,
                            OptionId: filter.optionId,
                            MinValue: filter.minValue !== undefined ? Math.round(filter.minValue * 1000) : undefined,
                            MaxValue: filter.maxValue !== undefined ? Math.round(filter.maxValue * 1000) : undefined,
                        };
                    }
                    
                    return {
                        AttributeId: attrId,
                        OptionId: filter.optionId,
                        MinValue: filter.minValue,
                        MaxValue: filter.maxValue,
                    };
                });

            await saveUserPreferencesBatch(currentUserId, preferences);

            showAlert({
                type: 'success',
                title: t('home.filter.saveSuccess'),
                message: t('home.filter.saveSuccessMessage'),
                onClose: () => {
                    // Navigate back to Home screen - will auto-reload pets with new recommendations
                    navigation.goBack();
                },
            });
        } catch (error: any) {

            Alert.alert(
                t('home.filter.saveError'),
                error.response?.data?.message || error.message || t('home.filter.unknownError'),
                [{ text: "OK" }]
            );
        } finally {
            setSaving(false);
        }
    };

    const handleClearAll = () => {
        setActiveFilters({});
    };

    // Distance slider state (single handle - max only)
    const [isDraggingDistance, setIsDraggingDistance] = useState(false);
    const maxDistanceLimit = 100; // Max km

    // Slider layout refs
    const distanceSliderRef = useRef({ x: 0, width: 0 });

    // Distance slider PanResponder helper (create new each render like height/weight)
    const createDistanceSliderPanResponder = () => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: () => {
                setIsDraggingDistance(true);
            },
            onPanResponderMove: (event, gesture) => {
                const { x, width: trackWidth } = distanceSliderRef.current;

                if (trackWidth > 0) {
                    const distanceAttr = attributes.find((a) => a.Name?.toLowerCase() === "khoảng cách");
                    if (!distanceAttr) return;

                    // Calculate from absolute position
                    const touchX = gesture.moveX - x;
                    const progress = Math.max(0, Math.min(1, touchX / trackWidth));
                    const newValue = Math.round(progress * maxDistanceLimit);

                    setActiveFilters((prev) => {
                        const newFilters = { ...prev };
                        if (newValue === maxDistanceLimit) {
                            delete newFilters[distanceAttr.AttributeId];
                        } else {
                            newFilters[distanceAttr.AttributeId] = { maxValue: newValue };
                        }
                        return newFilters;
                    });
                }
            },
            onPanResponderRelease: () => {
                setIsDraggingDistance(false);
            },
            onPanResponderTerminate: () => {
                setIsDraggingDistance(false);
            },
        });
    };

    // Create PanResponder for range sliders (height, weight) - dual handle
    const rangeSliderRefs = useRef<{ [key: number]: { x: number; width: number } }>({});
    const [draggingStates, setDraggingStates] = useState<{ [key: string]: boolean }>({});

    const createRangeSliderPanResponder = (attributeId: number, isMin: boolean, maxLimit: number, minLimit: number = 0) => {
        return PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onPanResponderGrant: () => {
                setDraggingStates(prev => ({ ...prev, [`${attributeId}_${isMin ? 'min' : 'max'}`]: true }));
            },
            onPanResponderMove: (event, gesture) => {
                const sliderRef = rangeSliderRefs.current[attributeId];
                if (!sliderRef || sliderRef.width === 0) return;

                const filter = activeFilters[attributeId] || {};
                const currentMin = filter.minValue !== undefined ? filter.minValue : minLimit;
                const currentMax = filter.maxValue !== undefined ? filter.maxValue : maxLimit;

                // Calculate from absolute position (gesture.moveX)
                const touchX = gesture.moveX - sliderRef.x;
                const progress = Math.max(0, Math.min(1, touchX / sliderRef.width));
                const range = maxLimit - minLimit;
                const newValue = minLimit + (progress * range);
                
                // Round based on attribute type (BR)
                // Weight: Decimal step 0.5, Height & Age: Integer
                const attr = attributes.find(a => a.AttributeId === attributeId);
                const attrName = attr?.Name?.toLowerCase() || '';
                let roundedValue: number;
                
                if (attrName.includes('nặng') || attrName.includes('weight')) {
                    // Weight: Decimal step 0.5 (BR: 0.5, 1.0, 1.5, 2.0...)
                    roundedValue = Math.round(newValue * 2) / 2;
                } else {
                    // Height & Age: Integer (BR: 15, 16, 17... or 0, 1, 2...)
                    roundedValue = Math.round(newValue);
                }

                if (isMin) {
                    if (roundedValue < currentMax) {
                        setActiveFilters(prev => ({
                            ...prev,
                            [attributeId]: { ...prev[attributeId], minValue: roundedValue }
                        }));
                    }
                } else {
                    if (roundedValue > currentMin) {
                        setActiveFilters(prev => ({
                            ...prev,
                            [attributeId]: { ...prev[attributeId], maxValue: roundedValue }
                        }));
                    }
                }
            },
            onPanResponderRelease: () => {
                setDraggingStates(prev => ({ ...prev, [`${attributeId}_${isMin ? 'min' : 'max'}`]: false }));
            },
            onPanResponderTerminate: () => {
                setDraggingStates(prev => ({ ...prev, [`${attributeId}_${isMin ? 'min' : 'max'}`]: false }));
            },
        });
    };

    // Count active filters (excluding "Any" selections)
    const activeFilterCount = Object.entries(activeFilters).filter(([attributeIdStr, filter]) => {
        const attrId = parseInt(attributeIdStr);
        const attr = attributes.find(a => a.AttributeId === attrId);

        // Count string type filters (optionId)
        if (filter.optionId !== undefined) return true;

        // Skip if no min/max values
        if (filter.minValue === undefined && filter.maxValue === undefined) return false;

        // For Distance - skip if at maximum (= "Any")
        if (attr?.Name?.toLowerCase() === "khoảng cách") {
            return filter.maxValue !== undefined && filter.maxValue < maxDistanceLimit;
        }

        // For Height/Weight - skip if full range (= "Any")
        const maxLimit = attr?.Name?.toLowerCase().includes("cao") ? 100 : 50;
        const min = filter.minValue || 0;
        const max = filter.maxValue || maxLimit;

        // Skip if full range
        if (min === 0 && max === maxLimit) {
            return false;
        }

        return true;
    }).length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Group attributes by type
    const stringAttributes = attributes.filter((a) => 
        a.TypeValue?.toLowerCase() === "string" && 
        a.Name?.toLowerCase() !== "loại"
    );
    const floatAttributes = attributes.filter((a) => a.TypeValue?.toLowerCase() === "float" && a.Name?.toLowerCase() !== "khoảng cách");
    const distanceAttribute = attributes.find((a) => a.Name?.toLowerCase() === "khoảng cách");

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

            {/* Modern Header */}
            <LinearGradient
                colors={["#FFFFFF", "#FAFAFA"]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.closeButton}
                    >
                        <Icon name="close" size={28} color={colors.textDark} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>{t('home.filter.title')}</Text>
                        {activeFilterCount > 0 && (
                            <View style={styles.filterCountBadge}>
                                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleClearAll}
                        style={styles.clearButton}
                        disabled={activeFilterCount === 0}
                    >
                        <Text style={[styles.clearButtonText, activeFilterCount === 0 && styles.clearButtonTextDisabled]}>
                            {t('home.filter.clear')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    {/* Suggestion Banner */}
                    {suggestion?.message && (
                        <View style={styles.suggestionBanner}>
                            <LinearGradient
                                colors={['#E8F5E9', '#F1F8E9']}
                                style={styles.suggestionGradient}
                            >
                                <View style={styles.suggestionIcon}>
                                    <Icon name="sparkles" size={22} color="#4CAF50" />
                                </View>
                                <View style={styles.suggestionContent}>
                                    <Text style={styles.suggestionTitle}>{t('home.filter.tips')}</Text>
                                    <Text style={styles.suggestionText}>{suggestion.message}</Text>
                                </View>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Distance Section */}
                    {distanceAttribute && (() => {
                        const maxValue = activeFilters[distanceAttribute.AttributeId]?.maxValue || maxDistanceLimit;
                        const maxPercent = (maxValue / maxDistanceLimit) * 100;
                        const distanceSliderResponder = createDistanceSliderPanResponder();
                        const isAny = maxValue === maxDistanceLimit;

                        return (
                            <View style={styles.section}>
                                <View style={styles.sectionHeaderWithValue}>
                                    <View style={styles.sectionHeaderLeft}>
                                        <Icon name="location" size={22} color={colors.primary} />
                                        <Text style={styles.sectionTitle}>{t('home.filter.distance')}</Text>
                                    </View>
                                    <Text style={styles.sectionValue}>
                                        {isAny ? t('home.filter.all') : `0 - ${maxValue} km`}
                                    </Text>
                                </View>
                                <View style={styles.distanceCard}>
                                    {/* Single-handle Slider */}
                                    <View
                                        style={styles.sliderContainer}
                                        onLayout={(event) => {
                                            const { width } = event.nativeEvent.layout;
                                            distanceSliderRef.current = { x: 0, width };
                                        }}
                                    >
                                        {/* Slider Track Background */}
                                        <View style={styles.sliderTrack}>
                                            {/* Filled Progress (from 0 to max) */}
                                            <View
                                                style={[
                                                    styles.sliderProgress,
                                                    {
                                                        width: `${maxPercent}%`
                                                    }
                                                ]}
                                            />
                                        </View>

                                        {/* Max Thumb (draggable) */}
                                        <View
                                            style={[
                                                styles.sliderThumbWrapper,
                                                { left: `${maxPercent}%` }
                                            ]}
                                            {...distanceSliderResponder.panHandlers}
                                        >
                                            <Animated.View style={[styles.sliderThumb, isDraggingDistance && styles.sliderThumbActive]}>
                                                <LinearGradient
                                                    colors={gradients.primary}
                                                    style={styles.sliderThumbGradient}
                                                />
                                            </Animated.View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })()}

                    {/* Range Sections (Height, Weight) - Tinder Style */}
                    {floatAttributes.map((attribute) => {
                        const filter = activeFilters[attribute.AttributeId] || {};
                        // Determine max limit based on attribute (BR: weight 0.5-12kg, height 15-40cm, age 0-25)
                        let maxLimit = 12; // Default: weight in kg
                        let minLimit = 0;
                        
                        if (attribute.Name?.toLowerCase().includes("cao")) {
                            maxLimit = 40; // Height: 15-40cm
                            minLimit = 15;
                        } else if (attribute.Name?.toLowerCase().includes("nặng")) {
                            maxLimit = 12; // Weight: 0.5-12kg
                            minLimit = 0.5;
                        } else if (attribute.Name?.toLowerCase().includes("tuổi")) {
                            maxLimit = 25; // Age: 0-25 years
                            minLimit = 0;
                        }
                        
                        const min = filter.minValue !== undefined ? filter.minValue : minLimit;
                        const max = filter.maxValue !== undefined ? filter.maxValue : maxLimit;
                        const minPercent = ((min - minLimit) / (maxLimit - minLimit)) * 100;
                        const maxPercent = ((max - minLimit) / (maxLimit - minLimit)) * 100;
                        const isAny = min === minLimit && max === maxLimit;

                        // Create PanResponders for this attribute
                        const minResponder = createRangeSliderPanResponder(attribute.AttributeId, true, maxLimit, minLimit);
                        const maxResponder = createRangeSliderPanResponder(attribute.AttributeId, false, maxLimit, minLimit);

                        const isMinDragging = draggingStates[`${attribute.AttributeId}_min`];
                        const isMaxDragging = draggingStates[`${attribute.AttributeId}_max`];

                        return (
                            <View key={attribute.AttributeId} style={styles.section}>
                                <View style={styles.sectionHeaderWithValue}>
                                    <View style={styles.sectionHeaderLeft}>
                                        <Icon name="resize" size={22} color={colors.primary} />
                                        <Text style={styles.sectionTitle}>{attribute.Name}</Text>
                                    </View>
                                    <Text style={styles.sectionValue}>
                                        {isAny ? t('home.filter.all') : (() => {
                                            const attrName = attribute.Name?.toLowerCase() || '';
                                            // BR: Weight decimal step 0.5, Height & Age integer
                                            if (attrName.includes('nặng') || attrName.includes('weight')) {
                                                return `${min.toFixed(1)} - ${max.toFixed(1)} ${attribute.Unit}`;
                                            }
                                            return `${Math.round(min)} - ${Math.round(max)} ${attribute.Unit}`;
                                        })()}
                                    </Text>
                                </View>
                                <View style={styles.rangeCard}>
                                    {/* Dual-handle Slider */}
                                    <View
                                        style={styles.sliderContainer}
                                        onLayout={(event) => {
                                            const { width } = event.nativeEvent.layout;
                                            rangeSliderRefs.current[attribute.AttributeId] = { x: 0, width };
                                        }}
                                    >
                                        {/* Slider Track Background */}
                                        <View style={styles.sliderTrack}>
                                            {/* Filled Range */}
                                            <View
                                                style={[
                                                    styles.sliderProgress,
                                                    {
                                                        left: `${minPercent}%`,
                                                        width: `${maxPercent - minPercent}%`
                                                    }
                                                ]}
                                            />
                                        </View>

                                        {/* Min Thumb (draggable) */}
                                        <View
                                            style={[
                                                styles.sliderThumbWrapper,
                                                { left: `${minPercent}%` }
                                            ]}
                                            {...minResponder.panHandlers}
                                        >
                                            <Animated.View style={[styles.sliderThumb, isMinDragging && styles.sliderThumbActive]}>
                                                <LinearGradient
                                                    colors={gradients.primary}
                                                    style={styles.sliderThumbGradient}
                                                />
                                            </Animated.View>
                                        </View>

                                        {/* Max Thumb (draggable) */}
                                        <View
                                            style={[
                                                styles.sliderThumbWrapper,
                                                { left: `${maxPercent}%` }
                                            ]}
                                            {...maxResponder.panHandlers}
                                        >
                                            <Animated.View style={[styles.sliderThumb, isMaxDragging && styles.sliderThumbActive]}>
                                                <LinearGradient
                                                    colors={gradients.primary}
                                                    style={styles.sliderThumbGradient}
                                                />
                                            </Animated.View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {/* Appearance Sections */}
                    {stringAttributes.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="sparkles" size={22} color={colors.primary} />
                                <Text style={styles.sectionTitle}>{t('home.filter.appearance')}</Text>
                            </View>
                            {stringAttributes.map((attribute) => {
                                const percent = attribute.Percent ?? 0;
                                const isHighWeight = percent >= 9; // >= 9%: Rất quan trọng
                                const isMediumWeight = percent >= 7 && percent < 9; // 7-8%: Quan trọng
                                const isRecommended = isHighWeight || isMediumWeight;

                                // Xác định label và màu
                                let badge = null;
                                if (isHighWeight) {
                                    badge = { label: t('home.filter.priority'), icon: 'star', color: '#FF6B6B', bgColor: '#FFE5E5' };
                                } else if (isMediumWeight) {
                                    badge = { label: t('home.filter.recommended'), icon: 'heart', color: '#FF9800', bgColor: '#FFF3E0' };
                                }

                                return (
                                    <View key={attribute.AttributeId} style={[
                                        styles.optionCard,
                                        isRecommended && styles.optionCardHighlighted
                                    ]}>
                                        <View style={styles.optionLabelContainer}>
                                            <Text style={styles.optionLabel}>{attribute.Name}</Text>
                                            {badge && (
                                                <View style={[styles.highWeightBadge, { backgroundColor: badge.bgColor }]}>
                                                    <Icon name={badge.icon} size={12} color={badge.color} />
                                                    <Text style={[styles.highWeightText, { color: badge.color }]}>
                                                        {badge.label}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.chipsContainer}>
                                            {attribute.Options?.map((option) => {
                                                const isSelected = activeFilters[attribute.AttributeId]?.optionId === option.OptionId;
                                                return (
                                                    <TouchableOpacity
                                                        key={option.OptionId}
                                                        onPress={() => toggleOption(attribute.AttributeId, option.OptionId)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <LinearGradient
                                                            colors={isSelected ? gradients.primary : ["#F5F5F5", "#F5F5F5"]}
                                                            style={styles.chip}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 1 }}
                                                        >
                                                            {isSelected && (
                                                                <Icon name="checkmark-circle" size={16} color="#FFF" style={styles.chipIcon} />
                                                            )}
                                                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                                                {option.Name}
                                                            </Text>
                                                        </LinearGradient>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Bottom spacing */}
                    <View style={{ height: 120 }} />
                </Animated.View>
            </ScrollView>

            {/* Sticky Bottom Button */}
            <LinearGradient
                colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "#FFFFFF"]}
                style={styles.bottomGradient}
            >
                <TouchableOpacity
                    onPress={handleSaveFilters}
                    disabled={saving}
                    activeOpacity={0.9}
                    style={styles.applyButtonWrapper}
                >
                    <LinearGradient
                        colors={saving ? ["#CCC", "#DDD"] : gradients.primary}
                        style={styles.applyButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Icon name="checkmark-circle" size={24} color="#FFF" />
                                <Text style={styles.applyButtonText}>
                                    {activeFilterCount > 0 ? t('home.filter.applyWithCount', { count: activeFilterCount }) : t('home.filter.apply')}
                                </Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>

            {/* Custom Alert */}
            {alertConfig && (
                <CustomAlert
                    visible={visible}
                    type={alertConfig.type}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    confirmText={alertConfig.confirmText}
                    onClose={hideAlert}
                    onConfirm={alertConfig.onConfirm}
                    cancelText={alertConfig.cancelText}
                    showCancel={alertConfig.showCancel}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAFAFA",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FAFAFA",
    },

    // Header
    header: {
        paddingTop: StatusBar.currentHeight || 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F5F5F5",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textDark,
        letterSpacing: 0.3,
    },
    filterCountBadge: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: "center",
    },
    filterCountText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "700",
    },
    clearButton: {
        width: 60,
        height: 40,
        justifyContent: "center",
        alignItems: "flex-end",
    },
    clearButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.primary,
    },
    clearButtonTextDisabled: {
        color: "#CCC",
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },

    // Sections
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
    },
    sectionHeaderWithValue: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    sectionHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textDark,
        letterSpacing: 0.3,
    },
    sectionValue: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.primary,
    },

    // Distance Card
    distanceCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 20,
        ...shadows.medium,
    },

    // Tinder-style Slider
    sliderContainer: {
        paddingVertical: 20,
        marginBottom: 12,
        position: "relative",
    },
    sliderTrack: {
        height: 6,
        backgroundColor: "#E8E8E8",
        borderRadius: 3,
        position: "relative",
    },
    sliderProgress: {
        position: "absolute",
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    sliderThumbWrapper: {
        position: "absolute",
        top: 20,
        marginLeft: -20, // Center the expanded hit area
        marginTop: -20,
        zIndex: 20, // Ensure thumb is always on top
        width: 40, // Larger hit area
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    sliderThumb: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#FFF",
        ...shadows.large,
        overflow: "hidden",
    },
    sliderThumbActive: {
        transform: [{ scale: 1.2 }],
    },
    sliderThumbGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 16,
    },

    // Range Card
    rangeCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        ...shadows.medium,
    },

    // Suggestion Banner
    suggestionBanner: {
        marginBottom: 24,
        borderRadius: 16,
        overflow: 'hidden',
        ...shadows.medium,
    },
    suggestionGradient: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    suggestionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#388E3C',
        marginBottom: 4,
    },
    suggestionText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#558B2F',
        lineHeight: 18,
    },

    // Option Card
    optionCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        ...shadows.medium,
    },
    optionCardHighlighted: {
        borderWidth: 2,
        borderColor: '#FFE0E0',
        backgroundColor: '#FFFAFA',
        ...shadows.large,
    },
    optionLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textDark,
    },
    highWeightBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    highWeightText: {
        fontSize: 11,
        fontWeight: '700',
    },
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
        ...shadows.small,
    },
    chipIcon: {
        marginRight: 2,
    },
    chipText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textMedium,
    },
    chipTextSelected: {
        color: "#FFF",
    },

    // Bottom Button
    bottomGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    applyButtonWrapper: {
        borderRadius: 16,
        overflow: "hidden",
        ...shadows.large,
    },
    applyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        paddingHorizontal: 32,
        gap: 10,
    },
    applyButtonText: {
        fontSize: 17,
        fontWeight: "700",
        color: "#FFF",
        letterSpacing: 0.5,
    },
});

export default FilterScreen;
