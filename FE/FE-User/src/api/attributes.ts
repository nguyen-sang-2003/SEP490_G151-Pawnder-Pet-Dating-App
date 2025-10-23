import client from './client';

export interface AttributeOption {
  OptionId?: number;
  optionId?: number;
  Name?: string;
  name?: string;
  OptionValue?: string;
  optionValue?: string;
  AttributeId?: number;
  attributeId?: number;
}

export interface Attribute {
  AttributeId?: number;
  attributeId?: number;  // Handle camelCase from C#
  Name?: string;
  name?: string;
  TypeValue?: string | null;
  typeValue?: string | null;
  Unit?: string | null;
  unit?: string | null;
  IsDeleted?: boolean;
  isDeleted?: boolean;
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

