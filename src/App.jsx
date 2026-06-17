import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DetalhesChamado from './pages/DetalhesChamado';
import PainelAdmin from './pages/PainelAdmin';
import { LogOut, LayoutDashboard, Settings, Ticket as TicketIcon } from 'lucide-react';
import './App.css';

const RotaProtegida = ({ children, perfisPermitidos }) => {
    const { usuario, carregando } = useContext(AuthContext);

    if (carregando) return <div className="flex-center" style={{height: '100vh'}}>Carregando...</div>;

    if (!usuario) return <Navigate to="/login" replace />;

    if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
        return (
            <div className="flex-center" style={{height: '100vh', flexDirection: 'column', gap: '1rem'}}>
                <h1 className="text-danger">Acesso Negado</h1>
                <p>Você não tem permissão para visualizar esta página.</p>
                <Link to="/" className="btn btn-primary">Voltar ao Início</Link>
            </div>
        );
    }

    return children;
};

const LayoutApp = ({ children }) => {
    const { usuario, logout } = useContext(AuthContext);

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="flex-center mb-4 gap-2" style={{ justifyContent: 'flex-start' }}>
                    <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
                        <TicketIcon size={20} color="white" />
                    </div>
                    <h3>Gira</h3>
                </div>

                <div className="mt-4 mb-4">
                    <p className="text-sm text-muted">Bem-vindo(a),</p>
                    <p style={{ fontWeight: 500 }}>{usuario?.nome}</p>
                    <span className="status-badge status-aguardando" style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.7rem' }}>
                        {usuario?.perfil}
                    </span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '2rem', flex: 1 }}>
                    <Link to="/" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    {usuario?.perfil === 'admin' && (
                        <Link to="/admin" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                            <Settings size={18} /> Painel Admin
                        </Link>
                    )}
                </nav>

                <button onClick={logout} className="btn btn-danger" style={{ justifyContent: 'flex-start', marginTop: 'auto' }}>
                    <LogOut size={18} /> Sair
                </button>
            </aside>
            <main className="main-content animate-fade-in delay-100">
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={
                        <RotaProtegida>
                            <LayoutApp>
                                <Dashboard />
                            </LayoutApp>
                        </RotaProtegida>
                    } />

                    <Route path="/chamado/:id" element={
                        <RotaProtegida>
                            <LayoutApp>
                                <DetalhesChamado />
                            </LayoutApp>
                        </RotaProtegida>
                    } />

                    <Route path="/admin" element={
                        <RotaProtegida perfisPermitidos={['admin']}>
                            <LayoutApp>
                                <PainelAdmin />
                            </LayoutApp>
                        </RotaProtegida>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
