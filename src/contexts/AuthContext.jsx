import { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'wouter';
import At from '../api/db'; // Corrected import
import { setCookie, removeCookie } from '../utils/cookies';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [, setLocation] = useLocation();

    useEffect(() => {
        const verifyUser = async () => {
            setIsLoading(true);
            const response = await At.verify();
            if (response.success) {
                setUser(response.user);
            } else {
                setUser(null);
                removeCookie('authuser');
            }
            setIsLoading(false);
        };
        verifyUser();
    }, []);

    const login = async (email, password) => {
        const response = await At.login(email, password);
        if (response.success) {
            setUser(response.data);
            setCookie('authuser', response.tokens.auth_token);
            setLocation('/home');
        }
        return response;
    };

    const logout = () => {
        setUser(null);
        removeCookie('authuser');
        setLocation('/login');
    };

    const isUserRole = (role) => {
        return user ? user.role.toLowerCase() === role.toLowerCase() : false;
    };

    const value = { user, setUser, isLoading, login, logout, isUserRole };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);