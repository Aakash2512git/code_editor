import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a senior software engineer reviewing code.
Analyze the provided code and return ONLY valid JSON with this exact structure:
{
  "score": <number 1-10>,
  "summary": "<brief overall assessment>",
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "line": <line number or null>,
      "message": "<what's wrong>",
      "suggestion": "<how to fix it>"
    }
  ]
}
Focus on bugs, logic errors, security issues, performance, and style.
Be concise and actionable.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  const { code, language = 'cpp' } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  if (code.length > 15000) {
    return res.status(400).json({ error: 'Code is too long (max 15KB)' });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Language: ${language}\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    const result = JSON.parse(content);
    res.status(200).json(result);
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to analyze code' });
  }
}
