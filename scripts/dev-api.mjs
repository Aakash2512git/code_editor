import express from 'express';
import cors from 'cors';
import axios from 'axios';
import Groq from 'groq-sdk';
import { config } from 'dotenv';
import { runCompile } from '../api/_compile.js';

config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const REVIEW_SYSTEM = `You are a senior software engineer reviewing code.
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

app.post('/api/review', async (req, res) => {
  if (!groq) return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { code, language = 'cpp' } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: REVIEW_SYSTEM },
        { role: 'user', content: `Language: ${language}\n\nCode:\n\`\`\`\n${code}\n\`\`\`` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content;
    res.json(JSON.parse(content || '{}'));
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to analyze code' });
  }
});

app.post('/api/chat', async (req, res) => {
  if (!groq) return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });

  const { code, language = 'cpp', message, history = [] } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a helpful coding assistant. The user is working on ${language} code. Be concise and practical.`,
        },
        { role: 'user', content: `Here is their current code:\n\`\`\`\n${code || ''}\n\`\`\`` },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    res.json({ reply: completion.choices[0]?.message?.content || 'No response' });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

app.post('/api/compile', async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const output = await runCompile(code);
    res.send(output);
  } catch (err) {
    console.error('Compile error:', err.message);
    res.status(500).json({ error: err.message || 'Compilation request failed' });
  }
});

const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => console.log(`Dev API server on http://localhost:${PORT}`));
