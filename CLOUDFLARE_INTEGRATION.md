# Integração Cloudflare - Sistema de Checkout

## Visão Geral

Este sistema implementa uma integração completa com a Cloudflare para gerenciamento automático de domínios, DNS e SSL para checkouts personalizados.

## Estrutura da Integração

### 1. Conta Cloudflare Única
- Uma conta Cloudflare centralizada gerencia todos os domínios dos clientes
- Cada domínio é adicionado como uma zona via API
- Nameservers são gerados automaticamente pela Cloudflare

### 2. Fluxo do Cliente
1. Cliente insere domínio (ex: `checkout.empresa.com.br`)
2. Sistema cria zona na Cloudflare via API
3. Cloudflare retorna nameservers para configuração
4. Cliente configura nameservers no registrador
5. Após validação, sistema automaticamente:
   - Cria registro DNS A apontando para IP do servidor
   - Ativa proxy (orange cloud) para SSL automático
   - Checkout fica 100% HTTPS

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` com as seguintes variáveis:

```env
# Cloudflare API Configuration
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_EMAIL=your_cloudflare_email
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Server Configuration
CHECKOUT_SERVER_IP=your_server_ip_address
```

### Permissões do Token API

O token da Cloudflare deve ter as seguintes permissões:
- **Zone:Edit** - Para criar e modificar zonas
- **DNS:Edit** - Para gerenciar registros DNS
- **Zone Settings:Edit** - Para configurar SSL e proxy

## Arquivos Implementados

### Backend (API Routes)

1. **`src/app/api/cloudflare/zones/manage/route.ts`**
   - `POST`: Criar nova zona
   - `GET`: Listar zonas da loja
   - `DELETE`: Remover zona

2. **`src/app/api/cloudflare/zones/status/route.ts`**
   - `POST`: Verificar status e configurar DNS
   - `GET`: Listar zonas com status

### Configuração

3. **`src/lib/cloudflare-config.ts`**
   - Funções para interagir com API Cloudflare
   - Gerenciamento de zonas e DNS

### Frontend

4. **`src/app/dashboard/cloudflare/page.tsx`**
   - Interface dedicada para gerenciar Cloudflare
   - Visualização de zonas e status

5. **`src/app/dashboard/dominio/page.tsx`** (Atualizado)
   - Toggle entre Cloudflare e sistema tradicional
   - Interface unificada para ambos os modos

## Como Usar

### 1. Configuração Inicial
1. Configure as variáveis de ambiente
2. Reinicie a aplicação
3. Acesse o dashboard de domínios

### 2. Adicionando Domínio via Cloudflare
1. No dashboard, selecione modo "Cloudflare"
2. Digite o domínio desejado
3. Clique em "Criar Zona Cloudflare"
4. Copie os nameservers exibidos
5. Configure no seu registrador de domínio
6. Clique em "Verificar Status" após configuração

### 3. Verificação Automática
- Sistema verifica automaticamente se zona está ativa
- Configura DNS A record para `checkout.seudominio.com`
- Ativa proxy para SSL automático
- Atualiza status no dashboard

## Vantagens da Integração

### Para o Administrador
- **Centralização**: Todos os domínios em uma conta
- **Automação**: DNS e SSL configurados automaticamente
- **Monitoramento**: Status em tempo real de todas as zonas
- **Escalabilidade**: Suporte a milhares de domínios

### Para o Cliente
- **Simplicidade**: Apenas configurar nameservers
- **Velocidade**: SSL ativo em minutos
- **Confiabilidade**: CDN global da Cloudflare
- **Segurança**: Proteção DDoS automática

## Troubleshooting

### Problemas Comuns

1. **Erro de Autenticação**
   - Verifique se o token API está correto
   - Confirme permissões do token

2. **Zona não Ativa**
   - Verifique se nameservers foram configurados
   - Aguarde propagação DNS (até 24h)

3. **DNS não Configurado**
   - Confirme se IP do servidor está correto
   - Verifique se zona está ativa na Cloudflare

### Logs e Debug

- Logs da API estão disponíveis no console do servidor
- Status detalhado no dashboard da aplicação
- Verificação manual possível no painel Cloudflare

## Migração do Sistema Tradicional

### Passos para Migração

1. **Backup**: Exporte lista de domínios atuais
2. **Configuração**: Configure variáveis Cloudflare
3. **Teste**: Teste com um domínio de desenvolvimento
4. **Migração Gradual**: Migre domínios em lotes
5. **Verificação**: Confirme funcionamento de todos os checkouts

### Compatibilidade

- Sistema mantém compatibilidade com método tradicional
- Toggle permite alternar entre modos
- Migração pode ser feita gradualmente

## Segurança

### Boas Práticas

- **Tokens**: Use tokens com permissões mínimas necessárias
- **Rotação**: Rotacione tokens periodicamente
- **Monitoramento**: Monitore uso da API
- **Backup**: Mantenha backup das configurações

### Limitações da API

- Cloudflare tem limites de rate limiting
- Máximo de 1000 zonas por conta (plano gratuito)
- Algumas funcionalidades requerem planos pagos

## Suporte

Para suporte técnico:
1. Verifique logs da aplicação
2. Consulte documentação da Cloudflare API
3. Teste configurações no painel Cloudflare

---

**Versão**: 1.0  
**Data**: Janeiro 2025  
**Compatibilidade**: Next.js 15.3.3, Cloudflare API v4