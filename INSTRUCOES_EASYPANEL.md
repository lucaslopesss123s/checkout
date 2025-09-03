# 🚀 Instruções para Resolver Problema no Easypanel

## 📋 Problema Atual
**Checkout não carrega configurações Shopify em produção no Easypanel**

---

## 🔧 Passo a Passo para Resolução

### 1. 📤 Enviar Arquivos de Diagnóstico para Produção

Primeiro, você precisa enviar os arquivos de diagnóstico para o servidor:

```bash
# Fazer commit dos arquivos de diagnóstico
git add debug_shopify_production.js test_database_connection.js TROUBLESHOOTING_EASYPANEL.md INSTRUCOES_EASYPANEL.md
git commit -m "feat: Adicionar ferramentas de diagnóstico para produção"
git push
```

### 2. 🔄 Atualizar Aplicação no Easypanel

1. Acesse seu painel do Easypanel
2. Vá para sua aplicação de checkout
3. Clique em "Deploy" ou "Rebuild" para atualizar com os novos arquivos
4. Aguarde o deploy completar

### 3. 🖥️ Acessar Terminal do Container

1. No Easypanel, vá para sua aplicação
2. Clique na aba "Terminal" ou "Console"
3. Isso abrirá um terminal dentro do container

### 4. 🔍 Executar Diagnóstico de Banco de Dados

No terminal do container, execute:

```bash
# Testar conectividade com banco de dados
node test_database_connection.js
```

**Analise a saída:**
- ✅ Se mostrar "Conexão estabelecida" → Banco OK
- ❌ Se mostrar erro → Problema nas variáveis de ambiente

### 5. 🔑 Verificar Variáveis de Ambiente

No terminal do container:

```bash
# Verificar se as variáveis estão configuradas
echo "DATABASE_URL: $DATABASE_URL"
echo "NODE_ENV: $NODE_ENV"
echo "JWT_SECRET: $JWT_SECRET"
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
```

**Se alguma variável estiver vazia:**
1. Vá para "Settings" → "Environment Variables" no Easypanel
2. Adicione as variáveis faltantes
3. Reinicie a aplicação

### 6. 🏪 Testar com Dados Reais da Sua Loja

**Edite o arquivo de teste:**
```bash
# No terminal do container
nano test_database_connection.js

# Ou use vi se nano não estiver disponível
vi test_database_connection.js
```

**Encontre esta linha (aproximadamente linha 130):**
```javascript
const TEST_DOMAIN = 'sua-loja.myshopify.com'; // EDITE AQUI
```

**Substitua por:**
```javascript
const TEST_DOMAIN = 'SUA_LOJA_REAL.myshopify.com'; // Seu domínio real
```

**Execute novamente:**
```bash
node test_database_connection.js
```

### 7. 🌐 Testar API Externamente

**Do seu computador local, teste:**

```bash
# Teste básico de saúde
curl https://checkout.pesquisaencomenda.online/api/health

# Teste específico da sua loja (substitua o domínio)
curl "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=SUA_LOJA.myshopify.com"
```

### 8. 📊 Interpretar Resultados

#### ✅ Cenário 1: Tudo Funcionando
```json
{
  "success": true,
  "configured": true,
  "loja_id": "123",
  "checkout_url": "https://checkout.seudominio.com/checkout/shopify"
}
```
**→ Problema resolvido!**

#### ❌ Cenário 2: Domínio Não Configurado
```json
{
  "error": "Domínio não configurado",
  "configured": false,
  "requires_domain": true
}
```
**→ Solução:** Configure domínio personalizado no dashboard

#### ❌ Cenário 3: Loja Não Encontrada
```json
{
  "error": "Loja não encontrada"
}
```
**→ Solução:** Cadastre a loja no dashboard admin

#### ❌ Cenário 4: Erro Interno
```json
{
  "error": "Erro interno do servidor"
}
```
**→ Solução:** Problema de banco de dados (veja logs)

### 9. 📋 Verificar Logs em Tempo Real

**No Easypanel:**
1. Vá para "Logs" na sua aplicação
2. Mantenha aberto durante os testes
3. Procure por erros como:
   - `Error: connect ECONNREFUSED` → Banco inacessível
   - `Invalid DATABASE_URL` → URL do banco incorreta
   - `Prisma Client initialization failed` → Problema no Prisma

### 10. 🔧 Soluções Específicas

#### Se DATABASE_URL estiver incorreta:
1. Vá para "Settings" → "Environment Variables"
2. Verifique se DATABASE_URL está no formato:
   ```
   postgresql://usuario:senha@host:porta/database
   ```
3. Teste a conexão manualmente se possível

#### Se a loja não existir no banco:
1. Acesse o dashboard admin da aplicação
2. Cadastre a loja Shopify
3. Configure as credenciais do app Shopify

#### Se o domínio não estiver configurado:
1. Acesse o dashboard admin
2. Vá para "Domínios"
3. Adicione e configure um domínio personalizado
4. Aguarde a verificação DNS

### 11. 🧪 Teste Final

Após fazer as correções:

```bash
# Teste completo
node debug_shopify_production.js
```

**Edite as variáveis no início do arquivo antes de executar:**
```javascript
const TEST_SHOP_DOMAIN = 'sua-loja-real.myshopify.com';
const TEST_STORE_ID = 'id-real-da-loja';
```

---

## 🆘 Se Ainda Não Funcionar

### Informações para Coleta:

1. **Saída do comando:**
   ```bash
   node test_database_connection.js
   ```

2. **Logs do Easypanel** (últimas 50 linhas)

3. **Resposta da API:**
   ```bash
   curl -v "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=SUA_LOJA.myshopify.com"
   ```

4. **Variáveis de ambiente** (sem mostrar valores sensíveis):
   ```bash
   env | grep -E "DATABASE_URL|NODE_ENV|JWT_SECRET|NEXTAUTH_SECRET" | sed 's/=.*/=***HIDDEN***/' 
   ```

### Comandos de Debug Avançado:

```bash
# Verificar se o Prisma consegue conectar
npx prisma db pull

# Verificar estrutura do banco
npx prisma db seed --preview-feature

# Testar query direta
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.loja_Shopify.findMany().then(console.log).catch(console.error).finally(() => prisma.$disconnect());"
```

---

## ✅ Checklist Final

- [ ] Arquivos de diagnóstico enviados para produção
- [ ] Aplicação atualizada no Easypanel
- [ ] Teste de conectividade com banco executado
- [ ] Variáveis de ambiente verificadas
- [ ] Teste com dados reais da loja executado
- [ ] API testada externamente
- [ ] Logs verificados
- [ ] Problema identificado e corrigido
- [ ] Teste final realizado com sucesso

---

**💡 Lembre-se:** O problema mais comum é a falta de domínio personalizado configurado, já que em produção isso é obrigatório!