/**
 * Format Vietnamese address with proper prefixes
 * Adds "Phường/Xã", "Quận/Huyện/Thị xã", "Thành phố/Tỉnh" prefixes
 */

/**
 * Mapping for common Vietnamese place names without diacritics to with diacritics
 */
const VIETNAMESE_PLACE_NAME_MAP: Record<string, string> = {
  // Hà Nội districts
  'hoang mai': 'Hoàng Mai',
  'hoan kiem': 'Hoàn Kiếm',
  'hai ba trung': 'Hai Bà Trưng',
  'dong da': 'Đống Đa',
  'ba dinh': 'Ba Đình',
  'tay ho': 'Tây Hồ',
  'cau giay': 'Cầu Giấy',
  'thanh xuan': 'Thanh Xuân',
  'long bien': 'Long Biên',
  'nam tu liem': 'Nam Từ Liêm',
  'bac tu liem': 'Bắc Từ Liêm',
  'ha dong': 'Hà Đông',
  'son tay': 'Sơn Tây',
  'ba vi': 'Ba Vì',
  'phuc tho': 'Phúc Thọ',
  'dan phuong': 'Đan Phượng',
  'hoai duc': 'Hoài Đức',
  'quoc oai': 'Quốc Oai',
  'thach that': 'Thạch Thất',
  'chuong my': 'Chương Mỹ',
  'thanh oai': 'Thanh Oai',
  'thuong tin': 'Thường Tín',
  'phu xuyen': 'Phú Xuyên',
  'ung hoa': 'Ứng Hòa',
  'me linh': 'Mê Linh',
  'ha noi': 'Hà Nội',
  'ha noi city': 'Hà Nội',
  'kien hung': 'Kiến Hưng',
  'hoa lac': 'Hòa Lạc',
  
  // Ho Chi Minh City districts
  'quan 1': 'Quận 1',
  'quan 2': 'Quận 2',
  'quan 3': 'Quận 3',
  'quan 4': 'Quận 4',
  'quan 5': 'Quận 5',
  'quan 6': 'Quận 6',
  'quan 7': 'Quận 7',
  'quan 8': 'Quận 8',
  'quan 9': 'Quận 9',
  'quan 10': 'Quận 10',
  'quan 11': 'Quận 11',
  'quan 12': 'Quận 12',
  'binh thanh': 'Bình Thạnh',
  'tan binh': 'Tân Bình',
  'tan phu': 'Tân Phú',
  'phu nhuan': 'Phú Nhuận',
  'go vap': 'Gò Vấp',
  'binh tan': 'Bình Tân',
  'thu duc': 'Thủ Đức',
  'ho chi minh': 'Hồ Chí Minh',
  'ho chi minh city': 'Hồ Chí Minh',
  'thanh pho ho chi minh': 'Thành phố Hồ Chí Minh',
};

/**
 * Convert Vietnamese place name from no-diacritics to with diacritics
 */
const normalizeVietnameseName = (name: string): string => {
  if (!name) return name;
  
  const nameLower = name.toLowerCase().trim();
  
  // Check exact match first
  if (VIETNAMESE_PLACE_NAME_MAP[nameLower]) {
    return VIETNAMESE_PLACE_NAME_MAP[nameLower];
  }
  
  // Check if name contains any mapped substring
  for (const [key, value] of Object.entries(VIETNAMESE_PLACE_NAME_MAP)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return name.replace(regex, value);
    }
  }
  
  return name;
};

/**
 * Format ward name with prefix
 */
export const formatWard = (ward: string | null | undefined): string | null => {
  if (!ward) return null;
  
  let trimmed = ward.trim();
  if (!trimmed) return null;
  
  // Remove English suffixes/words if present
  trimmed = trimmed.replace(/\s*(Ward|ward|Commune|commune)\s*$/i, '').trim();
  trimmed = trimmed.replace(/^\s*(Ward|ward|Commune|commune)\s*/i, '').trim();
  trimmed = trimmed.replace(/\s+(Ward|ward|Commune|commune)\s+/gi, ' ').trim();
  if (!trimmed) return null;
  
  // Normalize Vietnamese name (add diacritics)
  trimmed = normalizeVietnameseName(trimmed);
  
  // If already has Vietnamese prefix, return as is
  if (trimmed.toLowerCase().startsWith('phường') || 
      trimmed.toLowerCase().startsWith('xã') ||
      trimmed.toLowerCase().startsWith('thị trấn')) {
    return trimmed;
  }
  
  // Default to "Phường"
  return `Phường ${trimmed}`;
};

/**
 * Format district name with prefix
 */
export const formatDistrict = (district: string | null | undefined): string | null => {
  if (!district) return null;
  
  let trimmed = district.trim();
  if (!trimmed) return null;
  
  // Remove English suffixes/words if present
  trimmed = trimmed.replace(/\s*(District|district|Commune|commune)\s*$/i, '').trim();
  trimmed = trimmed.replace(/^\s*(District|district|Commune|commune)\s*/i, '').trim();
  trimmed = trimmed.replace(/\s+(District|district|Commune|commune)\s+/gi, ' ').trim();
  if (!trimmed) return null;
  
  // Normalize Vietnamese name (add diacritics)
  trimmed = normalizeVietnameseName(trimmed);
  
  // If already has Vietnamese prefix, return as is
  if (trimmed.toLowerCase().startsWith('quận') || 
      trimmed.toLowerCase().startsWith('huyện') ||
      trimmed.toLowerCase().startsWith('thị xã')) {
    return trimmed;
  }
  
  // Try to determine prefix based on name pattern
  const hasNumber = /\d/.test(trimmed);
  const prefix = hasNumber ? 'Quận' : 'Huyện';
  
  return `${prefix} ${trimmed}`;
};

/**
 * Format city name with prefix
 */
export const formatCity = (city: string | null | undefined): string | null => {
  if (!city) return null;
  
  let trimmed = city.trim();
  if (!trimmed) return null;
  
  // Remove English suffixes/words if present
  trimmed = trimmed.replace(/\s*(City|city|Province|province|Commune|commune)\s*$/i, '').trim();
  trimmed = trimmed.replace(/^\s*(City|city|Province|province|Commune|commune)\s*/i, '').trim();
  trimmed = trimmed.replace(/\s+(City|city|Province|province|Commune|commune)\s+/gi, ' ').trim();
  if (!trimmed) return null;
  
  // Normalize Vietnamese name (add diacritics)
  trimmed = normalizeVietnameseName(trimmed);
  
  // If already has Vietnamese prefix, return as is
  if (trimmed.toLowerCase().startsWith('thành phố') || 
      trimmed.toLowerCase().startsWith('tỉnh')) {
    return trimmed;
  }
  
  // Major cities are "Thành phố", others are "Tỉnh"
  const majorCities = [
    'hà nội', 'hồ chí minh', 'đà nẵng', 'hải phòng', 'cần thơ',
  ];
  
  const cityLower = trimmed.toLowerCase();
  const isMajorCity = majorCities.some(mc => cityLower.includes(mc) || mc.includes(cityLower));
  
  const prefix = isMajorCity ? 'Thành phố' : 'Tỉnh';
  return `${prefix} ${trimmed}`;
};

/**
 * Format full address with all components
 */
export const formatFullAddress = (
  ward: string | null | undefined,
  district: string | null | undefined,
  city: string | null | undefined
): string => {
  const parts = [
    formatWard(ward),
    formatDistrict(district),
    formatCity(city)
  ].filter(Boolean) as string[];
  
  return parts.join(', ') || '';
};

/**
 * Format short address (district and city only)
 */
export const formatShortAddress = (
  district: string | null | undefined,
  city: string | null | undefined
): string => {
  const parts = [
    formatDistrict(district),
    formatCity(city)
  ].filter(Boolean) as string[];
  
  return parts.join(', ') || '';
};

/**
 * Format ward and district only (without city)
 * Used when city is already shown separately
 */
export const formatWardDistrict = (
  ward: string | null | undefined,
  district: string | null | undefined
): string => {
  const parts = [
    formatWard(ward),
    formatDistrict(district)
  ].filter(Boolean) as string[];
  
  return parts.join(', ') || '';
};



