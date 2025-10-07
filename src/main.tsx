import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { OfflineQueueProvider } from "./context/OfflineQueueContext";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

createRoot(container).render(
  <OfflineQueueProvider>
    <App />
  </OfflineQueueProvider>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.info("Service worker registered");
      })
      .catch((error) => {
        console.error("Service worker registration failed", error);
      });
  });
}
