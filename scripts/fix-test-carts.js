const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTestCarts() {
  try {
    console.log('🔧 Corrigindo carrinhos de teste...')
    
    // Atualizar todos os carrinhos abandonados para incluir primeira_etapa_em
    const result = await prisma.carrinho.updateMany({
      where: {
        status: 'abandonado',
        primeira_etapa_em: null
      },
      data: {
        primeira_etapa_em: new Date()
      }
    })
    
    console.log(`✅ ${result.count} carrinhos atualizados com primeira_etapa_em`)
    
    // Listar carrinhos por loja
    const carrinhos = await prisma.carrinho.findMany({
      where: {
        status: 'abandonado'
      },
      select: {
        id: true,
        id_loja: true,
        nome: true,
        email: true,
        status: true,
        primeira_etapa_em: true
      }
    })
    
    console.log('\n📊 Carrinhos abandonados por loja:')
    const porLoja = carrinhos.reduce((acc, carrinho) => {
      if (!acc[carrinho.id_loja]) {
        acc[carrinho.id_loja] = []
      }
      acc[carrinho.id_loja].push(carrinho)
      return acc
    }, {})
    
    Object.entries(porLoja).forEach(([loja, carrinhos]) => {
      console.log(`\n🏪 Loja ${loja}: ${carrinhos.length} carrinhos`)
      carrinhos.forEach(carrinho => {
        console.log(`  - ${carrinho.nome} (${carrinho.email}) - ${carrinho.primeira_etapa_em ? '✅' : '❌'} primeira etapa`)
      })
    })
    
  } catch (error) {
    console.error('❌ Erro ao corrigir carrinhos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTestCarts()