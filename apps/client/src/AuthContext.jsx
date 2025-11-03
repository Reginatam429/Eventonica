import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginRequest } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // { id, email, roles }
    const [token, setToken] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('auth');
        if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setUser(parsed.user);
            setToken(parsed.token);
        } catch {
            // ignore
        }
        }
    }, []);

    function saveAuth(user, token) {
        setUser(user);
        setToken(token);
        localStorage.setItem('auth', JSON.stringify({ user, token }));
        localStorage.setItem('token', token);
    }

    function logout() {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
    }

    async function login(email, password) {
        const data = await loginRequest(email, password);
        saveAuth(data.user, data.token);
        return data.user;
    }

    const value = {
        user,
        token,
        login,
        logout,
        isLoggedIn: !!token,
        hasRole(role) {
        return user?.roles?.includes(role) ?? false;
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
