'use client';

import { useEffect, useRef } from 'react';

interface GameTerminalProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  isTyping: boolean;
}

export function GameTerminal({ messages, isTyping }: GameTerminalProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="fmab-terminal bg-fmab-darker border border-fmab-border rounded-lg p-4 h-[60vh] overflow-y-auto font-serif text-fmab-parchment">
      <div className="space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`message-entry animate-slide-up ${msg.role === 'user' ? 'text-fmab-goldLight' : ''}`}>
            <span className="font-mono text-fmab-gold mr-2">
              {msg.role === 'user' ? '>>' : '::'}
            </span>
            <span className="whitespace-pre-wrap">{msg.content}</span>
          </div>
        ))}
        {isTyping && (
          <div className="message-entry text-fmab-steel animate-fade-in">
            <span className="font-mono text-fmab-gold mr-2">::</span>
            <span className="animate-blink">_</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}