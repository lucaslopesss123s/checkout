# Guia de Migração para Cloudflare

Este guia fornece instruções detalhadas para migrar do sistema de domínios tradicional para a integração com Cloudflare.

## Visão Geral

A integração com Cloudflare oferece:
- **Gerenciamento automático de DNS**: Criação e configuração automática de registros DNS
- **SSL automático**: Ativação automática do Universal SSL do Cloudflare
- **Proteção DDoS**: Proteção automática contra ataques DDoS
- **CDN global**: Melhoria de performance com cache distribuído
- **Configuração simplificada**: Interface unificada para gerenciar domínios

## Pré-requisitos

### 1. Conta Cloudflare
- Criar uma conta gratuita em [cloudflare.com](https://cloudflare.com)
- Verificar o email da conta

### 2. API Token
- Acessar **My Profile** > **API Tokens**
- Criar um **Custom Token** com as seguintes permissões:
  - **Zone:Zone:Edit**
  - **Zone:DNS:Edit** 
  - **Zone:Zone Settings:Edit**
  - **Zone:SSL and Certificates:Edit**

### 3. Domínio
- Ter um domínio registrado
- Acesso ao painel do registrador para alterar nameservers

## Processo de Migração

### Etapa 1: Configurar Cloudflare no Dashboard

1. **Acessar Integrações**
   - No dashboard, vá para **Integrações** > **Cloudflare**

2. **Inserir Credenciais**
   ```
   API Token: [seu-token-aqui]
   Email: seu-email@exemplo.com
   Zone Name: seudominio.com
   ```

3. **Testar Conexão**
   - Clique em "Testar Conexão"
   - Aguarde confirmação de sucesso

4. **Salvar Configuração**
   - Clique em "Salvar Configuração"
   - A configuração será validada e salva

### Etapa 2: Gerenciar Zonas

1. **Visualizar Zonas**
   - Após salvar, as zonas disponíveis serão listadas
   - Verifique se seu domínio aparece na lista

2. **Status das Zonas**
   - **Active**: Zona configurada e funcionando
   - **Pending**: Aguardando alteração de nameservers
   - **Initializing**: Zona sendo configurada

### Etapa 3: Configurar Domínios

1. **Acessar Gerenciamento de Domínios**
   - Vá para **Dashboard** > **Domínios**

2. **Ativar Cloudflare**
   - Clique no toggle "Cloudflare" (azul)
   - O sistema mudará para o modo Cloudflare

3. **Adicionar Domínio**
   - Clique em "Adicionar Domínio via Cloudflare"
   - Selecione o domínio da lista
   - O sistema criará automaticamente:
     - Zona no Cloudflare (se não existir)
     - Registros DNS necessários
     - Configuração SSL

### Etapa 4: Alterar Nameservers

1. **Obter Nameservers**
   - Após adicionar o domínio, você receberá os nameservers:
     ```
     ns1.cloudflare.com
     ns2.cloudflare.com
     ```

2. **Configurar no Registrador**
   - Acesse o painel do seu registrador de domínio
   - Altere os nameservers para os fornecidos pelo Cloudflare
   - Aguarde propagação (pode levar até 24 horas)

3. **Verificar Propagação**
   - Use ferramentas como `nslookup` ou `dig`
   - Ou sites como [whatsmydns.net](https://whatsmydns.net)

### Etapa 5: Configuração SSL Automática

1. **Verificação Automática**
   - O sistema verifica automaticamente zonas ativas
   - SSL é configurado automaticamente quando a zona fica ativa

2. **Gerenciamento Manual**
   - Na página de integrações, use o **SSL Manager**
   - Clique em "Verificar e Ativar SSL" para processar zonas pendentes

3. **Configurações SSL**
   - **SSL Mode**: Full (recomendado)
   - **Always Use HTTPS**: Ativado
   - **Universal SSL**: Ativado automaticamente

## Migração de Domínios Existentes

### Domínios Tradicionais → Cloudflare

1. **Backup de Configurações**
   - Anote as configurações atuais de DNS
   - Faça backup de registros personalizados

2. **Desativar SSL Tradicional**
   - Se usando Let's Encrypt ou certificados próprios
   - Remova configurações SSL antigas

3. **Migrar Gradualmente**
   - Teste com um domínio primeiro
   - Migre outros domínios após confirmação

4. **Verificar Funcionamento**
   - Teste acesso ao site
   - Verifique SSL (cadeado verde)
   - Confirme redirecionamentos

## Resolução de Problemas

### Erro: "API Token inválido"
**Solução:**
- Verificar se o token tem todas as permissões necessárias
- Gerar novo token se necessário
- Confirmar que o token não expirou

### Erro: "Zona não encontrada"
**Solução:**
- Verificar se o domínio está correto
- Confirmar que o domínio existe na conta Cloudflare
- Aguardar propagação se recém-adicionado

### SSL não ativando
**Solução:**
- Verificar se a zona está ativa (nameservers alterados)
- Usar o SSL Manager para forçar ativação
- Aguardar até 24 horas para propagação completa

### Domínio não carregando
**Solução:**
- Verificar registros DNS (A, CNAME)
- Confirmar que o proxy está ativado (nuvem laranja)
- Verificar configurações de SSL/TLS

## Vantagens da Migração

### Performance
- **CDN Global**: Cache em 200+ cidades
- **Otimização Automática**: Minificação de CSS/JS
- **HTTP/3**: Protocolo mais rápido

### Segurança
- **DDoS Protection**: Proteção automática
- **WAF**: Web Application Firewall
- **SSL Universal**: Certificados gratuitos

### Facilidade
- **Gerenciamento Unificado**: Tudo em um painel
- **Configuração Automática**: Menos trabalho manual
- **Monitoramento**: Analytics integrados

## Comandos Úteis

### Verificar DNS
```bash
# Verificar nameservers
nslookup -type=NS seudominio.com

# Verificar registro A
nslookup seudominio.com

# Verificar SSL
curl -I https://seudominio.com
```

### Testar Conectividade
```bash
# Ping para verificar resolução
ping seudominio.com

# Trace route
tracert seudominio.com
```

## Suporte

Para problemas técnicos:
1. Verificar logs do sistema
2. Consultar documentação da API Cloudflare
3. Contatar suporte técnico

## Referências

- [Documentação Cloudflare API](https://developers.cloudflare.com/api/)
- [Guia de DNS](https://developers.cloudflare.com/dns/)
- [Configuração SSL](https://developers.cloudflare.com/ssl/)
- [Troubleshooting](https://support.cloudflare.com/)