// newsAppFront/src/pages/login/Login.jsx
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import { useSettingsContext } from '../../contexts/SettingsContext';
import At from '../../api/db'; // Fixed: Changed to default import (was { db })
import { createCookie, AUTH_COOKIE_NAME } from '../../utils/cookies';
import { getSettingsFromDB } from '../../utils/settings';

function Login() {
    const [location, navigate] = useLocation();
    const { setUser } = useAuth();
    const { setSettings } = useSettingsContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]); // Assuming this is populated elsewhere or from props
    const [selectedUser, setSelectedUser] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            let result;
            if (selectedUser) {
                result = await At.login(selectedUser.email, selectedUser.password); // Fixed: Use At
            } else {
                result = await At.login(email, password); // Fixed: Use At
            }

            if (result.success) {
                setUser(result.data);
                createCookie(AUTH_COOKIE_NAME, result.tokens.auth_token);
                
                // Load settings
                const settingsResult = await getSettingsFromDB(result.data);
                if (settingsResult.success) {
                    setSettings(settingsResult.data);
                }

                navigate('/admin');
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError(err.message || 'Connection error');
        }
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setEmail('');
        setPassword('');
    };

    return (
        <div className="container">
            <form onSubmit={handleSubmit} className="login">
                <div className="element">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                            setSelectedUser(null);
                        }}
                        required={!selectedUser}
                    />
                </div>
                <div className="element">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                            setSelectedUser(null);
                        }}
                        required={!selectedUser}
                    />
                </div>
                <div className="element">
                    <label htmlFor="users">Select user</label>
                    <select
                        value={selectedUser ? selectedUser.name : ''}
                        onChange={(e) => {
                            const user = users.find(u => u.name === e.target.value);
                            handleUserSelect(user);
                        }}
                    >
                        <option value="">Empty</option>
                        {users.map((user, index) => (
                            <option key={index} value={user.name}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit">Login</button>
                <div className="errorMsg">{error}</div>
            </form>
        </div>
    );
}

export default Login;