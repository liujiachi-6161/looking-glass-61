// api/chat.js
import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    // 从环境变量读取 API Key（全在后台）
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing API Key on server' });
    }

    const data = JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.8,
      max_tokens: 800
    });

    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${apiKey}`
      }
    };

    // 使用 Node.js 原生 HTTPS，彻底解决报错
    const req2 = https.request(options, (res2) => {
      let body = '';
      res2.on('data', (chunk) => { body += chunk; });
      res2.on('end', () => {
        res.status(200).json(JSON.parse(body));
      });
    });

    req2.on('error', (e) => {
      res.status(500).json({ error: 'Server error: ' + e.message });
    });

    req2.write(data);
    req2.end();
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
