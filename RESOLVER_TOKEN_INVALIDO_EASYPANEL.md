# 🔧 Resolver Token Inválido no Easypanel

## 🚨 Problema Identificado

**Sintoma**: Token funciona em desenvolvimento (Trae) mas é considerado inválido em produção (Easypanel)

**Causa Provável**: Diferenças na configuração entre ambientes

## 🔍 Diagnóstico Rápido

### 1. Verificar Variáveis de Ambiente no Easypanel

**CRÍTICO**: A variável `JWT_SECRET` deve ser **EXATAMENTE** igual em desenvolvimento e produção.

```bash
# No Easypanel, verifique se estas variáveis estão definidas:
JWT_SECRET=sua_chave_secreta_aqui
DATABASE_URL=sua_url_do_banco
ENCRYPTION_KEY=sua_chave_de_criptografia
NODE_ENV=production
```

### 2. Executar Script de Diagnóstico

```bash
# Edite o arquivo test_production_vs_dev.js
# Substitua:
# - PRODUCTION_URL pela URL do seu app no Easypanel
# - TEST_USER pelos seus dados de login

node test_production_vs_dev.js
```

## ⚡ Soluções Imediatas

### Solução 1: Verificar JWT_SECRET

1. **No desenvolvimento**, encontre o valor do `JWT_SECRET`:
   ```bash
   # Verifique no arquivo .env ou .env.local
   cat .env | grep JWT_SECRET
   ```

2. **No Easypanel**:
   - Acesse o painel do seu app
   - Vá em "Environment Variables"
   - Verifique se `JWT_SECRET` tem o **mesmo valor exato**
   - Se não existir ou estiver diferente, corrija

### Solução 2: Verificar Deploy das Correções

**IMPORTANTE**: As correções JWT que fizemos precisam estar em produção!

1. Confirme que o deploy foi feito após as correções
2. Verifique se os arquivos modificados estão atualizados:
   - `src/app/api/shopify/credentials/route.ts`
   - Todas as APIs do Cloudflare

### Solução 3: Reiniciar Container

Após alterar variáveis de ambiente:

1. No Easypanel, vá em "Deployments"
2. Clique em "Restart" ou "Redeploy"
3. Aguarde o container reiniciar completamente

## 🔧 Verificações Detalhadas

### Teste Manual no Console do Navegador

```javascript
// 1. Faça login na aplicação em produção
// 2. Abra o console do navegador (F12)
// 3. Execute:

const token = localStorage.getItem('token');
console.log('Token:', token);

// 4. Decodifique o token (sem verificar assinatura):
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload:', payload);

// 5. Teste a API diretamente:
fetch('/api/shopify/credentials', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(text => console.log('Response:', text));
```

### Verificar Logs do Container

1. No Easypanel, acesse "Logs"
2. Procure por erros relacionados a JWT:
   - `JsonWebTokenError`
   - `invalid signature`
   - `jwt malformed`
   - `invalid token`

## 🎯 Checklist de Resolução

- [ ] JWT_SECRET é igual em dev e prod
- [ ] Deploy das correções JWT foi feito
- [ ] Container foi reiniciado após mudanças
- [ ] Variáveis de ambiente estão todas definidas
- [ ] Logs não mostram erros de JWT
- [ ] Teste manual no console funciona

## 🚀 Teste Final

Após aplicar as correções:

1. Limpe o cache do navegador
2. Faça logout e login novamente
3. Teste a integração Shopify
4. Verifique se não há mais erros 401

## 📞 Se o Problema Persistir

1. Execute o script `test_production_vs_dev.js` com seus dados reais
2. Compare os payloads dos tokens entre dev e prod
3. Verifique se há diferenças na estrutura do banco de dados
4. Confirme se o usuário existe no banco de produção

---

**💡 Dica**: O problema mais comum é o `JWT_SECRET` diferente entre ambientes. Sempre verifique isso primeiro!