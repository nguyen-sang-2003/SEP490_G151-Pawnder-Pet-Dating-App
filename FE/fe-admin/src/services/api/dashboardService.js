import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../constants';

class DashboardService {
  /**
   * Get dashboard statistics
   * Combines data from multiple API endpoints
   */
  async getDashboardStats() {
    try {
      // Fetch all data in parallel
      const [usersResponse, reportsResponse] = await Promise.all([
        this.getUsersTotal(),
        this.getReportsData()
      ]);

      // Calculate statistics
      const totalUsers = usersResponse.total || 0;
      const totalReports = reportsResponse.total || 0;
      const pendingReports = reportsResponse.pending || 0;
      const resolvedReports = reportsResponse.resolved || 0;
      
      // Calculate total pets from all users
      // Note: This might be slow if there are many users
      // In production, backend should provide a dedicated endpoint
      const totalPets = await this.getTotalPets(totalUsers);

      // Get active users today
      const activeUsersToday = await this.getActiveUsersToday();

      // Get recent activities
      const recentActivities = await this.getRecentActivities();

      // Get user growth chart data
      const userGrowthData = await this.getUserGrowthData(totalUsers);

      return {
        totalUsers,
        totalPets,
        pendingReports,
        resolvedReports,
        activeUsersToday,
        recentActivities,
        userGrowthData
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get total number of users
   * Backend: GET /user?pageSize=1 (to get total count)
   */
  async getUsersTotal() {
    const response = await apiClient.get(API_ENDPOINTS.USERS.LIST, {
      params: {
        page: 1,
        pageSize: 1, // Only need total count
        includeDeleted: false
      }
    });
    
    // Backend returns: { Items: [], Total: number, Page: number, PageSize: number }
    return {
      total: response.Total || response.total || 0,
      items: response.Items || response.items || []
    };
  }

  /**
   * Get all users (with pagination if needed)
   * Used for calculating active users and other statistics
   */
  async getAllUsers(pageSize = 100) {
    const response = await apiClient.get(API_ENDPOINTS.USERS.LIST, {
      params: {
        page: 1,
        pageSize: pageSize,
        includeDeleted: false
      }
    });
    
    return response.Items || response.items || [];
  }

  /**
   * Get reports data
   * Backend: GET /report
   */
  async getReportsData() {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.LIST);
    
    // Backend returns: { success: boolean, message: string, data: ReportDto[] }
    const reports = response.data || response || [];
    
    // Count by status
    const pending = reports.filter(r => r.Status === 'Pending' || r.status === 'pending').length;
    const resolved = reports.filter(r => r.Status === 'Resolved' || r.status === 'resolved').length;
    const rejected = reports.filter(r => r.Status === 'Rejected' || r.status === 'rejected').length;
    
    return {
      total: reports.length,
      pending,
      resolved,
      rejected,
      reports
    };
  }

  /**
   * Get total number of pets
   * Note: This is inefficient - backend should provide a dedicated endpoint
   * For now, we'll fetch pets for a sample of users or return 0 if too many users
   */
  async getTotalPets(totalUsers) {
    try {
      // If there are many users, this might be slow
      // In production, backend should provide GET /api/pet endpoint with count
      if (totalUsers === 0) return 0;
      
      // Limit to first 50 users to avoid too many API calls
      // TODO: Backend should provide a dedicated endpoint for total pets count
      if (totalUsers > 50) {
        console.warn('Too many users to calculate total pets efficiently. Returning estimated value.');
        // Return estimated value or 0
        return 0;
      }
      
      // Fetch all users (limited to 50)
      const users = await this.getAllUsers(totalUsers);
      
      // Fetch pets for each user (in parallel)
      const petPromises = users.map(user => {
        const userId = user.UserId || user.userId;
        if (!userId) return Promise.resolve(0);
        
        return apiClient.get(API_ENDPOINTS.PETS.LIST_BY_USER(userId))
          .then(response => {
            // Handle both array response and error response
            if (Array.isArray(response)) {
              return response.length;
            }
            // If response is an error object, return 0
            return 0;
          })
          .catch(() => 0); // If error (e.g., user has no pets), return 0
      });
      
      const petCounts = await Promise.all(petPromises);
      const totalPets = petCounts.reduce((sum, count) => sum + count, 0);
      
      return totalPets;
    } catch (error) {
      console.error('Error calculating total pets:', error);
      return 0;
    }
  }

  /**
   * Get active users today
   * Users who have logged in today
   */
  async getActiveUsersToday() {
    try {
      const users = await this.getAllUsers(100);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      // Note: Backend UserResponse doesn't include lastLogin field
      // This is a placeholder - backend should add lastLogin field
      // For now, we'll return 0 or estimate based on CreatedAt
      const activeUsers = users.filter(user => {
        // If user was created today, consider them active
        const createdAt = user.CreatedAt || user.createdAt;
        if (!createdAt) return false;
        
        const createdDate = new Date(createdAt);
        return createdDate >= today && createdDate <= todayEnd;
      }).length;
      
      return activeUsers;
    } catch (error) {
      console.error('Error calculating active users today:', error);
      return 0;
    }
  }

  /**
   * Get recent activities
   * Recent user registrations and reports
   */
  async getRecentActivities() {
    try {
      const [users, reports] = await Promise.all([
        this.getAllUsers(10), // Get latest 10 users
        this.getReportsData()
      ]);
      
      const activities = [];
      
      // Add recent user registrations (sort by CreatedAt descending)
      const sortedUsers = [...users]
        .filter(user => user.CreatedAt || user.createdAt)
        .sort((a, b) => {
          const dateA = new Date(a.CreatedAt || a.createdAt);
          const dateB = new Date(b.CreatedAt || b.createdAt);
          return dateB - dateA; // Newest first
        })
        .slice(0, 5);
        
      sortedUsers.forEach(user => {
        const email = user.Email || user.email;
        const fullName = user.FullName || user.fullName || email?.split('@')[0] || 'User';
        const createdAt = user.CreatedAt || user.createdAt;
        
        activities.push({
          id: `user-${user.UserId || user.userId}`,
          type: 'user',
          message: `Người dùng mới đăng ký: ${fullName}`,
          time: this.formatRelativeTime(createdAt),
          avatar: '👤',
          createdAt: createdAt // Store for sorting
        });
      });
      
      // Add recent reports (sort by CreatedAt descending)
      const allReports = reports.reports || [];
      const sortedReports = [...allReports]
        .filter(report => report.CreatedAt || report.createdAt)
        .sort((a, b) => {
          const dateA = new Date(a.CreatedAt || a.createdAt);
          const dateB = new Date(b.CreatedAt || b.createdAt);
          return dateB - dateA; // Newest first
        })
        .slice(0, 5);
        
      sortedReports.forEach(report => {
        const createdAt = report.CreatedAt || report.createdAt;
        const userReport = report.UserReport || report.userReport;
        const userName = userReport?.FullName || userReport?.fullName || userReport?.Email || userReport?.email || 'user';
        
        activities.push({
          id: `report-${report.ReportId || report.reportId}`,
          type: 'report',
          message: `Báo cáo mới từ ${userName}`,
          time: this.formatRelativeTime(createdAt),
          avatar: '⚠️',
          createdAt: createdAt // Store for sorting
        });
      });
      
      // Sort by createdAt (newest first) and return top 4
      return activities
        .sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA; // Newest first
        })
        .slice(0, 4)
        .map(({ createdAt, ...rest }) => rest); // Remove createdAt before returning
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  /**
   * Get user growth data for chart
   * Generate chart data based on user creation dates
   */
  async getUserGrowthData(totalUsers) {
    try {
      const users = await this.getAllUsers(totalUsers > 100 ? 100 : totalUsers);
      
      // Group users by month
      const monthlyData = {};
      
      users.forEach(user => {
        const createdAt = user.CreatedAt || user.createdAt;
        if (!createdAt) return;
        
        const date = new Date(createdAt);
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey]++;
      });
      
      // Convert to chart data format
      const chartData = [];
      const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const [monthA, yearA] = a.split('/').map(Number);
        const [monthB, yearB] = b.split('/').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      });
      
      let cumulative = 0;
      sortedMonths.forEach(monthKey => {
        cumulative += monthlyData[monthKey];
        const [month, year] = monthKey.split('/').map(Number);
        chartData.push({
          month: `T${month}/${year}`,
          users: cumulative
        });
      });
      
      // If no data, return default chart
      if (chartData.length === 0) {
        return [
          { month: 'T1/2024', users: 0 },
          { month: 'T2/2024', users: totalUsers }
        ];
      }
      
      return chartData;
    } catch (error) {
      console.error('Error generating user growth data:', error);
      // Return default chart
      return [
        { month: 'T1/2024', users: 0 },
        { month: 'T2/2024', users: totalUsers }
      ];
    }
  }

  /**
   * Format relative time (e.g., "5 phút trước")
   */
  formatRelativeTime(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Gần đây';
    }
  }
}

export default new DashboardService();

