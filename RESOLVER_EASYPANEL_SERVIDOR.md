# 🔧 RESOLVER PROBLEMA DO SERVIDOR NO EASYPANEL

## 🎯 Problema Confirmado

✅ **Cloudflare está funcionando**: Proxy ativo, SSL funcionando  
❌ **Servidor de origem não responde**: EasyPanel não está servindo a aplicação  
✅ **Banco de dados funcionando**: PostgreSQL conectando normalmente  
✅ **Código está correto**: API deveria funcionar perfeitamente  

## 🔍 Diagnóstico Completo

### Teste Realizado:
```
Status: 404 em todas as rotas
Cloudflare Proxy: ATIVO (CF-Ray presente)
Servidor: cloudflare (não Next.js)
Problema: Servidor de origem não responde
```

### Causa Raiz:
O EasyPanel não está servindo a aplicação Next.js na porta correta ou o bind está incorreto.

## 🛠️ SOLUÇÕES NO EASYPANEL

### 1. Verificar Status do Serviço

**No painel do EasyPanel:**
1. Acessar o serviço `checkout`
2. Verificar se está **Running** (verde)
3. Se estiver **Stopped** (vermelho): clicar em **Start**
4. Se estiver **Error**: verificar logs

### 2. Verificar Configuração da Aplicação

**Configurações essenciais:**
```yaml
# Build Command
npm run build

# Start Command  
npm start

# Port
3000

# Environment Variables
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://...
JWT_SECRET=...
ENCRYPTION_KEY=...
```

### 3. Verificar Dockerfile (se usando Docker)

```dockerfile
# Verificar se está expondo a porta correta
EXPOSE 3000

# Verificar se está fazendo bind correto
CMD ["npm", "start"]
# ou
CMD ["node", "server.js"]

# Verificar se não está usando localhost
# ❌ ERRADO: HOST=localhost
# ✅ CORRETO: HOST=0.0.0.0
```

### 4. Verificar Logs do Servidor

**No EasyPanel:**
1. Ir para **Logs** do serviço
2. Procurar por erros como:
   ```
   ❌ Error: listen EADDRINUSE :::3000
   ❌ Error: Cannot find module
   ❌ Database connection failed
   ❌ Port 3000 is already in use
   ```

3. Logs esperados (sucesso):
   ```
   ✅ Ready - started server on 0.0.0.0:3000
   ✅ Database connected successfully
   ✅ Next.js ready on http://0.0.0.0:3000
   ```

### 5. Configuração de Rede

**Verificar configuração de rede:**
```yaml
# Network Settings
Internal Port: 3000
External Port: 80 ou 443
Bind Address: 0.0.0.0 (NÃO localhost)
```

### 6. Variáveis de Ambiente Críticas

**Verificar se estão definidas:**
```bash
# Essenciais para funcionamento
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://root:Zreel123!@easypanel.lockpainel.site:5432/checkout

# Auth
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
ENCRYPTION_KEY=sua_chave_de_criptografia_aqui

# Next.js
NEXTAUTH_URL=https://checkout.pesquisaencomenda.online
NEXTAUTH_SECRET=sua_chave_nextauth_aqui
```

## 🚀 PASSOS PARA CORREÇÃO

### Passo 1: Verificar Status
1. Acessar EasyPanel
2. Ir para o serviço `checkout`
3. Verificar se está **Running**

### Passo 2: Verificar Logs
1. Clicar em **Logs**
2. Procurar por erros
3. Anotar mensagens de erro

### Passo 3: Verificar Configuração
1. Ir para **Settings**
2. Verificar **Build Command**: `npm run build`
3. Verificar **Start Command**: `npm start`
4. Verificar **Port**: `3000`

### Passo 4: Verificar Variáveis de Ambiente
1. Ir para **Environment Variables**
2. Verificar se todas as variáveis estão definidas
3. Especialmente: `HOST=0.0.0.0`, `PORT=3000`

### Passo 5: Rebuild e Restart
1. Clicar em **Rebuild** (se necessário)
2. Aguardar build completar
3. Clicar em **Restart**
4. Verificar logs novamente

### Passo 6: Testar Conectividade
```bash
# Após correção, testar:
curl https://checkout.pesquisaencomenda.online/

# Deve retornar HTML da aplicação, não erro 404
```

## 🔧 PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: Port Already in Use
```
Erro: listen EADDRINUSE :::3000
Solução: Reiniciar o serviço ou mudar porta
```

### Problema 2: Bind em Localhost
```
Erro: Servidor rodando apenas em localhost
Solução: Definir HOST=0.0.0.0
```

### Problema 3: Build Failed
```
Erro: npm run build failed
Solução: Verificar dependências e código
```

### Problema 4: Database Connection
```
Erro: Database connection failed
Solução: Verificar DATABASE_URL
```

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Serviço está **Running** no EasyPanel
- [ ] Logs não mostram erros críticos
- [ ] Build Command: `npm run build`
- [ ] Start Command: `npm start`
- [ ] Port: `3000`
- [ ] HOST: `0.0.0.0` (não localhost)
- [ ] NODE_ENV: `production`
- [ ] DATABASE_URL definida corretamente
- [ ] JWT_SECRET definido
- [ ] ENCRYPTION_KEY definido

## 🎯 TESTE FINAL

Após correções, testar:
```bash
# 1. Página principal
curl https://checkout.pesquisaencomenda.online/

# 2. API Shopify
curl "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=ethf0j-1z.myshopify.com"

# Resultado esperado: Status 200 com dados JSON
```

---

**RESUMO**: O Cloudflare está funcionando perfeitamente. O problema está no EasyPanel não servindo a aplicação Next.js corretamente. Verificar configuração de porta, bind e variáveis de ambiente.