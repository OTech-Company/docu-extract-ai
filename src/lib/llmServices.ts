
// LLM API service functions
export interface LLMResponse {
  model: string;
  json: any;
  processingTime: number;
  error?: string;
}

const GEMINI_API_KEY = 'AIzaSyC80ERPHBGH4lFeN8C0aKRO-3TxT64GsEw';
const GROQ_API_KEY = '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';
const QWEN_API_KEY = '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';

const JSON_EXTRACTION_PROMPT = `Extract invoice data from the following text and return ONLY a valid JSON object with this exact structure:
{
  "invoice": {
    "client_name": "<string>",
    "client_address": "<string>",
    "seller_name": "<string>",
    "seller_address": "<string>",
    "invoice_number": "<string>",
    "invoice_date": "<string>",
    "due_date": "<string>"
  },
  "items": [
    {
      "description": "<string>",
      "quantity": "<string>",
      "total_price": "<string>"
    }
  ],
  "subtotal": {
    "tax": "<string>",
    "discount": "<string>",
    "total": "<string>"
  },
  "payment_instructions": {
    "due_date": "<string>",
    "bank_name": "<string>",
    "account_number": "<string>",
    "payment_method": "<string>"
  }
}

Return ONLY the JSON object, no additional text or formatting.`;

export async function callGeminiAPI(text: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${JSON_EXTRACTION_PROMPT}\n\nText to extract from:\n${text}` }]
          }]
        })
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    
    const result = await response.json();
    const jsonStr = result.candidates[0].content.parts[0].text;
    const cleanedJsonStr = jsonStr.replace(/```json|```/g, '').trim();
    const json = JSON.parse(cleanedJsonStr);

    return {
      model: 'Gemini',
      json,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      model: 'Gemini',
      json: null,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function callGroqAPI(text: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [{
          role: 'user',
          content: `${JSON_EXTRACTION_PROMPT}\n\nText to extract from:\n${text}`
        }],
        temperature: 0.1
      })
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    
    const result = await response.json();
    const jsonStr = result.choices[0].message.content;
    const cleanedJsonStr = jsonStr.replace(/```json|```/g, '').trim();
    const json = JSON.parse(cleanedJsonStr);

    return {
      model: 'Groq',
      json,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      model: 'Groq',
      json: null,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function callQwenAPI(text: string): Promise<LLMResponse> {
  const startTime = Date.now();
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-site.com',
        'X-Title': 'Invoice Extraction'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [{
          role: 'user',
          content: `${JSON_EXTRACTION_PROMPT}\n\nText to extract from:\n${text}`
        }],
        temperature: 0.1
      })
    });

    if (!response.ok) throw new Error(`Qwen API error: ${response.status}`);
    
    const result = await response.json();
    const jsonStr = result.choices[0].message.content;
    const cleanedJsonStr = jsonStr.replace(/```json|```/g, '').trim();
    const json = JSON.parse(cleanedJsonStr);

    return {
      model: 'Qwen',
      json,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      model: 'Qwen',
      json: null,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function applyMajorityVoting(responses: LLMResponse[]): Promise<any> {
  const validResponses = responses.filter(r => r.json && !r.error);
  
  if (validResponses.length === 0) {
    throw new Error('No valid responses to perform majority voting');
  }

  if (validResponses.length === 1) {
    return validResponses[0].json;
  }

  // Use Gemini to perform majority voting
  const votingPrompt = `You are given ${validResponses.length} JSON responses for invoice data extraction. Apply majority voting to determine the most accurate values for each field. Return the final JSON with the most commonly agreed upon values.

${validResponses.map((r, i) => `Response ${i + 1} (${r.model}):\n${JSON.stringify(r.json, null, 2)}`).join('\n\n')}

Return ONLY the final JSON object with the majority-voted values:`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: votingPrompt }]
        }]
      })
    }
  );

  if (!response.ok) throw new Error(`Majority voting failed: ${response.status}`);
  
  const result = await response.json();
  const jsonStr = result.candidates[0].content.parts[0].text;
  const cleanedJsonStr = jsonStr.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanedJsonStr);
}
