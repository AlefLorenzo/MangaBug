import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const UserAuthContext = createContext();

// Dedicated axios instance for auth — isolated from any global interceptors
const authApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 8000,
});

export const UserAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket() || {};

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await authApi.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
        } catch (err) {
            console.warn('[Auth] Session check failed:', err.code || err.message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (socket && user) {
            socket.on('user_updated', (data) => {
                // If it's a global update or specifically for this user
                if (!data.userId || data.userId === user.id) {
                    console.log('[Socket] User info modified, refetching...');
                    checkAuth();
                }
            });
            return () => socket.off('user_updated');
        }
    }, [socket, user, checkAuth]);

    const login = async (email, password) => {
        try {
            const res = await authApi.post('/api/auth/login', { email, password });
            if (res.data.success && res.data.token) {
                localStorage.setItem('token', res.data.token);
                setUser(res.data.user);
                return { success: true };
            }
            return { success: false, error: res.data.message || 'Login falhou' };
        } catch (err) {
            if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
                return { success: false, error: 'Servidor offline. Verifique se o backend está rodando.' };
            }
            return { success: false, error: err.response?.data?.message || 'Erro de conexão com o servidor' };
        }
    };

    const register = async (userData) => {
        try {
            const res = await authApi.post('/api/auth/register', userData);
            if (!res.data.success) {
                return { success: false, error: res.data.message || 'Erro no registro' };
            }
            const loginResult = await login(userData.email, userData.password);
            if (loginResult.success) return { success: true };
            return { success: true, message: 'Conta criada! Faça login para continuar.' };
        } catch (err) {
            if (err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED') {
                return { success: false, error: 'Servidor offline. Verifique se o backend está rodando.' };
            }
            return { success: false, error: err.response?.data?.message || 'Erro no registro' };
        }
    };

    const updateUser = async (data) => {
        const token = localStorage.getItem('token');
        if (!token) return { success: false, error: 'Não autenticado' };
        try {
            const res = await authApi.put('/api/users/info', data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success && res.data.user) {
                setUser(prev => ({ ...prev, ...res.data.user }));
                return { success: true };
            }
            return { success: false, error: res.data.message || 'Erro ao atualizar' };
        } catch (err) {
            return { success: false, error: err.response?.data?.message || 'Erro ao atualizar perfil' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <UserAuthContext.Provider value={{ user, setUser, login, register, updateUser, logout, loading, checkAuth }}>
            {children}
        </UserAuthContext.Provider>
    );
};

export const useUser = () => useContext(UserAuthContext);
