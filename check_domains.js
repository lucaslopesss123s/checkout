const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDomains() {
  try {
    console.log('Verificando domínios cadastrados...');
    
    const domains = await prisma.dominios.findMany({
      include: {
        // Incluir dados da loja se necessário
      }
    });
    
    console.log(`Total de domínios encontrados: ${domains.length}`);
    
    if (domains.length > 0) {
      console.log('\nDomínios cadastrados:');
      domains.forEach((domain, index) => {
        console.log(`${index + 1}. ID: ${domain.id}`);
        console.log(`   Domínio: ${domain.dominio}`);
        console.log(`   ID Loja: ${domain.id_loja}`);
        console.log(`   Cloudflare Zone ID: ${domain.cloudflare_zone_id || 'N/A'}`);
        console.log(`   Status: ${domain.status || 'N/A'}`);
        console.log('---');
      });
    } else {
      console.log('Nenhum domínio encontrado no banco de dados.');
    }
    
  } catch (error) {
    console.error('Erro ao consultar domínios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDomains();