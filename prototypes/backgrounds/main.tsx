// Prototype harness: the real app with each background behind it. Nothing in src/ imports this.
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../../src/styles/theme.css';
import '../../src/styles/app.css';
import '../../src/styles/previews.css';
import './backgrounds.css';
import './picker.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Harness } from './Harness';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
