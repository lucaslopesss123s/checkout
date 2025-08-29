const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSSLCert() {
  try {
    console.log('Verificando certificado SSL para checkout.zollim.store...');
    
    const cert = await prisma.sSL_certificates.findFirst({
      where: {
        domain: 'checkout.zollim.store'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!cert) {
      console.log('❌ Nenhum certificado SSL encontrado para checkout.zollim.store');
      
      // Verificar todos os certificados
      const allCerts = await prisma.sSL_certificates.findMany();
      console.log('\n📋 Certificados SSL existentes:');
      if (allCerts.length === 0) {
        console.log('   Nenhum certificado encontrado');
      } else {
        allCerts.forEach((c, index) => {
          console.log(`   ${index + 1}. ${c.domain} (Status: ${c.status}, Expira: ${c.expires_at})`);
        });
      }
      return;
    }
    
    console.log('✅ Certificado SSL encontrado:');
    console.log(`   ID: ${cert.id}`);
    console.log(`   Domínio: ${cert.domain}`);
    console.log(`   Status: ${cert.status}`);
    console.log(`   Provider: ${cert.provider}`);
    console.log(`   Criado em: ${cert.createdAt}`);
    console.log(`   Expira em: ${cert.expires_at}`);
    console.log(`   Auto-renovar: ${cert.auto_renew}`);
    
    // Verificar se está expirado
    const now = new Date();
    const expiresAt = new Date(cert.expires_at);
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
      console.log('⚠️  Certificado EXPIRADO!');
    } else if (daysUntilExpiry <= 7) {
      console.log(`⚠️  Certificado expira em ${daysUntilExpiry} dias`);
    } else {
      console.log(`✅ Certificado válido por mais ${daysUntilExpiry} dias`);
    }
    
  } catch (error) {
    console.error('Erro ao verificar certificado SSL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSSLCert();