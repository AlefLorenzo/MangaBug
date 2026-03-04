import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, User, LogOut, Shield, Bell, PlusCircle, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserAuthContext';
import { useAdmin } from '../context/AdminAuthContext';
import { useNotification } from '../context/NotificationContext';

const Navbar = ({ onMenuClick }) => {
    const { user, logout: userLogout } = useUser();
    const { admin, logout: adminLogout } = useAdmin();
    const { notifications } = useNotification();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();

    const confirmLogout = () => {
        userLogout();
        adminLogout();
        setShowLogoutConfirm(false);
        navigate('/login');
    };

    return (
        <nav className="global-navbar">
            <div className="navbar-content">
                <div className="nav-left">
                    <button className="menu-trigger" onClick={onMenuClick}>
                        <Menu size={20} />
                    </button>
                    <Link to="/" className="site-brand">
                        Manga<span className="accent">Bug</span>
                    </Link>
                </div>

                <div className="nav-right">
                    <Link to="/search" className="nav-icon-link">
                        <Search size={20} />
                    </Link>

                    <Link to="/listing" className="nav-icon-link desktop-only">
                        <PlusCircle size={20} />
                    </Link>

                    <div className="nav-divider desktop-only" />

                    {user || admin ? (
                        <div className="nav-user-actions">
                            <div className="notification-wrapper">
                                <Bell size={20} />
                                {notifications.length > 0 && <span className="notif-badge" />}
                            </div>

                            <div className="user-profile-pill" onClick={() => navigate('/profile')}>
                                <div className="user-avatar">
                                    {user?.avatar_url ? (
                                        <img src={`${API_BASE_URL}${user.avatar_url}`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        (user?.username || admin?.username || 'U').charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="user-meta desktop-only">
                                    <span className="u-name">{user?.username || admin?.username}</span>
                                    <span className={`u-rank ${admin ? 'admin' : ''}`}>
                                        {admin ? 'Premium Admin' : (user?.title || 'Leitor VIP')}
                                    </span>
                                </div>
                            </div>

                            <button className="logout-btn" onClick={() => setShowLogoutConfirm(true)}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="login-btn-nav">
                            ENTRAR
                        </Link>
                    )}

                    {admin && (
                        <Link to="/admin" className="admin-nav-btn desktop-only">
                            <Shield size={16} /> PAINEL
                        </Link>
                    )}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                        <motion.div
                            className="logout-modal-content"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header-logout">
                                <div className="warn-icon-box">
                                    <AlertTriangle size={24} />
                                </div>
                                <button className="close-btn-modal" onClick={() => setShowLogoutConfirm(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="modal-body-logout">
                                <h3>Deseja mesmo sair?</h3>
                                <p>Sua sessão será encerrada. Você precisará fazer login novamente para acessar seus favoritos e histórico.</p>
                            </div>

                            <div className="modal-footer-logout">
                                <button className="btn-cancel-logout" onClick={() => setShowLogoutConfirm(false)}>CANCELAR</button>
                                <button className="btn-confirm-logout" onClick={confirmLogout}>SIM, DESEJO SAIR</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .global-navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: var(--navbar-h);
                    background: rgba(11, 14, 20, 0.8);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    z-index: 1000;
                }

                .navbar-content {
                    max-width: var(--max-w);
                    margin: 0 auto;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                }

                .nav-left, .nav-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .nav-icon-link {
                    color: var(--text-dim);
                    padding: 8px;
                    border-radius: 10px;
                    transition: 0.2s;
                    display: flex;
                    align-items: center;
                }

                .nav-icon-link:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.05);
                }

                .nav-divider {
                    width: 1px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    margin: 0 10px;
                }

                .nav-user-actions {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .notification-wrapper {
                    position: relative;
                    color: var(--text-dim);
                    cursor: pointer;
                }

                .notif-badge {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 8px;
                    height: 8px;
                    background: #EF4444;
                    border-radius: 50%;
                    border: 2px solid #0B0E14;
                }

                .user-profile-pill {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 5px;
                    padding-right: 15px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 100px;
                    cursor: pointer;
                    transition: 0.2s;
                }

                .user-profile-pill:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(139, 92, 246, 0.2);
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    background: var(--accent);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 13px;
                    color: white;
                }

                .user-meta {
                    display: flex;
                    flex-direction: column;
                }

                .u-name {
                    font-size: 13px;
                    font-weight: 700;
                    color: white;
                    line-height: 1.2;
                }

                .u-rank {
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--text-dim);
                }

                .u-rank.admin {
                    color: #FACC15;
                }

                .login-btn-nav {
                    background: white;
                    color: black;
                    padding: 8px 18px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 800;
                    text-decoration: none;
                    transition: 0.2s;
                }

                .login-btn-nav:hover {
                    transform: scale(1.05);
                }

                /* ─── LOGOUT MODAL ─── */
                .logout-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .logout-modal-content { background: #1a1a24; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px; width: 100%; max-width: 440px; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.7); }
                
                .modal-header-logout { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
                .warn-icon-box { width: 56px; height: 56px; background: rgba(239, 68, 68, 0.1); color: #EF4444; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
                .close-btn-modal { background: rgba(255,255,255,0.05); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .close-btn-modal:hover { background: rgba(255,255,255,0.1); }

                .modal-body-logout h3 { font-size: 22px; font-weight: 800; color: white; margin-bottom: 12px; }
                .modal-body-logout p { font-size: 14px; color: var(--text-dim); line-height: 1.6; }

                .modal-footer-logout { display: flex; gap: 12px; margin-top: 35px; }
                .btn-cancel-logout { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 16px; border-radius: 14px; font-size: 13px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .btn-confirm-logout { flex: 1; background: #EF4444; border: none; color: white; padding: 16px; border-radius: 14px; font-size: 13px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .btn-confirm-logout:hover { background: #DC2626; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3); }

                @media (max-width: 640px) {
                    .navbar-content { padding: 0 16px; }
                    .nav-right { gap: 8px; }
                    .user-profile-pill { padding-right: 5px; }
                    .modal-footer-logout { flex-direction: column; }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
