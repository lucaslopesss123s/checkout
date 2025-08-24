# Deploy no EasyPanel

Este guia explica como fazer deploy da aplicação de checkout no EasyPanel.

## Pré-requisitos

1. Conta no EasyPanel
2. Repositório Git (GitHub, GitLab, etc.)
3. Banco de dados PostgreSQL

## Passos para Deploy

### 1. Preparar o Repositório

Certifique-se de que os seguintes arquivos estão no seu repositório:
- `Dockerfile` ✅
- `.dockerignore` ✅
- `docker-compose.yml` ✅
- `.env.example` ✅

### 2. Configurar Banco de Dados

No EasyPanel:
1. Crie um serviço PostgreSQL
2. Anote as credenciais de conexão
3. Execute as migrations do Prisma

### 3. Criar Aplicação no EasyPanel

1. **Novo Projeto**: Clique em "New Project"
2. **Conectar Repositório**: Conecte seu repositório Git
3. **Configurar Build**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Port: `3000`

### 4. Configurar Variáveis de Ambiente

No painel de configurações da aplicação, adicione:

```env
# Database (obrigatório)
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth (obrigatório)
NEXTAUTH_SECRET=seu-secret-muito-seguro-aqui
NEXTAUTH_URL=https://seu-dominio.easypanel.host

# Firebase (opcional)
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Aplicação
NODE_ENV=production
PORT=3000
```

### 5. Configurar Domínio

1. No EasyPanel, vá para "Domains"
2. Adicione seu domínio personalizado ou use o subdomínio fornecido
3. Configure SSL (automático no EasyPanel)

### 6. Executar Migrations

Após o primeiro deploy:
1. Acesse o terminal da aplicação no EasyPanel
2. Execute: `npx prisma migrate deploy`
3. (Opcional) Execute: `npx prisma db seed` se tiver seeds

## Estrutura de Deploy

### Dockerfile
O Dockerfile usa multi-stage build para otimizar o tamanho da imagem:
- **deps**: Instala dependências
- **builder**: Gera Prisma client e faz build
- **runner**: Imagem final otimizada

### Configurações Importantes

1. **Output Standalone**: Configurado no `next.config.ts`
2. **Prisma Client**: Gerado durante o build
3. **Port**: Aplicação roda na porta 3000
4. **Health Check**: Endpoint `/api/health` (se implementado)

## Troubleshooting

### Erro de Conexão com Banco
- Verifique a `DATABASE_URL`
- Certifique-se de que o banco está acessível
- Execute `npx prisma migrate deploy`

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Confirme se o Prisma client foi gerado

### Erro "Invalid value undefined for datasource db"
Este erro ocorre quando o Prisma Client não encontra a `DATABASE_URL` durante o build.

**Solução**: O Dockerfile já inclui uma `DATABASE_URL` temporária para o build:
```dockerfile
ENV DATABASE_URL="postgresql://temp:temp@temp:5432/temp"
```

Esta variável é apenas para o build funcionar. A `DATABASE_URL` real deve ser configurada nas variáveis de ambiente do EasyPanel.

### Erro "useSearchParams() should be wrapped in a suspense boundary"
Este erro ocorre quando `useSearchParams()` é usado sem um Suspense boundary no Next.js 15+.

**Solução**: O componente já foi corrigido envolvendo `useSearchParams()` com `<Suspense>`:
```tsx
<Suspense fallback={<div>Carregando...</div>}>
  <ComponenteQueUsaSearchParams />
</Suspense>
```

### Erro "npm run build failed with exit code 1"
Este erro pode ocorrer por várias razões durante o build no EasyPanel:

**Possíveis causas e soluções**:
1. **Variáveis de ambiente ausentes**: Certifique-se de que todas as variáveis obrigatórias estão configuradas no EasyPanel
2. **Problemas de memória**: O build pode falhar por falta de memória no container
3. **Dependências**: Verifique se todas as dependências estão instaladas corretamente
4. **Formato ENV**: Use `ENV KEY=value` ao invés de `ENV KEY value` (já corrigido)
5. **Erro de prerender**: Páginas que fazem consultas ao banco de dados podem falhar durante o prerender

**Para debugar**:
- Execute `npm run build` localmente para verificar se o build funciona
- Verifique os logs completos no EasyPanel para identificar o erro específico
- Confirme que a `DATABASE_URL` temporária está sendo usada durante o build

### Erro "Can't reach database server during prerender"
Este erro ocorre quando uma página tenta fazer consultas ao banco de dados durante o prerender (build time).

**Solução**: Forçar renderização dinâmica nas páginas que fazem consultas ao banco:
```tsx
// Adicionar no topo da página
export const dynamic = 'force-dynamic';

// Envolver consultas com try-catch
async function getData() {
  try {
    const data = await prisma.model.findMany();
    return data;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return [];
  }
}
```

### Erro de Autenticação
- Verifique `NEXTAUTH_SECRET` e `NEXTAUTH_URL`
- Confirme se as credenciais Firebase estão corretas

## Comandos Úteis

```bash
# Verificar status da aplicação
npm run build

# Executar migrations
npx prisma migrate deploy

# Verificar banco de dados
npx prisma studio

# Logs da aplicação
docker logs container-name
```

## Monitoramento

- Use os logs do EasyPanel para monitorar a aplicação
- Configure alertas para erros críticos
- Monitore uso de recursos (CPU, memória)

## Backup

- Configure backup automático do PostgreSQL
- Faça backup regular das variáveis de ambiente
- Mantenha o código versionado no Git