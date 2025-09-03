// Script para criar um domínio de teste para testar a exclusão
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestDomain() {
  try {
    console.log('🔧 Criando domínio de teste para exclusão...');
    
    // Buscar a primeira loja disponível
    const firstStore = await prisma.loja_admin.findFirst();
    
    if (!firstStore) {
      console.log('❌ Nenhuma loja encontrada');
      return;
    }
    
    console.log('✅ Loja encontrada:', firstStore.Nome);
    
    // Criar domínio de teste
    const testDomain = await prisma.dominios.create({
      data: {
        dominio: 'teste-exclusao-frontend.com',
        id_loja: firstStore.id,
        cloudflare_zone_id: 'test-zone-frontend-123', // ID fictício para teste
        status: 'pending'
      }
    });
    
    console.log('✅ Domínio de teste criado com sucesso!');
    console.log('🆔 ID:', testDomain.id);
    console.log('🌐 Domínio:', testDomain.dominio);
    console.log('🏪 Loja:', firstStore.Nome);
    
  } catch (error) {
    console.error('❌ Erro ao criar domínio de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDomain();