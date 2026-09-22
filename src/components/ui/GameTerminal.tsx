'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

interface GameTerminalProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  isTyping: boolean;
}

export function GameTerminal({ messages, isTyping }: GameTerminalProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [displayedLength, setDisplayedLength] = useState(0);

  const lastMessage = messages[messages.length - 1];
  const isLastAssistant = lastMessage?.role === 'assistant';
  const contentLength = lastMessage?.content?.length || 0;

  // Typewriter effect for last assistant message
  useEffect(() => {
    if (!isLastAssistant || isTyping) {
      setDisplayedLength(0);
      return;
    }

    if (displayedLength >= contentLength) return;

    const timer = setInterval(() => {
      setDisplayedLength(prev => {
        const next = prev + 3;
        return next >= contentLength ? contentLength : next;
      });
    }, 15);

    return () => clearInterval(timer);
  }, [isLastAssistant, contentLength, isTyping, displayedLength]);

  // Track scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, displayedLength]);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="fmab-terminal bg-fmab-darker border border-fmab-border rounded-lg p-4 h-[60vh] overflow-y-auto font-serif text-fmab-parchment"
      >
        <div className="space-y-4">
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1 && isLastAssistant && !isTyping;
            const visibleContent = isLast
              ? msg.content.slice(0, displayedLength)
              : msg.content;

            return (
              <div key={i} className={`message-entry animate-slide-up ${msg.role === 'user' ? 'text-fmab-goldLight' : ''}`}>
                <span className="font-mono text-fmab-gold mr-2">
                  {msg.role === 'user' ? '>>' : '::'}
                </span>
                <span className="whitespace-pre-wrap">{visibleContent}</span>
                {isLast && displayedLength < contentLength && (
                  <span className="inline-block w-2 h-4 bg-fmab-gold ml-1 animate-blink align-middle" />
                )}
              </div>
            );
          })}
          {isTyping && (
            <div className="message-entry text-fmab-steel animate-fade-in">
              <span className="font-mono text-fmab-gold mr-2">::</span>
              <span className="flex items-center gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Floating scroll-to-bottom button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-fmab-dark border border-fmab-gold/30 text-fmab-gold rounded-full w-8 h-8 flex items-center justify-center hover:bg-fmab-darker hover:border-fmab-gold/60 transition-all shadow-lg"
          aria-label="Ir al fondo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
