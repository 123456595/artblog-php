import '@fontsource-variable/archivo';
import '@fontsource-variable/ibm-plex-sans';
import '@fontsource/ibm-plex-mono';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/article.css';
import '../styles/admin.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
