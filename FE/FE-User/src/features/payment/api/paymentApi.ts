import apiClient from '../../../api/axiosClient';

export interface GenerateQRRequest {
  amount: number;
  months: number;
}

export interface PaymentHistoryResponse {
  historyId: number;
  userId: number;
  statusService: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentHistoryRequest {
  userId: number;
  durationMonths: number; // 1, 3, 6, or 12
  amount: number;
  planName: string;
}

export interface PaymentCallbackRequest {
  transferAmount: number;
  content: string; // Format: userIdXmonthsY (e.g., userId3months1)
}

export interface PaymentCallbackResponse {
  success: boolean;
  paid: boolean;
  message: string;
  data?: {
    historyId: number;
    userId: number;
    statusService: string;
    startDate: string;
    endDate: string;
    amount: number;
    durationMonths: number;
    userStatusId: number;
    transactionTime: string;
  };
}

export interface VipStatusResponse {
  success: boolean;
  isVip: boolean;
  subscription?: {
    historyId: number;
    statusService: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
  };
}

/**
 * Generate QR code for payment
 */
export const generatePaymentQR = async (
  amount: number,
  months: number
): Promise<Blob> => {
  const response = await apiClient.post(
    '/api/payment-history/generate',
    {
      amount: amount,
      months: months
    },
    {
      responseType: 'blob',
    }
  );
  return response.data;
};

/**
 * Get payment history by user ID
 */
export const getPaymentHistoryByUserId = async (
  userId: number
): Promise<PaymentHistoryResponse[]> => {
  const response = await apiClient.get(`/api/payment-history/user/${userId}`);
  return response.data.data; // Backend returns { success: true, data: [...] }
};

/**
 * Create payment history (old API - kept for backwards compatibility)
 */
export const createPaymentHistory = async (
  request: CreatePaymentHistoryRequest
): Promise<any> => {
  const response = await apiClient.post('/api/payment-history', request);
  return response.data;
};

/**
 * Verify payment from SePay and create payment history
 * Checks transactions in last 30 minutes
 * @param transferAmount - Amount transferred (VND)
 * @param userId - User ID from token
 * @param months - Duration in months (1, 3, 6, 12)
 */
export const verifyPayment = async (
  transferAmount: number,
  userId: number,
  months: number
): Promise<PaymentCallbackResponse> => {
  const content = `userId${userId}months${months}`;
  const response = await apiClient.post('/api/payment-history/callback', {
    transferAmount,
    content,
  });
  return response.data;
};

/**
 * Get VIP status for a user
 */
export const getVipStatus = async (userId: number): Promise<VipStatusResponse> => {
  const response = await apiClient.get(`/api/payment-history/user/${userId}/vip-status`);
  return response.data;
};

