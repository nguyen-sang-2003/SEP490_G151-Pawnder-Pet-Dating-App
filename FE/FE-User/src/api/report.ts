import { apiClient } from './client';

export interface ReportMessageRequest {
  Reason: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Report a message/content
 * POST /api/report/{userReportId}/{contentId}
 */
export const reportMessage = async (
  userReportId: number,
  contentId: number,
  reason: string
): Promise<ReportResponse> => {
  try {

    
    const response = await apiClient.post<ReportResponse>(
      `/api/report/${userReportId}/${contentId}`,
      { Reason: reason }
    );
    

    return response.data;
  } catch (error: any) {
    console.error('❌ Report message error:', error);
    console.error('❌ Error response:', error.response);
    console.error('❌ Error data:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể gửi báo cáo. Vui lòng thử lại.');
  }
};

