const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCloudflareConfig() {
  try {
    console.log('Verificando configurações do Cloudflare...');
    
    const configs = await prisma.cloudflare_config.findMany();
    
    console.log(`Configurações encontradas: ${configs.length}`);
    
    if (configs.length === 0) {
      console.log('❌ Nenhuma configuração do Cloudflare encontrada!');
      console.log('\n📋 Lojas disponíveis:');
      
      const lojas = await prisma.loja_admin.findMany();
      lojas.forEach((loja, i) => {
        console.log(`   ${i+1}. ${loja.Nome} (ID: ${loja.id})`);
      });
      
      return;
    }
    
    configs.forEach((config, i) => {
      console.log(`\n${i+1}. Loja ID: ${config.id_loja}`);
      console.log(`   Ativo: ${config.ativo}`);
      console.log(`   API Token: ${config.api_token ? 'Configurado' : 'Não configurado'}`);
      console.log(`   Email: ${config.email || 'Não configurado'}`);
      console.log(`   Zone Name: ${config.zone_name || 'Não configurado'}`);
      console.log(`   Criado em: ${config.createdAt}`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCloudflareConfig();