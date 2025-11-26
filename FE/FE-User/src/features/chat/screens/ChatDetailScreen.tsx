import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getChatMessages, sendMessage, deleteChat, ChatMessage, blockUser, reportMessage, getUserById, getPetsByUserId } from "../../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";
import signalRService from "../../../services/signalr.service";
import { getUserPetAvatar } from "../../../utils/petAvatar";
import ReportMessageModal from "../../../components/ReportMessageModal";
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../app/store';
import { markChatAsRead } from '../../badge/badgeSlice';
import OptimizedImage from "../../../components/OptimizedImage";

const { width, height } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "ChatDetail">;

interface Message {
  id: string;
  text: string;
  isMe: boolean;
  timestamp: Date;
  status?: "sending" | "sent" | "read";
  contentId?: number; // Backend ID for reporting
}

const ChatDetailScreen = ({ navigation, route }: Props) => {
  const { matchId, otherUserId, userName: initialUserName, userAvatar } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [myAvatar, setMyAvatar] = useState<any>(require("../../../assets/cat_avatar.png"));
  const [otherUserAvatar, setOtherUserAvatar] = useState<any>(require("../../../assets/cat_avatar.png"));
  const [userName, setUserName] = useState<string>(initialUserName || "Loading...");
  const flatListRef = useRef<FlatList>(null);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserIdRef = useRef<number | null>(null);
  
  // Keep ref updated
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Fetch user info if not provided
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!initialUserName || initialUserName === "Someone" || initialUserName === "undefined") {
        try {
          console.log('📱 Fetching user info for userId:', otherUserId);
          const userInfo = await getUserById(otherUserId);
          setUserName(userInfo.fullName || "User");
          console.log('✅ User info loaded:', userInfo.fullName);
        } catch (error) {
          console.error('❌ Error fetching user info:', error);
          setUserName("User");
        }
      }
    };

    fetchUserInfo();
  }, [otherUserId, initialUserName]);
  
  // Typing animation
  const typingAnim1 = useRef(new Animated.Value(0)).current;
  const typingAnim2 = useRef(new Animated.Value(0)).current;
  const typingAnim3 = useRef(new Animated.Value(0)).current;

  // Animate typing dots
  useEffect(() => {
    if (isTyping) {
      const createAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createAnimation(typingAnim1, 0);
      const anim2 = createAnimation(typingAnim2, 200);
      const anim3 = createAnimation(typingAnim3, 400);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    }
  }, [isTyping]);
  
  // Setup SignalR connection and listeners
  useEffect(() => {
    setupSignalR();
    
    return () => {
      cleanupSignalR();
    };
  }, [matchId]);
  
  // Load messages when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMessages();
      // Mark this chat as read (remove from unread list)
      dispatch(markChatAsRead(matchId));
    }, [matchId, dispatch])
  );
  
  const setupSignalR = async () => {
    try {
      console.log('🔧 [setupSignalR] Starting setup...');
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        console.log('❌ [setupSignalR] No userId found');
        return;
      }
      
      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);
      console.log('👤 [setupSignalR] Current user ID:', userId);
      console.log('💬 [setupSignalR] Match ID:', matchId);
      console.log('👥 [setupSignalR] Other user ID:', otherUserId);
      
      // Connect to SignalR if not already connected
      if (!signalRService.isConnected()) {
        console.log('🔌 [setupSignalR] Connecting to SignalR...');
        await signalRService.connect(userId);
        console.log('✅ [setupSignalR] Connected to SignalR');
      } else {
        console.log('✅ [setupSignalR] Already connected to SignalR');
      }
      
      // Join this chat room
      console.log('🚪 [setupSignalR] Joining chat room...');
      await signalRService.joinChat(matchId, userId);
      console.log('✅ [setupSignalR] Joined chat room Match_' + matchId);
      
      // Setup listeners
      console.log('👂 [setupSignalR] Setting up event listeners...');
      signalRService.on('ReceiveMessage', handleReceiveMessage);
      signalRService.on('UserTyping', handleUserTyping);
      signalRService.on('UserOnline', handleUserOnline);
      signalRService.on('UserOffline', handleUserOffline);
      signalRService.on('UserJoinedChat', handleUserJoinedChat);
      console.log('✅ [setupSignalR] Event listeners attached');
      
      // Check if other user is online
      const isOnline = await signalRService.isUserOnline(otherUserId);
      setOtherUserOnline(isOnline);
      console.log('👤 [setupSignalR] Other user online status:', isOnline);
      
      console.log('✅ [setupSignalR] Complete setup for match:', matchId);
    } catch (error) {
      console.error('❌ [setupSignalR] Error:', error);
    }
  };

  const cleanupSignalR = async () => {
    try {
      if (currentUserId) {
        await signalRService.leaveChat(matchId, currentUserId);
      }
      
      // Remove listeners
      signalRService.off('ReceiveMessage', handleReceiveMessage);
      signalRService.off('UserTyping', handleUserTyping);
      signalRService.off('UserOnline', handleUserOnline);
      signalRService.off('UserOffline', handleUserOffline);
      signalRService.off('UserJoinedChat', handleUserJoinedChat);
      
      console.log('✅ SignalR cleanup complete');
    } catch (error) {
      console.error('❌ Error cleaning up SignalR:', error);
    }
  };

  const handleReceiveMessage = (data: any) => {
    console.log('📨 [handleReceiveMessage] Received message via SignalR:', data);
    
    // SignalR sends keys in camelCase: fromUserId, message, matchId, createdAt
    const fromUserId = data.fromUserId || data.FromUserId;
    const messageText = data.message || data.Message;
    let createdAt = data.createdAt || data.CreatedAt;
    
    // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
    if (typeof createdAt === 'string' && !createdAt.endsWith('Z') && !createdAt.includes('+')) {
      createdAt = createdAt + 'Z';
    }
    
    console.log('📨 [handleReceiveMessage] From user:', fromUserId);
    console.log('📨 [handleReceiveMessage] Message:', messageText);
    console.log('📨 [handleReceiveMessage] Current userId (ref):', currentUserIdRef.current);
    
    const isFromMe = currentUserIdRef.current && fromUserId === currentUserIdRef.current;
    console.log('📨 [handleReceiveMessage] Is from me:', isFromMe);
    
    // Parse timestamp as UTC
    const timestamp = new Date(createdAt);
    
    setMessages(prev => {
      // Check if message already exists (by text content and recent time)
      const existingMsg = prev.find(msg => 
        msg.text === messageText && 
        Math.abs(timestamp.getTime() - msg.timestamp.getTime()) < 10000 // 10 seconds window
      );
      
      if (existingMsg) {
        console.log('📨 [handleReceiveMessage] Message already exists:', existingMsg.id);
        
        // If it's our message in "sending" state, update to "sent"
        if (isFromMe && existingMsg.status === "sending") {
          console.log('📨 [handleReceiveMessage] Updating our message status to sent');
          return prev.map(msg => 
            msg.id === existingMsg.id
              ? { ...msg, status: "sent" as const }
              : msg
          );
        }
        
        // Message already exists, don't add duplicate
        console.log('📨 [handleReceiveMessage] Skipping duplicate message');
        return prev;
      }
      
      // Add new message (only if it doesn't exist)
      // This should only happen for messages from other users
      if (!isFromMe) {
        console.log('📨 [handleReceiveMessage] Adding new message from other user');
        const newMessage: Message = {
          id: `signalr_${fromUserId}_${Date.now()}`,
          text: messageText,
          isMe: false,
          timestamp: timestamp,
          status: "read" as const,
        };
        
        return [...prev, newMessage];
      }
      
      console.log('📨 [handleReceiveMessage] Ignoring our own message (should have been added optimistically)');
      return prev;
    });
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleUserTyping = (data: any) => {
    console.log('⌨️ [handleUserTyping] Received typing event:', data);
    
    // SignalR sends keys in camelCase
    const userId = data.userId || data.UserId;
    const isTyping = data.isTyping !== undefined ? data.isTyping : data.IsTyping;
    
    console.log('⌨️ [handleUserTyping] User ID:', userId);
    console.log('⌨️ [handleUserTyping] Other user ID:', otherUserId);
    console.log('⌨️ [handleUserTyping] Is typing:', isTyping);
    
    if (userId === otherUserId) {
      setIsTyping(isTyping);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        console.log('⌨️ [handleUserTyping] Clearing existing timeout');
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      // Auto-hide typing indicator after 3 seconds only if currently typing
      if (isTyping) {
        console.log('⌨️ [handleUserTyping] Setting auto-hide timeout');
        typingTimeoutRef.current = setTimeout(() => {
          console.log('⌨️ [handleUserTyping] Auto-hiding typing indicator');
          setIsTyping(false);
        }, 3000);
      }
    }
  };

  const handleUserOnline = (userId: number) => {
    if (userId === otherUserId) {
      setOtherUserOnline(true);
      console.log('👤 Other user is now online');
    }
  };

  const handleUserOffline = (userId: number) => {
    if (userId === otherUserId) {
      setOtherUserOnline(false);
      console.log('👤 Other user is now offline');
    }
  };

  const handleUserJoinedChat = (data: any) => {
    if (data.userId === otherUserId && data.matchId === matchId) {
      setOtherUserOnline(true);
      console.log('👤 Other user joined this chat');
    }
  };

  // 🚀 OPTIMIZED: Load messages with pagination and parallel loading
  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Get current user ID
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        console.log('❌ No userId found');
        return;
      }
      
      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);
      console.log('👤 Current user:', userId);
      console.log('💬 Loading messages for matchId:', matchId);
      
      // 🚀 OPTIMIZATION 1: Parallel loading - Load avatars and messages simultaneously
      const [avatar, chatMessages] = await Promise.all([
        getUserPetAvatar(userId),
        getChatMessages(matchId)
      ]);
      
      setMyAvatar(avatar);
      console.log('👤 My avatar loaded');
      
      // Load other user's avatar in background (non-blocking)
      getUserPetAvatar(otherUserId)
        .then(otherAvatar => {
          setOtherUserAvatar(otherAvatar);
          console.log('👤 Other user avatar loaded');
        })
        .catch(() => {
          console.log('⚠️ Could not load other user avatar, using default');
          setOtherUserAvatar(require("../../../assets/cat_avatar.png"));
        });
      
      console.log('✅ Loaded messages:', chatMessages.length);
      
      // 🚀 OPTIMIZATION 2: Only show last 50 messages initially
      const INITIAL_MESSAGE_COUNT = 50;
      const messagesToShow = chatMessages.slice(-INITIAL_MESSAGE_COUNT);
      
      // Convert API messages to UI format
      const formattedMessages: Message[] = messagesToShow.map((msg) => {
        // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
        let dateString = msg.createdAt;
        if (!dateString.endsWith('Z') && !dateString.includes('+')) {
          dateString = dateString + 'Z';
        }
        
        return {
          id: msg.contentId.toString(),
          text: msg.message,
          isMe: msg.fromUserId === userId,
          timestamp: new Date(dateString), // Parse as UTC, auto converts to local time
          status: "read" as const,
          contentId: msg.contentId, // Store contentId for reporting
        };
      });
      
      setMessages(formattedMessages);
      
      // 🚀 OPTIMIZATION 3: Immediate scroll without setTimeout
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      });
      
    } catch (error: any) {
      console.error('❌ Error loading messages:', error);
      showAlert({ type: 'error', title: 'Lỗi', message: 'Không thể tải tin nhắn. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentUserId || sending) return;
    
    const messageText = inputText.trim();
    const tempId = Date.now().toString();
    
    // Optimistic UI update
    const newMessage: Message = {
      id: tempId,
      text: messageText,
      isMe: true,
      timestamp: new Date(),
      status: "sending",
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    
    // Stop typing indicator and clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    signalRService.sendTyping(matchId, currentUserId, false);
    
    // 🚀 OPTIMIZATION 6: Use requestAnimationFrame for smoother scroll
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    
    try {
      setSending(true);
      console.log('📤 [handleSend] Sending message:', { matchId, currentUserId, messageText });
      console.log('📤 [handleSend] SignalR connected:', signalRService.isConnected());
      
      // Send message to API (backend will broadcast via SignalR automatically)
      console.log('📤 [handleSend] Saving to API (backend will broadcast)...');
      await sendMessage(matchId, currentUserId, messageText);
      console.log('✅ [handleSend] Saved to API and broadcast via SignalR');
      
      // Update status to sent
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: "sent" as const }
            : msg
        )
      );
      
      console.log('✅ [handleSend] Message sent successfully');
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      showAlert({
        type: 'error',
        title: 'Lỗi gửi tin nhắn',
        message: error.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.',
        showCancel: true,
        confirmText: 'Thử lại',
        onConfirm: () => setInputText(messageText),
      });
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    
    if (!currentUserId) return;
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Send typing indicator
    if (text.trim().length > 0) {
      console.log('⌨️ [handleInputChange] User is typing, sending indicator');
      signalRService.sendTyping(matchId, currentUserId, true);
      
      // Auto-stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        console.log('⌨️ [handleInputChange] User stopped typing (timeout)');
        signalRService.sendTyping(matchId, currentUserId, false);
      }, 2000);
    } else {
      console.log('⌨️ [handleInputChange] Input empty, stopping typing indicator');
      signalRService.sendTyping(matchId, currentUserId, false);
    }
  };

  const handleMenuPress = () => {
    setShowMenuModal(true);
  };

  const closeMenu = () => {
    setShowMenuModal(false);
  };

  const handleViewProfile = async () => {
    closeMenu();
    
    try {
      console.log('📱 Fetching pets for userId:', otherUserId);
      
      // Get pets of the other user
      const pets = await getPetsByUserId(otherUserId);
      
      if (!pets || pets.length === 0) {
        showAlert({ 
          type: 'info', 
          title: 'Thông báo', 
          message: 'Người dùng này chưa có thông tin thú cưng' 
        });
        return;
      }
      
      // Get the first pet (or active pet if you have that logic)
      const firstPet = pets[0];
      const petId = firstPet.petId || firstPet.PetId;
      const petName = firstPet.name || firstPet.Name || 'Pet';
      
      if (!petId) {
        showAlert({ 
          type: 'error', 
          title: 'Lỗi', 
          message: 'Không tìm thấy thông tin thú cưng' 
        });
        return;
      }
      
      console.log('✅ Found pet:', petId, petName);
      
      // Navigate to PetProfile screen (from chat = already matched)
      navigation.navigate('PetProfile' as any, { 
        petId: petId.toString(),
        fromChat: true  // Hide match/report/block actions
      });
      
    } catch (error: any) {
      console.error('❌ Error loading pet profile:', error);
      showAlert({ 
        type: 'error', 
        title: 'Lỗi', 
        message: 'Không thể tải thông tin profile. Vui lòng thử lại.' 
      });
    }
  };

  const handleUnmatch = async () => {
    closeMenu();
    showAlert({
      type: 'warning',
      title: "Hủy kết nối",
      message: `Bạn có chắc muốn hủy kết nối với ${userName}? Cuộc trò chuyện sẽ bị ẩn và bạn không thể nhắn tin với nhau nữa.`,
      showCancel: true,
      confirmText: "Xác nhận",
      onConfirm: async () => {
        try {
          console.log("🗑️ Unmatching matchId:", matchId);
          await deleteChat(matchId);
          
          showAlert({
            type: 'success',
            title: "Đã hủy kết nối",
            message: `Bạn đã hủy kết nối với ${userName}. Cuộc trò chuyện đã bị ẩn.`,
            onClose: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Chat' }],
              });
            },
          });
        } catch (error: any) {
          console.error('❌ Error unmatching:', error);
          showAlert({ type: 'error', title: 'Lỗi', message: error.message || 'Không thể hủy kết nối. Vui lòng thử lại.' });
        }
      },
    });
  };

  const handleReportMessage = () => {
    if (!selectedMessage || !selectedMessage.contentId || !currentUserId) return;
    
    setShowMessageMenu(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async (reason: string) => {
    if (!selectedMessage || !selectedMessage.contentId || !currentUserId) return;
    
    setShowReportModal(false);
    
    try {
      console.log(`🚨 Reporting message: contentId=${selectedMessage.contentId}, reason=${reason}`);
      
      // Report the message (backend will auto-block and delete chat)
      await reportMessage(currentUserId, selectedMessage.contentId!, reason);
      
      showAlert({
        type: 'success',
        title: "Đã báo cáo",
        message: `Đã báo cáo tin nhắn và chặn ${userName}. Cuộc trò chuyện đã bị ẩn.`,
        onClose: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Chat' }],
          });
        },
      });
    } catch (error: any) {
      console.error('❌ Error reporting message:', error);
      showAlert({ type: 'error', title: 'Lỗi', message: error.message || 'Không thể gửi báo cáo. Vui lòng thử lại.' });
    }
  };

  const handleBlock = () => {
    closeMenu();
    showAlert({
      type: 'warning',
      title: "Chặn người dùng",
      message: `Bạn có chắc muốn chặn ${userName}? Bạn sẽ không thể nhắn tin với nhau nữa và match sẽ bị hủy.`,
      showCancel: true,
      confirmText: "Chặn",
      onConfirm: async () => {
        try {
          const currentUserIdStr = await AsyncStorage.getItem('userId');
          if (!currentUserIdStr) {
            showAlert({ type: 'error', title: 'Lỗi', message: 'Không tìm thấy thông tin người dùng' });
            return;
          }
          const currentUserId = parseInt(currentUserIdStr, 10);

          console.log("🚫 Blocking user:", currentUserId, "->", otherUserId);
          
          // Block user (backend will auto-delete chat)
          await blockUser(currentUserId, otherUserId);
          
          showAlert({
            type: 'success',
            title: "Đã chặn",
            message: `${userName} đã bị chặn. Cuộc trò chuyện đã bị ẩn.`,
            onClose: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Chat' }],
              });
            },
          });
        } catch (error: any) {
          console.error('❌ Error blocking user:', error);
          showAlert({ type: 'error', title: 'Lỗi', message: 'Không thể chặn người dùng. Vui lòng thử lại.' });
        }
      },
    });
  };

  const handleDeleteChat = () => {
    closeMenu();
    showAlert({
      type: 'warning',
      title: "Xóa cuộc trò chuyện",
      message: `Xóa cuộc trò chuyện với ${userName}? Bạn vẫn còn kết nối và có thể bắt đầu chat mới. Để xóa kết nối hoàn toàn, hãy dùng "Hủy kết nối".`,
      showCancel: true,
      confirmText: "Xóa",
      onConfirm: () => {
        // Clear messages locally (backend doesn't have delete all messages endpoint)
        console.log("🗑️ Clearing conversation locally");
        setMessages([]);
        showAlert({ type: 'success', title: "Đã xóa", message: "Cuộc trò chuyện đã được xóa. Bạn vẫn còn kết nối." });
      },
    });
  };

  // Dating app style time formatting
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for comparison
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return "Hôm nay";
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.timestamp);
    const prevDate = new Date(prevMsg.timestamp);
    
    currentDate.setHours(0, 0, 0, 0);
    prevDate.setHours(0, 0, 0, 0);
    
    return currentDate.getTime() !== prevDate.getTime();
  };

  // 🚀 OPTIMIZATION 4: Memoize renderMessage to prevent unnecessary re-renders
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    
    // Messenger style: show avatar for each message
    // Group consecutive messages from same person
    const isFirstInGroup = !prevMessage || prevMessage.isMe !== item.isMe;
    const isLastInGroup = !nextMessage || nextMessage.isMe !== item.isMe;
    const showDateSeparator = shouldShowDateSeparator(item, prevMessage);

    return (
      <View>
        {/* Date Separator */}
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.timestamp)}
            </Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}
        
        <View
          style={[
            styles.messageContainer,
            item.isMe ? styles.myMessage : styles.theirMessage,
            !isFirstInGroup && styles.messageGrouped,
            isLastInGroup && styles.messageLastInGroup,
          ]}
        >
          {/* Avatar - Messenger style (show for last message in group) */}
          {!item.isMe && isLastInGroup && (
            <OptimizedImage source={otherUserAvatar} style={styles.messageAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
          )}
          {!item.isMe && !isLastInGroup && (
            <View style={styles.messageAvatarPlaceholder} />
          )}
          
          <View style={styles.messageBubbleWrapper}>
            <View
              style={[
                styles.messageBubble,
                item.isMe ? styles.myBubble : styles.theirBubble,
                !isFirstInGroup && (item.isMe ? styles.myBubbleGrouped : styles.theirBubbleGrouped),
                isLastInGroup && (item.isMe ? styles.myBubbleLastInGroup : styles.theirBubbleLastInGroup),
              ]}
            >
              {item.isMe ? (
                <LinearGradient
                  colors={gradients.chat}
                  style={styles.myBubbleGradient}
                >
                  <Text style={styles.myMessageText}>{item.text}</Text>
                </LinearGradient>
              ) : (
                <Pressable
                  onLongPress={() => {
                    setSelectedMessage(item);
                    setShowMessageMenu(true);
                  }}
                  style={styles.theirBubbleContent}
                >
                  <Text style={styles.theirMessageText}>{item.text}</Text>
                </Pressable>
              )}
            </View>
            
            {/* Time & Status - Show for last message in group */}
            {isLastInGroup && (
              <View style={[styles.messageTimeContainer, item.isMe && styles.myMessageTimeContainer]}>
                <Text style={styles.messageTimeText}>
                  {formatMessageTime(item.timestamp)}
                </Text>
                {item.isMe && item.status && (
                  <View style={styles.messageStatusIcon}>
                    {item.status === "sending" && (
                      <Icon name="time-outline" size={14} color={colors.textLabel} />
                    )}
                    {item.status === "sent" && (
                      <Icon name="checkmark" size={14} color={colors.textLabel} />
                    )}
                    {item.status === "read" && (
                      <Icon name="checkmark-done" size={14} color={colors.primary} />
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
          
          {/* Avatar for my messages - Messenger style */}
          {item.isMe && isLastInGroup && (
            <OptimizedImage source={myAvatar} style={styles.messageAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
          )}
          {item.isMe && !isLastInGroup && (
            <View style={styles.messageAvatarPlaceholder} />
          )}
        </View>
      </View>
    );
  }, [messages, otherUserAvatar, myAvatar]);

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#FFFFFF", "#FFF8FB"]}
        style={styles.headerGradient}
      >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <OptimizedImage source={otherUserAvatar} style={styles.headerAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? "typing..." : otherUserOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={handleMenuPress}
        >
          <Icon name="ellipsis-vertical" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={64} color={colors.textLabel} />
            <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
            <Text style={styles.emptyText}>Hãy bắt đầu cuộc trò chuyện!</Text>
          </View>
        ) : (
          /* Messages */
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            showsVerticalScrollIndicator={false}
            // 🚀 OPTIMIZATION 5: FlatList performance props
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={20}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80, // Approximate message height
              offset: 80 * index,
              index,
            })}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingIndicator}>
                  <OptimizedImage source={otherUserAvatar} style={styles.messageAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
                  <View style={styles.typingBubble}>
                    <Animated.View 
                      style={[
                        styles.typingDot,
                        {
                          opacity: typingAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                          transform: [{
                            translateY: typingAnim1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -4],
                            }),
                          }],
                        },
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.typingDot, 
                        { marginLeft: 4 },
                        {
                          opacity: typingAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                          transform: [{
                            translateY: typingAnim2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -4],
                            }),
                          }],
                        },
                      ]} 
                    />
                    <Animated.View 
                      style={[
                        styles.typingDot, 
                        { marginLeft: 4 },
                        {
                          opacity: typingAnim3.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                          transform: [{
                            translateY: typingAnim3.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -4],
                            }),
                          }],
                        },
                      ]} 
                    />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="add-circle-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
            
            <TextInput
              style={styles.input}
              placeholder="Nhắn tin..."
              placeholderTextColor={colors.textLabel}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              <LinearGradient
                colors={inputText.trim() && !sending ? gradients.chat : ["#E0E0E0", "#BDBDBD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendGradient}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon
                    name="send"
                    size={20}
                    color={colors.white}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Menu Modal - Bottom Sheet Style */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <Pressable style={styles.menuModal} onPress={(e) => e.stopPropagation()}>
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <OptimizedImage source={otherUserAvatar} style={styles.menuAvatar} resizeMode="cover" showLoader={false} imageSize="thumbnail" />
              <View style={styles.menuHeaderText}>
                <Text style={styles.menuUserName}>{userName}</Text>
                <Text style={styles.menuUserStatus}>Active now</Text>
              </View>
              <TouchableOpacity onPress={closeMenu} style={styles.menuCloseBtn}>
                <Icon name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Menu Options */}
            <View style={styles.menuOptions}>
              {/* View Full Profile */}
              <TouchableOpacity style={styles.menuOption} onPress={handleViewProfile}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#FFE8F5" }]}>
                  <Icon name="person-circle-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={styles.menuOptionTitle}>Xem profile</Text>
                  <Text style={styles.menuOptionDesc}>Xem ảnh và thông tin thú cưng</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Unmatch */}
              <TouchableOpacity style={styles.menuOption} onPress={handleUnmatch}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#FFF8E1" }]}>
                  <Icon name="heart-dislike-outline" size={22} color="#FFA726" />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={styles.menuOptionTitle}>Hủy kết nối</Text>
                  <Text style={styles.menuOptionDesc}>Ẩn kết nối này</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>

              {/* Block */}
              <TouchableOpacity style={styles.menuOption} onPress={handleBlock}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#FFEBEE" }]}>
                  <Icon name="ban-outline" size={22} color="#E94D6B" />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={[styles.menuOptionTitle, { color: "#E94D6B" }]}>Chặn</Text>
                  <Text style={styles.menuOptionDesc}>Chặn người dùng này</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* Delete Conversation */}
              <TouchableOpacity style={styles.menuOption} onPress={handleDeleteChat}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#F5F5F5" }]}>
                  <Icon name="trash-outline" size={22} color={colors.error} />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={[styles.menuOptionTitle, { color: colors.error }]}>Xóa cuộc trò chuyện</Text>
                  <Text style={styles.menuOptionDesc}>Xóa tất cả tin nhắn</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textMedium} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Message Menu Modal - For reporting messages */}
      <Modal
        visible={showMessageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMessageMenu(false)}>
          <Pressable style={styles.messageMenuModal} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity style={styles.menuOption} onPress={handleReportMessage}>
              <View style={[styles.menuIconContainer, { backgroundColor: "#FFEBEE" }]}>
                <Icon name="flag" size={22} color="#E94D6B" />
              </View>
              <View style={styles.menuOptionText}>
                <Text style={[styles.menuOptionTitle, { color: "#E94D6B" }]}>Báo cáo tin nhắn</Text>
                <Text style={styles.menuOptionDesc}>Báo cáo nội dung không phù hợp</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
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
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel}
        />
      )}

      {/* Report Message Modal */}
      <ReportMessageModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleSubmitReport}
        userName={userName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
  },
  keyboardView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 12,
    ...shadows.small,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
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
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textDark,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },

  // Messages - Dating App Style
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  
  // Date Separator
  dateSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.textLabel,
    opacity: 0.2,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    backgroundColor: colors.textMedium,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  
  // Message Container - Messenger style with avatars
  messageContainer: {
    flexDirection: "row",
    marginBottom: 2,
    paddingHorizontal: 4,
    alignItems: "flex-end",
  },
  messageGrouped: {
    marginBottom: 2,
  },
  messageLastInGroup: {
    marginBottom: 12,
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  theirMessage: {
    justifyContent: "flex-start",
  },
  
  // Avatar - Messenger style
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 6,
  },
  messageAvatarPlaceholder: {
    width: 28,
    marginHorizontal: 6,
  },
  
  // Message Bubble Wrapper
  messageBubbleWrapper: {
    flexDirection: "column",
    maxWidth: width * 0.65,
  },
  
  // Message Bubble
  messageBubble: {
    maxWidth: "100%",
  },
  myBubble: {
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  myBubbleGrouped: {
    borderRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 4,
  },
  myBubbleLastInGroup: {
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  theirBubbleGrouped: {
    borderRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 4,
  },
  theirBubbleLastInGroup: {
    borderBottomLeftRadius: 4,
  },
  myBubbleGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  theirBubbleContent: {
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    ...shadows.small,
  },
  myMessageText: {
    fontSize: 16,
    color: colors.white,
    lineHeight: 22,
  },
  theirMessageText: {
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 22,
  },
  
  // Time & Status - Dating app style
  messageTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginHorizontal: 8,
  },
  myMessageTimeContainer: {
    justifyContent: "flex-end",
  },
  messageTimeText: {
    fontSize: 11,
    color: colors.textLabel,
    marginRight: 4,
  },
  messageStatusIcon: {
    marginLeft: 2,
  },

  // Typing Indicator - Dating app style (no avatar)
  typingIndicator: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: "row",
    backgroundColor: colors.whiteWarm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    ...shadows.small,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMedium,
    opacity: 0.6,
  },

  // Input
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 154, 118, 0.15)",
    ...shadows.medium,
  },
  attachButton: {
    padding: 4,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginLeft: 4,
  },
  sendGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Loading & Empty States
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
  emptyContainer: {
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
  },

  // Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuModal: {
    backgroundColor: colors.whiteWarm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: Dimensions.get("window").height * 0.75,
  },
  messageMenuModal: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    marginHorizontal: 20,
    padding: 8,
    ...shadows.large,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  menuHeaderText: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },
  menuUserStatus: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  menuCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  menuOptions: {
    paddingVertical: 8,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuOptionText: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  menuOptionDesc: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
    marginHorizontal: 20,
  },
});

export default ChatDetailScreen;

