import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../constants';

class ReportService {
  async getReports(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.LIST, { params });
    return response;
  }

  async getReportById(id) {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.DETAIL(id));
    return response;
  }

  async createReport(reportData) {
    const response = await apiClient.post(API_ENDPOINTS.REPORTS.CREATE, reportData);
    return response;
  }

  async updateReport(id, reportData) {
    const response = await apiClient.put(API_ENDPOINTS.REPORTS.UPDATE(id), reportData);
    return response;
  }

  async deleteReport(id) {
    const response = await apiClient.delete(API_ENDPOINTS.REPORTS.DELETE(id));
    return response;
  }

  async resolveReport(id, resolution) {
    const response = await apiClient.post(`/reports/${id}/resolve`, { resolution });
    return response;
  }

  async rejectReport(id, reason) {
    const response = await apiClient.post(`/reports/${id}/reject`, { reason });
    return response;
  }

  async getReportStats() {
    const response = await apiClient.get('/reports/stats');
    return response;
  }
}

export default new ReportService();
