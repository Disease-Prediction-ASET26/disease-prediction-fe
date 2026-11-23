import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@radix-ui/themes/tokens.css';
import '@radix-ui/themes/components.css';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
