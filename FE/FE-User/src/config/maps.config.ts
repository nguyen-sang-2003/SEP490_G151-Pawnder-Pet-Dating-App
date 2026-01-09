import { Coordinates } from '../types/location.types';
import Config from 'react-native-config';

export const MAPS_CONFIG: {
  GOOGLE_MAPS_API_KEY: string;
  DEFAULT_CITY_CENTER: Coordinates;
  CITY_CENTERS: Record<string, Coordinates>;
} = {
  // Lấy từ .env file - KHÔNG hardcode API key
  GOOGLE_MAPS_API_KEY: Config.GOOGLE_MAPS_API_KEY || '',
  DEFAULT_CITY_CENTER: {
    latitude: 10.7769,
    longitude: 106.7009,
  },
  CITY_CENTERS: {
    'ho chi minh': { latitude: 10.7769, longitude: 106.7009 },
    hcm: { latitude: 10.7769, longitude: 106.7009 },
    'ha noi': { latitude: 21.0278, longitude: 105.8342 },
    hanoi: { latitude: 21.0278, longitude: 105.8342 },
    'da nang': { latitude: 16.0544, longitude: 108.2022 },
    danang: { latitude: 16.0544, longitude: 108.2022 },
  },
};

export const getCityCenter = (city?: string): Coordinates => {
  if (!city) return MAPS_CONFIG.DEFAULT_CITY_CENTER;

  const normalized = city.toLowerCase();
  const cityKeys = Object.keys(MAPS_CONFIG.CITY_CENTERS);

  for (const key of cityKeys) {
    if (normalized.includes(key)) {
      return MAPS_CONFIG.CITY_CENTERS[key];
    }
  }

  return MAPS_CONFIG.DEFAULT_CITY_CENTER;
};
