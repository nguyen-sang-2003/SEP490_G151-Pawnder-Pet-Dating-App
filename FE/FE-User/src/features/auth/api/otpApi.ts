import { apiClient } from '../../../api/axiosClient';

export interface SendOtpResponse {
  message: string;
  otp: string; // Only in development
}

/**
 * Send OTP to email
 * @param email - Email address
 * @param purpose - 'register' for new account, 'forgot-password' for password reset
 */
export const sendOtp = async (email: string, purpose: 'register' | 'forgot-password' = 'register'): Promise<SendOtpResponse> => {
  try {
    const response = await apiClient.get<SendOtpResponse>('/api/send-mail-otp', {
      params: { email, purpose },
    });

    return response.data;
  } catch (error: any) {
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


    const response = await apiClient.post('/api/check-otp', {
      email,
      otp: otpCode
    });


    return true;
  } catch (error: any) {


    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error('Mã OTP không đúng hoặc đã hết hạn');
  }
};

/**
 * Reset password with OTP verification
 */
export const resetPassword = async (
  email: string,
  newPassword: string
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.put<{ message: string }>('/user/reset-password', {
      email,
      newPassword
    });

    return response.data;
  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
  }
};

