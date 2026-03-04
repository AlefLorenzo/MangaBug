import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Info, TrendingUp, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../api/config';

const Banner = ({ banners = [] }) => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (!banners || banners.length === 0) return (
        <div className="banner-skeleton" style={{ height: '480px', background: 'rgba(255,255,255,0.03)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="premium-spinner"></div>
        </div>
    );

    const currentBanner = banners[currentIndex];
    const bannerImageUrl = currentBanner.image_url.startsWith('http')
        ? currentBanner.image_url
        : `${API_BASE_URL}${currentBanner.image_url}`;

    return (
        <div className="banner-premium-wrapper">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBanner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="banner-slide"
                >
                    <div
                        className="banner-background"
                        style={{
                            backgroundImage: `url(${bannerImageUrl})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center 20%'
                        }}
                    >
                        <div className="banner-overlay-premium">
                            <div className="banner-content-premium">
                                <div className="banner-badges-row">
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="banner-badge trending">
                                        <TrendingUp size={14} /> DESTAQUE
                                    </motion.div>
                                </div>

                                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="banner-title-premium">
                                    {currentBanner.title || 'MangaBug Special'}
                                </motion.h1>

                                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="banner-description-premium">
                                    {currentBanner.subtitle || "Confira a obra selecionada pela nossa equipe administrativa para hoje."}
                                </motion.p>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="banner-actions-premium">
                                    {currentBanner.work_id && (
                                        <button className="btn-banner-play" onClick={() => navigate(`/manga/${currentBanner.work_id}`)}>
                                            <Play size={20} fill="white" /> LER AGORA
                                        </button>
                                    )}
                                    <button className="btn-banner-info" onClick={() => navigate(currentBanner.work_id ? `/manga/${currentBanner.work_id}` : '/explore')}>
                                        <Info size={20} /> EXPLORAR
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Slider Navigation */}
            {banners.length > 1 && (
                <div className="slider-controls-premium">
                    <div className="slider-dots">
                        {banners.map((_, i) => (
                            <div key={i} className={`slider-dot ${currentIndex === i ? 'active' : ''}`} onClick={() => setCurrentIndex(i)} />
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .banner-premium-wrapper { 
                    width: 100%; border-radius: 32px; overflow: hidden; 
                    margin-bottom: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255,255,255,0.08); background: #0b0b0f;
                    position: relative;
                }
                .banner-slide { width: 100%; }
                .banner-background { height: 480px; width: 100%; position: relative; }
                
                .banner-overlay-premium { 
                    position: absolute; inset: 0; 
                    background: linear-gradient(to right, #0b0b0f 15%, rgba(11, 11, 15, 0.8) 40%, rgba(11, 11, 15, 0) 80%);
                    display: flex; align-items: center; padding: 0 60px;
                }

                .banner-content-premium { max-width: 650px; }
                
                .banner-badges-row { display: flex; gap: 12px; margin-bottom: 25px; }
                .banner-badge { 
                    display: flex; align-items: center; gap: 8px; padding: 8px 16px; 
                    background: var(--accent-soft); backdrop-filter: blur(12px); 
                    border-radius: 12px; font-size: 13px; font-weight: 800;
                    border: 1px solid var(--accent); color: var(--accent);
                }

                .banner-title-premium { 
                    font-size: 52px; font-weight: 900; line-height: 1.1; 
                    margin-bottom: 18px; color: white; letter-spacing: -2px;
                    text-transform: uppercase;
                }

                .banner-description-premium { 
                    font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.6); 
                    margin-bottom: 40px; display: -webkit-box; -webkit-line-clamp: 3; 
                    -webkit-box-orient: vertical; overflow: hidden;
                }

                .banner-actions-premium { display: flex; gap: 20px; }
                
                .btn-banner-play { 
                    background: var(--accent); color: white; border: none; 
                    padding: 16px 40px; border-radius: 16px; font-size: 15px; 
                    font-weight: 900; cursor: pointer; display: flex; align-items: center; 
                    gap: 12px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.5);
                }
                .btn-banner-play:hover { transform: translateY(-3px); box-shadow: 0 15px 30px -5px rgba(139, 92, 246, 0.7); }
                
                .btn-banner-info { 
                    background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); 
                    padding: 16px 30px; border-radius: 16px; font-size: 15px; 
                    font-weight: 900; cursor: pointer; display: flex; align-items: center; 
                    gap: 10px; transition: 0.3s; backdrop-filter: blur(10px);
                }
                .btn-banner-info:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

                .slider-controls-premium { position: absolute; bottom: 30px; left: 60px; z-index: 10; }
                .slider-dots { display: flex; gap: 10px; }
                .slider-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.2); cursor: pointer; transition: 0.3s; }
                .slider-dot.active { background: var(--accent); width: 30px; border-radius: 10px; box-shadow: 0 0 15px var(--accent); }

                .premium-spinner { width: 20px; height: 20px; border: 2px solid rgba(139, 92, 246, 0.1); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 1024px) {
                    .banner-title-premium { font-size: 42px; }
                    .banner-overlay-premium { padding: 0 40px; }
                    .slider-controls-premium { left: 40px; }
                }

                @media (max-width: 768px) {
                    .banner-overlay-premium { 
                        background: linear-gradient(to top, #0b0b0f 30%, rgba(11, 11, 15, 0.4) 100%);
                        align-items: flex-end; padding: 40px 30px;
                    }
                    .banner-background { height: 550px; }
                    .banner-title-premium { font-size: 32px; text-align: center; }
                    .banner-description-premium { text-align: center; font-size: 14px; margin-bottom: 25px; }
                    .banner-actions-premium { flex-direction: column; width: 100%; gap: 10px; }
                    .banner-badges-row { justify-content: center; }
                    .btn-banner-play, .btn-banner-info { justify-content: center; width: 100%; }
                    .slider-controls-premium { left: 50%; transform: translateX(-50%); bottom: 20px; }
                }
            `}</style>
        </div>
    );
};

export default Banner;
