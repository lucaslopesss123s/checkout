import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Função para gerar o conteúdo do script
function generateScriptContent(storeId: string, domainName: string, checkoutBaseUrl: string, configBaseUrl: string) {
  return `/**
 * Script de Integração Shopify - Checkout Personalizado
 * Gerado automaticamente para loja: ${storeId}
 * Domínio personalizado: checkout.${domainName}
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
            console.log('[Shopify Integration - Store: ${storeId}]', ...args);
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
            log('Redirecionando para checkout personalizado...');
            
            const cartItems = await getCartItems();
            const shopInfo = getShopInfo();
            
            if (cartItems.length === 0) {
                log('Carrinho vazio, não redirecionando');
                return false;
            }
            
            // Criar sessão de checkout
            const checkoutData = {
                items: cartItems,
                shop: shopInfo,
                timestamp: Date.now()
            };
            
            const response = await fetch(CHECKOUT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkoutData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.checkout_url) {
                    log('Redirecionando para:', result.checkout_url);
                    window.location.href = result.checkout_url;
                    return true;
                } else {
                    log('URL de checkout não retornada');
                }
            } else {
                log('Erro na resposta da API:', response.status);
            }
            
        } catch (error) {
            log('Erro ao redirecionar:', error);
        }
        
        return false;
    }
    
    // Função para interceptar cliques em botões de checkout
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
                
                // Verificar se já foi interceptado
                if (button.dataset.shopifyIntegrationIntercepted) {
                    return;
                }
                
                log('Interceptando botão:', button);
                
                button.addEventListener('click', async (e) => {
                    // Se for botão de adicionar ao carrinho, deixar funcionar normalmente
                    if (button.name === 'add' || button.matches('input[name="add"]')) {
                        log('Botão de adicionar ao carrinho, não interceptando');
                        return;
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const success = await redirectToCustomCheckout();
                    
                    if (!success) {
                        log('Falha no redirecionamento, permitindo comportamento padrão');
                        // Remover o listener temporariamente e clicar novamente
                        button.removeEventListener('click', arguments.callee);
                        button.click();
                        // Reativar o listener após um pequeno delay
                        setTimeout(() => {
                            button.addEventListener('click', arguments.callee);
                        }, 100);
                    }
                });
                
                button.dataset.shopifyIntegrationIntercepted = 'true';
            });
        });
    }
    
    // Função para interceptar formulários de checkout
    function interceptCheckoutForms() {
        const forms = document.querySelectorAll('form[action*="/cart"], form[action*="/checkout"]');
        
        forms.forEach(form => {
            if (form.dataset.shopifyIntegrationIntercepted) {
                return;
            }
            
            log('Interceptando formulário:', form);
            
            form.addEventListener('submit', async (e) => {
                // Se for formulário de adicionar ao carrinho, deixar funcionar
                if (form.action.includes('/cart/add')) {
                    log('Formulário de adicionar ao carrinho, não interceptando');
                    return;
                }
                
                e.preventDefault();
                
                const success = await redirectToCustomCheckout();
                
                if (!success) {
                    log('Falha no redirecionamento, permitindo envio padrão');
                    form.removeEventListener('submit', arguments.callee);
                    form.submit();
                }
            });
            
            form.dataset.shopifyIntegrationIntercepted = 'true';
        });
    }
    
    // Função para observar mudanças no DOM
    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Interceptar novos botões
                            interceptCheckoutButtons();
                            interceptCheckoutForms();
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Função de inicialização
    async function init() {
        log('Iniciando integração Shopify para loja ${storeId}...');
        
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
        
        log('Integração Shopify ativada com sucesso para loja ${storeId}!');
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
}

// GET /api/shopify/script?domain=exemplo.com&storeId=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shopDomain = searchParams.get('domain')
    const storeId = searchParams.get('storeId')
    
    // Se storeId for fornecido, usar busca direta por loja
    if (storeId) {
      // Buscar domínio personalizado verificado para esta loja
      const dominio = await prisma.dominios.findFirst({
        where: {
          id_loja: storeId,
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

      // Usar URL baseada no ambiente e host
      const isDevelopment = process.env.NODE_ENV === 'development'
      const isLocalhost = request.url.includes('localhost')
      const useLocalhost = isDevelopment || isLocalhost
      const checkoutBaseUrl = useLocalhost ? 'http://localhost:3000' : `https://checkout.${dominio.dominio}`
      const configBaseUrl = useLocalhost ? 'http://localhost:3000' : `https://checkout.${dominio.dominio}`

      // Gerar o script JavaScript dinamicamente
      const script = generateScriptContent(storeId, dominio.dominio, checkoutBaseUrl, configBaseUrl)
      
      return new NextResponse(script, {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }
    
    // Fallback para o método antigo usando domain
    if (!shopDomain) {
      return NextResponse.json(
        { error: 'Parâmetro domain ou storeId é obrigatório' },
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

    // Usar URL baseada no ambiente e host
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isLocalhost = request.url.includes('localhost')
    const useLocalhost = isDevelopment || isLocalhost
    const checkoutBaseUrl = useLocalhost ? 'http://localhost:3000' : `https://checkout.${dominio.dominio}`
    const configBaseUrl = useLocalhost ? 'http://localhost:3000' : `https://checkout.${dominio.dominio}`

    // Gerar o script JavaScript dinamicamente usando a função generateScriptContent
    const script = generateScriptContent(lojaShopify.id_loja, dominio.dominio, checkoutBaseUrl, configBaseUrl)

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