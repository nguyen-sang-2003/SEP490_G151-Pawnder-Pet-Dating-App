import client from './client';

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
    console.log(`📞 Calling: GET /user-preference/${userId}`);
    const response = await client.get(`/user-preference/${userId}`);
    console.log('✅ User preferences:', response.data);
    
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
    console.error('❌ Error fetching user preferences:', error);
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
    console.log(`📞 Calling: POST /user-preference/${userId}/batch`, preferences);
    const response = await client.post(`/user-preference/${userId}/batch`, {
      Preferences: preferences,
    });
    console.log('✅ Preferences saved:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error saving preferences:', error);
    throw error;
  }
};

/**
 * Delete all preferences for a user
 * DELETE /user-preference/{userId}
 */
export const deleteUserPreferences = async (userId: number): Promise<void> => {
  try {
    console.log(`📞 Calling: DELETE /user-preference/${userId}`);
    const response = await client.delete(`/user-preference/${userId}`);
    console.log('✅ Preferences deleted:', response.data);
  } catch (error: any) {
    console.error('❌ Error deleting preferences:', error);
    throw error;
  }
};

