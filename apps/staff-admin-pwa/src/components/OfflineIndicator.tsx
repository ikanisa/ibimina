import { Snackbar, Alert, Button } from '@mui/material';
import { useAppStore } from '@/stores/app';
import { processOfflineQueue } from '@/lib/sync';

export const OfflineIndicator = () => {
  const isOffline = useAppStore((state) => state.isOffline);
  const setIsOffline = useAppStore((state) => state.setIsOffline);

  const handleRetry = async () => {
    if (navigator.onLine) {
      try {
        await processOfflineQueue();
        setIsOffline(false);
      } catch (error) {
        console.error('Failed to process offline queue:', error);
      }
    }
  };

  return (
    <Snackbar
      open={isOffline}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message="You are offline. Changes will be synced when connection is restored."
      action={
        <Button color="secondary" size="small" onClick={handleRetry}>
          Retry
        </Button>
      }
    >
      <Alert severity="warning" sx={{ width: '100%' }} action={
        <Button color="inherit" size="small" onClick={handleRetry}>
          Retry
        </Button>
      }>
        You are offline. Changes will be synced when connection is restored.
      </Alert>
    </Snackbar>
  );
};
