// Theme colors cho toàn bộ app - Pawnder
// Palette dễ thương, pastel, dịu mắt - Gradient-based design

export const colors = {
  // Primary Pink - Core brand color
  primary: "#E91E63",
  primaryLight: "#FF6B9D",
  primaryDark: "#C2185B",
  primaryPastel: "#FFBDD7",
  
  // Background Gradients - nhẹ nhàng, pastel
  bgGradientStart: "#FFF0F7",
  bgGradientEnd: "#FFDDE9",
  
  // Cards & Surfaces - màu hồng kem dễ thương
  cardBackground: "#FFF8FB",
  cardBackgroundLight: "#FFF0F5",
  
  // === FEATURE GRADIENTS - Hệ thống màu mới tinh tế & sang trọng ===
  
  // Home/Matching - Đỏ hồng rực rỡ (năng lượng, đam mê)
  homeStart: "#FF6B9D",
  homeEnd: "#FF8FB7",
  
  // Favorite/Matches - Hồng đào dịu (lãng mạn, ấm áp)
  favoriteStart: "#FF8FA3",
  favoriteEnd: "#FFB8C6",
  
  // Chat - Cam đào như AI (thân thiện, ấm áp)
  chatStart: "#FF9A76",
  chatEnd: "#FF7EB3",
  
  // Profile - Hồng pastel (cá nhân, nhẹ nhàng)
  profileStart: "#FFAAC4",
  profileEnd: "#FFD4E5",
  
  // Notification - Hồng lavender (thông báo, dễ chịu)
  notificationStart: "#FFB5D0",
  notificationEnd: "#FFE0ED",
  
  // Purple Accents - cho pet profile details
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
  
  // AI Chat Colors - Warm & Friendly
  aiPrimary: "#FF9A76",      // Cam đào
  aiSecondary: "#FF7EB3",    // Hồng đào
  aiLight: "#FFD4C4",        // Cam nhạt
  aiGlow: "rgba(255, 154, 118, 0.2)",
  
  // Neutral
  white: "#FFFFFF",
  whiteWarm: "#FFF8FB", // Trắng ấm cho surfaces
  black: "#000000",
  
  // Shadows
  shadowPrimary: "rgba(255, 110, 167, 0.25)",
  shadowLight: "rgba(255, 110, 167, 0.08)",
  shadowDark: "rgba(0, 0, 0, 0.1)",
};

// Gradient combinations - Mỗi feature có gradient riêng (độ tương phản cao hơn)
export const gradients = {
  // Core gradients
  primary: [colors.primary, colors.primaryLight],
  primarySoft: [colors.primary, colors.primaryPastel],
  purple: [colors.purple, colors.purpleLight],
  background: [colors.bgGradientStart, colors.bgGradientEnd],
  
  // Feature-specific gradients - Tất cả đều gradient 2 màu đẹp như Chat
  home: ["#FF6B9D", "#E91E63"],               // Home - Hồng tươi → Đỏ hồng (passionate)
  favorite: ["#FF6EA7", "#FF4A8C"],           // Favorite - Hồng đào → Hồng đậm (romantic)
  chat: ["#FF9A76", "#FF7EB3"],               // Chat - Cam đào → Hồng đào (warm)
  profile: ["#FF8FB7", "#FF6B9D"],            // Profile - Hồng pastel → Hồng tươi (soft)
  notification: ["#FFB8D6", "#FF8FB7"],       // Notification - Hồng lavender → Hồng pastel
  
  // AI Chat - Cam-hồng đào (nổi bật khác biệt)
  ai: [colors.aiPrimary, colors.aiSecondary],
  aiSoft: [colors.aiLight, colors.aiSecondary],
  
  // Auth-specific gradients - Nhẹ nhàng, pastel, dịu mắt
  auth: {
    // Welcome & Sign In - Hồng pastel nhẹ nhàng, ấm áp
    welcome: ["#FFE5F1", "#FFD1E3", "#FFC4D6"],          // Hồng rất nhạt → Hồng pastel nhẹ → Hồng pastel
    
    // Sign Up - Hồng pastel với tím nhẹ sang trọng
    signup: ["#FFE0F0", "#FFCCE5", "#FFB5DA"],           // Hồng tím rất nhẹ → Hồng pastel → Hồng pastel đậm hơn
    
    // Forgot/Reset/OTP - Xanh tím hồng mơ màng
    forgot: ["#FFE5F1", "#FFD6E8", "#FFEBF4"],           // Hồng nhạt → Hồng tím nhạt → Trắng hồng
    
    // Button gradients - Nút bấm nhẹ nhàng nhưng nổi bật
    buttonPrimary: ["#FF8EC7", "#FFB5D9"],               // Hồng pastel → Hồng pastel nhạt
    buttonSecondary: ["#FFB5D9", "#FFC9E0"],             // Hồng pastel → Hồng rất nhạt
    buttonWelcome: ["#FFB5D9", "#FFC9E0"],               // Hồng pastel nhẹ nhàng
  },
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

