import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { MessageSquare, Send, Sparkles, User, Bot, RotateCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Why might engagement be declining?',
  'What content should I post next?',
  'Generate 5 reel ideas for this client',
  'How can I improve reach?',
  'Analyze posting frequency performance',
  'What worked best last month?',
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-violet-500' : 'bg-gradient-to-br from-violet-500/30 to-cyan-500/30'
      }`}>
        {isUser ? <User size={13} className="text-white" /> : <Bot size={13} className="text-violet-400" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-500 text-white rounded-tr-sm'
            : 'bg-card border border-border rounded-tl-sm'
        }`}>
          {message.content.split('\n').map((line, i) => {
            if (line.startsWith('• ') || line.startsWith('- ')) {
              return (
                <div key={i} className="flex items-start gap-2 mt-1">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isUser ? 'bg-white/60' : 'bg-violet-400'}`} />
                  <span>{line.slice(2)}</span>
                </div>
              );
            }
            if (line.match(/^\d+\./)) {
              return <p key={i} className="mt-1">{line}</p>;
            }
            if (line === '') return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>
        <p className={`text-[10px] mt-1 text-muted-foreground ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

export default function AIAssistant() {
  const { clients, selectedClientId } = useAppStore();
  const [clientId, setClientId] = useState(selectedClientId || '');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI social media strategist. I have access to your client data, analytics, and content history. Ask me anything — from why engagement dropped to what to post next.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: any[] }) =>
      aiApi.chat({ message, clientId: clientId || undefined, history }),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply, timestamp: new Date() },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your OpenAI API key in Settings.',
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || chatMutation.isPending) return;

    const userMessage: Message = { role: 'user', content: messageText, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    const history = updatedMessages.slice(1).map((m) => ({ role: m.role, content: m.content }));
    chatMutation.mutate({ message: messageText, history });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
    }]);
  };

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center">
            <Bot size={18} className="text-violet-400" />
          </div>
          <div>
            <h2 className="font-bold text-sm">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              {selectedClient ? `Context: ${selectedClient.name}` : 'No client context — select one below'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input-base text-xs py-1.5 max-w-[180px]"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">No client context</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            onClick={clearChat}
            title="Clear chat"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {chatMutation.isPending && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center">
              <Bot size={13} className="text-violet-400" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-6 pb-3 flex gap-2 overflow-x-auto shrink-0">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border hover:border-violet-500/50 hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-all whitespace-nowrap"
            onClick={() => handleSend(prompt)}
            disabled={chatMutation.isPending}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex items-end gap-3 bg-card border border-border rounded-2xl p-3 focus-within:border-violet-500/50 transition-colors">
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent text-sm resize-none outline-none max-h-32 min-h-[40px]"
            placeholder="Ask about your client's performance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !chatMutation.isPending
                ? 'bg-violet-500 text-white hover:bg-violet-400'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={() => handleSend()}
            disabled={!input.trim() || chatMutation.isPending}
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
