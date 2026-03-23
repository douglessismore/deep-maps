import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Route, Switch } from 'wouter'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './lib/data/provider'
import { UIVariantProvider } from './lib/uiVariant'

const AdminApp = lazy(() => import('./admin/AdminApp'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIVariantProvider>
      <DataProvider>
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-400">Loading...</div>}>
          <Switch>
            <Route path="/admin" nest component={AdminApp} />
            <Route component={App} />
          </Switch>
        </Suspense>
      </DataProvider>
    </UIVariantProvider>
  </StrictMode>,
)
