import { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const WorkContext = createContext();

export const WorkProvider = ({ children }) => {
    const [works, setWorks] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWorks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/works`, { timeout: 10000 });
            setWorks(res.data);
        } catch (err) {
            console.warn('[WorkContext] Failed to fetch works:', err.code || err.message);
            // Don't crash — just leave works empty
        }
        setLoading(false);
    };

    const createWork = async (inputData) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        try {
            let data = inputData;
            if (!(inputData instanceof FormData)) {
                data = new FormData();
                Object.keys(inputData).forEach(key => data.append(key, inputData[key]));
            }

            const res = await axios.post(`${API_BASE_URL}/api/works`, data, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
                timeout: 30000,
            });
            setWorks(prev => [...prev, res.data.work]);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Erro ao criar obra' };
        }
    };

    const updateWork = async (id, inputData) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        try {
            let data = inputData;
            if (!(inputData instanceof FormData)) {
                data = new FormData();
                Object.keys(inputData).forEach(key => data.append(key, inputData[key]));
            }

            const res = await axios.put(`${API_BASE_URL}/api/works/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
                timeout: 15000,
            });
            setWorks(prev => prev.map(w => w.id === id ? res.data.work : w));
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Erro ao atualizar' };
        }
    };

    const deleteWork = async (id) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        try {
            await axios.delete(`${API_BASE_URL}/api/works/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
            });
            setWorks(prev => prev.filter(w => w.id !== id));
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Erro ao deletar' };
        }
    };

    const createChapter = async (workId, formData) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/works/${workId}/chapters`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
                timeout: 60000,
            });
            return { success: true, chapter: res.data.chapter };
        } catch (err) {
            return { success: false, error: err.response?.data?.error || 'Erro ao criar capítulo' };
        }
    };

    const deleteChapter = async (id) => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        try {
            await axios.delete(`${API_BASE_URL}/api/works/chapters/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
            });
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Erro ao deletar' };
        }
    };

    const toggleFavorite = async (workId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/users/favorites`, { workId }, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 8000,
            });
            if (res.data.action === 'added') {
                const work = works.find(w => w.id === workId);
                if (work) setFavorites(prev => [...prev, work]);
            } else {
                setFavorites(prev => prev.filter(f => f.id !== workId));
            }
        } catch (err) {
            console.warn('[WorkContext] Toggle favorite failed:', err.code || err.message);
        }
    };

    const { socket } = useSocket() || {};

    useEffect(() => {
        if (socket) {
            socket.on('works_updated', () => {
                console.log('[Socket] Works modified, refetching...');
                fetchWorks();
            });
            return () => socket.off('works_updated');
        }
    }, [socket]);

    useEffect(() => {
        fetchWorks();
    }, []);

    return (
        <WorkContext.Provider value={{
            works, mangas: works, favorites, loading, fetchWorks, fetchMangas: fetchWorks,
            createWork, createManga: createWork, updateWork, updateManga: updateWork,
            deleteWork, deleteManga: deleteWork, createChapter, deleteChapter, toggleFavorite
        }}>
            {children}
        </WorkContext.Provider>
    );
};

export const useWork = () => useContext(WorkContext);
export const useManga = useWork;
export const MangaProvider = WorkProvider;
export const MangaContext = WorkContext;
