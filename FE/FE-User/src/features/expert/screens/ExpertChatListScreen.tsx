import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, radius, shadows } from "../../../theme";
import {
  getUserExpertChats,
  ExpertChatListItem,
  getAvailableExperts,
  Expert,
  createOrGetExpertChat,
} from "../api/expertChatApi";
import { selectUnreadExpertChats } from "../../badge/badgeSlice";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import signalRService from "../../../services/signalr.service";

type Props = NativeStackScreenProps<RootStackParamList, "ExpertChatList">;

const ExpertChatListScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expertChats, setExpertChats] = useState<ExpertChatListItem[]>([]);
  const [availableExperts, setAvailableExperts] = useState<Expert[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const unreadExpertChats = useSelector(selectUnreadExpertChats);

  // Modal states
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadExpertChats();
    }, [])
  );

  // Setup SignalR listener for real-time updates
  useEffect(() => {
    let handleNewMessage: ((data: any) => void) | null = null;

    const setupSignalR = async () => {
      try {
        const userIdStr = await AsyncStorage.getItem('userId');
        if (!userIdStr) return;

        const userId = parseInt(userIdStr);

        // Ensure connected
        if (!signalRService.isConnected()) {
          await signalRService.connect(userId);
        }

        handleNewMessage = (data: any) => {
          const chatExpertId = data.ChatExpertId || data.chatExpertId;
          const message = data.Message || data.message;
          const createdAt = data.CreatedAt || data.createdAt;
          
          if (!chatExpertId) {
            return;
          }

          setExpertChats((prevChats) => {
            const chatIndex = prevChats.findIndex(c => c.chatExpertId === chatExpertId);
            
            if (chatIndex === -1) {
              setTimeout(() => {
                loadExpertChats(true);
              }, 0);
              return prevChats;
            }

            const updatedChats = [...prevChats];
            const updatedChat = {
              ...updatedChats[chatIndex],
              lastMessage: message,
              time: createdAt || new Date().toISOString(),
            };

            updatedChats.splice(chatIndex, 1);
            updatedChats.unshift(updatedChat);

            updatedChats.sort((a, b) => {
              let dateStrA = a.time;
              if (!dateStrA.endsWith('Z') && !dateStrA.includes('+')) {
                dateStrA = dateStrA + 'Z';
              }
              const dateA = new Date(dateStrA);
              
              let dateStrB = b.time;
              if (!dateStrB.endsWith('Z') && !dateStrB.includes('+')) {
                dateStrB = dateStrB + 'Z';
              }
              const dateB = new Date(dateStrB);
              
              return dateB.getTime() - dateA.getTime();
            });

            return updatedChats;
          });
        };

        signalRService.on('ReceiveExpertMessage', handleNewMessage);
      } catch (error) {
        // Error setting up SignalR
      }
    };

    setupSignalR();

    // Cleanup on unmount
    return () => {
      if (handleNewMessage) {
        signalRService.off('ReceiveExpertMessage', handleNewMessage);
      }
    };
  }, []);

  const loadExpertChats = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const userIdStr = await AsyncStorage.getItem("userId");
      if (!userIdStr) {
        return;
      }

      const userId = parseInt(userIdStr);
      const chats = await getUserExpertChats(userId);
      
      // Sort chats: tin nhắn mới nhất lên đầu, nếu không có tin nhắn thì chat mới nhất lên đầu
      const sortedChats = chats.sort((a, b) => {
        // Parse timestamps from time field
        let dateA: Date, dateB: Date;
        
        let dateStrA = a.time;
        if (!dateStrA.endsWith('Z') && !dateStrA.includes('+')) {
          dateStrA = dateStrA + 'Z';
        }
        dateA = new Date(dateStrA);
        
        let dateStrB = b.time;
        if (!dateStrB.endsWith('Z') && !dateStrB.includes('+')) {
          dateStrB = dateStrB + 'Z';
        }
        dateB = new Date(dateStrB);
        
        // Sort descending (newest first)
        return dateB.getTime() - dateA.getTime();
      });
      
      setExpertChats(sortedChats);
    } catch (error: any) {
      // Error loading expert chats
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadExpertChats(true);
  }, []);

  const loadAvailableExperts = async () => {
    try {
      setLoadingExperts(true);
      const experts = await getAvailableExperts();
      setAvailableExperts(experts);
    } catch (error: any) {
      // Error loading experts
    } finally {
      setLoadingExperts(false);
    }
  };

  const handleOpenExpertModal = () => {
    setShowExpertModal(true);
    if (availableExperts.length === 0) {
      loadAvailableExperts();
    }
  };

  const handleSelectExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setShowExpertModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmStartChat = async () => {
    if (!selectedExpert || creatingChat) return;

    try {
      setCreatingChat(true);
      const userIdStr = await AsyncStorage.getItem("userId");
      if (!userIdStr) {
        showAlert({
          type: "error",
          title: t("common.error"),
          message: t("expert.chatList.errors.userNotFound"),
        });
        return;
      }

      const userId = parseInt(userIdStr);
      const chatResponse = await createOrGetExpertChat(selectedExpert.userId, userId);

      setShowConfirmModal(false);
      setSelectedExpert(null);

      navigation.navigate("ExpertChat", {
        chatExpertId: chatResponse.chatExpertId,
        expertId: chatResponse.expertId,
        expertName: selectedExpert.fullName,
      });
    } catch (error: any) {
      showAlert({
        type: "error",
        title: t("common.error"),
        message: error.message || t("expert.chatList.errors.createChatFailed"),
      });
    } finally {
      setCreatingChat(false);
    }
  };

  const formatTime = (dateString: string): string => {
    let dateStr = dateString;
    if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
      dateStr = dateStr + "Z";
    }

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return diffDays === 1
        ? t("expert.chatList.time.yesterday")
        : t("expert.chatList.time.daysAgo", { count: diffDays });
    }
    if (diffHours > 0) {
      return t("expert.chatList.time.hoursAgo", { count: diffHours });
    }
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins > 0) {
      return t("expert.chatList.time.minutesAgo", { count: diffMins });
    }
    return t("expert.chatList.time.justNow");
  };

  const renderExpertChat = ({ item }: { item: ExpertChatListItem }) => {
    const formattedTime = formatTime(item.time);
    const isUnread = unreadExpertChats.includes(item.chatExpertId);

    return (
      <TouchableOpacity
        style={[styles.chatItem, isUnread && styles.chatItemUnread]}
        onPress={() =>
          navigation.navigate("ExpertChat", {
            chatExpertId: item.chatExpertId,
            expertId: item.expertId,
            expertName: item.expertName,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={["#4CAF50", "#66BB6A"]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="medical" size={24} color={colors.white} />
          </LinearGradient>
          {item.isOnline && <View style={styles.onlineDot} />}
          <View style={styles.expertBadge}>
            <Icon name="shield-checkmark" size={10} color="#4CAF50" />
          </View>
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={styles.nameContainer}>
              <Text style={[styles.expertName, isUnread && styles.expertNameUnread]} numberOfLines={1}>
                {item.expertName}
              </Text>
            </View>
            <Text style={styles.time}>{formattedTime}</Text>
          </View>
          <Text style={styles.specialty} numberOfLines={1}>
            {item.specialty}
          </Text>
          <View style={styles.messageRow}>
            <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#4CAF50", "#66BB6A"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <Icon name="medical" size={24} color={colors.white} />
            </View>
            <Text style={styles.headerTitle}>{t("expert.chatList.title")}</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>{t("expert.chatList.subtitle")}</Text>
      </LinearGradient>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <LinearGradient
          colors={["#E8F5E9", "#F1F8E9"]}
          style={styles.infoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="information-circle" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>{t("expert.chatList.infoBanner")}</Text>
        </LinearGradient>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>{t("expert.chatList.loading")}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={expertChats}
            keyExtractor={(item) => item.id}
            renderItem={renderExpertChat}
            contentContainerStyle={expertChats.length === 0 ? styles.emptyListContent : styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#4CAF50"]}
                tintColor="#4CAF50"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={["#4CAF50", "#66BB6A"]}
                  style={styles.emptyIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="chatbubbles-outline" size={48} color={colors.white} />
                </LinearGradient>
                <Text style={styles.emptyTitle}>{t("expert.chatList.empty.title")}</Text>
                <Text style={styles.emptyText}>{t("expert.chatList.empty.message")}</Text>
                <TouchableOpacity style={styles.startChatButton} onPress={handleOpenExpertModal} activeOpacity={0.8}>
                  <LinearGradient colors={["#4CAF50", "#66BB6A"]} style={styles.startChatGradient}>
                    <Icon name="add-circle" size={22} color={colors.white} />
                    <Text style={styles.startChatText}>{t("expert.chatList.startNewChat")}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
          />
          {/* FAB to start new chat - only show when has chats */}
          {expertChats.length > 0 && (
            <TouchableOpacity style={styles.fab} onPress={handleOpenExpertModal} activeOpacity={0.8}>
              <LinearGradient colors={["#4CAF50", "#66BB6A"]} style={styles.fabGradient}>
                <Icon name="add" size={28} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Modal: Select Expert */}
      <Modal visible={showExpertModal} animationType="slide" transparent onRequestClose={() => setShowExpertModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("expert.chatList.selectExpert.title")}</Text>
              <TouchableOpacity onPress={() => setShowExpertModal(false)}>
                <Icon name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{t("expert.chatList.selectExpert.subtitle")}</Text>

            {loadingExperts ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>{t("expert.chatList.loadingExperts")}</Text>
              </View>
            ) : availableExperts.length > 0 ? (
              <ScrollView style={styles.expertList} showsVerticalScrollIndicator={false}>
                {availableExperts.map((expert) => (
                  <TouchableOpacity
                    key={expert.userId}
                    style={styles.expertItem}
                    onPress={() => handleSelectExpert(expert)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.expertAvatarContainer}>
                      {expert.avatarUrl ? (
                        <Image source={{ uri: expert.avatarUrl }} style={styles.expertAvatarImage} />
                      ) : (
                        <LinearGradient colors={["#4CAF50", "#66BB6A"]} style={styles.expertAvatar}>
                          <Icon name="person" size={24} color={colors.white} />
                        </LinearGradient>
                      )}
                      <View style={styles.verifiedBadge}>
                        <Icon name="shield-checkmark" size={10} color="#4CAF50" />
                      </View>
                    </View>
                    <View style={styles.expertItemInfo}>
                      <Text style={styles.expertItemName}>{expert.fullName}</Text>
                      <Text style={styles.expertItemSpecialty}>
                        {expert.specialty || t("expert.chatList.defaultSpecialty")}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={20} color={colors.textLabel} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noExpertsContainer}>
                <Icon name="people-outline" size={48} color={colors.textLabel} />
                <Text style={styles.noExpertsText}>{t("expert.chatList.noExperts")}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal: Confirm Start Chat */}
      <Modal visible={showConfirmModal} animationType="fade" transparent onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModalContainer}>
            {selectedExpert && (
              <>
                <View style={styles.confirmHeader}>
                  <View style={styles.confirmAvatarContainer}>
                    {selectedExpert.avatarUrl ? (
                      <Image source={{ uri: selectedExpert.avatarUrl }} style={styles.confirmAvatar} />
                    ) : (
                      <LinearGradient colors={["#4CAF50", "#66BB6A"]} style={styles.confirmAvatar}>
                        <Icon name="person" size={40} color={colors.white} />
                      </LinearGradient>
                    )}
                    <View style={styles.confirmVerifiedBadge}>
                      <Icon name="shield-checkmark" size={14} color="#4CAF50" />
                    </View>
                  </View>
                  <Text style={styles.confirmName}>{selectedExpert.fullName}</Text>
                  <Text style={styles.confirmSpecialty}>
                    {selectedExpert.specialty || t("expert.chatList.defaultSpecialty")}
                  </Text>
                  {selectedExpert.address && (
                    <View style={styles.confirmLocationRow}>
                      <Icon name="location-outline" size={14} color={colors.textLabel} />
                      <Text style={styles.confirmLocation}>{selectedExpert.address}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.confirmInfo}>
                  <Icon name="information-circle" size={20} color="#4CAF50" />
                  <Text style={styles.confirmInfoText}>{t("expert.chatList.confirmInfo")}</Text>
                </View>

                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowConfirmModal(false);
                      setSelectedExpert(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmStartChat}
                    disabled={creatingChat}
                  >
                    <LinearGradient colors={["#4CAF50", "#66BB6A"]} style={styles.confirmButtonGradient}>
                      {creatingChat ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <Icon name="chatbubble" size={18} color={colors.white} />
                          <Text style={styles.confirmButtonText}>{t("expert.chatList.startChat")}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

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
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  // Header
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, ...shadows.medium },
  headerContent: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  headerTitleContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconContainer: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: colors.white },
  headerSubtitle: { fontSize: 14, color: "rgba(255, 255, 255, 0.9)", marginTop: 4, marginLeft: 52 },

  // Info Card
  infoCard: { marginHorizontal: 20, marginTop: 16, marginBottom: 16, borderRadius: radius.lg, overflow: "hidden" },
  infoGradient: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: "#2E7D32", fontWeight: "500", lineHeight: 18 },

  // Chat Item
  listContent: { paddingBottom: 100 },
  emptyListContent: { flexGrow: 1, justifyContent: "center" },
  chatItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white,
    marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: radius.xl, ...shadows.small,
  },
  avatarContainer: { position: "relative", marginRight: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  onlineDot: {
    position: "absolute", bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#4CAF50", borderWidth: 3, borderColor: colors.white,
  },
  expertBadge: {
    position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.white,
  },
  chatContent: { flex: 1 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  nameContainer: { flex: 1, flexDirection: "row", alignItems: "center" },
  expertName: { fontSize: 16, fontWeight: "600", color: colors.textDark },
  time: { fontSize: 12, color: colors.textLabel, fontWeight: "500" },
  specialty: { fontSize: 13, color: "#4CAF50", fontWeight: "600", marginBottom: 4 },
  messageRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lastMessage: { flex: 1, fontSize: 14, color: colors.textMedium, lineHeight: 20 },
  unreadDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: "#4CAF50", marginLeft: 8,
    shadowColor: "#4CAF50", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 5,
  },
  chatItemUnread: {
    backgroundColor: colors.white, borderWidth: 3, borderColor: "#4CAF50",
    shadowColor: "#4CAF50", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  expertNameUnread: { fontWeight: "700" },
  lastMessageUnread: { fontWeight: "800", color: colors.textDark },

  // Loading
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16, color: colors.textMedium, marginTop: 12, fontWeight: "600" },

  // Empty State
  emptyState: { justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  emptyIconGradient: {
    width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 24, ...shadows.large,
  },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: colors.textDark, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.textMedium, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  startChatButton: { borderRadius: radius.xl, overflow: "hidden", ...shadows.medium },
  startChatGradient: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16, paddingHorizontal: 28 },
  startChatText: { fontSize: 17, fontWeight: "700", color: colors.white },

  // FAB
  fab: { position: "absolute", bottom: 24, right: 24, borderRadius: 30, ...shadows.large },
  fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingBottom: 40, maxHeight: "70%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.textDark },
  modalSubtitle: { fontSize: 14, color: colors.textMedium, paddingHorizontal: 20, marginBottom: 16 },
  modalLoading: { padding: 40, alignItems: "center" },
  expertList: { paddingHorizontal: 20 },
  expertItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F8F9FA",
    padding: 14, borderRadius: radius.lg, marginBottom: 10,
  },
  expertAvatarContainer: { position: "relative", marginRight: 12 },
  expertAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  expertAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  verifiedBadge: {
    position: "absolute", top: -2, right: -2, width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.white,
  },
  expertItemInfo: { flex: 1 },
  expertItemName: { fontSize: 15, fontWeight: "600", color: colors.textDark, marginBottom: 2 },
  expertItemSpecialty: { fontSize: 13, color: "#4CAF50", fontWeight: "500" },
  noExpertsContainer: { padding: 40, alignItems: "center" },
  noExpertsText: { fontSize: 14, color: colors.textMedium, textAlign: "center", marginTop: 12 },

  // Confirm Modal
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  confirmModalContainer: {
    backgroundColor: colors.white, borderRadius: 24, marginHorizontal: 24, padding: 24, width: "90%",
  },
  confirmHeader: { alignItems: "center", marginBottom: 20 },
  confirmAvatarContainer: { position: "relative", marginBottom: 16 },
  confirmAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  confirmVerifiedBadge: {
    position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: colors.white,
  },
  confirmName: { fontSize: 20, fontWeight: "700", color: colors.textDark, marginBottom: 4 },
  confirmSpecialty: { fontSize: 15, color: "#4CAF50", fontWeight: "600", marginBottom: 8 },
  confirmLocationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  confirmLocation: { fontSize: 13, color: colors.textLabel },
  confirmInfo: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9",
    padding: 14, borderRadius: radius.lg, gap: 10, marginBottom: 24,
  },
  confirmInfoText: { flex: 1, fontSize: 13, color: "#2E7D32", lineHeight: 18 },
  confirmButtons: { flexDirection: "row", gap: 12 },
  cancelButton: {
    flex: 0.4, paddingVertical: 14, borderRadius: radius.lg,
    backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center",
  },
  cancelButtonText: { fontSize: 15, fontWeight: "600", color: colors.textMedium },
  confirmButton: { flex: 0.6, borderRadius: radius.lg, overflow: "hidden" },
  confirmButtonGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, paddingHorizontal: 12,
  },
  confirmButtonText: { fontSize: 14, fontWeight: "700", color: colors.white },
});

export default ExpertChatListScreen;