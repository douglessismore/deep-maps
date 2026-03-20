import { createContext, useContext, useState, type ReactNode } from 'react';

export type UIVariant = 'current' | 'spotlight' | 'split' | 'claude' | 'cinema';

const UIVariantContext = createContext<{
  variant: UIVariant;
  setVariant: (v: UIVariant) => void;
}>({ variant: 'current', setVariant: () => {} });

export function UIVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<UIVariant>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('deep-maps-ui-variant') as UIVariant) || 'split';
    }
    return 'current';
  });

  const set = (v: UIVariant) => {
    setVariant(v);
    localStorage.setItem('deep-maps-ui-variant', v);
  };

  return (
    <UIVariantContext.Provider value={{ variant, setVariant: set }}>
      {children}
    </UIVariantContext.Provider>
  );
}

export function useUIVariant() {
  return useContext(UIVariantContext);
}
