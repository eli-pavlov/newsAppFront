// newsAppFront/src/pages/admin/Admin.jsx
import './Admin.css';
import { useLocation } from 'wouter';
import { useDeviceResolution } from '../../contexts/DeviceResolution';
import At from '../../api/db'; // Fixed: Default import (was { db })
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import Users from './components/Users';
import Settings from './components/Settings';

function Admin() {
    const [location, setLocation] = useLocation();
    const { deviceType } = useDeviceResolution();
    const { setSettings } = useSettingsContext();
    const { user, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState('settings');
    const [users, setUsers] = useState([]);

    async function loadUsers() {
        const result = await At.getAllUsers();
        if (result.success) {
            setUsers(result.data);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    const handleLogout = () => {
        setUser(null);
        setLocation('/login');
    };

    const handleSettings = async (user) => {
        const settingsResult = await At.getSettings(user);
        if (settingsResult.success) {
            setSettings(settingsResult.data);
            setActiveTab('settings');
        }
    };

    return (
        <div className="admin-container">
            <div className="header">
                <div className="icon logout" onClick={handleLogout}>
                    <i className="fa fa-sign-out"></i>
                </div>
                <div className="icon close" onClick={() => setLocation('/home')}>
                    X
                </div>
            </div>
            <div className="tabs">
                <div
                    className={`tab ${activeTab === 'settings' ? 'selected' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </div>
                {user.role.toLowerCase() === 'admin' && (
                    <div
                        className={`tab ${activeTab === 'users' ? 'selected' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Users
                    </div>
                )}
            </div>
            <div className="tab-area">
                {activeTab === 'settings' && <Settings cancelFunc={() => setLocation('/home')} user={user} />}
                {activeTab === 'users' && (
                    <Users users={users} setUsers={setUsers} setActiveTab={setActiveTab} />
                )}
            </div>
        </div>
    );
}

export default Admin;