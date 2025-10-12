// newsAppFront/src/pages/admin/components/Users.jsx
import '../Admin.css'
import Section from './Section';
import At from '../../../api/db'; // Fixed: Default import (was { db })
import ConfirmModal from '../../../components/ConfirmModal'
import { useSettingsContext } from '../../../contexts/SettingsContext';

function Users({ users, setUsers, setActiveTab }) {
    const { setSettings } = useSettingsContext();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Editor' });
    const [error, setError] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({});

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await At.addUser(formData);
            if (result.success) {
                setUsers([...users, { ...formData, id: Date.now() }]);
                setFormData({ name: '', email: '', password: '', role: 'Editor' });
                setError('');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = (user) => {
        setConfirmData({
            msg: `Delete user ${user.name}?`,
            yesHandler: async () => {
                try {
                    const result = await At.deleteUser(user.email);
                    if (result.success) {
                        setUsers(users.filter(u => u.email !== user.email));
                    } else {
                        setError(result.message);
                    }
                } catch (err) {
                    setError(err.message);
                }
                setConfirmOpen(false);
            }
        });
        setConfirmOpen(true);
    };

    const handleSettings = async (user) => {
        const settingsResult = await At.getSettings(user);
        if (settingsResult.success) {
            setSettings(settingsResult.data);
            setActiveTab('settings');
        } else {
            setError(settingsResult.message);
        }
    };

    return (
        <div className="users-page">
            <Section title="Add User">
                <form className="add-user" onSubmit={handleSubmit}>
                    <div className="add-user-detailes">
                        <input
                            name="name"
                            value={formData.name}
                            className="element"
                            type="text"
                            placeholder="Name"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            name="email"
                            value={formData.email}
                            className="element"
                            type="email"
                            placeholder="Email"
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            name="password"
                            value={formData.password}
                            className="element"
                            type="text"
                            placeholder="Password"
                            onChange={handleInputChange}
                            required
                        />
                        <select
                            name="role"
                            value={formData.role}
                            className="element"
                            onChange={handleInputChange}
                            required
                        >
                            <option value="" disabled>Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Editor">Editor</option>
                        </select>
                    </div>
                    <button type="submit" className="element">Save</button>
                </form>
                {error && <div className="add-user-msg error">{error}</div>}
            </Section>

            <Section title="Users List">
                <div className="users-table">
                    <table>
                        <thead>
                            <tr>
                                <th width="30%">Name</th>
                                <th width="50%">Email</th>
                                <th width="10%">Role</th>
                                <th width="10%">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={index}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <div className="actions">
                                            <div className="font-icon" onClick={() => handleSettings(user)}>
                                                <i className="fa fa-gear"></i>
                                            </div>
                                            <div className={`font-icon ${user.protected ? 'disabled' : ''}`} onClick={() => !user.protected && handleDelete(user)}>
                                                <i className="fa fa-trash"></i>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {confirmOpen && (
                <ConfirmModal
                    titleData={{ text: confirmData.msg, style: { fontSize: '24px' } }}
                    yesData={{
                        text: 'Yes',
                        style: { backgroundColor: 'red', border: 'none', padding: '16px', fontWeight: 'bold' },
                        noHover: true,
                        actionHandler: confirmData.yesHandler
                    }}
                    noData={{
                        text: 'No',
                        style: { backgroundColor: 'white', color: 'black', padding: '16px', border: 'none' }
                    }}
                    closeHandler={() => setConfirmOpen(false)}
                />
            )}
        </div>
    );
}

export default Users;