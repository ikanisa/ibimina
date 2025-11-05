import { Workbox } from 'workbox-window';

export const registerSW = () => {
  if ('serviceWorker' in navigator && import.meta.env.VITE_PWA_DISABLED !== 'true') {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        if (confirm('New version available! Reload to update?')) {
          window.location.reload();
        }
      }
    });

    wb.addEventListener('waiting', () => {
      console.log('Service worker is waiting');
    });

    wb.addEventListener('controlling', () => {
      window.location.reload();
    });

    wb.addEventListener('activated', (event) => {
      if (!event.isUpdate) {
        console.log('Service worker activated for the first time!');
      } else {
        console.log('Service worker activated');
      }
    });

    wb.register().catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  }
};
