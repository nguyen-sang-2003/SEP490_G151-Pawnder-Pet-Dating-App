import apiClient, { cachedGet } from '../../../api/axiosClient';

/**
 * Policy API endpoints
 * Handles policy management and acceptance workflow for users
 */

// =============== Types ===============

export interface Policy {
  policyId: number;
  policyCode: string;
  policyName: string;
  description?: string;
  displayOrder: number;
  requireConsent: boolean;
  isActive: boolean;
}

export interface PolicyVersion {
  policyVersionId: number;
  versionNumber: number;
  title: string;
  content: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  publishedAt?: string;
  changeLog?: string;
}

export interface ActivePolicy {
  policyCode: string;
  policyName: string;
  versionNumber: number;
  title: string;
  content: string;
  publishedAt: string;
}

export interface PendingPolicy extends ActivePolicy {
  hasPreviousAccept: boolean;
  previousAcceptVersion?: number;
}

export interface PolicyStatus {
  isCompliant: boolean;
  status: 'ACTIVE' | 'PENDING_POLICY';
  message: string;
  pendingPolicies: PendingPolicy[];
}

export interface PolicyAcceptRequest {
  policyCode: string;
  versionNumber: number;
}

export interface PolicyAcceptAllRequest {
  policies: PolicyAcceptRequest[];
}

export interface PolicyAcceptHistory {
  acceptId: number;
  policyCode: string;
  policyName: string;
  versionNumber: number;
  versionTitle: string;
  acceptedAt: string;
  isValid: boolean;
  invalidatedAt?: string;
}


// =============== API Functions ===============

/**
 * Get all active policies
 * GET /api/policies/active
 * Public endpoint - no authentication required
 */
export const getActivePolicies = async (): Promise<ActivePolicy[]> => {
  try {
    const policies = await cachedGet<ActivePolicy[]>(
      '/api/policies/active',
      {
        cacheDuration: 5 * 60 * 1000, // 5 minutes cache
        cacheKey: 'policies-active',
      }
    );
    return policies;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải danh sách chính sách');
  }
};

/**
 * Get specific active policy by code
 * GET /api/policies/active/{policyCode}
 * Public endpoint - no authentication required
 */
export const getActivePolicyByCode = async (policyCode: string): Promise<ActivePolicy> => {
  try {
    const policy = await cachedGet<ActivePolicy>(
      `/api/policies/active/${policyCode}`,
      {
        cacheDuration: 5 * 60 * 1000, // 5 minutes cache
        cacheKey: `policy-active-${policyCode}`,
      }
    );
    return policy;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải nội dung chính sách');
  }
};

/**
 * Check user's policy compliance status
 * GET /api/policies/status
 * Requires authentication
 */
export const getPolicyStatus = async (): Promise<PolicyStatus> => {
  try {
    const response = await apiClient.get<PolicyStatus>('/api/policies/status');
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể kiểm tra trạng thái chính sách');
  }
};

/**
 * Get pending policies that user needs to accept
 * GET /api/policies/pending
 * Requires authentication
 */
export const getPendingPolicies = async (): Promise<PendingPolicy[]> => {
  try {
    const response = await apiClient.get<PendingPolicy[]>('/api/policies/pending');
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải danh sách chính sách cần xác nhận');
  }
};

/**
 * Accept a single policy
 * POST /api/policies/accept
 * Requires authentication
 */
export const acceptPolicy = async (request: PolicyAcceptRequest): Promise<PolicyStatus> => {
  try {
    const response = await apiClient.post<PolicyStatus>('/api/policies/accept', request);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể xác nhận chính sách');
  }
};

/**
 * Accept multiple policies at once
 * POST /api/policies/accept-all
 * Requires authentication
 */
export const acceptAllPolicies = async (policies: PolicyAcceptRequest[]): Promise<PolicyStatus> => {
  try {
    const request: PolicyAcceptAllRequest = { policies };
    const response = await apiClient.post<PolicyStatus>('/api/policies/accept-all', request);
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể xác nhận các chính sách');
  }
};

/**
 * Get user's policy acceptance history
 * GET /api/policies/history
 * Requires authentication
 */
export const getPolicyHistory = async (): Promise<PolicyAcceptHistory[]> => {
  try {
    const response = await apiClient.get<PolicyAcceptHistory[]>('/api/policies/history');
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tải lịch sử xác nhận chính sách');
  }
};
