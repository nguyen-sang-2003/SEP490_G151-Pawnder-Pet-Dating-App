import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../constants';

class PetService {
  /**
   * Get pets by user
   * Backend: GET /api/pet/user/{userId}
   * Response: PetDto[] (array of pets)
   */
  async getPetsByUser(userId) {
    const response = await apiClient.get(API_ENDPOINTS.PETS.LIST_BY_USER(userId));
    return response;
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
