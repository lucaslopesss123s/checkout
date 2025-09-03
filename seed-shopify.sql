-- Inserir loja admin de exemplo
INSERT INTO "Loja_admin" (id, user_id, "Nome", "createdAt", "updatedAt")
VALUES (
  'loja-admin-example-001',
  (SELECT id FROM "User" LIMIT 1),
  'Loja Exemplo Shopify',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir configuração Shopify
INSERT INTO "Loja_Shopify" (id, chave_api, chave_secreta, token_api, dominio_api, id_loja, "createdAt", "updatedAt")
VALUES (
  'shopify-config-001',
  'example_api_key',
  'example_secret_key',
  'example_access_token',
  'egex0y-ue.myshopify.com',
  'loja-admin-example-001',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir configuração de checkout
INSERT INTO "Checkout" (id, "Tema", "Logo", "Favicon", "Corbarra", "Corbotao", "Contagemregressiva", "BarraTexto", id_loja, "createdAt", "updatedAt")
VALUES (
  'checkout-config-001',
  'default',
  NULL,
  NULL,
  '#3b82f6',
  '#10b981',
  false,
  'Oferta por tempo limitado!',
  'loja-admin-example-001',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir alguns produtos de exemplo
INSERT INTO "Produtos" (id, id_loja, "Titulo", "Descricao", valor, valordesconto, "Imagem", shopify_produto_id, shopify_variante_id, "createdAt", "updatedAt")
VALUES 
(
  'produto-001',
  'loja-admin-example-001',
  'Produto Exemplo 1',
  'Descrição do produto exemplo',
  99.90,
  79.90,
  'https://via.placeholder.com/300x300',
  '12345678901',
  '98765432101',
  NOW(),
  NOW()
),
(
  'produto-002',
  'loja-admin-example-001',
  'Produto Exemplo 2',
  'Outro produto de exemplo',
  149.90,
  119.90,
  'https://via.placeholder.com/300x300',
  '12345678902',
  '98765432102',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;