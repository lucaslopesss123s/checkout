const fetch = require('node-fetch');

async function deleteAllCarts() {
  try {
    console.log('🗑️ Buscando todos os carrinhos...');
    
    // Buscar todos os carrinhos
    const response = await fetch('http://localhost:9002/api/carrinho?page=1&limit=100');
    const data = await response.json();
    
    if (!data.success || !data.carrinhos) {
      console.log('❌ Erro ao buscar carrinhos:', data);
      return;
    }
    
    const carrinhos = data.carrinhos;
    console.log(`📊 Encontrados ${carrinhos.length} carrinhos`);
    
    if (carrinhos.length === 0) {
      console.log('✅ Nenhum carrinho encontrado. Tabela já está vazia!');
      return;
    }
    
    // Deletar cada carrinho
    for (const carrinho of carrinhos) {
      try {
        const deleteResponse = await fetch(`http://localhost:9002/api/carrinho/${carrinho.id}`, {
          method: 'DELETE'
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Carrinho deletado: ${carrinho.nome || 'Sem nome'} (ID: ${carrinho.id})`);
        } else {
          console.log(`❌ Erro ao deletar carrinho ${carrinho.id}:`, await deleteResponse.text());
        }
      } catch (error) {
        console.log(`❌ Erro ao deletar carrinho ${carrinho.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Processo de limpeza concluído!');
    console.log('📊 Verificando se a tabela está vazia...');
    
    // Verificar se a tabela está vazia
    const checkResponse = await fetch('http://localhost:9002/api/carrinho?page=1&limit=5');
    const checkData = await checkResponse.json();
    
    if (checkData.success && checkData.carrinhos.length === 0) {
      console.log('✅ Tabela Carrinho está completamente vazia!');
    } else {
      console.log(`⚠️ Ainda existem ${checkData.carrinhos?.length || 0} carrinhos na tabela`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

deleteAllCarts();