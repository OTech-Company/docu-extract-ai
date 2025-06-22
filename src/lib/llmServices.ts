import type { DocumentProcessingState, ProcessingStep, OCRModel, ExtractedInvoiceData, InvoiceDetails, ItemDetails, SubtotalDetails, OcrResult, ValidationResult } from '../types/processing';

// LLM API service functions
export interface LLMResponse {
  model: string;
  json: unknown;
  processingTime: number;
  error?: string;
}

const GEMINI_API_KEY = import.meta.env.REACT_APP_Gemini_API_KEY;
const GROQ_API_KEY = import.meta.env.REACT_APP_GROQ_API_KEY;
const QWEN_API_KEY = import.meta.env.REACT_APP_QWEN_API_KEY;

const JSON_EXTRACTION_PROMPT = `Extract invoice data from the following text and return ONLY a valid JSON object with this exact structure. Do NOT include any other text, explanations, or formatting outside of the JSON object. Wrap the JSON object in triple backticks, e.g., \`\`\`json{...}\`\`\`:
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
`;

export async function callGeminiAPI(text: string): Promise<LLMResponse> {
  const startTime = Date.now();
  
  if (!GEMINI_API_KEY) {
    return {
      model: 'Gemini',
      json: null,
      processingTime: Date.now() - startTime,
      error: 'Gemini API key not configured'
    };
  }

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
    let jsonStr = result.candidates[0].content.parts[0].text;
    const jsonMatch = jsonStr.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    } else {
      console.warn('No ```json block found in Gemini response, attempting to find first { and last }.');
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      } else {
        throw new Error('Could not extract JSON from Gemini response.');
      }
    }
    const json = JSON.parse(jsonStr);

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
  
  if (!GROQ_API_KEY) {
    return {
      model: 'Groq',
      json: null,
      processingTime: Date.now() - startTime,
      error: 'Groq API key not configured'
    };
  }

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
    let jsonStr = result.choices[0].message.content;
    const jsonMatch = jsonStr.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    } else {
      console.warn('No ```json block found in Groq response, attempting to find first { and last }.');
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      } else {
        throw new Error('Could not extract JSON from Groq response.');
      }
    }
    const json = JSON.parse(jsonStr);

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
  
  if (!QWEN_API_KEY) {
    return {
      model: 'Qwen',
      json: null,
      processingTime: Date.now() - startTime,
      error: 'Qwen API key not configured'
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://docuextract.ai',
        'X-Title': 'DocuExtract AI'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-30b-a3b:free',
        messages: [{
          role: 'user',
          content: `${JSON_EXTRACTION_PROMPT}\n\nText to extract from:\n${text}`
        }],
        temperature: 0.1
      })
    });

    if (!response.ok) throw new Error(`Qwen API error: ${response.status}`);
    
    const result = await response.json();
    let jsonStr = result.choices[0].message.content;
    const jsonMatch = jsonStr.match(/```json([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonStr = jsonMatch[1].trim();
    } else {
      console.warn('No ```json block found in Qwen response, attempting to find first { and last }.');
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      } else {
        throw new Error('Could not extract JSON from Qwen response.');
      }
    }
    const json = JSON.parse(jsonStr);

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

export async function applyMajorityVoting(responses: LLMResponse[]): Promise<ExtractedInvoiceData> {
  const validResponses = responses.filter(r => r.json && !r.error);
  
  if (validResponses.length === 0) {
    throw new Error('No valid responses to perform majority voting');
  }

  if (validResponses.length === 1) {
    return validResponses[0].json as ExtractedInvoiceData;
  }

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured for majority voting');
  }

  // Use Gemini to perform majority voting
  const votingPrompt = `You are given ${validResponses.length} JSON responses for invoice data extraction. Apply majority voting to determine the most accurate values for each field. Return the final JSON with the most commonly agreed upon values.\n\n${validResponses.map((r, i) => `Response ${i + 1} (${r.model}):\n${JSON.stringify(r.json, null, 2)}`).join('\n\n')}\n\nReturn ONLY the final JSON object with the majority-voted values:`;

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
