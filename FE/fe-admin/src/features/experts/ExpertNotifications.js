import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../shared/context/NotificationContext';
import { useAuth } from '../../shared/context/AuthContext';
import { expertService, userService, chatAIService } from '../../shared/api';
import { mockUsers } from '../../shared/data/mockUsers';
import './styles/ExpertNotifications.css';

/**
 * Loại bỏ markdown formatting từ text AI response
 */
const stripMarkdown = (text) => {
  if (!text) return text;
  
  return text
    // Loại bỏ ***text***
    .replace(/\*{3}(.*?)\*{3}/g, '$1')
    // Loại bỏ **text**
    .replace(/\*{2}(.*?)\*{2}/g, '$1')
    // Loại bỏ *text* (nhưng không phải bullet point)
    .replace(/\*([^\s*][^*]*[^\s*])\*/g, '$1')
    .replace(/\*([^\s*])\*/g, '$1')
    // Chuyển bullet point * thành •
    .replace(/^\s*\*\s+/gm, '• ')
    // Loại bỏ _text_
    .replace(/_(.*?)_/g, '$1')
    // Loại bỏ # headers
    .replace(/^#{1,6}\s+/gm, '')
    // Loại bỏ ```code```
    .replace(/```[\s\S]*?```/g, '')
    // Loại bỏ `code`
    .replace(/`([^`]+)`/g, '$1')
    // Loại bỏ [text](url)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .trim();
};

const ITEMS_PER_PAGE = 4;

const getFallbackUserInfo = (userId) => {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) {
    return {
      name: `Người dùng #${userId}`,
      email: `user${userId}@example.com`,
    };
  }
  return {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
  };
};

const buildFallbackHistory = (notification) => {
  const history = [];
  const question =
    notification.requestMessage ||
    'Người dùng yêu cầu chuyên gia xác thực câu trả lời từ AI.';
  history.push({
    id: `${notification.id}-q`,
    role: 'user',
    sender: notification.userName,
    content: question,
    timestamp: notification.createdAt,
  });

  const answer =
    notification.expertNote ||
    'Chưa có ghi chú từ chuyên gia. Hãy xem xét thông tin và phản hồi cho người dùng.';
  history.push({
    id: `${notification.id}-a`,
    role: 'ai',
    sender: 'Pawnder AI',
    content: answer,
    timestamp: notification.updatedAt || notification.createdAt,
  });

  return history;
};

// Mock lịch sử chat chi tiết cho case demo (user1 - tư vấn giống chó phù hợp)
const buildStaticAiHistory = (chatAiId, userName) => {
  // Chỉ áp dụng cho chat tư vấn giống chó phù hợp (chat đầu tiên) – có 7 lượt hỏi đáp
  if (!chatAiId || Number(chatAiId) !== 1) {
    return null;
  }

  const name = userName || 'Người dùng';
  const now = new Date();

  const makeTime = (minutes) => {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
  };

  return [
    {
      id: `${chatAiId}-q-0`,
      role: 'user',
      sender: name,
      content:
        'Tôi muốn nuôi chó hiền, phù hợp trẻ nhỏ. Bạn có thể tư vấn giúp tôi không?',
      timestamp: makeTime(0),
    },
    {
      id: `${chatAiId}-a-0`,
      role: 'ai',
      sender: 'Pawnder AI',
      content:
        'Chào bạn! Golden Retriever là một lựa chọn tuyệt vời cho gia đình có trẻ nhỏ vì chúng rất hiền lành, thân thiện và kiên nhẫn với trẻ em.',
      timestamp: makeTime(1),
    },
    {
      id: `${chatAiId}-q-1`,
      role: 'user',
      sender: name,
      content:
        'Golden Retriever có cần không gian rộng không? Nhà tôi chỉ có sân nhỏ thôi.',
      timestamp: makeTime(2),
    },
    {
      id: `${chatAiId}-a-1`,
      role: 'ai',
      sender: 'Pawnder AI',
      content:
        'Golden Retriever là giống chó lớn và năng động, nên cần được vận động hàng ngày. Nếu bạn có thể đưa chó đi dạo 30–60 phút mỗi ngày thì sân nhỏ vẫn có thể chấp nhận được.',
      timestamp: makeTime(3),
    },
    {
      id: `${chatAiId}-q-2`,
      role: 'user',
      sender: name,
      content:
        'Vậy còn giống nào khác phù hợp với không gian nhỏ hơn không?',
      timestamp: makeTime(4),
    },
    {
      id: `${chatAiId}-a-2`,
      role: 'ai',
      sender: 'Pawnder AI',
      content:
        'Nếu không gian hạn chế, bạn có thể cân nhắc Cavalier King Charles Spaniel, Beagle cỡ nhỏ hoặc Poodle – đều thân thiện, dễ nuôi và phù hợp với gia đình có trẻ nhỏ.',
      timestamp: makeTime(5),
    },
    {
      id: `${chatAiId}-q-3`,
      role: 'user',
      sender: name,
      content:
        'Tôi muốn xác nhận lại thông tin này với chuyên gia để chắc chắn, bạn có thể kết nối giúp tôi không?',
      timestamp: makeTime(6),
    },
    {
      id: `${chatAiId}-a-3`,
      role: 'ai',
      sender: 'Pawnder AI',
      content:
        'Tất nhiên! Tôi sẽ gửi yêu cầu của bạn cho chuyên gia để họ xem lại toàn bộ thông tin và đưa ra khuyến nghị chi tiết hơn cho trường hợp của bạn.',
      timestamp: makeTime(7),
    },
  ];
};

const ExpertNotifications = () => {
  const navigate = useNavigate();
  const { updatePendingNotifications } = useNotification();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [note, setNote] = useState('');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const prevPendingRef = useRef(0);

  const fetchUserInfo = useCallback(async (userId) => {
    if (!userId) {
      return getFallbackUserInfo(userId);
    }
    try {
      const response = await userService.getUserById(userId);
      return {
        name: response.FullName || response.fullName || `Người dùng #${userId}`,
        email: response.Email || response.email || `user${userId}@example.com`,
      };
    } catch (err) {
      console.warn(`Không thể tải thông tin user ${userId}`, err);
      return getFallbackUserInfo(userId);
    }
  }, []);

  const fetchChatHistory = useCallback(async (chatAiId, userName) => {
    console.log('🔍 fetchChatHistory called with chatAiId:', chatAiId, 'userName:', userName);
    if (!chatAiId || chatAiId === 0) {
      console.warn('⚠️ chatAiId is missing or 0, using fallback');
      const staticHistory = buildStaticAiHistory(chatAiId, userName);
      if (staticHistory) return staticHistory;
      return buildFallbackHistory({ userName, requestMessage: 'Không có thông tin chat.' });
    }
    try {
      console.log('📡 Calling API for chatAiId:', chatAiId);
      const response = await expertService.getChatHistory(chatAiId);
      console.log('📥 API Response (full):', JSON.stringify(response, null, 2));
      
      if (!response) {
        console.warn('⚠️ No response from API');
        const staticHistory = buildStaticAiHistory(chatAiId, userName);
        if (staticHistory) return staticHistory;
        return buildFallbackHistory({ userName, requestMessage: 'Không có dữ liệu chat.' });
      }

      // Backend trả về { success: true, data: { chatTitle, messages: [...] } }
      const data = response.data || response;
      const messages = data.messages || data;
      console.log('💬 Messages extracted:', messages);
      console.log('💬 Messages type:', Array.isArray(messages) ? 'Array' : typeof messages);
      console.log('💬 Messages length:', Array.isArray(messages) ? messages.length : 'Not an array');
      
      if (!Array.isArray(messages)) {
        console.error('❌ Messages is not an array:', typeof messages, messages);
        const staticHistory = buildStaticAiHistory(chatAiId, userName);
        if (staticHistory) return staticHistory;
        return buildFallbackHistory({ userName, requestMessage: 'Dữ liệu không đúng định dạng.' });
      }
      
      if (messages.length === 0) {
        console.warn('⚠️ Messages array is empty');
        const staticHistory = buildStaticAiHistory(chatAiId, userName);
        if (staticHistory) return staticHistory;
        return buildFallbackHistory({ userName, requestMessage: 'Chưa có tin nhắn trong chat.' });
      }
      
      console.log('✅ Processing', messages.length, 'messages from API');
      
      // Chuyển đổi dữ liệu từ backend (Question/Answer) thành format chat history
      const history = [];
      messages.forEach((item, idx) => {
        // Mỗi item có cả Question và Answer, tạo 2 tin nhắn
        if (item.question || item.Question) {
          history.push({
            id: `${chatAiId}-q-${idx}`,
            role: 'user',
            sender: userName,
            content: item.question || item.Question,
            timestamp: item.createdAt || item.CreatedAt || item.createdAt,
          });
        }
        if (item.answer || item.Answer) {
          history.push({
            id: `${chatAiId}-a-${idx}`,
            role: 'ai',
            sender: 'Pawnder AI',
            content: item.answer || item.Answer,
            timestamp: item.createdAt || item.CreatedAt || item.createdAt,
          });
        }
      });

      console.log('✅ Created', history.length, 'chat history items from', messages.length, 'API messages');

      // Sắp xếp theo timestamp nếu có
      history.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(a.timestamp) - new Date(b.timestamp);
      });

      if (history.length === 0) {
        console.warn('⚠️ No history items created, using fallback');
        const staticHistory = buildStaticAiHistory(chatAiId, userName);
        if (staticHistory) return staticHistory;
        return buildFallbackHistory({ userName, requestMessage: 'Chưa có tin nhắn trong chat.' });
      }

      console.log('✅ Returning', history.length, 'chat history items');
      return history;
    } catch (err) {
      console.error('❌ Error loading chat history:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const staticHistory = buildStaticAiHistory(chatAiId, userName);
      if (staticHistory) return staticHistory;
      return buildFallbackHistory({ userName, requestMessage: 'Không thể tải lịch sử chat.' });
    }
  }, []);

  const normalizeNotification = useCallback(
    async (item, index) => {
      const userId = item.UserId ?? item.userId;
      // Backend có thể trả về ChatAIId hoặc ChatAiId (PascalCase) hoặc chatAiId (camelCase)
      const chatAiId = item.ChatAIId ?? item.ChatAiId ?? item.chatAIId ?? item.chatAiId ?? 0;
      console.log('📋 Normalizing notification:', { 
        userId, 
        chatAiId, 
        'item.ChatAIId': item.ChatAIId,
        'item.ChatAiId': item.ChatAiId,
        'item.chatAIId': item.chatAIId,
        'item.chatAiId': item.chatAiId,
        itemKeys: Object.keys(item),
        fullItem: item
      });
      
      if (!chatAiId || chatAiId === 0) {
        console.error('❌ chatAiId is missing or 0! Item:', item);
      }
      
      const userInfo = await fetchUserInfo(userId);
      // Normalize status: handle various formats from backend (Confirmed, CONFIRMED, confirmed, etc.)
      let status = (item.Status || item.status || 'pending').toLowerCase();
      // Map common status variations to standard format
      if (status === 'confirmed' || status === 'accepted' || status === 'completed') {
        status = 'confirmed';
      } else if (status === 'rejected' || status === 'declined') {
        status = 'rejected';
      } else {
        status = 'pending';
      }
      const expertNote = item.Message || item.message || '';
      // Backend trả về UserQuestion, không phải RequestMessage
      const requestMessage =
        item.UserQuestion ||
        item.RequestMessage ||
        expertNote ||
        'Người dùng muốn xác thực câu trả lời từ AI.';

      const base = {
        id: `${chatAiId || 'chat'}-${userId ?? 'unknown'}-${index}`,
        expertId: item.ExpertId ?? item.expertId,
        userId: userId,
        chatAiId: chatAiId,
        status,
        expertNote: status === 'confirmed' ? expertNote : '',
        requestMessage,
        UserQuestion: item.UserQuestion || item.userQuestion || null,
        userName: userInfo.name,
        userEmail: userInfo.email,
        title: chatAiId
          ? `Chat #${chatAiId}`
          : 'Yêu cầu xác nhận thông tin AI',
        content: requestMessage,
        type: 'ai_verification',
        createdAt: item.CreatedAt ?? item.createdAt,
        updatedAt: item.UpdatedAt ?? item.updatedAt,
      };

      // Fetch chat history từ backend
      console.log('🔄 Fetching chat history for chatAiId:', chatAiId, 'userName:', userInfo.name);
      const chatHistory = await fetchChatHistory(chatAiId, userInfo.name);
      console.log('✅ Chat history fetched, length:', chatHistory?.length || 0);
      if (chatHistory?.length === 2) {
        console.warn('⚠️ Only 2 messages - might be using fallback! Check API response above.');
      }

      return {
        ...base,
        aiQuestion: requestMessage,
        aiAnswer: expertNote || 'Chưa có ghi chú từ chuyên gia',
        chatHistory: chatHistory,
      };
    },
    [fetchUserInfo, fetchChatHistory]
  );

  const loadFromBackend = useCallback(async () => {
    const response = await expertService.getExpertConfirmations({
      includeDeleted: false,
    });

    const payload = Array.isArray(response)
      ? response
      : response?.data ||
        response?.Items ||
        response?.items ||
        response?.results ||
        [];

    const normalized = await Promise.all(
      payload.map((item, index) => normalizeNotification(item, index))
    );

    return normalized;
  }, [normalizeNotification]);

  const loadMockNotifications = useCallback(() => {
    const sample = mockUsers.slice(0, 4).map((user, idx) => ({
      id: `mock-${idx + 1}`,
      expertId: 2,
      userId: user.id,
      chatAiId: 1000 + idx,
      status: idx % 2 === 0 ? 'pending' : 'confirmed',
      expertNote:
        idx % 2 === 0
          ? ''
          : 'AI trả lời chính xác, hãy theo dõi thêm trong 3 ngày tới.',
      requestMessage: 'Người dùng yêu cầu xác thực câu trả lời AI.',
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      title: 'Yêu cầu xác nhận thông tin AI',
      content: 'Người dùng premium cần chuyên gia xác nhận câu trả lời AI.',
      type: 'ai_verification',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return sample.map((item) => ({
      ...item,
      aiQuestion: item.requestMessage,
      aiAnswer: item.expertNote || 'Chưa có ghi chú từ chuyên gia',
      chatHistory: buildFallbackHistory(item),
    }));
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data = [];
      try {
        data = await loadFromBackend();
      } catch (apiError) {
        console.warn('Không thể tải từ backend, dùng mock data.', apiError);
        data = loadMockNotifications();
      }

      setNotifications(data);
      const pendingCount = data.filter((n) => n.status === 'pending').length;
      if (pendingCount !== prevPendingRef.current) {
        updatePendingNotifications(data);
        prevPendingRef.current = pendingCount;
      }
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
      setError('Không thể tải dữ liệu thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [loadFromBackend, loadMockNotifications, updatePendingNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = useMemo(() => {
    const sortByCreatedDesc = (list) =>
      [...list].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

    let filtered = notifications;

    // Filter by status
    if (filterStatus === 'pending') {
      filtered = filtered.filter((n) => n.status === 'pending');
    } else if (filterStatus === 'all') {
      filtered = filtered.filter((n) => n.status === 'confirmed');
    } else {
      filtered = filtered.filter((n) => n.status === 'confirmed');
    }

    // Filter by search term (user name)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((n) => {
        const userName = (n.userName || '').toLowerCase();
        return userName.includes(searchLower);
      });
    }

    return sortByCreatedDesc(filtered);
  }, [filterStatus, notifications, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)
  );

  const currentNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const normalized = (status || 'pending').toLowerCase();
    const map = {
      pending: { label: 'Chờ xử lý', class: 'status-pending' },
      confirmed: { label: 'Đã xác nhận', class: 'status-confirmed' },
      rejected: { label: 'Đã từ chối', class: 'status-rejected' },
    };
    const info = map[normalized] || map.pending;
    return <span className={`status-badge ${info.class}`}>{info.label}</span>;
  };


  const handleViewDetail = (notification) => {
    setSelectedNotification(notification);
    setShowConfirmModal(true);
    setNote(notification.status === 'pending' ? '' : notification.expertNote || '');
    setShowChatHistory(false);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setSelectedNotification(null);
    setNote('');
    setShowChatHistory(false);
  };

  const handleConfirm = async () => {
    if (!selectedNotification) return;
    const trimmedNote = note.trim();
    if (!trimmedNote) {
      alert('Vui lòng nhập ghi chú trước khi xác nhận.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Lấy expertId từ notification hoặc từ user đang đăng nhập
      const expertId = selectedNotification.expertId || user?.UserId || user?.userId;
      if (!expertId) {
        alert('Không thể xác định chuyên gia. Vui lòng đăng nhập lại.');
        return;
      }

      // Update expert confirmation
      // Note: Backend will automatically create notification for user when status = "confirmed"
      const confirmResult = await expertService.updateExpertConfirmation(
        expertId,
        selectedNotification.userId,
        selectedNotification.chatAiId,
        { Status: 'confirmed', Message: trimmedNote }
      );
      
      console.log('✅ Expert confirmation updated:', confirmResult);
      console.log('📧 Backend will automatically send notification to user (UserId:', selectedNotification.userId, ')');

      // Update local state immediately for better UX
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === selectedNotification.id
            ? {
                ...notif,
                status: 'confirmed',
                expertNote: trimmedNote,
                updatedAt: new Date().toISOString(),
                chatHistory: buildFallbackHistory({
                  ...notif,
                  expertNote: trimmedNote,
                  updatedAt: new Date().toISOString(),
                }),
              }
            : notif
        )
      );

      alert('Đã xác nhận thông báo thành công.');
      handleCloseModal();
      // Switch to "all processed" view to show the confirmed notification
      setFilterStatus('all');
      setCurrentPage(1);

      // Reload notifications from backend in background to ensure sync
      // This ensures that when user clicks "Làm mới", the status is correctly displayed
      loadNotifications().catch((err) => {
        console.error('Error reloading notifications after confirmation:', err);
      });
    } catch (err) {
      console.error('Lỗi khi xác nhận thông báo:', err);
      alert('Không thể xác nhận thông báo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clone chat AI and navigate to ExpertChatAI page
  const handleCloneChatAndNavigate = async (chatAiId) => {
    if (!chatAiId || chatAiId === 0) {
      alert('Không tìm thấy ID cuộc trò chuyện.');
      return;
    }

    try {
      setCloning(true);
      console.log('🔄 Cloning chat AI:', chatAiId);
      
      const result = await chatAIService.cloneChat(chatAiId);
      console.log('✅ Clone result:', result);
      
      // Backend returns: { success: true, data: { chatId, title, ... } }
      const clonedChatId = result?.data?.chatId || result?.data?.chatAiId || result?.chatId;
      
      if (!clonedChatId) {
        throw new Error('Không thể lấy ID chat đã clone');
      }

      console.log('📍 Navigating to ExpertChatAI with clonedChatId:', clonedChatId);
      
      // Close modal and navigate
      handleCloseModal();
      navigate(`/expert/chat-ai?clonedChatId=${clonedChatId}`);
    } catch (err) {
      console.error('❌ Error cloning chat:', err);
      alert('Không thể tạo cuộc trò chuyện mới. Vui lòng thử lại.');
    } finally {
      setCloning(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  if (loading) {
    return (
      <div className="expert-notifications-page">
        <div className="loading">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="expert-notifications-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Quản lý thông báo</h1>
            <p>Xác nhận và xử lý các yêu cầu xác thực thông tin AI từ người dùng.</p>
          </div>
          <div className="header-actions">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo tên người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="search-clear"
                  onClick={() => setSearchTerm('')}
                  title="Xóa tìm kiếm"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            <button
              className="view-all-processed-btn"
              onClick={() =>
                setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')
              }
            >
              {filterStatus === 'pending' ? 'Xem tất cả đã xử lý' : 'Xem chờ xử lý'}
            </button>
            <button className="secondary-btn" onClick={loadNotifications}>
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="notifications-stats">
        <div className="stat-card">
          <div className="stat-label">Tổng số thông báo</div>
          <div className="stat-value">{notifications.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Chờ xử lý</div>
          <div className="stat-value">
            {notifications.filter((n) => n.status === 'pending').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đã xác nhận</div>
          <div className="stat-value">
            {notifications.filter((n) => n.status === 'confirmed').length}
          </div>
        </div>
      </div>

      <div className="notifications-table-container">
        <table className="notifications-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Người dùng</th>
              <th>Câu hỏi người dùng</th>
              {filterStatus !== 'pending' && <th>Nội dung</th>}
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentNotifications.length === 0 ? (
              <tr>
                <td colSpan={filterStatus === 'pending' ? 6 : 7} style={{ textAlign: 'center', padding: '2rem' }}>
                  {filterStatus === 'pending'
                    ? 'Không có thông báo nào chờ xử lý'
                    : 'Không có thông báo nào đã xử lý'}
                </td>
              </tr>
            ) : (
              currentNotifications.map((notification, index) => (
                <tr key={notification.id}>
                  <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{notification.userName}</div>
                      <div className="user-email">{notification.userEmail}</div>
                    </div>
                  </td>
                  <td className="content-cell">
                    {notification.UserQuestion || notification.aiQuestion || notification.requestMessage || 'Không có'}
                  </td>
                  {filterStatus !== 'pending' && (
                    <td className="content-cell">
                      {notification.expertNote || notification.content || 'Không có'}
                    </td>
                  )}
                  <td>{formatDateOnly(notification.createdAt)}</td>
                  <td>{getStatusBadge(notification.status)}</td>
                  <td>
                    {notification.status === 'pending' ? (
                      <div className="action-buttons">
                        <button
                          className="btn-confirm"
                          onClick={() => handleViewDetail(notification)}
                        >
                          Xác nhận
                        </button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button
                          className="btn-view"
                          onClick={() => handleViewDetail(notification)}
                          title="Xem chi tiết"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn prev"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Trước
          </button>
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            className="pagination-btn next"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {showConfirmModal && selectedNotification && createPortal(
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className={`modal-content ${showChatHistory && selectedNotification?.chatHistory?.length > 0 ? 'has-chat-history' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Xác nhận thông báo</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-body-content">
                <div className="modal-left-panel">
                    <div className="notification-detail">
                    <div className="detail-section">
                      <h3>Thông tin thông báo</h3>
                      <div className="detail-row">
                        <span className="detail-label">Người dùng:</span>
                        <span className="detail-value">
                          {selectedNotification.userName} ({selectedNotification.userEmail})
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Ngày tạo:</span>
                        <span className="detail-value">{formatDate(selectedNotification.createdAt)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Trạng thái:</span>
                        <span className="detail-value">{getStatusBadge(selectedNotification.status)}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h3>Câu hỏi người dùng</h3>
                      <div className="detail-row">
                        <span className="detail-label">Nội dung câu hỏi:</span>
                        <span className="detail-value">
                          {selectedNotification.UserQuestion ||
                            selectedNotification.aiQuestion ||
                            selectedNotification.requestMessage ||
                            'Không có'}
                        </span>
                      </div>
                    </div>

                    {selectedNotification.chatHistory.length > 0 && (
                      <div className="detail-section chat-history-section">
                        <h3>File đoạn chat</h3>
                        <div
                          className="chat-file-card"
                          role="button"
                          tabIndex={0}
                          onClick={() => setShowChatHistory((prev) => !prev)}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowChatHistory((prev) => !prev)}
                        >
                          <div className="chat-file-icon">
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                              <polyline points="13 2 13 9 20 9" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </div>
                          <div className="chat-file-info">
                            <div className="chat-file-name">chat_{selectedNotification.chatAiId}.txt</div>
                            <div className="chat-file-meta">
                              {selectedNotification.chatHistory.length} tin nhắn · Nhấn để {showChatHistory ? 'ẩn' : 'xem'}
                            </div>
                          </div>
                          <div className="chat-file-action">
                            {showChatHistory ? 'Đang mở' : 'Xem file'}
                          </div>
                        </div>
                        {/* Clone Chat AI Button */}
                        <button
                          className="btn-clone-chat"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloneChatAndNavigate(selectedNotification.chatAiId);
                          }}
                          disabled={cloning}
                        >
                          {cloning ? (
                            <>
                              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" />
                              </svg>
                              Đang tạo...
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                              </svg>
                              Chat với AI
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {selectedNotification.status === 'pending' ? (
                      <div className="note-section">
                        <h3>Đánh giá và ghi chú từ chuyên gia</h3>
                        <p className="note-instruction">
                          Hãy đánh giá tính chính xác của câu trả lời và bổ sung thông tin hữu ích cho người dùng.
                        </p>
                        <textarea
                          className="note-textarea"
                          placeholder="Ví dụ: 'Thông tin AI đúng nhưng cần bổ sung...' hoặc 'Thông tin AI cần điều chỉnh...'"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={6}
                        />
                      </div>
                    ) : (
                      <div className="note-section">
                        <h3>Ghi chú đã gửi cho người dùng</h3>
                        <div className="note-display">
                          {selectedNotification.expertNote || 'Không có ghi chú'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {showChatHistory && selectedNotification.chatHistory.length > 0 && (
                  <div className="modal-right-panel">
                    <div className="chat-history-panel">
                      <div className="chat-history-header">
                        <h3>Lịch sử chat</h3>
                        <button
                          className="btn-clone-chat-small"
                          onClick={() => handleCloneChatAndNavigate(selectedNotification.chatAiId)}
                          disabled={cloning}
                          title="Tiếp tục chat với AI dựa trên cuộc trò chuyện này"
                        >
                          {cloning ? (
                            <>
                              <svg className="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" />
                              </svg>
                              Đang tạo...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                              </svg>
                              Chat với AI
                            </>
                          )}
                        </button>
                      </div>
                      <div className="chat-history">
                        {selectedNotification.chatHistory.map((message) => (
                          <div key={message.id} className={`chat-message ${message.role}`}>
                            <div className="chat-message-meta">
                              <span className="chat-sender">
                                {message.sender || (message.role === 'ai' ? 'Pawnder AI' : selectedNotification.userName)}
                              </span>
                              {message.timestamp && (
                                <span className="chat-time">{formatDate(message.timestamp)}</span>
                              )}
                            </div>
                            <div className="chat-message-content">
                              {message.role === 'ai' ? stripMarkdown(message.content) : message.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {selectedNotification.status === 'pending' ? (
                <>
                  <button className="btn-cancel" onClick={handleCloseModal}>
                    Hủy
                  </button>
                  <button
                    className="btn-confirm-modal"
                    onClick={handleConfirm}
                    disabled={!note.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Xác nhận và gửi'}
                  </button>
                </>
              ) : (
                <button className="btn-close-modal" onClick={handleCloseModal}>
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ExpertNotifications;

