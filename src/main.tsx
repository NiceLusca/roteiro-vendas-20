import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorker'

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for offline support and caching
registerServiceWorker();
