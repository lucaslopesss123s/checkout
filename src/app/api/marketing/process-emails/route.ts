import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

// POST - Processar emails agendados
export async function POST(request: NextRequest) {
  try {
    // Buscar eventos que devem ser processados agora
    const eventosParaProcessar = await prisma.marketingEvents.findMany({
      where: {
        status: 'pendente',
        agendado_para: {
          lte: new Date()
        }
      },
      include: {
        template: true
      },
      take: 50 // Processar até 50 eventos por vez
    })

    if (eventosParaProcessar.length === 0) {
      return NextResponse.json({
        message: 'Nenhum email para processar',
        processados: 0
      })
    }

    let emailsEnviados = 0
    let emailsComErro = 0

    for (const evento of eventosParaProcessar) {
      try {
        // Buscar configurações de domínio da loja
        const dominio = await prisma.dominios.findFirst({
          where: {
            id_loja: evento.id_loja,
            status: 'ativo'
          }
        })

        if (!dominio || !evento.email_cliente) {
          await prisma.marketingEvents.update({
            where: { id: evento.id },
            data: {
              status: 'erro',
              erro_envio: 'Domínio não encontrado ou email do cliente não informado',
              updatedAt: new Date()
            }
          })
          emailsComErro++
          continue
        }

        // Personalizar mensagem do template
        let mensagemPersonalizada = evento.template.mensagem
        
        // Substituir variáveis na mensagem
        if (evento.nome_cliente) {
          mensagemPersonalizada = mensagemPersonalizada.replace(/\{nome\}/g, evento.nome_cliente)
        }
        
        if (evento.dados_evento) {
          const dados = evento.dados_evento as any
          if (dados.link_checkout) {
            mensagemPersonalizada = mensagemPersonalizada.replace(/\{link_checkout\}/g, dados.link_checkout)
          }
          if (dados.valor_total) {
            mensagemPersonalizada = mensagemPersonalizada.replace(/\{valor_total\}/g, `R$ ${dados.valor_total.toFixed(2)}`)
          }
        }

        // Configurar transporter do nodemailer (usando configurações básicas)
        // Em produção, você deve configurar com suas credenciais SMTP
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })

        // Enviar email
        await transporter.sendMail({
          from: `"${dominio.nome}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: evento.email_cliente,
          subject: evento.template.assunto,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${evento.template.assunto}</h2>
              <div style="line-height: 1.6; color: #666;">
                ${mensagemPersonalizada.replace(/\n/g, '<br>')}
              </div>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999;">
                Este email foi enviado por ${dominio.nome}. Se você não deseja mais receber esses emails, 
                <a href="#" style="color: #999;">clique aqui para cancelar</a>.
              </p>
            </div>
          `
        })

        // Marcar como enviado
        await prisma.marketingEvents.update({
          where: { id: evento.id },
          data: {
            status: 'enviado',
            enviado_em: new Date(),
            updatedAt: new Date()
          }
        })

        emailsEnviados++

      } catch (error) {
        console.error(`Erro ao enviar email para evento ${evento.id}:`, error)
        
        // Marcar como erro
        await prisma.marketingEvents.update({
          where: { id: evento.id },
          data: {
            status: 'erro',
            erro_envio: error instanceof Error ? error.message : 'Erro desconhecido',
            updatedAt: new Date()
          }
        })
        
        emailsComErro++
      }
    }

    return NextResponse.json({
      message: 'Processamento concluído',
      total_eventos: eventosParaProcessar.length,
      emails_enviados: emailsEnviados,
      emails_com_erro: emailsComErro
    })

  } catch (error) {
    console.error('Erro ao processar emails:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Status do processamento
export async function GET() {
  try {
    const estatisticas = await prisma.marketingEvents.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
        }
      }
    })

    const proximosEmails = await prisma.marketingEvents.findMany({
      where: {
        status: 'pendente',
        agendado_para: {
          gte: new Date()
        }
      },
      orderBy: {
        agendado_para: 'asc'
      },
      take: 10,
      include: {
        template: {
          select: {
            assunto: true,
            evento: true
          }
        }
      }
    })

    return NextResponse.json({
      estatisticas_24h: estatisticas,
      proximos_emails: proximosEmails
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}