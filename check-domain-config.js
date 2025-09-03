const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDomainConfig() {
  try {
    console.log('Verificando configuração de domínio para loja egex0y-ue.myshopify.com...');
    
    // Primeiro, buscar a loja Shopify
    const lojaShopify = await prisma.loja_Shopify.findFirst({
      where: {
        dominio_api: 'egex0y-ue.myshopify.com'
      }
    });
    
    if (!lojaShopify) {
      console.log('❌ Loja Shopify não encontrada');
      return;
    }
    
    console.log('✅ Loja encontrada:');
    console.log('ID:', lojaShopify.id);
    console.log('Domínio:', lojaShopify.dominio_api);
    console.log('ID da Loja:', lojaShopify.id_loja);
    
    // Buscar domínio personalizado para esta loja
    const dominio = await prisma.dominios.findFirst({
      where: {
        id_loja: lojaShopify.id_loja
      }
    });
    
    if (!dominio) {
      console.log('\n❌ Nenhum domínio personalizado configurado para esta loja');
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Acesse o dashboard da loja');
      console.log('2. Vá para a aba "Domínio"');
      console.log('3. Configure um domínio personalizado');
      console.log('4. Verifique o DNS');
      return;
    }
    
    console.log('\n📋 Domínio encontrado:');
    console.log('ID:', dominio.id);
    console.log('Domínio:', dominio.dominio);
    console.log('Subdomínio:', dominio.subdominio);
    console.log('Status:', dominio.status);
    console.log('DNS Verificado:', dominio.dns_verificado);
    console.log('Ativo:', dominio.ativo);
    console.log('SSL Ativo:', dominio.ssl_ativo);
    
    // Verificar se está tudo configurado corretamente
    const isConfigured = dominio.status === 'verified' && dominio.dns_verificado && dominio.ativo;
    
    if (isConfigured) {
      console.log('\n✅ Domínio está configurado corretamente!');
      console.log(`URL do checkout: https://${dominio.subdominio}.${dominio.dominio}`);
      
      // Testar se o script seria gerado
      console.log('\n🔧 Testando geração do script...');
      const isDevelopment = process.env.NODE_ENV === 'development';
      const checkoutBaseUrl = isDevelopment ? 'http://localhost:3000' : `https://checkout.${dominio.dominio}`;
      const configBaseUrl = isDevelopment ? 'http://localhost:3000' : `https://checkout.${dominio.dominio}`;
      
      console.log('Ambiente:', isDevelopment ? 'Desenvolvimento' : 'Produção');
      console.log('Checkout Base URL:', checkoutBaseUrl);
      console.log('Config Base URL:', configBaseUrl);
      
    } else {
      console.log('\n❌ Domínio não está configurado corretamente!');
      console.log('\n🔧 PROBLEMAS IDENTIFICADOS:');
      
      if (dominio.status !== 'verified') {
        console.log('- Status não é "verified" (atual:', dominio.status + ')');
      }
      
      if (!dominio.dns_verificado) {
        console.log('- DNS não foi verificado');
      }
      
      if (!dominio.ativo) {
        console.log('- Domínio não está ativo');
      }
      
      console.log('\n🔧 SOLUÇÕES:');
      console.log('1. Acesse o dashboard da loja');
      console.log('2. Vá para a aba "Domínio"');
      console.log('3. Clique em "Verificar" no domínio');
      console.log('4. Certifique-se de que o DNS está configurado corretamente');
    }
    
    // Verificar todos os domínios da loja
    const todosDominios = await prisma.dominios.findMany({
      where: {
        id_loja: lojaShopify.id_loja
      }
    });
    
    console.log('\n📊 Total de domínios para esta loja:', todosDominios.length);
    
    if (todosDominios.length > 1) {
      console.log('\n📋 Todos os domínios:');
      todosDominios.forEach((d, index) => {
        console.log(`${index + 1}. ${d.dominio} (Status: ${d.status}, DNS: ${d.dns_verificado ? 'OK' : 'Falha'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar configuração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDomainConfig();