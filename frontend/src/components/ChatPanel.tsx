import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageCircle, Loader2, Volume2, Bot, User } from 'lucide-react';
import { chatAboutScene } from '../services/api';
import { useTTS } from '../hooks/useTTS';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioBase64?: string | null;
  timestampMs: number;
  processingMs?: number;
}

interface ChatPanelProps {
  /** The latest captured frames as data-URLs (jpeg). Pass empty array when no frame yet. */
  currentFramesDataUrls: string[];
  /** Whether audio playback is globally enabled */
  audioEnabled: boolean;
  /** Forwarded from voice control — raw transcript while speaking */
  voiceTranscript?: string;
  /** Parent calls this with a setter to receive the sendQuestion function */
  onVoiceQuestion?: (fn: (text: string) => void) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  currentFramesDataUrls,
  audioEnabled,
  voiceTranscript = '',
  onVoiceQuestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speak } = useTTS();

  const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'An unknown error occurred';
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuestion = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q || isLoading) return;

    if (!currentFramesDataUrls || currentFramesDataUrls.length === 0) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Please capture or start live mode first so I have a scene to look at!',
        timestampMs: Date.now(),
      }]);
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: q,
      timestampMs: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await chatAboutScene(q, currentFramesDataUrls);
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: data.answer,
        audioBase64: data.audio_base64,
        processingMs: data.processing_time_ms,
        timestampMs: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (audioEnabled) {
        speak({ text: data.answer, audioBase64: data.audio_base64 });
      }
    } catch (err: unknown) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `Sorry, something went wrong: ${getErrorMessage(err)}`,
        timestampMs: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentFramesDataUrls, isLoading, audioEnabled, speak]);

  // Expose sendQuestion to parent via callback on every render (stable ref)
  const onVoiceQuestionRef = useRef(onVoiceQuestion);
  onVoiceQuestionRef.current = onVoiceQuestion;
  useEffect(() => {
    onVoiceQuestionRef.current?.(sendQuestion);
  }, [sendQuestion]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(input); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="card-glass flex flex-col overflow-hidden fade-in" style={{ minHeight: '320px', maxHeight: '480px' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Ask about the Scene</h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {currentFramesDataUrls.length > 0 ? `Scene loaded (${currentFramesDataUrls.length} frames) — ask me anything` : 'Capture a frame first'}
          </p>
        </div>
        {isLoading && (
          <Loader2 className="w-4 h-4 ml-auto animate-spin" style={{ color: 'var(--color-accent-blue)' }} />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" role="log" aria-live="polite" aria-relevant="additions">
        {isEmpty && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-3 opacity-50">
            <Bot className="w-10 h-10" style={{ color: 'var(--color-accent-blue)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Capture a scene, then ask questions like<br />
              <em>"Is there anyone nearby?"</em> or <em>"What colour is the door?"</em>
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id}
            className={`flex gap-2.5 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mb-0.5"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className="max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
              style={msg.role === 'user' ? {
                background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                color: '#fff',
                borderBottomRightRadius: '4px',
              } : {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                borderBottomLeftRadius: '4px',
              }}
            >
              <p>{msg.text}</p>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speak({ text: msg.text, audioBase64: msg.audioBase64 })}
                  className="mt-1.5 flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-accent-cyan)' }}
                  title="Replay answer"
                  aria-label="Replay chat answer"
                >
                  <Volume2 className="w-3 h-3" /> replay
                </button>
              )}
              {msg.processingMs !== undefined && (
                <span className="block text-xs mt-1 opacity-40">{msg.processingMs}ms</span>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mb-0.5"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--color-border)' }}>
                <User className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
              </div>
            )}
          </div>
        ))}
        {/* Voice preview while speaking */}
        {voiceTranscript && (
          <div className="flex gap-2.5 justify-end items-end opacity-60">
            <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm italic"
              style={{ background: 'rgba(59,130,246,0.3)', color: '#fff', border: '1px dashed rgba(59,130,246,0.5)' }}>
              {voiceTranscript}…
            </div>
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--color-border)' }}>
              <User className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex gap-2.5 items-end">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)' }}>
              {[0, 150, 300].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--color-accent-blue)', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
        <input
          ref={inputRef}
          id="chat-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={currentFramesDataUrls.length > 0 ? 'Ask something about the scene…' : 'Capture a frame first…'}
          disabled={currentFramesDataUrls.length === 0 || isLoading}
          className="flex-1 bg-transparent text-sm outline-none px-3 py-2 rounded-xl border transition-all"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            background: 'rgba(255,255,255,0.04)',
          }}
          aria-label="Type your question about the scene"
        />
        <button
          id="btn-chat-send"
          onClick={() => sendQuestion(input)}
          disabled={!input.trim() || currentFramesDataUrls.length === 0 || isLoading}
          aria-label="Send question"
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
