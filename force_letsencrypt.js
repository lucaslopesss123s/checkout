const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuração padrão: sempre remover certificados auto-assinados
const AUTO_REMOVE_SELF_SIGNED = process.env.AUTO_REMOVE_SELF_SIGNED !== 'false';

async function forceLetsEncrypt(targetDomain = null) {
  try {
    console.log('🔄 Forçando regeneração com Let\'s Encrypt...');
    
    // Determinar qual domínio usar
    const searchDomain = targetDomain || 'zollim.store';
    console.log(`🎯 Processando domínio: ${searchDomain}`);
    
    // Buscar o domínio
    const dominio = await prisma.dominios.findFirst({
      where: {
        dominio: searchDomain
      },
      include: {
        ssl_certificate: true
      }
    });
    
    if (!dominio) {
      console.log('❌ Domínio não encontrado');
      return;
    }
    
    console.log('📋 Domínio encontrado:', dominio.dominio);
    console.log('   Certificado atual:', dominio.ssl_certificate?.provider || 'Nenhum');
    
    // Remover certificado atual se for auto-assinado (comportamento padrão)
    if (dominio.ssl_certificate && dominio.ssl_certificate.provider === 'self-signed' && AUTO_REMOVE_SELF_SIGNED) {
      console.log('🗑️  Removendo certificado auto-assinado automaticamente...');
      console.log('   💡 Para desabilitar: export AUTO_REMOVE_SELF_SIGNED=false');
      
      // Desassociar do domínio
      await prisma.dominios.update({
        where: { id: dominio.id },
        data: {
          ssl_ativo: false,
          ssl_certificate_id: null
        }
      });
      
      // Remover certificado
      await prisma.sSL_certificates.delete({
        where: { id: dominio.ssl_certificate.id }
      });
      
      console.log('✅ Certificado auto-assinado removido');
    } else if (dominio.ssl_certificate && dominio.ssl_certificate.provider === 'self-signed') {
      console.log('⚠️  Certificado auto-assinado encontrado, mas remoção automática está desabilitada');
      console.log('   💡 Para habilitar: export AUTO_REMOVE_SELF_SIGNED=true');
    }
    
    // Tentar ativar SSL novamente
    console.log('🔄 Tentando ativar SSL com Let\'s Encrypt...');
    
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
      console.log('   Status:', response.status);
      console.log('   Mensagem:', result.message || result.error);
      if (result.details) {
        console.log('   Detalhes:', result.details);
      }
    }
    
    // Verificar resultado final
    const dominioFinal = await prisma.dominios.findUnique({
      where: { id: dominio.id },
      include: {
        ssl_certificate: true
      }
    });
    
    console.log('\n📋 Status final:');
    console.log('   SSL Ativo:', dominioFinal?.ssl_ativo);
    if (dominioFinal?.ssl_certificate) {
      console.log('   Provider:', dominioFinal.ssl_certificate.provider);
      console.log('   Status:', dominioFinal.ssl_certificate.is_active ? 'Ativo' : 'Inativo');
      console.log('   Expira em:', dominioFinal.ssl_certificate.expires_at);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.cause) {
      console.error('   Causa:', error.cause);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Suporte para parâmetros de linha de comando
const args = process.argv.slice(2);
const targetDomain = args[0]; // Primeiro argumento é o domínio

if (args.includes('--help') || args.includes('-h')) {
  console.log('\n🔧 Uso do script force_letsencrypt.js:');
  console.log('   node force_letsencrypt.js [dominio]');
  console.log('\n📋 Exemplos:');
  console.log('   node force_letsencrypt.js                    # Usa zollim.store (padrão)');
  console.log('   node force_letsencrypt.js checkout.zollim.store');
  console.log('   node force_letsencrypt.js meudominio.com');
  console.log('\n⚙️  Variáveis de ambiente:');
  console.log('   AUTO_REMOVE_SELF_SIGNED=false  # Desabilita remoção automática de certificados auto-assinados');
  console.log('\n💡 Por padrão, certificados auto-assinados são removidos automaticamente.');
  process.exit(0);
}

forceLetsEncrypt(targetDomain);