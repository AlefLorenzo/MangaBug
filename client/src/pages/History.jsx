import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, BookOpen, ChevronRight, Layout, Calendar } from 'lucide-react';
import { useUser } from '../context/UserAuthContext';
import { useAdmin } from '../context/AdminAuthContext';
import { API_BASE_URL } from '../api/config';

const History = () => {
    const { user, loading: userLoading } = useUser();
    const { admin, loading: adminLoading } = useAdmin();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);

    // Unified Profile
    const currentUser = user || admin;
    const loading = userLoading || adminLoading;
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!currentUser) {
                setDataLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_BASE_URL}/api/users/history/${currentUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistory(res.data);
            } catch (err) { console.error(err); }
            setDataLoading(false);
        };
        fetchHistory();
    }, [currentUser, token]);

    const clearHistory = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/users/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory([]);
        } catch (err) { console.error(err); }
    };

    if (loading || dataLoading) return <div className="loader"></div>;

    const groupedHistory = history.reduce((groups, item) => {
        const date = new Date(item.last_read).toLocaleDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(item);
        return groups;
    }, {});

    return (
        <div className="history-container">
            <header className="page-header-premium">
                <div className="header-content">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="title-wrapper">
                        <Clock className="header-icon" color="var(--accent)" size={32} />
                        <div>
                            <h1>Meu <span className="accent">Histórico</span></h1>
                            <p>Continue de onde você parou</p>
                        </div>
                    </motion.div>
                    <button className="btn-clear-history" onClick={clearHistory}>
                        <Trash2 size={16} /> LIMPAR TUDO
                    </button>
                </div>
            </header>

            {history.length === 0 ? (
                <div className="empty-state">
                    <Layout size={64} color="var(--text-dim)" strokeWidth={1} />
                    <h3>Nenhum registro encontrado</h3>
                    <p>Seus capítulos lidos aparecerão aqui para você nunca se perder.</p>
                </div>
            ) : (
                <div className="history-list-workflow">
                    {Object.entries(groupedHistory).map(([date, items]) => (
                        <div key={date} className="history-group">
                            <div className="group-date">
                                <Calendar size={14} /> {date}
                            </div>
                            <div className="group-items">
                                {items.map((item) => (
                                    <div key={item.id || `${item.work_id}-${item.chapter_id}`} className="history-item-card" onClick={() => navigate(`/reader/${item.chapter_id}`)}>
                                        <div className="item-thumb">
                                            <img src={item.cover_url?.startsWith('http') ? item.cover_url : `${API_BASE_URL}${item.cover_url}`} alt="" />
                                        </div>
                                        <div className="item-main">
                                            <div className="item-manga-title">{item.title}</div>
                                            <div className="item-chapter">Capítulo {item.chapter_number}</div>
                                            <div className="item-time">Lido às {new Date(item.last_read).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div className="item-actions">
                                            <button className="btn-continue">CONTINUAR <ChevronRight size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .history-container { padding: 40px; }
                .page-header-premium { margin-bottom: 50px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 40px; }
                .header-content { display: flex; justify-content: space-between; align-items: flex-end; }
                .title-wrapper { display: flex; align-items: center; gap: 20px; }
                .title-wrapper h1 { font-size: 36px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px; }
                .title-wrapper p { color: var(--text-dim); }

                .btn-clear-history { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 10px 20px; border-radius: 12px; font-size: 11px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
                .btn-clear-history:hover { background: #EF4444; color: white; }

                .history-group { margin-bottom: 40px; }
                .group-date { font-size: 11px; font-weight: 900; color: var(--text-dim); display: flex; align-items: center; gap: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
                .group-date::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.05); }

                .group-items { display: flex; flex-direction: column; gap: 12px; }
                .history-item-card { background: var(--bg-soft); border-radius: 16px; padding: 15px 25px; display: flex; align-items: center; gap: 25px; cursor: pointer; border: 1px solid rgba(255,255,255,0.02); transition: 0.2s; }
                .history-item-card:hover { transform: translateX(10px); background: rgba(255,255,255,0.05); border-color: var(--accent); }

                .item-thumb { width: 50px; height: 75px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
                .item-thumb img { width: 100%; height: 100%; object-fit: cover; }
                
                .item-main { flex: 1; }
                .item-manga-title { font-weight: 800; font-size: 16px; margin-bottom: 4px; }
                .item-chapter { font-size: 14px; color: var(--accent); font-weight: 700; }
                .item-time { font-size: 12px; color: var(--text-dim); margin-top: 4px; }

                .btn-continue { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: white; padding: 10px 18px; border-radius: 10px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px; }
                .history-item-card:hover .btn-continue { background: var(--accent); border-color: var(--accent); }

                .empty-state { text-align: center; padding: 80px 20px; color: var(--text-dim); }
                .empty-state h3 { color: white; margin: 20px 0 10px; }
            `}</style>
        </div>
    );
};

export default History;
