import { createContext, useContext } from 'react';
import { useMediaQuery } from 'react-responsive';

const DeviceContext = createContext(null);

export const DeviceResolution = ({ children }) => {
    const isDesktop = useMediaQuery({ minWidth: 1025 });
    const isTablet = useMediaQuery({ minWidth: 601, maxWidth: 1024 });
    const isMobile = useMediaQuery({ maxWidth: 600 });
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    const value = {
        isDesktop,
        isTablet,
        isMobile,
        deviceType
    };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDeviceContext = () => useContext(DeviceContext);