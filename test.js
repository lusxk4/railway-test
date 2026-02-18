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

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  const urlsParaTestar = [
    {
      name: 'MagazineVocê - Ofertas do Dia',
      url: 'https://www.magazinevoce.com.br/magazinepromoforia/selecao/ofertasdodia/'
    },
    {
      name: 'Magazine Luiza - Ofertas do Dia',
      url: 'https://www.magazineluiza.com.br/selecao/ofertasdodia/'
    },
    {
      name: 'Magazine Luiza - Página Principal',
      url: 'https://www.magazineluiza.com.br/'
    }
  ];

  for (let i = 0; i < urlsParaTestar.length; i++) {
    const { name, url } = urlsParaTestar[i];
    console.log(`${i + 1}️⃣ Testando: ${name}`);

    try {
      const response = await axios.get(url, {
        headers: HEADERS,
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: () => true // não lança erro em 4xx/5xx
      });

      const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const title = body.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() || 'N/A';
      const finalUrl = response.request?.res?.responseUrl || url;

      const hasCaptcha =
        body.toLowerCase().includes('captcha') ||
        body.includes('az-request-verify') ||
        body.includes("I'm not a robot") ||
        title.toLowerCase().includes('captcha');

      const hasProducts =
        body.includes('"product"') ||
        body.includes('data-testid') ||
        body.includes('productList') ||
        body.includes('"price"');

      const test = {
        name,
        url,
        finalUrl,
        status: response.status,
        title,
        blocked: hasCaptcha || response.status === 403,
        hasProducts,
        preview: body.substring(0, 300)
      };

      results.tests.push(test);

      console.log(`   📊 Status HTTP : ${response.status}`);
      console.log(`   📍 URL final   : ${finalUrl}`);
      console.log(`   🏷️  Título      : ${title}`);
      console.log(`   📄 Preview     : ${body.substring(0, 200).replace(/\s+/g, ' ')}`);

      if (hasCaptcha || response.status === 403) {
        console.log('   🔴 RESULTADO   : BLOQUEADO (captcha ou 403)\n');
      } else if (response.status === 404) {
        console.log('   🟡 RESULTADO   : URL não existe (404)\n');
      } else if (hasProducts) {
        console.log('   🟢 RESULTADO   : ACESSO OK - produtos encontrados!\n');
      } else if (response.status === 200) {
        console.log('   🟡 RESULTADO   : Status 200, mas sem produtos detectados. Verifique o preview.\n');
      } else {
        console.log(`   🟡 RESULTADO   : Status ${response.status} - verifique o preview.\n`);
      }

    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}\n`);
      results.tests.push({ name, url, error: error.message, blocked: true });
    }
  }

  // TESTE IP
  console.log('🌐 Verificando IP público deste servidor...');
  try {
    const response = await axios.get('https://api.ipify.org?format=json', { timeout: 10000 });
    results.publicIP = response.data.ip;
    console.log(`   IP Público: ${response.data.ip}\n`);
  } catch (error) {
    console.log(`   ⚠️ Não conseguiu verificar IP: ${error.message}\n`);
  }

  // RESULTADO FINAL
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║              🏁 RESULTADO FINAL 🏁                 ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const allBlocked = results.tests.every(t => t.blocked);
  const someBlocked = results.tests.some(t => t.blocked);
  const anySuccess = results.tests.some(t => !t.blocked && t.status === 200);

  if (allBlocked) {
    console.log('❌ TODOS OS TESTES BLOQUEADOS!');
    console.log('💔 Railway está na blacklist do Magazine Luiza.');
    console.log('🔄 Precisaremos de outra solução (ScraperAPI, VPS residencial, etc)\n');
    results.verdict = 'BLOCKED';
  } else if (anySuccess && !someBlocked) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('🎉 Railway FUNCIONA! Pode migrar seu projeto!\n');
    results.verdict = 'SUCCESS';
  } else {
    console.log('⚠️ RESULTADO PARCIAL - alguns bloqueados, alguns OK.');
    console.log('🔍 Verifique os detalhes acima para decidir.\n');
    results.verdict = 'PARTIAL';
  }

  console.log(`🌐 IP deste servidor: ${results.publicIP || 'desconhecido'}`);
  console.log(`⏰ Timestamp: ${results.timestamp}\n`);

  return results;
}