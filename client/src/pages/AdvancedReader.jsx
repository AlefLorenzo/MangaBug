import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, ArrowLeft, Loader2,
    Smartphone, Layout, Maximize, CheckCircle2, BookOpen
} from 'lucide-react';
import { API_BASE_URL } from '../api/config';
import { useUser } from '../context/UserAuthContext';
import { useAdmin } from '../context/AdminAuthContext';

const AdvancedReader = () => {
    const { chapterId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useUser();
    const { admin } = useAdmin();
    const currentUser = user || admin;
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

    // Get page from URL query
    const queryParams = new URLSearchParams(location.search);
    const startPage = parseInt(queryParams.get('page')) || 1;

    const [chapter, setChapter] = useState(null);
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [displayMode, setDisplayMode] = useState(
        () => localStorage.getItem('reader_mode') || 'webtoon'
    );
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(false); // Hidden by default
    const [prevChapter, setPrevChapter] = useState(null);
    const [nextChapter, setNextChapter] = useState(null);
    const [toast, setToast] = useState(null);
    const [chapterDone, setChapterDone] = useState(false);

    const imageRefs = useRef([]);
    const controlsTimerRef = useRef(null);

    // ─── Fetch Chapter + Neighbors ──────────────────────────────────────────────
    useEffect(() => {
        const fetchChapter = async () => {
            setLoading(true);
            setCurrentPage(0);
            setChapterDone(false);
            setPrevChapter(null);
            setNextChapter(null);

            try {
                const [detailRes, neighborsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/works/chapters/${chapterId}`),
                    axios.get(`${API_BASE_URL}/api/works/chapters/${chapterId}/neighbors`)
                ]);

                setChapter(detailRes.data.chapter);
                setPages(detailRes.data.pages || []);
                setPrevChapter(neighborsRes.data.prev);
                setNextChapter(neighborsRes.data.next);

                // Set initial page from URL
                const initialPageIdx = startPage > 0 && startPage <= (detailRes.data.pages?.length || 0)
                    ? startPage - 1
                    : 0;
                setCurrentPage(initialPageIdx);

                // Save initial read history
                saveProgress(initialPageIdx, detailRes.data.chapter, detailRes.data.pages || []);

                // If webtoon mode, scroll to the page
                if (displayMode === 'webtoon' && initialPageIdx > 0) {
                    setTimeout(() => {
                        const targetImg = imageRefs.current[initialPageIdx];
                        if (targetImg) targetImg.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                }
            } catch (err) {
                console.error('Reader Fetch Error:', err);
                showToast('Erro ao carregar capítulo.', 'error');
            }
            setLoading(false);
        };
        fetchChapter();
    }, [chapterId]);

    // ─── Keyboard Navigation ────────────────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e) => {
            if (displayMode !== 'paged') return;
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [displayMode, currentPage, pages.length]);

    // ─── Intersection Observer (Webtoon progress) ───────────────────────────────
    useEffect(() => {
        if (displayMode !== 'webtoon' || pages.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = parseInt(entry.target.getAttribute('data-index'));
                    setCurrentPage(index);
                    if (index % 5 === 0 || index === pages.length - 1) {
                        saveProgress(index);
                    }
                    if (index === pages.length - 1 && !chapterDone) {
                        markChapterComplete();
                    }
                }
            });
        }, { threshold: 0.3 });

        imageRefs.current.forEach(img => img && observer.observe(img));
        return () => observer.disconnect();
    }, [displayMode, pages, chapterDone, chapter]);

    // ─── Mode Persistence ───────────────────────────────────────────────────────
    const switchMode = (mode) => {
        setDisplayMode(mode);
        localStorage.setItem('reader_mode', mode);
        window.scrollTo(0, 0);
    };

    // ─── Controls Auto-Hide ─────────────────────────────────────────────────────
    const triggerControls = useCallback(() => {
        setShowControls(true);
        clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3500);
    }, []);

    // ─── Progress Saving ────────────────────────────────────────────────────────
    const saveProgress = async (pageIdx, chapterData = chapter, pagesData = pages) => {
        if (!token || !chapterData) return;
        try {
            const progress = pagesData.length > 0
                ? Math.round(((pageIdx + 1) / pagesData.length) * 100)
                : 0;
            await axios.post(`${API_BASE_URL}/api/users/history`, {
                chapterId: chapterData.id,
                page_number: pageIdx + 1,
                progress_percentage: progress
            }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (e) {
            // Fail silently — progress tracking non-critical
        }
    };

    const markChapterComplete = async () => {
        if (chapterDone) return;
        setChapterDone(true);
        showToast('✅ Capítulo concluído!', 'success');
        await saveProgress(pages.length - 1);
    };

    // ─── Page Navigation ────────────────────────────────────────────────────────
    const nextPage = () => {
        if (currentPage < pages.length - 1) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            saveProgress(newPage);
            window.scrollTo(0, 0);
            if (newPage === pages.length - 1) markChapterComplete();
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
            window.scrollTo(0, 0);
        }
    };

    // ─── Toast ──────────────────────────────────────────────────────────────────
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    };

    // ─── Fullscreen ─────────────────────────────────────────────────────────────
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setIsFullscreen(false);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="reader-loader">
            <Loader2 className="animate-spin" size={48} />
            <p>Carregando capítulo...</p>
        </div>
    );

    if (!chapter) return (
        <div className="reader-loader">
            <p style={{ color: '#ef4444' }}>Capítulo não encontrado.</p>
            <button onClick={() => navigate(-1)} className="btn-back-err">Voltar</button>
        </div>
    );

    return (
        <div
            className={`premium-reader-container ${displayMode}`}
            onClick={triggerControls}
        >
            {/* ── TOP CONTROLS ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ y: -90 }} animate={{ y: 0 }} exit={{ y: -90 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="reader-nav-top"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="nav-left">
                            <button className="btn-icon" onClick={() => navigate(-1)}>
                                <ArrowLeft size={20} />
                            </button>
                            <div className="chapter-info">
                                <h3>{chapter?.work_title || 'Capítulo'}</h3>
                                <p>Cap. {chapter?.chapter_number}{chapter?.title ? ` — ${chapter.title}` : ''}</p>
                            </div>
                        </div>

                        <div className="nav-center">
                            <div className="pagination-pills">
                                {displayMode === 'paged' && (
                                    <button onClick={prevPage} disabled={currentPage === 0}>
                                        <ChevronLeft size={18} />
                                    </button>
                                )}
                                <span>Pág. <strong>{currentPage + 1}</strong> / {pages.length}</span>
                                {displayMode === 'paged' && (
                                    <button onClick={nextPage} disabled={currentPage === pages.length - 1}>
                                        <ChevronRight size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="nav-right">
                            <button
                                className={`btn-mode ${displayMode === 'webtoon' ? 'active' : ''}`}
                                onClick={() => switchMode('webtoon')}
                            >
                                <Smartphone size={16} /> WEBTOON
                            </button>
                            <button
                                className={`btn-mode ${displayMode === 'paged' ? 'active' : ''}`}
                                onClick={() => switchMode('paged')}
                            >
                                <Layout size={16} /> PÁGINAS
                            </button>
                            <div className="divider" />
                            <button className="btn-icon" onClick={toggleFullscreen}>
                                <Maximize size={20} color={isFullscreen ? '#8b5cf6' : 'white'} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── CONTENT ───────────────────────────────────────────────────────── */}
            <main className="reader-viewport">
                {pages.length === 0 ? (
                    <div className="no-pages-msg">
                        <p>Este capítulo não tem páginas ainda.</p>
                        <button onClick={() => navigate(-1)} className="btn-back-err">Voltar</button>
                    </div>
                ) : displayMode === 'webtoon' ? (
                    <div className="webtoon-view">
                        {pages.map((page, i) => (
                            <img
                                key={page.id}
                                ref={el => imageRefs.current[i] = el}
                                data-index={i}
                                src={page.image_url?.startsWith('http') ? page.image_url : `${API_BASE_URL}${page.image_url}`}
                                alt={`Página ${i + 1}`}
                                loading={i < 3 ? 'eager' : 'lazy'}
                                className="reader-page"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="paged-view">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={currentPage}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.18 }}
                                src={
                                    pages[currentPage]?.image_url?.startsWith('http')
                                        ? pages[currentPage].image_url
                                        : `${API_BASE_URL}${pages[currentPage]?.image_url}`
                                }
                                alt={`Página ${currentPage + 1}`}
                                className="reader-page-single"
                            />
                        </AnimatePresence>
                        {/* Click zones for paged navigation */}
                        <div className="paged-nav-overlay" onClick={e => e.stopPropagation()}>
                            <div className="nav-zone-left" onClick={prevPage} />
                            <div className="nav-zone-right" onClick={nextPage} />
                        </div>
                    </div>
                )}

                {/* ── CHAPTER FOOTER NAV ─────────────────────────────────────────── */}
                {!loading && pages.length > 0 && (
                    <section className="reader-footer-navigation" onClick={e => e.stopPropagation()}>
                        <div className="footer-nav-content">
                            <button
                                className={`footer-btn ${!prevChapter ? 'disabled' : ''}`}
                                disabled={!prevChapter}
                                onClick={() => prevChapter && navigate(`/reader/${prevChapter.id}`)}
                            >
                                <ChevronLeft size={20} />
                                <span>CAP. ANTERIOR</span>
                            </button>

                            <button
                                className="footer-btn-center"
                                onClick={() => chapter?.work_id && navigate(`/manga/${chapter.work_id}`)}
                            >
                                <BookOpen size={24} />
                                <span>VOLTAR PARA A OBRA</span>
                            </button>

                            <button
                                className={`footer-btn ${!nextChapter ? 'disabled' : ''}`}
                                disabled={!nextChapter}
                                onClick={() => nextChapter && navigate(`/reader/${nextChapter.id}`)}
                            >
                                <span>PRÓXIMO CAPÍTULO</span>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </section>
                )}
            </main>

            {/* ── BOTTOM NAV ────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="reader-nav-bottom-premium"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            className={`nav-btn-alt ${!prevChapter ? 'disabled' : ''}`}
                            disabled={!prevChapter}
                            onClick={() => prevChapter && navigate(`/reader/${prevChapter.id}`)}
                            title={prevChapter ? `Ir para Cap. ${prevChapter.chapter_number}` : 'Primeiro capítulo'}
                        >
                            <ChevronLeft size={20} />
                            <span className="desktop-only">ANTERIOR</span>
                        </button>

                        <div className="btn-divider-vertical" />

                        <button
                            className="nav-btn-center"
                            onClick={() => chapter?.work_id && navigate(`/manga/${chapter.work_id}`)}
                            title="Voltar para a Obra"
                        >
                            <BookOpen size={22} />
                        </button>

                        <div className="btn-divider-vertical" />

                        <button
                            className={`nav-btn-alt ${!nextChapter ? 'disabled' : ''}`}
                            disabled={!nextChapter}
                            onClick={() => nextChapter && navigate(`/reader/${nextChapter.id}`)}
                            title={nextChapter ? `Ir para Cap. ${nextChapter.chapter_number}` : 'Último capítulo'}
                        >
                            <span className="desktop-only">PRÓXIMO</span>
                            <ChevronRight size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TOAST ─────────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className={`reader-toast ${toast.type}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .premium-reader-container {
                    background: #05070a;
                    min-height: 100vh;
                    color: white;
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                }

                /* ── TOP BAR ─────────────────────────────── */
                .reader-nav-top {
                    position: fixed; top: 0; left: 0; right: 0;
                    height: 68px;
                    background: rgba(8, 8, 14, 0.95);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    display: flex; align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    z-index: 1000;
                }
                .nav-left { display: flex; align-items: center; gap: 16px; }
                .chapter-info h3 {
                    font-size: 15px; font-weight: 800;
                    white-space: nowrap; overflow: hidden;
                    text-overflow: ellipsis; max-width: 220px;
                }
                .chapter-info p { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 1px; }

                .nav-center { display: flex; align-items: center; }
                .pagination-pills {
                    background: rgba(255,255,255,0.04);
                    border-radius: 100px; padding: 6px 18px;
                    display: flex; align-items: center; gap: 14px;
                    font-size: 13px; font-weight: 700;
                    border: 1px solid rgba(255,255,255,0.08);
                }
                .pagination-pills span strong { color: #8b5cf6; }
                .pagination-pills button {
                    background: transparent; border: none; color: white;
                    cursor: pointer; opacity: 0.6; transition: 0.2s;
                    display: flex; align-items: center;
                }
                .pagination-pills button:hover:not(:disabled) { opacity: 1; color: #8b5cf6; }
                .pagination-pills button:disabled { opacity: 0.15; cursor: not-allowed; }

                .nav-right { display: flex; align-items: center; gap: 8px; }
                .btn-mode {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    color: rgba(255,255,255,0.45);
                    padding: 7px 14px; border-radius: 10px;
                    font-size: 11px; font-weight: 900;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 6px;
                    transition: 0.25s;
                }
                .btn-mode.active {
                    background: #8b5cf6; color: white;
                    border-color: #8b5cf6;
                    box-shadow: 0 0 18px rgba(139, 92, 246, 0.3);
                }
                .btn-icon {
                    width: 40px; height: 40px; border-radius: 50%;
                    border: none; background: rgba(255,255,255,0.04);
                    color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: 0.2s;
                }
                .btn-icon:hover { background: rgba(255,255,255,0.09); }
                .divider { width: 1px; height: 24px; background: rgba(255,255,255,0.1); margin: 0 8px; }

                /* ── CONTENT ─────────────────────────────── */
                .reader-viewport {
                    width: 100%;
                    display: flex; flex-direction: column; align-items: center;
                    cursor: pointer;
                }
                .webtoon-view { width: 100%; max-width: 900px; padding-top: 0; }
                .reader-page { width: 100%; height: auto; display: block; }

                .paged-view {
                    height: 100vh; width: 100vw;
                    display: flex; align-items: center; justify-content: center;
                    position: relative; overflow: hidden;
                }
                .reader-page-single {
                    height: 100vh; max-width: 100%; object-fit: contain;
                    pointer-events: none;
                }
                .paged-nav-overlay { position: absolute; inset: 0; display: flex; z-index: 5; }
                .nav-zone-left, .nav-zone-right { flex: 1; height: 100%; cursor: pointer; }

                /* ── BOTTOM NAV PREMIUM ─────────────────────────── */
                .reader-nav-bottom-premium {
                    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
                    background: rgba(12, 12, 20, 0.9);
                    backdrop-filter: blur(25px);
                    padding: 8px; border-radius: 24px;
                    display: flex; align-items: center; gap: 8px;
                    border: 1px solid rgba(255,255,255,0.08);
                    z-index: 1000;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.6);
                    white-space: nowrap;
                }
                .nav-btn-alt {
                    background: transparent; color: white; border: none;
                    height: 44px; padding: 0 16px; border-radius: 16px;
                    display: flex; align-items: center; gap: 10px;
                    font-size: 11px; font-weight: 900; letter-spacing: 0.5px;
                    cursor: pointer; transition: 0.2s;
                    opacity: 0.8;
                }
                .nav-btn-alt:hover:not(.disabled) { background: rgba(255,255,255,0.05); opacity: 1; }
                .nav-btn-alt.disabled { opacity: 0.15; cursor: not-allowed; }

                .nav-btn-center {
                    width: 48px; height: 48px; border-radius: 16px;
                    background: var(--accent, #8b5cf6); border: none;
                    color: white; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.3s;
                    box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
                }
                .nav-btn-center:hover { transform: scale(1.1); box-shadow: 0 12px 24px rgba(139, 92, 246, 0.5); }
                
                
                /* ── READER FOOTER ─────────────────────────────── */
                .reader-footer-navigation {
                    width: 100%;
                    max-width: 900px;
                    padding: 80px 20px 120px;
                    display: flex;
                    justify-content: center;
                }
                .footer-nav-content {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 20px;
                    align-items: center;
                }
                .footer-btn {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: white;
                    padding: 24px;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: 0.3s;
                    text-align: center;
                }
                .footer-btn span { font-size: 11px; font-weight: 900; letter-spacing: 1px; color: var(--text-dim); }
                .footer-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateY(-5px); }
                .footer-btn:hover span { color: white; }
                .footer-btn:disabled { opacity: 0.15; cursor: not-allowed; }

                .footer-btn-center {
                    background: var(--accent, #8b5cf6);
                    border: none;
                    color: white;
                    padding: 30px;
                    border-radius: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 15px;
                    cursor: pointer;
                    transition: 0.3s;
                    min-width: 180px;
                    box-shadow: 0 20px 40px rgba(139, 92, 246, 0.2);
                }
                .footer-btn-center span { font-size: 12px; font-weight: 800; }
                .footer-btn-center:hover { transform: scale(1.05); background: #7c3aed; box-shadow: 0 25px 50px rgba(139, 92, 246, 0.4); }

                @media (max-width: 768px) {
                    .footer-nav-content { grid-template-columns: 1fr; }
                    .footer-btn { padding: 20px; }
                    .footer-btn-center { order: -1; padding: 25px; }
                    .reader-footer-navigation { padding: 40px 16px 100px; }
                }

                /* ── MISC ────────────────────────────────── */
                .reader-loader {
                    height: 100vh;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    gap: 20px; color: rgba(255,255,255,0.5);
                    background: #05070a;
                }
                .animate-spin { animation: spin 1s linear infinite; color: #8b5cf6; }
                @keyframes spin { to { transform: rotate(360deg); } }

                .no-pages-msg {
                    text-align: center; padding: 100px 20px;
                    display: flex; flex-direction: column;
                    align-items: center; gap: 20px;
                }
                .btn-back-err {
                    background: var(--accent, #8b5cf6); color: white;
                    border: none; padding: 12px 28px; border-radius: 12px;
                    font-weight: 800; cursor: pointer;
                }

                .reader-toast {
                    position: fixed; bottom: 100px; left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 24px; border-radius: 12px;
                    font-size: 14px; font-weight: 700;
                    z-index: 2000; pointer-events: none;
                }
                .reader-toast.success { background: rgba(16, 185, 129, 0.9); color: white; }
                .reader-toast.error { background: rgba(239, 68, 68, 0.9); color: white; }
                .reader-toast.info { background: rgba(139, 92, 246, 0.9); color: white; }

                @media (max-width: 768px) {
                    .reader-nav-top { padding: 0 12px; }
                    .nav-center { display: none; }
                    .btn-mode span, .btn-mode svg { display: flex; }
                    .chapter-info h3 { max-width: 120px; font-size: 13px; }
                }
            `}</style>
        </div>
    );
};

export default AdvancedReader;
