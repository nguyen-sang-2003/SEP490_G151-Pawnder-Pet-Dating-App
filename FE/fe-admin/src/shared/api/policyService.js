import apiClient from './apiClient';

/**
 * Policy Service - API calls for policy management (Admin)
 */

// ============ Policy CRUD ============

// Get all policies
export const getAllPolicies = async () => {
  return apiClient.get('/api/policies/admin');
};

// Get policy by ID
export const getPolicyById = async (policyId) => {
  return apiClient.get(`/api/policies/admin/${policyId}`);
};

// Create new policy
export const createPolicy = async (data) => {
  return apiClient.post('/api/policies/admin', data);
};

// Update policy
export const updatePolicy = async (policyId, data) => {
  return apiClient.put(`/api/policies/admin/${policyId}`, data);
};

// Delete policy (soft delete)
export const deletePolicy = async (policyId) => {
  return apiClient.delete(`/api/policies/admin/${policyId}`);
};

// ============ Policy Version CRUD ============

// Get versions by policy ID
export const getVersionsByPolicyId = async (policyId) => {
  return apiClient.get(`/api/policies/admin/${policyId}/versions`);
};

// Get version by ID
export const getVersionById = async (versionId) => {
  return apiClient.get(`/api/policies/admin/versions/${versionId}`);
};

// Create new version (DRAFT)
export const createVersion = async (policyId, data) => {
  return apiClient.post(`/api/policies/admin/${policyId}/versions`, data);
};

// Update version (only DRAFT)
export const updateVersion = async (versionId, data) => {
  return apiClient.put(`/api/policies/admin/versions/${versionId}`, data);
};

// Publish version (DRAFT -> ACTIVE)
export const publishVersion = async (versionId) => {
  return apiClient.post(`/api/policies/admin/versions/${versionId}/publish`);
};

// Delete version (only DRAFT)
export const deleteVersion = async (versionId) => {
  return apiClient.delete(`/api/policies/admin/versions/${versionId}`);
};

// ============ Statistics ============

// Get accept statistics
export const getAcceptStats = async () => {
  return apiClient.get('/api/policies/admin/stats');
};

export default {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getVersionsByPolicyId,
  getVersionById,
  createVersion,
  updateVersion,
  publishVersion,
  deleteVersion,
  getAcceptStats,
};
