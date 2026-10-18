import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { canonicalPath } from './routes';
import './styles.css';

// GitHub Pages serves the same file for /about/, /about/index.html and /about//: show the canonical URL
// before hydrating, so the router renders the page that was prerendered into this file.
const canonical = canonicalPath(window.location.pathname);
if (canonical !== window.location.pathname) {
  window.history.replaceState(window.history.state, '', canonical + window.location.search + window.location.hash);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Production pages are prerendered (hydrate them); the dev server serves an empty #root.
if (rootElement.firstElementChild) hydrateRoot(rootElement, app);
else createRoot(rootElement).render(app);
