const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

// Teste ao iniciar
testMagaluAccess();

// Endpoint de teste manual
app.get('/', async (req, res) => {
  const result = await testMagaluAccess();
  res.json(result);
});

app.get('/test', async (req, res) => {
  const result = await testMagaluAccess();
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`🧪 Servidor de teste rodando na porta ${PORT}`);
});

async function testMagaluAccess() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   🧪 TESTE DE ACESSO - MAGAZINE LUIZA              ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // TESTE 1: Página principal
  console.log('1️⃣ Testando acesso à página principal...');
  try {
    const response = await axios.get('https://www.magazinevoce.com.br/magazinepromoforia/selecao/ofertasdodia/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const hasCaptcha = response.data.includes('Captcha Magalu') || 
                      response.data.includes('az-request-verify') ||
                      response.data.includes('I\'m not a robot');

    const test1 = {
      name: 'Página Principal',
      url: 'https://www.magazinevoce.com.br/magazinepromoforia/selecao/ofertasdodia/',
      status: response.status,
      blocked: hasCaptcha,
      title: response.data.match(/<title>(.*?)<\/title>/)?.[1] || 'N/A'
    };

    results.tests.push(test1);

    if (hasCaptcha) {
      console.log('   ❌ BLOQUEADO - Captcha detectado!');
      console.log(`   Título: ${test1.title}\n`);
    } else {
      console.log('   ✅ ACESSO OK!');
      console.log(`   Título: ${test1.title}\n`);
    }
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
    results.tests.push({
      name: 'Página Principal',
      error: error.message,
      blocked: true
    });
  }

  // TESTE 2: API Interna
  console.log('2️⃣ Testando acesso à API interna...');
  try {
    const response = await axios.get('https://www.magazinevoce.com.br/api/catalog/v2/selecao/ofertasdodia', {
      params: { page: 1, limit: 10 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.magazinevoce.com.br/'
      },
      timeout: 15000
    });

    const isJSON = typeof response.data === 'object';
    const isArray = Array.isArray(response.data);
    const hasCaptcha = typeof response.data === 'string' && response.data.includes('Captcha');

    const test2 = {
      name: 'API Interna',
      url: 'https://www.magazinevoce.com.br/api/catalog/v2/selecao/ofertasdodia',
      status: response.status,
      blocked: hasCaptcha,
      isJSON: isJSON,
      isArray: isArray,
      dataType: typeof response.data,
      itemsCount: isArray ? response.data.length : 0
    };

    results.tests.push(test2);

    if (hasCaptcha) {
      console.log('   ❌ BLOQUEADO - Captcha na API!');
    } else if (isArray && response.data.length > 0) {
      console.log(`   ✅ API FUNCIONANDO!`);
      console.log(`   📦 Retornou ${response.data.length} items`);
      console.log(`   📋 Tipo: ${isArray ? 'Array' : 'Object'}\n`);
    } else {
      console.log(`   ⚠️ API respondeu mas formato inesperado`);
      console.log(`   Tipo: ${typeof response.data}\n`);
    }
  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}\n`);
    results.tests.push({
      name: 'API Interna',
      error: error.message,
      blocked: true
    });
  }

  // TESTE 3: IP Público
  console.log('3️⃣ Verificando IP público deste servidor...');
  try {
    const response = await axios.get('https://api.ipify.org?format=json', {
      timeout: 10000
    });

    results.publicIP = response.data.ip;
    console.log(`   🌐 IP Público: ${response.data.ip}\n`);
  } catch (error) {
    console.log(`   ⚠️ Não conseguiu verificar IP: ${error.message}\n`);
  }

  // RESULTADO FINAL
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║              🏁 RESULTADO FINAL 🏁                 ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const allBlocked = results.tests.every(t => t.blocked);
  const someBlocked = results.tests.some(t => t.blocked);

  if (allBlocked) {
    console.log('❌ TODOS OS TESTES BLOQUEADOS!');
    console.log('💔 Railway também está na blacklist do Magazine Luiza.');
    console.log('🔄 Precisaremos de outra solução (ScraperAPI, VPS, etc)\n');
    results.verdict = 'BLOCKED';
  } else if (someBlocked) {
    console.log('⚠️ ALGUNS TESTES BLOQUEADOS');
    console.log('🤔 Pode funcionar parcialmente, mas não é ideal.\n');
    results.verdict = 'PARTIAL';
  } else {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('🎉 Railway FUNCIONA! Pode migrar seu projeto!');
    console.log('🚀 O IP do Railway não está bloqueado!\n');
    results.verdict = 'SUCCESS';
  }

  console.log(`🌐 IP deste servidor: ${results.publicIP || 'desconhecido'}`);
  console.log(`⏰ Timestamp: ${results.timestamp}\n`);

  return results;
}