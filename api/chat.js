// api/chat.js
export default async function handler(req, res) {
  // 只接受 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    // 从环境变量读取 API Key（Vercel 后台配置）
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing API Key on server' });
    }

    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.8,
        max_tokens: 800
      })
    });

    const data = await response.json();

    // 无论成功或失败，都原样返回给前端
    res.status(200).json(data);
  } catch (error) {
    // 捕获任何未预期错误
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}