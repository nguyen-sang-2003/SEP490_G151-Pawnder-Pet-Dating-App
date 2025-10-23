import { apiClient } from './client';

export interface LocationRequest {
  Latitude: number;
  Longitude: number;
}

export interface AddressResponse {
  User: {
    UserId: number;
    FullName: string;
    Email: string;
    AddressId: number;
  };
  Address: {
    AddressId: number;
    Latitude: number;
    Longitude: number;
    FullAddress: string;
  };
}

/**
 * Create address from GPS coordinates for a user
 * Backend will automatically do reverse geocoding (GPS → address text)
 */
export const createAddressForUser = async (
  userId: number,
  latitude: number,
  longitude: number
): Promise<AddressResponse> => {
  try {
    console.log('📍 Creating address for user:', { userId, latitude, longitude });

    const response = await apiClient.post<AddressResponse>(
      `/address/${userId}`,
      {
        Latitude: latitude,
        Longitude: longitude,
      }
    );

    console.log('✅ Address created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Create address error:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể tạo địa chỉ. Vui lòng thử lại.');
  }
};

/**
 * Update existing address with new coordinates
 */
export const updateAddress = async (
  addressId: number,
  latitude: number,
  longitude: number
): Promise<{ Address: any }> => {
  try {
    console.log('📍 Updating address:', { addressId, latitude, longitude });

    const response = await apiClient.put<{ Address: any }>(
      `/address/${addressId}`,
      {
        Latitude: latitude,
        Longitude: longitude,
      }
    );

    console.log('✅ Address updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Update address error:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể cập nhật địa chỉ. Vui lòng thử lại.');
  }
};

/**
 * Get address by ID
 */
export const getAddressById = async (addressId: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/address/${addressId}`);
    return response.data.Address;
  } catch (error: any) {
    console.error('❌ Get address error:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể lấy thông tin địa chỉ.');
  }
};

