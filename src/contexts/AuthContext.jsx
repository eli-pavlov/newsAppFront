// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const isUserRole = (role) => {
        if (!user || !user.role) {
            return false;
        }
        return user.role.toLowerCase() === role.toLowerCase();
    };

    const value = { user, setUser, isUserRole };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This is the missing piece that fixes the error
export const useAuth = () => {
    return useContext(AuthContext);
};