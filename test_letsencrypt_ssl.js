const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLetsEncryptSSL() {
  try {
    console.log('Testando ativação SSL com Let\'s Encrypt...');
    
    // Buscar o domínio zollim.store
    const dominio = await prisma.dominios.findFirst({
      where: {
        dominio: 'zollim.store'
      },
      include: {
        ssl_certificate: true
      }
    });
    
    if (!dominio) {
      console.log('❌ Domínio zollim.store não encontrado');
      return;
    }
    
    console.log('📋 Status atual do domínio:');
    console.log('   ID:', dominio.id);
    console.log('   Domínio:', dominio.dominio);
    console.log('   Status:', dominio.status);
    console.log('   DNS Verificado:', dominio.dns_verificado);
    console.log('   SSL Ativo:', dominio.ssl_ativo);
    console.log('   Certificado atual:', dominio.ssl_certificate ? dominio.ssl_certificate.provider : 'Nenhum');
    
    if (dominio.status !== 'verified') {
      console.log('❌ Domínio precisa estar verificado para ativar SSL');
      return;
    }
    
    if (!dominio.dns_verificado) {
      console.log('❌ DNS precisa estar verificado para ativar SSL');
      return;
    }
    
    console.log('\n🔄 Testando ativação SSL via API...');
    
    // Fazer requisição para a API de ativação SSL
    const response = await fetch('http://localhost:3000/api/ssl/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        domainId: dominio.id
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ SSL ativado com sucesso!');
      console.log('   Provider:', result.certificate?.provider || 'N/A');
      console.log('   Status:', result.certificate?.status || 'N/A');
      console.log('   Expira em:', result.certificate?.expires_at || 'N/A');
    } else {
      console.log('❌ Erro na ativação SSL:');
      console.log('   Mensagem:', result.message || result.error);
      if (result.details) {
        console.log('   Detalhes:', result.details);
      }
    }
    
    // Verificar status final no banco
    console.log('\n📋 Status final no banco de dados:');
    const dominioFinal = await prisma.dominios.findUnique({
      where: { id: dominio.id },
      include: {
        ssl_certificate: true
      }
    });
    
    if (dominioFinal) {
      console.log('   SSL Ativo:', dominioFinal.ssl_ativo);
      if (dominioFinal.ssl_certificate) {
        console.log('   Certificado Provider:', dominioFinal.ssl_certificate.provider);
        console.log('   Certificado Status:', dominioFinal.ssl_certificate.is_active ? 'Ativo' : 'Inativo');
        console.log('   Expira em:', dominioFinal.ssl_certificate.expires_at);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.cause) {
      console.error('   Causa:', error.cause);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testLetsEncryptSSL();