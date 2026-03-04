import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Award, Clock, BookOpen, Star, ChevronLeft, ShieldCheck, Zap, Trophy, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const PublicProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/users/profile/${id}`);
                setProfile(res.data);
            } catch (err) {
                setError(err.response?.data?.error || 'Erro ao carregar perfil');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="loader-container" style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
            <div className="loader"></div>
        </div>
    );

    if (error) return (
        <div className="error-view" style={{ padding: '100px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</h2>
            <h2 style={{ color: 'white' }}>{error}</h2>
            <button onClick={() => navigate(-1)} className="btn-premium" style={{ marginTop: '30px' }}>VOLTAR</button>
        </div>
    );

    const getXpProgress = (xp, level) => {
        const nextXp = level < 10 ? 100 * level : level < 20 ? 200 * level : 300 * level;
        return Math.min(100, (xp / nextXp) * 100);
    };

    const getStatus = (lastActive) => {
        const now = new Date();
        const active = new Date(lastActive);
        const diff = (now - active) / (1000 * 60 * 60);

        if (diff < 24) return { label: 'Ativo hoje', color: '#10B981' };
        if (diff < 24 * 7) return { label: 'Ativo recentemente', color: '#FACC15' };
        return { label: 'Inativo', color: '#666' };
    };

    const status = getStatus(profile.last_active_at);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="public-profile-container"
        >
            <button onClick={() => navigate(-1)} className="back-btn-profile">
                <ChevronLeft size={20} /> VOLTAR
            </button>

            <header className="profile-hero-premium">
                <div className="hero-content">
                    <div className="avatar-wrapper-public">
                        <img
                            src={profile.avatar_url ? `${API_BASE_URL}${profile.avatar_url}` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                            alt={profile.username}
                        />
                        {profile.rank <= 50 && (
                            <div className="elite-badge">TOP {profile.rank}</div>
                        )}
                    </div>

                    <div className="user-meta-public">
                        <div className="user-header-row">
                            <h1>{profile.username}</h1>
                            <span className="user-title-tag">{profile.title}</span>
                        </div>

                        <div className="level-xp-section">
                            <div className="level-box">
                                <Zap size={16} fill="#FACC15" color="#FACC15" />
                                <span>Nível {profile.level}</span>
                            </div>
                            <div className="xp-bar-container">
                                <div className="xp-bar-fill" style={{ width: `${getXpProgress(profile.xp, profile.level)}%` }}></div>
                                <span className="xp-text">{profile.xp} XP</span>
                            </div>
                        </div>

                        <div className="status-badges-row">
                            <div className="status-indicator">
                                <span className="dot" style={{ background: status.color }}></span>
                                {status.label}
                            </div>
                            <div className="rank-indicator">
                                <Trophy size={14} color="#FFD700" />
                                Rank #{profile.rank}
                            </div>
                            <div className="join-date">
                                <Calendar size={14} />
                                Desde {new Date(profile.created_at).getFullYear()}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="profile-layout-grid-public">
                <section className="recent-reads-section-public">
                    <div className="section-header-public">
                        <BookOpen size={20} color="var(--accent)" />
                        <h2>Últimas <span className="accent">Leituras</span></h2>
                    </div>

                    <div className="recent-reads-list-public">
                        {profile.recent_reads.length > 0 ? (
                            profile.recent_reads.map((read, i) => (
                                <motion.div
                                    key={read.work_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="read-item-card-public"
                                    onClick={() => navigate(`/manga/${read.work_id}`)}
                                >
                                    <div className="read-thumb-public">
                                        <img src={read.cover_url && read.cover_url.startsWith('http') ? read.cover_url : `${API_BASE_URL}${read.cover_url?.startsWith('/') ? read.cover_url : `/${read.cover_url || ''}`}`} alt="" />
                                    </div>
                                    <div className="read-info-public">
                                        <h3>{read.title}</h3>
                                        <div className="read-stats-public">
                                            <div className="progress-mini-bar">
                                                <div className="progress-mini-fill" style={{ width: `${read.progress}%` }}></div>
                                            </div>
                                            <span>{read.progress}% concluído</span>
                                        </div>
                                    </div>
                                    <button className="read-action-btn">LER AGORA</button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="empty-reads">
                                <p>Este usuário ainda não iniciou nenhuma obra.</p>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="profile-stats-sidebar-public">
                    <div className="stats-card-public">
                        <div className="stat-box-public">
                            <Star size={24} color="#FFD700" />
                            <div className="stat-val">{profile.stats.total_favorites}</div>
                            <div className="stat-label">Favoritos</div>
                        </div>
                        <div className="stat-box-public">
                            <Award size={24} color="var(--accent)" />
                            <div className="stat-val">{profile.stats.total_chapters}</div>
                            <div className="stat-label">Capítulos Lidos</div>
                        </div>
                    </div>

                    <div className="privacy-info-premium">
                        <ShieldCheck size={16} color="#10B981" />
                        <span>Perfil Protegido Mangabug</span>
                    </div>
                </aside>
            </div>

            <style>{`
                .public-profile-container { padding: 40px; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }
                .back-btn-profile { background: none; border: none; color: var(--text-dim); display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13px; cursor: pointer; margin-bottom: -20px; transition: 0.3s; width: fit-content; }
                .back-btn-profile:hover { color: white; transform: translateX(-5px); }

                .profile-hero-premium { background: var(--bg-soft); padding: 50px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05); position: relative; overflow: hidden; }
                .profile-hero-premium::after {
                    content: '';
                    position: absolute;
                    top: 0; right: 0;
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%);
                    opacity: 0.1;
                }

                .hero-content { display: flex; align-items: center; gap: 40px; position: relative; z-index: 1; }
                .avatar-wrapper-public { position: relative; }
                .avatar-wrapper-public img { width: 150px; height: 150px; border-radius: 40px; object-fit: cover; border: 4px solid #1a1d23; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
                .elite-badge { position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); background: #FFD700; color: black; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 900; box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4); white-space: nowrap; }

                .user-meta-public { display: flex; flex-direction: column; gap: 15px; }
                .user-header-row { display: flex; align-items: center; gap: 15px; }
                .user-header-row h1 { font-size: 40px; font-weight: 900; letter-spacing: -1.5px; }
                .user-title-tag { background: var(--accent-soft); color: var(--accent); padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; }

                .level-xp-section { display: flex; align-items: center; gap: 20px; margin-top: 5px; }
                .level-box { background: #1a1d23; padding: 8px 15px; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; border: 1px solid rgba(255,255,255,0.05); }
                .xp-bar-container { height: 12px; width: 250px; background: #1a1d23; border-radius: 100px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.03); }
                .xp-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #A78BFA); border-radius: 100px; }
                .xp-text { position: absolute; right: 10px; top: -18px; font-size: 11px; font-weight: 800; color: var(--text-dim); }

                .status-badges-row { display: flex; align-items: center; gap: 20px; margin-top: 10px; }
                .status-indicator, .rank-indicator, .join-date { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-dim); }
                .dot { width: 8px; height: 8px; border-radius: 50%; }

                .profile-layout-grid-public { display: grid; grid-template-columns: 1fr 320px; gap: 40px; }
                .section-header-public { display: flex; align-items: center; gap: 12px; margin-bottom: 30px; }
                .section-header-public h2 { font-size: 22px; font-weight: 800; }

                .recent-reads-list-public { display: flex; flex-direction: column; gap: 20px; }
                .read-item-card-public { background: var(--bg-soft); padding: 15px; border-radius: 20px; display: flex; align-items: center; gap: 20px; border: 1px solid rgba(255,255,255,0.03); cursor: pointer; transition: 0.3s; }
                .read-item-card-public:hover { background: rgba(255,255,255,0.05); transform: translateX(10px); border-color: var(--accent-soft); }
                .read-thumb-public img { width: 60px; height: 85px; border-radius: 10px; object-fit: cover; }
                
                .read-info-public { flex: 1; display: flex; flex-direction: column; gap: 8px; }
                .read-info-public h3 { font-size: 16px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
                .read-stats-public { display: flex; align-items: center; gap: 15px; }
                .progress-mini-bar { flex: 1; height: 6px; background: #1a1d23; border-radius: 100px; overflow: hidden; }
                .progress-mini-fill { height: 100%; background: var(--accent); border-radius: 100px; }
                .read-stats-public span { font-size: 11px; font-weight: 800; color: var(--text-dim); min-width: 90px; }

                .read-action-btn { background: rgba(139, 92, 246, 0.1); border: 1px solid var(--accent-soft); color: var(--accent); padding: 8px 16px; border-radius: 10px; font-size: 11px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .read-item-card-public:hover .read-action-btn { background: var(--accent); color: white; }

                .profile-stats-sidebar-public { display: flex; flex-direction: column; gap: 30px; }
                .stats-card-public { background: var(--bg-soft); padding: 25px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 20px; }
                .stat-box-public { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 15px; background: #1a1d23; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03); }
                .stat-val { font-size: 24px; font-weight: 900; color: white; }
                .stat-label { font-size: 11px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }

                .privacy-info-premium { display: flex; align-items: center; gap: 10px; padding: 15px; justify-content: center; background: rgba(16, 185, 129, 0.05); border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.1); font-size: 12px; font-weight: 800; color: #10B981; }

                @media (max-width: 1024px) {
                    .profile-layout-grid-public { grid-template-columns: 1fr; }
                    .hero-content { flex-direction: column; text-align: center; gap: 25px; }
                    .user-header-row { justify-content: center; }
                    .level-xp-section { flex-direction: column; gap: 10px; }
                    .status-badges-row { flex-direction: column; gap: 10px; }
                    .xp-bar-container { width: 100%; }
                    .read-info-public h3 { max-width: 150px; }
                    .read-item-card-public { flex-wrap: wrap; }
                    .read-action-btn { width: 100%; margin-top: 10px; }
                    .public-profile-container { padding: 20px; }
                }
            `}</style>
        </motion.div>
    );
};

export default PublicProfile;
