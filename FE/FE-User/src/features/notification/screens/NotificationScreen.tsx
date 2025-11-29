import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from "../api/notificationApi";
import { useFocusEffect } from "@react-navigation/native";
import { refreshBadgesForActivePet } from "../../../utils/badgeRefresh";
import signalRService from "../../../services/signalr.service";
import { createOrGetExpertChat } from "../../expert/api/expertChatApi";
import { getUserExpertConfirmations } from "../../expert/api/expertConfirmationApi";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "Notification">;

const NotificationScreen = ({ navigation }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const { visible: alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Get time ago string
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading notifications...');

      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        console.log('❌ No userId found');
        setLoading(false);
        return;
      }

      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);

      console.log('🔄 Loading notifications for user:', userId);
      const data = await getNotifications(userId);

      // Merge expertId from AsyncStorage for expert_confirmation notifications
      for (const notification of data) {
        if (notification.type === 'expert_confirmation') {
          const mappingKey = `notification_expert_${notification.notificationId}`;
          try {
            const mappingStr = await AsyncStorage.getItem(mappingKey);
            if (mappingStr) {
              const mapping = JSON.parse(mappingStr);
              notification.expertId = mapping.expertId;
              notification.chatId = mapping.chatId;
              console.log(`✅ Loaded expertId ${mapping.expertId} for notification ${notification.notificationId}`);
            }
          } catch (err) {

          }
        }
      }

      // Sort by createdAt descending (newest first)
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setNotifications(sortedData);
      console.log('✅ Loaded', sortedData.length, 'notifications');
    } catch (error) {

      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load notifications on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  // Setup SignalR to listen for real-time notifications
  useEffect(() => {
    const setupSignalR = async () => {
      try {
        const userIdStr = await AsyncStorage.getItem('userId');
        if (!userIdStr) return;

        const userId = parseInt(userIdStr);

        // Connect if not already connected
        if (!signalRService.isConnected()) {
          await signalRService.connect(userId);
        }

        // Listen for new notifications
        const handleNewNotification = (data: any) => {
          console.log('🔔 New notification received via SignalR:', data);

          // Reload notifications first to get NotificationId from DB
          loadNotifications().then(async () => {
            console.log('✅ Notifications reloaded from API after realtime notification');

            // After reload, if we have expertId in SignalR data, store it with the newest notification
            if (data.ExpertId && data.Type === 'expert_confirmation') {
              try {
                const notifications = await getNotifications(userId);
                // Find the newest expert_confirmation notification (just created)
                const newestExpertNotif = notifications
                  .filter(n => n.type === 'expert_confirmation')
                  .sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                  })[0];

                if (newestExpertNotif) {
                  // Store mapping: notificationId -> expertId
                  const mappingKey = `notification_expert_${newestExpertNotif.notificationId}`;
                  const mappingData = {
                    expertId: data.ExpertId,
                    chatId: data.ChatId,
                    timestamp: Date.now()
                  };
                  await AsyncStorage.setItem(mappingKey, JSON.stringify(mappingData));
                  console.log(`💾 Stored expert mapping for notification ${newestExpertNotif.notificationId}:`, mappingData);
                }
              } catch (err) {

              }
            }
          }).catch(err => {

          });

          // Refresh badge count if userId is available
          if (userId) {
            refreshBadgesForActivePet(userId).catch(err => {

            });
          }
        };

        signalRService.on('NewNotification', handleNewNotification);
        console.log('✅ SignalR listener setup for notifications');

        // Cleanup
        return () => {
          signalRService.off('NewNotification', handleNewNotification);
        };
      } catch (error) {

      }
    };

    setupSignalR();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;

    try {
      await markAllNotificationsAsRead(currentUserId);
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      console.log('✅ Marked all notifications as read');

      // Refresh badge count after marking all as read
      await refreshBadgesForActivePet(currentUserId);
    } catch (error) {

    }
  };

  // 🚀 OPTIMIZATION: Memoize helper functions with useCallback
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "expert_reply":
      case "expert":
        return { name: "medical", color: "#FFFFFF" };
      case "system":
        return { name: "sparkles", color: "#FFFFFF" };
      default:
        return { name: "notifications", color: "#FFFFFF" };
    }
  }, []);

  const getNotificationBgColor = useCallback((type: string) => {
    switch (type) {
      case "expert_reply":
      case "expert":
        return ["#FF6EA7", "#FF9BC0"]; // Pink gradient for expert
      case "system":
        return ["#FFB8D6", "#FF8FB7"]; // Lighter pink for system
      default:
        return ["#FFB8D6", "#FF8FB7"];
    }
  }, []);

  const handleNotificationPress = async (item: Notification) => {
    // Show modal with notification details
    setSelectedNotification(item);
    setModalVisible(true);

    // Mark as read
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item.notificationId);
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.notificationId === item.notificationId ? { ...n, isRead: true } : n)
        );

        // Refresh badge count after marking as read
        if (currentUserId) {
          await refreshBadgesForActivePet(currentUserId);
        }
      } catch (error) {

      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  // Handle chat with expert
  const handleChatWithExpert = async () => {
    if (!selectedNotification || !currentUserId) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tạo chat với chuyên gia'
      });
      return;
    }

    try {
      setCreatingChat(true);
      let expertId = selectedNotification.expertId;

      // Fallback: If expertId not in AsyncStorage (old notification), try to find from ExpertConfirmation
      if (!expertId) {
        console.log('⚠️ ExpertId not found in AsyncStorage for notification:', selectedNotification.notificationId);
        console.log('🔄 Attempting fallback: Loading from ExpertConfirmation API...');

        try {
          const confirmations = await getUserExpertConfirmations(currentUserId);
          console.log('✅ Loaded expert confirmations:', confirmations);

          if (confirmations.length === 0) {
            throw new Error('Không tìm thấy yêu cầu xác nhận nào.');
          }

          // Find confirmation with matching timestamp (within 5 seconds of notification)
          const notificationTime = selectedNotification.createdAt ? new Date(selectedNotification.createdAt).getTime() : 0;

          let matchingConfirmation = confirmations.find(c => {
            if (c.status?.toLowerCase() !== 'confirmed') return false;
            const confirmTime = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
            const timeDiff = Math.abs(confirmTime - notificationTime);
            return timeDiff < 5000; // Within 5 seconds
          });

          // If no exact match, use the most recent confirmed expert
          if (!matchingConfirmation) {
            console.log('⚠️ No exact timestamp match, using most recent confirmed expert');
            matchingConfirmation = confirmations
              .filter(c => c.status?.toLowerCase() === 'confirmed')
              .sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return dateB - dateA;
              })[0];
          }

          if (matchingConfirmation) {
            expertId = matchingConfirmation.expertId;
            console.log('✅ Found expertId from ExpertConfirmation:', expertId);

            // Store for future use
            const mappingKey = `notification_expert_${selectedNotification.notificationId}`;
            const mappingData = {
              expertId: expertId,
              chatId: matchingConfirmation.chatAiId,
              timestamp: Date.now()
            };
            await AsyncStorage.setItem(mappingKey, JSON.stringify(mappingData));
            console.log('💾 Stored expert mapping for future use');
          }
        } catch (err) {

        }
      }

      if (!expertId) {
        showAlert({
          type: 'error',
          title: 'Lỗi',
          message: 'Không tìm thấy thông tin chuyên gia. Vui lòng thử lại sau hoặc liên hệ admin.'
        });

        return;
      }

      console.log(`🔄 Creating chat with expert: expertId=${expertId}, userId=${currentUserId}, notificationId=${selectedNotification.notificationId}`);

      // Create or get existing chat
      const chatResponse = await createOrGetExpertChat(expertId, currentUserId);
      console.log('✅ Chat created/retrieved:', chatResponse);

      // Close modal
      closeModal();

      // Navigate to expert chat screen
      navigation.navigate("ExpertChat", {
        chatExpertId: chatResponse.chatExpertId,
        expertId: chatResponse.expertId,
        expertName: selectedNotification.title?.replace('đã xác nhận thông tin', '').replace('Chuyên gia', '').trim() || "Chuyên gia"
      });
    } catch (error: any) {

      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: error.message || 'Không thể tạo chat với chuyên gia'
      });
    } finally {
      setCreatingChat(false);
    }
  };

  // 🚀 OPTIMIZATION: Memoize renderNotification with useCallback
  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    const type = item.type || 'system';
    const iconConfig = getNotificationIcon(type);
    const bgColors = getNotificationBgColor(type);
    const timeAgo = item.createdAt ? getTimeAgo(item.createdAt) : 'Unknown';
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.notificationUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={bgColors}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={iconConfig.name} size={26} color={iconConfig.color} />
          </LinearGradient>
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title || 'Notification'}
            </Text>
            {type === "expert_reply" || type === "expert" ? (
              <View style={styles.expertBadge}>
                <Icon name="shield-checkmark" size={12} color="#FF6EA7" />
                <Text style={styles.expertBadgeText}>Expert</Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.notificationMessage,
              isUnread && styles.notificationMessageBold,
            ]}
            numberOfLines={3}
          >
            {item.message || 'No message'}
          </Text>
          <View style={styles.notificationFooter}>
            <Icon name="time-outline" size={14} color={colors.textLabel} />
            <Text style={styles.notificationTime}>{timeAgo}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [getNotificationIcon, getNotificationBgColor, handleNotificationPress]);

  // 🚀 OPTIMIZATION: Memoize filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterType === "all") return true;
      if (filterType === "unread") return !n.isRead;
      if (filterType === "system") return n.type === "system";
      if (filterType === "expert") return n.type === "expert_reply" || n.type === "expert" || n.type === "expert_confirmation";
      return true;
    });
  }, [notifications, filterType]);

  // 🚀 OPTIMIZATION: Memoize unreadCount calculation
  const unreadCount = useMemo(() =>
    notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // 🚀 OPTIMIZATION: Memoize filter tabs configuration
  const filterTabs = useMemo(() => [
    { id: "all", label: "All", icon: "apps" },
    { id: "unread", label: "Unread", icon: "mail-unread", badge: unreadCount },
    { id: "system", label: "System", icon: "notifications" },
    { id: "expert", label: "Expert", icon: "medical" },
  ], [unreadCount]);

  // Show loading state
  if (loading) {
    return (
      <LinearGradient
        colors={gradients.background}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <Icon
            name="checkmark-done"
            size={22}
            color={unreadCount > 0 ? colors.primary : colors.textLabel}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs - Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterScroll}
      >
        {filterTabs.map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilterType(tab.id)}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={isActive ? colors.white : colors.textMedium}
              />
              <Text style={isActive ? styles.filterTextActive : styles.filterText}>
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.notificationId.toString()}
          renderItem={renderNotification}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          // 🚀 OPTIMIZATION: FlatList performance props
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["#FFB8D6", "#FF8FB7"]}
            style={styles.emptyIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon
              name="notifications-off-outline"
              size={48}
              color={colors.white}
            />
          </LinearGradient>
          <Text style={styles.emptyText}>
            {filterType === "all"
              ? "No notifications yet"
              : filterType === "unread"
                ? "All caught up!"
                : `No ${filterType} notifications`
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {filterType === "all"
              ? "You'll see system and expert notifications here"
              : filterType === "unread"
                ? "You have no unread notifications"
                : filterType === "system"
                  ? "System notifications will appear here"
                  : "Expert reply notifications will appear here"
            }
          </Text>
        </View>
      )}

      {/* Notification Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={selectedNotification?.type === "expert_reply" || selectedNotification?.type === "expert"
                  ? ["#FF6EA7", "#FF9BC0"]
                  : ["#FFB8D6", "#FF8FB7"]}
                style={styles.modalIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon
                  name={selectedNotification?.type === "expert_reply" || selectedNotification?.type === "expert"
                    ? "medical"
                    : "sparkles"}
                  size={32}
                  color={colors.white}
                />
              </LinearGradient>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeModal}
              >
                <Icon name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  {selectedNotification?.title || 'Notification'}
                </Text>
                {(selectedNotification?.type === "expert_reply" || selectedNotification?.type === "expert") && (
                  <View style={styles.modalExpertBadge}>
                    <Icon name="shield-checkmark" size={14} color="#FF6EA7" />
                    <Text style={styles.modalExpertBadgeText}>Expert</Text>
                  </View>
                )}
              </View>

              {/* Expert Reply Content */}
              {(selectedNotification?.type === "expert_reply" || selectedNotification?.type === "expert") ? (
                <>
                  {/* Your Question */}
                  <View style={styles.questionSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="help-circle" size={18} color={colors.primary} />
                      <Text style={styles.sectionTitle}>Câu hỏi của bạn</Text>
                    </View>
                    <View style={styles.questionBox}>
                      <Text style={styles.questionText}>
                        {/* TODO: Replace with actual question from API */}
                        Mèo của tôi bị chảy nước mắt và hắt hơi liên tục. Có phải mèo bị cảm không? Tôi cần làm gì?
                      </Text>
                    </View>
                  </View>

                  {/* Expert Answer */}
                  <View style={styles.answerSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="medical" size={18} color="#FF6EA7" />
                      <Text style={styles.sectionTitle}>Câu trả lời từ chuyên gia</Text>
                    </View>
                    <View style={styles.answerBox}>
                      <Text style={styles.answerText}>
                        {selectedNotification?.message || 'No answer available'}
                      </Text>
                    </View>
                  </View>

                  {/* Call to Action */}
                  <View style={styles.ctaSection}>
                    <LinearGradient
                      colors={["#FFF8FB", "#FFF0F5"]}
                      style={styles.ctaBox}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Icon name="chatbubbles" size={24} color={colors.primary} />
                      <Text style={styles.ctaTitle}>
                        Bạn có hài lòng với câu trả lời?
                      </Text>
                      <Text style={styles.ctaSubtitle}>
                        Muốn thảo luận thêm với chuyên gia không?
                      </Text>
                    </LinearGradient>
                  </View>
                </>
              ) : (
                <>
                  {/* Regular Message */}
                  <Text style={styles.modalMessage}>
                    {selectedNotification?.message || 'No message'}
                  </Text>
                </>
              )}

              {/* Time */}
              {selectedNotification?.createdAt && (
                <View style={styles.modalFooter}>
                  <Icon name="time-outline" size={16} color={colors.textLabel} />
                  <Text style={styles.modalTime}>
                    {getTimeAgo(selectedNotification.createdAt)}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {(selectedNotification?.type === "expert_confirmation" || selectedNotification?.type === "expert") ? (
                <>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleChatWithExpert}
                    disabled={creatingChat}
                  >
                    <LinearGradient
                      colors={["#FF6EA7", "#FF9BC0"]}
                      style={styles.modalButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {creatingChat ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <>
                          <Icon name="chatbubbles" size={20} color={colors.white} style={{ marginRight: 8 }} />
                          <Text style={styles.modalButtonText}>Nhắn tin với chuyên gia</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.modalSecondaryButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={closeModal}
                >
                  <LinearGradient
                    colors={["#FF6EA7", "#FF9BC0"]}
                    style={styles.modalButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.modalButtonText}>Đã hiểu</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={hideAlert}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },

  // Filter Tabs - Horizontal Scroll
  filterScroll: {
    maxHeight: 60,
    marginBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "rgba(255, 110, 167, 0.15)",
    gap: 8,
    ...shadows.small,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filterText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMedium,
  },
  filterTextActive: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  filterBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
  },

  // Notification Item
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: radius.xl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: "rgba(255, 110, 167, 0.1)",
  },
  notificationUnread: {
    backgroundColor: "#FFF8FB",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    position: "relative",
    marginRight: 14,
    marginTop: 2,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF3B30",
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationContent: {
    flex: 1,
    paddingTop: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  expertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 110, 167, 0.2)",
  },
  expertBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  notificationMessage: {
    fontSize: 15,
    color: colors.textMedium,
    lineHeight: 22,
    marginBottom: 8,
  },
  notificationMessageBold: {
    fontWeight: "500",
    color: colors.textDark,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 13,
    color: colors.textLabel,
    fontWeight: "500",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 12,
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 110, 167, 0.1)",
  },
  modalIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textDark,
    letterSpacing: -0.5,
    flex: 1,
  },
  modalExpertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 110, 167, 0.2)",
  },
  modalExpertBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textMedium,
    lineHeight: 24,
    marginBottom: 16,
  },

  // Expert Reply Sections
  questionSection: {
    marginBottom: 20,
  },
  answerSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  questionBox: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  questionText: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
    fontStyle: "italic",
  },
  answerBox: {
    backgroundColor: "#FFF8FB",
    padding: 16,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6EA7",
  },
  answerText: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },
  ctaSection: {
    marginBottom: 16,
  },
  ctaBox: {
    padding: 20,
    borderRadius: radius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 110, 167, 0.2)",
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: 12,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 6,
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 110, 167, 0.1)",
  },
  modalTime: {
    fontSize: 14,
    color: colors.textLabel,
    fontWeight: "500",
  },
  modalActions: {
    padding: 20,
    paddingTop: 16,
  },
  modalButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.5,
  },
  modalSecondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
    backgroundColor: colors.whiteWarm,
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textMedium,
  },
});

export default NotificationScreen;
