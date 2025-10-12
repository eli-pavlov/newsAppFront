import { useContext, useState, createContext } from "react";

export const AuthContext = createContext(null);

export function AuthContextProvider({ children }) {
    const [user, setUser] = useState(null);

    function isUserRole(role) {
        if (!user)
            return false;

        return user.role.toLowerCase() === role.toLowerCase();
    }

    return <AuthContext.Provider value={{ user, setUser, isUserRole }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
