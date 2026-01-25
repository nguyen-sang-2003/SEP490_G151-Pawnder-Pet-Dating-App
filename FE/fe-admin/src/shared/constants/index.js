// API Configuration
// Port được lấy từ BE/BE/Properties/launchSettings.json (http profile: 5297)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5297';

// API Endpoints - Khớp 100% với Backend
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
    REFRESH: '/api/refresh',
    FORGOT_PASSWORD: '/api/forgot-password',
    RESET_PASSWORD: '/api/reset-password',
  },
  USERS: {
    LIST: '/user', // GET /user?search=&roleId=&statusId=&page=1&pageSize=20
    CREATE: '/user', // POST /user
    DETAIL: (id) => `/user/${id}`, // GET /user/{userId}
    UPDATE: (id) => `/user/${id}`, // PUT /user/{userId}
    DELETE: (id) => `/user/${id}`, // DELETE /user/{userId}
    UPDATE_BY_ADMIN: (id) => `/admin/users/${id}`, // PUT /admin/users/{id}
    CREATE_BY_ADMIN: '/admin/users', // POST /admin/users
    RESET_PASSWORD: '/user/reset-password', // PUT /user/reset-password
    BAN: (id) => `/admin/users/${id}/ban`, // POST /admin/users/{id}/ban
    UNBAN: (id) => `/admin/users/${id}/unban`, // POST /admin/users/{id}/unban
  },
  PETS: {
    LIST_BY_USER: (userId) => `/api/pet/user/${userId}`, // GET /api/pet/user/{userId}
    DETAIL: (id) => `/api/pet/${id}`, // GET /api/pet/{petId}
    CREATE: '/api/pet', // POST /api/pet
    UPDATE: (id) => `/api/pet/${id}`, // PUT /api/pet/{petId}
    DELETE: (id) => `/api/pet/${id}`, // DELETE /api/pet/{petId}
    CHARACTERISTICS: (petId) => `/api/PetCharacteristic/pet-characteristic/${petId}`, // GET /api/PetCharacteristic/pet-characteristic/{petId}
  },
  REPORTS: {
    LIST: '/api/report', // GET /api/report (ReportController có [Route("api")])
    DETAIL: (id) => `/api/report/${id}`, // GET /api/report/{reportId}
    LIST_BY_USER: (userId) => `/api/report/user/${userId}`, // GET /api/report/user/{userReportId}
    CREATE: (userReportId, contentId) => `/api/report/${userReportId}/${contentId}`, // POST /api/report/{userReportId}/{contentId}
    UPDATE: (id) => `/api/report/${id}`, // PUT /api/report/{reportId}
  },
  NOTIFICATIONS: {
    LIST: '/api/notification', // GET /api/notification
    DETAIL: (id) => `/api/notification/${id}`, // GET /api/notification/{notificationId}
    LIST_BY_USER: (userId) => `/api/notification/user/${userId}`, // GET /api/notification/user/{userId}
    CREATE: '/api/notification', // POST /api/notification
    DELETE: (id) => `/api/notification/${id}`, // DELETE /api/notification/{notificationId}
    // Broadcast (Admin)
    BROADCAST_DRAFTS: '/api/notification/broadcast/drafts', // GET
    BROADCAST_SENT: '/api/notification/broadcast/sent', // GET
    BROADCAST_CREATE: '/api/notification/broadcast', // POST
    BROADCAST_UPDATE: (id) => `/api/notification/broadcast/${id}`, // PUT
    BROADCAST_DELETE: (id) => `/api/notification/broadcast/${id}`, // DELETE
    BROADCAST_SEND: (id) => `/api/notification/broadcast/${id}/send`, // POST
  },
  ATTRIBUTES: {
    LIST: '/api/attribute',
    DETAIL: (id) => `/api/attribute/${id}`,
    CREATE: '/api/attribute',
    UPDATE: (id) => `/api/attribute/${id}`,
    DELETE: (id) => `/api/attribute/${id}`, // append ?hard=true if needed
    FOR_FILTER: '/api/attribute/for-filter',
  },
  ATTRIBUTE_OPTIONS: {
    LIST_ALL: '/api/attributeoption/attribute-option',
    LIST_BY_ATTRIBUTE: (attributeId) => `/api/attributeoption/${attributeId}`,
    CREATE: (attributeId) => `/api/attributeoption/attribute-option/${attributeId}`,
    UPDATE: (optionId) => `/api/attributeoption/attribute-option/${optionId}`,
    DELETE: (optionId) => `/api/attributeoption/attribute-option/${optionId}`,
  },
  EXPERT: {
    // ExpertController không có [Route("api")] ở controller level
    LIST: '/expert-confirmation', // GET /expert-confirmation
    // LƯU Ý: Backend GET detail endpoint có vấn đề - route chỉ có {userId}/{chatId} nhưng method cần expertId
    // expertId sẽ = 0 (default) nếu không được truyền. Cần workaround ở frontend service.
    DETAIL: (userId, chatId) => `/expert-confirmation/${userId}/${chatId}`, // GET /expert-confirmation/{userId}/{chatId}
    LIST_BY_USER: (userId) => `/expert-confirmation/${userId}`, // GET /expert-confirmation/{userId}
    CREATE: (userId, chatId) => `/expert-confirmation/${userId}/${chatId}`, // POST /expert-confirmation/{userId}/{chatId} (expertId trong body)
    // LƯU Ý: Backend PUT endpoint route parameter đầu tiên là ExpertId (không phải confirmationId)
    // Route: /expert-confirmation/{expertId:int}/{userId:int}/{chatId:int}
    UPDATE: (expertId, userId, chatId) => `/expert-confirmation/${expertId}/${userId}/${chatId}`, // PUT /expert-confirmation/{expertId}/{userId}/{chatId}
  },
  CHAT_AI: {
    TOKEN_USAGE: '/api/chat-ai/token-usage', // GET /api/chat-ai/token-usage
    GET_ALL_CHATS: (userId) => `/api/chat-ai/${userId}`, // GET /api/chat-ai/{userId}
    CREATE_CHAT: (userId) => `/api/chat-ai/${userId}`, // POST /api/chat-ai/{userId}
    UPDATE_CHAT: (chatAiId) => `/api/chat-ai/${chatAiId}`, // PUT /api/chat-ai/{chatAiId}
    DELETE_CHAT: (chatAiId) => `/api/chat-ai/${chatAiId}`, // DELETE /api/chat-ai/{chatAiId}
    MESSAGES: (chatAiId) => `/api/chat-ai/${chatAiId}/messages`, // GET /api/chat-ai/{chatAiId}/messages
    SEND_MESSAGE: (chatAiId) => `/api/chat-ai/${chatAiId}/messages`, // POST /api/chat-ai/{chatAiId}/messages
    CLONE: (originalChatAiId) => `/api/chat-ai/clone/${originalChatAiId}`, // POST /api/chat-ai/clone/{originalChatAiId}
  },
  CHAT_EXPERT: {
    GET_BY_EXPERT: (expertId) => `/api/ChatExpert/expert/${expertId}`, // GET /api/ChatExpert/expert/{expertId}
    GET_BY_USER: (userId) => `/api/ChatExpert/user/${userId}`, // GET /api/ChatExpert/user/{userId}
    CREATE: (expertId, userId) => `/api/ChatExpert/${expertId}/${userId}`, // POST /api/ChatExpert/{expertId}/{userId}
  },
  CHAT_EXPERT_CONTENT: {
    GET_MESSAGES: (chatExpertId) => `/api/ChatExpertContent/${chatExpertId}`, // GET /api/ChatExpertContent/{chatExpertId}
    SEND_MESSAGE: (chatExpertId, fromId) => `/api/ChatExpertContent/${chatExpertId}/${fromId}`, // POST /api/ChatExpertContent/{chatExpertId}/{fromId}
  },
  PAYMENTS: {
    HISTORY_LIST: '/api/payment-history/all', // GET /api/payment-history/all
  },
  PET_PHOTOS: {
    LIST_BY_PET: (petId) => `/api/petphoto/${petId}`, // GET /api/petphoto/{petId} (Backend route là "api/petphoto" không có dấu gạch ngang)
    UPLOAD: '/api/petphoto', // POST /api/petphoto (FormData: petId, files[])
    SET_PRIMARY: (photoId) => `/api/petphoto/${photoId}/primary`, // PUT /api/petphoto/{photoId}/primary
    REORDER: '/api/petphoto/reorder', // PUT /api/petphoto/reorder
    DELETE: (photoId) => `/api/petphoto/${photoId}`, // DELETE /api/petphoto/{photoId}?hard=false
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'Admin',
  EXPERT: 'Expert',
  USER: 'User',
};

// Pet Status
export const PET_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  REJECTED: 'rejected',
};

// Report Status
export const REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language',
  EXPERT_NOTIFICATIONS: 'expert_notifications', // Lưu trạng thái notifications của expert
  EXPERT_NOTIFICATIONS_INITIALIZED: 'expert_notifications_initialized', // Flag đánh dấu đã khởi tạo (ngăn reset về mock data)
  USER_BANS: 'user_bans', // Lưu trạng thái ban của người dùng
  USER_UPDATED_TIMESTAMP: 'user_updated_timestamp', // Track khi nào user được update để refresh UserDetail
};

// Theme
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Language
export const LANGUAGE = {
  VI: 'vi',
  EN: 'en',
};
