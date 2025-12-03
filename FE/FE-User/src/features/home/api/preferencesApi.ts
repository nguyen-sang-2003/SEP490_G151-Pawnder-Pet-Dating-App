import apiClient from '../../../api/axiosClient';

export interface UserPreference {
  AttributeId: number;
  AttributeName: string;
  TypeValue: string | null;
  Unit: string | null;
  OptionId: number | null;
  OptionName: string | null;
  MinValue: number | null;
  MaxValue: number | null;
  CreatedAt: string | null;
  UpdatedAt: string | null;
}

export interface UserPreferenceBatchRequest {
  AttributeId: number;
  OptionId?: number | null;
  MinValue?: number | null;
  MaxValue?: number | null;
}

export interface UserPreferenceBatchUpsertRequest {
  Preferences: UserPreferenceBatchRequest[];
}

/**
 * Get all preferences for a user
 * GET /user-preference/{userId}
 */
export const getUserPreferences = async (userId: number): Promise<UserPreference[]> => {
  try {

    const response = await apiClient.get(`/user-preference/${userId}`);


    const prefs = response.data.data || response.data || [];

    return prefs.map((pref: any) => ({
      AttributeId: pref.attributeId || pref.AttributeId,
      AttributeName: pref.attributeName || pref.AttributeName,
      TypeValue: pref.typeValue || pref.TypeValue,
      Unit: pref.unit || pref.Unit,
      OptionId: pref.optionId ?? pref.OptionId ?? null,
      OptionName: pref.optionName || pref.OptionName || null,
      MinValue: pref.minValue ?? pref.MinValue ?? null,
      MaxValue: pref.maxValue ?? pref.MaxValue ?? null,
      CreatedAt: pref.createdAt || pref.CreatedAt || null,
      UpdatedAt: pref.updatedAt || pref.UpdatedAt || null,
    }));
  } catch (error: any) {

    throw error;
  }
};

/**
 * Save or update multiple preferences at once
 * POST /user-preference/{userId}/batch
 */
export const saveUserPreferencesBatch = async (
  userId: number,
  preferences: UserPreferenceBatchRequest[]
): Promise<{ message: string; created: number; updated: number }> => {
  try {

    const response = await apiClient.post(`/user-preference/${userId}/batch`, {
      Preferences: preferences,
    });

    return response.data;
  } catch (error: any) {

    throw error;
  }
};

/**
 * Delete all preferences for a user
 * DELETE /user-preference/{userId}
 */
export const deleteUserPreferences = async (userId: number): Promise<void> => {
  try {

    const response = await apiClient.delete(`/user-preference/${userId}`);

  } catch (error: any) {

    throw error;
  }
};

