import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, MessageSquare } from 'lucide-react';

const DetalhesChamado = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useContext(AuthContext);

    const [chamado, setChamado] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [observacao, setObservacao] = useState('');
    const [novoStatus, setNovoStatus] = useState('');
    const [responsavelId, setResponsavelId] = useState('');
    const [tecnicos, setTecnicos] = useState([]);

    const buscarChamado = async () => {
        try {
            const resposta = await api.get(`/chamados/${id}`);
            setChamado(resposta.data);
            setNovoStatus(resposta.data.status);
            setResponsavelId(resposta.data.responsavel_id || '');
        } catch (err) {
            setErro(err.response?.data?.erro || 'Erro ao carregar chamado.');
        } finally {
            setCarregando(false);
        }
    };

    const buscarTecnicos = async () => {
        if (usuario.perfil === 'admin') {
            try {
                const resposta = await api.get('/usuarios');
                setTecnicos(resposta.data.filter(u => u.perfil === 'tecnico'));
            } catch {
                console.error('Erro ao carregar técnicos');
            }
        }
    };

    useEffect(() => {
        buscarChamado();
        buscarTecnicos();
    }, [id]);

    const handleAdicionarObservacao = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/chamados/${id}`, { observacao });
            setObservacao('');
            buscarChamado();
        } catch (err) {
            alert(err.response?.data?.erro || 'Erro ao adicionar observação.');
        }
    };

    const handleAtualizarChamado = async () => {
        try {
            await api.put(`/chamados/${id}`, {
                status: novoStatus,
                responsavel_id: responsavelId ? parseInt(responsavelId) : null,
            });
            alert('Chamado atualizado com sucesso.');
            buscarChamado();
        } catch (err) {
            alert(err.response?.data?.erro || 'Erro ao atualizar chamado.');
        }
    };

    const handleCancelar = async () => {
        if (window.confirm('Tem certeza que deseja cancelar este chamado?')) {
            try {
                await api.delete(`/chamados/${id}`);
                navigate('/');
            } catch (err) {
                alert(err.response?.data?.erro || 'Erro ao cancelar chamado.');
            }
        }
    };

    if (carregando) return <div>Carregando...</div>;
    if (erro) return <div className="text-danger">{erro}</div>;
    if (!chamado) return <div>Chamado não encontrado.</div>;

    const podeEditarStatus = usuario.perfil === 'admin' || usuario.perfil === 'tecnico';
    const podeCancelar = usuario.perfil === 'solicitante' && chamado.status !== 'resolvido' && chamado.status !== 'cancelado';

    return (
        <div className="animate-fade-in">
            <button className="btn btn-secondary mb-4" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> Voltar
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Detalhes Principais */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <div className="flex-between mb-4">
                            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>#{chamado.id} - {chamado.titulo}</h2>
                            <span className={`status-badge status-${chamado.status.replaceAll('_', '-')}`}>
                                {chamado.status.replaceAll('_', ' ')}
                            </span>
                        </div>

                        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{chamado.descricao}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <div><strong>Solicitante:</strong> {chamado.solicitante_nome}</div>
                            <div><strong>Técnico:</strong> {chamado.responsavel_nome || 'Não atribuído'}</div>
                            <div><strong>Abertura:</strong> {format(new Date(chamado.criado_em), "dd/MM/yyyy HH:mm")}</div>
                        </div>

                        {podeCancelar && (
                            <div className="mt-4">
                                <button className="btn btn-danger" onClick={handleCancelar}>Cancelar Chamado</button>
                            </div>
                        )}
                    </div>

                    {/* Histórico */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 className="mb-4 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                            <MessageSquare size={20} /> Histórico e Observações
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {chamado.historico.map(item => (
                                <div key={item.id} style={{ padding: '1rem', borderLeft: `4px solid var(--${item.status_anterior === item.status_novo ? 'primary' : 'info'})`, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0 8px 8px 0' }}>
                                    <div className="flex-between mb-2">
                                        <span style={{ fontWeight: 600 }}>{item.autor_nome}</span>
                                        <span className="text-sm text-muted">{format(new Date(item.criado_em), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--text-main)' }}>{item.observacao}</p>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAdicionarObservacao}>
                            <textarea
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                placeholder="Adicione uma observação ao chamado..."
                                rows="3"
                                required
                            />
                            <button type="submit" className="btn btn-primary mt-4">Adicionar Observação</button>
                        </form>
                    </div>

                </div>

                {/* Painel de Controle Lateral */}
                {podeEditarStatus && (
                    <div>
                        <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                            <h3 className="mb-4">Controle</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Atualizar Status</label>
                                    <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}>
                                        <option value="aberto">Aberto</option>
                                        <option value="em_andamento">Em Andamento</option>
                                        <option value="aguardando">Aguardando</option>
                                        <option value="resolvido">Resolvido</option>
                                        {usuario.perfil === 'admin' && <option value="cancelado">Cancelado</option>}
                                    </select>
                                </div>

                                {usuario.perfil === 'admin' && (
                                    <div>
                                        <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Atribuir Técnico</label>
                                        <select value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
                                            <option value="">Não atribuído</option>
                                            {tecnicos.map(t => (
                                                <option key={t.id} value={t.id}>{t.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <button className="btn btn-primary" onClick={handleAtualizarChamado} style={{ width: '100%' }}>
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetalhesChamado;
