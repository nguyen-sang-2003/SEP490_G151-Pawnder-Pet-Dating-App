import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import chatExpertService from '../../services/api/chatExpertService';
import userService from '../../services/api/userService';
import { API_BASE_URL } from '../../constants';
import './ExpertChat.css';

// ============================================
// MOCK DATA - Đặt USE_MOCK_DATA = true để dùng mock data
// ============================================
// HƯỚNG DẪN:
// - Đặt USE_MOCK_DATA = true để hiển thị dữ liệu mẫu (không cần backend)
// - Đặt USE_MOCK_DATA = false để dùng API thật từ backend
// ============================================
const USE_MOCK_DATA = true; // Đổi thành false để dùng API thật

const MOCK_CHATS = [
  {
    chatExpertId: 1,
    expertId: 2,
    userId: 3,
    userName: 'Lê Minh C',
    userEmail: 'user1@pawnder.com',
    userAvatar: null,
    createdAt: '2025-11-20T10:00:00',
    updatedAt: '2025-11-21T14:30:00',
  },
  {
    chatExpertId: 2,
    expertId: 2,
    userId: 4,
    userName: 'Lê Minh D',
    userEmail: 'user2@pawnder.com',
    userAvatar: null,
    createdAt: '2025-11-20T11:00:00',
    updatedAt: '2025-11-21T15:00:00',
  },
];

const MOCK_MESSAGES = {
  1: [
    {
      contentId: 1,
      chatExpertId: 1,
      fromId: 3,
      message: 'Đã gửi file đoạn chat AI về tư vấn giống chó phù hợp',
      expertId: 2,
      userId: 3,
      chatAIId: 1,
      createdAt: '2025-11-20T10:00:00',
    },
    {
      contentId: 2,
      chatExpertId: 1,
      fromId: 3,
      message: 'Xin chào chuyên gia! Tôi đã xem qua câu trả lời từ AI về giống chó phù hợp. Tôi muốn hỏi thêm về chi phí nuôi Golden Retriever có đắt không ạ?',
      expertId: null,
      userId: null,
      chatAIId: null,
      createdAt: '2025-11-20T10:05:00',
    },
    {
      contentId: 3,
      chatExpertId: 1,
      fromId: 2,
      message: 'Chào bạn! Về chi phí nuôi Golden Retriever, tôi có thể chia sẻ như sau: Chi phí ban đầu (mua chó, vaccine, đồ dùng) khoảng 10-20 triệu. Chi phí hàng tháng: thức ăn (1-1.5 triệu), chăm sóc sức khỏe (200-500k), đồ chơi (100-300k). Tổng cộng khoảng 1.5-2.5 triệu/tháng.',
      expertId: 2,
      userId: 3,
      chatAIId: null,
      createdAt: '2025-11-20T10:10:00',
    },
    {
      contentId: 4,
      chatExpertId: 1,
      fromId: 3,
      message: 'Cảm ơn chuyên gia! Vậy Golden Retriever có dễ huấn luyện không? Tôi chưa có kinh nghiệm nuôi chó.',
      expertId: null,
      userId: null,
      chatAIId: null,
      createdAt: '2025-11-20T10:15:00',
    },
    {
      contentId: 5,
      chatExpertId: 1,
      fromId: 2,
      message: 'Golden Retriever rất thông minh và dễ huấn luyện! Chúng rất thích học hỏi và làm hài lòng chủ. Bạn nên bắt đầu huấn luyện từ khi còn nhỏ (2-3 tháng tuổi). Các lệnh cơ bản như ngồi, nằm, đến đây thường mất 1-2 tuần. Quan trọng là kiên nhẫn và dùng phần thưởng tích cực.',
      expertId: 2,
      userId: 3,
      chatAIId: null,
      createdAt: '2025-11-20T10:20:00',
    },
  ],
  2: [
    {
      contentId: 6,
      chatExpertId: 2,
      fromId: 4,
      message: 'Đã gửi file đoạn chat AI về phân tích gen thú cưng',
      expertId: 2,
      userId: 4,
      chatAIId: 2,
      createdAt: '2025-11-20T11:00:00',
    },
    {
      contentId: 7,
      chatExpertId: 2,
      fromId: 4,
      message: 'Chào chuyên gia! Tôi có câu hỏi về phân tích gen. Con chó của tôi là Poodle, tôi muốn biết có thể phối giống với giống nào để có đời con khỏe mạnh?',
      expertId: null,
      userId: null,
      chatAIId: null,
      createdAt: '2025-11-20T11:05:00',
    },
    {
      contentId: 8,
      chatExpertId: 2,
      fromId: 2,
      message: 'Chào bạn! Poodle có thể phối với nhiều giống khác nhau. Theo phân tích gen, Poodle phối với Labrador sẽ cho đời con khỏe mạnh và dễ huấn luyện (Labradoodle). Ngoài ra, Poodle cũng có thể phối với Golden Retriever (Goldendoodle) hoặc Cocker Spaniel (Cockapoo).',
      expertId: 2,
      userId: 4,
      chatAIId: null,
      createdAt: '2025-11-20T11:10:00',
    },
    {
      contentId: 9,
      chatExpertId: 2,
      fromId: 4,
      message: 'Vậy Labradoodle có đặc điểm gì nổi bật ạ?',
      expertId: null,
      userId: null,
      chatAIId: null,
      createdAt: '2025-11-20T11:15:00',
    },
    {
      contentId: 10,
      chatExpertId: 2,
      fromId: 2,
      message: 'Labradoodle là giống lai rất phổ biến! Đặc điểm nổi bật: ít rụng lông (từ Poodle), thông minh và thân thiện (từ Labrador), phù hợp với người bị dị ứng. Chúng rất năng động, thích chơi đùa và rất trung thành với chủ. Kích thước có thể từ nhỏ đến lớn tùy thuộc vào kích thước của Poodle bố mẹ.',
      expertId: 2,
      userId: 4,
      chatAIId: null,
      createdAt: '2025-11-20T11:20:00',
    },
  ],
};

const ExpertChat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize SignalR connection
  useEffect(() => {
    if (!user?.UserId) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Import SignalR dynamically
    import('@microsoft/signalr').then(({ HubConnectionBuilder, LogLevel }) => {
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/chatHub`, {
          accessTokenFactory: () => token,
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      // Register user
      newConnection.onclose(() => {
        console.log('SignalR connection closed');
      });

      newConnection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
      });

      newConnection.onreconnected(() => {
        console.log('SignalR reconnected');
        if (user?.UserId) {
          newConnection.invoke('RegisterUser', user.UserId);
        }
      });

      // Listen for new messages
      newConnection.on('ReceiveMessage', (messageData) => {
        console.log('📨 Received message:', messageData);
        if (messageData.chatExpertId === selectedChat?.chatExpertId) {
          setMessages((prev) => [...prev, messageData]);
          scrollToBottom();
        }
      });

      // Start connection
      newConnection
        .start()
        .then(() => {
          console.log('✅ SignalR connected');
          if (user?.UserId) {
            newConnection.invoke('RegisterUser', user.UserId);
          }
          setConnection(newConnection);
        })
        .catch((err) => {
          console.error('❌ SignalR connection error:', err);
        });

      return () => {
        newConnection.stop();
      };
    });

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [user?.UserId]);

  // Load chats
  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading chats... USE_MOCK_DATA:', USE_MOCK_DATA);
        
        if (USE_MOCK_DATA) {
          // Sử dụng mock data - không cần user.UserId
          console.log('🎭 Using MOCK DATA for chats');
          console.log('📋 MOCK_CHATS:', MOCK_CHATS);
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
          console.log('✅ Mock chats loaded, count:', MOCK_CHATS.length);
          setChats(MOCK_CHATS);
          console.log('✅ State updated with chats:', MOCK_CHATS);
          if (MOCK_CHATS.length > 0) {
            console.log('✅ Setting selected chat to first item');
            setSelectedChat(MOCK_CHATS[0]);
          }
          setLoading(false);
          return;
        }

        // Sử dụng API thật - cần user.UserId
        if (!user?.UserId) {
          console.warn('⚠️ No user ID available for API call');
          setLoading(false);
          return;
        }

        // Sử dụng API thật
        console.log('📡 Loading chats for expert:', user.UserId);
        const response = await chatExpertService.getChatsByExpertId(user.UserId);
        console.log('📥 API Response:', response);
        
        const chatsData = Array.isArray(response) ? response : response?.data || [];
        console.log('💬 Chats data:', chatsData);
        
        if (chatsData.length === 0) {
          console.log('ℹ️ No chats found for this expert');
          setChats([]);
          setLoading(false);
          return;
        }
        
        // Fetch user info for each chat
        // Backend trả về camelCase: chatExpertId, userId, userName, userEmail
        const chatsWithUserInfo = await Promise.all(
          chatsData.map(async (chat) => {
            const chatExpertId = chat.chatExpertId || chat.ChatExpertId;
            const userId = chat.userId || chat.UserId;
            
            // Backend đã trả về userName và userEmail, nhưng có thể fetch thêm để có avatar
            let userInfo = null;
            try {
              userInfo = await userService.getUserById(userId);
            } catch (err) {
              console.warn(`Failed to fetch user info for ${userId}`, err);
            }
            
            return {
              chatExpertId: chatExpertId,
              expertId: chat.expertId || chat.ExpertId,
              userId: userId,
              userName: chat.userName || userInfo?.FullName || userInfo?.fullName || `User #${userId}`,
              userEmail: chat.userEmail || userInfo?.Email || userInfo?.email || '',
              userAvatar: userInfo?.Avatar || userInfo?.avatar || null,
              createdAt: chat.createdAt || chat.CreatedAt,
              updatedAt: chat.updatedAt || chat.UpdatedAt,
            };
          })
        );

        console.log('✅ Chats with user info:', chatsWithUserInfo);
        setChats(chatsWithUserInfo);
        
        // Auto-select first chat if available
        if (chatsWithUserInfo.length > 0 && !selectedChat) {
          setSelectedChat(chatsWithUserInfo[0]);
        }
      } catch (err) {
        console.error('❌ Failed to load chats:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedChat?.chatExpertId) return;

    const loadMessages = async () => {
      try {
        if (USE_MOCK_DATA) {
          // Sử dụng mock data
          console.log('🎭 Using MOCK DATA for messages, chatExpertId:', selectedChat.chatExpertId);
          await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
          const mockMessages = MOCK_MESSAGES[selectedChat.chatExpertId] || [];
          setMessages(mockMessages);
          setTimeout(() => scrollToBottom(), 100);
          return;
        }

        // Sử dụng API thật
        const response = await chatExpertService.getMessages(selectedChat.chatExpertId);
        const messagesData = Array.isArray(response) ? response : response?.data || [];
        setMessages(messagesData);
        setTimeout(() => scrollToBottom(), 100);

        // Join chat group for SignalR
        if (connection) {
          const groupName = `chat-expert-${selectedChat.chatExpertId}`;
          try {
            await connection.invoke('JoinChatGroup', groupName);
            console.log('✅ Joined chat group:', groupName);
          } catch (err) {
            console.warn('⚠️ Failed to join chat group (method may not exist in backend):', err);
          }
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    loadMessages();
  }, [selectedChat?.chatExpertId, connection]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      if (USE_MOCK_DATA) {
        // Sử dụng mock data - chỉ thêm vào local state
        console.log('🎭 Using MOCK DATA for sending message');
        await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
        
        const newMsg = {
          contentId: Date.now(),
          chatExpertId: selectedChat.chatExpertId,
          fromId: user.UserId,
          message: messageText,
          expertId: user.UserId,
          userId: selectedChat.userId,
          chatAIId: null,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newMsg]);
        scrollToBottom();
        setSending(false);
        return;
      }

      // Sử dụng API thật
      const result = await chatExpertService.sendMessage(
        selectedChat.chatExpertId,
        user.UserId,
        messageText,
        user.UserId, // expertId
        selectedChat.userId, // userId
        null // chatAiId
      );

      // Add message to local state immediately
      const newMsg = {
        contentId: result?.contentId || Date.now(),
        chatExpertId: selectedChat.chatExpertId,
        fromId: user.UserId,
        message: messageText,
        expertId: user.UserId,
        userId: selectedChat.userId,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  if (loading) {
    return (
      <div className="expert-chat-page">
        <div className="loading">
          <p>Đang tải...</p>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
            Đang tải danh sách chat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-chat-page">
      <div className="chat-container">
        {/* Chat List Sidebar */}
        <div className="chat-list-sidebar">
          <div className="chat-list-header">
            <h2>Chat với người dùng</h2>
            {USE_MOCK_DATA && (
              <div style={{ 
                fontSize: '11px', 
                color: '#ff9800', 
                marginTop: '4px',
                fontWeight: 'normal',
                fontStyle: 'italic'
              }}>
                🎭 Đang dùng Mock Data
              </div>
            )}
          </div>
          <div className="chat-list">
            {chats.length === 0 ? (
              <div className="empty-chat-list">
                <p>Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.chatExpertId}
                  className={`chat-item ${selectedChat?.chatExpertId === chat.chatExpertId ? 'active' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-item-avatar">
                    {chat.userAvatar ? (
                      <img src={chat.userAvatar} alt={chat.userName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {chat.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-name">{chat.userName}</div>
                    <div className="chat-item-email">{chat.userEmail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-header-avatar">
                    {selectedChat.userAvatar ? (
                      <img src={selectedChat.userAvatar} alt={selectedChat.userName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {selectedChat.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="chat-header-name">{selectedChat.userName}</div>
                    <div className="chat-header-email">{selectedChat.userEmail}</div>
                  </div>
                </div>
              </div>

              <div className="chat-messages" ref={chatContainerRef}>
                {messages.map((msg, index) => {
                  // Xác định tin nhắn của expert: từ expertId hoặc fromId khớp với expertId của chat
                  const isExpert = 
                    msg.expertId === user?.UserId || 
                    msg.fromId === user?.UserId ||
                    (selectedChat && (msg.expertId === selectedChat.expertId || msg.fromId === selectedChat.expertId));
                  const showDate =
                    index === 0 ||
                    formatDate(messages[index - 1].createdAt) !== formatDate(msg.createdAt);

                  return (
                    <React.Fragment key={msg.contentId || index}>
                      {showDate && (
                        <div className="message-date-divider">
                          {formatDate(msg.createdAt)}
                        </div>
                      )}
                      <div className={`message ${isExpert ? 'message-sent' : 'message-received'}`}>
                        <div className="message-content">
                          <p>{msg.message}</p>
                          <span className="message-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="chat-send-button"
                  disabled={!newMessage.trim() || sending}
                >
                  {sending ? 'Đang gửi...' : 'Gửi'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertChat;

