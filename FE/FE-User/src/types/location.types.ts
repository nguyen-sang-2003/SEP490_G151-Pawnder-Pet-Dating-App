import { CreateLocationRequest, LocationResponse } from './appointment.types';

export type LocationSelectionType = 'PRESET' | 'CUSTOM';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PresetLocationSelection {
  type: 'PRESET';
  locationId: number;
  location?: LocationResponse;
}

export interface CustomLocationSelection {
  type: 'CUSTOM';
  customLocation: CreateLocationRequest;
  displayName?: string;
}

export type LocationSelectionResult =
  | PresetLocationSelection
  | CustomLocationSelection;

export interface ReverseGeocodeResult {
  address: string;
  name?: string;
  city?: string;
  district?: string;
}

export interface LocationPermissionResult {
  granted: boolean;
  blocked?: boolean;
  message?: string;
}
