const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const userId = 'cf795435-0bde-4bad-bf69-7c4eb634f828';
    
    console.log('=== Verificando lojas do usuário ===');
    const lojas = await prisma.loja_admin.findMany({
      where: { user_id: userId }
    });
    console.log('Lojas encontradas:', lojas.length);
    lojas.forEach((loja, index) => {
      console.log(`${index + 1}. ID: ${loja.id}, Nome: ${loja.nome}`);
    });
    
    if (lojas.length > 0) {
      console.log('\n=== Verificando domínios das lojas ===');
      const dominios = await prisma.dominios.findMany({
        where: {
          id_loja: { in: lojas.map(l => l.id) }
        }
      });
      console.log('Domínios encontrados:', dominios.length);
      dominios.forEach((dominio, index) => {
        console.log(`${index + 1}. Domínio: ${dominio.dominio}, Status: ${dominio.status}, Loja ID: ${dominio.id_loja}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();