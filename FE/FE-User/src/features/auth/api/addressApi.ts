import { apiClient } from '../../../api/axiosClient';

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


    const response = await apiClient.post<AddressResponse>(
      `/address/${userId}`,
      {
        Latitude: latitude,
        Longitude: longitude,
      }
    );


    return response.data;
  } catch (error: any) {

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


    const response = await apiClient.put<{ Address: any }>(
      `/address/${addressId}`,
      {
        Latitude: latitude,
        Longitude: longitude,
      }
    );


    return response.data;
  } catch (error: any) {

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


    // Handle both PascalCase and camelCase
    const address = response.data.Address || response.data.address || response.data;


    return address;
  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể lấy thông tin địa chỉ.');
  }
};


