import { apiClient } from '../../../api/axiosClient';

export interface ReportMessageRequest {
  Reason: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface Report {
  reportId: number;
  reason: string;
  status: string;
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
  userReport?: {
    userId: number;
    fullName: string;
    email: string;
  };
  content?: {
    contentId: number;
    message: string;
    createdAt: string;
  };
  reportedUser?: {
    userId: number;
    fullName: string;
    email: string;
  };
}

export interface MyReportsResponse {
  success: boolean;
  message: string;
  data: Report[];
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


    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể gửi báo cáo. Vui lòng thử lại.');
  }
};

/**
 * Get my reports
 * GET /api/report/user/{userReportId}
 */
export const getMyReports = async (userId: number): Promise<Report[]> => {
  try {
    const response = await apiClient.get<MyReportsResponse>(
      `/api/report/user/${userId}`
    );

    return response.data.data || [];
  } catch (error: any) {


    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải danh sách báo cáo. Vui lòng thử lại.');
  }
};

