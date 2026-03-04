import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Search, Filter, Star, Clock, ChevronRight, Grid, LayoutList } from 'lucide-react';
import { useWork } from '../context/WorkContext';
import { API_BASE_URL } from '../api/config';

const MangaListing = () => {
    const [mangas, setMangas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({
        type: 'Todos',
        status: 'Todos'
    });
    const navigate = useNavigate();

    const fetchWorks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/works`, {
                params: {
                    q: query,
                    type: filters.type,
                    status: filters.status
                }
            });
            setMangas(res.data);
        } catch (e) { console.error('Listing Fetch Error:', e); }
        setLoading(false);
    }, [query, filters]);

    useEffect(() => {
        const delaySearch = setTimeout(fetchWorks, 400);
        return () => clearTimeout(delaySearch);
    }, [fetchWorks]);

    const types = ['Todos', 'Mangá', 'Manhwa', 'Manhua'];
    const statuses = ['Todos', 'Em andamento', 'Completo'];

    return (
        <div className="listing-container">
            <header className="listing-header">
                <div className="header-left">
                    <div className="title-row">
                        <List size={28} color="var(--accent)" />
                        <h1>Catálogo <span className="accent">Completo</span></h1>
                    </div>
                    <p>Explore toda a nossa biblioteca premium</p>

                    <div className="listing-search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar obras..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="header-controls">
                    <div className="filter-group">
                        <span className="filter-label">TIPO</span>
                        <div className="type-filters">
                            {types.map(t => (
                                <button
                                    key={t}
                                    className={filters.type === t ? 'active' : ''}
                                    onClick={() => setFilters({ ...filters, type: t })}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">STATUS</span>
                        <div className="type-filters">
                            {statuses.map(s => (
                                <button
                                    key={s}
                                    className={filters.status === s ? 'active' : ''}
                                    onClick={() => setFilters({ ...filters, status: s })}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="view-toggle">
                        <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><Grid size={18} /></button>
                        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><LayoutList size={18} /></button>
                    </div>
                </div>
            </header>

            {loading && !mangas.length ? (
                <div className="loader"></div>
            ) : (
                <div className={`listing-results ${viewMode}`}>
                    <AnimatePresence mode="popLayout">
                        {mangas.map(manga => (
                            <motion.div
                                key={manga.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="list-item-premium"
                                onClick={() => navigate(`/manga/${manga.id}`)}
                            >
                                <div className="item-thumb">
                                    <img src={manga.cover_url && manga.cover_url.startsWith('http') ? manga.cover_url : `${API_BASE_URL}${manga.cover_url?.startsWith('/') ? manga.cover_url : `/${manga.cover_url || manga.cover || ''}`}`} alt="" />
                                    <div className="item-badge-type">{manga.type}</div>
                                </div>
                                <div className="item-details">
                                    <div className="detail-header">
                                        <h3>{manga.title}</h3>
                                        <div className="item-rating"><Star size={12} fill="#FACC15" color="#FACC15" /> {manga.rating || '4.5'}</div>
                                    </div>
                                    <p className="item-desc">{manga.description || 'Nenhuma descrição disponível para esta obra no momento.'}</p>
                                    <div className="item-footer">
                                        <span className={`status-pill ${manga.status?.toLowerCase().includes('andamento') ? 'ongoing' : 'done'}`}>{manga.status}</span>
                                        <div className="item-actions">
                                            <button className="btn-read-listing">ACESSAR OBRA</button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!loading && mangas.length === 0 && (
                        <div className="no-results">Nenhuma obra encontrada.</div>
                    )}
                </div>
            )}

            <style>{`
                .listing-container { padding: 40px; }
                
                .listing-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 50px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 30px; gap: 30px; }
                .title-row { display: flex; align-items: center; gap: 15px; margin-bottom: 5px; }
                .title-row h1 { font-size: 32px; font-weight: 900; letter-spacing: -1px; }
                .listing-header p { color: var(--text-dim); margin-bottom: 20px; }

                .listing-search-bar { background: #161B22; border: 1px solid #30363D; border-radius: 12px; display: flex; align-items: center; padding: 0 15px; gap: 10px; width: 100%; max-width: 400px; transition: 0.3s; }
                .listing-search-bar:focus-within { border-color: var(--accent); }
                .listing-search-bar input { background: transparent; border: none; color: white; padding: 12px 0; font-size: 14px; outline: none; width: 100%; }
                .listing-search-bar svg { color: var(--text-dim); }

                .header-controls { display: flex; gap: 30px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
                .filter-group { display: flex; flex-direction: column; gap: 8px; }
                .filter-label { font-size: 10px; font-weight: 900; color: var(--text-dim); letter-spacing: 1px; }

                .type-filters { display: flex; gap: 5px; background: rgba(255,255,255,0.03); padding: 5px; border-radius: 12px; }
                .type-filters button { background: transparent; border: none; color: var(--text-dim); padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .type-filters button.active { background: var(--accent); color: white; }

                .view-toggle { display: flex; gap: 5px; align-self: flex-end; }
                .view-toggle button { background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.1); color: var(--accent); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .view-toggle button.active { background: var(--accent); color: white; border-color: var(--accent); }

                .listing-results.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
                .listing-results.list { display: flex; flex-direction: column; gap: 20px; max-width: 1000px; margin: 0 auto; }

                .list-item-premium { background: var(--bg-soft); border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: 0.3s; display: flex; }
                .grid .list-item-premium { flex-direction: column; }
                .list-item-premium:hover { transform: translateY(-5px); border-color: var(--accent); box-shadow: 0 15px 30px rgba(0,0,0,0.3); }

                .item-thumb { position: relative; flex-shrink: 0; }
                .grid .item-thumb { width: 100%; padding-bottom: 150%; position: relative; }
                .list .item-thumb { width: 140px; height: 180px; }
                .item-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .list-item-premium:hover .item-thumb img { transform: scale(1.05); }
                .item-badge-type { position: absolute; top: 12px; left: 12px; z-index: 5; background: #0B0E14; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; }

                .item-details { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 12px; }
                .detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .detail-header h3 { font-size: 18px; font-weight: 800; color: white; }
                .item-rating { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 800; color: #FACC15; }

                .item-desc { color: var(--text-dim); font-size: 13px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .list .item-desc { -webkit-line-clamp: 3; }

                .item-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
                .status-pill { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
                .status-pill.ongoing { color: #F59E0B; }
                .status-pill.done { color: #10B981; }

                .no-results { grid-column: 1 / -1; text-align: center; padding: 100px 0; color: var(--text-dim); }

                .btn-read-listing { background: transparent; border: 1px solid rgba(255,255,255,0.08); color: white; padding: 8px 16px; border-radius: 10px; font-size: 11px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .list-item-premium:hover .btn-read-listing { background: var(--accent); border-color: var(--accent); }

                @media (max-width: 1024px) {
                    .listing-header { flex-direction: column; align-items: flex-start; gap: 30px; }
                    .header-controls { width: 100%; justify-content: flex-start; }
                }
            `}</style>
        </div>
    );
};

export default MangaListing;
