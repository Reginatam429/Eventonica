import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    login as loginApi,
    register as registerApi,
    getMe,
} from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On first load, try to restore the current user from the token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
        setLoading(false);
        return;
    }

    (async () => {
        try {
            const me = await getMe();
            setUser(me.user);
            } catch {
            // token invalid/expired
            localStorage.removeItem('token');
            } finally {
            setLoading(false);
            }
        })();
    }, []);

    async function register(form) {
        const data = await registerApi(form);
        localStorage.setItem('token', data.token);
        setUser(data.user);
    }

    async function login(email, password) {
        const data = await loginApi(email, password);
        localStorage.setItem('token', data.token);
        setUser(data.user);
    }

    function logout() {
        localStorage.removeItem('token');
        setUser(null);
        }
    
        const value = { user, loading, login, register, logout };
        return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
