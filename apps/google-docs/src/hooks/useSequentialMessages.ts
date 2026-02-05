import { useState, useEffect } from 'react';

interface UseSequentialMessagesOptions {
  messages: string[];
  intervalMs?: number;
  isActive: boolean;
}

/**
 * Hook to display messages sequentially with a time interval between them.
 * First message shows immediately, subsequent messages appear after the interval.
 */
export const useSequentialMessages = ({
  messages,
  intervalMs = 20000, // 20 seconds default
  isActive,
}: UseSequentialMessagesOptions): string[] => {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive || messages.length === 0) {
      setVisibleMessages([]);
      return;
    }

    // Show first message immediately
    setVisibleMessages([messages[0]]);

    // Set up timers for subsequent messages
    const timers: NodeJS.Timeout[] = [];
    for (let i = 1; i < messages.length; i++) {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, messages[i]]);
      }, intervalMs * i);
      timers.push(timer);
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [messages, intervalMs, isActive]);

  return visibleMessages;
};
