# Sistema de Ativação SSL em Lote

## Visão Geral

O sistema de ativação SSL em lote foi desenvolvido para resolver o problema de carregamento infinito ao ativar SSL individualmente e permitir a ativação eficiente de certificados SSL para múltiplos domínios simultaneamente.

## Funcionalidades

### 🚀 Ativação SSL em Lote
- Processamento assíncrono de múltiplos domínios
- Timeout configurável para Let's Encrypt (30 segundos)
- Fallback automático para certificados auto-assinados
- Interface de progresso em tempo real
- Seleção flexível de domínios

### 🔧 API Endpoints

#### `GET /api/ssl/batch`
**Buscar domínios elegíveis e estatísticas**
```bash
GET /api/ssl/batch
```

**Resposta:**
```json
{
  "eligibleDomains": [
    {
      "id": "domain-id",
      "domain": "exemplo.com",
      "status": "verified"
    }
  ],
  "statistics": {
    "totalDomains": 10,
    "sslActive": 5,
    "sslInactive": 5,
    "verifiedDomains": 8
  }
}
```

#### `GET /api/ssl/batch?jobId={id}`
**Verificar status do job**
```bash
GET /api/ssl/batch?jobId=ssl-batch-1234567890
```

**Resposta:**
```json
{
  "job": {
    "id": "ssl-batch-1234567890",
    "status": "running",
    "progress": 2,
    "total": 5,
    "percentage": 40,
    "results": [
      {
        "domain": "exemplo1.com",
        "success": true,
        "certificateType": "letsencrypt"
      },
      {
        "domain": "exemplo2.com",
        "success": false,
        "error": "DNS validation failed",
        "certificateType": "self-signed"
      }
    ]
  }
}
```

#### `POST /api/ssl/batch`
**Iniciar ativação SSL em lote**
```bash
POST /api/ssl/batch
Content-Type: application/json

{
  "domainIds": ["id1", "id2", "id3"],
  "options": {
    "timeout": 30000,
    "fallbackToSelfSigned": true
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "jobId": "ssl-batch-1234567890",
  "message": "Ativação SSL iniciada para 3 domínios",
  "domains": [
    { "id": "id1", "domain": "exemplo1.com" },
    { "id": "id2", "domain": "exemplo2.com" },
    { "id": "id3", "domain": "exemplo3.com" }
  ]
}
```

#### `DELETE /api/ssl/batch`
**Cancelar job**
```bash
DELETE /api/ssl/batch
Content-Type: application/json

{
  "jobId": "ssl-batch-1234567890"
}
```

## Interface do Usuário

### 🎯 Acesso à Funcionalidade
1. Navegue para **Dashboard > Domínios**
2. O botão **"SSL em Lote"** aparece quando há domínios elegíveis
3. Domínios elegíveis: verificados e sem SSL ativo

### 📋 Seleção de Domínios
- **Seleção individual**: Clique no checkbox ao lado do domínio
- **Selecionar todos**: Botão "Selecionar Todos"
- **Limpar seleção**: Botão "Limpar Seleção"
- **Contador**: Mostra quantos domínios estão selecionados

### 📊 Monitoramento de Progresso
- **Barra de progresso**: Mostra percentual de conclusão
- **Status em tempo real**: Atualização automática a cada 6 segundos
- **Resultados detalhados**: Lista de sucessos e falhas por domínio

## Arquitetura Técnica

### 📁 Estrutura de Arquivos
```
src/
├── lib/
│   └── ssl-batch.ts          # Lógica principal do sistema
├── app/api/ssl/
│   └── batch/
│       └── route.ts          # Endpoints da API
└── app/dashboard/dominio/
    └── page.tsx              # Interface do usuário
```

### 🔄 Fluxo de Processamento

1. **Validação**: Verificar se domínios existem e estão verificados
2. **Criação do Job**: Gerar ID único e inicializar status
3. **Processamento Assíncrono**: 
   - Tentar Let's Encrypt (timeout: 30s)
   - Fallback para certificado auto-assinado se falhar
   - Atualizar progresso em tempo real
4. **Finalização**: Marcar job como concluído com resultados

### ⚙️ Configurações

```typescript
interface BatchSSLOptions {
  timeout?: number;              // Timeout Let's Encrypt (padrão: 30000ms)
  fallbackToSelfSigned?: boolean; // Fallback automático (padrão: true)
  maxConcurrent?: number;        // Processamento simultâneo (padrão: 3)
  onProgress?: (progress: BatchSSLProgress) => void; // Callback de progresso
}
```

## Testes

### 🧪 Script de Teste
Execute o script de teste para validar o sistema:

```bash
node test_batch_ssl.js
```

**Funcionalidades testadas:**
- ✅ Busca de domínios elegíveis
- ✅ Inicialização de jobs em lote
- ✅ Monitoramento de progresso
- ✅ Cancelamento de jobs
- ✅ Conectividade SSL pós-ativação

### 📊 Cenários de Teste
1. **Domínios elegíveis**: Verificados sem SSL
2. **Processamento em lote**: Múltiplos domínios simultaneamente
3. **Timeout e fallback**: Let's Encrypt → Auto-assinado
4. **Monitoramento**: Progresso em tempo real
5. **Conectividade**: Validação HTTPS pós-ativação

## Resolução de Problemas

### ❌ Problemas Comuns

**1. "Nenhum domínio elegível"**
- Verificar se domínios estão com status "verified"
- Confirmar que `dns_verificado = true`
- Verificar se SSL não está já ativo

**2. "Timeout na ativação Let's Encrypt"**
- Verificar conectividade com servidores Let's Encrypt
- Confirmar que domínio aponta corretamente para o servidor
- Verificar se porta 80 está acessível para validação HTTP-01

**3. "Job não progride"**
- Verificar logs do servidor Next.js
- Confirmar que processo não travou
- Reiniciar servidor se necessário

**4. "Certificado auto-assinado em vez de Let's Encrypt"**
- Verificar configuração DNS do domínio
- Confirmar que domínio resolve para IP correto
- Verificar firewall e portas abertas

### 🔧 Logs e Debug

**Habilitar logs detalhados:**
```bash
# No terminal do servidor
DEBUG=ssl:* npm run dev
```

**Verificar status da API:**
```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:3000/api/ssl/batch -Method GET
```

## Melhorias Futuras

### 🚀 Roadmap
- [ ] Persistência de jobs no banco de dados
- [ ] Notificações por email/webhook
- [ ] Agendamento de ativação SSL
- [ ] Renovação automática em lote
- [ ] Métricas e analytics detalhadas
- [ ] Suporte a certificados wildcard
- [ ] Integração com outros provedores de SSL

### 📈 Otimizações
- [ ] Cache de resultados de validação DNS
- [ ] Pool de conexões para Let's Encrypt
- [ ] Retry inteligente com backoff exponencial
- [ ] Compressão de logs de job
- [ ] Limpeza automática de jobs antigos

## Suporte

Para suporte técnico ou dúvidas sobre o sistema:

1. **Logs**: Verificar console do navegador e terminal do servidor
2. **Testes**: Executar `node test_batch_ssl.js`
3. **API**: Testar endpoints diretamente
4. **Documentação**: Consultar este documento

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2025  
**Compatibilidade**: Next.js 15.3.3+, Node.js 18+