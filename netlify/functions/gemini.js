// netlify/functions/gemini.js

exports.handler = async (event, context) => {
  // 1. 클라이언트(HTML)가 보낸 프롬프트를 받습니다.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. (가장 중요) Netlify 환경 변수에서 비밀 API 키를 안전하게 가져옵니다.
  // 이 키는 GitHub가 아닌 Netlify 대시보드에만 저장됩니다.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { statusCode: 500, body: 'API Key not set on server' };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  // 3. Google Gemini API에 요청을 중계합니다.
  try {
    const { prompt, systemPrompt } = JSON.parse(event.body); // html에서 보낸 JSON을 파싱합니다.

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { statusCode: response.status, body: `Google API Error: ${errorText}` };
    }

    const result = await response.json();

    // 4. 결과를 클라이언트(HTML)에게 다시 전달합니다.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };

  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
