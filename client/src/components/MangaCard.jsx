import { useNavigate } from 'react-router-dom';
import { Star, Heart, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWork } from '../context/WorkContext';
import { useNotification } from '../context/NotificationContext';
import { API_BASE_URL } from '../api/config';

const MangaCard = ({ manga }) => {
    const navigate = useNavigate();
    const { favorites, toggleFavorite } = useWork();
    const { addNotification } = useNotification();

    const isFavorited = favorites.some(f => f.id === manga.id);

    const handleFavorite = (e) => {
        e.stopPropagation();
        toggleFavorite(manga.id);
        addNotification(
            isFavorited ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
            isFavorited ? 'info' : 'success'
        );
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="manga-card-wrapper"
            onClick={() => navigate(`/manga/${manga.id}`)}
        >
            <div className="manga-card">
                <img
                    src={manga.cover_url && manga.cover_url.startsWith('http')
                        ? manga.cover_url
                        : (manga.cover_url || manga.cover
                            ? `${API_BASE_URL}${manga.cover_url?.startsWith('/') ? manga.cover_url : `/${manga.cover_url || manga.cover || ''}`}`
                            : 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400')}
                    alt={manga.title}
                    loading="lazy"
                />

                {/* 🎭 Labels & Badges */}
                <div className="card-badges">
                    <span className="badge-rating">
                        <Star size={10} fill="var(--accent-orange)" />
                        {manga.rating || '4.5'}
                    </span>
                    {manga.status && (
                        <span className={`badge-status ${manga.status === 'Completo' ? 'done' : 'active'}`}>
                            {manga.status}
                        </span>
                    )}
                </div>

                <button
                    className={`card-fav-btn ${isFavorited ? 'active' : ''}`}
                    onClick={handleFavorite}
                >
                    <Heart size={16} fill={isFavorited ? 'var(--error)' : 'none'} />
                </button>
            </div>

            <div className="card-info">
                <h3 className="card-title">{manga.title}</h3>
                <div className="card-meta">
                    <span className="card-author">{manga.author || 'Autor Desconhecido'}</span>
                    <span className="card-type">{manga.type}</span>
                </div>
            </div>

            <style>{`
                .manga-card { position: relative; width: 100%; aspect-ratio: 2/3; border-radius: var(--radius); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); }
                .manga-card img { width: 100%; height: 100%; object-fit: cover; transition: var(--transition); }
                .manga-card:hover img { transform: scale(1.05); }
                
                .card-badges { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 6px; pointer-events: none; }
                .badge-rating, .badge-status { 
                    background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); padding: 4px 8px; border-radius: 6px; 
                    font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,0.05);
                }
                .badge-rating { color: var(--accent-orange); }
                .badge-status.active { color: var(--accent-blue); }
                .badge-status.done { color: var(--success); }

                .card-fav-btn {
                    position: absolute; bottom: 10px; right: 10px; 
                    width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.7); 
                    backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.05); 
                    color: white; display: flex; align-items: center; justify-content: center; 
                    cursor: pointer; transition: var(--transition);
                }
                .card-fav-btn:hover { transform: scale(1.1); background: rgba(0,0,0,0.9); }
                .card-fav-btn.active { color: var(--error); border-color: rgba(248, 81, 73, 0.3); }

                .card-title { margin-top: 12px; font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white; }
                .card-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
                .card-author, .card-type { font-size: 11px; color: var(--text-dim); font-weight: 600; }
                .card-type { color: var(--accent); opacity: 0.8; }
            `}</style>
        </motion.div>
    );
};

export default MangaCard;
