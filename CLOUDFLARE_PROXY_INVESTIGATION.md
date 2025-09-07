# 🔍 INVESTIGAÇÃO: Cloudflare Proxy e Erro 404

## Problema Identificado

O domínio `checkout.pesquisaencomenda.online` está usando **proxy do Cloudflare** (nuvem laranja), o que pode estar causando o erro 404.

## Como o Proxy do Cloudflare Funciona

### ✅ Vantagens do Proxy:
- **SSL automático**: Cloudflare fornece certificado SSL automaticamente
- **CDN**: Cache e distribuição global
- **Proteção DDoS**: Proteção contra ataques
- **Otimizações**: Compressão, minificação, etc.

### ⚠️ Possíveis Problemas:
- **Roteamento incorreto**: Proxy pode não estar apontando para o servidor correto
- **Configuração de origem**: Servidor de origem pode não estar configurado
- **Porta incorreta**: Cloudflare pode estar tentando conectar na porta errada
- **SSL/TLS**: Problemas de configuração SSL entre Cloudflare e origem

## Diagnóstico do Problema

### Cenário Mais Provável:
1. **Cloudflare está ativo** (proxy ligado)
2. **SSL está funcionando** (certificado do Cloudflare)
3. **Servidor de origem não está respondendo** ou **não está configurado corretamente**
4. **Cloudflare retorna 404** porque não consegue conectar com o servidor real

### Teste para Confirmar:

#### 1. Verificar Status do Servidor de Origem
```bash
# Testar diretamente o IP do servidor (sem Cloudflare)
curl -H "Host: checkout.pesquisaencomenda.online" http://[IP_DO_SERVIDOR]:3000/

# Ou se tiver acesso SSH ao servidor:
curl http://localhost:3000/
```

#### 2. Verificar Configuração do Cloudflare
- **DNS Records**: Verificar se o registro A/CNAME está correto
- **SSL/TLS Mode**: Deve estar em "Full" ou "Full (strict)"
- **Origin Server**: Verificar se está apontando para IP/porta corretos

## Soluções Possíveis

### Solução 1: Verificar Configuração do EasyPanel
```bash
# No EasyPanel, verificar:
1. Serviço está rodando na porta correta (3000)
2. Bind está configurado para 0.0.0.0:3000 (não apenas localhost)
3. Variáveis de ambiente estão corretas
4. Build foi executado com sucesso
```

### Solução 2: Configuração do Cloudflare
```
1. DNS Records:
   - Tipo: A ou CNAME
   - Nome: checkout
   - Valor: IP do servidor EasyPanel
   - Proxy: 🟠 Proxied (pode manter ativo)

2. SSL/TLS:
   - Mode: Full ou Full (strict)
   - Edge Certificates: Ativo
   - Origin Certificates: Configurar se necessário

3. Origin Rules (se necessário):
   - Host Header Override: checkout.pesquisaencomenda.online
   - Port: 3000 (se diferente de 80/443)
```

### Solução 3: Temporariamente Desabilitar Proxy
```
1. No Cloudflare DNS:
   - Clicar na nuvem laranja para ficar cinza (DNS Only)
   - Aguardar propagação (alguns minutos)
   - Testar se API funciona diretamente

2. Se funcionar sem proxy:
   - Problema está na configuração do Cloudflare
   - Reconfigurar proxy corretamente
```

## Configuração Recomendada para Next.js + EasyPanel + Cloudflare

### No EasyPanel:
```dockerfile
# Dockerfile ou configuração
EXPOSE 3000
CMD ["npm", "start"]

# Variáveis de ambiente
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
```

### No Cloudflare:
```
DNS:
- checkout.pesquisaencomenda.online → IP_DO_EASYPANEL (Proxied)

SSL/TLS:
- Mode: Full
- Edge Certificates: Universal SSL ativo

Page Rules (opcional):
- checkout.pesquisaencomenda.online/api/* → Cache Level: Bypass
```

## Comandos de Teste

### 1. Testar sem Cloudflare (DNS Only):
```bash
curl https://checkout.pesquisaencomenda.online/api/shopify/config?domain=ethf0j-1z.myshopify.com
```

### 2. Testar com Cloudflare (Proxied):
```bash
curl -H "CF-Connecting-IP: 1.1.1.1" https://checkout.pesquisaencomenda.online/api/shopify/config?domain=ethf0j-1z.myshopify.com
```

### 3. Verificar Headers do Cloudflare:
```bash
curl -I https://checkout.pesquisaencomenda.online/
# Deve mostrar: cf-ray, cf-cache-status, server: cloudflare
```

## Próximos Passos

1. **Verificar configuração do EasyPanel** (servidor rodando na porta correta)
2. **Testar temporariamente sem proxy** (nuvem cinza)
3. **Se funcionar sem proxy**: Reconfigurar Cloudflare
4. **Se não funcionar**: Problema está no servidor EasyPanel

---

**CONCLUSÃO**: O proxy do Cloudflare pode estar mascarando o problema real. O SSL funciona porque o Cloudflare fornece, mas o 404 indica que o Cloudflare não consegue conectar com o servidor de origem.