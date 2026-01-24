import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";
import { refreshBadgesForActivePet } from "../../../utils/badgeRefresh";
import { getChats, getChatMessages, getUserById, ChatUser, ChatMessage } from "../../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import signalRService from "../../../services/signalr.service";
import { getUserPetAvatar, getPetAvatar } from "../../../utils/petAvatar";
import { useDispatch, useSelector } from "react-redux";
import { selectUnreadChats, selectActivePetId, selectExpertChatBadge, selectTotalChatBadge } from "../../badge/badgeSlice";
import { AppDispatch } from "../../../app/store";
import { getVipStatus } from "../../payment/api/paymentApi";
import { getPetsByUserId, getPetById } from "../../pet/api/petApi";
import { cache, CACHE_KEYS, CACHE_TTL, invalidateCache } from "../../../services/cache";
import { ChatSkeleton } from "../components/ChatSkeleton";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

interface ChatItem {
  id: string;            // matchId
  matchId: number;       // actual matchId number
  otherUserId: number;   // ID of the other user
  name: string;
  lastMessage: string;
  time: string;
  lastMessageTime: string; // For sorting - timestamp of last message
  matchCreatedAt: string; // For sorting - when match was created
  unread: number;
  avatar: any;
  isAI?: boolean;
  isVip?: boolean;       // VIP status of other user
}

const ChatScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const unreadChats = useSelector(selectUnreadChats); // Get list of unread matchIds
  const expertChatBadge = useSelector(selectExpertChatBadge); // Get expert chat badge count
  const totalChatBadge = useSelector(selectTotalChatBadge); // Get total badge (user + expert)
  const activePetId = useSelector(selectActivePetId); // Get current active pet ID
  const [searchQuery, setSearchQuery] = useState("");
  const [chatData, setChatData] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  // Setup SignalR connection once
  useEffect(() => {
    setupSignalR();

    return () => {
      // Don't disconnect on unmount, keep connection alive
      // signalRService.disconnect();
    };
  }, []);

  // Reload chats when activePetId changes
  useEffect(() => {
    if (activePetId !== null) {
      loadChats(true);
    }
  }, [activePetId]);

  // Load chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChats();
      refreshOnlineUsers();

      const refreshBadges = async () => {
        try {
          const userIdStr = await AsyncStorage.getItem('userId');
          if (userIdStr) {
            const userId = parseInt(userIdStr);
            await refreshBadgesForActivePet(userId, true);
          }
        } catch (error) {
          // Failed to refresh badges
        }
      };
      
      refreshBadges();
    }, [])
  );

  const setupSignalR = async () => {
    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) return;

      const userId = parseInt(userIdStr);

      if (!signalRService.isConnected()) {
        await signalRService.connect(userId);
      }

      signalRService.on('UserOnline', handleUserOnline);
      signalRService.on('UserOffline', handleUserOffline);
      signalRService.on('ReceiveMessage', handleNewMessage);
      signalRService.on('MatchDeleted', handleMatchDeleted);

      const online = await signalRService.getOnlineUsers();
      setOnlineUsers(new Set(online));
    } catch (error) {

    }
  };

  const handleUserOnline = (userId: number) => {
    setOnlineUsers(prev => new Set([...prev, userId]));
  };

  const handleUserOffline = (userId: number) => {
    setOnlineUsers(prev => {
      const updated = new Set(prev);
      updated.delete(userId);
      return updated;
    });
  };

  const handleNewMessage = (data: any) => {
    const matchId = data.MatchId || data.matchId;
    const message = data.Message || data.message;
    const fromUserId = data.FromUserId || data.fromUserId;
    const createdAt = data.CreatedAt || data.createdAt || new Date().toISOString();
    
    if (!matchId) {
      return;
    }

    setChatData(prevChats => {
      const chatIndex = prevChats.findIndex(chat => chat.matchId === matchId);
      
      if (chatIndex === -1) {
        loadChats(true);
        return prevChats;
      }
      
      const updatedChats = [...prevChats];
      const chat = updatedChats[chatIndex];
      
      const formatTime = (dateString: string): string => {
        let dateStr = dateString;
        if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
          dateStr = dateStr + 'Z';
        }
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Now';
        if (diffMins < 60) return `${diffMins}m`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        return `${Math.floor(diffHours / 24)}d`;
      };
      
      const updatedChat = {
        ...chat,
        lastMessage: message || 'New message',
        time: formatTime(createdAt),
        lastMessageTime: createdAt,
        unread: fromUserId !== currentUserId ? (chat.unread || 0) + 1 : chat.unread,
      };
      
      updatedChats.splice(chatIndex, 1);
      updatedChats.unshift(updatedChat);
      
      updatedChats.sort((a, b) => {
        const timeA = a.lastMessageTime || a.matchCreatedAt;
        const timeB = b.lastMessageTime || b.matchCreatedAt;
        
        let dateStrA = timeA;
        if (!dateStrA.endsWith('Z') && !dateStrA.includes('+')) {
          dateStrA = dateStrA + 'Z';
        }
        const dateA = new Date(dateStrA);
        
        let dateStrB = timeB;
        if (!dateStrB.endsWith('Z') && !dateStrB.includes('+')) {
          dateStrB = dateStrB + 'Z';
        }
        const dateB = new Date(dateStrB);
        
        return dateB.getTime() - dateA.getTime();
      });
      
      return updatedChats;
    });

    if (currentUserId) {
      invalidateCache.chats(currentUserId);
    }
  };

  const handleMatchDeleted = (data: any) => {
    const matchId = data.matchId || data.MatchId;
    
    if (matchId) {
      setChatData(prevChats => prevChats.filter(chat => chat.matchId !== matchId));
      
      if (currentUserId) {
        invalidateCache.chats(currentUserId);
      }
    }
  };

  const refreshOnlineUsers = async () => {
    try {
      if (signalRService.isConnected()) {
        const online = await signalRService.getOnlineUsers();
        setOnlineUsers(new Set(online));
      }
    } catch (error) {

    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadChats(true),
      refreshOnlineUsers(),
    ]);
    setRefreshing(false);
  };

  const loadChats = async (forceRefresh = false) => {
    try {
      setLoading(true);

      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setLoading(false);
        return;
      }

      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);

      // Get user's active pet ID with cache
      let activePetId: number | undefined;
      try {
        const userPets = await cache.getOrFetch(
          CACHE_KEYS.USER_PETS(userId),
          () => getPetsByUserId(userId),
          CACHE_TTL.MEDIUM
        );
        const activePet = userPets.find(p => p.IsActive === true || p.isActive === true);
        if (activePet) {
          activePetId = activePet.PetId || activePet.petId;
        }
      } catch (error) {
        // Could not get active pet
      }

      // Check cache first (unless force refresh)
      const cacheKey = CACHE_KEYS.CHATS(userId, activePetId);
      if (!forceRefresh) {
        const cachedChats = cache.get<ChatItem[]>(cacheKey, CACHE_TTL.SHORT);
        if (cachedChats) {
          setChatData(cachedChats);
          setLoading(false);
          return;
        }
      }

      const chats = await getChats(userId, activePetId);

      const chatItems = await Promise.all(
        chats.map(async (chat) => {
          const otherUserId = chat.fromUserId === userId ? chat.toUserId : chat.fromUserId;
          const otherPetId = chat.fromUserId === userId ? chat.toPetId : chat.fromPetId;

          try {
            // Get pet name instead of user name for privacy
            let petName = t('fallback.unknown');
            if (otherPetId) {
              try {
                const petData = await getPetById(otherPetId);
                petName = petData.name || t('fallback.unknown');
              } catch (error) {
                // Use fallback
              }
            }

            const userAvatar = otherPetId
              ? await getPetAvatar(otherPetId)
              : await getUserPetAvatar(otherUserId);

            let isVip = false;
            try {
              const vipStatus = await getVipStatus(otherUserId);
              isVip = vipStatus.isVip;
            } catch (error: any) {

            }

            let lastMessage = t('chat.startConversation');
            let lastMessageTime = chat.createdAt;

            try {
              const messages = await getChatMessages(chat.matchId);
              if (messages && messages.length > 0) {
                const last = messages[messages.length - 1];
                lastMessage = last.message;
                lastMessageTime = last.createdAt;
              }
            } catch (error) {
              // No messages yet
            }

            return {
              id: chat.matchId.toString(),
              matchId: chat.matchId,
              otherUserId: otherUserId,
              name: petName, // Show pet name instead of owner name
              lastMessage: lastMessage,
              time: formatTime(lastMessageTime),
              lastMessageTime: lastMessageTime,
              matchCreatedAt: chat.createdAt,
              unread: 0,
              avatar: userAvatar,
              isVip: isVip,
            } as ChatItem;
          } catch (error) {

            return null;
          }
        })
      );

      const validChats = chatItems.filter((item): item is ChatItem => item !== null);

      const sortedChats = validChats.sort((a, b) => {
        let dateA: Date, dateB: Date;
        
        const timeA = a.lastMessageTime || a.matchCreatedAt;
        const timeB = b.lastMessageTime || b.matchCreatedAt;
        
        let dateStrA = timeA;
        if (!dateStrA.endsWith('Z') && !dateStrA.includes('+')) {
          dateStrA = dateStrA + 'Z';
        }
        dateA = new Date(dateStrA);
        
        let dateStrB = timeB;
        if (!dateStrB.endsWith('Z') && !dateStrB.includes('+')) {
          dateStrB = dateStrB + 'Z';
        }
        dateB = new Date(dateStrB);
        
        return dateB.getTime() - dateA.getTime();
      });

      // Cache the result
      cache.set(cacheKey, sortedChats);

      setChatData(sortedChats);

    } catch (error: any) {

    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string): string => {
    // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
    let dateStr = dateString;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr = dateStr + 'Z';
    }

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return diffDays === 1 ? t('chat.time.yesterday') : t('chat.time.daysAgo', { count: diffDays });
    }

    if (diffHours > 0) {
      return t('chat.time.hoursAgo', { count: diffHours });
    }

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins > 0) {
      return t('chat.time.minutesAgo', { count: diffMins });
    }

    return t('chat.time.justNow');
  };

  const filteredChats = chatData
    .filter(chat =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(chat => {
      if (activeFilter === 'unread') {
        return unreadChats.includes(chat.matchId);
      }
      return true;
    });

  const handleChatPress = (item: ChatItem) => {
    if (item.isAI) {
      navigation.navigate("AIChatList");
    } else {
      navigation.navigate("ChatDetail", {
        matchId: item.matchId,
        otherUserId: item.otherUserId,
        userName: item.name,
        userAvatar: item.avatar,
      });
    }
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => {
    const isOnline = onlineUsers.has(item.otherUserId);
    const isUnread = unreadChats.includes(item.matchId); // Check if this chat is unread

    return (
      <TouchableOpacity
        style={[styles.chatItem, isUnread && styles.chatItemUnread]}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={item.isAI ? gradients.ai : gradients.chat}
            style={styles.avatarGradient}
          >
            <Image source={item.avatar} style={styles.avatar} />
          </LinearGradient>
          {item.isAI ? (
            <View style={styles.aiBadge}>
              <Icon name="sparkles" size={12} color={colors.white} />
            </View>
          ) : isOnline && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <View style={styles.chatNameContainer}>
              <Text style={[styles.chatName, isUnread && styles.chatNameUnread]}>{item.name}</Text>
              {item.isVip && (
                <View style={styles.vipBadgeChat}>
                  <Icon name="diamond" size={12} color="#FFD700" />
                </View>
              )}
            </View>
            <Text style={styles.chatTime}>{item.time}</Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {isUnread && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dating App Style Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <LinearGradient
            colors={gradients.chat}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIconGradient}
          >
            <Icon name="chatbubbles" size={22} color={colors.white} />
          </LinearGradient>
          <Text style={styles.headerTitle}>{t('chat.title')}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textMedium} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('chat.searchPlaceholder')}
          placeholderTextColor={colors.textLabel}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="close-circle" size={20} color={colors.textMedium} />
          </TouchableOpacity>
        )}
      </View>

      {/* Special Chat Options */}
      <View style={styles.specialChatsContainer}>
        {/* AI Chat Option */}
        <TouchableOpacity
          style={styles.specialChatCard}
          onPress={() => navigation.navigate("AIChatList")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradients.ai}
            style={styles.specialChatGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.specialChatIconContainer}>
              <Icon name="sparkles" size={24} color={colors.white} />
            </View>
            <Text style={styles.specialChatTitle}>{t('chat.specialChat.aiTitle')}</Text>
            <Text style={styles.specialChatSubtitle}>{t('chat.specialChat.aiSubtitle')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Expert Chat Option */}
        <TouchableOpacity
          style={styles.specialChatCard}
          onPress={() => navigation.navigate("ExpertChatList")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#4CAF50", "#66BB6A"]}
            style={styles.specialChatGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.specialChatIconContainer}>
              <Icon name="medical" size={24} color={colors.white} />
            </View>
            <Text style={styles.specialChatTitle}>{t('chat.specialChat.expertTitle')}</Text>
            <Text style={styles.specialChatSubtitle}>{t('chat.specialChat.expertSubtitle')}</Text>
            {expertChatBadge > 0 && (
              <View style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: '#FF4444',
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 6,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.white,
                }}>
                  {expertChatBadge > 99 ? '99+' : expertChatBadge}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            {t('chat.filter.all')}
          </Text>
          {totalChatBadge > 0 && (
            <View style={[styles.filterBadge, activeFilter === 'all' && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, activeFilter === 'all' && styles.filterBadgeTextActive]}>
                {totalChatBadge}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'unread' && styles.filterTabActive]}
          onPress={() => setActiveFilter('unread')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterText, activeFilter === 'unread' && styles.filterTextActive]}>
            {t('chat.filter.unread')}
          </Text>
          {unreadChats.length > 0 && (
            <View style={[styles.filterBadge, activeFilter === 'unread' && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, activeFilter === 'unread' && styles.filterBadgeTextActive]}>
                {unreadChats.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ChatSkeleton />
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {searchQuery.length > 0 ? (
                <>
                  <Icon name="search-outline" size={64} color={colors.textLabel} />
                  <Text style={styles.emptyTitle}>{t('chat.noSearchResults')}</Text>
                  <Text style={styles.emptyText}>
                    {t('chat.noSearchResultsDesc')}
                  </Text>
                </>
              ) : (
                <>
                  <Icon name="chatbubbles-outline" size={64} color={colors.textLabel} />
                  <Text style={styles.emptyTitle}>{t('chat.noChats')}</Text>
                  <Text style={styles.emptyText}>
                    {t('chat.noChatsDesc')}
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav active="Chat" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFC", // Consistent with HomeScreen
    paddingTop: 50,
  },

  // Dating App Style Header
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.medium,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // Search Bar - Enhanced
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(255, 154, 118, 0.2)",
    ...shadows.small,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    padding: 0,
  },

  // AI Chat Card
  aiChatCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.large,
  },
  aiChatGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  aiChatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiChatContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiChatText: {
    flex: 1,
  },
  aiChatTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
  },
  aiChatSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },

  // Special Chats Container (AI + Expert)
  specialChatsContainer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  specialChatCard: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.large,
  },
  specialChatGradient: {
    padding: 18,
    minHeight: 120,
    justifyContent: "space-between",
  },
  specialChatIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  specialChatTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  specialChatSubtitle: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
    fontWeight: "500",
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.whiteWarm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
  },
  filterTextActive: {
    color: colors.primary,
  },
  filterBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: colors.primary,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMedium,
  },
  filterBadgeTextActive: {
    color: colors.white,
  },

  // Chat Item - Card Style
  chatItem: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,110,167,0.08)",
    shadowColor: "#29B6F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: {
    marginRight: 14,
    position: "relative",
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#29B6F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  aiBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.aiPrimary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.whiteWarm,
    shadowColor: colors.aiPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  onlineBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.whiteWarm,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.whiteWarm,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  chatInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  vipBadgeChat: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  chatTime: {
    fontSize: 12,
    color: colors.textMedium,
  },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.textMedium,
  },
  unreadBadge: {
    backgroundColor: "#29B6F6",
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
    shadowColor: "#29B6F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },

  // Unread chat styles (Messenger-like)
  chatItemUnread: {
    backgroundColor: colors.white, // Slightly different background
    borderWidth: 2,
    borderColor: "rgba(41, 182, 246, 0.3)", // Blue highlight
  },
  chatNameUnread: {
    fontWeight: "700", // Bold for unread
    color: colors.textDark,
  },
  lastMessageUnread: {
    fontWeight: "600", // Semi-bold for unread
    color: colors.textDark,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#29B6F6",
    marginLeft: 8,
    shadowColor: "#29B6F6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 12,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ChatScreen;

