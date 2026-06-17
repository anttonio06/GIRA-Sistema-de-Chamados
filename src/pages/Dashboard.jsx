import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
    const { usuario } = useContext(AuthContext);
    const [chamados, setChamados] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [exibirFormulario, setExibirFormulario] = useState(false);

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [enviando, setEnviando] = useState(false);

    const buscarChamados = async () => {
        try {
            const resposta = await api.get('/chamados');
            setChamados(resposta.data);
        } catch (erro) {
            console.error('Erro ao buscar chamados:', erro);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarChamados();
    }, []);

    const handleCriarChamado = async (e) => {
        e.preventDefault();
        setEnviando(true);
        try {
            await api.post('/chamados', { titulo, descricao });
            setTitulo('');
            setDescricao('');
            setExibirFormulario(false);
            buscarChamados();
        } catch (erro) {
            alert(erro.response?.data?.erro || 'Erro ao criar chamado.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div>
            <div className="flex-between mb-4">
                <h2>Meus Chamados</h2>
                {(usuario.perfil === 'solicitante' || usuario.perfil === 'admin') && (
                    <button className="btn btn-primary" onClick={() => setExibirFormulario(!exibirFormulario)}>
                        <PlusCircle size={20} /> Novo Chamado
                    </button>
                )}
            </div>

            {exibirFormulario && (
                <div className="glass-panel animate-fade-in mb-4" style={{ padding: '1.5rem' }}>
                    <h3>Abrir Novo Chamado</h3>
                    <form onSubmit={handleCriarChamado} className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="text-sm text-muted mb-4" style={{ display: 'block', marginBottom: '0.5rem' }}>Título do Problema</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ex: Ar condicionado vazando na sala 3"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted mb-4" style={{ display: 'block', marginBottom: '0.5rem' }}>Descrição Detalhada</label>
                            <textarea
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                rows="4"
                                placeholder="Descreva o problema com o máximo de detalhes possível..."
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setExibirFormulario(false)}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={enviando}>
                                {enviando ? 'Enviando...' : 'Criar Chamado'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                {carregando ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando chamados...</div>
                ) : chamados.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum chamado encontrado.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>ID</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Título</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Status</th>
                                {usuario.perfil !== 'solicitante' && <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Solicitante</th>}
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Técnico</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Data</th>
                                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chamados.map(chamado => (
                                <tr key={chamado.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>#{chamado.id}</td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{chamado.titulo}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`status-badge status-${chamado.status.replaceAll('_', '-')}`}>
                                            {chamado.status.replaceAll('_', ' ')}
                                        </span>
                                    </td>
                                    {usuario.perfil !== 'solicitante' && <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{chamado.solicitante_nome}</td>}
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{chamado.responsavel_nome || 'Não atribuído'}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {format(new Date(chamado.criado_em), "dd/MM/yy HH:mm", { locale: ptBR })}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <Link to={`/chamado/${chamado.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                                            <Search size={16} /> Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
