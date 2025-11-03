import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  Select,
  MenuItem,
  FormControl,
  Button,
  Snackbar,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

export const SettingsPage = () => {
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const notificationsEnabled = useAppStore((state) => state.notificationsEnabled);
  const setTheme = useAppStore((state) => state.setTheme);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const user = useAuthStore((state) => state.user);

  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    const promptEvent = installPrompt as any;
    promptEvent.prompt();
    const result = await promptEvent.userChoice;

    if (result.outcome === 'accepted') {
      setSnackbarMessage('App installed successfully!');
      setShowSnackbar(true);
      setIsInstallable(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        setSnackbarMessage('Notifications enabled');
        setShowSnackbar(true);
      } else {
        setSnackbarMessage('Notification permission denied');
        setShowSnackbar(true);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <List>
          <ListItem>
            <ListItemText
              primary="Profile"
              secondary={
                <>
                  <Typography variant="body2">{user?.name}</Typography>
                  <Typography variant="body2">{user?.email}</Typography>
                  <Typography variant="body2">Role: {user?.role}</Typography>
                </>
              }
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ mb: 2 }}>
        <List>
          <ListItem>
            <ListItemText primary="Theme" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText primary="Language" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="es">Español</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Notifications"
              secondary="Enable push notifications"
            />
            <Switch
              checked={notificationsEnabled}
              onChange={(e) => handleNotificationToggle(e.target.checked)}
            />
          </ListItem>
        </List>
      </Paper>

      {isInstallable && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Install App
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Install this app on your device for a better experience and offline access.
          </Typography>
          <Button variant="contained" onClick={handleInstall}>
            Install as App
          </Button>
        </Paper>
      )}

      <Paper sx={{ mb: 2 }}>
        <List>
          <ListItem>
            <ListItemText
              primary="About"
              secondary={
                <>
                  <Typography variant="body2">Version: {import.meta.env.VITE_APP_VERSION}</Typography>
                  <Typography variant="body2">Environment: {import.meta.env.MODE}</Typography>
                </>
              }
            />
          </ListItem>
          <Divider />
          <ListItem button component="a" href="/privacy.html" target="_blank">
            <ListItemText primary="Privacy Policy" />
          </ListItem>
          <Divider />
          <ListItem button component="a" href="/terms.html" target="_blank">
            <ListItemText primary="Terms of Service" />
          </ListItem>
        </List>
      </Paper>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};
