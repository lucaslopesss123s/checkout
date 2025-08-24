// Usando fetch nativo do Node.js (disponível a partir da versão 18)

// Script para criar carrinhos de teste para demonstrar a funcionalidade
async function createTestCarts() {
  const baseUrl = 'http://localhost:9002';
  
  // Dados de teste para diferentes lojas
  const testCarts = [
    {
      id_loja: '1', // Assumindo que a loja 'teste' tem ID 1
      session_id: 'test_session_1',
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '(11) 99999-1111',
      valor_total: 299.90,
      itens: JSON.stringify([
        {
          id: 'prod1',
          title: 'Camiseta Premium',
          price: 149.90,
          quantity: 1,
          image: '/assets/img/produto1.jpg'
        },
        {
          id: 'prod2', 
          title: 'Calça Jeans',
          price: 150.00,
          quantity: 1,
          image: '/assets/img/produto2.jpg'
        }
      ])
    },
    {
      id_loja: '1',
      session_id: 'test_session_2', 
      nome: 'Maria Santos',
      email: 'maria@email.com',
      telefone: '(11) 88888-2222',
      valor_total: 89.90,
      itens: JSON.stringify([
        {
          id: 'prod3',
          title: 'Tênis Esportivo',
          price: 89.90,
          quantity: 1,
          image: '/assets/img/produto3.jpg'
        }
      ])
    },
    {
      id_loja: '1',
      session_id: 'test_session_3',
      nome: 'Pedro Costa',
      email: 'pedro@email.com', 
      valor_total: 199.80,
      itens: JSON.stringify([
        {
          id: 'prod4',
          title: 'Jaqueta de Couro',
          price: 199.80,
          quantity: 1,
          image: '/assets/img/produto4.jpg'
        }
      ])
    },
    {
      id_loja: '2', // Carrinho para outra loja (não deve aparecer quando loja 1 estiver selecionada)
      session_id: 'test_session_4',
      nome: 'Ana Oliveira',
      email: 'ana@email.com',
      valor_total: 129.90,
      itens: JSON.stringify([
        {
          id: 'prod5',
          title: 'Vestido Floral',
          price: 129.90,
          quantity: 1,
          image: '/assets/img/produto5.jpg'
        }
      ])
    }
  ];

  console.log('Criando carrinhos de teste...');
  
  for (const cart of testCarts) {
    try {
      const response = await fetch(`${baseUrl}/api/carrinho`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cart)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Carrinho criado: ${cart.nome} (Loja ${cart.id_loja}) - ID: ${result.id}`);
      } else {
        console.error(`❌ Erro ao criar carrinho para ${cart.nome}:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Erro ao criar carrinho para ${cart.nome}:`, error.message);
    }
  }
  
  
  console.log('\n🎉 Carrinhos de teste criados! Acesse o dashboard para visualizar.');
  console.log('📊 Dashboard: http://localhost:9002/dashboard/pedidos/carrinhos-abandonados');
}

createTestCarts().catch(console.error);