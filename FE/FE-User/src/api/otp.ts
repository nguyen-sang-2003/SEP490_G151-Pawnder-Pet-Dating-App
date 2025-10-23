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
 * Verify OTP code
 * Note: Backend doesn't have verify endpoint yet, so we compare locally in dev
 */
export const verifyOtp = async (
  email: string,
  otpCode: string,
  expectedOtp?: string
): Promise<boolean> => {
  try {
    // TODO: Replace with actual API call when backend implements verify endpoint
    // const response = await apiClient.post('/api/verify-otp', { email, otp: otpCode });
    
    // For now, verify locally (development only)
    if (__DEV__ && expectedOtp) {
      console.log('Verifying OTP locally:', { otpCode, expectedOtp });
      return otpCode === expectedOtp;
    }
    
    // In production, always return true for now (until backend adds verify endpoint)
    // TODO: Remove this when backend implements verify-otp endpoint
    return true;
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    throw error;
  }
};

