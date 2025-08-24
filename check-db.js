const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== Lojas Shopify ===');
    const lojas = await prisma.loja_Shopify.findMany();
    console.log(JSON.stringify(lojas, null, 2));
    
    console.log('\n=== Domínios ===');
    const dominios = await prisma.dominios.findMany();
    console.log(JSON.stringify(dominios, null, 2));
    
    console.log('\n=== Lojas Admin ===');
    const lojasAdmin = await prisma.loja_admin.findMany();
    console.log(JSON.stringify(lojasAdmin, null, 2));
    
    console.log('\n=== Verificando relacionamento ===');
    const loja1 = await prisma.loja_admin.findFirst({ where: { id: '1' } });
    console.log('Loja com ID "1":', loja1);
    
    // Verificar se existe domínio para uma das lojas existentes
    const dominioParaLojaExistente = await prisma.dominios.findFirst({
      where: { id_loja: '5d38b556-cb47-4493-8363-4b655b416df9' }
    });
    console.log('Domínio para loja 5d38b556...:', dominioParaLojaExistente);
    
    console.log('\n=== Problema identificado ===');
    console.log('O domínio está associado ao id_loja: "1", mas:');
    console.log('1. Não existe loja_admin com ID "1"');
    console.log('2. Não existe loja_Shopify cadastrada');
    console.log('3. A API busca loja_Shopify pelo dominio_api, mas não há nenhuma');
    console.log('\nSolução: Criar uma loja_Shopify ou atualizar o id_loja do domínio');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();