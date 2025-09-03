# Guia para Resolver Erro HTTP 401 - Autenticação JWT

## 🚨 Problema Identificado

O erro `HTTP 401` na API `/api/shopify/credentials` indica problema de **autenticação JWT**. O frontend está enviando requisições, mas o token JWT não está sendo aceito pelo servidor em produção.

## 🔍 Diagnóstico do Problema

### Sintomas Observados
```
XHRGET https://zollim-checkout.rboln1.easypanel.host/api/shopify/credentials?storeId=7453e5c4-bbb1-4e16-87da-0f031f7e3d56
[HTTP/2 401  104ms]
```

### Possíveis Causas

1. **JWT_SECRET diferente** entre desenvolvimento e produção
2. **Token expirado** ou mal formado
3. **Variáveis de ambiente** não configuradas no Easypanel
4. **Problema na geração** do token durante o login
5. **Diferença no payload** do token (id vs userId)

## 🛠️ Passos para Resolver

### Passo 1: Verificar Variáveis de Ambiente no Easypanel

1. **Acesse o painel do Easypanel**
2. **Vá para sua aplicação** `zollim-checkout`
3. **Clique em "Environment Variables"**
4. **Verifique se existem:**
   ```
   JWT_SECRET=sua_chave_secreta_aqui
   ENCRYPTION_KEY=sua_chave_de_32_caracteres_aqui
   DATABASE_URL=sua_url_do_banco
   NODE_ENV=production
   ```

5. **Se JWT_SECRET não existir ou for diferente:**
   - Adicione a variável com o mesmo valor usado em desenvolvimento
   - **IMPORTANTE:** Use a mesma chave em dev e produção

### Passo 2: Testar Autenticação JWT

1. **Envie o arquivo de teste para produção:**
   ```bash
   # No seu projeto local
   git add test_jwt_auth_production.js
   git commit -m "feat: Adicionar teste de autenticação JWT"
   git push
   ```

2. **No Easypanel, acesse o terminal do container:**
   - Clique em "Terminal" na sua aplicação
   - Execute o teste:
   ```bash
   node test_jwt_auth_production.js
   ```

3. **Antes de executar, edite o arquivo com suas credenciais:**
   ```javascript
   const TEST_CREDENTIALS = {
     username: 'seu_username_real',
     password: 'sua_senha_real'
   };
   ```

### Passo 3: Verificar Logs do Container

1. **No Easypanel, vá para "Logs"**
2. **Procure por erros relacionados a JWT:**
   ```
   Token inválido
   jwt malformed
   invalid signature
   jwt expired
   ```

3. **Se encontrar erros, anote-os para análise**

### Passo 4: Testar Login Manualmente

**Use curl para testar o login diretamente:**

```bash
# Teste de login
curl -X POST https://zollim-checkout.rboln1.easypanel.host/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_username",
    "password": "sua_senha"
  }'
```

**Resposta esperada:**
```json
{
  "user": {
    "id": "uuid-do-usuario",
    "username": "seu_username",
    "name": "Seu Nome"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Passo 5: Testar API com Token

**Use o token obtido no passo anterior:**

```bash
# Substitua SEU_TOKEN_AQUI pelo token real
curl -X GET "https://zollim-checkout.rboln1.easypanel.host/api/shopify/credentials?storeId=7453e5c4-bbb1-4e16-87da-0f031f7e3d56" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

## 🔧 Soluções Específicas

### Solução 1: JWT_SECRET Não Configurado

**Se a variável não existir no Easypanel:**

1. Adicione `JWT_SECRET` nas variáveis de ambiente
2. Use uma chave forte (mínimo 32 caracteres)
3. **Reinicie a aplicação** após adicionar

**Exemplo de chave forte:**
```
JWT_SECRET=minha_chave_super_secreta_de_32_caracteres_ou_mais
```

### Solução 2: Diferença entre Dev e Prod

**Se JWT_SECRET for diferente:**

1. **Opção A:** Use a mesma chave em ambos ambientes
2. **Opção B:** Gere novos tokens em produção

**Para verificar a chave atual em dev:**
```bash
# No seu .env local
cat .env | grep JWT_SECRET
```

### Solução 3: Problema no Payload do Token

**O código usa tanto `id` quanto `userId`. Verifique a consistência:**

1. **No login** (`/api/auth/login/route.ts`):
   ```javascript
   const token = sign({
     id: user.id,        // ← Usa 'id'
     username: user.username,
   }, JWT_SECRET)
   ```

2. **Na validação** (`/api/shopify/credentials/route.ts`):
   ```javascript
   const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
   userId = decoded.userId;  // ← Espera 'userId'
   ```

**Correção necessária:** Padronizar para usar `id` em ambos os lugares.

### Solução 4: Token Expirado

**Se o token expirou:**

1. **Faça logout e login novamente** no frontend
2. **Verifique a validade** do token (padrão: 7 dias)
3. **Implemente refresh token** se necessário

## 🧪 Script de Teste Completo

**Execute este comando no terminal do Easypanel:**

```bash
# 1. Verificar variáveis de ambiente
echo "JWT_SECRET: ${JWT_SECRET:0:10}..."
echo "ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:10}..."
echo "NODE_ENV: $NODE_ENV"

# 2. Testar login
node test_jwt_auth_production.js

# 3. Verificar logs em tempo real
npm run dev 2>&1 | grep -i "jwt\|token\|401"
```

## 📋 Checklist de Verificação

- [ ] JWT_SECRET configurado no Easypanel
- [ ] ENCRYPTION_KEY configurado no Easypanel  
- [ ] Mesma JWT_SECRET em dev e prod
- [ ] Login retorna token válido
- [ ] Token não está expirado
- [ ] Payload do token contém `id` ou `userId` consistente
- [ ] Headers Authorization bem formados
- [ ] Banco de dados acessível
- [ ] Usuário existe no banco
- [ ] Loja pertence ao usuário

## 🚀 Próximos Passos

1. **Execute o diagnóstico** seguindo os passos acima
2. **Identifique a causa específica** do erro 401
3. **Aplique a solução correspondente**
4. **Teste novamente** a funcionalidade
5. **Monitore os logs** para confirmar a correção

## 📞 Suporte

Se o problema persistir após seguir este guia:

1. **Colete os logs** do teste JWT
2. **Anote as variáveis de ambiente** (sem expor valores)
3. **Documente os passos** já executados
4. **Compartilhe os resultados** dos testes

---

**⚠️ IMPORTANTE:** Nunca exponha valores reais de JWT_SECRET ou tokens em logs ou documentação pública.