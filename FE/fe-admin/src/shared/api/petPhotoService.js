import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

class PetPhotoService {
  /**
   * Get photos by pet
   * Backend: GET /api/pet-photo/{petId}
   * Response: PetPhotoResponse[] (array of photos)
   */
  async getPhotosByPet(petId) {
    const response = await apiClient.get(API_ENDPOINTS.PET_PHOTOS.LIST_BY_PET(petId));
    return response;
  }

  /**
   * Upload photos
   * Backend: POST /api/pet-photo
   * Body: FormData with petId and files[]
   * Response: { message: string, photos: PetPhotoResponse[] }
   */
  async uploadPhotos(petId, files) {
    const formData = new FormData();
    formData.append('petId', petId);
    
    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    } else {
      formData.append('files', files);
    }

    const response = await apiClient.post(API_ENDPOINTS.PET_PHOTOS.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  /**
   * Set primary photo
   * Backend: PUT /api/pet-photo/{photoId}/primary
   * Response: { message: string }
   */
  async setPrimaryPhoto(photoId) {
    const response = await apiClient.put(API_ENDPOINTS.PET_PHOTOS.SET_PRIMARY(photoId));
    return response;
  }

  /**
   * Reorder photos
   * Backend: PUT /api/pet-photo/reorder
   * Body: [{ PhotoId: number, SortOrder: number }]
   * Response: { message: string }
   */
  async reorderPhotos(items) {
    const response = await apiClient.put(API_ENDPOINTS.PET_PHOTOS.REORDER, items);
    return response;
  }

  /**
   * Delete photo (soft delete)
   * Backend: DELETE /api/pet-photo/{photoId}?hard=false
   * Query: hard (boolean) - if true, also delete from Cloudinary
   * Response: { message: string }
   */
  async deletePhoto(photoId, hardDelete = false) {
    const response = await apiClient.delete(
      `${API_ENDPOINTS.PET_PHOTOS.DELETE(photoId)}?hard=${hardDelete}`
    );
    return response;
  }
}

export default new PetPhotoService();

