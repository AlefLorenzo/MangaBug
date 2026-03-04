import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Compass, Zap, Flame, Sparkles, Star, ChevronRight, Layout, Dice5, Brain, Trophy, Moon } from 'lucide-react';
import { useWork } from '../context/WorkContext';
import { useUser } from '../context/UserAuthContext';
import { API_BASE_URL } from '../api/config';

const Explore = () => {
    const { works: allWorks, loading } = useWork();
    const [filteredWorks, setFilteredWorks] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [isFiltering, setIsFiltering] = useState(false);
    const navigate = useNavigate();

    const { user } = useUser();
    const [dynamicCategories, setDynamicCategories] = useState([]);
    const [cardStartTime, setCardStartTime] = useState(Date.now());

    const genres = [
        'Ação', 'Aventura', 'Fantasia', 'Romance', 'Comédia', 'Drama', 'Mistério',
        'Sobrenatural', 'Terror', 'Sci-fi', 'Esportes', 'Histórico', 'Psicológico',
        'Escolar', 'Seinen', 'Shounen', 'Shoujo', 'Isekai', 'Cyberpunk', 'Mecha'
    ];

    useEffect(() => {
        if (selectedTags.length === 0) {
            setFilteredWorks(allWorks);
            return;
        }

        const applyFilter = async () => {
            setIsFiltering(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/works?tags=${selectedTags.join(',')}`);
                setFilteredWorks(res.data);
            } catch (err) { console.error('Filter Error:', err); }
            setIsFiltering(false);
        };

        const timeoutId = setTimeout(applyFilter, 300);
        return () => clearTimeout(timeoutId);
    }, [selectedTags, allWorks]);

    if (loading) return <div className="loader"></div>;

    const categoryPool = [
        { id: 'premium', title: 'Destaques Premium', icon: Sparkles, color: '#FFD700' },
        { id: 'new', title: 'Recém Chegados', icon: Zap, color: '#FACC15' },
        { id: 'popular', title: 'Mais Lidos', icon: Flame, color: '#FF4D4D' },
        { id: 'random', title: 'Não sabe o que ler?', icon: Dice5, color: '#8B5CF6' },
        { id: 'recommended', title: 'Baseado no que você leu', icon: Brain, color: '#EC4899' },
        { id: 'progress', title: 'Seu progresso hoje', icon: Trophy, color: '#10B981' },
        { id: 'time', title: 'Leitura para agora', icon: Moon, color: '#3B82F6' }
    ];

    useEffect(() => {
        if (!allWorks || allWorks.length === 0) return;

        const loadDynamicCards = () => {
            const now = Date.now();
            const stored = JSON.parse(localStorage.getItem('mb_explore_cards') || '{}');
            const metrics = JSON.parse(localStorage.getItem('mb_card_metrics') || '{}');

            let activeIds = stored.activeIds || ['premium', 'new', 'popular'];

            // Rotation Logic: 24h or Priority based on CTR
            if (!stored.lastRotation || now - stored.lastRotation > 24 * 60 * 60 * 1000) {
                const sortedByCTR = [...categoryPool].sort((a, b) => {
                    const ctrA = parseFloat(metrics[a.id]?.ctr) || 0;
                    const ctrB = parseFloat(metrics[b.id]?.ctr) || 0;
                    return ctrB - ctrA;
                });

                activeIds = sortedByCTR.slice(0, 3).map(c => c.id);
                localStorage.setItem('mb_explore_cards', JSON.stringify({ activeIds, lastRotation: now }));
            }

            // User Profile Adaptation
            if (user && !activeIds.includes('recommended')) {
                activeIds[2] = 'recommended';
            } else if (!user && activeIds.includes('recommended')) {
                activeIds[2] = 'random';
            }

            const selection = activeIds.map(id => categoryPool.find(c => c.id === id)).filter(Boolean);
            setDynamicCategories(selection);

            // Record Impressions
            activeIds.forEach(id => {
                const m = metrics[id] || { impressions: 0, clicks: 0, totalTime: 0 };
                m.impressions++;
                metrics[id] = m;
            });
            localStorage.setItem('mb_card_metrics', JSON.stringify(metrics));
            setCardStartTime(Date.now());
        };

        loadDynamicCards();
    }, [allWorks, user]);

    const recordMetric = (id) => {
        const clickTime = (Date.now() - cardStartTime) / 1000;
        const metrics = JSON.parse(localStorage.getItem('mb_card_metrics') || '{}');
        const m = metrics[id] || { impressions: 1, clicks: 0, totalTime: 0 };

        m.clicks++;
        m.totalTime = (m.totalTime || 0) + clickTime;
        m.ctr = ((m.clicks / m.impressions) * 100).toFixed(0) + '%';
        m.avgClickTime = (m.totalTime / m.clicks).toFixed(1) + 's';

        metrics[id] = m;
        localStorage.setItem('mb_card_metrics', JSON.stringify(metrics));
    };

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleCategoryClick = (catId) => {
        recordMetric(catId);
        switch (catId) {
            case 'premium':
            case 'new':
            case 'popular':
            case 'recommended':
                navigate('/listing');
                break;
            case 'random':
                if (allWorks.length > 0) {
                    const randomWork = allWorks[Math.floor(Math.random() * allWorks.length)];
                    navigate(`/manga/${randomWork.id}`);
                }
                break;
            case 'progress':
                navigate('/history');
                break;
            case 'time':
                document.getElementById('available-works')?.scrollIntoView({ behavior: 'smooth' });
                break;
            default:
                break;
        }
    };

    return (
        <div className="explore-container">
            <header className="page-header-premium">
                <div className="title-wrapper">
                    <Compass className="header-icon" color="var(--accent)" size={32} />
                    <div>
                        <h1>Nova <span className="accent">Descoberta</span></h1>
                        <p>Navegue pela biblioteca de elite Mangabug</p>
                    </div>
                </div>
            </header>

            <section className="categories-grid-premium">
                {dynamicCategories.map((cat, i) => (
                    <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -5 }}
                        className="category-card"
                        style={{ borderBottom: `4px solid ${cat.color}` }}
                        onClick={() => handleCategoryClick(cat.id)}
                    >
                        <cat.icon size={26} color={cat.color} />
                        <h3>{cat.title}</h3>
                        <p>
                            {cat.id === 'recommended' ? 'Obras que combinam com seu estilo único.' :
                                cat.id === 'progress' ? 'Veja até onde você chegou nas suas leituras.' :
                                    'Veja as melhores escolhas dos nossos especialistas.'}
                        </p>
                        <button className="btn-explore-cat">VER AGORA</button>
                    </motion.div>
                ))}
            </section>

            <section className="genres-section">
                <div className="section-header">
                    <h2>Gêneros <span className="accent">Profissionais</span></h2>
                    {selectedTags.length > 0 && (
                        <button className="clear-filter" onClick={() => setSelectedTags([])}>Limpar Filtros</button>
                    )}
                </div>
                <div className="genres-pills">
                    {genres.map(g => (
                        <button
                            key={g}
                            className={`genre-pill ${selectedTags.includes(g) ? 'active' : ''}`}
                            onClick={() => toggleTag(g)}
                        >
                            #{g}
                        </button>
                    ))}
                </div>
            </section>

            <section className="all-mangas-section" id="available-works">
                <div className="section-header">
                    <h2>
                        {selectedTags.length > 0 ? `Obras com: ${selectedTags.join(', ')}` : 'Obras Disponíveis'}
                    </h2>
                    <Link to="/listing" className="view-catalog">IR PARA O CATÁLOGO <ChevronRight size={16} /></Link>
                </div>

                {isFiltering ? (
                    <div className="filter-loading">Buscando obras...</div>
                ) : (
                    <div className="explore-manga-grid">
                        {filteredWorks.length > 0 ? (
                            filteredWorks.map(manga => (
                                <div key={manga.id} className="explore-item" onClick={() => navigate(`/manga/${manga.id}`)}>
                                    <div className="explore-thumb">
                                        <img src={manga.cover_url && manga.cover_url.startsWith('http') ? manga.cover_url : `${API_BASE_URL}${manga.cover_url?.startsWith('/') ? manga.cover_url : `/${manga.cover_url || manga.cover || ''}`}`} alt="" />
                                        <div className="explore-meta-badge">
                                            <Star size={10} fill="white" /> {manga.rating || '4.8'}
                                        </div>
                                    </div>
                                    <h3>{manga.title}</h3>
                                    <p>{manga.type}</p>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">Nenhuma obra encontrada com esses critérios.</div>
                        )}
                    </div>
                )}
            </section>

            <style>{`
                .explore-container { padding: 40px; display: flex; flex-direction: column; gap: 60px; }
                .page-header-premium { margin-bottom: 20px; }
                .title-wrapper { display: flex; align-items: center; gap: 20px; }
                .title-wrapper h1 { font-size: 36px; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 8px; }
                .title-wrapper p { color: var(--text-dim); }

                .categories-grid-premium { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 10px; }
                .category-card { 
                    background: var(--bg-soft); 
                    padding: 35px; 
                    border-radius: 24px; 
                    border: 1px solid rgba(255,255,255,0.03); 
                    display: flex; 
                    flex-direction: column; 
                    gap: 15px; 
                    cursor: pointer; 
                    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
                    position: relative; 
                    overflow: hidden; 
                    border-bottom: 4px solid var(--accent);
                }
                .category-card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.06); }
                .category-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
                    opacity: 0;
                    transition: 0.5s;
                }
                .category-card:hover::before { opacity: 1; }
                .category-card * { position: relative; z-index: 1; }
                .category-card h3 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
                .category-card p { font-size: 14px; color: var(--text-dim); line-height: 1.5; }
                .btn-explore-cat { align-self: flex-start; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 20px; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; margin-top: auto; }
                .category-card:hover .btn-explore-cat { background: white; color: black; transform: scale(1.05); }

                .genres-pills { display: flex; flex-wrap: wrap; gap: 12px; }
                .genre-pill { background: #161B22; border: 1px solid #30363D; color: var(--text-dim); padding: 10px 24px; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.3s; }
                .genre-pill:hover, .genre-pill.active { border-color: var(--accent); color: white; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); }
                .genre-pill.active { background: var(--accent-soft); }
                
                .clear-filter { background: none; border: none; color: var(--accent); font-weight: 800; font-size: 13px; cursor: pointer; text-transform: uppercase; }
                .filter-loading, .no-results { grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim); font-size: 16px; }

                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .section-header h2 { font-size: 24px; font-weight: 800; }
                .view-catalog { color: var(--text-dim); text-decoration: none; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; }

                .explore-manga-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 24px; }
                .explore-item { cursor: pointer; display: block; min-width: 0; }
                .explore-thumb { position: relative; border-radius: 16px; overflow: hidden; width: 100%; padding-bottom: 150%; margin-bottom: 12px; background: #161B22; }
                .explore-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .explore-item:hover .explore-thumb img { transform: scale(1.1); }
                .explore-meta-badge { position: absolute; top: 10px; right: 10px; z-index: 5; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 5px; }
                .explore-item h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
                .explore-item p { font-size: 12px; color: var(--text-dim); }

                @media (max-width: 1024px) {
                    .categories-grid-premium { 
                        display: flex; 
                        overflow-x: auto; 
                        scroll-snap-type: x mandatory; 
                        gap: 20px; 
                        padding: 10px 10px 30px;
                        margin-left: -40px;
                        margin-right: -40px;
                        padding-left: 40px;
                        padding-right: 40px;
                        scrollbar-width: none;
                    }
                    .categories-grid-premium::-webkit-scrollbar { display: none; }
                    .category-card { 
                        min-width: 280px; 
                        scroll-snap-align: center; 
                        padding: 30px;
                        height: 220px;
                        flex-shrink: 0;
                    }
                    .btn-explore-cat { align-self: stretch; text-align: center; }
                    .explore-manga-grid { grid-template-columns: repeat(3, 1fr); }
                }
            `}</style>
        </div>
    );
};

export default Explore;
