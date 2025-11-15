import client, { cachedGet, invalidateCache } from './client';
import { CACHE_DURATION } from '../utils/apiCache';

export interface CreatePetRequest {
  UserId: number;
  Name: string;
  Gender?: string; // Optional - will be added in Characteristics screen
  Description?: string;
  Breed?: string;
  Age?: number;
  IsActive?: boolean;
}

export interface CreatePetResponse {
  PetId?: number;
  petId?: number;
  UserId?: number;
  userId?: number;
  Name?: string;
  name?: string;
  Gender?: string;
  gender?: string;
  Description?: string;
  description?: string;
  Breed?: string;
  breed?: string;
  Age?: number;
  age?: number;
  IsActive?: boolean;
  isActive?: boolean;
  CreatedAt?: string;
  createdAt?: string;
  UpdatedAt?: string;
  updatedAt?: string;
}

export interface PetCharacteristicRequest {
  OptionId?: number;
  Value?: number;
}

export interface PetResponse {
  PetId?: number;
  petId?: number;
  UserId?: number;
  userId?: number;
  Name?: string;
  name?: string;
  Breed?: string;
  breed?: string;
  Gender?: string;
  gender?: string;
  Age?: number;
  age?: number;
  IsActive?: boolean;
  isActive?: boolean;
  Description?: string;
  description?: string;
  UrlImageAvatar?: string;
  urlImageAvatar?: string;
  UrlImage?: string[];
  urlImage?: string[];
}

export interface UpdatePetRequest {
  Name: string;
  Breed?: string;
  Gender: string;
  Age?: number;
  IsActive?: boolean;
  Description?: string;
}

/**
 * Create a new pet
 * POST /api/pet
 */
export const createPet = async (petData: CreatePetRequest): Promise<CreatePetResponse> => {
  const response = await client.post('/api/pet', petData);
  return response.data;
};

/**
 * Create pet characteristic
 * POST /api/petcharacteristic/pet-characteristic/{petId}/{attributeId}
 */
export const createPetCharacteristic = async (
  petId: number,
  attributeId: number,
  data: PetCharacteristicRequest
) => {
  const response = await client.post(
    `/api/petcharacteristic/pet-characteristic/${petId}/${attributeId}`,
    data
  );
  return response.data;
};

/**
 * Update pet characteristic
 * PUT /api/petcharacteristic/pet-characteristic/{petId}/{attributeId}
 */
export const updatePetCharacteristic = async (
  petId: number,
  attributeId: number,
  data: PetCharacteristicRequest
): Promise<any> => {
  try {

    const response = await client.put(
      `/api/petcharacteristic/pet-characteristic/${petId}/${attributeId}`,
      data
    );

    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating characteristic:', error);
    throw error;
  }
};

/**
 * Upload single pet photo
 * POST /api/petphoto/{petId}
 */
export const uploadPetPhoto = async (petId: number, imageUrl: string) => {
  const response = await client.post(`/api/petphoto/${petId}`, JSON.stringify(imageUrl), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

/**
 * Upload multiple pet photos at once
 * POST /api/petphoto/{petId}/batch
 */
export const uploadPetPhotosBatch = async (petId: number, imageUrls: string[]) => {
  const response = await client.post(`/api/petphoto/${petId}/batch`, imageUrls);
  return response.data;
};

/**
 * Upload pet photos as multipart/form-data (file upload)
 * POST /api/petphoto
 */
export const uploadPetPhotosMultipart = async (petId: number, photos: any[]) => {
  try {
    const formData = new FormData();
    formData.append('petId', petId.toString());
    
    photos.forEach((photo, index) => {
      formData.append('files', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || `pet_photo_${index}.jpg`,
      } as any);
    });


    
    const response = await client.post('/api/petphoto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    

    return response.data;
  } catch (error: any) {
    console.error('❌ Error uploading photos:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Get pet photos
 * GET /api/petphoto/{petId}
 * 🚀 OPTIMIZED: With caching
 */
export const getPetPhotos = async (petId: number) => {
  try {
    return await cachedGet(`/api/petphoto/${petId}`, {
      cacheDuration: CACHE_DURATION.LONG, // 10 minutes - photos don't change often
    });
  } catch (error: any) {
    console.error('❌ Error fetching pet photos:', error);
    throw error;
  }
};

/**
 * Get all pets for a user
 * GET /api/pet/user/{userId}
 * 🚀 OPTIMIZED: With caching, retry, and deduplication
 */
export const getPetsByUserId = async (userId: number, useCache: boolean = true): Promise<PetResponse[]> => {
  try {
    return await cachedGet(`/api/pet/user/${userId}`, {
      useCache,
      cacheDuration: CACHE_DURATION.MEDIUM,
      params: { userId },
    });
  } catch (error: any) {
    console.error('❌ Error fetching pets:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Get pet by ID
 * GET /api/pet/{petId}
 * 🚀 OPTIMIZED: With caching
 */
export const getPetById = async (petId: number): Promise<PetResponse> => {
  try {
    return await cachedGet(`/api/pet/${petId}`, {
      cacheDuration: CACHE_DURATION.MEDIUM,
    });
  } catch (error: any) {
    console.error('❌ Error fetching pet:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Update pet
 * PUT /api/pet/{petId}
 */
export const updatePet = async (
  petId: number,
  data: UpdatePetRequest
): Promise<any> => {
  try {

    const response = await client.put(`/api/pet/${petId}`, data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating pet:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export interface PetCharacteristic {
  attributeId?: number;
  name?: string;
  optionValue?: string | null;
  value?: number | null;
  unit?: string | null;
  typeValue?: string;
}

/**
 * Get pet characteristics
 * GET /api/petcharacteristic/pet-characteristic/{petId}
 * 🚀 OPTIMIZED: With caching
 */
export const getPetCharacteristics = async (petId: number): Promise<PetCharacteristic[]> => {
  try {
    return await cachedGet(`/api/petcharacteristic/pet-characteristic/${petId}`, {
      cacheDuration: CACHE_DURATION.MEDIUM,
    });
  } catch (error: any) {
    console.error('❌ Error fetching pet characteristics:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Set pet as active
 * PUT /api/pet/{petId}/set-active
 */
export const setActivePet = async (petId: number): Promise<any> => {
  try {

    const response = await client.put(`/api/pet/${petId}/set-active`);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error setting active pet:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export interface PetForMatching {
  petId: number;
  userId: number;
  name: string;
  breed?: string;
  gender: string;
  age?: number;
  description?: string;
  photos: string[];
  owner?: {
    userId: number;
    fullName: string;
    gender?: string;
    address?: {
      city: string;
      district: string;
      latitude?: number;
      longitude?: number;
    };
  };
}

/**
 * Get pets for matching (exclude current user's pets)
 * GET /api/pet/match/{userId}
 * 🚀 OPTIMIZED: With caching
 */
export const getPetsForMatching = async (userId: number): Promise<PetForMatching[]> => {
  try {
    return await cachedGet(`/api/pet/match/${userId}`, {
      cacheDuration: CACHE_DURATION.SHORT, // 2 minutes - matching data should be fresh
    });
  } catch (error: any) {
    console.error('❌ Error fetching matching pets:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

export interface RecommendedPet {
  petId: number;
  userId: number;
  name: string;
  breed?: string;
  gender?: string;
  age?: number;
  description?: string;
  matchPercent: number;
  matchScore: number;
  totalAttributes: number;
  distanceKm?: number | null;
  photos: string[];
  owner?: {
    userId: number;
    fullName?: string;
    gender?: string;
    address?: {
      city?: string;
      district?: string;
    };
  };
}

/**
 * Get recommended pets based on user preferences
 * GET /api/PetRecommendation/{userId}
 * 🚀 OPTIMIZED: With caching
 */
export const getRecommendedPets = async (userId: number): Promise<RecommendedPet[]> => {
  try {
    const data = await cachedGet(`/api/PetRecommendation/${userId}`, {
      cacheDuration: CACHE_DURATION.SHORT, // 2 minutes - recommendations should be fresh
    });
    return data.data || data || [];
  } catch (error: any) {
    console.error('❌ Error fetching recommended pets:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Delete a pet (soft delete)
 * DELETE /api/pet/{petId}
 */
export const deletePet = async (petId: number): Promise<void> => {
  try {
    await client.delete(`/api/pet/${petId}`);
  } catch (error: any) {
    console.error('❌ Error deleting pet:', error);
    throw error;
  }
};

/**
 * Delete a pet photo
 * DELETE /api/petphoto/{photoId}
 */
export const deletePetPhoto = async (photoId: number): Promise<void> => {
  try {

    const response = await client.delete(`/api/petphoto/${photoId}`);

  } catch (error: any) {
    console.error('❌ Error deleting photo:', error);
    throw error;
  }
};

/**
 * Reorder pet photos
 * PUT /api/petphoto/reorder
 */
export const reorderPetPhotos = async (photos: { photoId: number; sortOrder: number }[]): Promise<void> => {
  try {

    const response = await client.put('/api/petphoto/reorder', photos);

  } catch (error: any) {
    console.error('❌ Error reordering photos:', error);
    throw error;
  }
};
