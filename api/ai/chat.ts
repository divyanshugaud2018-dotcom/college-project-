import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'node:http';

type ApiRequest = IncomingMessage & { body?: unknown };
type ApiResponse = ServerResponse<IncomingMessage> & {
  status: (code: number) => ApiResponse;
};

const readRequestBody = async (request: ApiRequest): Promise<Record<string, unknown>> => {
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    return request.body as Record<string, unknown>;
  }

  let rawBody = typeof request.body === 'string' ? request.body : '';
  if (!rawBody) {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    rawBody = Buffer.concat(chunks).toString('utf8');
  }

  const body: unknown = JSON.parse(rawBody);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
};

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Content-Type', 'application/json');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).end(JSON.stringify({ error: 'Method not allowed.' }));
  }

  let payload: Record<string, unknown>;
  try {
    payload = await readRequestBody(request);
  } catch {
    return response.status(400).end(JSON.stringify({ error: 'Request body must be valid JSON.' }));
  }

  const question = String(payload.question || '').trim();
  const context = String(payload.context || '').trim();
  if (!question) {
    return response.status(400).end(JSON.stringify({ error: 'A question is required.' }));
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return response.status(503).end(JSON.stringify({
      error: 'Gemini is not configured. Add GEMINI_API_KEY to the Vercel environment.',
    }));
  }

  const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();
  const ai = new GoogleGenAI({ apiKey });
  const contents = [{
    role: 'user' as const,
    parts: [{
      text: `You are Nest AI, a concise and encouraging college study companion for DoubtNest. Answer the student's question directly. Use the feed context when relevant, but never invent feed entries or claim to have performed actions. If the question is unrelated to studying, answer briefly and redirect toward academic help.\n\nFeed context:\n${context || 'No feed context is available.'}\n\nStudent question:\n${question}`,
    }],
  }];
  const candidateModels = Array.from(new Set([model, 'gemini-3.5-flash', 'gemini-3.8-flash']));

  try {
    let result;
    for (let attempt = 0; attempt < candidateModels.length; attempt += 1) {
      try {
        result = await ai.models.generateContent({ model: candidateModels[attempt], contents });
        break;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const isRetryable = /503|UNAVAILABLE|NOT_FOUND|rate limit|temporar/i.test(message);
        if (attempt === candidateModels.length - 1 || !isRetryable) throw error;
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
    }

    return response.status(200).end(JSON.stringify({
      reply: result?.text || 'I could not generate a response. Please try again.',
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gemini error';
    console.error('Gemini request failed:', message);
    return response.status(502).end(JSON.stringify({
      error: `Gemini could not answer right now: ${message}`,
    }));
  }
}
