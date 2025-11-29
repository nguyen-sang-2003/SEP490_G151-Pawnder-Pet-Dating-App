import apiClient from '../../../api/axiosClient';

export interface GenerateQRRequest {
  amount: number;
  addInfo: string;
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
 * Get payment history for current user
 */
export const getPaymentHistory = async (): Promise<PaymentHistoryResponse[]> => {
  const response = await apiClient.get('/payment-history');
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
 * Create payment history (simulate successful payment)
 */
export const createPaymentHistory = async (
  request: CreatePaymentHistoryRequest
): Promise<any> => {
  const response = await apiClient.post('/api/payment-history', request);
  return response.data;
};

/**
 * Get VIP status for a user
 */
export const getVipStatus = async (userId: number): Promise<VipStatusResponse> => {
  const response = await apiClient.get(`/api/payment-history/user/${userId}/vip-status`);
  return response.data;
};

