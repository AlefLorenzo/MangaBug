import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star, Clock, BookOpen, Share2, Heart, Play,
    ChevronRight, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';
import { useUser } from '../context/UserAuthContext';
import { useAdmin } from '../context/AdminAuthContext';

const MangaDetail = () => {
    const { id } = useParams();
    const [manga, setManga] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [favLoading, setFavLoading] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest first
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();
    const { user } = useUser();
    const { admin } = useAdmin();
    const currentUser = user || admin;
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const [workRes, chaptersRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/works/${id}`),
                    axios.get(`${API_BASE_URL}/api/works/${id}/chapters`)
                ]);
                setManga(workRes.data);
                setChapters(chaptersRes.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchDetail();
    }, [id]);

    // Check if already favorited
    useEffect(() => {
        const checkFavorite = async () => {
            if (!currentUser) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/users/favorites/${currentUser.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const favIds = (res.data || []).map(f => f.id);
                setIsFavorited(favIds.includes(parseInt(id)));
            } catch (e) { /* non-critical */ }
        };
        checkFavorite();
    }, [currentUser, id]);

    // Fetch Reading Progress
    useEffect(() => {
        const fetchProgress = async () => {
            if (!currentUser) return;
            try {
                const res = await axios.get(`${API_BASE_URL}/api/reader/progress/${currentUser.id}/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProgress(res.data);
            } catch (e) { console.error('Progress Fetch Error:', e); }
        };
        fetchProgress();
    }, [currentUser, id]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    };

    const handleFavorite = async () => {
        if (!currentUser || favLoading) return;
        setFavLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/api/users/favorites`,
                { workId: parseInt(id) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const added = res.data.action === 'added';
            setIsFavorited(added);
            showToast(added ? '❤️ Adicionado aos favoritos!' : '💔 Removido dos favoritos', added ? 'success' : 'info');
        } catch (e) {
            showToast('Erro ao atualizar favoritos', 'error');
        }
        setFavLoading(false);
    };

    const sortedChapters = [...chapters].sort((a, b) => {
        const an = parseFloat(a.chapter_number);
        const bn = parseFloat(b.chapter_number);
        return sortOrder === 'desc' ? bn - an : an - bn;
    });

    const getImageUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    };

    if (loading) return <div className="loader" />;
    if (!manga) return <div style={{ color: 'white', padding: 40 }}>Obra não encontrada.</div>;

    const firstChapterId = [...chapters].sort((a, b) => parseFloat(a.chapter_number) - parseFloat(b.chapter_number))[0]?.id;
    const lastChapterId = [...chapters].sort((a, b) => parseFloat(b.chapter_number) - parseFloat(a.chapter_number))[0]?.id;

    return (
        <div className="detail-container">
            <button className="btn-back" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} /> VOLTAR
            </button>

            <section className="detail-hero">
                <div className="hero-bg" style={{ backgroundImage: `url(${getImageUrl(manga.cover_url)})` }} />
                <div className="hero-content-wrapper">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="manga-main-info"
                    >
                        <div className="manga-poster">
                            <img src={getImageUrl(manga.cover_url)} alt={manga.title} />
                            <div className="poster-actions">
                                <button
                                    className={`btn-add-list ${isFavorited ? 'favorited' : ''}`}
                                    onClick={handleFavorite}
                                    disabled={favLoading || !currentUser}
                                >
                                    <Heart size={18} fill={isFavorited ? 'white' : 'none'} />
                                    {isFavorited ? 'FAVORITADO' : 'FAVORITAR'}
                                </button>
                                <button className="btn-share" onClick={() => navigator.share?.({ title: manga.title }) || navigator.clipboard?.writeText(window.location.href)}>
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="manga-text-details">
                            <div className="manga-tags">
                                <span className={`badge-type ${manga.type?.toLowerCase()}`}>{manga.type}</span>
                                <span className={`badge-status ${manga.status === 'completed' || manga.status === 'Completo' ? 'done' : 'ongoing'}`}>
                                    {manga.status === 'ongoing' ? 'Em andamento' : manga.status === 'completed' ? 'Completo' : manga.status}
                                </span>
                            </div>
                            <h1>{manga.title}</h1>
                            <p className="author-artist">Por <span>{manga.author || 'Desconhecido'}</span> &amp; <span>{manga.artist || 'Desconhecido'}</span></p>

                            <div className="manga-stats-pill">
                                <div className="stat-item">
                                    <Star size={18} fill="#FACC15" color="#FACC15" />
                                    <strong>{manga.rating || '4.8'}</strong>
                                    <span>Rating</span>
                                </div>
                                <div className="stat-divider" />
                                <div className="stat-item">
                                    <BookOpen size={18} color="#8B5CF6" />
                                    <strong>{chapters.length}</strong>
                                    <span>Caps</span>
                                </div>
                                <div className="stat-divider" />
                                <div className="stat-item">
                                    <Heart size={18} color="#EF4444" fill="#EF4444" />
                                    <strong>{Math.floor((manga.views || 0) / 20) || '0'}</strong>
                                    <span>Amei</span>
                                </div>
                            </div>

                            <div className="manga-synopsis">
                                <h3>Sinopse</h3>
                                <p>{manga.description || 'Sem descrição disponível.'}</p>
                            </div>

                            {progress && progress.chapter_id && (
                                <div className="reading-progress-container">
                                    <div className="progress-labels">
                                        <span>Sua Progressão</span>
                                        <span>{Math.round((progress.read_chapters / progress.total_chapters) * 100 || 0)}%</span>
                                    </div>
                                    <div className="progress-bar-outer">
                                        <div
                                            className="progress-bar-inner"
                                            style={{ width: `${(progress.read_chapters / progress.total_chapters) * 100 || 0}%` }}
                                        />
                                    </div>
                                    <p className="progress-detail">Você leu {progress.read_chapters} de {progress.total_chapters} capítulos</p>
                                </div>
                            )}

                            <div className="main-actions">
                                {progress && progress.chapter_id && (
                                    <button
                                        className="btn-continue-reading"
                                        onClick={() => navigate(`/reader/${progress.chapter_id}?page=${progress.page_number || 1}`)}
                                    >
                                        <Play size={20} fill="black" /> CONTINUAR LENDO
                                    </button>
                                )}
                                <button
                                    className="btn-read-first"
                                    onClick={() => firstChapterId && navigate(`/reader/${firstChapterId}`)}
                                    disabled={!firstChapterId}
                                >
                                    <Play size={20} fill="white" /> {progress?.chapter_id ? 'RECOMEÇAR' : 'PRIMEIRO CAP.'}
                                </button>
                                {lastChapterId && lastChapterId !== firstChapterId && (
                                    <button
                                        className="btn-read-last"
                                        onClick={() => navigate(`/reader/${lastChapterId}`)}
                                    >
                                        ÚLTIMO CAP. <ChevronRight size={18} />
                                    </button>
                                )}
                                <button
                                    className={`btn-favorite-large ${isFavorited ? 'active' : ''}`}
                                    onClick={handleFavorite}
                                    disabled={favLoading || !currentUser}
                                >
                                    <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
                                    {isFavorited ? 'FAVORITADO' : 'FAVORITAR'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="chapters-section">
                <div className="section-header">
                    <h2>Capítulos <span className="count">{chapters.length}</span></h2>
                    <div className="sort-actions">
                        <button
                            className={sortOrder === 'desc' ? 'active' : ''}
                            onClick={() => setSortOrder('desc')}
                        >
                            RECENTES
                        </button>
                        <button
                            className={sortOrder === 'asc' ? 'active' : ''}
                            onClick={() => setSortOrder('asc')}
                        >
                            MAIS ANTIGOS
                        </button>
                    </div>
                </div>

                <div className="chapters-grid">
                    {sortedChapters.map(chapter => (
                        <div key={chapter.id} className="chapter-card" onClick={() => navigate(`/reader/${chapter.id}`)}>
                            <div className="chapter-info">
                                <div className="chapter-num">CAP {chapter.chapter_number}</div>
                                <div className="chapter-title">{chapter.title || `Capítulo ${chapter.chapter_number}`}</div>
                            </div>
                            <div className="chapter-meta">
                                <span><Clock size={14} /> {new Date(chapter.created_at).toLocaleDateString('pt-BR')}</span>
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className={`detail-toast ${toast.type}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .detail-container { padding-bottom: 100px; }
                .btn-back {
                    position: absolute; top: 100px; left: 40px; z-index: 10;
                    background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);
                    color: white; padding: 10px 20px; border-radius: 12px;
                    font-weight: 800; cursor: pointer;
                    display: flex; align-items: center; gap: 8px;
                    backdrop-filter: blur(10px); transition: 0.2s;
                }
                .btn-back:hover { background: rgba(255,255,255,0.1); }

                .detail-hero { position: relative; min-height: 650px; overflow: hidden; }
                .hero-bg {
                    position: absolute; inset: 0;
                    background-size: cover; background-position: center top;
                    filter: blur(30px) brightness(0.25); transform: scale(1.1);
                }
                .hero-content-wrapper {
                    position: relative; min-height: 650px;
                    max-width: 1200px; margin: 0 auto;
                    display: flex; align-items: center;
                    padding: 80px 40px 40px;
                }

                .manga-main-info { display: flex; gap: 60px; align-items: flex-start; }
                .manga-poster { width: 320px; flex-shrink: 0; }
                .manga-poster img { width: 100%; border-radius: 20px; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.7); }
                .poster-actions { display: flex; gap: 10px; margin-top: 16px; }
                .poster-actions button {
                    flex: 1; padding: 12px; border-radius: 12px; border: none;
                    font-weight: 800; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    gap: 8px; transition: 0.3s; font-size: 13px;
                }
                .btn-add-list { background: white; color: black; }
                .btn-add-list.favorited { background: #ef4444; color: white; }
                .btn-add-list:hover { transform: translateY(-2px); }
                .btn-share { background: rgba(255,255,255,0.1); color: white; }

                .manga-text-details { flex: 1; }
                .manga-tags { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
                .badge-type {
                    background: rgba(139,92,246,0.15); color: #a78bfa;
                    padding: 5px 12px; border-radius: 8px;
                    font-size: 11px; font-weight: 800; text-transform: uppercase;
                }
                .badge-status {
                    background: rgba(255,255,255,0.08); color: white;
                    padding: 5px 12px; border-radius: 8px;
                    font-size: 11px; font-weight: 800; text-transform: uppercase;
                }
                .badge-status.ongoing { color: #F59E0B; }
                .badge-status.done { color: #10B981; }

                .manga-text-details h1 { font-size: 48px; font-weight: 900; letter-spacing: -2px; line-height: 1.1; margin-bottom: 10px; }
                .author-artist { color: var(--text-dim); font-size: 15px; margin-bottom: 28px; }
                .author-artist span { color: white; font-weight: 700; }

                .manga-stats-pill {
                    display: flex; align-items: center;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 20px; padding: 18px 28px;
                    width: fit-content; gap: 28px; margin-bottom: 36px;
                }
                .stat-item { display: flex; flex-direction: column; gap: 4px; }
                .stat-item strong { font-size: 18px; font-weight: 800; }
                .stat-item span { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
                .stat-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }

                .manga-synopsis { margin-bottom: 36px; }
                .manga-synopsis h3 { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
                .manga-synopsis p { color: var(--text-dim); line-height: 1.8; font-size: 15px; max-height: 110px; overflow-y: auto; }

                .main-actions { display: flex; gap: 16px; flex-wrap: wrap; }
                .btn-read-first {
                    background: var(--accent, #8b5cf6); color: white; border: none;
                    padding: 14px 32px; border-radius: 14px;
                    font-weight: 800; font-size: 14px;
                    display: flex; align-items: center; gap: 10px;
                    cursor: pointer; transition: 0.3s;
                }
                .btn-read-first:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 20px 40px -10px rgba(139,92,246,0.5); }
                .btn-read-first:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-read-last {
                    background: rgba(255,255,255,0.08); color: white;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 14px 28px; border-radius: 14px;
                    font-weight: 800; font-size: 14px;
                    display: flex; align-items: center; gap: 8px;
                    cursor: pointer; transition: 0.3s;
                }
                .btn-read-last:hover { background: rgba(255,255,255,0.14); }
                .btn-favorite-large {
                    background: rgba(239,68,68,0.08); color: #EF4444;
                    border: 1px solid rgba(239,68,68,0.2);
                    padding: 14px 32px; border-radius: 14px;
                    font-weight: 800; font-size: 14px;
                    cursor: pointer; transition: 0.3s;
                    display: flex; align-items: center; gap: 10px;
                }
                .btn-favorite-large.active,
                .btn-favorite-large:hover { background: #EF4444; color: white; }
                .btn-favorite-large:disabled { opacity: 0.5; cursor: not-allowed; }

                .reading-progress-container { margin-bottom: 30px; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .progress-labels { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; color: var(--text-dim); }
                .progress-bar-outer { width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
                .progress-bar-inner { height: 100%; background: var(--accent); border-radius: 10px; transition: 1s cubic-bezier(0.4, 0, 0.2, 1); }
                .progress-detail { font-size: 12px; color: var(--text-dim); }

                .btn-continue-reading {
                    background: white; color: black; border: none;
                    padding: 14px 32px; border-radius: 14px;
                    font-weight: 900; font-size: 14px;
                    display: flex; align-items: center; gap: 10px;
                    cursor: pointer; transition: 0.3s;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                }
                .btn-continue-reading:hover { transform: translateY(-3px); background: #f0f0f0; }

                /* Chapters */
                .chapters-section { max-width: 1200px; margin: 60px auto 0; padding: 0 40px; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .count { color: var(--text-dim); font-weight: 400; font-size: 18px; margin-left: 10px; }
                .sort-actions { display: flex; gap: 10px; }
                .sort-actions button {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.5);
                    padding: 8px 16px; border-radius: 8px;
                    font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s;
                }
                .sort-actions button.active { background: var(--accent, #8b5cf6); color: white; border-color: transparent; }

                .chapters-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
                .chapter-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.04);
                    padding: 18px 22px; border-radius: 14px;
                    display: flex; justify-content: space-between;
                    align-items: center; cursor: pointer; transition: 0.2s;
                }
                .chapter-card:hover { background: rgba(255,255,255,0.06); border-color: var(--accent, #8b5cf6); transform: translateX(6px); }
                .chapter-num { font-size: 11px; font-weight: 900; color: var(--accent, #8b5cf6); margin-bottom: 4px; text-transform: uppercase; }
                .chapter-title { font-weight: 700; font-size: 14px; }
                .chapter-meta { display: flex; align-items: center; gap: 16px; color: var(--text-dim); font-size: 12px; }

                /* Toast */
                .detail-toast {
                    position: fixed; bottom: 30px; right: 30px;
                    padding: 14px 24px; border-radius: 14px;
                    font-size: 14px; font-weight: 700;
                    z-index: 9999; pointer-events: none;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                }
                .detail-toast.success { background: rgba(16,185,129,0.93); color: white; }
                .detail-toast.info { background: rgba(139,92,246,0.93); color: white; }
                .detail-toast.error { background: rgba(239,68,68,0.93); color: white; }

                @media (max-width: 1024px) {
                    .manga-main-info { flex-direction: column; align-items: center; text-align: center; }
                    .manga-stats-pill { margin: 0 auto 36px; }
                    .main-actions { justify-content: center; }
                    .chapters-grid { grid-template-columns: 1fr; }
                    .manga-poster { width: 220px; }
                    .manga-text-details h1 { font-size: 32px; }
                    .btn-back { top: 80px; left: 20px; }
                }
                @media (max-width: 600px) {
                    .chapters-section { padding: 0 16px; }
                    .detail-toast { left: 16px; right: 16px; text-align: center; }
                }
            `}</style>
        </div>
    );
};

export default MangaDetail;
