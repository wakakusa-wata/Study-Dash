import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker for Progressive Web App features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const baseUrl = (import.meta as any).env.BASE_URL || '/';
    const swPath = `${baseUrl}sw.js`;
    navigator.serviceWorker.register(swPath)
      .then((reg) => {
        console.log('StudyDash Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.error('StudyDash Service Worker registration failed:', err);
      });
  });
}
