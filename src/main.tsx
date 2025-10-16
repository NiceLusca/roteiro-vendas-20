import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorker'

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <App />
);

// Register service worker for offline support and caching
registerServiceWorker();
