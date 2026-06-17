import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setCarregando(true);

        try {
            await login(email, senha);
            navigate('/');
        } catch (err) {
            setErro(err.response?.data?.erro || 'Erro ao realizar login.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh' }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
                <div className="flex-center mb-4 gap-2">
                    <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                        <LogIn size={28} color="white" />
                    </div>
                    <h2>Gira</h2>
                </div>

                <p className="text-muted text-center mb-4">Acesse sua conta para continuar</p>

                {erro && (
                    <div className="animate-fade-in mb-4" style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.9rem' }}>
                        {erro}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="text-sm text-muted mb-4" style={{ display: 'block', marginBottom: '0.5rem' }}>E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm text-muted mb-4" style={{ display: 'block', marginBottom: '0.5rem' }}>Senha</label>
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary mt-4" disabled={carregando} style={{ width: '100%' }}>
                        {carregando ? 'Entrando...' : 'Entrar no Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
