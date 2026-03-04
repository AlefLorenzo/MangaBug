import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, ArrowLeft, Github, Sparkles, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useUser } from '../context/UserAuthContext';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useUser();
    const navigate = useNavigate();

    const passwordStrength = () => {
        if (password.length === 0) return { level: 0, label: '', color: '' };
        if (password.length < 4) return { level: 1, label: 'Fraca', color: '#EF4444' };
        if (password.length < 6) return { level: 2, label: 'Média', color: '#F59E0B' };
        if (password.length < 8) return { level: 3, label: 'Boa', color: '#10B981' };
        return { level: 4, label: 'Forte', color: '#06D6A0' };
    };

    const strength = passwordStrength();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        const result = await register({ username, email, password });

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="register-fullscreen">
            <div className="register-side-visual desktop-only">
                <div className="register-visual-overlay">
                    <div className="register-visual-content">
                        <Link to="/" className="register-logo">
                            Manga<span>Bug</span>
                        </Link>
                        <h2>Crie sua estante infinita e junte-se à nossa comunidade.</h2>

                        <div className="register-features">
                            <div className="feature-item">
                                <CheckCircle2 size={18} />
                                <span>Acervo com milhares de títulos</span>
                            </div>
                            <div className="feature-item">
                                <CheckCircle2 size={18} />
                                <span>Sistema de XP e conquistas</span>
                            </div>
                            <div className="feature-item">
                                <CheckCircle2 size={18} />
                                <span>Leitura offline e modo limpo</span>
                            </div>
                        </div>

                        <div className="register-social-proof">
                            <div className="avatars-row">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="avatar-mini" />)}
                            </div>
                            <p>Registre-se em menos de 1 minuto</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="register-side-form">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="register-card-inner"
                >
                    <div className="register-form-header">
                        <button className="register-back-btn" onClick={() => navigate('/')}>
                            <ArrowLeft size={16} /> Voltar para o início
                        </button>
                        <div className="register-badge">
                            <Sparkles size={14} />
                            CADASTRO GRATUITO
                        </div>
                        <h1>Comece agora</h1>
                        <p>Preencha os dados abaixo para criar seu perfil</p>
                    </div>

                    <form onSubmit={handleSubmit} className="register-form">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="register-error"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="register-input-field">
                            <label>Nome de Usuário</label>
                            <div className="register-input-wrapper">
                                <User size={18} />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Como quer ser chamado?"
                                />
                            </div>
                        </div>

                        <div className="register-input-field">
                            <label>Endereço de E-mail</label>
                            <div className="register-input-wrapper">
                                <Mail size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="register-input-field">
                            <label>Senha de Acesso</label>
                            <div className="register-input-wrapper">
                                <Lock size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="password-strength">
                                    <div className="strength-bars">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={`strength-bar ${i <= strength.level ? 'active' : ''}`}
                                                style={{ background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.06)' }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ color: strength.color }}>{strength.label}</span>
                                </div>
                            )}
                        </div>

                        <button type="submit" className="register-submit-btn" disabled={loading}>
                            {loading ? <div className="register-loader" /> : (
                                <><UserPlus size={18} /> CRIAR MINHA CONTA</>
                            )}
                        </button>

                        <div className="register-social-section">
                            <div className="register-divider"><span>ou use sua rede social</span></div>
                            <button type="button" className="register-github-btn">
                                <Github size={18} /> Continuar com GitHub
                            </button>
                            <p className="register-login-link">
                                Já tem uma conta? <Link to="/login">Faça login aqui</Link>
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>

            <style>{`
                .register-fullscreen { height: 100vh; display: flex; background: #0B0E14; color: white; overflow: hidden; }

                /* ─── LEFT VISUAL PANEL ─── */
                .register-side-visual {
                    flex: 1.2; position: relative;
                    background: url('https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=2000');
                    background-size: cover; background-position: center;
                }
                .register-visual-overlay {
                    position: absolute; inset: 0;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 214, 160, 0.15), rgba(11, 14, 20, 0.92));
                    display: flex; align-items: flex-end; padding: 80px;
                }
                .register-logo {
                    font-size: 32px; font-weight: 900; color: white;
                    text-decoration: none; display: block; margin-bottom: 30px;
                }
                .register-logo span { color: #10B981; }
                .register-visual-content h2 {
                    font-size: 40px; font-weight: 900; line-height: 1.1;
                    letter-spacing: -1px; margin-bottom: 40px;
                    background: linear-gradient(135deg, #ffffff, #10B981);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }

                .register-features { display: flex; flex-direction: column; gap: 14px; margin-bottom: 40px; }
                .feature-item { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.8); font-size: 15px; font-weight: 600; }
                .feature-item svg { color: #10B981; }

                .avatars-row { display: flex; margin-bottom: 12px; }
                .avatar-mini {
                    width: 30px; height: 30px; border-radius: 50%;
                    border: 2px solid #0B0E14; background: linear-gradient(135deg, #10B981, #06D6A0);
                    margin-left: -8px;
                }
                .avatar-mini:first-child { margin-left: 0; }
                .register-social-proof p { font-size: 14px; color: rgba(255,255,255,0.6); }

                /* ─── RIGHT FORM PANEL ─── */
                .register-side-form {
                    flex: 1; display: flex; align-items: center;
                    justify-content: center; padding: 40px; background: #0B0E14;
                    overflow-y: auto;
                }
                .register-card-inner { width: 100%; max-width: 440px; }

                .register-back-btn {
                    background: transparent; border: none; color: var(--text-dim);
                    display: flex; align-items: center; gap: 8px;
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    margin-bottom: 40px; transition: 0.2s;
                }
                .register-back-btn:hover { color: white; }

                .register-badge {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 6px 16px;
                    background: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.15);
                    border-radius: 100px;
                    font-size: 10px; font-weight: 900; letter-spacing: 1.2px;
                    color: #10B981; margin-bottom: 20px;
                }

                .register-form-header h1 {
                    font-size: 32px; font-weight: 800; margin-bottom: 8px;
                    background: linear-gradient(135deg, #ffffff, #10B981);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }
                .register-form-header p { color: var(--text-dim); margin-bottom: 35px; }

                .register-form { display: flex; flex-direction: column; gap: 20px; }

                .register-input-field label {
                    display: block; font-size: 12px; font-weight: 800;
                    color: rgba(255,255,255,0.5); margin-bottom: 10px;
                    text-transform: uppercase; letter-spacing: 1.2px;
                }
                .register-input-wrapper {
                    position: relative; display: flex; align-items: center;
                }
                .register-input-wrapper svg:first-child {
                    position: absolute; left: 16px; color: #4B5563;
                    pointer-events: none;
                }
                .register-input-wrapper input {
                    width: 100%; background: #161B22;
                    border: 1px solid #30363D; border-radius: 14px;
                    padding: 14px 48px 14px 48px; color: white;
                    font-size: 15px; transition: 0.2s;
                }
                .register-input-wrapper input:focus {
                    border-color: #10B981; outline: none; background: #1C2128;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
                }

                .toggle-password {
                    position: absolute; right: 14px; background: none;
                    border: none; color: #4B5563; cursor: pointer;
                    display: flex; align-items: center; transition: 0.2s;
                }
                .toggle-password:hover { color: #10B981; }

                /* ─── PASSWORD STRENGTH ─── */
                .password-strength {
                    display: flex; align-items: center; gap: 12px; margin-top: 10px;
                }
                .strength-bars { display: flex; gap: 6px; flex: 1; }
                .strength-bar {
                    height: 4px; flex: 1; border-radius: 100px;
                    transition: background 0.3s;
                }
                .password-strength span {
                    font-size: 11px; font-weight: 800; text-transform: uppercase;
                    letter-spacing: 0.5px; min-width: 40px;
                }

                /* ─── SUBMIT BUTTON ─── */
                .register-submit-btn {
                    background: linear-gradient(135deg, #10B981, #06D6A0);
                    color: white; border: none; padding: 16px;
                    border-radius: 14px; font-weight: 800; font-size: 14px;
                    cursor: pointer; display: flex; align-items: center;
                    justify-content: center; gap: 10px; transition: 0.3s;
                    margin-top: 5px; position: relative; overflow: hidden;
                }
                .register-submit-btn::before {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1), transparent);
                    transform: translateX(-100%); transition: 0.5s;
                }
                .register-submit-btn:hover::before { transform: translateX(100%); }
                .register-submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px -5px rgba(16, 185, 129, 0.4);
                }
                .register-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .register-error {
                    background: rgba(248, 81, 73, 0.1);
                    border-left: 4px solid #EF4444;
                    color: #EF4444; padding: 16px; border-radius: 10px;
                    font-size: 14px; font-weight: 600;
                }

                /* ─── SOCIAL / FOOTER ─── */
                .register-divider { position: relative; text-align: center; margin: 10px 0; }
                .register-divider::before {
                    content: ''; position: absolute; top: 50%; left: 0; right: 0;
                    height: 1px; background: #30363D;
                }
                .register-divider span {
                    position: relative; background: #0B0E14; padding: 0 15px;
                    font-size: 12px; color: #4B5563; text-transform: uppercase; font-weight: 800;
                }

                .register-github-btn {
                    background: #24292F; color: white; border: none; padding: 14px;
                    border-radius: 14px; font-weight: 800; font-size: 14px;
                    cursor: pointer; display: flex; align-items: center;
                    justify-content: center; gap: 10px; transition: 0.2s; width: 100%;
                }
                .register-github-btn:hover { background: #2F363D; }

                .register-login-link {
                    text-align: center; font-size: 14px; color: var(--text-dim); margin-top: 20px;
                }
                .register-login-link a { color: #10B981; text-decoration: none; font-weight: 800; }
                .register-login-link a:hover { text-decoration: underline; }

                .register-loader {
                    width: 20px; height: 20px;
                    border: 3px solid rgba(255,255,255,0.2);
                    border-left-color: white; border-radius: 50%;
                    animation: register-spin 1s linear infinite;
                }
                @keyframes register-spin { to { transform: rotate(360deg); } }

                @media (max-width: 1024px) {
                    .register-side-visual { display: none; }
                    .register-side-form { flex: 1; }
                }
            `}</style>
        </div>
    );
};

export default Register;
