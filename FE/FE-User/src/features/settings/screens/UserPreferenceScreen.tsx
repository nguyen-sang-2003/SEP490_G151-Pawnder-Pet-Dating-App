import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { 
  getAttributesForFilter, 
  getUserPreferences, 
  saveUserPreferencesBatch,
  AttributeForFilter,
  UserPreference,
  UserPreferenceBatchRequest
} from "../../../api";
import { getItem } from "../../../utils/storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "UserPreference">;

interface PreferenceValue {
  attributeId: number;
  optionId?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
}

const UserPreferenceScreen = ({ navigation }: Props) => {
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<AttributeForFilter[]>([]);
  const [preferences, setPreferences] = useState<Map<number, PreferenceValue>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get userId from storage
      const userIdStr = await getItem('userId');
      if (!userIdStr) {
        showAlert({ type: 'error', title: 'Lỗi', message: 'Không tìm thấy thông tin người dùng' });
        return;
      }
      const uid = parseInt(userIdStr, 10);
      setUserId(uid);

      // Load attributes
      const attrs = await getAttributesForFilter();
      setAttributes(attrs);
      console.log('📋 Loaded attributes:', attrs);

      // Load existing preferences
      try {
        const existingPrefs = await getUserPreferences(uid);
        console.log('💾 Existing preferences:', existingPrefs);
        
        const prefsMap = new Map<number, PreferenceValue>();
        existingPrefs.forEach((pref: UserPreference) => {
          prefsMap.set(pref.AttributeId, {
            attributeId: pref.AttributeId,
            optionId: pref.OptionId,
            minValue: pref.MinValue,
            maxValue: pref.MaxValue,
          });
        });
        setPreferences(prefsMap);
      } catch (error: any) {
        // It's ok if there are no preferences yet
        console.log('ℹ️ No existing preferences or error loading them:', error.message);
      }
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      showAlert({ type: 'error', title: 'Lỗi', message: 'Không thể tải dữ liệu' });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (attributeId: number, value: Partial<PreferenceValue>) => {
    setPreferences(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(attributeId) || { attributeId };
      newMap.set(attributeId, { ...existing, ...value });
      return newMap;
    });
  };

  const handleSave = async () => {
    if (!userId) {
      showAlert({ type: 'error', title: 'Lỗi', message: 'Không tìm thấy thông tin người dùng' });
      return;
    }

    try {
      setSaving(true);
      
      // Convert preferences map to array
      const prefsArray: UserPreferenceBatchRequest[] = Array.from(preferences.values())
        .filter(pref => 
          // Only include preferences that have some value set
          pref.optionId != null || (pref.minValue != null && pref.maxValue != null)
        )
        .map(pref => ({
          AttributeId: pref.attributeId,
          OptionId: pref.optionId,
          MinValue: pref.minValue,
          MaxValue: pref.maxValue,
        }));

      if (prefsArray.length === 0) {
        showAlert({ type: 'warning', title: 'Cảnh báo', message: 'Vui lòng chọn ít nhất một sở thích' });
        return;
      }

      console.log('💾 Saving preferences:', prefsArray);
      const result = await saveUserPreferencesBatch(userId, prefsArray);
      console.log('✅ Saved:', result);
      
      showAlert({ 
        type: 'success', 
        title: 'Thành công', 
        message: `Đã lưu sở thích (${result.created} mới, ${result.updated} cập nhật)`,
        onConfirm: () => {
          hideAlert();
    navigation.goBack();
        }
      });
    } catch (error: any) {
      console.error('❌ Error saving preferences:', error);
      showAlert({ type: 'error', title: 'Lỗi', message: error.response?.data?.message || 'Không thể lưu sở thích' });
    } finally {
      setSaving(false);
    }
  };

  // Render attribute input based on type
  const renderAttributeInput = (attr: AttributeForFilter) => {
    const pref = preferences.get(attr.AttributeId);
    const isDistanceAttr = attr.Name.toLowerCase() === 'khoảng cách';

    // For "string" type with options - render as chips/buttons
    if (attr.TypeValue === 'string' && attr.Options && attr.Options.length > 0) {
      return (
        <View key={attr.AttributeId} style={styles.section}>
          <Text style={styles.sectionTitle}>{attr.Name}</Text>
          <View style={styles.personalityTags}>
            {attr.Options.map((option) => (
              <TouchableOpacity
                key={option.OptionId}
                style={[
                  styles.personalityTag,
                  pref?.optionId === option.OptionId && styles.personalityTagActive,
                ]}
                onPress={() => updatePreference(attr.AttributeId, { optionId: option.OptionId, minValue: null, maxValue: null })}
              >
                <Text
                  style={[
                    styles.personalityTagText,
                    pref?.optionId === option.OptionId && styles.personalityTagTextActive,
                  ]}
                >
                  {option.Name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // For "float" type - render as range input
    if (attr.TypeValue === 'float') {
      // Special handling for distance - only max value
      if (isDistanceAttr) {
        const distances = [5, 10, 15, 25, 50, 100];
        return (
          <View key={attr.AttributeId} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{attr.Name}</Text>
              <Text style={styles.sectionValue}>
                {pref?.maxValue || 0} {attr.Unit || 'km'}
              </Text>
            </View>
            <View style={styles.distanceOptions}>
              {distances.map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceChip,
                    pref?.maxValue === distance && styles.distanceChipActive,
                  ]}
                  onPress={() => updatePreference(attr.AttributeId, { maxValue: distance, optionId: null })}
                >
                  <Text
                    style={[
                      styles.distanceText,
                      pref?.maxValue === distance && styles.distanceTextActive,
                    ]}
                  >
                    {distance} {attr.Unit || 'km'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }

      // Normal range input (min/max)
      return (
        <View key={attr.AttributeId} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{attr.Name}</Text>
            <Text style={styles.sectionValue}>
              {pref?.minValue || 0} - {pref?.maxValue || 0} {attr.Unit || ''}
            </Text>
          </View>
          <View style={styles.rangeControls}>
            <View style={styles.rangeControl}>
              <Text style={styles.rangeLabel}>Min</Text>
              <View style={styles.rangeButtons}>
                <TouchableOpacity
                  style={styles.rangeButton}
                  onPress={() => {
                    const newMin = Math.max(0, (pref?.minValue || 0) - 1);
                    updatePreference(attr.AttributeId, { 
                      minValue: newMin,
                      maxValue: pref?.maxValue || newMin + 1,
                      optionId: null 
                    });
                  }}
                >
                  <Icon name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.rangeValue}>{pref?.minValue || 0}</Text>
                <TouchableOpacity
                  style={styles.rangeButton}
                  onPress={() => {
                    const newMin = Math.min((pref?.maxValue || 1) - 1, (pref?.minValue || 0) + 1);
                    updatePreference(attr.AttributeId, { 
                      minValue: newMin,
                      maxValue: pref?.maxValue || newMin + 1,
                      optionId: null 
                    });
                  }}
                >
                  <Icon name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.rangeControl}>
              <Text style={styles.rangeLabel}>Max</Text>
              <View style={styles.rangeButtons}>
                <TouchableOpacity
                  style={styles.rangeButton}
                  onPress={() => {
                    const newMax = Math.max((pref?.minValue || 0) + 1, (pref?.maxValue || 1) - 1);
                    updatePreference(attr.AttributeId, { 
                      maxValue: newMax,
                      minValue: pref?.minValue || 0,
                      optionId: null 
                    });
                  }}
                >
                  <Icon name="remove" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.rangeValue}>{pref?.maxValue || 0}</Text>
                <TouchableOpacity
                  style={styles.rangeButton}
                  onPress={() => {
                    updatePreference(attr.AttributeId, { 
                      maxValue: (pref?.maxValue || 0) + 1,
                      minValue: pref?.minValue || 0,
                      optionId: null 
                    });
                  }}
                >
                  <Icon name="add" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradients.background} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.background}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sở thích</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {attributes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="heart-dislike-outline" size={64} color={colors.textLabel} />
              <Text style={styles.emptyText}>Không có thuộc tính nào</Text>
            </View>
          ) : (
            attributes.map(attr => renderAttributeInput(attr))
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save Button - Fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={gradients.primary}
              style={styles.saveGradient}
            >
              {saving ? (
                <>
                  <ActivityIndicator size="small" color={colors.white} />
                  <Text style={styles.saveText}>Đang lưu...</Text>
                </>
              ) : (
                <>
              <Icon name="checkmark-circle" size={24} color={colors.white} />
                  <Text style={styles.saveText}>Lưu sở thích</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  },
  gradient: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 12,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },

  // Gender Options
  optionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    gap: 8,
    minHeight: 90,
    justifyContent: "center",
    ...shadows.small,
  },
  genderOptionGradient: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  genderTextActive: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },

  // Range Controls
  rangeControls: {
    flexDirection: "row",
    gap: 16,
  },
  rangeControl: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 8,
  },
  rangeButtons: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    padding: 8,
    justifyContent: "space-between",
    ...shadows.small,
  },
  rangeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryPastel,
    justifyContent: "center",
    alignItems: "center",
  },
  rangeValue: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
  },

  // Distance Options
  distanceOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  distanceChip: {
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  distanceChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryPastel,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  distanceTextActive: {
    color: colors.primary,
  },

  // Personality Tags
  personalityTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  personalityTag: {
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "transparent",
    ...shadows.small,
  },
  personalityTagActive: {
    borderColor: colors.purple,
    backgroundColor: colors.purplePastel,
  },
  personalityTagText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMedium,
  },
  personalityTagTextActive: {
    color: colors.purple,
  },

  // Switch Row
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 12,
    ...shadows.small,
  },
  switchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  switchSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: "transparent",
  },
  saveButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.button,
  },
  saveGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
  },
});

export default UserPreferenceScreen;
