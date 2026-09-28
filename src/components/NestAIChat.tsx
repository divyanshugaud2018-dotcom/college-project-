import React, { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { Answer, Doubt, User } from '../types';

interface NestAIChatProps {
  doubts: Doubt[];
  answers: Answer[];
  currentUser: User | null;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

const starterPrompts = [
  'What should I study today?',
  'Find unanswered doubts',
  'Help me understand a programming topic',
];

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getWelcomeMessage = (user: User | null): ChatMessage => ({
  id: 'welcome',
  role: 'assistant',
  content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I’m Nest AI, your personal study companion. Ask me about the DoubtNest feed or tell me what you’re learning.`,
});

export const NestAIChat: React.FC<NestAIChatProps> = ({ doubts, answers, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage(currentUser)]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createReply = (question: string) => {
    const normalizedQuestion = question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const unansweredDoubts = doubts.filter((doubt) => !answers.some((answer) => answer.doubtId === doubt.id));
    const matchedDoubt = doubts.find((doubt) =>
      `${doubt.title} ${doubt.subject} ${doubt.tags.join(' ')}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').some((word) =>
        word.length > 3 && normalizedQuestion.includes(word),
      ),
    );

    if (normalizedQuestion.includes('unanswered') || normalizedQuestion.includes('no answer')) {
      if (!unansweredDoubts.length) return 'Great news: every doubt in the current feed has at least one answer.';
      const preview = unansweredDoubts.slice(0, 3).map((doubt) => `“${doubt.title}”`).join(', ');
      return `I found ${unansweredDoubts.length} unanswered ${unansweredDoubts.length === 1 ? 'doubt' : 'doubts'}: ${preview}. Open one from the feed to help a classmate.`;
    }

    if (matchedDoubt) {
      const answerCount = answers.filter((answer) => answer.doubtId === matchedDoubt.id).length;
      return `I found “${matchedDoubt.title}” in the feed. It has ${answerCount} ${answerCount === 1 ? 'answer' : 'answers'} and is tagged ${matchedDoubt.tags.slice(0, 3).join(', ')}. Open it to read the discussion.`;
    }

    if (normalizedQuestion.includes('study') || normalizedQuestion.includes('today') || normalizedQuestion.includes('learn')) {
      const recommendation = doubts.slice().sort((first, second) => second.votes - first.votes)[0];
      return recommendation
        ? `Start with “${recommendation.title}” in ${recommendation.subject}. It is one of the most upvoted discussions, so you’ll get a strong foundation and useful peer context.`
        : 'Start by choosing one topic you find difficult, write down what you already know, and ask a focused doubt in the feed.';
    }

    if (normalizedQuestion.includes('program') || normalizedQuestion.includes('code')) {
      return 'For programming questions, share the smallest reproducible example, the output you expected, and the error you received. That makes it much easier for seniors and faculty to guide you.';
    }

    return 'I can help you find discussions, choose a study topic, or improve a question before you post it. Try asking “Find unanswered doubts” or “What should I study today?”';
  };

  const getFeedContext = () => doubts.map((doubt) => {
    const answerCount = answers.filter((answer) => answer.doubtId === doubt.id).length;
    return `- ${doubt.title} | subject: ${doubt.subject} | tags: ${doubt.tags.join(', ')} | answers: ${answerCount}`;
  }).join('\n');

  const sendMessage = async (message = input) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    setMessages((currentMessages) => [...currentMessages, { id: makeId(), role: 'user', content: trimmedMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedMessage, context: getFeedContext() }),
      });
      if (!response.ok) throw new Error('AI service unavailable');
      const data = await response.json() as { reply?: string };
      setMessages((currentMessages) => [...currentMessages, { id: makeId(), role: 'assistant', content: data.reply || createReply(trimmedMessage) }]);
    } catch {
      setMessages((currentMessages) => [...currentMessages, { id: makeId(), role: 'assistant', content: createReply(trimmedMessage) }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([{ id: 'welcome-reset', role: 'assistant', content: 'Fresh start. What are you working on today?' }]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section className="mb-3 flex h-[min(580px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900" aria-label="Nest AI chat">
          <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-cyan-700 p-5 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-black">Nest AI</p>
                  <p className="text-[11px] text-teal-100">Your personal study companion</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={resetChat} className="rounded-lg p-2 text-teal-100 hover:bg-white/10" aria-label="Reset chat" title="Reset chat">
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-teal-100 hover:bg-white/10" aria-label="Close Nest AI" title="Close Nest AI">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-teal-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Ready to help with your campus learning
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950/60" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${message.role === 'user' ? 'rounded-br-md bg-teal-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {starterPrompts.map((prompt) => (
                <button type="button" key={prompt} onClick={() => void sendMessage(prompt)} disabled={isLoading} className="whitespace-nowrap rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300">
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={isLoading ? 'Nest AI is thinking...' : 'Ask Nest AI...'} disabled={isLoading} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-wait disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-white" aria-label="Message Nest AI" />
              <button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={!input.trim() || isLoading} aria-label="Send message">
                {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </section>
      )}

      <button onClick={() => setIsOpen((open) => !open)} className="ml-auto flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl shadow-teal-900/20 transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-900" aria-expanded={isOpen} aria-label={isOpen ? 'Minimize Nest AI' : 'Open Nest AI'}>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <Bot className="h-5 w-5 text-cyan-300 dark:text-teal-600" />}
        <span>{isOpen ? 'Minimize' : 'Ask Nest AI'}</span>
      </button>
    </div>
  );
};