import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, Play, BookOpen, Star, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserAuthContext';
import { API_BASE_URL } from '../api/config';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${API_BASE_URL}/api/users/favorites/${user.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setFavorites(res.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetchFavorites();
    }, [user]);

    const removeFavorite = async (workId) => {
        try {
            await axios.post(`${API_BASE_URL}/api/users/favorites`,
                { workId },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setFavorites(favorites.filter(f => f.id !== workId));
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="loader"></div>;

    return (
        <div className="favorites-container">
            <header className="page-header-premium">
                <div className="header-content">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="title-wrapper">
                        <Heart className="header-icon" fill="#EF4444" color="#EF4444" size={32} />
                        <div>
                            <h1>Minha <span className="accent">Estante</span></h1>
                            <p>Suas obras favoritas e coleções privadas</p>
                        </div>
                    </motion.div>
                    <div className="header-stats">
                        <div className="stat-box">
                            <strong>{favorites.length}</strong>
                            <span>Obras</span>
                        </div>
                    </div>
                </div>
            </header>

            {favorites.length === 0 ? (
                <div className="empty-state">
                    <Sparkles size={64} color="var(--text-dim)" strokeWidth={1} />
                    <h3>Sua estante está vazia</h3>
                    <p>Explore o catálogo e adicione obras para acompanhar suas novidades.</p>
                    <Link to="/search" className="btn-explore-now">EXPLORAR CATÁLOGO</Link>
                </div>
            ) : (
                <div className="favorites-grid">
                    <AnimatePresence>
                        {favorites.map((manga) => (
                            <motion.div
                                key={manga.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="fav-card-premium"
                            >
                                <div className="fav-thumb" onClick={() => navigate(`/manga/${manga.id}`)}>
                                    <img src={manga.cover_url && manga.cover_url.startsWith('http') ? manga.cover_url : `${API_BASE_URL}${manga.cover_url?.startsWith('/') ? manga.cover_url : `/${manga.cover_url || manga.cover || ''}`}`} alt="" />
                                    <div className="fav-overlay">
                                        <Play size={24} fill="white" color="white" />
                                        <span>CONTINUAR LENDO</span>
                                    </div>
                                    <button
                                        className="btn-remove-fav"
                                        onClick={(e) => { e.stopPropagation(); removeFavorite(manga.id); }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="fav-info">
                                    <span className="fav-type">{manga.type}</span>
                                    <h3>{manga.title}</h3>
                                    <div className="fav-meta">
                                        <div className="meta-item"><Star size={12} fill="#FACC15" color="#FACC15" /> 4.8</div>
                                        <div className="meta-item"><BookOpen size={12} /> {manga.status}</div>
                                    </div>
                                    <button className="btn-read-now" onClick={() => navigate(`/manga/${manga.id}`)}>ABRIR OBRA</button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <style>{`
                .favorites-container { padding: 40px; }
                
                .page-header-premium { margin-bottom: 60px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 40px; }
                .header-content { display: flex; justify-content: space-between; align-items: flex-end; }
                .title-wrapper { display: flex; align-items: center; gap: 20px; }
                .header-icon { filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.4)); }
                .title-wrapper h1 { font-size: 36px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; margin-bottom: 8px; }
                .title-wrapper p { color: var(--text-dim); font-size: 16px; }
                
                .header-stats { display: flex; gap: 40px; }
                .stat-box { display: flex; flex-direction: column; align-items: flex-end; }
                .stat-box strong { font-size: 32px; font-weight: 900; color: var(--accent); line-height: 1; }
                .stat-box span { font-size: 12px; color: var(--text-dim); text-transform: uppercase; font-weight: 800; }

                .favorites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 30px; }
                
                .fav-card-premium { background: var(--bg-soft); border-radius: 20px; border: 1px solid rgba(255,255,255,0.03); overflow: hidden; transition: 0.3s; }
                .fav-card-premium:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                
                .fav-thumb { position: relative; aspect-ratio: 2/3; overflow: hidden; cursor: pointer; }
                .fav-thumb img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .fav-card-premium:hover .fav-thumb img { transform: scale(1.1); }
                
                .fav-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; opacity: 0; transition: 0.3s; }
                .fav-thumb:hover .fav-overlay { opacity: 1; }
                .fav-overlay span { font-size: 11px; font-weight: 900; letter-spacing: 1px; }
                
                .btn-remove-fav { position: absolute; top: 15px; right: 15px; z-index: 5; background: rgba(239, 68, 68, 0.9); border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; opacity: 0; transform: translateY(-10px); transition: 0.3s; }
                .fav-card-premium:hover .btn-remove-fav { opacity: 1; transform: translateY(0); }
                .btn-remove-fav:hover { background: #EF4444; transform: scale(1.1) !important; }

                .fav-info { padding: 20px; }
                .fav-type { font-size: 10px; font-weight: 900; color: var(--accent); text-transform: uppercase; margin-bottom: 8px; display: block; }
                .fav-info h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                
                .fav-meta { display: flex; gap: 15px; margin-bottom: 20px; }
                .meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: var(--text-dim); }
                
                .btn-read-now { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: white; padding: 10px; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .btn-read-now:hover { background: white; color: black; }

                .empty-state { text-align: center; padding: 100px 20px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .empty-state h3 { font-size: 24px; font-weight: 800; }
                .empty-state p { color: var(--text-dim); max-width: 400px; line-height: 1.6; }
                .btn-explore-now { margin-top: 10px; background: var(--accent); color: white; padding: 14px 30px; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none; transition: 0.3s; }
                .btn-explore-now:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.4); }

                @media (max-width: 768px) {
                    .favorites-grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
                    .page-header-premium { padding: 0 20px 30px; }
                    .header-stats { display: none; }
                }
            `}</style>
        </div>
    );
};

export default Favorites;
