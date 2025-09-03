const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...');
    
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log(`\n📊 Total de usuários encontrados: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Lista de usuários:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Criado em: ${user.createdAt}`);
        console.log('   ---');
      });
      
      console.log('\n💡 Para testar o login, use um dos usernames acima.');
      console.log('💡 Se não souber a senha, você pode criar um novo usuário ou resetar a senha.');
    } else {
      console.log('\n❌ Nenhum usuário encontrado no banco de dados!');
      console.log('\n🔧 Para resolver:');
      console.log('1. Crie um usuário através da página de registro');
      console.log('2. Ou execute um script para criar um usuário de teste');
    }
    
    // Verificar lojas também
    const stores = await prisma.loja_admin.findMany({
      select: {
        id: true,
        Nome: true,
        user_id: true
      }
    });
    
    console.log(`\n🏪 Total de lojas encontradas: ${stores.length}`);
    
    if (stores.length > 0) {
      console.log('\n🏪 Lista de lojas:');
      stores.forEach((store, index) => {
        console.log(`${index + 1}. ID: ${store.id}`);
        console.log(`   Nome: ${store.Nome}`);
        console.log(`   User ID: ${store.user_id}`);
        console.log('   ---');
      });
    }
    
    // Verificar configurações Shopify
    const shopifyConfigs = await prisma.loja_Shopify.findMany({
      select: {
        id: true,
        id_loja: true,
        dominio_api: true,
        createdAt: true
      }
    });
    
    console.log(`\n🛍️ Total de configurações Shopify: ${shopifyConfigs.length}`);
    
    if (shopifyConfigs.length > 0) {
      console.log('\n🛍️ Configurações Shopify:');
      shopifyConfigs.forEach((config, index) => {
        console.log(`${index + 1}. ID: ${config.id}`);
        console.log(`   Loja ID: ${config.id_loja}`);
        console.log(`   Domínio: ${config.dominio_api}`);
        console.log(`   Criado em: ${config.createdAt}`);
        console.log('   ---');
      });
    } else {
      console.log('\n⚠️ Nenhuma configuração Shopify encontrada!');
      console.log('Isso explica por que as credenciais Shopify não estão carregando.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();