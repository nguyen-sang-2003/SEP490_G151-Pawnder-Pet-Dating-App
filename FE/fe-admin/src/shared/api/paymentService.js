import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

class PaymentService {
  async getAllHistories() {
    const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.HISTORY_LIST);
    // Backend trả về { success, data }, đảm bảo luôn trả array
    if (Array.isArray(response)) {
      return response;
    }
    return response?.data || [];
  }
}

export default new PaymentService();


