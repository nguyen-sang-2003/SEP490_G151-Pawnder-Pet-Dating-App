import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { STORAGE_KEYS } from '../../constants';
import { mockUsers } from '../../data/mockUsers';
import './ExpertNotifications.css';

const ExpertNotifications = () => {
  const { updatePendingNotifications } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending' or 'all'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [note, setNote] = useState('');
  const itemsPerPage = 8;
  const hasLoadedRef = useRef(false); // Flag để đảm bảo chỉ load một lần

  // Load notifications từ localStorage hoặc mock data
  useEffect(() => {
    // Chỉ load một lần duy nhất
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    // Helper function để enrich notifications với user info từ mockUsers
    const getUserInfo = (userId) => {
      const user = mockUsers.find(u => u.id === userId);
      if (user) {
        return {
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email
        };
      }
      return { userName: 'Unknown User', userEmail: 'unknown@email.com' };
    };
    
    const enrichNotifications = (notifications) => {
      return notifications.map(notif => ({
        ...notif,
        ...getUserInfo(notif.userId)
      }));
    };
    
    // Kiểm tra flag đã khởi tạo - nếu đã có thì KHÔNG BAO GIỜ load mock data
    const isInitialized = localStorage.getItem(STORAGE_KEYS.EXPERT_NOTIFICATIONS_INITIALIZED) === 'true';
    
    // Kiểm tra xem có dữ liệu đã lưu trong localStorage không
    const savedNotifications = localStorage.getItem(STORAGE_KEYS.EXPERT_NOTIFICATIONS);
    
    // Ưu tiên load từ localStorage nếu có dữ liệu hợp lệ
    if (savedNotifications && savedNotifications.trim() !== '') {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        // Kiểm tra xem parsed data có phải là array không
        if (Array.isArray(parsedNotifications) && parsedNotifications.length > 0) {
          // Enrich notifications với user info từ mockUsers
          const enrichedNotifications = enrichNotifications(parsedNotifications);
          setNotifications(enrichedNotifications);
          updatePendingNotifications(enrichedNotifications);
          // Đảm bảo flag initialized được set
          localStorage.setItem(STORAGE_KEYS.EXPERT_NOTIFICATIONS_INITIALIZED, 'true');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
        // Nếu có lỗi parse, chỉ xóa nếu chưa initialized
        if (!isInitialized) {
          localStorage.removeItem(STORAGE_KEYS.EXPERT_NOTIFICATIONS);
        } else {
          // Nếu đã initialized nhưng có lỗi, giữ nguyên và không load mock data
          console.warn('Notifications data corrupted but initialized flag is set. Keeping existing data.');
          setLoading(false);
          return;
        }
      }
    }
    
    // CHỈ load mock data nếu:
    // 1. Chưa có flag initialized VÀ
    // 2. localStorage trống hoặc không hợp lệ
    // Nếu đã initialized thì KHÔNG BAO GIỜ load mock data nữa
    if (isInitialized) {
      // Đã initialized nhưng không có dữ liệu - có thể đã bị xóa bởi user
      // Giữ nguyên state rỗng, không load mock data
      console.warn('Notifications initialized but no data found. Keeping empty state.');
      setNotifications([]);
      updatePendingNotifications([]);
      setLoading(false);
      return;
    }
    
    // Nếu không có dữ liệu đã lưu, load mock data
    // 15 notifications từ 8 users (1 user có thể có nhiều notifications)
    // Sử dụng getUserInfo để đảm bảo userName và userEmail khớp với mockUsers
    setTimeout(() => {
      const getUserInfo = (userId) => {
        const user = mockUsers.find(u => u.id === userId);
        if (user) {
          return {
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email
          };
        }
        return { userName: 'Unknown User', userEmail: 'unknown@email.com' };
      };

      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          ...getUserInfo(1),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo của tôi 6 tháng tuổi, đang bị ho và chảy nước mũi. Tôi nên làm gì?',
          aiAnswer: 'Với mèo 6 tháng tuổi bị ho và chảy nước mũi, có thể là dấu hiệu của nhiễm trùng đường hô hấp. Bạn nên đưa mèo đến bác sĩ thú y để được khám và điều trị kịp thời. Trong khi chờ đợi, hãy giữ mèo ở nơi ấm áp, khô ráo và đảm bảo mèo uống đủ nước.',
          petName: 'Buddy',
          petType: 'Mèo',
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          userId: 1, // User 1 có thêm notification thứ 2
          ...getUserInfo(1),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo nhà tôi không chịu ăn trong 2 ngày. Có phải là vấn đề nghiêm trọng không?',
          aiAnswer: 'Mèo không ăn trong 2 ngày là dấu hiệu đáng lo ngại. Có thể do nhiều nguyên nhân như bệnh lý, stress, hoặc thay đổi môi trường. Bạn nên đưa mèo đến bác sĩ thú y càng sớm càng tốt để được chẩn đoán và điều trị.',
          petName: 'Whiskers',
          petType: 'Mèo',
          createdAt: '2024-01-15T09:15:00Z',
        },
        {
          id: 3,
          userId: 2,
          ...getUserInfo(2),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo của tôi đang mang thai, nên cho ăn gì và chăm sóc như thế nào?',
          aiAnswer: 'Mèo mang thai cần chế độ dinh dưỡng đặc biệt. Nên tăng lượng thức ăn từ từ, chia nhỏ bữa ăn, và sử dụng thức ăn chất lượng cao giàu protein. Tránh vận động mạnh, giữ môi trường yên tĩnh và ấm áp. Nên tham khảo ý kiến bác sĩ thú y về chế độ ăn phù hợp.',
          petName: 'Luna',
          petType: 'Mèo',
          createdAt: '2024-01-14T16:45:00Z',
        },
        {
          id: 4,
          userId: 2, // User 2 có thêm notification thứ 2
          ...getUserInfo(2),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'confirmed',
          aiQuestion: 'Mèo nhà tôi thường xuyên nôn mửa sau khi ăn. Có phải do thức ăn không phù hợp?',
          aiAnswer: 'Nôn mửa thường xuyên sau khi ăn ở mèo có thể do nhiều nguyên nhân: ăn quá nhanh, dị ứng thức ăn, hoặc vấn đề tiêu hóa. Nên thử cho ăn chậm hơn, chia nhỏ bữa, và nếu vẫn tiếp tục, nên đưa đến bác sĩ thú y.',
          petName: 'Mimi',
          petType: 'Mèo',
          expertNote: 'Thông tin AI đưa ra là chính xác. Nôn mửa thường xuyên ở mèo cần được theo dõi kỹ. Nếu tình trạng kéo dài, nên đưa đến bác sĩ thú y để kiểm tra các vấn đề như viêm dạ dày hoặc tắc nghẽn đường tiêu hóa.',
          createdAt: '2024-01-13T14:20:00Z',
        },
        {
          id: 5,
          userId: 3,
          ...getUserInfo(3),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'confirmed',
          aiQuestion: 'Mèo con 2 tháng tuổi có thể tắm được chưa?',
          aiAnswer: 'Mèo con 2 tháng tuổi có thể tắm được, nhưng cần cẩn thận. Nên dùng nước ấm, sữa tắm dành cho mèo con, và tắm nhanh để tránh cảm lạnh. Sau khi tắm, lau khô ngay và giữ ấm. Không nên tắm quá thường xuyên, chỉ khi cần thiết.',
          petName: 'Max',
          petType: 'Mèo',
          expertNote: 'Thông tin AI đúng nhưng cần bổ sung: Mèo con 2 tháng tuổi nên tắm sau khi đã tiêm phòng đầy đủ và đảm bảo sức khỏe tốt. Nên tắm trong phòng kín gió, dùng nước ấm (37-38°C), và sấy khô hoàn toàn sau khi tắm.',
          createdAt: '2024-01-12T11:10:00Z',
        },
        {
          id: 6,
          userId: 3, // User 3 có thêm notification thứ 2
          ...getUserInfo(3),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'confirmed',
          aiQuestion: 'Mèo nhà tôi đột nhiên hung dữ, cắn người. Có phải do bệnh không?',
          aiAnswer: 'Mèo đột nhiên hung dữ có thể do nhiều nguyên nhân: đau đớn, bệnh lý, stress, hoặc thay đổi môi trường. Nên đưa mèo đến bác sĩ thú y để kiểm tra sức khỏe, đặc biệt là kiểm tra các vấn đề về răng miệng hoặc đau đớn ẩn.',
          petName: 'Snow',
          petType: 'Mèo',
          expertNote: 'Thông tin AI chính xác. Mèo đột nhiên hung dữ thường là dấu hiệu của vấn đề sức khỏe nghiêm trọng. Nên đưa đến bác sĩ thú y ngay để kiểm tra, đặc biệt là các vấn đề về thần kinh, đau đớn, hoặc bệnh lý khác.',
          createdAt: '2024-01-11T08:30:00Z',
        },
        {
          id: 7,
          userId: 4,
          ...getUserInfo(4),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo của tôi 3 tuổi bị tiêu chảy 2 ngày. Có nên đưa đến bác sĩ thú y không?',
          aiAnswer: 'Tiêu chảy ở mèo trong 2 ngày có thể do nhiều nguyên nhân: thay đổi thức ăn, nhiễm khuẩn, hoặc vấn đề tiêu hóa. Nếu mèo vẫn ăn uống bình thường và không có dấu hiệu mất nước, có thể theo dõi thêm. Nếu tiêu chảy kéo dài hoặc có máu, nên đưa đến bác sĩ thú y ngay.',
          petName: 'Rocky',
          petType: 'Mèo',
          createdAt: '2024-01-10T14:20:00Z',
        },
        {
          id: 8,
          userId: 5,
          ...getUserInfo(5),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo con 2 tháng tuổi có thể tách khỏi mẹ chưa?',
          aiAnswer: 'Mèo con 2 tháng tuổi đã có thể tách khỏi mẹ, nhưng cần đảm bảo mèo con đã được cai sữa hoàn toàn và ăn thức ăn rắn. Nên cho mèo con ăn thức ăn dành cho mèo con, chia nhỏ bữa ăn nhiều lần trong ngày, và đảm bảo mèo con được giữ ấm và an toàn.',
          petName: 'Kitty',
          petType: 'Mèo',
          createdAt: '2024-01-09T11:15:00Z',
        },
        {
          id: 9,
          userId: 5, // User 5 có thêm notification thứ 2
          ...getUserInfo(5),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo nhà tôi thường xuyên gãi và cắn chân. Có phải do ve rận không?',
          aiAnswer: 'Mèo gãi và cắn chân thường xuyên có thể do nhiều nguyên nhân: ve rận, dị ứng, nấm da, hoặc vấn đề về da. Nên kiểm tra da mèo để tìm ve rận hoặc dấu hiệu bất thường. Nếu có ve rận, cần điều trị ngay. Nếu không tìm thấy ve rận, nên đưa đến bác sĩ thú y để kiểm tra.',
          petName: 'Max',
          petType: 'Mèo',
          createdAt: '2024-01-08T09:30:00Z',
        },
        {
          id: 10,
          userId: 6,
          ...getUserInfo(6),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'confirmed',
          aiQuestion: 'Mèo nhà tôi không chịu đi vệ sinh trong khay cát. Làm sao để huấn luyện lại?',
          aiAnswer: 'Mèo không chịu đi vệ sinh trong khay cát có thể do nhiều nguyên nhân: khay cát bẩn, vị trí không phù hợp, hoặc vấn đề sức khỏe. Nên vệ sinh khay cát thường xuyên, đặt ở vị trí yên tĩnh, và thử thay đổi loại cát. Nếu vẫn không hiệu quả, nên đưa đến bác sĩ thú y để kiểm tra.',
          petName: 'Luna',
          petType: 'Mèo',
          expertNote: 'Thông tin AI đúng. Ngoài ra, nên kiểm tra xem mèo có bị stress hoặc thay đổi môi trường không. Có thể thử nhiều loại cát khác nhau và đảm bảo khay cát đủ lớn cho mèo.',
          createdAt: '2024-01-07T16:45:00Z',
        },
        {
          id: 11,
          userId: 6, // User 6 có thêm notification thứ 2
          ...getUserInfo(6),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo con 1 tháng tuổi nên cho ăn gì?',
          aiAnswer: 'Mèo con 1 tháng tuổi vẫn cần sữa mẹ hoặc sữa thay thế. Nếu không có sữa mẹ, nên dùng sữa công thức dành cho mèo con và cho ăn nhiều lần trong ngày. Có thể bắt đầu cho ăn thức ăn mềm dành cho mèo con từ 3-4 tuần tuổi, nhưng vẫn cần sữa.',
          petName: 'Bella',
          petType: 'Mèo',
          createdAt: '2024-01-06T13:20:00Z',
        },
        {
          id: 12,
          userId: 7,
          ...getUserInfo(7),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'confirmed',
          aiQuestion: 'Mèo nhà tôi thường xuyên nôn ra lông. Có bình thường không?',
          aiAnswer: 'Mèo nôn ra lông là hiện tượng bình thường, đặc biệt là ở mèo lông dài. Để giảm thiểu, nên chải lông cho mèo thường xuyên, cho ăn thức ăn giúp tống lông ra ngoài, và đảm bảo mèo uống đủ nước. Nếu nôn quá thường xuyên hoặc có máu, nên đưa đến bác sĩ thú y.',
          petName: 'Mimi',
          petType: 'Mèo',
          expertNote: 'Thông tin AI chính xác. Nôn ra lông là bình thường, nhưng nếu quá 2-3 lần/tuần thì nên chải lông thường xuyên hơn và có thể cần bổ sung dầu cá hoặc thức ăn đặc biệt.',
          createdAt: '2024-01-05T10:10:00Z',
        },
        {
          id: 13,
          userId: 7, // User 7 có thêm notification thứ 2
          ...getUserInfo(7),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo của tôi 5 tuổi đột nhiên đi tiểu nhiều hơn bình thường. Có phải do bệnh không?',
          aiAnswer: 'Mèo đi tiểu nhiều hơn bình thường có thể do nhiều nguyên nhân: nhiễm trùng đường tiết niệu, bệnh thận, tiểu đường, hoặc uống nhiều nước do thời tiết. Nên đưa mèo đến bác sĩ thú y để kiểm tra, đặc biệt là nếu có kèm theo các triệu chứng khác như khát nước nhiều, mệt mỏi, hoặc nước tiểu có máu.',
          petName: 'Charlie',
          petType: 'Mèo',
          createdAt: '2024-01-04T15:30:00Z',
        },
        {
          id: 14,
          userId: 8,
          ...getUserInfo(8),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'pending',
          aiQuestion: 'Mèo nhà tôi không chịu ăn thức ăn mới. Làm sao để tập cho ăn?',
          aiAnswer: 'Để tập mèo ăn thức ăn mới, nên trộn từ từ với thức ăn cũ, tăng dần tỷ lệ thức ăn mới. Cho ăn vào cùng thời điểm và địa điểm quen thuộc. Có thể làm ấm thức ăn để tăng mùi thơm. Không nên ép mèo ăn, hãy kiên nhẫn và thử lại sau.',
          petName: 'Oreo',
          petType: 'Mèo',
          createdAt: '2024-01-03T12:00:00Z',
        },
        {
          id: 15,
          userId: 8, // User 8 có thêm notification thứ 2
          ...getUserInfo(8),
          title: 'Yêu cầu xác nhận thông tin AI',
          content: 'Người dùng premium yêu cầu xác nhận thông tin từ AI',
          type: 'ai_verification',
          status: 'confirmed',
          aiQuestion: 'Mèo con 3 tháng tuổi nên tiêm phòng những gì?',
          aiAnswer: 'Mèo con 3 tháng tuổi nên tiêm phòng các loại vắc-xin: FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia), và có thể bắt đầu tiêm phòng dại. Nên tham khảo ý kiến bác sĩ thú y về lịch tiêm phòng phù hợp với từng giống mèo và khu vực.',
          petName: 'Daisy',
          petType: 'Mèo',
          expertNote: 'Thông tin AI đúng. Lịch tiêm phòng thường là: 6-8 tuần (FVRCP lần 1), 10-12 tuần (FVRCP lần 2), 14-16 tuần (FVRCP lần 3 + dại). Nên tuân thủ lịch tiêm phòng để đảm bảo sức khỏe cho mèo con.',
          createdAt: '2024-01-02T08:15:00Z',
        },
      ];
      
      // Enrich notifications với user info từ mockUsers
      const enrichedNotifications = enrichNotifications(mockNotifications);
      setNotifications(enrichedNotifications);
      updatePendingNotifications(enrichedNotifications);
      
      // Lưu vào localStorage (chỉ lưu userId, không lưu userName/userEmail để tránh trùng lặp)
      // Khi load lại, sẽ enrich từ mockUsers
      const normalizedNotifications = mockNotifications.map(notif => {
        const { userName, userEmail, ...rest } = notif;
        return rest; // Chỉ giữ userId, không giữ userName/userEmail
      });
      localStorage.setItem(STORAGE_KEYS.EXPERT_NOTIFICATIONS, JSON.stringify(normalizedNotifications));
      
      // QUAN TRỌNG: Đánh dấu đã khởi tạo để ngăn chặn reset về mock data sau này
      localStorage.setItem(STORAGE_KEYS.EXPERT_NOTIFICATIONS_INITIALIZED, 'true');
      
      setLoading(false);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi component mount

  const handleViewDetail = (notification) => {
    setSelectedNotification(notification);
    setShowConfirmModal(true);
    setNote('');
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setSelectedNotification(null);
    setNote('');
  };

  const handleConfirm = async () => {
    if (!selectedNotification) return;
    
    try {
      // TODO: Call API to confirm notification with note
      
      // Update local state - sử dụng functional update để đảm bảo state được cập nhật đúng
      setNotifications(prevNotifications => {
        const updated = prevNotifications.map(notif => {
          if (notif.id === selectedNotification.id) {
            return { ...notif, status: 'confirmed', expertNote: note };
          }
          return notif;
        });
        
        // Lưu vào localStorage (normalize - chỉ giữ userId, không giữ userName/userEmail)
        // Khi load lại, sẽ enrich từ mockUsers
        const normalizedNotifications = updated.map(notif => {
          const { userName, userEmail, ...rest } = notif;
          return rest; // Chỉ giữ userId, không giữ userName/userEmail
        });
        localStorage.setItem(STORAGE_KEYS.EXPERT_NOTIFICATIONS, JSON.stringify(normalizedNotifications));
        
        // QUAN TRỌNG: Đảm bảo flag initialized luôn được set khi có thay đổi
        // Ngăn chặn reset về mock data
        localStorage.setItem(STORAGE_KEYS.EXPERT_NOTIFICATIONS_INITIALIZED, 'true');
        
        return updated;
      });
      
      // Đóng modal trước
      handleCloseModal();
      
      // Chuyển sang màn "Xem tất cả đã xử lý" sau khi state được cập nhật
      // Sử dụng setTimeout để đảm bảo state update hoàn tất trước khi filter
      setTimeout(() => {
        setFilterStatus('all');
        setCurrentPage(1);
      }, 150);
      
      alert('Đã xác nhận thông báo thành công!');
    } catch (error) {
      console.error('Error confirming notification:', error);
      alert('Có lỗi xảy ra khi xác nhận thông báo');
    }
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Chờ xử lý', class: 'status-pending' },
      confirmed: { label: 'Đã xác nhận', class: 'status-confirmed' },
      rejected: { label: 'Đã từ chối', class: 'status-rejected' },
    };
    
    const statusInfo = statusMap[status] || statusMap.pending;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      ai_verification: 'Xác nhận thông tin AI',
      account_verification: 'Xác nhận tài khoản',
      support_request: 'Yêu cầu hỗ trợ',
      report: 'Báo cáo vi phạm',
    };
    return typeMap[type] || type;
  };

  // Filter notifications based on filterStatus
  const filteredNotifications = filterStatus === 'pending' 
    ? notifications.filter(notif => notif.status === 'pending')
    : notifications.filter(notif => notif.status === 'confirmed');
  
  // Debug: Log filtered notifications (chỉ log khi cần thiết để tránh spam)
  // Đã tắt debug logs để tránh spam console
  
  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = filteredNotifications.slice(startIndex, endIndex);
  
  // Update pending notifications in context khi notifications thay đổi
  // Sử dụng useRef để tránh vòng lặp vô hạn
  const prevPendingCountRef = useRef(notifications.filter(n => n.status === 'pending').length);
  
  useEffect(() => {
    const currentPendingCount = notifications.filter(n => n.status === 'pending').length;
    
    // Chỉ update khi có thay đổi về pending count
    if (currentPendingCount !== prevPendingCountRef.current) {
      updatePendingNotifications(notifications);
      prevPendingCountRef.current = currentPendingCount;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]); // Depend vào notifications để detect khi status thay đổi
  
  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  if (loading) {
    return (
      <div className="expert-notifications-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="expert-notifications-page">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Quản lý thông báo</h1>
            <p>Xác nhận và xử lý các thông báo từ người dùng</p>
          </div>
          <button
            className="view-all-processed-btn"
            onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
          >
            {filterStatus === 'pending' ? 'Xem tất cả đã xử lý' : 'Xem chờ xử lý'}
          </button>
        </div>
      </div>

      <div className="notifications-stats">
        <div className="stat-card">
          <div className="stat-label">Tổng số thông báo</div>
          <div className="stat-value">{notifications.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Chờ xử lý</div>
          <div className="stat-value">
            {notifications.filter(n => n.status === 'pending').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đã xác nhận</div>
          <div className="stat-value">
            {notifications.filter(n => n.status === 'confirmed').length}
          </div>
        </div>
      </div>

      <div className="notifications-table-container">
        <table className="notifications-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Loại</th>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentNotifications.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  {filterStatus === 'pending' 
                    ? 'Không có thông báo nào chờ xử lý'
                    : 'Không có thông báo nào đã xử lý'}
                </td>
              </tr>
            ) : (
              currentNotifications.map((notification, index) => (
                <tr key={notification.id}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{notification.userName}</div>
                      <div className="user-email">{notification.userEmail}</div>
                    </div>
                  </td>
                  <td>{getTypeLabel(notification.type)}</td>
                  <td>{notification.title}</td>
                  <td className="content-cell">{notification.content}</td>
                  <td>{formatDate(notification.createdAt)}</td>
                  <td>{getStatusBadge(notification.status)}</td>
                  <td>
                    {filterStatus === 'pending' && notification.status === 'pending' && (
                      <div className="action-buttons">
                        <button
                          className="btn-confirm"
                          onClick={() => handleViewDetail(notification)}
                        >
                          Xác nhận
                        </button>
                      </div>
                    )}
                    {filterStatus === 'all' && (
                      <div className="action-buttons">
                        <button
                          className="btn-view"
                          onClick={() => handleViewDetail(notification)}
                          title="Xem chi tiết"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
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
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
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
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedNotification && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận thông báo</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="notification-detail">
                <div className="detail-section">
                  <h3>Thông tin thông báo</h3>
                  <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedNotification.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Người dùng:</span>
                    <span className="detail-value">{selectedNotification.userName} ({selectedNotification.userEmail})</span>
                  </div>
                  {selectedNotification.petName && (
                    <div className="detail-row">
                      <span className="detail-label">Thú cưng:</span>
                      <span className="detail-value">{selectedNotification.petName} ({selectedNotification.petType})</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Loại:</span>
                    <span className="detail-value">{getTypeLabel(selectedNotification.type)}</span>
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

                {selectedNotification.aiQuestion && (
                  <div className="detail-section">
                    <h3>Câu hỏi của người dùng</h3>
                    <div className="question-display">
                      {selectedNotification.aiQuestion}
                    </div>
                  </div>
                )}

                {selectedNotification.aiAnswer && (
                  <div className="detail-section">
                    <h3>Trả lời từ AI</h3>
                    <div className="ai-answer-display">
                      {selectedNotification.aiAnswer}
                    </div>
                  </div>
                )}

                {selectedNotification.status === 'pending' && (
                  <div className="note-section">
                    <h3>Đánh giá và ghi chú từ chuyên gia</h3>
                    <p className="note-instruction">
                      Vui lòng xem xét câu trả lời của AI và đánh giá tính chính xác. Nhập ghi chú hoặc bổ sung thông tin cho người dùng.
                    </p>
                    <textarea
                      className="note-textarea"
                      placeholder="Nhập đánh giá và ghi chú của bạn về thông tin AI đưa ra. Ví dụ: 'Thông tin AI đúng nhưng cần bổ sung...' hoặc 'Thông tin AI cần điều chỉnh...'"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={6}
                    />
                  </div>
                )}
                {selectedNotification.status === 'confirmed' && (
                  <div className="note-section">
                    <h3>Đánh giá và ghi chú từ chuyên gia</h3>
                    <div className="note-display">
                      {selectedNotification.expertNote || 'Không có ghi chú'}
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
                    disabled={!note.trim()}
                  >
                    Xác nhận và gửi
                  </button>
                </>
              ) : (
                <button className="btn-close-modal" onClick={handleCloseModal}>
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertNotifications;

