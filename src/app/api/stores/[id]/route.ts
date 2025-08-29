import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const lojaId = id;

    // Verificar se a loja pertence ao usuário
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: lojaId,
        user_id: user.id,
      },
    });

    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada ou você não tem permissão para deletá-la' },
        { status: 404 }
      );
    }

    // Deletar todos os dados relacionados à loja em uma transação
    await prisma.$transaction(async (tx) => {
      // 1. Deletar pedidos
      await tx.pedidos.deleteMany({
        where: { id_loja: lojaId }
      });

      // 2. Deletar carrinhos abandonados
      await tx.carrinho.deleteMany({
        where: { id_loja: lojaId }
      });

      // 3. Deletar sessões de checkout
      await tx.checkoutSession.deleteMany({
        where: { id_loja: lojaId }
      });

      // 4. Deletar produtos
      await tx.produtos.deleteMany({
        where: { id_loja: lojaId }
      });

      // 5. Deletar configurações de checkout
      await tx.checkout.deleteMany({
        where: { id_loja: lojaId }
      });

      // 6. Deletar opções de frete
      await tx.frete.deleteMany({
        where: { id_loja: lojaId }
      });

      // 7. Deletar domínios personalizados
      const dominios = await tx.dominios.findMany({
        where: { id_loja: lojaId },
        include: { ssl_certificate: true }
      });

      // Deletar certificados SSL relacionados
      for (const dominio of dominios) {
        if (dominio.ssl_certificate) {
          await tx.sSL_certificates.delete({
            where: { id: dominio.ssl_certificate.id }
          });
        }
      }

      // Deletar domínios
      await tx.dominios.deleteMany({
        where: { id_loja: lojaId }
      });

      // 8. Deletar configurações da loja (Loja_config)
      await tx.loja_config.deleteMany({
        where: { id_loja: lojaId }
      });

      // 9. Por último, deletar a loja principal
      await tx.loja_admin.delete({
        where: { id: lojaId }
      });
    });

    return NextResponse.json(
      { message: 'Loja e todos os dados relacionados foram deletados com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao deletar loja:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao deletar a loja' },
      { status: 500 }
    );
  }
}