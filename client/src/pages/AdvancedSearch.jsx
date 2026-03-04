import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, SlidersHorizontal, Star, MessageCircle, Clock, Zap } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const AdvancedSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        type: 'Todos',
        status: 'Todos',
        genre: []
    });
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            // Map 'genre' to 'tags' for the unified backend
            const res = await axios.get(`${API_BASE_URL}/api/works`, {
                params: {
                    q: query,
                    type: filters.type,
                    status: filters.status,
                    tags: filters.genre.join(',')
                }
            });
            setResults(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            handleSearch();
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [query, filters]);

    const types = ['Todos', 'Mangá', 'Manhwa', 'Manhua'];
    const statuses = ['Todos', 'Em andamento', 'Completo'];

    return (
        <div className="search-container">
            <div className="search-header-premium">
                <div className="search-bar-wrapper">
                    <Search className="search-icon" size={24} />
                    <input
                        type="text"
                        placeholder="Pesquisar por obras, autores ou artistas..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="search-shortcut">⌘ K</div>
                </div>
            </div>

            <div className="search-content-grid">
                <aside className="search-filters">
                    <div className="filter-group">
                        <div className="filter-label"><Filter size={14} /> TIPO DE OBRA</div>
                        <div className="filter-options">
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
                        <div className="filter-label"><Zap size={14} /> STATUS</div>
                        <div className="filter-options">
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
                </aside>

                <main className="search-results-main">
                    <div className="results-info">
                        <h2>Explorar <span className="accent">Biblioteca</span></h2>
                        <p>{results.length} resultados encontrados</p>
                    </div>

                    <div className="results-grid">
                        {results.map(manga => (
                            <div key={manga.id} className="search-result-card" onClick={() => navigate(`/manga/${manga.id}`)}>
                                <div className="card-thumb">
                                    <img src={manga.cover_url && manga.cover_url.startsWith('http') ? manga.cover_url : `${API_BASE_URL}${manga.cover_url?.startsWith('/') ? manga.cover_url : `/${manga.cover_url || manga.cover || ''}`}`} alt="" />
                                    <div className="card-overlay">
                                        <button className="btn-quick-read">LER AGORA</button>
                                    </div>
                                </div>
                                <div className="card-details">
                                    <span className={`badge-type ${manga.type.toLowerCase()}`}>{manga.type}</span>
                                    <h3>{manga.title}</h3>
                                    <div className="manga-meta">
                                        <span><Star size={12} fill="#FACC15" color="#FACC15" /> {manga.rating || '4.5'}</span>
                                        <span className="dot">•</span>
                                        <span><Clock size={12} /> {manga.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            <style>{`
                .search-container { padding-bottom: 50px; }
                
                .search-header-premium { margin-bottom: 50px; }
                .search-bar-wrapper { position: relative; background: #161B22; border: 1px solid #30363D; border-radius: 20px; padding: 5px; display: flex; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); transition: 0.3s; }
                .search-bar-wrapper:focus-within { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 15px 40px rgba(139, 92, 246, 0.2); }
                .search-icon { color: var(--text-dim); margin: 0 20px; }
                .search-bar-wrapper input { flex: 1; background: transparent; border: none; color: white; padding: 15px 0; font-size: 18px; outline: none; }
                .search-shortcut { padding: 4px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text-dim); font-size: 12px; font-weight: 800; margin-right: 15px; }

                .search-content-grid { display: grid; grid-template-columns: 240px 1fr; gap: 40px; }
                
                .search-filters { position: sticky; top: 100px; height: fit-content; display: flex; flex-direction: column; gap: 30px; }
                .filter-label { font-size: 11px; font-weight: 900; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
                .filter-options { display: flex; flex-direction: column; gap: 8px; }
                .filter-options button { text-align: left; background: transparent; border: 1px solid transparent; color: var(--text-dim); padding: 10px 15px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
                .filter-options button:hover { background: rgba(255,255,255,0.03); color: white; }
                .filter-options button.active { background: var(--accent-soft); color: var(--accent); border-color: rgba(139, 92, 246, 0.1); }

                .results-info { margin-bottom: 30px; }
                .results-info h2 { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
                .results-info p { color: var(--text-dim); font-size: 14px; margin-top: 5px; }

                .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 30px; }
                .search-result-card { cursor: pointer; }
                .card-thumb { position: relative; border-radius: 16px; overflow: hidden; aspect-ratio: 2/3; margin-bottom: 15px; }
                .card-thumb img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .search-result-card:hover .card-thumb img { transform: scale(1.1); }
                .card-overlay { position: absolute; inset: 0; background: rgba(11, 14, 20, 0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
                .search-result-card:hover .card-overlay { opacity: 1; }
                .btn-quick-read { background: white; color: black; border: none; padding: 10px 20px; border-radius: 10px; font-size: 11px; font-weight: 900; transform: translateY(10px); transition: 0.3s; }
                .search-result-card:hover .btn-quick-read { transform: translateY(0); }

                .card-details h3 { font-size: 15px; font-weight: 700; margin: 8px 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .manga-meta { display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 12px; }
                .badge-type { font-size: 10px; font-weight: 900; background: var(--accent-soft); color: var(--accent); padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }

                @media (max-width: 1024px) {
                    .search-content-grid { grid-template-columns: 1fr; }
                    .search-filters { display: none; }
                    .results-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
                }
            `}</style>
        </div>
    );
};

export default AdvancedSearch;
