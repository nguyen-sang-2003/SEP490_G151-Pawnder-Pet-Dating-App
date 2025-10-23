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
 * Get pet photos
 * GET /api/petphoto/{petId}
 */
export const getPetPhotos = async (petId: number) => {
  const response = await client.get(`/api/petphoto/${petId}`);
  return response.data;
};
