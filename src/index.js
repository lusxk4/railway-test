export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url') || 'https://www.magazineluiza.com.br/';

    try {
      const response = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        }
      });

      const body = await response.text();
      const title = body.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() || 'N/A';
      const hasCaptcha = body.toLowerCase().includes('captcha') || body.includes('az-request-verify');

      return Response.json({
        status: response.status,
        finalUrl: response.url,
        title,
        hasCaptcha,
        verdict: hasCaptcha ? '🔴 BLOQUEADO' : '🟢 LIBERADO',
        preview: body.substring(0, 300)
      });

    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }
};