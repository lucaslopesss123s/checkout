const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getDomainId() {
  try {
    console.log('Buscando ID do domínio zollim.store...');
    
    const dominio = await prisma.dominios.findFirst({
      where: {
        dominio: 'zollim.store'
      }
    });
    
    if (!dominio) {
      console.log('❌ Domínio zollim.store não encontrado');
      return;
    }
    
    console.log('✅ Domínio encontrado:');
    console.log(`   ID: ${dominio.id}`);
    console.log(`   Domínio: ${dominio.dominio}`);
    console.log(`   Status: ${dominio.status}`);
    console.log(`   DNS Verificado: ${dominio.dns_verificado}`);
    console.log(`   SSL Ativo: ${dominio.ssl_ativo}`);
    console.log(`   ID Loja: ${dominio.id_loja}`);
    
    return dominio.id;
    
  } catch (error) {
    console.error('Erro ao buscar domínio:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getDomainId();