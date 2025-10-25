import client from './client';

export interface CreatePetRequest {
  UserId: number;
  Name: string;
  Gender: string;
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

    console.log(`📤 Uploading ${photos.length} photos for pet ${petId}`);
    
    const response = await client.post('/api/petphoto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Photos uploaded successfully:', response.data);
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
 */
export const getPetPhotos = async (petId: number) => {
  const response = await client.get(`/api/petphoto/${petId}`);
  return response.data;
};

/**
 * Get all pets for a user
 * GET /api/pet/user/{userId}
 */
export const getPetsByUserId = async (userId: number): Promise<PetResponse[]> => {
  try {
    console.log(`📞 Calling: GET /api/pet/user/${userId}`);
    const response = await client.get(`/api/pet/user/${userId}`);
    console.log('✅ Pets data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching pets:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

/**
 * Get pet by ID
 * GET /api/pet/{petId}
 */
export const getPetById = async (petId: number): Promise<PetResponse> => {
  try {
    console.log(`📞 Calling: GET /api/pet/${petId}`);
    const response = await client.get(`/api/pet/${petId}`);
    console.log('✅ Pet data RAW:', JSON.stringify(response.data, null, 2));
    console.log('✅ Pet data:', response.data);
    return response.data;
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
    console.log(`📞 Calling: PUT /api/pet/${petId}`, data);
    const response = await client.put(`/api/pet/${petId}`, data);
    console.log('✅ Pet updated:', response.data);
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
 */
export const getPetCharacteristics = async (petId: number): Promise<PetCharacteristic[]> => {
  try {
    console.log(`📞 Calling: GET /api/petcharacteristic/pet-characteristic/${petId}`);
    const response = await client.get(`/api/petcharacteristic/pet-characteristic/${petId}`);
    console.log('✅ Pet characteristics:', response.data);
    return response.data;
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
    console.log(`📞 Calling: PUT /api/pet/${petId}/set-active`);
    const response = await client.put(`/api/pet/${petId}/set-active`);
    console.log('✅ Pet set as active:', response.data);
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
 */
export const getPetsForMatching = async (userId: number): Promise<PetForMatching[]> => {
  try {
    console.log(`📞 Calling: GET /api/pet/match/${userId}`);
    const response = await client.get(`/api/pet/match/${userId}`);
    console.log('✅ Matching pets data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching matching pets:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};