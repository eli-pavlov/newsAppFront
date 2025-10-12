import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * We initialize with null, and the hook will throw a helpful error if
 * it's used outside the provider. If you'd prefer a silent fallback,
 * replace `createContext(null)` with a default object.
 */
const DeviceResolutionContext = createContext(null);

export function DeviceResolutionProvider({ children }) {
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    // Guard for SSR / non-window environments
    if (typeof window === 'undefined') return;

    const classify = () => {
      const width = window.innerWidth;
      const next =
        width < 768 ? 'mobile' :
        width < 1024 ? 'tablet' :
        'desktop';
      setDeviceType(next);
    };

    classify();
    window.addEventListener('resize', classify);
    return () => window.removeEventListener('resize', classify);
  }, []);

  const value = useMemo(() => ({ deviceType, setDeviceType }), [deviceType]);

  return (
    <DeviceResolutionContext.Provider value={value}>
      {children}
    </DeviceResolutionContext.Provider>
  );
}

/**
 * Safer hook: gives a clear, actionable error if provider is missing.
 */
export function useDeviceResolution() {
  const ctx = useContext(DeviceResolutionContext);
  if (!ctx) {
    throw new Error('useDeviceResolution must be used within <DeviceResolutionProvider>');
  }
  return ctx;
}
