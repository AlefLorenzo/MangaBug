import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const AdminAuthContext = createContext();

// Dedicated axios instance for admin auth — isolated
const adminApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 8000,
});

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('adminToken'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAdmin = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await adminApi.get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.is_admin) {
                    setAdmin(res.data);
                } else {
                    // Token is valid but user isn't admin — clear admin session
                    doLogout();
                }
            } catch (err) {
                console.warn('[AdminAuth] Session check failed:', err.code || err.message);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    doLogout();
                }
                // If server is offline, keep token for retry
            }
            setLoading(false);
        };
        verifyAdmin();
    }, [token]);

    const doLogout = () => {
        setAdmin(null);
        setToken(null);
        localStorage.removeItem('adminToken');
    };

    const login = async (email, password) => {
        try {
            // Use the dedicated admin-login endpoint (JWT_SECRET_ADMIN)
            const res = await adminApi.post('/api/auth/admin-login', { email, password });

            if (res.data.success && res.data.user?.is_admin) {
                const { user, token: newToken } = res.data;
                setAdmin(user);
                setToken(newToken);
                localStorage.setItem('adminToken', newToken);
                return { success: true };
            }
            return { success: false, error: 'Acesso negado. Apenas administradores.' };
        } catch (err) {
            if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
                return { success: false, error: 'Servidor offline. Verifique se o backend está rodando.' };
            }
            return { success: false, error: err.response?.data?.message || 'Erro no login admin' };
        }
    };

    return (
        <AdminAuthContext.Provider value={{ admin, token, loading, login, logout: doLogout }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdmin = () => useContext(AdminAuthContext);
