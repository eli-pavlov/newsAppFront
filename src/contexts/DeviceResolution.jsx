import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Context holds responsive info for the app (deviceType).
 * We start with null to detect incorrect usage (outside provider).
 */
const DeviceResolutionContext = createContext(null);

export function DeviceResolutionProvider({ children }) {
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
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
 * Named export expected by App.jsx:
 * Allows usage like: <DeviceResolution>...</DeviceResolution>
 */
export function DeviceResolution({ children }) {
  return <DeviceResolutionProvider>{children}</DeviceResolutionProvider>;
}

/**
 * Hook to consume the context safely.
 */
export function useDeviceResolution() {
  const ctx = useContext(DeviceResolutionContext);
  if (!ctx) {
    throw new Error('useDeviceResolution must be used within <DeviceResolution> (DeviceResolutionProvider).');
  }
  return ctx;
}
