import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import './styles.css';

const el = document.getElementById('root')!;
const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
if (el.firstElementChild) hydrateRoot(el, app, { onRecoverableError: (e) => console.error('hydration', e) });
else createRoot(el).render(app);
