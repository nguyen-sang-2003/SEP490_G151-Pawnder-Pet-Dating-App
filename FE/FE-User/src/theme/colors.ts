// Theme colors cho toàn bộ app - Pawnder
// Palette dễ thương, pastel, dịu mắt

export const colors = {
  // Primary Pink
  primary: "#FF6EA7",
  primaryLight: "#FF9BC0",
  primaryPastel: "#FFC2D6",
  
  // Background Gradients - nhẹ nhàng, pastel
  bgGradientStart: "#FFF0F7",
  bgGradientEnd: "#FFDDE9",
  
  // Cards & Surfaces - màu hồng kem dễ thương
  cardBackground: "#FFF8FB",
  cardBackgroundLight: "#FFF0F5",
  
  // Purple Accents - cho pet profile
  purple: "#C8A8D4",
  purpleLight: "#E8D5EE",
  purplePastel: "#F5F0F7",
  
  // Text Colors
  textDark: "#333333",
  textMedium: "#666666",
  textLight: "#999999",
  textLabel: "#555555",
  
  // Gender Colors
  male: "#4A90E2",
  female: "#FF6EA7",
  
  // Borders & Dividers
  border: "#F0F0F0",
  divider: "#F5F5F5",
  
  // Status & Feedback
  success: "#4CAF50",
  warning: "#FFC107",
  error: "#E94D6B",
  
  // Neutral
  white: "#FFFFFF",
  whiteWarm: "#FFF8FB", // Trắng ấm cho surfaces
  black: "#000000",
  
  // Shadows
  shadowPrimary: "rgba(255, 110, 167, 0.25)",
  shadowLight: "rgba(255, 110, 167, 0.08)",
  shadowDark: "rgba(0, 0, 0, 0.1)",
};

// Gradient combinations
export const gradients = {
  primary: [colors.primary, colors.primaryLight],
  primarySoft: [colors.primary, colors.primaryPastel],
  purple: [colors.purple, colors.purpleLight],
  background: [colors.bgGradientStart, colors.bgGradientEnd],
};

// Border radius standards
export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  full: 9999,
};

// Spacing standards
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
};

// Typography
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 13,
    md: 14,
    base: 15,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 22,
    huge: 24,
    massive: 32,
  },
  
  // Font weights
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },
};

// Shadow presets
export const shadows = {
  small: {
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  medium: {
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  large: {
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  button: {
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

