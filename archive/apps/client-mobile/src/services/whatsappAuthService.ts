import { supabase } from './supabase';

interface SendOTPResult {
  success: boolean;
  error?: string;
}

interface VerifyOTPResult {
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
}

class WhatsAppAuthService {
  /**
   * Send OTP to user's WhatsApp number
   */
  async sendOTP(phoneNumber: string): Promise<SendOTPResult> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-send-otp', {
        body: { phoneNumber },
      });

      if (error) {
        console.error('Send OTP error:', error);
        return {
          success: false,
          error: this.getErrorMessage(error),
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Send OTP exception:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOTP(phoneNumber: string, otpCode: string): Promise<VerifyOTPResult> {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-verify-otp', {
        body: { phoneNumber, otpCode },
      });

      if (error) {
        console.error('Verify OTP error:', error);
        return {
          success: false,
          error: this.getErrorMessage(error),
        };
      }

      if (!data || !data.user || !data.session) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }

      // Set Supabase session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        console.error('Set session error:', sessionError);
        return {
          success: false,
          error: 'Failed to authenticate. Please try again.',
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      console.error('Verify OTP exception:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Extract user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.message) {
      // Map common error messages to user-friendly versions
      const message = error.message.toLowerCase();
      
      if (message.includes('rate limit')) {
        return 'Too many requests. Please try again in a few minutes.';
      }
      
      if (message.includes('expired')) {
        return 'This code has expired. Please request a new one.';
      }
      
      if (message.includes('invalid')) {
        return 'Invalid code. Please check and try again.';
      }
      
      if (message.includes('not found')) {
        return 'Phone number not found. Please try again.';
      }
      
      return error.message;
    }
    
    return 'An error occurred. Please try again.';
  }
}

export const whatsappAuthService = new WhatsAppAuthService();
