# 🔐 Guia para Gerar Token API do Cloudflare

## ❌ Problema Identificado

O token API fornecido (`4dzjhUmN7Jw41oL_ZUe_5SLhq3vRafxrPA-4LXqj`) está **inválido** segundo a API do Cloudflare.

**Resultado do teste:**
- ✅ Email válido: `cfdojulian@gmail.com`
- ✅ Token tem tamanho adequado (40 caracteres)
- ❌ **Token inválido**: Invalid API Token

## 🛠️ Como Gerar um Token API Válido

### Passo 1: Acessar o Painel do Cloudflare
1. Acesse [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Faça login com sua conta (`cfdojulian@gmail.com`)

### Passo 2: Ir para API Tokens
1. No canto superior direito, clique no **ícone do perfil**
2. Selecione **"My Profile"**
3. Clique na aba **"API Tokens"**

### Passo 3: Criar Novo Token
1. Clique em **"Create Token"**
2. Escolha **"Custom token"** ou use um template

### Passo 4: Configurar Permissões
Para funcionar com nossa integração, o token precisa das seguintes permissões:

**Permissões Obrigatórias:**
- `Zone:Zone:Read` - Para listar zonas
- `Zone:Zone Settings:Edit` - Para configurar SSL
- `Zone:DNS:Edit` - Para gerenciar registros DNS

**Permissões Recomendadas:**
- `Zone:Zone:Edit` - Para criar/editar zonas
- `Account:Account Settings:Read` - Para informações da conta

### Passo 5: Configurar Recursos
- **Account resources**: Include - All accounts
- **Zone resources**: Include - All zones

### Passo 6: Configurar Restrições (Opcional)
- **Client IP address filtering**: Deixe em branco para permitir qualquer IP
- **TTL**: Configure conforme necessário (recomendado: sem expiração ou 1 ano)

### Passo 7: Criar e Copiar Token
1. Clique em **"Continue to summary"**
2. Revise as configurações
3. Clique em **"Create Token"**
4. **COPIE O TOKEN IMEDIATAMENTE** - ele só será mostrado uma vez!

## 🔍 Verificar Token Gerado

Após gerar o novo token, você pode testá-lo executando:

```bash
node test_cloudflare_credentials.js
```

Ou testando diretamente via curl:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer SEU_NOVO_TOKEN" \
     -H "Content-Type: application/json"
```

## 🚨 Problemas Comuns

### Token Expirado
- Verifique se o token não expirou
- Gere um novo token se necessário

### Permissões Insuficientes
- Certifique-se de que o token tem as permissões listadas acima
- Recrie o token com as permissões corretas

### Token Inválido/Corrompido
- O token pode ter sido copiado incorretamente
- Gere um novo token

### Conta Sem Acesso
- Verifique se a conta tem acesso às zonas necessárias
- Confirme se a conta não está suspensa

## 📝 Exemplo de Token Válido

Um token válido do Cloudflare geralmente tem este formato:
```
ABCDEF1234567890abcdef1234567890ABCDEF12
```

- Sempre tem **40 caracteres**
- Contém letras maiúsculas, minúsculas e números
- Não contém caracteres especiais como `-` ou `_`

## ✅ Próximos Passos

1. **Gere um novo token** seguindo os passos acima
2. **Teste o token** com o script de verificação
3. **Configure no sistema** usando o novo token válido
4. **Teste a integração** no dashboard

## 🆘 Suporte

Se ainda tiver problemas:
1. Verifique se sua conta Cloudflare está ativa
2. Confirme se você tem permissões de administrador na conta
3. Tente gerar um novo token com permissões mais amplas
4. Entre em contato com o suporte do Cloudflare se necessário

---

**⚠️ IMPORTANTE**: Nunca compartilhe seu token API. Mantenha-o seguro e regenere-o se suspeitar que foi comprometido.