import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Github, ArrowLeft, Shield } from 'lucide-react';
import { useUser } from '../context/UserAuthContext';
import { useAdmin } from '../context/AdminAuthContext';

const Login = ({ isAdminLogin = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login: userLogin } = useUser();
    const { login: adminLogin } = useAdmin();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = isAdminLogin
            ? await adminLogin(email, password)
            : await userLogin(email, password);

        if (result.success) {
            navigate(isAdminLogin ? '/admin' : '/');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="login-fullscreen">
            <div className="login-side-visual desktop-only">
                <div className="visual-overlay">
                    <div className="visual-content">
                        <Link to="/" className="login-logo">
                            Manga<span className="accent">Bug</span>
                        </Link>
                        <h2>Explore universos infinitos com a melhor experiência de leitura.</h2>
                        <div className="social-proof">
                            <div className="avatars-group">
                                {[1, 2, 3, 4].map(i => <div key={i} className="avatar-sm" />)}
                            </div>
                            <p>+50,000 leitores ativos na plataforma</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-side-form">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="login-card-inner"
                >
                    <div className="form-header">
                        <button className="back-home" onClick={() => navigate('/')}>
                            <ArrowLeft size={16} /> Voltar para o início
                        </button>
                        <div className="login-badge">
                            {isAdminLogin ? <Shield size={16} /> : <div className="dot" />}
                            {isAdminLogin ? 'ACESSO ADMINISTRATIVO' : 'ÁREA DO LEITOR'}
                        </div>
                        <h1>{isAdminLogin ? 'Admin Central' : 'Bem-vindo de volta'}</h1>
                        <p>{isAdminLogin ? 'Entre com suas credenciais de moderador' : 'Acesse sua estante personalizada'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="premium-form">
                        {error && <div className="login-error">{error}</div>}

                        <div className="input-field">
                            <label>Endereço de E-mail</label>
                            <div className="input-wrapper">
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

                        <div className="input-field">
                            <label>Sua Senha</label>
                            <div className="input-wrapper">
                                <Lock size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="form-utils">
                            <Link to="/forgot">Esqueci minha senha</Link>
                        </div>

                        <button type="submit" className="login-btn-premium" disabled={loading}>
                            {loading ? <div className="loader-sm" /> : (
                                <><LogIn size={18} /> {isAdminLogin ? 'ENTRAR NO PAINEL' : 'ACESSAR MINHA CONTA'}</>
                            )}
                        </button>

                        {!isAdminLogin && (
                            <div className="social-login">
                                <div className="divider"><span>ou continue com</span></div>
                                <button type="button" className="btn-social-github">
                                    <Github size={18} /> GitHub
                                </button>
                                <p className="signup-link">
                                    Novo por aqui? <Link to="/register">Crie sua conta agora</Link>
                                </p>
                            </div>
                        )}

                        {isAdminLogin && (
                            <p className="signup-link" style={{ marginTop: '20px' }}>
                                Não é admin? <Link to="/login">Voltar para login comum</Link>
                            </p>
                        )}
                    </form>
                </motion.div>
            </div>

            <style>{`
                .login-fullscreen { height: 100vh; display: flex; background: #0B0E14; color: white; overflow: hidden; }
                
                .login-side-visual { flex: 1.2; position: relative; background: url('https://images.unsplash.com/photo-1578632292335-df3abbb0d586?auto=format&fit=crop&q=80&w=2000'); background-size: cover; background-position: center; }
                .visual-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(11, 14, 20, 0.9)); display: flex; align-items: flex-end; padding: 80px; }
                .login-logo { font-size: 32px; font-weight: 900; color: white; text-decoration: none; display: block; margin-bottom: 30px; }
                .visual-content h2 { font-size: 42px; font-weight: 900; line-height: 1.1; letter-spacing: -1px; margin-bottom: 40px; }
                
                .avatars-group { display: flex; margin-bottom: 15px; }
                .avatar-sm { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #0B0E14; background: #333; margin-left: -8px; }
                .avatar-sm:first-child { margin-left: 0; }
                .social-proof p { font-size: 14px; color: rgba(255,255,255,0.7); }

                .login-side-form { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; background: #0B0E14; }
                .login-card-inner { width: 100%; max-width: 440px; }
                
                .back-home { background: transparent; border: none; color: var(--text-dim); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; cursor: pointer; margin-bottom: 40px; transition: 0.2s; }
                .back-home:hover { color: white; }
                
                .login-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; font-size: 10px; font-weight: 900; letter-spacing: 1px; color: var(--accent); margin-bottom: 20px; }
                .login-badge .dot { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); }
                
                .login-card-inner h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
                .login-card-inner p { color: var(--text-dim); margin-bottom: 40px; }
                
                .premium-form { display: flex; flex-direction: column; gap: 20px; }
                .input-field label { display: block; font-size: 13px; font-weight: 800; color: rgba(255,255,255,0.6); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
                .input-wrapper { position: relative; display: flex; align-items: center; }
                .input-wrapper svg { position: absolute; left: 16px; color: #4B5563; }
                .input-wrapper input { width: 100%; background: #161B22; border: 1px solid #30363D; border-radius: 14px; padding: 14px 16px 14px 48px; color: white; font-size: 15px; transition: 0.2s; }
                .input-wrapper input:focus { border-color: var(--accent); outline: none; background: #1C2128; box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1); }
                
                .form-utils { display: flex; justify-content: flex-end; }
                .form-utils a { font-size: 13px; color: var(--accent); text-decoration: none; font-weight: 700; }
                
                .login-btn-premium { background: var(--accent); color: white; border: none; padding: 16px; border-radius: 14px; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; margin-top: 10px; }
                .login-btn-premium:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4); }
                .login-btn-premium:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                
                .login-error { background: rgba(248, 81, 73, 0.1); border-left: 4px solid var(--error); color: var(--error); padding: 16px; border-radius: 10px; font-size: 14px; font-weight: 600; }
                
                .divider { position: relative; text-align: center; margin: 10px 0; }
                .divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #30363D; }
                .divider span { position: relative; background: #0B0E14; padding: 0 15px; font-size: 12px; color: #4B5563; text-transform: uppercase; font-weight: 800; }
                
                .btn-social-github { background: #24292F; color: white; border: none; padding: 14px; border-radius: 14px; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.2s; }
                .btn-social-github:hover { background: #2F363D; }
                
                .signup-link { text-align: center; font-size: 14px; color: var(--text-dim); margin-top: 20px; }
                .signup-link a { color: var(--accent); text-decoration: none; font-weight: 800; }

                .loader-sm { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.2); border-left-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 1024px) {
                    .login-side-visual { display: none; }
                    .login-side-form { flex: 1; }
                }
            `}</style>
        </div>
    );
};

export default Login;
