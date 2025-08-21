'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    username: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signup: (username: string, password: string, name: string) => Promise<any>;
    login: (username: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Verificar se há um token e usuário no localStorage
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Erro ao analisar dados do usuário:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        
        setLoading(false);
    }, []);

    const signup = async (username: string, password: string, name: string) => {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, name }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao registrar usuário');
        }

        return data;
    };

    const login = async (username: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao fazer login');
        }

        // Salvar o token e os dados do usuário no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Atualizar o estado do usuário
        setUser(data.user);

        return data;
    };

    const logout = async () => {
        // Remover o token e os dados do usuário do localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Limpar o estado do usuário
        setUser(null);
        
        // Redirecionar para a página inicial
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
