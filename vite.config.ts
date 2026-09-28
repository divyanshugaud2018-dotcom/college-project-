import tailwindcss from '@tailwindcss/vite';
import { GoogleGenAI } from '@google/genai';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';
import path from 'path';
import {defineConfig} from 'vite';
import 'dotenv/config';

const registrationOtps = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const readRequestBody = async (request: AsyncIterable<Buffer | string>) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  return JSON.parse(body);
};

const aiChatApi = () => ({
  name: 'doubtnest-ai-api',
  configureServer(server: { middlewares: { use: (handler: (request: any, response: any, next: () => void) => void) => void } }) {
    server.middlewares.use(async (request, response, next) => {
      if (request.url !== '/api/ai/chat' || request.method !== 'POST') {
        next();
        return;
      }

      response.setHeader('Content-Type', 'application/json');

      try {
        if (!process.env.GEMINI_API_KEY) {
          response.statusCode = 503;
          response.end(JSON.stringify({ error: 'Gemini is not configured.' }));
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

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const contents = [{
          role: 'user' as const,
          parts: [{
            text: `You are Nest AI, a concise and encouraging college study companion for DoubtNest. Answer the student's question directly. Use the feed context when relevant, but never invent feed entries or claim to have performed actions. If the question is unrelated to studying, answer briefly and redirect toward academic help.\n\nFeed context:\n${context || 'No feed context is available.'}\n\nStudent question:\n${question}`,
          }],
        }];
        let result;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            result = await ai.models.generateContent({ model: 'gemini-3.8-flash', contents });
            break;
          } catch (error) {
            const message = error instanceof Error ? error.message : '';
            if (attempt === 1 || !message.includes('503')) throw error;
            await new Promise((resolve) => setTimeout(resolve, 750));
          }
        }

        response.statusCode = 200;
        response.end(JSON.stringify({ reply: result?.text || 'I could not generate a response. Please try again.' }));
      } catch (error) {
        console.error('Gemini request failed:', error instanceof Error ? error.message : 'Unknown Gemini error');
        response.statusCode = 502;
        response.end(JSON.stringify({ error: 'Gemini could not answer right now.' }));
      }
    });
  },
});

const authApi = () => ({
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

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
          response.statusCode = 503;
          response.end(JSON.stringify({ error: 'Email verification is not configured. Add the SMTP settings to the server environment.' }));
          return;
        }

        if (request.url === '/api/auth/send-otp') {
          const existing = registrationOtps.get(email);
          if (existing && existing.expiresAt > Date.now() + 60 * 1000) {
            response.statusCode = 429;
            response.end(JSON.stringify({ error: 'A code was sent recently. Please wait before requesting another.' }));
            return;
          }

          const code = Math.floor(100000 + Math.random() * 900000).toString();
          registrationOtps.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          });
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Your DoubtNest verification code',
            text: `Your DoubtNest verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
          });
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

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), authApi(), aiChatApi()],
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
