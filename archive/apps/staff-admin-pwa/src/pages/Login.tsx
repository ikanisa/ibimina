import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, QrCode2, Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { QRAuthLogin } from '@/components/auth/QRAuthLogin';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoginPage() {
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      login({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQRSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 3, px: 4 }}>
            <Typography variant="h4" align="center" fontWeight={600}>
              Staff Admin Portal
            </Typography>
            <Typography variant="body2" align="center" sx={{ mt: 1, opacity: 0.9 }}>
              Secure authentication for banking staff
            </Typography>
          </Box>

          <Box sx={{ px: 4, pt: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="authentication tabs"
              variant="fullWidth"
            >
              <Tab
                icon={<QrCode2 />}
                label="QR Code"
                iconPosition="start"
                id="auth-tab-0"
                aria-controls="auth-tabpanel-0"
              />
              <Tab
                icon={<Email />}
                label="Email"
                iconPosition="start"
                id="auth-tab-1"
                aria-controls="auth-tabpanel-1"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <QRAuthLogin onSuccess={handleQRSuccess} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleEmailLogin}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Sign in with Email
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !email || !password}
                sx={{ mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>Note:</strong> Email login requires additional verification.
                  For faster and more secure access, use QR code authentication with your mobile app.
                </Typography>
              </Alert>
            </Box>
          </TabPanel>

          <Box sx={{ px: 4, pb: 3, pt: 2, bgcolor: 'grey.50' }}>
            <Alert severity="info">
              <Typography variant="caption">
                <strong>First time?</strong> Download the Staff Admin mobile app from your
                device management portal and register your device.
              </Typography>
            </Alert>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
