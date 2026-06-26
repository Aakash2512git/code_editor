const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
const CPP_LANGUAGE_ID = 54; // C++ (GCC 9.2.0)

function formatJudge0Output(data) {
  const parts = [];

  if (data.compile_output?.trim()) {
    parts.push(data.compile_output.trim());
  }
  if (data.stderr?.trim()) {
    parts.push(data.stderr.trim());
  }
  if (data.stdout?.trim()) {
    parts.push(data.stdout.trim());
  }

  if (parts.length > 0) return parts.join('\n');

  return data.status?.description || 'No output';
}

async function compileWithJudge0(code, baseUrl, headers = {}) {
  const response = await fetch(
    `${baseUrl}/submissions?base64_encoded=false&wait=true`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: CPP_LANGUAGE_ID,
        stdin: '',
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Compiler returned ${response.status}`);
  }

  return response.json();
}

export async function runCompile(code) {
  // Try RapidAPI Judge0 CE if key is configured and subscribed
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (rapidApiKey) {
    try {
      const data = await compileWithJudge0(code, 'https://judge0-ce.p.rapidapi.com', {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      });
      return formatJudge0Output(data);
    } catch {
      // Fall through to public Judge0 CE
    }
  }

  const data = await compileWithJudge0(code, JUDGE0_URL);
  return formatJudge0Output(data);
}
