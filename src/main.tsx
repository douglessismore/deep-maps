import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Route, Switch } from 'wouter'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './lib/data/provider'
import { UIVariantProvider } from './lib/uiVariant'
import { AuthProvider } from './components/auth/AuthProvider'

// Theme: light by default, ?theme=dark to switch, persisted in localStorage
const themeParam = new URLSearchParams(window.location.search).get('theme');
if (themeParam === 'v2') {
  document.documentElement.dataset.theme = 'v2';
} else if (themeParam === 'dark') {
  document.documentElement.dataset.theme = 'dark';
  localStorage.setItem('dm-theme', 'dark');
} else if (themeParam === 'light') {
  document.documentElement.dataset.theme = 'light';
  localStorage.setItem('dm-theme', 'light');
} else {
  // No URL param — use stored preference, default to light
  const stored = localStorage.getItem('dm-theme');
  document.documentElement.dataset.theme = stored === 'dark' ? 'dark' : 'light';
}

const AdminApp = lazy(() => import('./admin/AdminApp'));
const RapidVerify = lazy(() => import('./components/RapidVerify'));
const AudioUnlocked = lazy(() => import('./pages/AudioUnlocked'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIVariantProvider>
      <AuthProvider>
      <DataProvider>
        <Suspense fallback={<div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] gap-3"><div className="flex items-center gap-2"><span className="text-2xl">📍</span><h1 className="text-2xl font-bold tracking-tight"><span className="text-[#e74c3c]">Deep</span><span className="text-[var(--text-primary)]">Maps</span></h1></div><p className="text-xs font-mono text-[var(--text-muted)] tracking-widest uppercase">Loading...</p></div>}>
          <Switch>
            <Route path="/verify" component={RapidVerify} />
            <Route path="/audio-unlocked" component={AudioUnlocked} />
            <Route path="/admin" nest component={AdminApp} />
            {/* Deep link routes — App reads :id and activates the item after data loads */}
            <Route path="/c/:id" component={App} />
            <Route path="/s/:id" component={App} />
            <Route path="/e/:id" component={App} />
            <Route component={App} />
          </Switch>
        </Suspense>
      </DataProvider>
      </AuthProvider>
    </UIVariantProvider>
  </StrictMode>,
)
