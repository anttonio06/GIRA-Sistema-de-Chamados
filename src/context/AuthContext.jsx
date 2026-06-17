import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

// Normaliza o objeto de usuário do backend (português) para o formato
// esperado pelo frontend (inglês: name, role)
const normalizar = (u) => u ? { ...u, name: u.nome, role: u.perfil } : null;

export const AuthProvider = ({ children }) => {
    const [user, setUser]       = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.get('/auth/me');
                setUser(normalizar(data.usuario));
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        // backend espera { email, senha }
        const { data } = await api.post('/auth/login', { email, senha: password });
        const u = normalizar(data.usuario);
        setUser(u);
        return u;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
