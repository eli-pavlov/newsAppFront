import '../Home.css'
import { useDeviceResolution } from '../../../contexts/DeviceResolution';
import { useSettingsContext } from '../../../contexts/SettingsContext';
import { useLocation } from 'wouter'
import { useAuth } from '../../../contexts/AuthContext'
import { deleteCookie, AUTH_COOKIE_NAME } from '../../../utils/cookies';

function Header() {
    const {settings } = useSettingsContext();
    const { deviceType } = useDeviceResolution();
    const [_, navigate ] = useLocation();
    const { setUser } = useAuth();
    
    function logout() {
        setUser(null);
        deleteCookie(AUTH_COOKIE_NAME)
        navigate('/login')
    }

    return (
        <div className={`header ${deviceType}`}>
            <div className={`admin-icon ${deviceType}`} onClick={() => navigate('/admin')}>
                <i className="fa fa-gear"></i>
            </div>
            <div className={`logout-icon ${deviceType}`} onClick={ logout }>
                <i className="fa fa-sign-out"></i>
            </div>
            <div>
                {settings.title}
            </div>
        </div>
    )
}

export default Header;
