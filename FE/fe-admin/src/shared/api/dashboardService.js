import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';
import petService from './petService';

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
  async getAllUsers(limit = 100) {
    if (limit <= 0) {
      return [];
    }

    const users = [];
    const pageSize = Math.min(100, Math.max(10, limit));
    let page = 1;
    let totalAvailable = Number.POSITIVE_INFINITY;

    while (users.length < limit && users.length < totalAvailable) {
      const response = await apiClient.get(API_ENDPOINTS.USERS.LIST, {
        params: {
          page,
          pageSize,
          includeDeleted: false,
        },
      });

      const items = response.Items || response.items || [];
      const total = response.Total ?? response.total ?? items.length;

      users.push(...items);
      totalAvailable = total;

      if (items.length < pageSize) {
        break; // no more pages
      }

      page += 1;
    }

    return users.slice(0, Math.min(limit, users.length));
  }

  /**
   * Get reports data
   * Backend: GET /report
   */
  async getReportsData() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REPORTS.LIST);
      
      // Backend returns: { success: boolean, message: string, data: ReportDto[] }
      // Or directly: ReportDto[]
      const reports = Array.isArray(response) 
        ? response 
        : (response?.data || response?.Items || response?.items || []);
      
      if (!Array.isArray(reports)) {
        console.error('❌ Dashboard - Reports is not an array:', typeof reports, reports);
        return {
          total: 0,
          pending: 0,
          resolved: 0,
          rejected: 0,
          reports: []
        };
      }
      
      console.log('📊 Dashboard - Reports data:', {
        responseType: Array.isArray(response) ? 'Array' : typeof response,
        reportsCount: reports.length,
        reports: reports.map(r => ({
          id: r.ReportId || r.reportId,
          status: r.Status || r.status,
          statusType: typeof (r.Status || r.status),
        }))
      });
      
      // Normalize status to lowercase for comparison
      const normalizeStatus = (status) => {
        if (status === null || status === undefined) return '';
        return String(status).toLowerCase().trim();
      };
      
      // Count by status - handle both English and Vietnamese statuses
      // Database stores: 'Pending', 'Resolved', 'Rejected' (PascalCase)
      const pending = reports.filter(r => {
        const status = normalizeStatus(r.Status || r.status);
        return status === 'pending' || status === 'chờ xử lý' || status === 'đang chờ';
      }).length;
      
      // "Đã xử lý" bao gồm cả "resolved" và "rejected" (giống logic trong ReportsList.js)
      const resolved = reports.filter(r => {
        const status = normalizeStatus(r.Status || r.status);
        return status === 'resolved' || status === 'đã xử lý' || status === 'đã giải quyết' ||
               status === 'rejected' || status === 'từ chối' || status === 'bị từ chối';
      }).length;
      
      const rejected = reports.filter(r => {
        const status = normalizeStatus(r.Status || r.status);
        return status === 'rejected' || status === 'từ chối' || status === 'bị từ chối';
      }).length;
      
      console.log('📊 Dashboard - Reports counts:', { 
        total: reports.length, 
        pending, 
        resolved, 
        rejected,
        statusBreakdown: reports.reduce((acc, r) => {
          const status = normalizeStatus(r.Status || r.status);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      });
      
      return {
        total: reports.length,
        pending,
        resolved,
        rejected,
        reports
      };
    } catch (error) {
      console.error('❌ Dashboard - Error fetching reports:', error);
      return {
        total: 0,
        pending: 0,
        resolved: 0,
        rejected: 0,
        reports: []
      };
    }
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
        
        return petService.getPetsByUser(userId)
          .then(pets => {
            // getPetsByUser already handles 404 and returns empty array
            return Array.isArray(pets) ? pets.length : 0;
          })
          .catch(() => 0); // If error, return 0
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
   * Users who have updated their profile or were created today
   * Note: Backend doesn't have LastLogin field, so we use UpdatedAt as proxy for activity
   */
  async getActiveUsersToday() {
    try {
      const users = await this.getAllUsers(1000); // Get more users for accuracy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      const activeUsers = users.filter(user => {
        // Priority 1: Check UpdatedAt - if user updated profile today, they're active
        const updatedAt = user.UpdatedAt || user.updatedAt;
        if (updatedAt) {
          const updatedDate = new Date(updatedAt);
          if (!isNaN(updatedDate.getTime())) {
            if (updatedDate >= today && updatedDate <= todayEnd) {
              return true;
            }
          }
        }
        
        // Priority 2: Check CreatedAt - if user was created today, they're active
        const createdAt = user.CreatedAt || user.createdAt;
        if (createdAt) {
          const createdDate = new Date(createdAt);
          if (!isNaN(createdDate.getTime())) {
            if (createdDate >= today && createdDate <= todayEnd) {
              return true;
            }
          }
        }
        
        return false;
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
      if (totalUsers === 0) {
        return this.getDefaultChart();
      }

      const maxRecords = Math.min(Math.max(totalUsers, 50), 1000);
      const users = await this.getAllUsers(maxRecords);
      const monthRange = this.buildMonthRange(12);
      const monthlyCounts = {};

      users.forEach(user => {
        const createdAt = user.CreatedAt || user.createdAt;
        if (!createdAt) return;

        const date = new Date(createdAt);
        if (Number.isNaN(date.getTime())) return;

        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
      });

      const countsWithinRange = monthRange.reduce((sum, month) => {
        return sum + (monthlyCounts[month.key] || 0);
      }, 0);

      let cumulative = Math.max(0, totalUsers - countsWithinRange);
      const chartData = monthRange.map(month => {
        cumulative += monthlyCounts[month.key] || 0;
        return {
          month: month.label,
          users: cumulative,
        };
      });

      return chartData;
    } catch (error) {
      console.error('Error generating user growth data:', error);
      return this.getDefaultChart(totalUsers);
    }
  }

  buildMonthRange(monthCount = 12) {
    const range = [];
    const now = new Date();

    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      range.push({
        key: `${year}-${month}`,
        label: `T${month}/${year}`,
      });
    }

    return range;
  }

  getDefaultChart(totalUsers = 0) {
    return [
      { month: 'T1/2024', users: 0 },
      { month: 'T2/2024', users: totalUsers || 0 },
    ];
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

