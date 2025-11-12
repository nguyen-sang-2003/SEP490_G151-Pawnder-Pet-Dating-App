import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacyAndSafety">;

const PrivacyAndSafetyScreen = ({ navigation }: Props) => {
  const [showOnline, setShowOnline] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showAge, setShowAge] = useState(false);

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Safety</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="eye-outline" size={22} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Show Online Status</Text>
                  <Text style={styles.settingDesc}>
                    Let others see when you're active
                  </Text>
                </View>
              </View>
              <Switch
                value={showOnline}
                onValueChange={setShowOnline}
                trackColor={{ false: "#E0E0E0", true: colors.primaryLight }}
                thumbColor={showOnline ? colors.primary : "#F5F5F5"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="location-outline" size={22} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Show My Location</Text>
                  <Text style={styles.settingDesc}>
                    Display city and distance
                  </Text>
                </View>
              </View>
              <Switch
                value={showLocation}
                onValueChange={setShowLocation}
                trackColor={{ false: "#E0E0E0", true: colors.primaryLight }}
                thumbColor={showLocation ? colors.primary : "#F5F5F5"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon
                  name="chatbubble-outline"
                  size={22}
                  color={colors.primary}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Allow Messages</Text>
                  <Text style={styles.settingDesc}>From matched users only</Text>
                </View>
              </View>
              <Switch
                value={allowMessages}
                onValueChange={setAllowMessages}
                trackColor={{ false: "#E0E0E0", true: colors.primaryLight }}
                thumbColor={allowMessages ? colors.primary : "#F5F5F5"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Icon name="calendar-outline" size={22} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Show Cat Age</Text>
                  <Text style={styles.settingDesc}>Display exact age</Text>
                </View>
              </View>
              <Switch
                value={showAge}
                onValueChange={setShowAge}
                trackColor={{ false: "#E0E0E0", true: colors.primaryLight }}
                thumbColor={showAge ? colors.primary : "#F5F5F5"}
              />
            </View>
          </View>
        </View>

        {/* Safety Center */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Center</Text>

          <TouchableOpacity style={styles.actionCard}>
            <Icon
              name="shield-checkmark-outline"
              size={24}
              color={colors.primary}
            />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Safety Tips</Text>
              <Text style={styles.actionDesc}>
                Learn how to stay safe on Pawnder
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textMedium} />
          </TouchableOpacity>

        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity style={styles.actionCard}>
            <Icon name="download-outline" size={24} color={colors.primary} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Download My Data</Text>
              <Text style={styles.actionDesc}>
                Get a copy of your information
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textMedium} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    ...shadows.small,
  },

  // Setting Row
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 13,
    color: colors.textMedium,
  },

  // Action Card
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 12,
    ...shadows.small,
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 13,
    color: colors.textMedium,
  },

  // Empty State
  emptyCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 40,
    alignItems: "center",
    ...shadows.small,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textMedium,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default PrivacyAndSafetyScreen;

