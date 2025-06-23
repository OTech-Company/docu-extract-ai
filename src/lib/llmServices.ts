import type { DocumentProcessingState, ProcessingStep, OCRModel, ExtractedInvoiceData, InvoiceDetails, ItemDetails, SubtotalDetails, OcrResult, ValidationResult } from '../types/processing';

// LLM API service functions
export interface LLMResponse {
  model: string;
  json: unknown;
  processingTime: number;
  error?: string;
}

// Use the provided API keys directly
const GEMINI_API_KEY = "AIzaSyC80ERPHBGH4lFeN8C0aKRO-3TxT64GsEw";
const GROQ_API_KEY = "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";
const QWEN_API_KEY = "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";

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
  
  console.log('Calling Gemini API with text length:', text.length);
  
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not configured');
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Gemini API response:', result);
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }
    
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

    console.log('Gemini parsed JSON:', json);
    return {
      model: 'Gemini',
      json,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('Gemini API call failed:', error);
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
  
  console.log('Calling Groq API with text length:', text.length);
  
  if (!GROQ_API_KEY) {
    console.error('Groq API key not configured');
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error response:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Groq API response:', result);
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response structure from Groq API');
    }
    
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

    console.log('Groq parsed JSON:', json);
    return {
      model: 'Groq',
      json,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('Groq API call failed:', error);
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
  
  console.log('Calling Qwen API with text length:', text.length);
  
  if (!QWEN_API_KEY) {
    console.error('Qwen API key not configured');
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
        'HTTP-Referer': 'https://docuextract.ai',
        'X-Title': 'DocuExtract AI',
        'Content-Type': 'application/json'
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error response:', errorText);
      throw new Error(`Qwen API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Qwen API response:', result);
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response structure from Qwen API');
    }
    
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

    console.log('Qwen parsed JSON:', json);
    return {
      model: 'Qwen',
      json,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('Qwen API call failed:', error);
    return {
      model: 'Qwen',
      json: null,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function applyMajorityVoting(responses: LLMResponse[]): Promise<ExtractedInvoiceData> {
  console.log('Applying majority voting to responses:', responses);
  
  // Always expect exactly 3 responses (Gemini, Groq, Qwen)
  if (responses.length !== 3) {
    console.error(`Expected 3 responses, got ${responses.length}`);
    throw new Error(`Expected 3 responses for majority voting, got ${responses.length}`);
  }
  
  const validResponses = responses.filter(r => r.json && !r.error);
  
  if (validResponses.length === 0) {
    console.error('No valid responses for majority voting');
    throw new Error('No valid responses to perform majority voting');
  }

  if (validResponses.length === 1) {
    console.log('Only one valid response, returning it directly');
    return validResponses[0].json as ExtractedInvoiceData;
  }

  if (!QWEN_API_KEY) {
    console.error('OpenRouter API key not configured for majority voting');
    throw new Error('OpenRouter API key not configured for majority voting');
  }

  try {
    // Use Mistral to perform majority voting on all 3 responses
    const votingPrompt = `You are given exactly 3 JSON responses for invoice data extraction from different AI models. Apply majority voting to determine the most accurate values for each field. Return the final JSON with the most commonly agreed upon values.

${responses.map((r, i) => `Response ${i + 1} (${r.model}):\n${JSON.stringify(r.json, null, 2)}`).join('\n\n')}

Return ONLY the final JSON object with the majority-voted values:`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'HTTP-Referer': 'https://docuextract.ai',
        'X-Title': 'DocuExtract AI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.2-24b-instruct:free',
        messages: [{
          role: 'user',
          content: votingPrompt
        }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Majority voting API error:', errorText);
      throw new Error(`Majority voting failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const jsonStr = result.choices[0].message.content;
    const cleanedJsonStr = jsonStr.replace(/```json|```/g, '').trim();
    const finalResult = JSON.parse(cleanedJsonStr);
    
    console.log('Majority voting result:', finalResult);
    return finalResult;
  } catch (error) {
    console.error('Majority voting failed, returning first valid response:', error);
    // Fallback to first valid response if majority voting fails
    return validResponses[0].json as ExtractedInvoiceData;
  }
}
