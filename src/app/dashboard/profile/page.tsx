'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  name: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
            return;
          }
          throw new Error('Erro ao buscar perfil');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        setError('Não foi possível carregar seu perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
          <p className="mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-md bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Perfil do Usuário</h1>
        
        {user && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Nome</h2>
              <p className="text-lg">{user.name}</p>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-500">Nome de Usuário</h2>
              <p className="text-lg">{user.username}</p>
            </div>
            
            <div>
              <h2 className="text-sm font-medium text-gray-500">ID</h2>
              <p className="text-lg">{user.id}</p>
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}