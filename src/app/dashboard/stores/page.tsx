import { Suspense } from 'react';
import prisma from '@/lib/prisma';

// Forçar renderização dinâmica para evitar prerender
export const dynamic = 'force-dynamic';

async function getStores() {
  try {
    // Buscar todas as lojas diretamente do banco de dados
    const stores = await prisma.store.findMany({
      include: {
        user: true,
        products: {
          take: 5, // Limitar a 5 produtos por loja
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    return stores;
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    return [];
  }
}

export default async function StoresPage() {
  const stores = await getStores();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Lojas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{store.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Proprietário: {store.user.name || store.user.email}</p>
            
            <h3 className="font-medium mb-2">Produtos Recentes</h3>
            {store.products.length > 0 ? (
              <ul className="space-y-1">
                {store.products.map((product) => (
                  <li key={product.id} className="text-sm">
                    {product.name} - R$ {product.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum produto cadastrado</p>
            )}
          </div>
        ))}
        
        {stores.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            Nenhuma loja encontrada. Crie sua primeira loja para começar.
          </p>
        )}
      </div>
    </div>
  );
}

export function StoresPageLoading() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Lojas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 shadow-sm animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
            <div className="h-5 bg-gray-200 rounded mb-2"></div>
            <div className="space-y-1">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}