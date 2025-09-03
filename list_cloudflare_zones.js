const https = require('https');

const CF_TOKEN = 'Xfh4fwnRxG11r90AK8ngKYCeqjxWjS5VIRUYKBaE';

const options = {
  hostname: 'api.cloudflare.com',
  port: 443,
  path: '/client/v4/zones',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${CF_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.success) {
        console.log('\n=== ZONAS CLOUDFLARE ===');
        console.log(`Total de zonas: ${response.result.length}\n`);
        
        response.result.forEach((zone, index) => {
          console.log(`${index + 1}. ${zone.name}`);
          console.log(`   ID: ${zone.id}`);
          console.log(`   Status: ${zone.status}`);
          console.log(`   Plano: ${zone.plan.name}`);
          console.log('');
        });
        
        // Procurar especificamente por durango.com
        const durangoZone = response.result.find(zone => zone.name === 'durango.com');
        if (durangoZone) {
          console.log('\n🎯 ZONA ENCONTRADA: durango.com');
          console.log(`   ID: ${durangoZone.id}`);
          console.log(`   Status: ${durangoZone.status}`);
        } else {
          console.log('\n❌ Zona durango.com não encontrada');
        }
        
      } else {
        console.error('Erro na resposta:', response.errors);
      }
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
      console.log('Resposta bruta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error);
});

req.end();