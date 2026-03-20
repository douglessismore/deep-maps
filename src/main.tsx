import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DataProvider } from './lib/data/provider'
import { UIVariantProvider } from './lib/uiVariant'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIVariantProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </UIVariantProvider>
  </StrictMode>,
)
