# Integração Shopify - Guia de Instalação

## Visão Geral

Este guia explica como integrar seu checkout personalizado com uma loja Shopify, permitindo que os clientes sejam redirecionados automaticamente do checkout padrão da Shopify para seu checkout customizado.

## Pré-requisitos

- Acesso administrativo à loja Shopify
- Permissões para editar o código do tema
- Configuração completa no dashboard do checkout personalizado

## Passo 1: Configurar Credenciais da API Shopify

### 1.1 Criar App Privado na Shopify

1. Acesse o painel administrativo da sua loja Shopify
2. Vá para **Configurações** → **Apps e canais de vendas**
3. Clique em **Desenvolver apps**
4. Clique em **Criar um app**
5. Preencha o nome do app (ex: "Checkout Personalizado")
6. Clique em **Criar app**

### 1.2 Configurar Permissões

Na seção **Configuração**, configure as seguintes permissões:

**Admin API access scopes:**
- `read_products` - Para acessar informações dos produtos
- `read_orders` - Para acessar pedidos
- `read_customers` - Para acessar dados dos clientes
- `read_inventory` - Para verificar estoque

### 1.3 Obter Credenciais

1. Clique em **Instalar app**
2. Anote as seguintes informações:
   - **API key** (Chave da API)
   - **API secret key** (Chave secreta)
   - **Access token** (Token de acesso)
   - **Shop domain** (Domínio da loja, ex: `minha-loja.myshopify.com`)

## Passo 2: Configurar no Dashboard

1. Acesse o dashboard do checkout personalizado
2. Vá para **Integrações** → **Shopify**
3. Preencha os campos na aba **Configuração**:
   - **Domínio da Loja**: `minha-loja.myshopify.com`
   - **Chave da API**: Sua API key
   - **Chave Secreta**: Sua API secret key
   - **Token da API**: Seu access token
4. Clique em **Testar Conexão** para verificar
5. Configure a personalização na aba **Checkout**
6. Clique em **Salvar Configuração**

## Passo 3: Instalar o Script no Tema

### 3.1 Acessar Editor de Código

1. No painel administrativo da Shopify, vá para **Loja online** → **Temas**
2. No tema ativo, clique em **Ações** → **Editar código**

### 3.2 Localizar o Arquivo theme.liquid

1. Na seção **Layout**, clique em `theme.liquid`
2. Role até o final do arquivo, antes da tag `</body>`

### 3.3 Adicionar o Script

1. No dashboard, vá para a aba **Script**
2. Copie todo o código gerado
3. Cole o código no arquivo `theme.liquid` antes de `</body>`
4. Clique em **Salvar**

### Exemplo de Posicionamento:

```liquid
<!-- Outros scripts do tema -->

<!-- Script de Integração Shopify - Checkout Personalizado -->
<script>
(function() {
    'use strict';
    // ... código do script ...
})();
</script>
<!-- Fim do Script de Integração -->

</body>
</html>
```

## Passo 4: Configurar Produtos

### 4.1 Sincronização de Produtos

Certifique-se de que os produtos da Shopify estejam cadastrados no seu sistema de checkout personalizado com os mesmos IDs ou SKUs.

### 4.2 Mapeamento de Variantes

O script captura automaticamente:
- ID do produto
- ID da variante
- Título do produto
- Preço
- Quantidade
- Imagem
- Título da variante

## Passo 5: Testar a Integração

### 5.1 Teste Básico

1. Acesse sua loja Shopify
2. Adicione produtos ao carrinho
3. Clique em "Finalizar compra" ou "Checkout"
4. Verifique se é redirecionado para o checkout personalizado

### 5.2 Verificar Dados

No checkout personalizado, confirme se:
- Produtos aparecem corretamente
- Preços estão corretos
- Quantidades estão corretas
- Imagens são exibidas

### 5.3 Teste de Diferentes Cenários

- Carrinho vazio
- Múltiplos produtos
- Produtos com variantes
- Produtos em promoção

## Solução de Problemas

### Problema: Redirecionamento não funciona

**Possíveis causas:**
- Script não foi instalado corretamente
- Seletores de botão não correspondem ao tema
- Erro nas credenciais da API

**Soluções:**
1. Verifique se o script está antes de `</body>`
2. Abra o console do navegador (F12) para ver erros
3. Teste a conexão no dashboard

### Problema: Produtos não aparecem no checkout

**Possíveis causas:**
- Produtos não estão sincronizados
- IDs não correspondem
- Erro na API de carrinho

**Soluções:**
1. Verifique se os produtos existem no sistema
2. Confirme os IDs dos produtos
3. Teste a API `/cart.js` da Shopify

### Problema: Erro de CORS

**Possíveis causas:**
- Domínio não configurado corretamente
- Configurações de segurança

**Soluções:**
1. Verifique o domínio no dashboard
2. Confirme as configurações de CORS no servidor

## Logs e Depuração

### Ativar Modo Debug

Para ativar logs detalhados, adicione esta linha no início do script:

```javascript
const DEBUG_MODE = true;
```

### Verificar Console

Abra o console do navegador (F12) para ver:
- Logs de execução
- Erros de API
- Dados do carrinho
- Respostas do servidor

## Personalização Avançada

### Seletores Personalizados

Se seu tema usa seletores diferentes, modifique a array `selectors` no script:

```javascript
const selectors = [
    '.btn--checkout',
    '.seu-botao-personalizado',
    '[data-testid="Checkout-button"]'
];
```

### Eventos Personalizados

Para temas com comportamentos especiais, você pode adicionar eventos personalizados:

```javascript
// Exemplo para temas com AJAX
document.addEventListener('cart:updated', function() {
    setTimeout(interceptCheckoutButtons, 500);
});
```

## Segurança

### Validação de Domínio

O script valida automaticamente o domínio da loja para evitar uso não autorizado.

### Proteção de Dados

Todas as credenciais são armazenadas de forma segura e criptografada.

### HTTPS Obrigatório

A integração funciona apenas com HTTPS ativado.

## Suporte

Para suporte técnico:

1. Verifique os logs no console do navegador
2. Teste a conexão no dashboard
3. Confirme se todos os passos foram seguidos
4. Entre em contato com o suporte técnico com os detalhes do erro

## Atualizações

### Atualizar Script

1. Acesse o dashboard
2. Vá para **Integrações** → **Shopify** → **Script**
3. Copie o novo código
4. Substitua o código antigo no `theme.liquid`
5. Salve as alterações

### Backup do Tema

Antes de fazer alterações:
1. Vá para **Loja online** → **Temas**
2. Clique em **Ações** → **Duplicar**
3. Mantenha uma cópia de segurança

---

**Última atualização:** Janeiro 2024
**Versão do script:** 1.0.0