import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  LinearProgress,
} from '@mui/material';
import { QrCode2, Refresh, Close } from '@mui/icons-material';
import QRCode from 'qrcode';
import { qrAuthAPI, type QRSession } from '@/api/qr-auth';
import { useAuthStore } from '@/stores/auth';

interface QRAuthLoginProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const QRAuthLogin: React.FC<QRAuthLoginProps> = ({ onSuccess, onCancel }) => {
  const [qrSession, setQrSession] = useState<QRSession | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [polling, setPolling] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { login } = useAuthStore();

  // Generate QR code session
  const generateQRSession = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Generate browser fingerprint (simple version)
      const fingerprint = btoa(
        `${navigator.userAgent}|${window.screen.width}x${window.screen.height}|${navigator.language}`
      );

      const session = await qrAuthAPI.generateSession(fingerprint);
      setQrSession(session);

      // Generate QR code image
      const qrData = session.qrPayload;
      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrImageUrl(qrUrl);

      // Calculate time remaining
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      const remaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      setTimeRemaining(remaining);

      // Start polling
      startPolling(session.sessionId, session.pollInterval);

      // Start countdown
      startCountdown();

      setLoading(false);
    } catch (err) {
      console.error('Failed to generate QR session:', err);
      setError('Failed to generate QR code. Please try again.');
      setLoading(false);
    }
  }, []);

  // Poll for authentication status
  const pollAuthStatus = useCallback(
    async (sessionId: string) => {
      if (polling) return; // Prevent concurrent polls

      try {
        setPolling(true);
        const result = await qrAuthAPI.pollSession(sessionId);

        if (result.status === 'authenticated' && result.data) {
          // Authentication successful
          stopPolling();
          stopCountdown();

          // Store tokens and user
          login({
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            user: result.data.user,
          });

          onSuccess?.();
        } else if (result.status === 'expired' || result.status === 'cancelled') {
          // Session expired or cancelled
          stopPolling();
          stopCountdown();
          setError(
            result.status === 'expired'
              ? 'QR code expired. Please generate a new one.'
              : 'Authentication cancelled.'
          );
        }
      } catch (err) {
        console.error('Poll error:', err);
        // Don't show error for individual poll failures
      } finally {
        setPolling(false);
      }
    },
    [polling, login, onSuccess]
  );

  // Start polling interval
  const startPolling = useCallback(
    (sessionId: string, interval: number) => {
      stopPolling(); // Clear any existing interval

      pollIntervalRef.current = setInterval(() => {
        pollAuthStatus(sessionId);
      }, interval);
    },
    [pollAuthStatus]
  );

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Start countdown timer
  const startCountdown = useCallback(() => {
    stopCountdown(); // Clear any existing interval

    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopPolling();
          stopCountdown();
          setError('QR code expired. Please generate a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopPolling]);

  // Stop countdown
  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    stopPolling();
    stopCountdown();

    if (qrSession) {
      qrAuthAPI.cancelSession(qrSession.sessionId).catch(console.error);
    }

    onCancel?.();
  }, [qrSession, stopPolling, stopCountdown, onCancel]);

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    stopPolling();
    stopCountdown();

    if (qrSession) {
      qrAuthAPI.cancelSession(qrSession.sessionId).catch(console.error);
    }

    generateQRSession();
  }, [qrSession, stopPolling, stopCountdown, generateQRSession]);

  // Initialize on mount
  useEffect(() => {
    generateQRSession();

    return () => {
      stopPolling();
      stopCountdown();

      if (qrSession) {
        qrAuthAPI.cancelSession(qrSession.sessionId).catch(console.error);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <QrCode2 sx={{ fontSize: 48, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
            Scan to Login
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Use the Staff Admin mobile app to scan this QR code
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && qrImageUrl && (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 2,
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 2,
              }}
            >
              <img
                src={qrImageUrl}
                alt="QR Code for authentication"
                style={{ width: 300, height: 300 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Time remaining: {formatTime(timeRemaining)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(timeRemaining / 300) * 100}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
              Waiting for mobile app authentication...
            </Typography>
          </>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          {!loading && (
            <>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRegenerate}
                disabled={loading}
              >
                Regenerate
              </Button>
              <Button
                variant="text"
                startIcon={<Close />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          How it works:
        </Typography>
        <Typography variant="caption" component="div">
          1. Open the Staff Admin app on your phone
        </Typography>
        <Typography variant="caption" component="div">
          2. Tap "Scan QR Code" or use the scanner icon
        </Typography>
        <Typography variant="caption" component="div">
          3. Point your camera at this QR code
        </Typography>
        <Typography variant="caption" component="div">
          4. Authenticate with your biometrics
        </Typography>
      </Alert>
    </Box>
  );
};
