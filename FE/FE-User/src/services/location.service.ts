import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request location permission from user
 * Android requires runtime permission, iOS uses Info.plist
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Quyền truy cập vị trí',
          message: 'Pawnder cần quyền truy cập vị trí để tìm thú cưng gần bạn 🐾',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Từ chối',
          buttonPositive: 'Đồng ý',
        }
      );
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Location permission granted');
        return true;
      } else {
        console.log('❌ Location permission denied');
        return false;
      }
    } else {
      // iOS - permission is handled via Info.plist
      // We'll try to get location and handle error if permission denied
      return true;
    }
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current GPS coordinates
 * Returns promise with { latitude, longitude }
 */
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Current location:', { latitude, longitude });
        resolve({ latitude, longitude });
      },
      (error) => {
        console.error('❌ Get location error:', error);
        
        let errorMessage = 'Không thể lấy vị trí. ';
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage += 'Vui lòng cấp quyền truy cập vị trí trong cài đặt.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage += 'Vị trí không khả dụng.';
            break;
          case 3: // TIMEOUT
            errorMessage += 'Hết thời gian chờ.';
            break;
          default:
            errorMessage += 'Vui lòng thử lại.';
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  });
};

/**
 * Request permission and get current location
 * Combined helper function
 */
export const requestLocationAndGetCoordinates = async (): Promise<LocationCoordinates | null> => {
  try {
    // Step 1: Request permission
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Bạn cần cấp quyền truy cập vị trí để tiếp tục.');
    }
    
    // Step 2: Get coordinates
    const coordinates = await getCurrentLocation();
    return coordinates;
  } catch (error: any) {
    console.error('Location service error:', error);
    throw error;
  }
};

