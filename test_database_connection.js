/**
 * Script para Testar Conectividade com Banco de Dados em Produção
 * 
 * Execute este script no terminal do container Easypanel para verificar:
 * 1. Conectividade com PostgreSQL
 * 2. Existência das tabelas necessárias
 * 3. Dados da loja Shopify
 * 4. Configuração de domínios
 * 
 * Como usar:
 * 1. Acesse o terminal do container no Easypanel
 * 2. Execute: node test_database_connection.js
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 TESTANDO CONECTIVIDADE COM BANCO DE DADOS');
  console.log('=' .repeat(50));
  
  let prisma;
  
  try {
    // Inicializar Prisma
    console.log('\n1. 🔌 Inicializando conexão com Prisma...');
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Testar conexão básica
    console.log('\n2. 🏓 Testando conexão básica...');
    await prisma.$connect();
    console.log('✅ Conexão com banco de dados estabelecida!');
    
    // Verificar variáveis de ambiente
    console.log('\n3. 🔑 Verificando variáveis de ambiente...');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'não definida'}`);
    console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Configurada' : '❌ Não configurada'}`);
    
    // Testar consultas básicas
    console.log('\n4. 📊 Testando consultas nas tabelas principais...');
    
    // Verificar tabela loja_Shopify
    try {
      const lojas = await prisma.loja_Shopify.findMany({
        take: 5,
        select: {
          id_loja: true,
          dominio_api: true,
          nome_loja: true,
          createdAt: true
        }
      });
      console.log(`✅ Tabela loja_Shopify: ${lojas.length} registros encontrados`);
      
      if (lojas.length > 0) {
        console.log('   Exemplos de lojas:');
        lojas.forEach((loja, index) => {
          console.log(`   ${index + 1}. ${loja.nome_loja || 'Sem nome'} (${loja.dominio_api})`);
        });
      }
    } catch (error) {
      console.log('❌ Erro ao consultar tabela loja_Shopify:', error.message);
    }
    
    // Verificar tabela dominios
    try {
      const dominios = await prisma.dominios.findMany({
        where: {
          ativo: true
        },
        take: 5,
        select: {
          id: true,
          dominio: true,
          status: true,
          ativo: true,
          id_loja: true
        }
      });
      console.log(`✅ Tabela dominios (ativos): ${dominios.length} registros encontrados`);
      
      if (dominios.length > 0) {
        console.log('   Domínios ativos:');
        dominios.forEach((dominio, index) => {
          console.log(`   ${index + 1}. ${dominio.dominio} (${dominio.status}) - Loja: ${dominio.id_loja}`);
        });
      }
    } catch (error) {
      console.log('❌ Erro ao consultar tabela dominios:', error.message);
    }
    
    // Verificar tabela produtos
    try {
      const produtosCount = await prisma.produtos.count();
      console.log(`✅ Tabela produtos: ${produtosCount} registros encontrados`);
      
      if (produtosCount > 0) {
        const produtosPorLoja = await prisma.produtos.groupBy({
          by: ['id_loja'],
          _count: {
            id: true
          },
          take: 5
        });
        
        console.log('   Produtos por loja:');
        for (const grupo of produtosPorLoja) {
          console.log(`   Loja ${grupo.id_loja}: ${grupo._count.id} produtos`);
        }
      }
    } catch (error) {
      console.log('❌ Erro ao consultar tabela produtos:', error.message);
    }
    
    // Verificar tabela checkout
    try {
      const checkouts = await prisma.checkout.findMany({
        take: 5,
        select: {
          id: true,
          id_loja: true,
          Tema: true,
          createdAt: true
        }
      });
      console.log(`✅ Tabela checkout: ${checkouts.length} registros encontrados`);
      
      if (checkouts.length > 0) {
        console.log('   Configurações de checkout:');
        checkouts.forEach((checkout, index) => {
          console.log(`   ${index + 1}. Loja ${checkout.id_loja} - Tema: ${checkout.Tema || 'default'}`);
        });
      }
    } catch (error) {
      console.log('❌ Erro ao consultar tabela checkout:', error.message);
    }
    
    // Teste específico: buscar loja por domínio (simular API)
    console.log('\n5. 🔍 Teste específico: Buscar loja por domínio...');
    console.log('💡 Para testar com sua loja, edite a variável TEST_DOMAIN abaixo');
    
    const TEST_DOMAIN = 'sua-loja.myshopify.com'; // EDITE AQUI COM SEU DOMÍNIO REAL
    
    try {
      const lojaShopify = await prisma.loja_Shopify.findFirst({
        where: {
          dominio_api: TEST_DOMAIN
        },
        include: {
          produtos: {
            take: 3,
            select: {
              id: true,
              nome: true,
              shopify_produto_id: true
            }
          }
        }
      });
      
      if (lojaShopify) {
        console.log(`✅ Loja encontrada: ${lojaShopify.nome_loja || 'Sem nome'}`);
        console.log(`   ID: ${lojaShopify.id_loja}`);
        console.log(`   Domínio: ${lojaShopify.dominio_api}`);
        console.log(`   Produtos: ${lojaShopify.produtos.length}`);
        
        // Verificar domínio personalizado
        const dominio = await prisma.dominios.findFirst({
          where: {
            id_loja: lojaShopify.id_loja,
            ativo: true,
            OR: [
              { status: 'verified' },
              { status: 'active' }
            ]
          }
        });
        
        if (dominio) {
          console.log(`✅ Domínio personalizado: checkout.${dominio.dominio} (${dominio.status})`);
        } else {
          console.log('❌ Domínio personalizado não configurado ou inativo');
          console.log('   🔧 SOLUÇÃO: Configure um domínio na aba "Domínio" do dashboard');
        }
        
        // Verificar configuração de checkout
        const checkout = await prisma.checkout.findFirst({
          where: {
            id_loja: lojaShopify.id_loja
          }
        });
        
        if (checkout) {
          console.log(`✅ Configuração de checkout encontrada (Tema: ${checkout.Tema || 'default'})`);
        } else {
          console.log('⚠️ Configuração de checkout não encontrada');
        }
        
      } else {
        console.log(`❌ Loja não encontrada para o domínio: ${TEST_DOMAIN}`);
        console.log('   🔧 SOLUÇÃO: Verifique se a loja está cadastrada no banco de dados');
      }
    } catch (error) {
      console.log('❌ Erro ao buscar loja:', error.message);
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(50));
    console.log('📋 RESUMO DO DIAGNÓSTICO:');
    console.log('\n✅ SUCESSOS:');
    console.log('- Conexão com banco de dados estabelecida');
    console.log('- Tabelas principais acessíveis');
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Edite TEST_DOMAIN com o domínio real da sua loja');
    console.log('2. Execute novamente para testar com dados reais');
    console.log('3. Se a loja não for encontrada, cadastre-a no dashboard');
    console.log('4. Se o domínio não estiver configurado, configure na aba "Domínio"');
    console.log('5. Teste a API: curl "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=SEU_DOMINIO"');
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error.message);
    console.error('\n🔧 POSSÍVEIS CAUSAS:');
    console.error('1. DATABASE_URL não configurada ou inválida');
    console.error('2. Banco de dados inacessível');
    console.error('3. Credenciais de banco incorretas');
    console.error('4. Firewall bloqueando conexão');
    console.error('\nDetalhes do erro:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('\n🔌 Conexão com banco de dados encerrada.');
    }
  }
}

// Executar teste
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('\n✅ Teste concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Teste falhou:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };