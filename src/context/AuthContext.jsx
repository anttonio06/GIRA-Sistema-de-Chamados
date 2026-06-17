import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const verificarAuth = async () => {
            try {
                const { data } = await api.get('/auth/me');
                setUsuario(data.usuario);
            } catch {
                setUsuario(null);
            } finally {
                setCarregando(false);
            }
        };
        verificarAuth();
    }, []);

    const login = async (email, senha) => {
        const { data } = await api.post('/auth/login', { email, senha });
        setUsuario(data.usuario);
        return data.usuario;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
            {children}
        </AuthContext.Provider>
    );
};
