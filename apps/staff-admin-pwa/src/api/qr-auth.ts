// QR Authentication API Client for PWA
import axios from 'axios';
import { z } from 'zod';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';

// Response schemas
export const QRSessionSchema = z.object({
  sessionId: z.string(),
  qrPayload: z.string(),
  expiresAt: z.string(),
  pollInterval: z.number(),
});

export const QRPollResponseSchema = z.object({
  success: z.boolean(),
  status: z.enum(['pending', 'authenticated', 'expired', 'cancelled']),
  message: z.string().optional(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresAt: z.string(),
    authenticatedAt: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
      role: z.string(),
      status: z.string(),
      avatarUrl: z.string().nullable().optional(),
    }),
  }).optional(),
});

export type QRSession = z.infer<typeof QRSessionSchema>;
export type QRPollResponse = z.infer<typeof QRPollResponseSchema>;

class QRAuthAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = SUPABASE_URL;
  }

  /**
   * Generate a new QR authentication session
   */
  async generateSession(browserFingerprint?: string): Promise<QRSession> {
    try {
      const response = await axios.post(
        `${this.baseURL}/functions/v1/auth-qr-generate`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            ...(browserFingerprint && { 'x-browser-fingerprint': browserFingerprint }),
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate QR session');
      }

      return QRSessionSchema.parse(response.data.data);
    } catch (error) {
      console.error('QR generation error:', error);
      throw new Error('Failed to generate QR code. Please try again.');
    }
  }

  /**
   * Poll for authentication status
   */
  async pollSession(sessionId: string): Promise<QRPollResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/functions/v1/auth-qr-poll`,
        {
          params: { sessionId },
        }
      );

      return QRPollResponseSchema.parse(response.data);
    } catch (error) {
      console.error('QR poll error:', error);
      throw new Error('Failed to check authentication status.');
    }
  }

  /**
   * Cancel a QR session
   */
  async cancelSession(sessionId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseURL}/functions/v1/auth-qr-cancel`,
        { sessionId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('QR cancel error:', error);
      // Don't throw, cancellation is best-effort
    }
  }
}

export const qrAuthAPI = new QRAuthAPI();
