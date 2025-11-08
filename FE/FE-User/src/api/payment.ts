import apiClient from './client';

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

/**
 * Generate QR code for payment
 */
export const generatePaymentQR = async (
  amount: number,
  addInfo: string
): Promise<Blob> => {
  const response = await apiClient.post(
    '/generate',
    null,
    {
      params: { amount, addInfo },
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
  const response = await apiClient.get(`/payment-history/user/${userId}`);
  return response.data;
};

