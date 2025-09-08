# Resolver Erro 404 na API /api/shopify/config

## Problema Identificado

A API `https://checkout.pesquisaencomenda.online/api/shopify/config?domain=ethf0j-1z.myshopify.com` está retornando **404 Not Found** porque a loja Shopify `ethf0j-1z.myshopify.com` não existe no banco de dados de produção.

## Causa

Os dados da loja Shopify existem apenas no ambiente de desenvolvimento local, mas não foram sincronizados para o banco de dados de produção no EasyPanel.

## Solução

### 1. Conectar ao Banco de Produção

Conecte-se ao banco PostgreSQL de produção usando as credenciais do EasyPanel:

```bash
# Use o DATABASE_URL do seu .env de produção
psql "postgresql://usuario:senha@host:porta/database"
```

### 2. Executar Comandos SQL

Execute os seguintes comandos SQL para inserir os dados da loja:

```sql
-- Inserir dados da loja Shopify
INSERT INTO "loja_Shopify" ("id", "chave_api", "chave_secreta", "token_api", "dominio_api", "id_loja", "createdAt", "updatedAt") VALUES
('da8d917e-cc72-4aea-a4e0-098689014dd5', 'YOUR_API_KEY', 'YOUR_SECRET_KEY', 'YOUR_ACCESS_TOKEN', 'your-store.myshopify.com', '7453e5c4-bbb1-4e16-87da-0f031f7e3d56', '2025-09-02T16:45:52.588Z', '2025-09-03T04:02:21.354Z');

-- Inserir dados do domínio personalizado
INSERT INTO "dominios" ("id", "dominio", "id_loja", "status", "ativo", "createdAt", "updatedAt") VALUES
('d48bc0c4-dc98-42d6-bac8-e50a0a259ab9', 'pesquisaencomenda.online', '7453e5c4-bbb1-4e16-87da-0f031f7e3d56', 'active', true, '2025-09-03T00:19:21.573Z', '2025-09-03T00:34:15.562Z');

-- Inserir configuração do checkout
INSERT INTO "checkout" ("id", "id_loja", "Tema", "Logo", "Favicon", "Corbarra", "Corbotao", "Contagemregressiva", "BarraTexto", "createdAt", "updatedAt") VALUES
('c4234fa9-73d7-4518-8bf7-18278185fe52', '7453e5c4-bbb1-4e16-87da-0f031f7e3d56', 'default', NULL, NULL, '#3b82f6', '#10b981', false, NULL, '2025-09-02T16:45:52.681Z', '2025-09-03T04:02:21.593Z');
```

### 3. Verificar Inserção

Verifique se os dados foram inseridos corretamente:

```sql
-- Verificar loja Shopify
SELECT * FROM "loja_Shopify" WHERE "dominio_api" = 'ethf0j-1z.myshopify.com';

-- Verificar domínio
SELECT * FROM "dominios" WHERE "id_loja" = '7453e5c4-bbb1-4e16-87da-0f031f7e3d56';

-- Verificar checkout
SELECT * FROM "checkout" WHERE "id_loja" = '7453e5c4-bbb1-4e16-87da-0f031f7e3d56';
```

### 4. Testar API

Após inserir os dados, teste a API:

```bash
curl -X GET "https://checkout.pesquisaencomenda.online/api/shopify/config?domain=ethf0j-1z.myshopify.com"
```

A resposta deve ser algo como:

```json
{
  "success": true,
  "configured": true,
  "loja_id": "7453e5c4-bbb1-4e16-87da-0f031f7e3d56",
  "domain": "ethf0j-1z.myshopify.com",
  "checkout_url": "https://checkout.pesquisaencomenda.online/checkout/shopify",
  "api_endpoint": "https://checkout.pesquisaencomenda.online/api/shopify/checkout"
}
```

## Problemas Relacionados

Após resolver o erro 404, ainda podem existir:

1. **Problemas de CORS**: A API já tem cabeçalhos CORS configurados
2. **Cookies inválidos**: Relacionados ao domínio do Shopify
3. **Redirecionamento**: Pode funcionar após resolver o 404

## Prevenção

Para evitar este problema no futuro:

1. Sincronize dados entre desenvolvimento e produção
2. Use migrações de banco de dados
3. Implemente scripts de deploy que incluam dados essenciais

## Status

- ✅ Problema identificado
- ✅ Comandos SQL gerados
- ⏳ Aguardando execução no banco de produção
- ⏳ Teste da API após sincronização