import client from './client';

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
  Options: AttributeOption[];
}

/**
 * Get attributes list (call: GET /api/attribute)
 */
export const getAttributes = async (): Promise<Attribute[]> => {
  const response = await client.get('/api/attribute', {
    params: { page: 1, pageSize: 100, includeDeleted: false }
  });
  
  console.log('Raw attributes response:', JSON.stringify(response.data));
  const attrs = response.data.data || [];
  console.log('Attributes data:', attrs);
  
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
export const getAttributesForFilter = async (): Promise<AttributeForFilter[]> => {
  try {
    console.log('📞 Calling: GET /api/attribute/for-filter');
    const response = await client.get('/api/attribute/for-filter');
    console.log('✅ Attributes for filter:', response.data);
    
    const attrs = response.data.data || [];
    
    return attrs.map((attr: any) => ({
      AttributeId: attr.attributeId || attr.AttributeId,
      Name: attr.name || attr.Name,
      TypeValue: attr.typeValue || attr.TypeValue,
      Unit: attr.unit || attr.Unit,
      Options: (attr.options || attr.Options || []).map((opt: any) => ({
        OptionId: opt.optionId || opt.OptionId,
        Name: opt.name || opt.Name,
      })),
    }));
  } catch (error: any) {
    console.error('❌ Error fetching attributes for filter:', error);
    throw error;
  }
};

/**
 * Get attribute options by attributeId
 * Route: /api/attributeoption/{attributeId}
 */
export const getAttributeOptions = async (attributeId: number): Promise<AttributeOption[]> => {
  const response = await client.get(`/api/attributeoption/${attributeId}`);
  console.log(`Options for attribute ${attributeId}:`, response.data);
  
  const options = Array.isArray(response.data) ? response.data : [];
  
  // Normalize to PascalCase
  return options.map((opt: any) => ({
    OptionId: opt.optionId || opt.OptionId,
    Name: opt.name || opt.Name,
    AttributeId: opt.attributeId || opt.AttributeId,
  }));
};

