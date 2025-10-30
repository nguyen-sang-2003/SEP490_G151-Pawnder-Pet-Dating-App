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
import { RootStackParamList } from "../../../navigation/AppNavigator";
import BottomNav from "../../../components/BottomNav";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getChats, getChatMessages, getUserById, ChatUser, ChatMessage } from "../../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import signalRService from "../../../services/signalr.service";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

interface ChatItem {
  id: string;            // matchId
  matchId: number;       // actual matchId number
  otherUserId: number;   // ID of the other user
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: any;
  isAI?: boolean;
}

const ChatScreen = ({ navigation }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatData, setChatData] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  // Setup SignalR connection once
  useEffect(() => {
    setupSignalR();
    
    return () => {
      // Don't disconnect on unmount, keep connection alive
      // signalRService.disconnect();
    };
  }, []);

  // Load chats when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChats();
      refreshOnlineUsers();
    }, [])
  );

  const setupSignalR = async () => {
    try {
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) return;
      
      const userId = parseInt(userIdStr);
      
      // Connect to SignalR if not connected
      if (!signalRService.isConnected()) {
        await signalRService.connect(userId);
      }
      
      // Listen for online/offline events
      signalRService.on('UserOnline', handleUserOnline);
      signalRService.on('UserOffline', handleUserOffline);
      signalRService.on('ReceiveMessage', handleNewMessage);
      
      // Get initial online users
      const online = await signalRService.getOnlineUsers();
      setOnlineUsers(new Set(online));
      
      console.log('✅ SignalR setup complete in ChatScreen');
    } catch (error) {
      console.error('❌ Error setting up SignalR:', error);
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
    // Reload chats to update last message
    loadChats();
  };

  const refreshOnlineUsers = async () => {
    try {
      if (signalRService.isConnected()) {
        const online = await signalRService.getOnlineUsers();
        setOnlineUsers(new Set(online));
      }
    } catch (error) {
      console.error('❌ Error refreshing online users:', error);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      
      // Get current user ID
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        console.log('❌ No userId found');
        setLoading(false);
        return;
      }
      
      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);
      console.log('👤 Current user:', userId);
      
      // Get accepted matches (chats)
      const chats = await getChats(userId);
      console.log('💬 Got chats:', chats);
      
      // For each chat, get the other user's info and last message
      const chatItems = await Promise.all(
        chats.map(async (chat) => {
          // Determine the other user ID
          const otherUserId = chat.fromUserId === userId ? chat.toUserId : chat.fromUserId;
          
          try {
            // Get other user's info
            const otherUser = await getUserById(otherUserId);
            
            // Get last message
            let lastMessage = "Start chatting!";
            let lastMessageTime = chat.createdAt;
            
            try {
              const messages = await getChatMessages(chat.matchId);
              if (messages && messages.length > 0) {
                const last = messages[messages.length - 1];
                lastMessage = last.message;
                lastMessageTime = last.createdAt;
              }
            } catch (error) {
              console.log('No messages yet for match:', chat.matchId);
            }
            
            return {
              id: chat.matchId.toString(),
              matchId: chat.matchId,
              otherUserId: otherUserId,
              name: otherUser.fullName || 'Unknown',
              lastMessage: lastMessage,
              time: formatTime(lastMessageTime),
              unread: 0, // Unread count requires DB changes - keep simple for now
              avatar: require("../../../assets/cat_avatar.png"), // TODO: Use user's actual avatar
            } as ChatItem;
          } catch (error) {
            console.error('Error loading user/messages for chat:', chat.matchId, error);
            return null;
          }
        })
      );
      
      // Filter out null values and set state
      const validChats = chatItems.filter((item): item is ChatItem => item !== null);
      setChatData(validChats);
      
    } catch (error: any) {
      console.error('❌ Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays}d ago`;
    }
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins > 0) {
      return `${diffMins}m ago`;
    }
    
    return 'Just now';
  };

  const filteredChats = chatData.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatPress = (item: ChatItem) => {
    if (item.isAI) {
      navigation.navigate("AIChatList");
    } else {
      console.log('🗨️ Opening chat:', item);
      navigation.navigate("ChatDetail", {
        matchId: item.matchId,
        otherUserId: item.otherUserId,
        userName: item.name,
        userAvatar: item.avatar,
      });
    }
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.avatarWrapper}>
        <LinearGradient
          colors={item.isAI ? ["#667EEA", "#764BA2"] : gradients.primary}
          style={styles.avatarGradient}
        >
          <Image source={item.avatar} style={styles.avatar} />
        </LinearGradient>
        {item.isAI && (
          <View style={styles.aiBadge}>
            <Icon name="sparkles" size={12} color={colors.white} />
          </View>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textMedium} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
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

      {/* AI Chat Option - Highlighted */}
      <TouchableOpacity 
        style={styles.aiChatCard}
        onPress={() => navigation.navigate("AIChatList")}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          style={styles.aiChatGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.aiChatIconContainer}>
            <Icon name="sparkles" size={24} color={colors.white} />
          </View>
          <View style={styles.aiChatContent}>
            <View style={styles.aiChatText}>
              <Text style={styles.aiChatTitle}>Chat with AI</Text>
              <Text style={styles.aiChatSubtitle}>
                Get instant pet care advice
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Chat List */}
      <View style={styles.chatListHeader}>
        <Text style={styles.sectionTitle}>Recent Chats</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {searchQuery.length > 0 ? (
                <>
                  <Icon name="search-outline" size={64} color={colors.textLabel} />
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptyText}>
                    Try searching for a different name or message
                  </Text>
                </>
              ) : (
                <>
                  <Icon name="chatbubbles-outline" size={64} color={colors.textLabel} />
                  <Text style={styles.emptyTitle}>No chats yet</Text>
                  <Text style={styles.emptyText}>
                    Match with other pet owners to start chatting!
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav active="Chat" />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
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
    marginBottom: 20,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.medium,
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

  // Chat List
  chatListHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
  },

  // Chat Item
  chatItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: radius.md,
    ...shadows.small,
  },
  avatarWrapper: {
    marginRight: 12,
    position: "relative",
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  aiBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#9C27B0",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.whiteWarm,
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
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
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
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
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

