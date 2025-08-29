const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkShopifyConfig() {
  try {
    console.log('Verificando configuração Shopify para yzhihz-1v.myshopify.com...');
    
    // Buscar loja Shopify
    const lojaShopify = await prisma.loja_Shopify.findFirst({
      where: {
        dominio_api: 'yzhihz-1v.myshopify.com'
      }
    });
    
    if (!lojaShopify) {
      console.log('❌ Loja Shopify não encontrada para o domínio yzhihz-1v.myshopify.com');
      console.log('\n📋 Lojas Shopify configuradas:');
      
      const todasLojas = await prisma.loja_Shopify.findMany();
      if (todasLojas.length === 0) {
        console.log('   Nenhuma loja Shopify configurada');
      } else {
        todasLojas.forEach((loja, index) => {
          console.log(`   ${index + 1}. ${loja.dominio_api} (ID: ${loja.id_loja})`);
        });
      }
      return;
    }
    
    console.log('✅ Loja Shopify encontrada:');
    console.log(`   ID: ${lojaShopify.id}`);
    console.log(`   ID Loja: ${lojaShopify.id_loja}`);
    console.log(`   Domínio: ${lojaShopify.dominio_api}`);
    
    // Verificar domínio personalizado
    const dominio = await prisma.dominios.findFirst({
      where: {
        id_loja: lojaShopify.id_loja,
        status: 'verified',
        dns_verificado: true,
        ativo: true
      }
    });
    
    if (!dominio) {
      console.log('\n❌ Nenhum domínio personalizado configurado e verificado');
      
      // Verificar se há domínios não verificados
      const dominiosNaoVerificados = await prisma.dominios.findMany({
        where: {
          id_loja: lojaShopify.id_loja
        }
      });
      
      if (dominiosNaoVerificados.length > 0) {
        console.log('\n📋 Domínios encontrados (não verificados):');
        dominiosNaoVerificados.forEach((dom, index) => {
          console.log(`   ${index + 1}. ${dom.dominio} (Status: ${dom.status}, DNS: ${dom.dns_verificado})`);
        });
      } else {
        console.log('\n📋 Nenhum domínio configurado para esta loja');
      }
    } else {
      console.log('\n✅ Domínio personalizado encontrado:');
      console.log(`   Domínio: ${dominio.dominio}`);
      console.log(`   Status: ${dominio.status}`);
      console.log(`   DNS Verificado: ${dominio.dns_verificado}`);
      console.log(`   SSL Ativo: ${dominio.ssl_ativo}`);
    }
    
  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShopifyConfig();