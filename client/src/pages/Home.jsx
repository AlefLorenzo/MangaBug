import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Clock, Star, Play, ChevronRight, Sparkles, Zap, Flame, Trophy } from 'lucide-react';
import { useWork } from '../context/WorkContext';
import { useUser } from '../context/UserAuthContext';
import { useAdmin } from '../context/AdminAuthContext';
import { API_BASE_URL } from '../api/config';

const Home = () => {
    const { works: mangas, loading } = useWork();
    const [banners, setBanners] = useState([]);
    const [history, setHistory] = useState([]);
    const [currentBanner, setCurrentBanner] = useState(0);
    const { user } = useUser();
    const { admin } = useAdmin();
    const navigate = useNavigate();
    const currentUser = user || admin;
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

    const { socket } = useSocket() || {};

    const fetchBanners = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/banners`);
            setBanners(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchHistory = async () => {
        if (!currentUser) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/history/${currentUser.id}?uniqueWorks=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data.slice(0, 4));
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchBanners();
        fetchHistory();
    }, [currentUser]);

    useEffect(() => {
        if (socket) {
            socket.on('banners_updated', () => {
                console.log('[Socket] Banners modified, refetching...');
                fetchBanners();
            });
            socket.on('history_updated', (data) => {
                if (!data.userId || data.userId === currentUser?.id) {
                    console.log('[Socket] History changed, refetching...');
                    fetchHistory();
                }
            });
            return () => {
                socket.off('banners_updated');
                socket.off('history_updated');
            };
        }
    }, [socket, currentUser]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBanner((prev) => (banners.length > 0 ? (prev + 1) % banners.length : 0));
        }, 10000);
        return () => clearInterval(interval);
    }, [banners]);

    if (loading) return <div className="loader"></div>;

    const trending = mangas.slice(0, 6);
    const latest = mangas.slice().reverse().slice(0, 10);

    const handleAction = (type, value) => {
        if (type === 'work') navigate(`/manga/${value}`);
        else if (type === 'chapter') navigate(`/reader/${value}`);
        else if (type === 'url') window.open(value, '_blank');
    };

    return (
        <div className="home-container">
            {/* 🎥 PREMIUM HERO BANNER 🎥 */}
            <section className="hero-banner-section">
                <AnimatePresence mode="wait">
                    {banners.length > 0 && (
                        <motion.div
                            key={currentBanner}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="premium-hero"
                            style={{ backgroundImage: `url(${API_BASE_URL}${banners[currentBanner]?.image_url})` }}
                        >
                            <div className="hero-overlay">
                                <div className="hero-content">
                                    <motion.span initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="hero-tag">
                                        {banners[currentBanner]?.work_title ? 'Disponível Agora' : 'Destaque da Semana'}
                                    </motion.span>
                                    <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                                        {banners[currentBanner]?.title || 'Descubra sua próxima jornada'}
                                    </motion.h1>
                                    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                                        {banners[currentBanner]?.subtitle || 'Milhares de obras premium esperando por você.'}
                                    </motion.p>
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="hero-actions">
                                        {banners[currentBanner]?.buttons && banners[currentBanner].buttons.length > 0 ? (
                                            banners[currentBanner].buttons.map((btn, i) => (
                                                <button
                                                    key={i}
                                                    className={i === 0 ? "btn-hero-primary" : "btn-hero-secondary"}
                                                    onClick={() => handleAction(btn.action_type, btn.action_value)}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))
                                        ) : (
                                            <>
                                                <button className="btn-hero-primary" onClick={() => banners[currentBanner]?.work_id && navigate(`/manga/${banners[currentBanner].work_id}`)}>
                                                    <Play size={20} fill="currentColor" /> LER AGORA
                                                </button>
                                                <button className="btn-hero-secondary">MAIS INFOS</button>
                                            </>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* 📚 CONTINUE READING (RECENT HISTORY) 📚 */}
            {user && history.length > 0 && (
                <section className="recent-history-section">
                    <div className="section-header">
                        <div className="title-box">
                            <Clock color="var(--accent)" size={24} />
                            <h2>Continuar <span className="accent">Lendo</span></h2>
                        </div>
                        <Link to="/history" className="view-all">Histórico Completo <ChevronRight size={16} /></Link>
                    </div>
                    <div className="recent-history-grid">
                        {history.map(item => (
                            <div key={item.work_id} className="history-card-home" onClick={() => navigate(`/reader/${item.chapter_id}?page=${item.page_number}`)}>
                                <div className="history-thumb">
                                    <img src={item.cover_url?.startsWith('http') ? item.cover_url : `${API_BASE_URL}${item.cover_url}`} alt="" />
                                    <div className="history-overlay-play"><Play fill="white" size={24} /></div>
                                </div>
                                <div className="history-info-home">
                                    <h3>{item.title}</h3>
                                    <p>Cap. {item.chapter_number} • Pág. {item.page_number}</p>
                                    <div className="history-progress-wrapper">
                                        <div className="progress-bar-small">
                                            <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                                        </div>
                                        <span>{item.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 🔥 TRENDING SECTION 🔥 */}
            <section className="trending-section">
                <div className="section-header">
                    <div className="title-box">
                        <Flame color="#FF4D4D" fill="#FF4D4D" size={24} />
                        <h2>Em Alta <span className="accent">Hoje</span></h2>
                    </div>
                    <Link to="/explore" className="view-all">Ver Tudo <ChevronRight size={16} /></Link>
                </div>
                <div className="trending-grid">
                    {trending.map((manga, index) => (
                        <div key={manga.id} className="trending-card" onClick={() => navigate(`/manga/${manga.id}`)}>
                            <div className="card-number">{index + 1}</div>
                            <div className="card-thumb">
                                <img src={manga.cover_url && manga.cover_url.startsWith('http') ? manga.cover_url : `${API_BASE_URL}${manga.cover_url?.startsWith('/') ? manga.cover_url : `/${manga.cover_url || manga.cover || ''}`}`} alt={manga.title} />
                            </div>
                            <div className="trending-info">
                                <h3>{manga.title}</h3>
                                <div className="info-meta">
                                    <span className="type">{manga.type}</span>
                                    <span className="dot">•</span>
                                    <span className="rating"><Star size={12} fill="#FACC15" color="#FACC15" /> {manga.rating || '4.8'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 🆕 LATEST UPDATES 🆕 */}
            <section className="latest-section">
                <div className="section-header">
                    <div className="title-box">
                        <Zap color="#FACC15" fill="#FACC15" size={24} />
                        <h2>Últimos <span className="accent">Lançamentos</span></h2>
                    </div>
                </div>
                <div className="manga-scroll-grid">
                    {latest.map(manga => (
                        <Link to={`/manga/${manga.id}`} key={manga.id} className="manga-item">
                            <div className="manga-cover-wrapper">
                                <img src={manga.cover_url && manga.cover_url.startsWith('http') ? manga.cover_url : `${API_BASE_URL}${manga.cover_url?.startsWith('/') ? manga.cover_url : `/${manga.cover_url || manga.cover || ''}`}`} alt={manga.title} />
                                <div className="cover-badge">{manga.status}</div>
                                <div className="cover-hover-overlay">
                                    <Play size={32} color="white" fill="white" />
                                </div>
                            </div>
                            <h3>{manga.title}</h3>
                            <p>{manga.type}</p>
                        </Link>
                    ))}
                </div>
            </section>

            <style>{`
                .home-container { display: flex; flex-direction: column; gap: 60px; padding-bottom: 80px; }
                
                .recent-history-section { background: rgba(255,255,255,0.02); border-radius: 24px; padding: 40px; border: 1px solid rgba(255,255,255,0.05); }
                .recent-history-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .history-card-home { display: flex; gap: 15px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 16px; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: 0.2s; min-width: 0; }
                .history-card-home:hover { transform: translateY(-5px); background: rgba(255,255,255,0.06); border-color: var(--accent); }
                .history-thumb { width: 60px; height: 85px; border-radius: 12px; overflow: hidden; position: relative; flex-shrink: 0; }
                .history-thumb img { width: 100%; height: 100%; object-fit: cover; }
                .history-overlay-play { position: absolute; inset: 0; background: rgba(139, 92, 246, 0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; }
                .history-card-home:hover .history-overlay-play { opacity: 1; }
                .history-info-home { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 4px; overflow: hidden; }
                .history-info-home h3 { font-size: 14px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
                .history-info-home p { font-size: 11px; color: var(--text-dim); font-weight: 600; }
                .history-progress-wrapper { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
                .progress-bar-small { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
                .progress-fill { height: 100%; background: var(--accent); transition: 1s cubic-bezier(0.4, 0, 0.2, 1); }
                .history-progress-wrapper span { font-size: 10px; font-weight: 800; color: var(--accent); }

                .hero-banner-section { height: 500px; border-radius: 30px; overflow: hidden; position: relative; }
                .premium-hero { width: 100%; height: 100%; background-size: cover; background-position: center; position: relative; }
                .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to right, #0B0E14 20%, transparent 80%); display: flex; align-items: center; padding: 60px; }
                .hero-content { max-width: 600px; }
                .hero-tag { display: inline-block; padding: 6px 12px; background: var(--accent-soft); color: var(--accent); border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 1px; }
                .hero-content h1 { font-size: 56px; line-height: 1.1; margin-bottom: 20px; font-weight: 900; letter-spacing: -2px; }
                .hero-content p { font-size: 18px; color: var(--text-dim); margin-bottom: 35px; }
                .hero-actions { display: flex; gap: 15px; }
                .btn-hero-primary { background: white; color: black; border: none; padding: 14px 30px; border-radius: 12px; font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; }
                .btn-hero-primary:hover { transform: scale(1.05); }
                .btn-hero-secondary { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 14px 30px; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; transition: 0.3s; }

                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .title-box { display: flex; align-items: center; gap: 12px; }
                .title-box h2 { font-size: 24px; font-weight: 800; }
                .view-all { color: var(--accent); text-decoration: none; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 4px; }

                .trending-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .trending-card { background: var(--bg-soft); border-radius: 20px; padding: 15px; display: flex; gap: 20px; cursor: pointer; border: 1px solid rgba(255,255,255,0.03); transition: 0.3s; position: relative; }
                .trending-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); }
                .card-number { position: absolute; top: -10px; left: -10px; width: 35px; height: 35px; background: var(--accent); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4); }
                .trending-card .card-thumb { width: 90px; height: 135px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
                .trending-card img { width: 100%; height: 100%; object-fit: cover; }
                .trending-info { display: flex; flex-direction: column; justify-content: center; gap: 8px; }
                .trending-info h3 { font-size: 16px; font-weight: 800; }
                .info-meta { font-size: 13px; color: var(--text-dim); display: flex; align-items: center; gap: 8px; }

                .manga-scroll-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 24px; }
                .manga-item { text-decoration: none; color: white; display: block; min-width: 0; }
                .manga-cover-wrapper { position: relative; border-radius: 16px; overflow: hidden; margin-bottom: 12px; width: 100%; padding-bottom: 150%; background: #161B22; }
                .manga-cover-wrapper img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .manga-item:hover .manga-cover-wrapper img { transform: scale(1.1); }
                .cover-badge { position: absolute; top: 12px; right: 12px; z-index: 5; padding: 4px 8px; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
                .cover-hover-overlay { position: absolute; inset: 0; z-index: 6; background: rgba(139, 92, 246, 0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
                .manga-item:hover .cover-hover-overlay { opacity: 1; }
                .manga-item h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
                .manga-item p { font-size: 13px; color: var(--text-dim); }

                @media (max-width: 1280px) {
                    .recent-history-grid { grid-template-columns: repeat(2, 1fr); }
                }

                @media (max-width: 1024px) {
                    .trending-grid { grid-template-columns: repeat(1, 1fr); }
                    .manga-scroll-grid { grid-template-columns: repeat(3, 1fr); }
                    .hero-content h1 { font-size: 36px; }
                }

                @media (max-width: 640px) {
                    .recent-history-grid { grid-template-columns: repeat(1, 1fr); }
                    .manga-scroll-grid { grid-template-columns: repeat(2, 1fr); }
                    .recent-history-section { padding: 20px; }
                    .hero-overlay { padding: 30px; }
                }
            `}</style>
        </div>
    );
};

export default Home;
