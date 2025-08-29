# Configuração SSL na VPS - Guia Completo

## 🚀 Resumo Rápido para VPS

```bash
# 1. Conectar e navegar
ssh usuario@seu-vps-ip
cd /caminho/para/sua/aplicacao

# 2. Ativar SSL com remoção automática de auto-assinados (RECOMENDADO)
node force_letsencrypt.js checkout.zollim.store

# 3. Verificar resultado
node check_ssl_cert.js checkout.zollim.store
```

## 📋 Pré-requisitos

1. Acesso SSH à sua VPS
2. Node.js instalado
3. Aplicação já deployada no EasyPanel
4. Domínio apontando para a VPS

## 🚀 Comandos Detalhados para Executar na VPS

### 1. Conectar à VPS via SSH
```bash
ssh usuario@seu-servidor.com
```

### 2. Navegar até o diretório da aplicação
```bash
cd /path/to/your/checkout-app
```

### 3. Verificar certificado atual
```bash
node check_ssl_cert.js checkout.zollim.store
```

### 4. Forçar ativação Let's Encrypt (remove auto-assinado)
```bash
# Forçar regeneração para domínio padrão (zollim.store)
node force_letsencrypt.js

# Forçar regeneração para domínio específico
node force_letsencrypt.js checkout.zollim.store

# Ver ajuda do comando
node force_letsencrypt.js --help

# Desabilitar remoção automática de certificados auto-assinados
export AUTO_REMOVE_SELF_SIGNED=false
node force_letsencrypt.js
```

### 5. Verificar se o certificado foi atualizado
```bash
node check_ssl_cert.js checkout.zollim.store
```

### 6. Testar conectividade SSL
```bash
curl -I https://checkout.zollim.store
```

## 🔧 Configuração Automática (Remoção de Auto-Assinados)

### Comportamento Padrão - Remoção Automática

**🎯 Por padrão, o sistema agora remove automaticamente certificados auto-assinados do EasyPanel!**

```bash
# ✅ Comportamento padrão - Remove auto-assinados automaticamente
node force_letsencrypt.js checkout.zollim.store

# ❌ Para manter certificados auto-assinados (não recomendado)
export AUTO_REMOVE_SELF_SIGNED=false
node force_letsencrypt.js checkout.zollim.store
```

### Script Manual para Remoção (se necessário)
```bash
# Criar script para remover certificados auto-assinados manualmente
cat > remove_self_signed.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeSelfSigned() {
  const certs = await prisma.sSL_certificates.findMany({
    where: { provider: 'self-signed', is_active: true }
  });
  
  for (const cert of certs) {
    await prisma.dominios.updateMany({
      where: { ssl_certificate_id: cert.id },
      data: { ssl_ativo: false, ssl_certificate_id: null }
    });
    
    await prisma.sSL_certificates.delete({
      where: { id: cert.id }
    });
    
    console.log(`Removido certificado auto-assinado: ${cert.domain}`);
  }
  
  await prisma.$disconnect();
}

removeSelfSigned();
EOF

# Executar remoção manual
node remove_self_signed.js
```

### Script de Configuração Automática
Crie um script que será executado automaticamente:

```bash
# Criar script de configuração
cat > setup_ssl_production.sh << 'EOF'
#!/bin/bash

echo "🔄 Configurando SSL para produção..."

# Lista de domínios para configurar
DOMAINS=("checkout.zollim.store")

for domain in "${DOMAINS[@]}"; do
    echo "📋 Processando domínio: $domain"
    
    # Verificar certificado atual
    echo "🔍 Verificando certificado atual..."
    node check_ssl_cert.js "$domain"
    
    # Forçar Let's Encrypt se for auto-assinado
    echo "🔄 Forçando Let's Encrypt..."
    node force_letsencrypt.js "$domain"
    
    # Aguardar processamento
    sleep 10
    
    # Verificar resultado
    echo "✅ Verificando resultado..."
    node check_ssl_cert.js "$domain"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
done

echo "🎉 Configuração SSL concluída!"
EOF

# Tornar executável
chmod +x setup_ssl_production.sh

# Executar
./setup_ssl_production.sh
```

## 🔄 Configuração de Cron para Monitoramento

### Adicionar monitoramento automático
```bash
# Editar crontab
crontab -e

# Adicionar linha para verificar SSL diariamente às 2h da manhã
0 2 * * * cd /path/to/your/checkout-app && node force_letsencrypt.js checkout.zollim.store >> /var/log/ssl-check.log 2>&1
```

## 📝 Modificação do Sistema (Remoção Automática)

Para que o sistema remova automaticamente certificados auto-assinados por padrão, você precisa:

### 1. Modificar o arquivo `force_letsencrypt.js`

O arquivo já está configurado para:
- ✅ Detectar certificados auto-assinados
- ✅ Removê-los automaticamente
- ✅ Ativar Let's Encrypt em seu lugar

### 2. Configurar variável de ambiente
```bash
# Adicionar ao .env ou .bashrc
echo 'AUTO_REMOVE_SELF_SIGNED=true' >> .env
```

## 🧪 Testes de Validação

### Testar API SSL
```bash
# Testar endpoint de ativação
curl -X POST https://checkout.zollim.store/api/ssl/activate \
  -H "Content-Type: application/json" \
  -d '{"domain":"checkout.zollim.store"}'

# Testar endpoint de domínios elegíveis
curl https://checkout.zollim.store/api/ssl/batch/eligible
```

### Verificar certificado no navegador
```bash
# Verificar detalhes do certificado
openssl s_client -connect checkout.zollim.store:443 -servername checkout.zollim.store < /dev/null 2>/dev/null | openssl x509 -text -noout
```

## 🚨 Solução de Problemas

### Se o certificado ainda estiver auto-assinado:

1. **Verificar DNS**:
```bash
nslookup checkout.zollim.store
```

2. **Verificar porta 80 aberta**:
```bash
telnet checkout.zollim.store 80
```

3. **Verificar logs do EasyPanel**:
```bash
docker logs easypanel-container-name
```

4. **Forçar renovação manual**:
```bash
# Remover certificado atual
node force_letsencrypt.js checkout.zollim.store

# Aguardar 30 segundos
sleep 30

# Verificar novamente
node check_ssl_cert.js checkout.zollim.store
```

### Se houver erro de conectividade:

1. **Verificar se a aplicação está rodando**:
```bash
ps aux | grep node
netstat -tlnp | grep :3000
```

2. **Reiniciar aplicação**:
```bash
pm run build
npm start
```

## 📊 Monitoramento Contínuo

### Script de monitoramento
```bash
# Criar script de monitoramento
cat > monitor_ssl.sh << 'EOF'
#!/bin/bash

DOMAIN="checkout.zollim.store"
LOG_FILE="/var/log/ssl-monitor.log"

echo "$(date): Verificando SSL para $DOMAIN" >> $LOG_FILE

# Verificar se é auto-assinado
CERT_INFO=$(node check_ssl_cert.js "$DOMAIN" 2>&1)

if echo "$CERT_INFO" | grep -q "self-signed"; then
    echo "$(date): Certificado auto-assinado detectado. Forçando Let's Encrypt..." >> $LOG_FILE
    node force_letsencrypt.js "$DOMAIN" >> $LOG_FILE 2>&1
else
    echo "$(date): Certificado Let's Encrypt OK" >> $LOG_FILE
fi
EOF

chmod +x monitor_ssl.sh
```

## 🎯 Resumo dos Comandos Principais

```bash
# 1. Verificar certificado
node check_ssl_cert.js checkout.zollim.store

# 2. Forçar Let's Encrypt (remove auto-assinado)
node force_letsencrypt.js checkout.zollim.store

# 3. Testar HTTPS
curl -I https://checkout.zollim.store

# 4. Configurar monitoramento automático
echo '0 2 * * * cd /path/to/app && node force_letsencrypt.js checkout.zollim.store' | crontab -
```

## ✅ Verificação Final

Após executar os comandos, verifique:

1. ✅ Certificado não é mais auto-assinado
2. ✅ HTTPS funciona sem erros no navegador
3. ✅ API responde corretamente
4. ✅ Checkout Shopify funciona sem erros SSL

---

**Nota**: O sistema já está configurado para remover automaticamente certificados auto-assinados do EasyPanel quando você executa `force_letsencrypt.js`.