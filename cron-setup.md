# Configuração de Cron Job para Carrinhos Abandonados

Este documento explica como configurar um cron job para processar carrinhos abandonados automaticamente.

## Arquivos Criados

1. **API Endpoint**: `/api/carrinho/abandonados`
   - Processa carrinhos abandonados automaticamente
   - Marca carrinhos como abandonados após 30 minutos de inatividade
   - Fornece estatísticas de carrinhos abandonados

2. **Script de Processamento**: `scripts/process-abandoned-carts.js`
   - Script Node.js para executar o processamento via cron
   - Faz requisição POST para a API de carrinhos abandonados
   - Registra logs detalhados do processamento

## Configuração do Cron Job

### Linux/macOS

1. Abra o crontab:
```bash
crontab -e
```

2. Adicione uma das seguintes linhas:

**Executar a cada 15 minutos:**
```bash
*/15 * * * * cd /caminho/para/checkout && node scripts/process-abandoned-carts.js >> logs/abandoned-carts.log 2>&1
```

**Executar a cada 30 minutos:**
```bash
*/30 * * * * cd /caminho/para/checkout && node scripts/process-abandoned-carts.js >> logs/abandoned-carts.log 2>&1
```

**Executar a cada hora:**
```bash
0 * * * * cd /caminho/para/checkout && node scripts/process-abandoned-carts.js >> logs/abandoned-carts.log 2>&1
```

### Windows (Task Scheduler)

1. Abra o **Agendador de Tarefas** (Task Scheduler)
2. Clique em **Criar Tarefa Básica**
3. Configure:
   - **Nome**: Processar Carrinhos Abandonados
   - **Disparador**: A cada 15/30 minutos
   - **Ação**: Iniciar um programa
   - **Programa**: `node`
   - **Argumentos**: `scripts/process-abandoned-carts.js`
   - **Iniciar em**: `C:\caminho\para\checkout`

### Docker/Kubernetes

Para ambientes containerizados, você pode usar um CronJob do Kubernetes:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: process-abandoned-carts
spec:
  schedule: "*/15 * * * *"  # A cada 15 minutos
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: abandoned-carts-processor
            image: node:18-alpine
            command:
            - /bin/sh
            - -c
            - |
              cd /app
              node scripts/process-abandoned-carts.js
            volumeMounts:
            - name: app-volume
              mountPath: /app
          restartPolicy: OnFailure
          volumes:
          - name: app-volume
            hostPath:
              path: /caminho/para/checkout
```

## Configuração de Logs

Crie o diretório de logs:
```bash
mkdir -p logs
```

O script automaticamente registrará:
- Timestamp de cada execução
- Número de carrinhos processados
- Detalhes dos carrinhos marcados como abandonados
- Erros, se houver

## Monitoramento

### Verificar Logs
```bash
# Ver logs em tempo real
tail -f logs/abandoned-carts.log

# Ver últimas execuções
tail -n 50 logs/abandoned-carts.log
```

### Testar Manualmente
```bash
# Executar o script manualmente
node scripts/process-abandoned-carts.js

# Ou fazer requisição direta à API
curl -X POST http://localhost:9002/api/carrinho/abandonados
```

### Verificar Estatísticas
```bash
# Obter estatísticas gerais
curl http://localhost:9002/api/carrinho/abandonados

# Obter estatísticas de uma loja específica
curl "http://localhost:9002/api/carrinho/abandonados?id_loja=123"
```

## Configurações Avançadas

### Alterar Tempo de Abandono

Para alterar o tempo limite de 30 minutos, edite o arquivo:
`src/app/api/carrinho/abandonados/route.ts`

```typescript
// Altere esta linha:
const TEMPO_ABANDONO_MINUTOS = 30 // Altere para o valor desejado
```

### Variáveis de Ambiente

O script suporta as seguintes variáveis de ambiente:

```bash
# URL da API (padrão: http://localhost:9002)
export NEXT_PUBLIC_API_URL=https://seu-dominio.com

# Executar o script
node scripts/process-abandoned-carts.js
```

## Troubleshooting

### Problemas Comuns

1. **Script não executa**:
   - Verifique se o Node.js está instalado
   - Verifique se o caminho no cron está correto
   - Verifique permissões do arquivo

2. **Erro de conexão**:
   - Verifique se a aplicação Next.js está rodando
   - Verifique a URL da API
   - Verifique conectividade de rede

3. **Logs não aparecem**:
   - Verifique se o diretório `logs/` existe
   - Verifique permissões de escrita
   - Verifique se o redirecionamento está correto no cron

### Debug

Para debug detalhado, execute:
```bash
DEBUG=1 node scripts/process-abandoned-carts.js
```

## Segurança

- O endpoint `/api/carrinho/abandonados` não requer autenticação para permitir execução via cron
- Considere adicionar autenticação via token se necessário
- Monitore os logs para detectar execuções anômalas
- Configure rate limiting se necessário