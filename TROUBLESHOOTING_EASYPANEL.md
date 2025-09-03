# 🔧 Guia de Troubleshooting - Easypanel

## Problema: Checkout não carrega configurações Shopify em produção

### 📋 Sintomas
- ✅ Funciona corretamente em `localhost`
- ❌ Não funciona em produção no Easypanel
- ❌ Configurações de integração da Loja Shopify não carregam
- ✅ Credenciais do aplicativo Shopify estão no banco de dados

### 🔍 Diagnóstico Passo a Passo

#### 1. Teste de Conectividade Básica

```bash
# Teste se o servidor está respondendo
curl https://checkout.pesquisaencomenda.online/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "API está funcionando",
  "timestamp": "2024-01-XX...",
  "environment": "production"
}
```

#### 2. Teste da API de Configuração Shopify (CRÍTICO)

```bash
# Substitua 'sua-loja.myshopify.com' pelo domínio real
curl "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=sua-loja.myshopify.com"
```

**Cenários possíveis:**

##### ✅ Sucesso (configured: true)
```json
{
  "success": true,
  "configured": true,
  "loja_id": "123",
  "domain": "sua-loja.myshopify.com",
  "checkout_configured": true,
  "produtos_count": 5,
  "checkout_url": "https://checkout.seudominio.com/checkout/shopify"
}
```

##### ❌ Problema: Domínio não configurado
```json
{
  "error": "Domínio não configurado",
  "message": "Esta loja não possui um domínio personalizado configurado e ativo",
  "configured": false,
  "requires_domain": true
}
```
**Solução:** Configure um domínio personalizado no dashboard.

##### ❌ Problema: Loja não encontrada
```json
{
  "error": "Loja não encontrada"
}
```
**Solução:** Verifique se a loja existe no banco de dados.

##### ❌ Problema: Erro interno
```json
{
  "error": "Erro interno do servidor",
  "configured": false
}
```
**Solução:** Problema de conectividade com banco de dados.

### 🛠️ Soluções por Problema

#### Problema 1: Banco de Dados Inacessível

**Verificações no Easypanel:**

1. **Variáveis de Ambiente:**
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   NEXTAUTH_SECRET=seu-secret-aqui
   JWT_SECRET=seu-jwt-secret-aqui
   NODE_ENV=production
   ```

2. **Teste de Conectividade:**
   - Acesse o terminal do container no Easypanel
   - Execute: `npx prisma db pull` para testar conexão

3. **Logs do Container:**
   - Verifique logs em tempo real no Easypanel
   - Procure por erros de conexão com PostgreSQL

#### Problema 2: Domínio Personalizado Não Configurado

**Verificações necessárias:**

1. **No Banco de Dados:**
   ```sql
   -- Verificar se existe domínio ativo para a loja
   SELECT * FROM dominios WHERE ativo = true AND status IN ('verified', 'active');
   ```

2. **Configuração DNS:**
   - Verifique se `checkout.seudominio.com` aponta para o IP correto
   - IP do servidor: `181.41.200.99` (conforme código)

3. **Status do Domínio:**
   - Domínio deve ter `status = 'verified'` ou `'active'`
   - Domínio deve ter `ativo = true`

#### Problema 3: Produtos Não Cadastrados

**Verificação:**
```sql
-- Verificar produtos da loja
SELECT COUNT(*) FROM produtos WHERE id_loja = 'SEU_ID_LOJA';
```

**Solução:**
- Cadastre produtos no dashboard
- Sincronize produtos do Shopify

### 🔧 Script de Diagnóstico Automático

1. **Edite o arquivo de diagnóstico:**
   ```bash
   # Abra o arquivo debug_shopify_production.js
   # Substitua as variáveis:
   const TEST_SHOP_DOMAIN = 'sua-loja.myshopify.com';
   const TEST_STORE_ID = 'seu-store-id';
   ```

2. **Execute o diagnóstico:**
   ```bash
   node debug_shopify_production.js
   ```

### 📊 Checklist de Verificação

#### No Easypanel:
- [ ] Container está rodando sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Logs não mostram erros de conexão
- [ ] Porta 3000 está exposta corretamente

#### No Banco de Dados:
- [ ] Tabela `loja_Shopify` tem a loja cadastrada
- [ ] Tabela `dominios` tem domínio ativo
- [ ] Tabela `produtos` tem produtos cadastrados
- [ ] Tabela `checkout` tem configuração da loja

#### DNS e Domínio:
- [ ] DNS aponta para IP correto (181.41.200.99)
- [ ] Domínio está verificado/ativo
- [ ] SSL está funcionando

### 🚨 Problemas Comuns e Soluções

#### 1. "Loja não encontrada"
**Causa:** Domínio da loja não está cadastrado no banco
**Solução:** Cadastre a loja no dashboard admin

#### 2. "Domínio não configurado"
**Causa:** Loja não tem domínio personalizado ativo
**Solução:** Configure domínio na aba "Domínio" do dashboard

#### 3. "Erro interno do servidor"
**Causa:** Problema de conectividade com banco
**Solução:** Verifique DATABASE_URL e conectividade

#### 4. Timeout ou sem resposta
**Causa:** Container não está rodando ou problema de rede
**Solução:** Reinicie o container no Easypanel

### 📞 Próximos Passos

1. **Execute o script de diagnóstico**
2. **Identifique o erro específico**
3. **Siga a solução correspondente**
4. **Verifique logs do Easypanel**
5. **Teste novamente após correções**

### 🔍 Comandos Úteis para Debug

```bash
# Testar health check
curl https://checkout.pesquisaencomenda.online/api/health

# Testar configuração específica
curl "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=SUA_LOJA.myshopify.com"

# Testar com verbose
curl -v "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=SUA_LOJA.myshopify.com"

# Verificar headers CORS
curl -H "Origin: https://SUA_LOJA.myshopify.com" "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=SUA_LOJA.myshopify.com"
```

---

**💡 Dica:** Mantenha os logs do Easypanel abertos durante os testes para identificar erros em tempo real.