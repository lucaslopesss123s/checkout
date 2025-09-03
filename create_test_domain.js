const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestDomain() {
  try {
    console.log('Criando domínio de teste...');
    
    // Buscar a primeira loja disponível
    const loja = await prisma.loja_admin.findFirst();
    
    if (!loja) {
      console.log('❌ Nenhuma loja encontrada!');
      return;
    }
    
    console.log(`Usando loja: ${loja.Nome} (ID: ${loja.id})`);
    
    // Criar domínio de teste
    const testDomain = await prisma.dominios.create({
      data: {
        dominio: 'teste-exclusao.com',
        id_loja: loja.id,
        cloudflare_zone_id: 'test-zone-id-123', // ID fictício para teste
        status: 'pending'
      }
    });
    
    console.log('✅ Domínio de teste criado com sucesso!');
    console.log(`   ID: ${testDomain.id}`);
    console.log(`   Domínio: ${testDomain.dominio}`);
    console.log(`   Cloudflare Zone ID: ${testDomain.cloudflare_zone_id}`);
    console.log(`   Status: ${testDomain.status}`);
    
  } catch (error) {
    console.error('Erro ao criar domínio de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDomain();