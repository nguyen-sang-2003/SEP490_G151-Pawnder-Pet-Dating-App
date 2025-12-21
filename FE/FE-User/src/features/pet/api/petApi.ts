import apiClient, { cachedGet, invalidateCache } from '../../../api/axiosClient';
import { CACHE_DURATION } from '../../../services/apiCache';

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
  const response = await apiClient.post('/api/pet', petData);
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
  const response = await apiClient.post(
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

    const response = await apiClient.put(
      `/api/petcharacteristic/pet-characteristic/${petId}/${attributeId}`,
      data
    );

    return response.data;
  } catch (error: any) {

    throw error;
  }
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



    const response = await apiClient.post('/api/petphoto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });


    return response.data;
  } catch (error: any) {

    throw error;
  }
};

/**
 * Get pet photos
 * GET /api/petphoto/{petId}
 */
export const getPetPhotos = async (petId: number) => {
  try {
    return await cachedGet(`/api/petphoto/${petId}`, {
      cacheDuration: CACHE_DURATION.LONG, // 10 minutes - photos don't change often
    });
  } catch (error: any) {

    throw error;
  }
};

/**
 * Get all pets for a user
 * GET /api/pet/user/{userId}
 */
export const getPetsByUserId = async (userId: number, useCache: boolean = true): Promise<PetResponse[]> => {
  try {
    return await cachedGet(`/api/pet/user/${userId}`, {
      useCache,
      cacheDuration: CACHE_DURATION.MEDIUM,
      params: { userId },
    });
  } catch (error: any) {

    throw error;
  }
};

/**
 * Get pet by ID
 * GET /api/pet/{petId}
 */
export const getPetById = async (petId: number): Promise<PetResponse> => {
  try {
    return await cachedGet(`/api/pet/${petId}`, {
      cacheDuration: CACHE_DURATION.MEDIUM,
    });
  } catch (error: any) {

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

    const response = await apiClient.put(`/api/pet/${petId}`, data);

    return response.data;
  } catch (error: any) {

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
 */
export const getPetCharacteristics = async (petId: number): Promise<PetCharacteristic[]> => {
  try {
    return await cachedGet(`/api/petcharacteristic/pet-characteristic/${petId}`, {
      cacheDuration: CACHE_DURATION.MEDIUM,
    });
  } catch (error: any) {

    throw error;
  }
};

/**
 * Set pet as active
 * PUT /api/pet/{petId}/set-active
 */
export const setActivePet = async (petId: number): Promise<any> => {
  try {

    const response = await apiClient.put(`/api/pet/${petId}/set-active`);

    return response.data;
  } catch (error: any) {

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
 */
export const getPetsForMatching = async (userId: number): Promise<PetForMatching[]> => {
  try {
    return await cachedGet(`/api/pet/match/${userId}`, {
      cacheDuration: CACHE_DURATION.SHORT, // 2 minutes - matching data should be fresh
    });
  } catch (error: any) {

    throw error;
  }
};

// Matched attribute from recommendation API
export interface MatchedAttribute {
  attributeId: number;
  attributeName: string;
  percent: number;
  petValue: string;
  petOptionName?: string;
}

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
  totalPercent?: number;
  totalAttributes: number;
  distanceKm?: number | null;
  photos: string[];
  matchedAttributes?: MatchedAttribute[];
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

// Response for single pet match details
export interface PetMatchDetailsResponse {
  message: string;
  totalPreferences: number;
  hasPreferences: boolean;
  data: RecommendedPet;
}

// Response wrapper for recommended pets list
export interface RecommendedPetsResponse {
  pets: RecommendedPet[];
  totalPreferences: number;
}

/**
 * Get recommended pets based on user preferences
 * GET /api/PetRecommendation/{userId}
 */
export const getRecommendedPets = async (userId: number): Promise<RecommendedPetsResponse> => {
  try {
    const response = await cachedGet(`/api/PetRecommendation/${userId}`, {
      cacheDuration: CACHE_DURATION.SHORT, // 2 minutes - recommendations should be fresh
    });
    return {
      pets: response.data || response || [],
      totalPreferences: response.totalPreferences || 0,
    };
  } catch (error: any) {

    throw error;
  }
};

/**
 * Get match details for a specific pet
 * GET /api/PetRecommendation/pet/{preferenceUserId}/{targetPetId}
 * Returns match score and matched attributes for a single pet
 */
export const getPetMatchDetails = async (
  preferenceUserId: number,
  targetPetId: number
): Promise<PetMatchDetailsResponse> => {
  try {
    const response = await apiClient.get(
      `/api/PetRecommendation/pet/${preferenceUserId}/${targetPetId}`
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Delete a pet (soft delete)
 * DELETE /api/pet/{petId}
 */
export const deletePet = async (petId: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/pet/${petId}`);
  } catch (error: any) {

    throw error;
  }
};

/**
 * Delete a pet photo
 * DELETE /api/petphoto/{photoId}
 */
export const deletePetPhoto = async (photoId: number): Promise<void> => {
  try {

    const response = await apiClient.delete(`/api/petphoto/${photoId}`);

  } catch (error: any) {

    throw error;
  }
};

/**
 * Reorder pet photos
 * PUT /api/petphoto/reorder
 */
export const reorderPetPhotos = async (photos: { photoId: number; sortOrder: number }[]): Promise<void> => {
  try {

    const response = await apiClient.put('/api/petphoto/reorder', photos);

  } catch (error: any) {

    throw error;
  }
};

/**
 * AI Image Analysis Response
 */
export interface AIAttributeResult {
  attributeName: string;
  optionName?: string | null;
  value?: number | null;
  attributeId?: number | null;
  optionId?: number | null;
}

export interface AnalyzePetImageResponse {
  success: boolean;
  message: string;
  attributes?: AIAttributeResult[];
  sqlInsertScript?: string | null;
}

/**
 * Analyze multiple pet images using AI
 * POST /api/PetImageAnalysis/analyze-multiple
 * Backend sẽ tự tìm ảnh mèo đầu tiên trong danh sách để phân tích
 */
export const analyzePetImages = async (photos: { uri: string; fileName?: string; type?: string }[]): Promise<AnalyzePetImageResponse> => {
  try {
    const formData = new FormData();

    
    const photosToSend = photos.slice(0, 3);

    photosToSend.forEach((photo) => {
      formData.append('images', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || `pet_photo_${Date.now()}.jpg`,
      } as any);
    });

    const response = await apiClient.post('/api/PetImageAnalysis/analyze-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for AI processing
    });

    return response.data;
  } catch (error: any) {
    throw error;
  }
};

