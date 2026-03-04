import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, HardHat, Crown, Medal, Flame } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Gamification = () => {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/users/leaderboard`);
            setLeaderboard(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const { socket } = useSocket() || {};

    useEffect(() => {
        if (socket) {
            socket.on('user_updated', () => {
                console.log('[Socket] Leaderboard change detected, refetching...');
                fetchLeaderboard();
            });
            return () => socket.off('user_updated');
        }
    }, [socket, fetchLeaderboard]);

    if (loading) return <div className="loader"></div>;

    const top3 = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);

    // Reorder for visual podium: [2, 1, 3]
    const podiumData = [];
    if (top3[1]) podiumData.push(top3[1]);
    if (top3[0]) podiumData.push(top3[0]);
    if (top3[2]) podiumData.push(top3[2]);

    const getRankIcon = (index, isPodium) => {
        if (isPodium) {
            if (index === 1 && podiumData.length > 1) return <Crown className="crown-gold" size={40} />; // 1st Place (Middle)
            if (index === 0) return <Medal className="medal-silver" size={32} />; // 2nd Place (Left)
            return <Medal className="medal-bronze" size={32} />; // 3rd Place (Right)
        }
        return null;
    };

    const getRankClass = (originalRank) => {
        if (originalRank === 1) return 'rank-gold';
        if (originalRank === 2) return 'rank-silver';
        if (originalRank === 3) return 'rank-bronze';
        return '';
    };

    return (
        <div className="gamification-container">
            <header className="rank-header-premium">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="header-icon-box"
                >
                    <Trophy size={60} color="#FACC15" fill="#FACC15" />
                </motion.div>
                <h1>Ranking <span className="accent">Elite</span></h1>
                <p>Os lendários desbravadores da Mangabug.</p>
            </header>

            <div className="rank-main-content">
                <section className="podium-section">
                    {podiumData.map((user, i) => {
                        const originalRank = top3.indexOf(user) + 1;
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                                className={`podium-card ${getRankClass(originalRank)} pos-${i}`}
                            >
                                <div className="rank-number-float">#{originalRank}</div>
                                <div className="podium-decorator">
                                    {getRankIcon(i, true)}
                                </div>
                                <div className="podium-avatar-wrapper">
                                    <div className="podium-avatar">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="level-badge">LVL {user.level}</div>
                                </div>
                                <div className="podium-info" onClick={() => navigate(`/profile/${user.id}`)} style={{ cursor: 'pointer' }}>
                                    <h3>{user.username}</h3>
                                    <div className="xp-tag">
                                        <Zap size={12} fill="currentColor" />
                                        {user.xp + (user.level * 1000)} XP TOTAL
                                    </div>
                                </div>
                                <div className="podium-base"></div>
                            </motion.div>
                        );
                    })}
                </section>

                <section className="leaderboard-list-premium">
                    <div className="list-columns">
                        <span>POSIÇÃO</span>
                        <span>LEITOR</span>
                        <span>PONTUAÇÃO TOTAL</span>
                    </div>

                    <div className="rows-container">
                        {leaderboard.map((user, i) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className={`leaderboard-row-premium ${i < 3 ? 'row-top-highlight' : ''}`}
                            >
                                <div className="row-rank">#{i + 1}</div>
                                <div className="row-user-info" onClick={() => navigate(`/profile/${user.id}`)} style={{ cursor: 'pointer' }}>
                                    <div className="row-avatar-small">{user.username.charAt(0).toUpperCase()}</div>
                                    <div className="row-name-box">
                                        <span className="row-username">{user.username} <span className="row-title-tag">{user.title}</span></span>
                                        <span className="row-level">Nível {user.level}</span>
                                    </div>
                                </div>
                                <div className="row-score">
                                    <span className="xp-value">{user.xp + (user.level * 1000)}</span>
                                    <span className="xp-label">XP</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>

            <style>{`
                .gamification-container { padding: 60px 20px 120px; display: flex; flex-direction: column; align-items: center; max-width: 1200px; margin: 0 auto; }
                
                .rank-header-premium { text-align: center; margin-bottom: 100px; }
                .header-icon-box { margin-bottom: 24px; filter: drop-shadow(0 0 40px rgba(250, 204, 21, 0.4)); }
                .rank-header-premium h1 { font-size: 56px; font-weight: 900; letter-spacing: -3px; margin-bottom: 12px; text-transform: uppercase; font-style: italic; }
                .rank-header-premium p { color: var(--text-dim); font-size: 20px; font-weight: 500; }

                .rank-main-content { width: 100%; display: flex; flex-direction: column; gap: 40px; }

                /* Podium Styles */
                .podium-section { display: flex; align-items: flex-end; justify-content: center; gap: 0; min-height: 450px; margin-bottom: 40px; padding: 0 20px; }
                
                .podium-card { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 40px 24px; width: 280px; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .podium-card:hover { transform: translateY(-10px) scale(1.02); z-index: 20; }

                .podium-card.rank-gold { width: 320px; z-index: 15; order: 2; height: 100%; }
                .podium-card.rank-silver { order: 1; height: 85%; }
                .podium-card.rank-bronze { order: 3; height: 75%; }

                .podium-base { position: absolute; bottom: 0; left: 0; right: 0; height: 10px; border-radius: 20px 20px 0 0; }
                .rank-gold .podium-base { background: linear-gradient(90deg, #FACC15, #EAB308); height: 100%; z-index: -1; border-radius: 30px 30px 0 0; opacity: 0.15; border: 1px solid rgba(250, 204, 21, 0.2); }
                .rank-silver .podium-base { background: linear-gradient(90deg, #94A3B8, #64748B); height: 100%; z-index: -1; border-radius: 30px 30px 0 0; opacity: 0.1; border: 1px solid rgba(148, 163, 184, 0.1); }
                .rank-bronze .podium-base { background: linear-gradient(90deg, #D97706, #B45309); height: 100%; z-index: -1; border-radius: 30px 30px 0 0; opacity: 0.1; border: 1px solid rgba(217, 119, 6, 0.1); }

                .rank-number-float { position: absolute; top: -20px; font-size: 64px; font-weight: 900; opacity: 0.1; font-style: italic; pointer-events: none; }

                .podium-avatar-wrapper { position: relative; margin-bottom: 20px; }
                .podium-avatar { width: 100px; height: 100px; background: #161B22; border: 4px solid #30363D; border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 900; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
                .rank-gold .podium-avatar { width: 130px; height: 130px; border-color: #FACC15; font-size: 56px; }
                .rank-gold .crown-gold { filter: drop-shadow(0 0 15px #FACC15); margin-bottom: 10px; }
                .medal-silver { color: #94A3B8; }
                .medal-bronze { color: #D97706; }

                .level-badge { position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); background: var(--bg); border: 1px solid rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 900; color: white; white-space: nowrap; }

                .podium-info h3 { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: white; }
                .rank-gold h3 { font-size: 28px; }

                .xp-tag { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 900; color: var(--text-dim); background: rgba(255,255,255,0.03); padding: 6px 16px; border-radius: 100px; }
                .rank-gold .xp-tag { background: rgba(250, 204, 21, 0.1); color: #FACC15; }

                /* List Section */
                .leaderboard-list-premium { background: var(--bg-soft); border-radius: 32px; padding: 40px; border: 1px solid rgba(255,255,255,0.03); box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
                .list-columns { display: flex; padding: 0 30px 20px; font-size: 12px; font-weight: 900; color: var(--text-dim); letter-spacing: 2px; }
                .list-columns span:nth-child(2) { flex: 1; margin-left: 60px; }
                
                .rows-container { display: flex; flex-direction: column; gap: 8px; }
                .leaderboard-row-premium { display: flex; align-items: center; padding: 18px 30px; background: rgba(255,255,255,0.01); border-radius: 20px; transition: 0.2s; border: 1px solid transparent; }
                .leaderboard-row-premium:hover { background: rgba(139, 92, 246, 0.05); border-color: rgba(139, 92, 246, 0.1); transform: translateX(5px); }
                .row-top-highlight { background: rgba(250, 204, 21, 0.03); border-color: rgba(250, 204, 21, 0.1); }
                
                .row-rank { width: 40px; font-size: 15px; font-weight: 900; color: var(--text-dim); font-style: italic; }
                .row-user-info { flex: 1; display: flex; align-items: center; gap: 20px; margin-left: 40px; }
                .row-avatar-small { width: 44px; height: 44px; background: #161B22; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 2px solid rgba(255,255,255,0.05); }
                .row-name-box { display: flex; flex-direction: column; }
                .row-username { font-size: 16px; font-weight: 700; color: white; display: flex; align-items: center; gap: 8px; }
                .row-title-tag { font-size: 9px; background: rgba(139, 92, 246, 0.15); color: var(--accent); padding: 2px 8px; border-radius: 4px; font-weight: 900; text-transform: uppercase; }
                .row-level { font-size: 12px; color: var(--text-dim); }
                
                .row-score { text-align: right; display: flex; align-items: flex-end; gap: 5px; }
                .xp-value { font-size: 18px; font-weight: 900; color: var(--accent); }
                .xp-label { font-size: 11px; font-weight: 900; color: var(--text-dim); margin-bottom: 2px; }

                @media (max-width: 900px) {
                    .podium-section { flex-direction: column; align-items: center; height: auto; gap: 20px; }
                    .podium-card { width: 100% !important; height: auto !important; order: unset !important; }
                    .podium-base { height: 100% !important; border-radius: 24px !important; }
                    .rank-number-float { left: 20px; top: 10px; }
                }
            `}</style>
        </div>
    );
};

export default Gamification;
