const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Verificando usuários cadastrados...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log(`Total de usuários encontrados: ${users.length}`);
    console.log('');
    
    if (users.length === 0) {
      console.log('Nenhum usuário encontrado no banco de dados.');
      return;
    }
    
    console.log('Usuários cadastrados:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Criado em: ${user.createdAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();