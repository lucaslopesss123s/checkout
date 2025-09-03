import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('id')

    if (!domainId) {
      return NextResponse.json({ error: 'ID do domínio é obrigatório' }, { status: 400 })
    }

    // Buscar o domínio no banco de dados na tabela Dominios
    // Primeiro buscar a loja do usuário
    const userStore = await prisma.loja_admin.findFirst({
      where: {
        user_id: user.id
      }
    })

    if (!userStore) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    // Buscar o domínio da loja
    const domainData = await prisma.dominios.findFirst({
      where: {
        id: domainId,
        id_loja: userStore.id
      }
    })

    if (!domainData) {
      return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 })
    }

    try {
      // Tentar deletar a zona do Cloudflare se existir cloudflare_zone_id
      if (domainData.cloudflare_zone_id) {
        // Usar token fixo do Cloudflare que está funcionando
        const CF_TOKEN = 'Xfh4fwnRxG11r90AK8ngKYCeqjxWjS5VIRUYKBaE'
        
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${domainData.cloudflare_zone_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${CF_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          console.log(`Zona ${domainData.cloudflare_zone_id} deletada do Cloudflare com sucesso`)
        } else {
          const errorData = await response.json()
          console.warn(`Falha ao deletar zona do Cloudflare: ${response.statusText}`, errorData)
        }
      }
    } catch (error) {
      console.warn('Erro ao deletar zona do Cloudflare:', error)
      // Continuar com a exclusão do banco mesmo se falhar no Cloudflare
    }

    // Deletar do banco de dados
    await prisma.dominios.delete({
      where: {
        id: domainId
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Domínio deletado com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao deletar domínio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}