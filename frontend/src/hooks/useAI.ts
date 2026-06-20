import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Terminal as XTerm } from 'xterm';

const PURPLE = '\x1b[38;2;167;139;250m';
const RESET = '\x1b[0m';

export const useAI = () => {
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const initAI = (term: XTerm) => {
    // Initialize Socket.io connection to Node Gateway
    socketRef.current = io('https://netbreach-api-gateway-866084699533.us-central1.run.app');

    socketRef.current.on('connect', () => {
      console.log('Connected to AI engine stream.');
    });

    socketRef.current.on('ai_alert', (data: { type: string, message: string }) => {
      // Print AI interjection directly to the terminal
      term.writeln('');
      term.writeln(`${PURPLE}${data.message}${RESET}`);
      
      // Also save to state if we want to show it elsewhere
      setAiMessages(prev => [...prev, data.message]);
    });
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return { initAI, aiMessages };
};
