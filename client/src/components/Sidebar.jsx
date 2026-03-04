import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Heart, History, Trophy, User, ShieldAlert, Shield, Plus, Sparkles, BookOpen } from 'lucide-react';
import { useUser } from '../context/UserAuthContext';
import { useAdmin } from '../context/AdminAuthContext';

const Sidebar = ({ isOpen }) => {
    const location = useLocation();
    const { user } = useUser();
    const { admin } = useAdmin();

    const menuItems = [
        { label: 'Início', icon: Home, path: '/' },
        { label: 'Buscar', icon: Search, path: '/search' },
        { label: 'Explorar', icon: Compass, path: '/explore' },
        { label: 'Favoritos', icon: Heart, path: '/favorites' },
        { label: 'Histórico', icon: History, path: '/history' },
        { label: 'Ranking', icon: Trophy, path: '/gamification' },
        { label: 'Catálogo', icon: Plus, path: '/listing' },
        { label: 'Perfil', icon: User, path: '/profile' }
    ];

    if (admin || user?.is_admin) {
        menuItems.push({ label: 'Painel Admin', icon: ShieldAlert, path: '/admin' });
        menuItems.push({ label: 'Gerenciar Obras', icon: BookOpen, path: '/admin?tab=library', tooltip: 'Gerenciar Obras' });
        menuItems.push({ label: 'Publicar Obra', icon: Plus, path: '/admin?tab=publish' });
        menuItems.push({ label: 'Destaques', icon: Sparkles, path: '/admin?tab=banners' });
    }

    return (
        <aside className={`sidebar-premium ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-inner">
                <nav className="sidebar-nav">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={index}
                                to={item.path}
                                className={`nav-item-premium ${isActive ? 'active' : ''}`}
                            >
                                <div className="icon-box">
                                    <Icon size={20} />
                                    {isActive && <div className="active-dot" />}
                                </div>
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer-premium">
                    <div className="premium-badge-container">
                        <div className="premium-icon-box">
                            <Shield size={16} />
                        </div>
                        <div className="premium-text">
                            <p className="p-title">MangaBug Pro</p>
                            <p className="p-status">{admin ? 'Admin Access' : 'Sua Estante Offline'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .sidebar-premium {
                    position: fixed;
                    top: var(--navbar-h);
                    left: 0;
                    bottom: 0;
                    width: var(--sidebar-w);
                    background: #0B0E14;
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    transform: translateX(-100%);
                    transition: transform 0.3s var(--transition);
                    z-index: 90;
                    padding: 24px 12px;
                }

                .sidebar-premium.open {
                    transform: translateX(0);
                }

                .sidebar-inner {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .nav-item-premium {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    color: var(--text-dim);
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    transition: 0.2s;
                }

                .nav-item-premium:hover {
                    background: rgba(255, 255, 255, 0.03);
                    color: white;
                }

                .nav-item-premium.active {
                    background: var(--accent-soft);
                    color: var(--accent);
                }

                .icon-box {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .active-dot {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 6px;
                    height: 6px;
                    background: var(--accent);
                    border-radius: 50%;
                    box-shadow: 0 0 10px var(--accent);
                }

                .sidebar-footer-premium {
                    margin-top: auto;
                    padding: 20px 4px 0;
                }

                .premium-badge-container {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 16px;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .premium-icon-box {
                    width: 32px;
                    height: 32px;
                    background: var(--accent);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .premium-text .p-title {
                    font-size: 12px;
                    font-weight: 800;
                    color: white;
                    margin: 0;
                }

                .premium-text .p-status {
                    font-size: 10px;
                    color: var(--text-dim);
                    margin: 0;
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
