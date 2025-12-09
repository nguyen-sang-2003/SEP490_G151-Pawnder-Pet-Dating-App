import apiClient from '../../../api/axiosClient';

export interface AttributeOption {
  OptionId: number;
  Name: string;
  AttributeId?: number;
}

export interface Attribute {
  AttributeId: number;
  Name: string;
  TypeValue: string | null;
  Unit: string | null;
  IsDeleted?: boolean;
}

export interface AttributeForFilter {
  AttributeId: number;
  Name: string;
  TypeValue: string | null;
  Unit: string | null;
  Percent?: number | null;
  Options: AttributeOption[];
}

export interface FilterSuggestion {
  topAttributes: string[];
  totalPercent: number;
  message: string | null;
}

/**
 * Get attributes list (call: GET /api/attribute)
 */
export const getAttributes = async (): Promise<Attribute[]> => {
  const response = await apiClient.get('/api/attribute', {
    params: { page: 1, pageSize: 100, includeDeleted: false }
  });


  const attrs = response.data.data || [];


  // Normalize to PascalCase
  return attrs.map((attr: any) => ({
    AttributeId: attr.attributeId || attr.AttributeId,
    Name: attr.name || attr.Name,
    TypeValue: attr.typeValue || attr.TypeValue,
    Unit: attr.unit || attr.Unit,
    IsDeleted: attr.isDeleted || attr.IsDeleted,
  }));
};

/**
 * Get attributes for filter with options
 * Route: GET /api/attribute/for-filter
 */
export const getAttributesForFilter = async (): Promise<{
  attributes: AttributeForFilter[];
  suggestion: FilterSuggestion
}> => {
  try {

    const response = await apiClient.get('/api/attribute/for-filter');


    const attrs = response.data.data || [];
    const suggestion = response.data.suggestion || { topAttributes: [], totalPercent: 0, message: null };

    return {
      attributes: attrs.map((attr: any) => ({
        AttributeId: attr.attributeId || attr.AttributeId,
        Name: attr.name || attr.Name,
        TypeValue: attr.typeValue || attr.TypeValue,
        Unit: attr.unit || attr.Unit,
        Percent: attr.percent ?? attr.Percent,
        Options: (attr.options || attr.Options || []).map((opt: any) => ({
          OptionId: opt.optionId || opt.OptionId,
          Name: opt.name || opt.Name,
        })),
      })),
      suggestion: {
        topAttributes: suggestion.topAttributes || [],
        totalPercent: suggestion.totalPercent || 0,
        message: suggestion.message || null,
      }
    };
  } catch (error: any) {

    throw error;
  }
};

/**
 * Get attribute options by attributeId
 * Route: /api/attributeoption/{attributeId}
 */
export const getAttributeOptions = async (attributeId: number): Promise<AttributeOption[]> => {
  const response = await apiClient.get(`/api/attributeoption/${attributeId}`);


  const options = Array.isArray(response.data) ? response.data : [];

  // Normalize to PascalCase
  return options.map((opt: any) => ({
    OptionId: opt.optionId || opt.OptionId,
    Name: opt.name || opt.Name,
    AttributeId: opt.attributeId || opt.AttributeId,
  }));
};

