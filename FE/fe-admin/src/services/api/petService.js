import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../constants';

class PetService {
  async getPets(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.PETS.LIST, { params });
    return response;
  }

  async getPetById(id) {
    const response = await apiClient.get(API_ENDPOINTS.PETS.DETAIL(id));
    return response;
  }

  async createPet(petData) {
    const formData = new FormData();
    Object.keys(petData).forEach(key => {
      if (key === 'photos' && Array.isArray(petData[key])) {
        petData[key].forEach((photo, index) => {
          formData.append(`photos[${index}]`, photo);
        });
      } else {
        formData.append(key, petData[key]);
      }
    });
    
    const response = await apiClient.post(API_ENDPOINTS.PETS.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  async updatePet(id, petData) {
    const formData = new FormData();
    Object.keys(petData).forEach(key => {
      if (key === 'photos' && Array.isArray(petData[key])) {
        petData[key].forEach((photo, index) => {
          formData.append(`photos[${index}]`, photo);
        });
      } else {
        formData.append(key, petData[key]);
      }
    });
    
    const response = await apiClient.put(API_ENDPOINTS.PETS.UPDATE(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  async deletePet(id) {
    const response = await apiClient.delete(API_ENDPOINTS.PETS.DELETE(id));
    return response;
  }

  async approvePet(id) {
    const response = await apiClient.post(`/pets/${id}/approve`);
    return response;
  }

  async rejectPet(id, reason) {
    const response = await apiClient.post(`/pets/${id}/reject`, { reason });
    return response;
  }
}

export default new PetService();
