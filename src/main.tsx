import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Route, Switch } from 'wouter'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './lib/data/provider'
import { UIVariantProvider } from './lib/uiVariant'

// Apply V2 design theme if ?theme=v2 is in the URL
const themeParam = new URLSearchParams(window.location.search).get('theme');
if (themeParam === 'v2') {
  document.documentElement.dataset.theme = 'v2';
}

const AdminApp = lazy(() => import('./admin/AdminApp'));
const RapidVerify = lazy(() => import('./components/RapidVerify'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIVariantProvider>
      <DataProvider>
        <Suspense fallback={<div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0a] gap-3"><div className="flex items-center gap-2"><span className="text-2xl">📍</span><h1 className="text-2xl font-bold tracking-tight"><span className="text-[#e74c3c]">Deep</span><span className="text-white">Maps</span></h1></div><p className="text-xs font-mono text-gray-500 tracking-widest uppercase">Loading...</p></div>}>
          <Switch>
            <Route path="/verify" component={RapidVerify} />
            <Route path="/admin" nest component={AdminApp} />
            {/* Deep link routes — App reads :id and activates the item after data loads */}
            <Route path="/c/:id" component={App} />
            <Route path="/s/:id" component={App} />
            <Route path="/e/:id" component={App} />
            <Route component={App} />
          </Switch>
        </Suspense>
      </DataProvider>
    </UIVariantProvider>
  </StrictMode>,
)
