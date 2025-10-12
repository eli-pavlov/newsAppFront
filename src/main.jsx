import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { DeviceResolutionProvider } from './contexts/DeviceResolution.jsx';

const rootEl = document.getElementById('root');

createRoot(rootEl).render(
  <React.StrictMode>
    <DeviceResolutionProvider>
      <App />
    </DeviceResolutionProvider>
  </React.StrictMode>
);
