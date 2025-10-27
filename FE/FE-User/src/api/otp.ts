import { apiClient } from './client';

export interface SendOtpResponse {
  message: string;
  otp: string; // Only in development
}

/**
 * Send OTP to email
 */
export const sendOtp = async (email: string): Promise<SendOtpResponse> => {
  try {
    const response = await apiClient.get<SendOtpResponse>('/api/send-mail-otp', {
      params: { email },
    });
    
    console.log('OTP sent:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Send OTP error:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

/**
 * Verify OTP code with backend
 */
export const verifyOtp = async (
  email: string,
  otpCode: string
): Promise<boolean> => {
  try {
    console.log('🔐 Verifying OTP with backend:', { email, otpCode });
    
    const response = await apiClient.post('/api/check-otp', {
      email,
      otp: otpCode
    });
    
    console.log('✅ OTP verified:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ Verify OTP error:', error);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    
    throw new Error('Mã OTP không đúng hoặc đã hết hạn');
  }
};

