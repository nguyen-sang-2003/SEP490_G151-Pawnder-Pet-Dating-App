import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, Notification } from "../api/notificationApi";
import { useFocusEffect } from "@react-navigation/native";
import { refreshBadgesForActivePet } from "../../../utils/badgeRefresh";
import signalRService from "../../../services/signalr.service";
import { createOrGetExpertChat } from "../../expert/api/expertChatApi";
import { getUserExpertConfirmations } from "../../expert/api/expertConfirmationApi";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "Notification">;

const NotificationScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const { visible: alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Get time ago string
  const getTimeAgo = (dateString: string): string => {
    // Backend stores time in Vietnam timezone (UTC+7)
    // Parse the date string and treat it as Vietnam local time
    let dateStr = dateString;
    
    // If the date string doesn't have timezone info, treat it as Vietnam time (UTC+7)
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      // Add Vietnam timezone offset (+07:00)
      dateStr = dateStr + '+07:00';
    }
    
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Handle negative seconds (future dates or timezone issues)
    if (seconds < 0) {
      return t('notification.time.justNow');
    }

    if (seconds < 60) return t('notification.time.justNow');
    if (seconds < 3600) return t('notification.time.minutesAgo', { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('notification.time.hoursAgo', { count: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('notification.time.daysAgo', { count: Math.floor(seconds / 86400) });
    return date.toLocaleDateString();
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setLoading(false);
        return;
      }

      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);

      const data = await getNotifications(userId);

      for (const notification of data) {
        if (notification.type === 'expert_confirmation') {
          const mappingKey = `notification_expert_${notification.notificationId}`;
          try {
            const mappingStr = await AsyncStorage.getItem(mappingKey);
            if (mappingStr) {
              const mapping = JSON.parse(mappingStr);
              notification.expertId = mapping.expertId;
              notification.chatId = mapping.chatId;
            }
          } catch (err) {

          }
        }
      }

      // Sort by createdAt descending (newest first)
      const sortedData = data.sort((a, b) => {
        // Backend stores time in Vietnam timezone (UTC+7)
        let dateStrA = a.createdAt || '';
        if (dateStrA && !dateStrA.endsWith('Z') && !dateStrA.includes('+')) {
          dateStrA = dateStrA + '+07:00';
        }
        let dateStrB = b.createdAt || '';
        if (dateStrB && !dateStrB.endsWith('Z') && !dateStrB.includes('+')) {
          dateStrB = dateStrB + '+07:00';
        }
        const dateA = dateStrA ? new Date(dateStrA).getTime() : 0;
        const dateB = dateStrB ? new Date(dateStrB).getTime() : 0;
        return dateB - dateA;
      });

      setNotifications(sortedData);
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

        const handleNewNotification = (data: any) => {
          const newNotification: Notification = {
            notificationId: data.NotificationId || data.notificationId || Date.now(),
            title: data.Title || data.title || t('notification.title'),
            message: data.Message || data.message || '',
            type: data.Type || data.type || 'system',
            isRead: false,
            createdAt: new Date().toISOString(),
            expertId: data.ExpertId || data.expertId,
            chatId: data.ChatId || data.chatId,
          };

          // Thêm notification mới vào đầu danh sách (không cần reload)
          setNotifications(prev => {
            // Kiểm tra trùng lặp
            const exists = prev.some(n => {
              let dateStr = n.createdAt || '';
              if (dateStr && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
                dateStr = dateStr + '+07:00';
              }
              const createdAt = dateStr ? new Date(dateStr).getTime() : 0;
              return n.title === newNotification.title && 
                n.message === newNotification.message &&
                createdAt > Date.now() - 5000;
            });
            
            if (exists) return prev;

            return [newNotification, ...prev];
          });

          // Chỉ lưu mapping cho expert notification, không reload toàn bộ
          if (data.ExpertId && (data.Type === 'expert_confirmation' || data.Type === 'expert_reply')) {
            const mappingKey = `notification_expert_temp_${Date.now()}`;
            const mappingData = {
              expertId: data.ExpertId,
              chatId: data.ChatId,
              timestamp: Date.now()
            };
            AsyncStorage.setItem(mappingKey, JSON.stringify(mappingData)).catch(() => {});
          }

          // Cập nhật badge count
          if (userId) {
            refreshBadgesForActivePet(userId).catch(() => {});
          }
        };

        signalRService.on('NewNotification', handleNewNotification);

        return () => {
          signalRService.off('NewNotification', handleNewNotification);
        };
      } catch (error) {
        // Error setting up SignalR
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
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

      await refreshBadgesForActivePet(currentUserId);
    } catch (error) {

    }
  };

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "expert_reply":
      case "expert":
        return { name: "medical", color: "#FFFFFF" };
      case "system":
        return { name: "sparkles", color: "#FFFFFF" };
      case "appointment_invite":
      case "appointment_accepted":
      case "appointment_rejected":
      case "appointment_cancelled":
      case "appointment_counter_offer":
      case "appointment_ongoing":
        return { name: "calendar", color: "#FFFFFF" };
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
      case "appointment_invite":
        return ["#4CAF50", "#66BB6A"]; // Green for invite
      case "appointment_accepted":
        return ["#2196F3", "#42A5F5"]; // Blue for accepted
      case "appointment_rejected":
      case "appointment_cancelled":
        return ["#FF5252", "#FF8A80"]; // Red for rejected/cancelled
      case "appointment_counter_offer":
        return ["#FF9800", "#FFB74D"]; // Orange for counter offer
      case "appointment_ongoing":
        return ["#9C27B0", "#BA68C8"]; // Purple for ongoing
      default:
        return ["#FFB8D6", "#FF8FB7"];
    }
  }, []);

  // Check if notification is appointment related
  const isAppointmentNotification = useCallback((type: string) => {
    return type?.startsWith('appointment_');
  }, []);

  // Check if notification is event-related
  const isEventNotification = useCallback((type: string | null | undefined) => {
    return type?.startsWith('event_');
  }, []);

  const handleNotificationPress = async (item: Notification) => {
    // Mark as read first
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
        // Silent fail
      }
    }

    // Navigate based on notification type
    if (isEventNotification(item.type)) {
      // Navigate to Event List for event notifications
      navigation.navigate('EventList');
      return;
    }

    // Show modal for other notification types
    setSelectedNotification(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  // Handle delete notification (from modal)
  const handleDeleteNotification = async () => {
    if (!selectedNotification || !currentUserId) return;

    try {
      setDeleting(true);
      await deleteNotification(selectedNotification.notificationId);
      
      // Remove from local state
      setNotifications(prev => 
        prev.filter(n => n.notificationId !== selectedNotification.notificationId)
      );
      
      // Refresh badge count
      await refreshBadgesForActivePet(currentUserId);
      
      closeModal();
      
      showAlert({
        type: 'success',
        title: t('alerts.success'),
        message: t('notification.deleteSuccess') || 'Đã xóa thông báo'
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('alerts.error'),
        message: error.message || t('notification.deleteError') || 'Không thể xóa thông báo'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle delete notification directly (long press)
  const handleDirectDelete = useCallback((item: Notification) => {
    setDeleteTarget(item);
  }, []);

  // Execute delete after confirm
  const executeDelete = async () => {
    if (!deleteTarget || !currentUserId) return;
    
    try {
      setDeletingId(deleteTarget.notificationId);
      setDeleteTarget(null);
      
      await deleteNotification(deleteTarget.notificationId);
      
      // Remove from local state
      setNotifications(prev => 
        prev.filter(n => n.notificationId !== deleteTarget.notificationId)
      );
      
      // Refresh badge count
      await refreshBadgesForActivePet(currentUserId);
      
      showAlert({
        type: 'success',
        title: t('alerts.success'),
        message: t('notification.deleteSuccess') || 'Đã xóa thông báo'
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('alerts.error'),
        message: error.message || t('notification.deleteError') || 'Không thể xóa thông báo'
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle chat with expert
  const handleChatWithExpert = async () => {
    if (!selectedNotification || !currentUserId) {
      showAlert({
        type: 'error',
        title: t('alerts.error'),
        message: t('notification.errors.createChatFailed')
      });
      return;
    }

    try {
      setCreatingChat(true);
      let expertId = selectedNotification.expertId;

      if (!expertId) {
        try {
          const confirmations = await getUserExpertConfirmations(currentUserId);

          if (confirmations.length === 0) {
            throw new Error('Không tìm thấy yêu cầu xác nhận nào.');
          }

          let notifDateStr = selectedNotification.createdAt || '';
          if (notifDateStr && !notifDateStr.endsWith('Z') && !notifDateStr.includes('+')) {
            notifDateStr = notifDateStr + '+07:00';
          }
          const notificationTime = notifDateStr ? new Date(notifDateStr).getTime() : 0;

          let matchingConfirmation = confirmations.find(c => {
            if (c.status?.toLowerCase() !== 'confirmed') return false;
            let confirmDateStr = c.updatedAt || '';
            if (confirmDateStr && !confirmDateStr.endsWith('Z') && !confirmDateStr.includes('+')) {
              confirmDateStr = confirmDateStr + '+07:00';
            }
            const confirmTime = confirmDateStr ? new Date(confirmDateStr).getTime() : 0;
            const timeDiff = Math.abs(confirmTime - notificationTime);
            return timeDiff < 5000;
          });

          if (!matchingConfirmation) {
            matchingConfirmation = confirmations
              .filter(c => c.status?.toLowerCase() === 'confirmed')
              .sort((a, b) => {
                let dateStrA = a.updatedAt || '';
                if (dateStrA && !dateStrA.endsWith('Z') && !dateStrA.includes('+')) {
                  dateStrA = dateStrA + '+07:00';
                }
                let dateStrB = b.updatedAt || '';
                if (dateStrB && !dateStrB.endsWith('Z') && !dateStrB.includes('+')) {
                  dateStrB = dateStrB + '+07:00';
                }
                const dateA = dateStrA ? new Date(dateStrA).getTime() : 0;
                const dateB = dateStrB ? new Date(dateStrB).getTime() : 0;
                return dateB - dateA;
              })[0];
          }

          if (matchingConfirmation) {
            expertId = matchingConfirmation.expertId;

            const mappingKey = `notification_expert_${selectedNotification.notificationId}`;
            const mappingData = {
              expertId: expertId,
              chatId: matchingConfirmation.chatAiId,
              timestamp: Date.now()
            };
            await AsyncStorage.setItem(mappingKey, JSON.stringify(mappingData));
          }
        } catch (err) {

        }
      }

      if (!expertId) {
        showAlert({
          type: 'error',
          title: t('alerts.error'),
          message: t('notification.errors.createChatFailed')
        });

        return;
      }

      const chatResponse = await createOrGetExpertChat(expertId, currentUserId);

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
        title: t('alerts.error'),
        message: error.message || t('notification.errors.createChatFailed')
      });
    } finally {
      setCreatingChat(false);
    }
  };

  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    const type = item.type || 'system';
    const iconConfig = getNotificationIcon(type);
    const bgColors = getNotificationBgColor(type);
    const timeAgo = item.createdAt ? getTimeAgo(item.createdAt) : 'Unknown';
    const isUnread = !item.isRead;
    const isDeleting = deletingId === item.notificationId;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.notificationUnread,
          isDeleting && styles.notificationDeleting,
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleDirectDelete(item)}
        delayLongPress={500}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        {isDeleting && (
          <View style={styles.deletingOverlay}>
            <ActivityIndicator size="small" color="#FF3B30" />
          </View>
        )}
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
              {item.title || t('notification.title')}
            </Text>
            {type === "expert_reply" || type === "expert" ? (
              <View style={styles.expertBadge}>
                <Icon name="shield-checkmark" size={12} color="#FF6EA7" />
                <Text style={styles.expertBadgeText}>{t('badges.expert')}</Text>
              </View>
            ) : type?.startsWith('appointment_') ? (
              <View style={[styles.expertBadge, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="calendar" size={12} color="#4CAF50" />
                <Text style={[styles.expertBadgeText, { color: '#4CAF50' }]}>Lịch hẹn</Text>
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
            {item.message || t('common.noData')}
          </Text>
          <View style={styles.notificationFooter}>
            <Icon name="time-outline" size={14} color={colors.textLabel} />
            <Text style={styles.notificationTime}>{timeAgo}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [getNotificationIcon, getNotificationBgColor, handleNotificationPress, handleDirectDelete, deletingId]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterType === "all") return true;
      if (filterType === "unread") return !n.isRead;
      if (filterType === "system") return n.type === "system";
      if (filterType === "expert") return n.type === "expert_reply" || n.type === "expert" || n.type === "expert_confirmation";
      if (filterType === "appointment") return n.type?.startsWith('appointment_');
      return true;
    });
  }, [notifications, filterType]);

  const unreadCount = useMemo(() =>
    notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filterTabs = useMemo(() => [
    { id: "all", label: t('notification.filter.all'), icon: "apps" },
    { id: "unread", label: t('notification.filter.unread'), icon: "mail-unread", badge: unreadCount },
    { id: "appointment", label: "Lịch hẹn", icon: "calendar" },
    { id: "system", label: t('notification.filter.system'), icon: "notifications" },
    { id: "expert", label: t('notification.filter.expert'), icon: "medical" },
  ], [unreadCount, t]);

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
          <Text style={styles.loadingText}>{t('notification.loading')}</Text>
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
            <Text style={styles.headerTitle}>{t('notification.title')}</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {unreadCount} {t('notification.filter.unread').toLowerCase()}
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
          // FlatList performance props
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
            {t(`notification.empty.${filterType}.title`)}
          </Text>
          <Text style={styles.emptySubtext}>
            {t(`notification.empty.${filterType}.message`)}
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
                  {selectedNotification?.title || t('notification.title')}
                </Text>
                {(selectedNotification?.type === "expert_reply" || selectedNotification?.type === "expert") && (
                  <View style={styles.modalExpertBadge}>
                    <Icon name="shield-checkmark" size={14} color="#FF6EA7" />
                    <Text style={styles.modalExpertBadgeText}>{t('badges.expert')}</Text>
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
                      <Text style={styles.sectionTitle}>{t('notification.modal.yourQuestion')}</Text>
                    </View>
                    <View style={styles.questionBox}>
                      <Text style={styles.questionText}>
                        {/* TODO: Replace with actual question from API */}
                        {t('notification.modal.yourQuestion')}
                      </Text>
                    </View>
                  </View>

                  {/* Expert Answer */}
                  <View style={styles.answerSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="medical" size={18} color="#FF6EA7" />
                      <Text style={styles.sectionTitle}>{t('notification.modal.expertAnswer')}</Text>
                    </View>
                    <View style={styles.answerBox}>
                      <Text style={styles.answerText}>
                        {selectedNotification?.message || t('fallback.noAnswer')}
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
                        {t('notification.modal.satisfaction')}
                      </Text>
                      <Text style={styles.ctaSubtitle}>
                        {t('notification.modal.discussMore')}
                      </Text>
                    </LinearGradient>
                  </View>
                </>
              ) : (
                <>
                  {/* Regular Message */}
                  <Text style={styles.modalMessage}>
                    {selectedNotification?.message || t('common.noData')}
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
                          <Text style={styles.modalButtonText}>{t('notification.modal.chatWithExpert')}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.modalSecondaryButtonText}>{t('notification.modal.close')}</Text>
                  </TouchableOpacity>
                </>
              ) : isAppointmentNotification(selectedNotification?.type || '') ? (
                <>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      closeModal();
                      navigation.navigate('MyAppointments');
                    }}
                  >
                    <LinearGradient
                      colors={["#4CAF50", "#66BB6A"]}
                      style={styles.modalButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Icon name="calendar" size={20} color={colors.white} style={{ marginRight: 8 }} />
                      <Text style={styles.modalButtonText}>{t('notification.viewAppointment') || 'Xem lịch hẹn'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSecondaryButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.modalSecondaryButtonText}>{t('notification.modal.close')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.modalSecondaryButton}
                  onPress={closeModal}
                >
                  <Text style={styles.modalSecondaryButtonText}>{t('notification.modal.close')}</Text>
                </TouchableOpacity>
              )}

              {/* Delete Button - Subtle at bottom */}
              <TouchableOpacity
                style={styles.deleteButtonSubtle}
                onPress={handleDeleteNotification}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#999" />
                ) : (
                  <>
                    <Icon name="trash-outline" size={16} color="#999" />
                    <Text style={styles.deleteButtonSubtleText}>{t('notification.delete') || 'Xóa thông báo'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirm Alert */}
      <CustomAlert
        visible={deleteTarget !== null}
        type="warning"
        title={t('notification.deleteConfirmTitle') || 'Xóa thông báo'}
        message={t('notification.deleteConfirmMessage') || 'Bạn có chắc muốn xóa thông báo này?'}
        showCancel={true}
        confirmText={t('notification.delete') || 'Xóa'}
        onConfirm={executeDelete}
        onClose={() => setDeleteTarget(null)}
      />

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
  notificationDeleting: {
    opacity: 0.6,
  },
  deletingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: radius.xl,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.2)",
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF3B30",
  },
  deleteButtonSubtle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 8,
    gap: 6,
  },
  deleteButtonSubtleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
  },
});

export default NotificationScreen;
