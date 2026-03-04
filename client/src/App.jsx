import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Link, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, User, LogOut, X, ShieldAlert, AlertTriangle, BookOpen } from 'lucide-react';

import Home from './pages/Home';
import MangaDetail from './pages/MangaDetail';
import AdvancedReader from './pages/AdvancedReader';
import AdminDashboard from './pages/AdminDashboard';
import AdvancedSearch from './pages/AdvancedSearch';
import Favorites from './pages/Favorites';
import History from './pages/History';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Gamification from './pages/Gamification';
import MangaListing from './pages/MangaListing';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';

import './styles/index.css';

import { useUser } from './context/UserAuthContext';
import { useAdmin } from './context/AdminAuthContext';
import { API_BASE_URL } from './api/config';

function App() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);
    const { user, loading: userLoading, logout: userLogout } = useUser();
    const { admin, loading: adminLoading, logout: adminLogout } = useAdmin();
    const location = useLocation();
    const navigate = useNavigate();

    const loading = userLoading || adminLoading;

    // Pixel-perfect breakpoints handling
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1025) setIsSidebarOpen(true);
            else setIsSidebarOpen(false);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        if (admin) adminLogout();
        if (user) userLogout();
        setShowLogoutAlert(false);
        navigate(admin ? '/admin/login' : '/login');
    };

    if (loading) {
        return (
            <div className="fullscreen-loader">
                <div className="premium-spinner"></div>
                <p>Manga<span>Bug</span> está preparando sua biblioteca...</p>
            </div>
        );
    }

    const isAuthPage = ['/login', '/register', '/admin/login'].includes(location.pathname);

    return (
        <div className="app-layout">
            {!isAuthPage && (
                <>
                    {/* 🧩 GLOBAL NAVBAR (Fixed & Centralized) */}
                    <nav className="global-navbar">
                        <div className="navbar-content">
                            <div className="nav-left">
                                <button className="menu-trigger" onClick={toggleSidebar}>
                                    <Menu size={22} />
                                </button>
                                <Link to="/" className="site-brand">
                                    Manga<span className="accent">Bug</span>
                                </Link>
                            </div>

                            <div className="nav-right">
                                {(admin || user?.is_admin) && (
                                    <>
                                        <button className="admin-nav-btn" onClick={() => navigate('/admin?tab=library')} title="Gerenciar Obras" style={{ background: '#10b981', border: '2px solid white', color: 'white', fontWeight: '900', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
                                            <BookOpen size={18} /> 📚 GERENCIAR OBRAS
                                        </button>
                                        <button className="admin-nav-btn" onClick={() => navigate('/admin')}>
                                            <ShieldAlert size={18} /> PAINEL ADMIN
                                        </button>
                                    </>
                                )}
                                <div className="user-info-pill" onClick={() => navigate('/profile')}>
                                    <div className="user-details desktop-only">
                                        <span className="username">{user?.username || admin?.username || 'Convidado'}</span>
                                        <span className={`user-rank ${admin ? 'admin' : ''}`}>
                                            {admin ? 'ADMINISTRADOR' : `Nível ${user?.level || 1}`}
                                        </span>
                                    </div>
                                    <div className="user-avatar">
                                        {(user?.avatar_url || admin?.avatar_url) ? (
                                            <img src={`${API_BASE_URL}${user?.avatar_url || admin?.avatar_url}`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            (user?.username || admin?.username)?.substring(0, 2).toUpperCase() || 'MB'
                                        )}
                                    </div>
                                </div>
                                <button className="logout-btn" title="Sair" onClick={() => setShowLogoutAlert(true)}>
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </nav>

                    <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                </>
            )}

            {/* 🚀 MAIN CONTENT AREA */}
            <div className={`page-container ${isSidebarOpen && window.innerWidth >= 1025 && !isAuthPage ? 'with-sidebar' : ''} ${isAuthPage ? 'auth-mode' : ''}`}>
                <div className="centralized-wrapper">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Routes location={location}>
                                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                                <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

                                {/* Admin Login */}
                                <Route path="/admin/login" element={!admin ? <Login isAdminLogin /> : <Navigate to="/admin" />} />

                                {/* Protected User Routes */}
                                <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
                                <Route path="/explore" element={user ? <Explore /> : <Navigate to="/login" />} />
                                <Route path="/manga/:id" element={user ? <MangaDetail /> : <Navigate to="/login" />} />
                                <Route path="/reader/:chapterId" element={user || admin ? <AdvancedReader /> : <Navigate to="/login" />} />

                                {/* Protected Admin Routes */}
                                <Route path="/admin" element={(admin || user?.is_admin) ? <AdminDashboard /> : <Navigate to="/admin/login" />} />

                                <Route path="/search" element={user ? <AdvancedSearch /> : <Navigate to="/login" />} />
                                <Route path="/favorites" element={user ? <Favorites /> : <Navigate to="/login" />} />
                                <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
                                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
                                <Route path="/gamification" element={user ? <Gamification /> : <Navigate to="/login" />} />
                                <Route path="/forgot" element={<div className="login-fullscreen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h2>Recuperação de Senha</h2><p>Funcionalidade em desenvolvimento. Por favor, contate o suporte.</p><Link to="/login" style={{ color: 'var(--accent)', marginTop: '20px' }}>Voltar ao Login</Link></div>} />
                                <Route path="/listing" element={user ? <MangaListing /> : <Navigate to="/login" />} />
                                <Route path="/profile/:id" element={user ? <PublicProfile /> : <Navigate to="/login" />} />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {!isAuthPage && (
                    <footer className="global-footer">
                        <p>© 2026 MangaBug. Dev by Premium Studio.</p>
                    </footer>
                )}
            </div>

            {/* 🚪 Custom Logout Alert */}
            <AnimatePresence>
                {showLogoutAlert && (
                    <div className="modal-overlay">
                        <motion.div
                            className="premium-alert"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="alert-icon">
                                <AlertTriangle size={32} />
                            </div>
                            <h3>Confirmação de Saída</h3>
                            <p>Você realmente deseja encerrar sua sessão?</p>
                            <div className="alert-actions">
                                <button className="btn-cancel" onClick={() => setShowLogoutAlert(false)}>CANCELAR</button>
                                <button className="btn-confirm" onClick={handleLogout}>SAIR COM SEGURANÇA</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 📱 Mobile Overlay for Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && window.innerWidth < 1025 && !isAuthPage && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="sidebar-overlay"
                        onClick={toggleSidebar}
                    />
                )}
            </AnimatePresence>

            <style>{`
                .fullscreen-loader { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg); gap: 20px; color: white; font-weight: 700; }
                .fullscreen-loader span { color: var(--accent); }
                
                .auth-mode .centralized-wrapper { max-width: 100%; padding: 0; }
                
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .premium-alert { background: #1a1a24; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5); }
                .alert-icon { width: 64px; height: 64px; background: rgba(245, 158, 11, 0.1); border-radius: 50%; color: #f59e0b; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
                .premium-alert h3 { font-size: 20px; font-weight: 800; margin-bottom: 10px; }
                .premium-alert p { color: var(--text-dim); margin-bottom: 30px; font-size: 15px; }
                .alert-actions { display: flex; gap: 15px; }
                .alert-actions button { flex: 1; padding: 14px; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .btn-cancel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; }
                .btn-cancel:hover { background: rgba(255,255,255,0.1); }
                .btn-confirm { background: #ef4444; border: none; color: white; }
                .btn-confirm:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.4); }
            `}</style>
        </div>
    );
}

export default App;
