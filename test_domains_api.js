const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDomainsAPI() {
  try {
    console.log('Testando API de domínios...');
    
    // Buscar a loja que tem o domínio zollim.store
    const dominio = await prisma.dominios.findFirst({
      where: {
        dominio: 'zollim.store'
      },
      include: {
        loja: true
      }
    });
    
    if (!dominio) {
      console.log('Domínio zollim.store não encontrado');
      return;
    }
    
    const loja = dominio.loja;
    
    console.log(`Testando com loja: ${loja.id}`);
    
    // Simular a consulta da API
    const dominios = await prisma.dominios.findMany({
      where: {
        id_loja: loja.id,
        ativo: true
      },
      include: {
        ssl_certificate: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('Domínios encontrados:', dominios.length);
    
    dominios.forEach(dominio => {
      console.log('\n--- Domínio ---');
      console.log('ID:', dominio.id);
      console.log('Domínio:', dominio.dominio);
      console.log('Status:', dominio.status);
      console.log('SSL Ativo:', dominio.ssl_ativo);
      console.log('Certificado SSL:', dominio.ssl_certificate ? 'Sim' : 'Não');
      
      if (dominio.ssl_certificate) {
        console.log('Certificado ID:', dominio.ssl_certificate.id);
        console.log('Certificado Domínio:', dominio.ssl_certificate.domain);
        console.log('Certificado Ativo:', dominio.ssl_certificate.is_active);
        console.log('Expira em:', dominio.ssl_certificate.expires_at);
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDomainsAPI();