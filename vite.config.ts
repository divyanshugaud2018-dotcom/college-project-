import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import 'dotenv/config';

const registrationOtps = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const resolveGeminiSettings = (env: Record<string, string>) => {
  const apiKey = (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
  const model = (env.GEMINI_MODEL || env.VITE_GEMINI_MODEL || 'gemini-3.5-flash').trim();
  return { apiKey, model };
};

const readRequestBody = async (request: any) => {
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body) && !(request.body instanceof Uint8Array)) {
    return request.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    if (Buffer.isBuffer(chunk) || chunk instanceof Uint8Array) {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    if (chunk !== undefined && chunk !== null) {
      chunks.push(Buffer.from(String(chunk)));
    }
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      } catch {
        return {};
      }
    }

    return {};
  }
};

const aiChatApi = (env: Record<string, string>) => ({
  name: 'doubtnest-ai-api',
  configureServer(server: { middlewares: { use: (handler: (request: any, response: any, next: () => void) => void) => void } }) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url !== '/api/ai/chat' || request.method !== 'POST') {
        next();
        return;
      }

      response.setHeader('Content-Type', 'application/json');

      try {
        const { apiKey, model } = resolveGeminiSettings(env);
        if (!apiKey) {
          response.statusCode = 503;
          response.end(JSON.stringify({ error: 'Gemini is not configured. Add GEMINI_API_KEY or VITE_GEMINI_API_KEY to your .env file.' }));
          return;
        }

        const payload = await readRequestBody(request);
        const question = String(payload.question || '').trim();
        const context = String(payload.context || '').trim();
        if (!question) {
          response.statusCode = 400;
          response.end(JSON.stringify({ error: 'A question is required.' }));
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const contents = [{
          role: 'user' as const,
          parts: [{
            text: `You are Nest AI, a concise and encouraging college study companion for DoubtNest. Answer the student's question directly. Use the feed context when relevant, but never invent feed entries or claim to have performed actions. If the question is unrelated to studying, answer briefly and redirect toward academic help.\n\nFeed context:\n${context || 'No feed context is available.'}\n\nStudent question:\n${question}`,
          }],
        }];

        const candidateModels = Array.from(new Set([
          model,
          'gemini-3.5-flash',
          'gemini-3.8-flash',
        ]));

        let result;
        for (let attempt = 0; attempt < candidateModels.length; attempt += 1) {
          const currentModel = candidateModels[attempt];
          try {
            result = await ai.models.generateContent({ model: currentModel, contents });
            break;
          } catch (error) {
            const message = error instanceof Error ? error.message : '';
            const isRetryable = /503|UNAVAILABLE|NOT_FOUND|rate limit|temporar/i.test(message);
            if (attempt === candidateModels.length - 1 || !isRetryable) throw error;
            await new Promise((resolve) => setTimeout(resolve, 750));
          }
        }

        response.statusCode = 200;
        response.end(JSON.stringify({ reply: result?.text || 'I could not generate a response. Please try again.' }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Gemini error';
        console.error('Gemini request failed:', message);
        response.statusCode = 502;
        response.end(JSON.stringify({ error: `Gemini could not answer right now: ${message}` }));
      }
    });
  },
});

const authApi = (env: Record<string, string>) => ({
  name: 'doubtnest-auth-api',
  configureServer(server: { middlewares: { use: (handler: (request: any, response: any, next: () => void) => void) => void } }) {
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith('/api/auth/') || request.method !== 'POST') {
        next();
        return;
      }

      response.setHeader('Content-Type', 'application/json');

      try {
        const payload = await readRequestBody(request);
        const email = String(payload.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.ac\.in$/.test(email)) {
          response.statusCode = 400;
          response.end(JSON.stringify({ error: 'Use a valid college .ac.in email address.' }));
          return;
        }

        if (request.url === '/api/auth/send-otp') {
          const existing = registrationOtps.get(email);
          if (existing && existing.expiresAt > Date.now() + 60 * 1000) {
            response.statusCode = 429;
            response.end(JSON.stringify({ error: 'A code was sent recently. Please wait before requesting another.' }));
            return;
          }

          const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER } = env;
          if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN || !GMAIL_SENDER) {
            response.statusCode = 503;
            response.end(JSON.stringify({
              error: 'Gmail email verification is not configured. Add the Gmail OAuth credentials and GMAIL_SENDER to the server environment.',
            }));
            return;
          }

          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: GMAIL_CLIENT_ID,
              client_secret: GMAIL_CLIENT_SECRET,
              refresh_token: GMAIL_REFRESH_TOKEN,
              grant_type: 'refresh_token',
            }),
          });
          const tokenResult = await tokenResponse.json().catch(() => ({}));
          if (!tokenResponse.ok || !tokenResult.access_token) {
            response.statusCode = 502;
            response.end(JSON.stringify({
              error: 'Google OAuth could not authorize Gmail. Check the OAuth client credentials and refresh token.',
            }));
            return;
          }

          const message = [
            `From: ${GMAIL_SENDER}`,
            `To: ${email}`,
            'Subject: Your DoubtNest verification code',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset="UTF-8"',
            '',
            `Your DoubtNest verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
          ].join('\r\n');
          const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenResult.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: Buffer.from(message).toString('base64url') }),
          });
          if (!gmailResponse.ok) {
            const gmailError = await gmailResponse.json().catch(() => ({}));
            const googleErrorMessage = String(gmailError?.error?.message || '');
            console.error(`Gmail API request failed (${gmailResponse.status}):`, googleErrorMessage || 'Unknown Google API error');

            const error = /not been used in project|has not been used|is disabled|accessNotConfigured/i.test(googleErrorMessage)
              ? 'Gmail API is disabled for this Google Cloud project. Enable Gmail API in Google Cloud Console, then retry.'
              : /insufficient.*scope|insufficient.*permission|insufficientPermissions|insufficientAuthenticationScopes/i.test(googleErrorMessage)
                ? 'The Gmail OAuth grant is missing gmail.send permission. Re-authorize the account with the Gmail send scope.'
                : 'Gmail API rejected the message. Check the server logs for Google\'s error details.';

            response.statusCode = 502;
            response.end(JSON.stringify({ error }));
            return;
          }

          registrationOtps.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
          response.statusCode = 200;
          response.end(JSON.stringify({ message: `A verification code was sent to ${email}.` }));
          return;
        }

        if (request.url === '/api/auth/verify-otp') {
          const record = registrationOtps.get(email);
          const submittedCode = String(payload.code || '').trim();
          if (!record || record.expiresAt < Date.now()) {
            registrationOtps.delete(email);
            response.statusCode = 400;
            response.end(JSON.stringify({ error: 'This verification code has expired. Request a new one.' }));
            return;
          }
          record.attempts += 1;
          if (record.attempts > 5) {
            registrationOtps.delete(email);
            response.statusCode = 429;
            response.end(JSON.stringify({ error: 'Too many incorrect attempts. Request a new code.' }));
            return;
          }
          if (record.code !== submittedCode) {
            response.statusCode = 400;
            response.end(JSON.stringify({ error: 'Incorrect verification code.' }));
            return;
          }
          registrationOtps.delete(email);
          response.statusCode = 200;
          response.end(JSON.stringify({ message: 'Email verified.' }));
          return;
        }

        response.statusCode = 404;
        response.end(JSON.stringify({ error: 'Authentication endpoint not found.' }));
      } catch {
        response.statusCode = 500;
        response.end(JSON.stringify({ error: 'Unable to process the email verification request.' }));
      }
    });
  },
});

export default defineConfig(({mode}) => {
  const rootEnv = loadEnv(mode, process.cwd(), '');
  const srcEnv = loadEnv(mode, path.resolve(process.cwd(), 'src'), '');
  const env = { ...process.env, ...rootEnv, ...srcEnv };

  return {
    plugins: [react(), tailwindcss(), authApi(env), aiChatApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
