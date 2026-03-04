import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, LogOut, Settings, Camera, Award, Clock, X, Check, Save, Upload } from 'lucide-react';
import { useUser } from '../context/UserAuthContext';
import { API_BASE_URL } from '../api/config';
import axios from 'axios';

const Profile = () => {
    const { user, logout, updateUser, setUser } = useUser();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Toast state
    const [toast, setToast] = useState(null);

    // Avatar upload state
    const [avatarUploading, setAvatarUploading] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openEditModal = () => {
        setEditUsername(user?.username || '');
        setEditEmail(user?.email || '');
        setEditIsPublic(user?.is_public !== 0);
        setEditError('');
        setShowEditModal(true);
    };

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError('');

        const result = await updateUser({
            username: editUsername,
            email: editEmail,
            is_public: editIsPublic ? 1 : 0
        });
        if (result.success) {
            setShowEditModal(false);
            showToast('Perfil atualizado com sucesso!');
        } else {
            setEditError(result.error);
        }
        setEditLoading(false);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        setAvatarUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await axios.put(`${API_BASE_URL}/api/users/avatar`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data.success) {
                setUser(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
                showToast('Avatar atualizado!');
            }
        } catch (err) {
            showToast(err.response?.data?.error || 'Erro ao enviar avatar', 'error');
        }
        setAvatarUploading(false);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    const handleLogoutTrigger = () => {
        setShowLogoutConfirm(true);
    };

    const getXpRequired = (level) => {
        if (level >= 50) return Infinity;
        if (level <= 10) return 100 * level;
        if (level <= 19) return 200 * level;
        return 300 * level;
    };

    const getUserTitle = (level) => {
        if (level <= 10) return 'Iniciante';
        if (level <= 30) return 'Leitor Ascendente';
        return 'Mestre das Obras';
    };

    const nextXp = getXpRequired(user.level || 1);
    const progress = user.level >= 50 ? 100 : Math.min(100, (user.xp / nextXp) * 100);

    if (!user) {
        return (
            <div className="login-required-state">
                <User size={64} color="var(--text-dim)" />
                <h2>Acesse sua conta</h2>
                <p>Faça login para ver seu perfil e estatísticas.</p>
                <button onClick={() => navigate('/login')} className="btn-go-login">ENTRAR</button>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Hidden file input for avatar */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                style={{ display: 'none' }}
            />

            <header className="profile-header-premium">
                <div className="profile-cover"></div>
                <div className="profile-avatar-section">
                    <div className="avatar-huge" onClick={handleAvatarClick} title="Clique para alterar seu avatar">
                        {user.avatar_url ? (
                            <img
                                src={`${API_BASE_URL}${user.avatar_url}`}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', borderRadius: '36px', objectFit: 'cover' }}
                            />
                        ) : (
                            user.username?.charAt(0).toUpperCase()
                        )}
                        <button className="btn-edit-avatar" disabled={avatarUploading}>
                            {avatarUploading ? <Upload size={16} className="spin-icon" /> : <Camera size={16} />}
                        </button>
                    </div>
                    <div className="profile-identity">
                        <h1>{user.username} <span className="rank-badge">{user.is_admin ? 'Admin' : 'Geral'}</span></h1>
                        <p>{getUserTitle(user.level || 1)} • {user.email}</p>
                    </div>
                    <div className="profile-actions-header">
                        <button className="btn-public-profile" onClick={() => navigate(`/profile/${user.id}`)}><User size={18} /> VER PERFIL PÚBLICO</button>
                        <button className="btn-settings-alt" onClick={openEditModal}><Settings size={18} /> EDITAR PERFIL</button>
                        <button className="btn-logout-alt" onClick={handleLogoutTrigger}><LogOut size={18} /> SAIR</button>
                    </div>
                </div>
            </header>

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

            <div className="profile-grid">
                <div className="profile-card stats-overview">
                    <div className="card-header-flex">
                        <h3>Minha Atividade</h3>
                        <div className="level-indicator">Nível {user.level || 1}</div>
                    </div>

                    <div className="xp-progress-container">
                        <div className="xp-labels">
                            <span>{user.xp || 0} XP</span>
                            <span>{user.level >= 50 ? 'Nível Máximo' : `${nextXp} XP para Nível ${user.level + 1}`}</span>
                        </div>
                        <div className="xp-bar-bg">
                            <motion.div
                                className="xp-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>

                    <div className="stats-row">
                        <div className="p-stat">
                            <strong>{user.xp || 0}</strong>
                            <span>XP Atual</span>
                        </div>
                        <div className="p-stat">
                            <strong style={{ fontSize: '18px', marginTop: '10px' }}>{getUserTitle(user.level || 1)}</strong>
                            <span>Patente Atual</span>
                        </div>
                        <div className="p-stat">
                            <strong>{user.stats?.total_chapters || 0}</strong>
                            <span>Caps Lidos</span>
                        </div>
                    </div>
                </div>

                <div className="profile-card achievements-section">
                    <h3>Conquistas</h3>
                    <div className="achievement-list-empty">
                        <Award size={32} color="var(--text-dim)" strokeWidth={1} />
                        <p>Continue lendo para desbloquear insignias exclusivas.</p>
                    </div>
                </div>

                <div className="profile-card info-details">
                    <h3>Informações da Conta</h3>
                    <div className="info-item">
                        <Mail size={16} />
                        <div>
                            <span>E-mail</span>
                            <p>{user.email}</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <Clock size={16} />
                        <div>
                            <span>Membro desde</span>
                            <p>{user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    {user.is_admin && (
                        <div className="info-item admin-highlight">
                            <Shield size={16} />
                            <div>
                                <span>Cargo</span>
                                <p>Administrador</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── EDIT PROFILE MODAL ─── */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="profile-modal-overlay" onClick={() => setShowEditModal(false)}>
                        <motion.div
                            className="profile-edit-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2><Settings size={20} /> Editar Perfil</h2>
                                <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveInfo} className="modal-form">
                                {editError && <div className="modal-error">{editError}</div>}

                                <div className="modal-field">
                                    <label>Nome de Usuário</label>
                                    <div className="modal-input-wrap">
                                        <User size={18} />
                                        <input
                                            type="text"
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value)}
                                            required
                                            placeholder="Seu nome de usuário"
                                        />
                                    </div>
                                </div>

                                <div className="modal-field">
                                    <label>E-mail</label>
                                    <div className="modal-input-wrap">
                                        <Mail size={18} />
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            required
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="privacy-toggle-group">
                                    <label className="checkbox-label-premium">
                                        <input
                                            type="checkbox"
                                            checked={editIsPublic}
                                            onChange={(e) => setEditIsPublic(e.target.checked)}
                                        />
                                        <span className="checkbox-custom"></span>
                                        <div className="label-text">
                                            <strong>Perfil Público</strong>
                                            <p>Permitir que outros usuários vejam sua estante e progresso.</p>
                                        </div>
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="modal-btn-cancel" onClick={() => setShowEditModal(false)}>
                                        CANCELAR
                                    </button>
                                    <button type="submit" className="modal-btn-save" disabled={editLoading}>
                                        {editLoading ? <div className="modal-loader" /> : <><Save size={16} /> SALVAR</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── TOAST ─── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className={`profile-toast ${toast.type}`}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                    >
                        {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .profile-container { padding-bottom: 80px; }

                .profile-header-premium { background: var(--bg-soft); border-radius: 30px; overflow: hidden; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.05); }
                .profile-cover { height: 180px; background: linear-gradient(135deg, var(--accent), #4B2DA3); }

                .profile-avatar-section { padding: 0 40px 40px; display: flex; align-items: flex-end; gap: 30px; margin-top: -50px; }
                .avatar-huge { width: 140px; height: 140px; border-radius: 40px; background: var(--bg); border: 6px solid var(--bg-soft); display: flex; align-items: center; justify-content: center; font-size: 56px; font-weight: 900; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.3); cursor: pointer; transition: 0.3s; overflow: hidden; flex-shrink: 0; }
                .avatar-huge:hover { box-shadow: 0 20px 50px rgba(139, 92, 246, 0.3); }
                .btn-edit-avatar { position: absolute; bottom: 10px; right: 10px; width: 36px; height: 36px; border-radius: 12px; background: var(--accent); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.4); transition: 0.2s; }
                .btn-edit-avatar:hover { transform: scale(1.1); }

                .spin-icon { animation: spin-anim 1s linear infinite; }
                @keyframes spin-anim { to { transform: rotate(360deg); } }

                .profile-identity { flex: 1; padding-bottom: 10px; }
                .profile-identity h1 { font-size: 32px; font-weight: 900; margin-bottom: 4px; display: flex; align-items: center; gap: 15px; }
                .rank-badge { font-size: 11px; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 100px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
                .profile-identity p { color: var(--text-dim); }

                .profile-actions-header { display: flex; gap: 12px; padding-bottom: 10px; }
                .btn-settings-alt, .btn-logout-alt { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: white; padding: 12px 20px; border-radius: 14px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
                .btn-settings-alt:hover { background: rgba(139, 92, 246, 0.1); color: var(--accent); border-color: rgba(139, 92, 246, 0.2); }
                .btn-logout-alt:hover { background: rgba(239, 68, 68, 0.1); color: #EF4444; border-color: rgba(239, 68, 68, 0.2); }

                .profile-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; }
                .profile-card { background: var(--bg-soft); border-radius: 24px; border: 1px solid rgba(255,255,255,0.03); padding: 30px; }
                .profile-card h3 { font-size: 18px; font-weight: 800; margin-bottom: 25px; color: white; display: flex; align-items: center; gap: 10px; }

                .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .card-header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .card-header-flex h3 { margin-bottom: 0 !important; }
                .level-indicator { background: var(--accent); color: white; padding: 6px 15px; border-radius: 10px; font-size: 13px; font-weight: 900; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.3); }

                .xp-progress-container { margin-bottom: 30px; background: rgba(255,255,255,0.02); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
                .xp-labels { display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: var(--text-dim); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
                .xp-bar-bg { height: 10px; background: #161B22; border-radius: 100px; overflow: hidden; position: relative; }
                .xp-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #A78BFA); border-radius: 100px; box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }

                .p-stat { text-align: center; background: rgba(255,255,255,0.02); padding: 25px; border-radius: 20px; }
                .p-stat strong { display: block; font-size: 28px; font-weight: 900; color: var(--accent); margin-bottom: 4px; }
                .p-stat span { font-size: 12px; color: var(--text-dim); text-transform: uppercase; font-weight: 700; }

                .achievement-list-empty { text-align: center; padding: 40px; color: var(--text-dim); border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px; }
                .achievement-list-empty p { font-size: 12px; margin-top: 15px; }

                .info-details { display: flex; flex-direction: column; gap: 20px; height: fit-content; }
                .info-item { display: flex; gap: 15px; align-items: center; padding: 15px; background: rgba(255,255,255,0.02); border-radius: 16px; }
                .info-item svg { color: var(--accent); }
                .info-item div span { font-size: 11px; color: var(--text-dim); text-transform: uppercase; font-weight: 800; display: block; }
                .info-item div p { font-weight: 700; color: white; font-size: 14px; margin-top: 2px; }
                .admin-highlight { background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.1); }

                .login-required-state { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 20px; }
                .btn-go-login { background: var(--accent); color: white; border: none; padding: 14px 40px; border-radius: 14px; font-weight: 800; cursor: pointer; }

                /* ─── EDIT MODAL ─── */
                .profile-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .profile-edit-modal { background: #1a1a24; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px; width: 100%; max-width: 480px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .modal-header h2 { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
                .modal-close { background: rgba(255,255,255,0.05); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .modal-close:hover { background: rgba(255,255,255,0.1); }

                .modal-form { display: flex; flex-direction: column; gap: 24px; }
                .modal-field label { display: block; font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.5); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
                .modal-input-wrap { position: relative; display: flex; align-items: center; }
                .modal-input-wrap svg { position: absolute; left: 16px; color: #4B5563; pointer-events: none; }
                .modal-input-wrap input { width: 100%; background: #161B22; border: 1px solid #30363D; border-radius: 14px; padding: 14px 16px 14px 48px; color: white; font-size: 15px; transition: 0.2s; }
                .modal-input-wrap input:focus { border-color: var(--accent); outline: none; background: #1C2128; box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1); }

                .modal-error { background: rgba(248, 81, 73, 0.1); border-left: 4px solid #EF4444; color: #EF4444; padding: 14px; border-radius: 10px; font-size: 14px; font-weight: 600; }

                .modal-actions { display: flex; gap: 15px; margin-top: 10px; }
                .modal-btn-cancel { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 14px; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; transition: 0.2s; }
                .modal-btn-cancel:hover { background: rgba(255,255,255,0.1); }
                .modal-btn-save { flex: 1; background: var(--accent); border: none; color: white; padding: 14px; border-radius: 12px; font-size: 13px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.3s; }
                .modal-btn-save:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4); }
                .modal-btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .modal-loader { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.2); border-left-color: white; border-radius: 50%; animation: spin-anim 1s linear infinite; }

                /* ─── TOAST ─── */
                .profile-toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 14px 28px; border-radius: 14px; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; z-index: 10000; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
                .profile-toast.success { background: #10B981; color: white; }
                .profile-toast.error { background: #EF4444; color: white; }

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

                @media (max-width: 1024px) {
                    .profile-grid { grid-template-columns: 1fr; }
                    .profile-avatar-section { flex-direction: column; align-items: center; text-align: center; }
                    .profile-actions-header { justify-content: center; }
                    .stats-row { grid-template-columns: 1fr; }
                    .modal-footer-logout { flex-direction: column; }
                }
                .profile-actions-header { display: flex; gap: 15px; }
                .btn-public-profile { background: rgba(139, 92, 246, 0.1); border: 2px solid var(--accent-soft); color: var(--accent); padding: 12px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .btn-public-profile:hover { background: var(--accent); color: white; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); }

                .privacy-toggle-group { margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05); }
                .checkbox-label-premium { display: flex; align-items: flex-start; gap: 15px; cursor: pointer; position: relative; }
                .checkbox-label-premium input { opacity: 0; position: absolute; }
                .checkbox-custom { width: 44px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 100px; position: relative; transition: 0.3s; flex-shrink: 0; margin-top: 4px; border: 1px solid rgba(255,255,255,0.1); }
                .checkbox-custom::after { content: ''; position: absolute; left: 4px; top: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
                .checkbox-label-premium input:checked + .checkbox-custom { background: var(--accent); border-color: var(--accent); }
                .checkbox-label-premium input:checked + .checkbox-custom::after { left: 22px; }
                .label-text strong { display: block; font-size: 15px; color: white; margin-bottom: 2px; }
                .label-text p { font-size: 12px; color: var(--text-dim); line-height: 1.4; }
            `}</style>
        </div>
    );
};

export default Profile;
