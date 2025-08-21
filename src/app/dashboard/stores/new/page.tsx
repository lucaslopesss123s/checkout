'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewStorePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Obter o ID do usuário atual (em uma aplicação real, isso viria do contexto de autenticação)
      // Para este exemplo, usaremos um ID fixo
      const userId = 'user-id-example';

      // Enviar dados para a API
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar loja');
      }

      // Redirecionar para a página de lojas após o sucesso
      router.push('/dashboard/stores');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao criar a loja');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nova Loja</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nome da Loja
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Criando...' : 'Criar Loja'}
        </button>
      </form>
    </div>
  );
}