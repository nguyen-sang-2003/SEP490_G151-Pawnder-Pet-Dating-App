import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

class ReportService {
  /**
   * Get all reports
   * Backend: GET /report
   * Response: { success: boolean, message: string, data: ReportDto[] }
   */
  async getReports(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.LIST, { params });
    // Backend trả về { success, message, data }, apiClient đã unwrap response.data
    // Nếu response có data property, return data, ngược lại return toàn bộ response
    return response?.data || response;
  }

  /**
   * Get report by id
   * Backend: GET /report/{reportId}
   * Response: { success: boolean, message: string, data: ReportDto }
   */
  async getReportById(id) {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.DETAIL(id));
    // Backend trả về { success, message, data }
    return response?.data || response;
  }

  /**
   * Create report
   * Backend: POST /report/{userReportId}/{contentId}
   * Body: { Reason: string }
   * Response: { success: boolean, message: string, data: ReportDto }
   */
  async createReport(userReportId, contentId, reportData) {
    const response = await apiClient.post(
      API_ENDPOINTS.REPORTS.CREATE(userReportId, contentId), 
      reportData
    );
    return response?.data || response;
  }

  /**
   * Update report
   * Backend: PUT /report/{reportId}
   * Body: { Status?: string, Resolution?: string }
   * Response: { success: boolean, message: string, data: ReportDto }
   */
  async updateReport(id, reportData) {
    const response = await apiClient.put(API_ENDPOINTS.REPORTS.UPDATE(id), reportData);
    return response?.data || response;
  }

  // Backend không có DELETE endpoint cho reports
  // async deleteReport(id) {
  //   const response = await apiClient.delete(API_ENDPOINTS.REPORTS.DELETE(id));
  //   return response;
  // }

  /**
   * Resolve report
   * Backend: PUT /report/{reportId}
   * Body: { Status: "Resolved", Resolution: string }
   */
  async resolveReport(id, resolution) {
    const response = await apiClient.put(API_ENDPOINTS.REPORTS.UPDATE(id), {
      Status: 'Resolved',
      Resolution: resolution
    });
    return response?.data || response;
  }

  /**
   * Reject report
   * Backend: PUT /report/{reportId}
   * Body: { Status: "Rejected", Resolution: string }
   */
  async rejectReport(id, reason) {
    const response = await apiClient.put(API_ENDPOINTS.REPORTS.UPDATE(id), {
      Status: 'Rejected',
      Resolution: reason
    });
    return response?.data || response;
  }

  // Backend không có getReportStats endpoint
  // async getReportStats() {
  //   const response = await apiClient.get('/report/stats');
  //   return response;
  // }
}

export default new ReportService();
