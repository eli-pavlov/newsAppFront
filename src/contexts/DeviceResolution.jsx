import { createContext, useState, useEffect, useContext } from "react";
import { useMediaQuery } from 'react-responsive';

export const DeviceResolution = createContext(null);

export function DeviceResolutionProvider({ children }) {
    const isMobile = useMediaQuery({ maxWidth:600 });
    const isTablet = useMediaQuery({ minWidth:601, maxWidth:1024});
    const isDesktop = useMediaQuery({ minWidth:1025 });

    const [resolutions, setResolutions] = useState({isDesktop, isTablet, isMobile});

    useEffect(() => {
        setResolutions({isDesktop, isTablet, isMobile, deviceType:(isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop')});
    }, [isDesktop, isTablet, isMobile]);

    return (
        <DeviceResolution.Provider value={resolutions} >
            {children}
        </DeviceResolution.Provider>
    )
}

export const useDeviceResolution = () => useContext(DeviceResolution);
