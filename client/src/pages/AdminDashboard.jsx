import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart2, BookOpen, Users, Plus, Search, Edit2, Trash2,
    CheckCircle, AlertTriangle, TrendingUp, Clock, Globe,
    ChevronDown, X, Upload, Sparkles, Loader2, Camera, UserPlus
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { useWork } from '../context/WorkContext';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

import { API_BASE_URL } from '../api/config';


const statsData = [
    { name: 'Seg', views: 4000 },
    { name: 'Ter', views: 3000 },
    { name: 'Qua', views: 2000 },
    { name: 'Qui', views: 2780 },
    { name: 'Sex', views: 1890 },
    { name: 'Sáb', views: 2390 },
    { name: 'Dom', views: 3490 },
];

const AdminDashboard = () => {
    const { mangas, fetchMangas, createManga, updateManga, deleteManga } = useWork();
    const { socket } = useSocket();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    // Sync tab with URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['overview', 'library', 'publish', 'banners', 'users'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location.search]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingManga, setEditingManga] = useState(null);
    const [systemLogs, setSystemLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [banners, setBanners] = useState([]);
    const [notification, setNotification] = useState(null);
    const [stats, setStats] = useState({ works: 0, users: 0, views: 0, active_today: 0, chartData: [] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);

    // Chapter Management State
    const [selectedMangaForChapters, setSelectedMangaForChapters] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState(null);
    const [chapterFormData, setChapterFormData] = useState({
        chapter_number: '',
        title: '',
        content: '',
        pages: []
    });

    // Banner Logic State
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [bannerFormData, setBannerFormData] = useState({
        title: '',
        subtitle: '',
        work_id: '',
        banner: null,
        buttons: []
    });

    // Publish Workflow State
    const [publishData, setPublishData] = useState({ title: '', type: 'Mangá', status: 'Em andamento', description: '', author: '', artist: '', rating: 4.5, tags: '' });
    const [publishCover, setPublishCover] = useState(null);
    const [publishCoverPreview, setPublishCoverPreview] = useState(null);
    const [publishChapterPages, setPublishChapterPages] = useState([]);
    const [publishChapterPreviews, setPublishChapterPreviews] = useState([]);

    const [userFilter, setUserFilter] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        type: 'Mangá',
        status: 'Em andamento',
        description: '',
        cover_url: '',
        author: '',
        artist: '',
        rating: 4.5,
        tags: ''
    });

    const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['overview', 'library', 'publish', 'banners', 'users'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location]);

    useEffect(() => {
        if (!socket) return;

        socket.on('work_view', () => {
            fetchDashboardData();
        });

        socket.on('works_updated', (data) => {
            if (data?.action === 'create') {
                showNotification(`Nova obra publicada: ${data.title || ''}`, 'info');
            }
            fetchDashboardData();
            fetchMangas();
        });

        socket.on('banners_updated', () => {
            showNotification('Banners atualizados.', 'info');
            fetchDashboardData();
        });

        socket.on('user_updated', () => {
            fetchDashboardData();
        });

        return () => {
            socket.off('work_view');
            socket.off('works_updated');
            socket.off('banners_updated');
            socket.off('user_updated');
        };
    }, [socket]);

    useEffect(() => {
        if (selectedMangaForChapters) {
            fetchChapters(selectedMangaForChapters.id);
        }
    }, [selectedMangaForChapters]);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, logsRes, usersRes, bannersRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${adminToken}` } }),
                axios.get(`${API_BASE_URL}/api/admin/logs`, { headers: { Authorization: `Bearer ${adminToken}` } }),
                axios.get(`${API_BASE_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${adminToken}` } }),
                axios.get(`${API_BASE_URL}/api/admin/banners`, { headers: { Authorization: `Bearer ${adminToken}` } })
            ]);
            setStats(statsRes.data);
            setSystemLogs(logsRes.data);
            setUsers(usersRes.data);
            setBanners(bannersRes.data);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        }
    };

    const fetchChapters = async (mangaId) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/works/${mangaId}/chapters`);
            setChapters(res.data);
        } catch (err) {
            console.error('Erro ao carregar capítulos:', err);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const handleClearLogs = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/logs`, { headers: { Authorization: `Bearer ${adminToken}` } });
            setSystemLogs([]);
            showNotification('Histórico de logs limpo.');
        } catch (err) {
            showNotification('Erro ao limpar logs.', 'error');
        }
    };

    const openModal = (manga = null) => {
        if (manga) {
            setEditingManga(manga);
            const typeMap = { 'manga': 'Mangá', 'manhwa': 'Manhwa', 'manhua': 'Manhua' };
            const statusMap = { 'ongoing': 'Em andamento', 'completed': 'Completo' };

            setFormData({
                title: manga.title,
                type: typeMap[manga.type] || manga.type,
                status: statusMap[manga.status] || manga.status,
                description: manga.description,
                cover_url: manga.cover_url,
                author: manga.author,
                artist: manga.artist,
                rating: manga.rating,
                tags: manga.tags || ''
            });
        } else {
            setEditingManga(null);
            setFormData({ title: '', type: 'Mangá', status: 'Em andamento', description: '', cover_url: '', author: '', artist: '', rating: 4.5 });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (coverFile) data.append('cover', coverFile);

            if (editingManga) {
                await updateManga(editingManga.id, data);
                showNotification('Obra atualizada com sucesso!');
            } else {
                await createManga(data);
                showNotification('Nova obra criada!');
            }
            setIsModalOpen(false);
            setCoverFile(null);
            setCoverPreview(null);
            fetchMangas();
            fetchDashboardData();
        } catch (err) {
            showNotification('Erro ao processar solicitação.', 'error');
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta obra?')) {
            try {
                await deleteManga(id);
                showNotification('Obra excluída com sucesso.', 'info');
                fetchDashboardData();
            } catch (err) {
                showNotification('Erro ao excluir obra.', 'error');
            }
        }
    };

    const openChapterModal = (chapter = null) => {
        if (chapter) {
            setEditingChapter(chapter);
            setChapterFormData({
                chapter_number: chapter.chapter_number,
                title: chapter.title || '',
                content: chapter.content || '',
                pages: []
            });
        } else {
            setEditingChapter(null);
            setChapterFormData({
                chapter_number: chapters.length + 1,
                title: '',
                content: '',
                pages: []
            });
        }
        setIsChapterModalOpen(true);
    };

    const handleChapterSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formDataToSubmit = new FormData();
            formDataToSubmit.append('chapter_number', chapterFormData.chapter_number);
            formDataToSubmit.append('title', chapterFormData.title);
            formDataToSubmit.append('content', chapterFormData.content);
            if (chapterFormData.pages.length > 0) {
                Array.from(chapterFormData.pages).forEach(file => formDataToSubmit.append('pages', file));
            }

            if (editingChapter) {
                await axios.put(`${API_BASE_URL}/api/works/chapters/${editingChapter.id}`, formDataToSubmit, {
                    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${adminToken}` }
                });
                showNotification('Capítulo atualizado!');
            } else {
                await axios.post(`${API_BASE_URL}/api/works/${selectedMangaForChapters.id}/chapters`, formDataToSubmit, {
                    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${adminToken}` }
                });
                showNotification('Novo capítulo adicionado!');
            }
            setIsChapterModalOpen(false);
            fetchChapters(selectedMangaForChapters.id);
        } catch (err) {
            showNotification('Erro ao processar capítulo.', 'error');
        }
        setIsSubmitting(false);
    };

    const handleDeleteChapter = async (chapterId) => {
        if (window.confirm('Excluir este capítulo permanentemente?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/works/chapters/${chapterId}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                showNotification('Capítulo excluído.', 'info');
                fetchChapters(selectedMangaForChapters.id);
            } catch (err) {
                showNotification('Erro ao excluir capítulo.', 'error');
            }
        }
    };

    const handleAddBanner = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', bannerFormData.title);
            data.append('subtitle', bannerFormData.subtitle);
            data.append('work_id', bannerFormData.work_id);
            data.append('banner', bannerFormData.banner);
            data.append('buttons', JSON.stringify(bannerFormData.buttons));

            await axios.post(`${API_BASE_URL}/api/admin/banners`, data, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${adminToken}` }
            });
            showNotification('Banner criado com sucesso!');
            setIsBannerModalOpen(false);
            fetchDashboardData();
        } catch (err) {
            showNotification('Erro ao criar banner.', 'error');
        }
        setIsSubmitting(false);
    };

    const handleDeleteBanner = async (id) => {
        if (window.confirm('Excluir este banner?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/admin/banners/${id}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                showNotification('Banner removido.');
                fetchDashboardData();
            } catch (err) {
                showNotification('Erro ao excluir banner.', 'error');
            }
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Deseja excluir este usuário?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                showNotification('Usuário removido da plataforma.');
                fetchDashboardData();
            } catch (err) {
                showNotification('Erro ao excluir usuário.', 'error');
            }
        }
    };

    const filteredMangas = mangas.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="admin-container">
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`notification-toast ${notification.type}`}
                    >
                        {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span>{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="admin-header">
                <div className="admin-header-titles">
                    <h1>MANGABUG CONTROL CENTER</h1>
                    <p>Gerenciamento avançado de ecossistema e conteúdo em tempo real.</p>
                </div>

                <div className="admin-quick-access">
                    <button className="btn-manage-obras-direct" onClick={() => setActiveTab('library')}>
                        <BookOpen size={20} /> 📚 GERENCIAR OBRAS
                    </button>
                </div>

                <div className="admin-nav-tabs">
                    <Tab active={activeTab === 'overview'} label="Overview" icon={<BarChart2 size={18} />} onClick={() => setActiveTab('overview')} />
                    <Tab active={activeTab === 'library'} label="Biblioteca" icon={<BookOpen size={18} />} onClick={() => setActiveTab('library')} />
                    <Tab active={activeTab === 'publish'} label="Publicar" icon={<Plus size={18} />} onClick={() => setActiveTab('publish')} />
                    <Tab active={activeTab === 'banners'} label="Destaques" icon={<Sparkles size={18} />} onClick={() => setActiveTab('banners')} />
                    <Tab active={activeTab === 'users'} label="Usuários" icon={<Users size={18} />} onClick={() => setActiveTab('users')} />
                </div>
            </header>

            <div className="admin-stats-row">
                <StatBox label="Obras Ativas" value={stats.works} trend="+12% este mês" icon={<BookOpen size={24} />} accent="#8b5cf6" />
                <StatBox label="Membros Totais" value={stats.users} trend="+5.2k novos" icon={<Users size={24} />} accent="#3b82f6" />
                <StatBox label="Views Acumuladas" value={stats.views.toLocaleString()} trend="+1.2M hoje" icon={<TrendingUp size={24} />} accent="#10b981" />
                <StatBox label="Eventos (24h)" value={stats.active_today} trend="Estável" icon={<Clock size={24} />} accent="#f59e0b" />
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div key="overview-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="admin-main-grid">
                        <div className="admin-card quick-actions-card-premium" style={{ gridColumn: 'span 2' }}>
                            <div className="card-header">
                                <h3>Ações Rápidas</h3>
                                <span>Acesso imediato ao gerenciamento</span>
                            </div>
                            <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
                                <div className="q-action-card" onClick={() => setActiveTab('publish')} style={{ padding: '20px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: '0.3s' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}><Plus size={24} /></div>
                                    <span style={{ display: 'block', fontWeight: 800, fontSize: '15px' }}>Publicar Nova Obra</span>
                                    <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>Adicionar mangá ou manhwa ao sistema</p>
                                </div>
                                <div className="q-action-card" onClick={() => setActiveTab('library')} style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: '0.3s' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}><BookOpen size={24} /></div>
                                    <span style={{ display: 'block', fontWeight: 800, fontSize: '15px' }}>Gerenciar Capítulos</span>
                                    <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>Adicionar episódios a obras existentes</p>
                                </div>
                                <div className="q-action-card" onClick={() => setIsBannerModalOpen(true)} style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', transition: '0.3s' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}><Sparkles size={24} /></div>
                                    <span style={{ display: 'block', fontWeight: 800, fontSize: '15px' }}>Cadastrar Banner</span>
                                    <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>Configurar destaques na Home</p>
                                </div>
                            </div>
                        </div>

                        <div className="admin-card chart-card-premium">
                            <div className="card-header">
                                <h3>Performance de Leitura</h3>
                                <span>Últimos 7 dias (Real-time)</span>
                            </div>
                            <div style={{ height: '320px', marginTop: '20px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.chartData.length > 0 ? stats.chartData : statsData}>
                                        <defs>
                                            <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="rgba(255,255,255,0.3)" fontSize={12} tickMargin={10} />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={4} fill="url(#adminGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="admin-card logs-card-premium">
                            <div className="card-header">
                                <h3>System Logs</h3>
                                <button className="btn-log-clear" onClick={handleClearLogs}>Limpar Histórico</button>
                            </div>
                            <div className="log-list-premium">
                                {systemLogs.length > 0 ? systemLogs.slice(0, 5).map(log => (
                                    <LogEntry
                                        key={log.id}
                                        type={log.action.includes('error') ? 'error' : log.action.includes('create') ? 'success' : 'info'}
                                        title={log.action.replace('_', ' ').toUpperCase()}
                                        desc={log.details}
                                        time={new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        avatar={log.avatar_url}
                                    />
                                )) : (
                                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>Nenhum log recente.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'library' && (
                    <motion.div key="library-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="tab-header-premium" style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Biblioteca de Obras</h2>
                            <p style={{ color: 'var(--text-dim)' }}>Gerencie seu catálogo, adicione capítulos e atualize informações.</p>
                        </div>
                        <div className="admin-card library-card-premium" style={{ padding: 0 }}>
                            {!selectedMangaForChapters ? (
                                <>
                                    <div className="library-stats-summary" style={{ display: 'flex', gap: '30px', padding: '25px 30px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="lib-stat">
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)' }}>MANGÁS:</span>
                                            <strong style={{ display: 'block', fontSize: '18px' }}>{mangas.filter(m => m.type === 'Mangá').length}</strong>
                                        </div>
                                        <div className="lib-stat">
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)' }}>MANHWAS:</span>
                                            <strong style={{ display: 'block', fontSize: '18px' }}>{mangas.filter(m => m.type === 'Manhwa').length}</strong>
                                        </div>
                                        <div className="lib-stat total" style={{ color: 'var(--accent)' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 800 }}>TOTAL:</span>
                                            <strong style={{ display: 'block', fontSize: '18px' }}>{mangas.length}</strong>
                                        </div>
                                    </div>
                                    <div className="library-toolbar" style={{ padding: '25px 30px', display: 'flex', gap: '20px' }}>
                                        <div className="admin-search-premium" style={{ position: 'relative', flex: 1 }}>
                                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                            <input
                                                type="text"
                                                placeholder="Pesquisar por título..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 15px 12px 45px', color: 'white' }}
                                            />
                                        </div>
                                        <button className="btn-add-premium" onClick={() => setActiveTab('publish')} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0 25px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Plus size={18} /> CADASTRAR NOVA OBRA
                                        </button>
                                    </div>

                                    <div className="admin-table-premium" style={{ padding: '0 30px 30px' }}>
                                        <div className="table-row head" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 0.8fr 140px', padding: '15px 20px', fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <div>OBRA</div>
                                            <div>TIPO</div>
                                            <div>STATUS</div>
                                            <div>VIEWS</div>
                                            <div>AÇÕES</div>
                                        </div>

                                        {filteredMangas.length > 0 ? filteredMangas.map(manga => (
                                            <div key={manga.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 0.8fr 140px', alignItems: 'center', padding: '15px 20px', marginBottom: '8px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px' }}>
                                                <div className="col-info" onClick={() => setSelectedMangaForChapters(manga)} style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
                                                    <img src={manga.cover_url && manga.cover_url.startsWith('http') ? manga.cover_url : `${API_BASE_URL}${manga.cover_url?.startsWith('/') ? manga.cover_url : `/${manga.cover_url || manga.cover || ''}`}`} alt="" style={{ width: '40px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                                    <div>
                                                        <span style={{ display: 'block', fontWeight: 700, fontSize: '14px' }}>{manga.title}</span>
                                                        <span style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{manga.author || 'Autor desconhecido'}</span>
                                                    </div>
                                                </div>
                                                <div><span className="badge-type" style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                                    {manga.type === 'manga' ? 'Mangá' : manga.type.charAt(0).toUpperCase() + manga.type.slice(1)}
                                                </span></div>
                                                <div><span style={{ fontSize: '12px', color: (manga.status === 'completed' || manga.status === 'Completo') ? '#10b981' : '#f59e0b' }}>
                                                    {manga.status === 'completed' || manga.status === 'Completo' ? 'Completo' : 'Em andamento'}
                                                </span></div>
                                                <div><span style={{ fontWeight: 800 }}>{(manga.views / 1000).toFixed(1)}k</span></div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => openModal(manga)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'white', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDelete(manga.id)} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div style={{ textAlign: 'center', padding: '50px', color: 'rgba(255,255,255,0.2)' }}>Nenhuma obra encontrada.</div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="chapters-admin-view" style={{ padding: '30px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                        <button onClick={() => setSelectedMangaForChapters(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                            <X size={18} /> Voltar
                                        </button>
                                        <h3 style={{ margin: 0 }}>Capítulos de {selectedMangaForChapters.title}</h3>
                                        <button onClick={() => openChapterModal()} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>
                                            + ADICIONAR CAPÍTULO
                                        </button>
                                    </div>

                                    <div className="chapters-table-admin">
                                        <div className="table-row head" style={{ display: 'grid', gridTemplateColumns: '0.8fr 3fr 1fr 100px', padding: '15px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: 800 }}>
                                            <div>Nº</div>
                                            <div>TÍTULO</div>
                                            <div>PÁGINAS</div>
                                            <div>AÇÕES</div>
                                        </div>
                                        {chapters.map(chapter => (
                                            <div key={chapter.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '0.8fr 3fr 1fr 100px', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', marginBottom: '8px' }}>
                                                <div style={{ fontWeight: 900 }}>#{chapter.chapter_number}</div>
                                                <div>{chapter.title || `Capítulo ${chapter.chapter_number}`}</div>
                                                <div style={{ color: 'var(--text-dim)' }}>{JSON.parse(chapter.content || '[]').length} pgs</div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => openChapterModal(chapter)} style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDeleteChapter(chapter.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'publish' && (
                    <motion.div key="publish-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="tab-header-premium" style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Publicar Nova Obra</h2>
                        </div>
                        <div className="admin-card publish-card-premium">
                            <PublishView
                                publishData={publishData}
                                setPublishData={setPublishData}
                                publishCoverPreview={publishCoverPreview}
                                setPublishCover={(file) => {
                                    setPublishCover(file);
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setPublishCoverPreview(reader.result);
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                publishChapterPages={publishChapterPages}
                                publishChapterPreviews={publishChapterPreviews}
                                setPublishChapterPages={(files) => {
                                    setPublishChapterPages(files);
                                    const previews = Array.from(files).slice(0, 5).map(file => URL.createObjectURL(file));
                                    setPublishChapterPreviews(previews);
                                }}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!adminToken) return showNotification('Sessão expirada.', 'error');
                                    setIsSubmitting(true);
                                    try {
                                        const data = new FormData();
                                        Object.keys(publishData).forEach(key => data.append(key, publishData[key]));
                                        if (publishCover) data.append('cover', publishCover);
                                        Array.from(publishChapterPages).forEach(file => data.append('pages', file));
                                        data.append('chapter_number', '1');

                                        await axios.post(`${API_BASE_URL}/api/works`, data, {
                                            headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${adminToken}` }
                                        });
                                        showNotification('Obra publicada com sucesso!');
                                        setActiveTab('library');
                                        fetchMangas();
                                    } catch (err) {
                                        showNotification('Erro ao publicar.', 'error');
                                    }
                                    setIsSubmitting(false);
                                }}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </motion.div>
                )}

                {activeTab === 'banners' && (
                    <motion.div key="banners-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="tab-header-premium" style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Banners de Destaque</h2>
                        </div>
                        <div className="admin-card banners-card-premium" style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                <h3>Featured Banners</h3>
                                <button onClick={() => setIsBannerModalOpen(true)} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                                    + NOVO BANNER
                                </button>
                            </div>

                            <div className="admin-table-premium">
                                <div className="table-row head" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 100px', fontWeight: 800, color: 'var(--text-dim)', fontSize: '11px', padding: '15px' }}>
                                    <div>BANNER</div>
                                    <div>VÍNCULO</div>
                                    <div>STATUS</div>
                                    <div>AÇÕES</div>
                                </div>
                                {banners.map(banner => (
                                    <div key={banner.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 100px', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <img src={`${API_BASE_URL}${banner.image_url}`} alt="" style={{ width: '100px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                                            <span style={{ fontWeight: 700 }}>{banner.title}</span>
                                        </div>
                                        <div><span className="badge-type" style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', background: 'rgba(255,255,255,0.05)' }}>{banner.manga_title || 'Geral'}</span></div>
                                        <div><span style={{ color: banner.is_active ? '#10b981' : 'var(--text-dim)', fontSize: '12px' }}>{banner.is_active ? 'Ativo' : 'Inativo'}</span></div>
                                        <div>
                                            <button onClick={() => handleDeleteBanner(banner.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div key="users-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="tab-header-premium" style={{ marginBottom: '30px' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 900 }}>Gestão de Usuários</h2>
                        </div>
                        <div className="admin-card users-card-premium" style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input type="text" placeholder="Filtrar por nome ou e-mail..." style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 15px 12px 45px', color: 'white' }} value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
                                </div>
                            </div>

                            <div className="admin-table-premium">
                                <div className="table-row head" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', fontWeight: 800, color: 'var(--text-dim)', fontSize: '11px', padding: '15px' }}>
                                    <div>INSTÂNCIA</div>
                                    <div>CARGO</div>
                                    <div>NÍVEL</div>
                                    <div>CADASTRO</div>
                                    <div>AÇÕES</div>
                                </div>
                                {users.filter(u => u.username.toLowerCase().includes(userFilter.toLowerCase()) || u.email.toLowerCase().includes(userFilter.toLowerCase())).map(user => (
                                    <div key={user.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{user.username[0].toUpperCase()}</div>
                                            <div>
                                                <span style={{ display: 'block', fontWeight: 700 }}>{user.username}</span>
                                                <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)' }}>{user.email}</span>
                                            </div>
                                        </div>
                                        <div><span style={{ fontSize: '11px', fontWeight: 800, color: user.is_admin ? '#8b5cf6' : 'white', background: user.is_admin ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>{user.is_admin ? 'ADMIN' : 'USER'}</span></div>
                                        <div><span style={{ fontWeight: 800 }}>Lvl {user.level}</span></div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{new Date(user.created_at).toLocaleDateString()}</div>
                                        <div>
                                            {!user.is_admin && <button onClick={() => handleDeleteUser(user.id)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="admin-modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="admin-modal-premium" style={{ maxWidth: '800px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                <h2>{editingManga ? 'Editar Obra' : 'Nova Obra'}</h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="input-group-premium">
                                        <label>Título</label>
                                        <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div className="input-group-premium">
                                        <label>Tipo</label>
                                        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                                            <option>Mangá</option><option>Manhwa</option><option>Manhua</option>
                                        </select>
                                    </div>
                                    <div className="input-group-premium">
                                        <label>Autor(a)</label>
                                        <input type="text" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
                                    </div>
                                    <div className="input-group-premium" style={{ gridColumn: 'span 2' }}>
                                        <label>Tags (separadas por vírgula)</label>
                                        <input type="text" placeholder="Ação, Aventura, Fantasia..." value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
                                    </div>
                                    <div className="input-group-premium" style={{ gridColumn: 'span 2' }}>
                                        <label>Descrição</label>
                                        <textarea rows="4" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '15px' }} />
                                    </div>
                                    <div className="input-group-premium" style={{ gridColumn: 'span 2' }}>
                                        <label>Capa da Obra</label>
                                        <div
                                            onClick={() => document.getElementById('library-cover-file').click()}
                                            style={{
                                                width: '100%',
                                                height: '150px',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '16px',
                                                border: '2px dashed rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}
                                        >
                                            {coverPreview || formData.cover_url ? (
                                                <img
                                                    src={coverPreview || (formData.cover_url?.startsWith('http') ? formData.cover_url : `${API_BASE_URL}${formData.cover_url}`)}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center' }}>
                                                    <Upload size={32} />
                                                    <p style={{ fontSize: '11px', marginTop: '8px' }}>Clique para selecionar a capa</p>
                                                </div>
                                            )}
                                            <input
                                                id="library-cover-file"
                                                type="file"
                                                hidden
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    setCoverFile(file);
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setCoverPreview(reader.result);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 30px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} style={{ padding: '12px 30px', borderRadius: '12px', background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isChapterModalOpen && (
                    <div className="admin-modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="admin-modal-premium" style={{ maxWidth: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                <h2>Capítulo {editingChapter ? 'Edit' : 'Add'}</h2>
                                <button onClick={() => setIsChapterModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleChapterSubmit}>
                                <div className="input-group-premium">
                                    <label>Capítulo Nº</label>
                                    <input type="number" step="0.1" required value={chapterFormData.chapter_number} onChange={(e) => setChapterFormData({ ...chapterFormData, chapter_number: e.target.value })} />
                                </div>
                                <div className="input-group-premium">
                                    <label>Arquivos de Imagem</label>
                                    <input type="file" multiple accept="image/*" onChange={(e) => setChapterFormData({ ...chapterFormData, pages: e.target.files })} style={{ background: 'rgba(255,255,255,0.05)' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
                                    <button type="button" onClick={() => setIsChapterModalOpen(false)} style={{ padding: '12px 30px', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" style={{ padding: '12px 30px', border: 'none', background: 'var(--accent)', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer' }}>{isSubmitting ? '...' : 'Salvar'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isBannerModalOpen && (
                    <div className="admin-modal-overlay">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="admin-modal-premium" style={{ maxWidth: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                <h2>Novo Banner</h2>
                                <button onClick={() => setIsBannerModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAddBanner}>
                                <div className="input-group-premium">
                                    <label>Banner Image</label>
                                    <input type="file" required onChange={(e) => setBannerFormData({ ...bannerFormData, banner: e.target.files[0] })} />
                                </div>
                                <div className="input-group-premium">
                                    <label>Obra Vinculada</label>
                                    <select value={bannerFormData.work_id} onChange={(e) => setBannerFormData({ ...bannerFormData, work_id: e.target.value })}>
                                        <option value="">Geral</option>
                                        {mangas.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                    </select>
                                </div>
                                <button type="submit" style={{ width: '100%', padding: '15px', marginTop: '20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Criar</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                :root {
                    --bg-darker: #0d0d12;
                    --bg-card: #16161e;
                    --accent: #8b5cf6;
                    --text-dim: rgba(255, 255, 255, 0.6);
                }
                .admin-container { 
                    padding: 40px; 
                    background: var(--bg-darker); 
                    color: white; 
                    min-height: 100vh; 
                    font-family: 'Outfit', sans-serif;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                .admin-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 50px; 
                    padding-bottom: 30px;
                    border-bottom: 1px solid rgba(255,255,255,0.03);
                }
                .admin-header-titles h1 { font-size: 38px; font-weight: 900; letter-spacing: -1.5px; background: linear-gradient(135deg, #fff 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .btn-manage-obras-direct { 
                    background: #10b981; 
                    border: 2px solid white; 
                    color: white; 
                    padding: 14px 28px; 
                    border-radius: 14px; 
                    font-weight: 900; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    gap: 12px; 
                    transition: 0.3s;
                    box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
                    animation: pulse-green 2s infinite;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-size: 13px;
                }
                @keyframes pulse-green {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                .btn-manage-obras-direct:hover { background: #059669; transform: translateY(-2px) scale(1.05); }
                .admin-nav-tabs { display: flex; gap: 8px; background: rgba(255,255,255,0.02); padding: 5px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .admin-tab-btn { padding: 10px 20px; border-radius: 12px; border: none; background: transparent; color: var(--text-dim); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
                .admin-tab-btn.active { background: var(--accent); color: white; }
                .admin-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 50px; }
                .admin-card { background: var(--bg-card); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); padding: 30px; }
                .admin-main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; }
                .notification-toast { position: fixed; top: 30px; left: 50%; z-index: 10000; background: #1a1a24; padding: 15px 30px; border-radius: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
                .admin-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .admin-modal-premium { background: #1a1a24; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; width: 100%; padding: 40px; }
                .input-group-premium { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
                .input-group-premium label { font-size: 12px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; }
                .input-group-premium input, .input-group-premium select { padding: 12px; borderRadius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: white; }
            `}</style>
        </div >
    );
};

const Tab = ({ active, label, icon, onClick }) => (
    <button className={`admin-tab-btn ${active ? 'active' : ''}`} onClick={onClick}>
        {icon}
        <span>{label}</span>
    </button>
);

const StatBox = ({ label, value, trend, icon, accent }) => (
    <div className="admin-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${accent}15`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>{icon}</div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ fontSize: '28px', fontWeight: 900, margin: '5px 0' }}>{value}</div>
        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{trend}</span>
    </div>
);

const LogEntry = ({ type, title, desc, time, avatar }) => (
    <div style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ position: 'relative' }}>
            {avatar ? (
                <img src={avatar.startsWith('http') ? avatar : `${API_BASE_URL}${avatar}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={16} color="var(--text-dim)" />
                </div>
            )}
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#8b5cf6', borderRadius: '50%', border: '2px solid #16161e' }} />
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontWeight: 800, fontSize: '12px' }}>{title}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{time}</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>{desc}</p>
        </div>
    </div>
);

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) return <div style={{ background: '#1a1a24', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>{payload[0].value} views</div>;
    return null;
};

const PublishView = ({ publishData, setPublishData, publishCoverPreview, setPublishCover, publishChapterPages, publishChapterPreviews, setPublishChapterPages, onSubmit, isSubmitting }) => (
    <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '30px' }}>
            <div>
                <h3>1. Informações Básicas</h3>
                <div className="input-group-premium">
                    <label>Título</label>
                    <input type="text" required value={publishData.title} onChange={(e) => setPublishData({ ...publishData, title: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="input-group-premium">
                        <label>Tipo</label>
                        <select value={publishData.type} onChange={(e) => setPublishData({ ...publishData, type: e.target.value })}>
                            <option>Mangá</option><option>Manhwa</option><option>Manhua</option>
                        </select>
                    </div>
                    <div className="input-group-premium">
                        <label>Status</label>
                        <select value={publishData.status} onChange={(e) => setPublishData({ ...publishData, status: e.target.value })}>
                            <option>Em andamento</option><option>Completo</option>
                        </select>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="input-group-premium">
                        <label>Autor(a)</label>
                        <input type="text" placeholder="Nome do autor..." value={publishData.author} onChange={(e) => setPublishData({ ...publishData, author: e.target.value })} />
                    </div>
                    <div className="input-group-premium">
                        <label>Categorias (separadas por vírgula)</label>
                        <input type="text" placeholder="Ação, Aventura, Fantasia..." value={publishData.tags} onChange={(e) => setPublishData({ ...publishData, tags: e.target.value })} />
                    </div>
                </div>
                <div className="input-group-premium">
                    <label>Sinopse</label>
                    <textarea rows="4" value={publishData.description} onChange={(e) => setPublishData({ ...publishData, description: e.target.value })} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none' }} />
                </div>
            </div>
            <div>
                <h3>2. Visual & Capítulos</h3>
                <div className="cover-preview" onClick={() => document.getElementById('cover-file').click()} style={{ width: '100%', height: '200px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                    {publishCoverPreview ? <img src={publishCoverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><Upload size={32} /><p style={{ fontSize: '11px' }}>Capa da Obra</p></div>}
                    <input id="cover-file" type="file" hidden onChange={(e) => setPublishCover(e.target.files[0])} />
                </div>
                <div className="chapter-zone" onClick={() => document.getElementById('chap-files').click()} style={{ marginTop: '20px', padding: '20px', background: 'var(--accent)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
                    <Plus size={24} />
                    <p style={{ fontWeight: 800 }}>Capítulo 1</p>
                    <span style={{ fontSize: '11px' }}>{publishChapterPages.length > 0 ? `${publishChapterPages.length} pgs` : 'Subir arquivos'}</span>
                    <input id="chap-files" type="file" multiple hidden onChange={(e) => setPublishChapterPages(e.target.files)} />
                </div>
            </div>
        </div>
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: '30px', padding: '15px', background: 'white', color: 'black', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '16px' }}>
            {isSubmitting ? 'PUBLICANDO...' : 'LANÇAR OBRA NO ECOSSISTEMA'}
        </button>
    </form>
);

export default AdminDashboard;
