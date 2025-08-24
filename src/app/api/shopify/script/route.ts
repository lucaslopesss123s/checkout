import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/shopify/script?domain=exemplo.com
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shopDomain = searchParams.get('domain')
    
    if (!shopDomain) {
      return NextResponse.json(
        { error: 'Parâmetro domain é obrigatório' },
        { status: 400 }
      )
    }

    // Primeiro, buscar a loja Shopify pelo domínio
    const lojaShopify = await prisma.loja_Shopify.findFirst({
      where: {
        dominio_api: shopDomain
      }
    })

    if (!lojaShopify) {
      return NextResponse.json(
        { 
          error: 'Loja Shopify não encontrada',
          message: 'Esta loja não está configurada no sistema'
        },
        { status: 404 }
      )
    }

    // Buscar domínio personalizado verificado para esta loja
    const dominio = await prisma.dominios.findFirst({
      where: {
        id_loja: lojaShopify.id_loja,
        status: 'verified',
        dns_verificado: true,
        ativo: true
      }
    })

    // Se não houver domínio personalizado configurado e verificado, não gerar script
    if (!dominio) {
      return NextResponse.json(
        {
          error: 'Domínio não configurado',
          message: 'Esta loja não possui um domínio personalizado configurado e verificado. Configure um domínio na aba "Domínio" do dashboard antes de gerar o script de integração.',
          requires_domain: true
        },
        { status: 400 }
      )
    }

    // Usar domínio personalizado verificado
    const checkoutBaseUrl = `https://checkout.${dominio.dominio}`
    const configBaseUrl = `https://checkout.${dominio.dominio}`

    // Gerar o script JavaScript dinamicamente
    const script = `/**
 * Script de Integração Shopify - Checkout Personalizado
 * Gerado automaticamente para: ${shopDomain}
 * Domínio personalizado: ${dominio ? `checkout.${dominio.dominio}` : 'Não configurado'}
 * 
 * Este script deve ser adicionado ao tema Shopify para redirecionar
 * o checkout padrão para o checkout personalizado.
 * 
 * Instruções de instalação:
 * 1. Acesse Admin > Temas > Ações > Editar código
 * 2. Abra o arquivo theme.liquid
 * 3. Adicione este script antes do </body>
 */

(function() {
    'use strict';
    
    // CONFIGURAÇÃO - URLs geradas automaticamente
    const CHECKOUT_API_URL = '${checkoutBaseUrl}/api/shopify/checkout';
    const CONFIG_API_URL = '${configBaseUrl}/api/shopify/config';
    
    // Configurações do script
    const CONFIG = {
        debug: ${process.env.NODE_ENV === 'development' ? 'true' : 'false'}, // Ativar logs de debug
        interceptCheckout: true, // Interceptar checkout padrão
        interceptCartDrawer: true, // Interceptar drawer do carrinho
        buttonSelectors: [
            'input[name="add"][type="submit"]', // Botão adicionar ao carrinho
            'button[name="add"]', // Botão adicionar ao carrinho (button)
            '.btn--checkout', // Botão checkout personalizado
            '[data-testid="Checkout-button"]', // Botão checkout (temas novos)
            '.cart__checkout-button', // Botão checkout do carrinho
            '.checkout-button', // Botão checkout genérico
            'input[type="submit"][value*="checkout" i]', // Input submit com checkout
            'button[type="submit"]:contains("Checkout")', // Botão com texto checkout
        ],
        excludeSelectors: [
            '.shopify-payment-button', // Botões de pagamento rápido
            '.dynamic-checkout__content', // Conteúdo de checkout dinâmico
        ]
    };
    
    // Função de log para debug
    function log(...args) {
        if (CONFIG.debug) {
            console.log('[Shopify Integration - ${shopDomain}]', ...args);
        }
    }
    
    // Função para obter informações da loja
    function getShopInfo() {
        return {
            domain: window.Shopify?.shop || window.location.hostname,
            currency: window.Shopify?.currency?.active || 'BRL',
            customer: window.Shopify?.customer || null
        };
    }
    
    // Função para obter itens do carrinho
    async function getCartItems() {
        try {
            const response = await fetch('/cart.js');
            const cart = await response.json();
            
            return cart.items.map(item => ({
                id: item.id.toString(),
                product_id: item.product_id.toString(),
                variant_id: item.variant_id.toString(),
                title: item.product_title,
                price: (item.price / 100).toFixed(2), // Converter de centavos
                quantity: item.quantity,
                image: item.image,
                variant_title: item.variant_title,
                url: item.url
            }));
        } catch (error) {
            log('Erro ao obter itens do carrinho:', error);
            return [];
        }
    }
    
    // Função para verificar se a loja está configurada
    async function checkStoreConfiguration() {
        try {
            const shopInfo = getShopInfo();
            const response = await fetch(\`\${CONFIG_API_URL}?domain=\${shopInfo.domain}\`);
            const config = await response.json();
            
            if (config.configured) {
                log('Loja configurada:', config);
                return config;
            } else {
                log('Loja não configurada');
                return null;
            }
        } catch (error) {
            log('Erro ao verificar configuração:', error);
            return null;
        }
    }
    
    // Função para redirecionar para checkout personalizado
    async function redirectToCustomCheckout() {
        try {
            const shopInfo = getShopInfo();
            const cartItems = await getCartItems();
            
            if (cartItems.length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }
            
            // Obter dados completos do carrinho
            const response = await fetch('/cart.js');
            const cartData = await response.json();
            
            // Preparar dados para envio à API
            const checkoutData = {
                products: cartData.items.map(item => ({
                    id: item.id.toString(),
                    title: item.product_title,
                    price: item.price / 100,
                    quantity: item.quantity,
                    image: item.image,
                    variant_title: item.variant_title
                })),
                store_domain: window.location.hostname,
                currency: cartData.currency || 'BRL',
                total_price: cartData.total_price / 100,
                subtotal_price: cartData.items_subtotal_price / 100
            };
            
            // Enviar dados para a API de checkout
            const checkoutResponse = await fetch(CHECKOUT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkoutData)
            });
            
            const result = await checkoutResponse.json();
            
            if (result.success && result.checkout_url) {
                // Redirecionar para a URL de checkout retornada pela API
                window.location.href = result.checkout_url;
            } else {
                console.error('Erro ao criar checkout:', result.error);
                alert('Erro ao processar checkout. Tente novamente.');
            }
            
        } catch (error) {
            console.error('Erro ao redirecionar para checkout:', error);
            alert('Erro ao processar checkout. Tente novamente.');
        }
    }
    
    // Função para interceptar cliques nos botões
    function interceptCheckoutButtons() {
        CONFIG.buttonSelectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            
            buttons.forEach(button => {
                // Verificar se não é um botão excluído
                const isExcluded = CONFIG.excludeSelectors.some(excludeSelector => 
                    button.matches(excludeSelector) || button.closest(excludeSelector)
                );
                
                if (isExcluded) {
                    log('Botão excluído:', button);
                    return;
                }
                
                // Verificar se já foi processado
                if (button.dataset.customCheckoutProcessed) {
                    return;
                }
                
                log('Interceptando botão:', button);
                
                // Marcar como processado
                button.dataset.customCheckoutProcessed = 'true';
                
                // Adicionar event listener
                button.addEventListener('click', function(e) {
                    // Verificar se é realmente um botão de checkout
                    const buttonText = (button.textContent || button.value || '').toLowerCase();
                    const isCheckoutButton = buttonText.includes('checkout') || 
                                           buttonText.includes('finalizar') ||
                                           buttonText.includes('comprar') ||
                                           button.classList.contains('checkout') ||
                                           button.name === 'add';
                    
                    if (isCheckoutButton) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        log('Botão de checkout clicado:', button);
                        redirectToCustomCheckout();
                    }
                });
            });
        });
    }
    
    // Função para interceptar formulários de checkout
    function interceptCheckoutForms() {
        const forms = document.querySelectorAll('form[action*="/cart"], form[action*="/checkout"]');
        
        forms.forEach(form => {
            if (form.dataset.customCheckoutProcessed) {
                return;
            }
            
            form.dataset.customCheckoutProcessed = 'true';
            
            form.addEventListener('submit', function(e) {
                const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
                const buttonText = (submitButton?.textContent || submitButton?.value || '').toLowerCase();
                
                if (buttonText.includes('checkout') || buttonText.includes('finalizar')) {
                    e.preventDefault();
                    log('Formulário de checkout interceptado:', form);
                    redirectToCustomCheckout();
                }
            });
        });
    }
    
    // Função para observar mudanças no DOM (para SPAs)
    function observeDOM() {
        const observer = new MutationObserver(function(mutations) {
            let shouldReprocess = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldReprocess = true;
                }
            });
            
            if (shouldReprocess) {
                setTimeout(() => {
                    interceptCheckoutButtons();
                    interceptCheckoutForms();
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Função de inicialização
    async function init() {
        log('Iniciando integração Shopify para ${shopDomain}...');
        
        // Verificar se a loja está configurada
        const storeConfig = await checkStoreConfiguration();
        
        if (!storeConfig) {
            log('Loja não configurada. Integração desabilitada.');
            return;
        }
        
        log('Loja configurada. Ativando integração.');
        
        // Interceptar botões e formulários existentes
        interceptCheckoutButtons();
        interceptCheckoutForms();
        
        // Observar mudanças no DOM
        observeDOM();
        
        // Adicionar CSS personalizado se necessário
        if (storeConfig.settings?.cor_botao) {
            const style = document.createElement('style');
            style.textContent = \`
                .custom-checkout-button {
                    background-color: \${storeConfig.settings.cor_botao} !important;
                }
            \`;
            document.head.appendChild(style);
        }
        
        log('Integração Shopify ativada com sucesso para ${shopDomain}!');
    }
    
    // Aguardar carregamento do DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Expor funções globalmente para debug
    if (CONFIG.debug) {
        window.ShopifyIntegration = {
            redirectToCustomCheckout,
            getCartItems,
            checkStoreConfiguration,
            getShopInfo
        };
    }
    
})();`

    // Retornar o script com headers apropriados
    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    console.error('Erro ao gerar script Shopify:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}