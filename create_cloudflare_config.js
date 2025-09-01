const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createCloudflareConfig() {
  try {
    console.log('Criando configuração do Cloudflare...');
    
    // Buscar lojas disponíveis
    const lojas = await prisma.loja_admin.findMany();
    console.log(`Lojas encontradas: ${lojas.length}`);
    
    if (lojas.length === 0) {
      console.log('❌ Nenhuma loja encontrada!');
      return;
    }
    
    // Usar a primeira loja disponível
    const loja = lojas[0];
    console.log(`Usando loja: ${loja.Nome} (ID: ${loja.id})`);
    
    // Verificar se já existe configuração para esta loja
    const existingConfig = await prisma.cloudflare_config.findFirst({
      where: {
        id_loja: loja.id
      }
    });
    
    if (existingConfig) {
      console.log('⚠️  Configuração já existe para esta loja!');
      console.log('Configuração existente:');
      console.log(`   ID: ${existingConfig.id}`);
      console.log(`   Ativo: ${existingConfig.ativo}`);
      console.log(`   API Token: ${existingConfig.api_token ? 'Configurado' : 'Não configurado'}`);
      return;
    }
    
    // Criar nova configuração (você deve substituir pelos valores reais)
    const newConfig = await prisma.cloudflare_config.create({
      data: {
        id_loja: loja.id,
        api_token: 'SEU_TOKEN_CLOUDFLARE_AQUI', // ⚠️ SUBSTITUA PELO TOKEN REAL
        email: 'seu-email@exemplo.com', // ⚠️ SUBSTITUA PELO EMAIL REAL
        zone_name: 'exemplo.com', // ⚠️ SUBSTITUA PELO DOMÍNIO REAL
        ativo: true
      }
    });
    
    console.log('✅ Configuração criada com sucesso!');
    console.log(`   ID: ${newConfig.id}`);
    console.log(`   Loja: ${loja.Nome}`);
    console.log(`   Ativo: ${newConfig.ativo}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Você deve editar este registro no banco de dados');
    console.log('   e inserir suas credenciais reais do Cloudflare!');
    console.log('');
    console.log('   1. API Token: Obtenha em https://dash.cloudflare.com/profile/api-tokens');
    console.log('   2. Email: Seu email da conta Cloudflare');
    console.log('   3. Zone Name: Seu domínio (ex: meusite.com)');
    
  } catch (error) {
    console.error('Erro ao criar configuração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCloudflareConfig();