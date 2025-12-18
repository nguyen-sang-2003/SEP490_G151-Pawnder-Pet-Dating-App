import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

class PetService {
  /**
   * Get pets by user
   * Backend: GET /api/pet/user/{userId}
   * Response: PetDto[] (array of pets) or 404 if user has no pets
   * Note: Backend returns 404 if user has no pets, so we handle it gracefully
   */
  async getPetsByUser(userId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PETS.LIST_BY_USER(userId));
      // If response is an array, return it
      if (Array.isArray(response)) {
        return response;
      }
      // If response is not an array, return empty array
      return [];
    } catch (error) {
      // If 404 error (user has no pets), return empty array instead of throwing
      if (error.response?.status === 404) {
        console.log(`User ${userId} has no pets`);
        return [];
      }

      // Gracefully handle other errors as empty result to keep dashboard stable
      console.warn(`petService.getPetsByUser(${userId}) failed:`, error?.response?.status || error?.message);
      return [];
    }
  }

  /**
   * Get pet by id
   * Backend: GET /api/pet/{petId}
   * Response: PetDto_1 (single pet object)
   */
  async getPetById(id) {
    const response = await apiClient.get(API_ENDPOINTS.PETS.DETAIL(id));
    return response;
  }

  /**
   * Create pet
   * Backend: POST /api/pet
   * Body: { UserId, Name, Breed, Gender, Age, IsActive, Description }
   * Note: File upload được xử lý riêng qua PetPhotoController
   */
  async createPet(petData) {
    const response = await apiClient.post(API_ENDPOINTS.PETS.CREATE, petData);
    return response;
  }

  /**
   * Update pet
   * Backend: PUT /api/pet/{petId}
   * Body: { Name, Breed, Gender, Age, IsActive, Description }
   * Note: File upload được xử lý riêng qua PetPhotoController
   */
  async updatePet(id, petData) {
    const response = await apiClient.put(API_ENDPOINTS.PETS.UPDATE(id), petData);
    return response;
  }

  /**
   * Delete pet (soft delete)
   * Backend: DELETE /api/pet/{petId}
   * Response: { Message: string }
   */
  async deletePet(id) {
    const response = await apiClient.delete(API_ENDPOINTS.PETS.DELETE(id));
    return response;
  }

  /**
   * Get pet characteristics
   * Backend: GET /api/petcharacteristic/pet-characteristic/{petId}
   * Response: Array of { attributeId, name, optionValue, value, unit, typeValue }
   */
  async getPetCharacteristics(petId) {
    try {
      const endpoint = API_ENDPOINTS.PETS.CHARACTERISTICS(petId);
      console.log('[petService] Fetching characteristics from:', endpoint);
      const response = await apiClient.get(endpoint);
      console.log('[petService] Characteristics response:', response);
      const result = Array.isArray(response) ? response : [];
      console.log('[petService] Returning characteristics:', result.length, 'items');
      return result;
    } catch (error) {
      // Log detailed error for debugging
      console.error('[petService] ❌ Error fetching characteristics:', {
        petId,
        endpoint: API_ENDPOINTS.PETS.CHARACTERISTICS(petId),
        status: error?.response?.status || error?.status || 'unknown',
        statusText: error?.response?.statusText,
        message: error?.message,
        responseData: error?.response?.data
      });
      // Re-throw error so caller can check status code (e.g., 404)
      throw error;
    }
  }

  // Backend không có approve/reject endpoints - có thể implement sau nếu cần
  // async approvePet(id) {
  //   const response = await apiClient.post(`/api/pet/${id}/approve`);
  //   return response;
  // }

  // async rejectPet(id, reason) {
  //   const response = await apiClient.post(`/api/pet/${id}/reject`, { reason });
  //   return response;
  // }
}

export default new PetService();
