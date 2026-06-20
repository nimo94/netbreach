import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useTerminal } from '../hooks/useTerminal';
import { useAI } from '../hooks/useAI';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { MissionType, useGameState } from '../context/GameState';

interface TerminalProps {
  onMissionComplete: () => void;
  level: number;
  addCredits: (amount: number) => void;
  levelUp: () => void;
  currentTargetDomain: string;
  currentTargetIp: string;
}

export default React.memo(function Terminal({ onMissionComplete, level, addCredits, levelUp, currentTargetDomain, currentTargetIp }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  const { handleInput, getPrompt, ghostSequence } = useTerminal();
  const { initAI } = useAI();
  const { lobbyStatus, playerCount, isWinner, winner, declareWinner, retryMatch } = useMultiplayer();
  const { lobbyCode, isHost } = useGameState();
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const stateRef = useRef({ level, addCredits, levelUp, onMissionComplete, lobbyCode, declareWinner, currentTargetDomain, currentTargetIp, ghostSequence, setShowLevelComplete });

  useEffect(() => {
    stateRef.current = { level, addCredits, levelUp, onMissionComplete, lobbyCode, declareWinner, currentTargetDomain, currentTargetIp, ghostSequence, setShowLevelComplete };
  }, [level, addCredits, levelUp, onMissionComplete, lobbyCode, declareWinner, currentTargetDomain, currentTargetIp, ghostSequence]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Set up global callback for the useTerminal hook to trigger level progression
    (window as any).progressionCallback = () => {
      const { level: l, addCredits: a, levelUp: up, onMissionComplete: omc, lobbyCode: lc, declareWinner: dw, setShowLevelComplete: setAnim } = stateRef.current;
      a(15000 * l); // More money for higher levels
      setAnim(true);
      setTimeout(() => {
        setAnim(false);
        if (lc) {
          dw();
        } else {
          up();
          omc();
        }
      }, 3500);
    };

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      theme: {
        background: '#0a0c10',
        foreground: '#d1d5db',
        cursor: '#4ade80',
        selectionBackground: '#1a1d26'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m NETBREACH OS v1.0.4 loaded.');
    term.writeln(`\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m Connection established to \x1b[38;2;74;222;128m${currentTargetDomain}\x1b[0m`);
    term.writeln('');
    
    let isLocked = false;
    const writePrompt = () => term.write(getPrompt());
    writePrompt();

    let currentInput = '';
    let cursorOffset = 0;
    let history: string[] = [];
    let historyIndex = -1;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const setLocked = (locked: boolean) => {
      isLocked = locked;
    };

    const getSuggestion = (input: string) => {
      if (!input || input.length < 2) return '';
      
      const { currentTargetIp: ip, currentTargetDomain: domain, ghostSequence } = stateRef.current;
      
      const KNOWN_COMMANDS = [
        `nmap -sS -Pn ${ip}`,
        `gobuster dir -u http://${ip} -w common.txt`,
        `sqlmap -u http://${ip}`,
        `hydra -l admin -P wordlist.txt ssh://${ip}`,
        `./exploit.py --rhost ${ip} --cve CVE-`,
        `curl http://${ip}/.env`,
        `ssh root@${ip}`,
        'mysql -u root -p',
        'sudo env /bin/bash',
        `scp -r root@${ip}:/opt/project_icarus .`,
        'echo "HACKED" > /var/www/html/index.html',
        'rm -rf /var/log/auth.log && history -c',
        'shred -u /var/log/auth.log && history -c',
        'macchanger -r eth0',
        'dhclient eth0',
        'proxychains bash',
        'ifconfig',
        `nslookup ${domain}`,
        'DROP DATABASE users;',
        `wget http://${ip}/assets/icarus_backup.zip`,
        `ftp ${ip}`,
        'put index.html',
        'scan',
        'bruteforce',
        'exploit',
        'analyze',
        'patch',
        'decrypt',
        'nuke',
        'intercept',
        'ping',
        'help',
        'clear',
        'sudo',
        'login',
        'whoami',
        'inventory'
      ];

      // Prioritize the AI's dynamically learned ghost sequence
      const match = [...(ghostSequence || []), ...KNOWN_COMMANDS].find(cmd => cmd.startsWith(input));
      return match ? match.slice(input.length) : '';
    };

    const redrawLine = (input: string) => {
      term.write('\x1b[2K\r' + getPrompt() + input);
      
      const suggestion = getSuggestion(input);
      if (suggestion && cursorOffset === 0 && !getPrompt().includes('password')) {
         // Save cursor position using DEC sequence
         term.write('\x1b7');
         // Draw suggestion in dim gray
         term.write(`\x1b[90m${suggestion}\x1b[0m`);
         // Restore cursor position
         term.write('\x1b8');
      }

      if (cursorOffset > 0) {
        term.write(`\x1b[${cursorOffset}D`);
      }
    };

    const handleTerminalInput = (data: string) => {
      if (isLocked) return;

      if (data === '\r') { 
        term.writeln('');
        const trimmed = currentInput.trim();
        
        if (trimmed.length > 0) {
          history.push(currentInput); 
          historyIndex = history.length;
        }

        // Lock terminal if game is over
        if (stateRef.current.declareWinner && document.getElementById('winner-overlay')) {
          return;
        }

        handleInput(trimmed, term, setLocked, writePrompt);
        
        currentInput = '';
        cursorOffset = 0;
      } else if (data === '\t') { // Tab
        const suggestion = getSuggestion(currentInput);
        if (suggestion && cursorOffset === 0) {
          currentInput += suggestion;
          redrawLine(currentInput);
        }
      } else if (data === '\x7F') { // Backspace
        if (currentInput.length > 0 && cursorOffset < currentInput.length) {
          const insertIdx = currentInput.length - cursorOffset;
          currentInput = currentInput.slice(0, insertIdx - 1) + currentInput.slice(insertIdx);
          redrawLine(currentInput);
        }
      } else if (data === '\x1b[D') { // Left arrow
        if (cursorOffset < currentInput.length) {
          cursorOffset++;
          term.write('\x1b[D');
        }
      } else if (data === '\x1b[C') { // Right arrow
        if (cursorOffset > 0) {
          cursorOffset--;
          term.write('\x1b[C');
        }
      } else if (data === '\x1b[A') { // Up arrow
        if (history.length > 0 && historyIndex > 0) {
          historyIndex--;
          currentInput = history[historyIndex];
          cursorOffset = 0;
          redrawLine(currentInput);
        }
      } else if (data === '\x1b[B') { // Down arrow
        if (historyIndex < history.length - 1) {
          historyIndex++;
          currentInput = history[historyIndex];
          cursorOffset = 0;
          redrawLine(currentInput);
        } else if (historyIndex === history.length - 1) {
          historyIndex++;
          currentInput = '';
          cursorOffset = 0;
          redrawLine(currentInput);
        }
      } else {
        // Ignore other escape sequences
        if (data.startsWith('\x1b')) return;

        const isPinMode = getPrompt().includes('password');
        const insertIdx = currentInput.length - cursorOffset;
        currentInput = currentInput.slice(0, insertIdx) + data + currentInput.slice(insertIdx);
        
        if (isPinMode) {
          term.write('\x1b[2K\r' + getPrompt());
        } else {
          redrawLine(currentInput);
        }
      }
    };

    term.onData(handleTerminalInput);
    (window as any).triggerMobileKey = handleTerminalInput;

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    initAI(term);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      delete (window as any).progressionCallback;
      delete (window as any).triggerMobileKey;
    };
  }, []); // Empty dependency array prevents the terminal from unmounting/remounting on state changes

  // Handle retry match logic (reset terminal when winner clears)
  useEffect(() => {
    if (lobbyCode && !winner && lobbyStatus === 'playing' && xtermRef.current) {
       const term = xtermRef.current;
       term.clear();
       term.writeln('\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m NETBREACH OS v1.0.4 re-initialized.');
       term.writeln(`\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m Connection established to \x1b[38;2;74;222;128m${currentTargetDomain}\x1b[0m`);
       term.writeln('');
       term.write(getPrompt());
    }
  }, [winner, lobbyStatus, currentTargetDomain, lobbyCode, getPrompt]);

  const showOverlay = lobbyCode && winner;

  return (
    <div className="absolute inset-0 overflow-hidden tour-terminal">
      <div className="absolute inset-2 md:bottom-2 bottom-[130px]">
        <div ref={terminalRef} className="w-full h-full" />
      </div>
      {showOverlay && (
        <div id="winner-overlay" className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <h1 className={`text-6xl font-bold font-mono tracking-widest mb-4 ${isWinner ? 'text-nb-green' : 'text-nb-red'}`}>
            {isWinner ? 'YOU WIN' : 'YOU LOSE'}
          </h1>
          <p className="text-xl text-nb-text/80 mb-8 font-mono text-center max-w-md">
            {isWinner ? 'HACKER BOY. YOU BREACHED THE TARGET FIRST.' : 'YOU WERE TOO SLOW. THE OPPONENT COMPLETED THE HACK.'}
          </p>
          <div className="flex gap-4">
            {isHost && (
              <button 
                onClick={retryMatch}
                className="px-8 py-3 bg-nb-green/20 border border-nb-green hover:bg-nb-green hover:text-black text-nb-green rounded tracking-widest transition-colors font-bold"
              >
                RETRY WITH RANDOM LEVEL
              </button>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-nb-panel border border-nb-border hover:border-nb-cyan text-nb-cyan rounded tracking-widest transition-colors font-bold"
            >
              DISCONNECT
            </button>
          </div>
        </div>
      )}
      {showLevelComplete && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[60] backdrop-blur-md transition-opacity animate-in fade-in duration-500">
          <div className="relative">
            <h1 className="text-4xl md:text-7xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-nb-cyan via-nb-green to-nb-cyan animate-pulse">
              LEVEL COMPLETE
            </h1>
            <div className="absolute -inset-4 bg-nb-cyan/20 blur-xl z-[-1] animate-pulse"></div>
          </div>
          <p className="mt-8 text-lg md:text-2xl text-nb-green/80 font-mono tracking-widest animate-pulse">
            REWARD SECURED: {level * 15000} CREDITS
          </p>
          <div className="mt-12 w-64 h-1 bg-nb-border overflow-hidden">
            <div className="h-full bg-nb-cyan w-full animate-progress"></div>
          </div>
        </div>
      )}
      {/* Mobile Controls */}
      <div className="md:hidden absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none z-40">
        <div className="flex flex-col items-center gap-1 pointer-events-auto bg-black/50 p-2 rounded-lg border border-nb-border backdrop-blur-sm">
           {lobbyStatus === 'waiting' && playerCount <= 1 ? (
             <p className="text-sm text-nb-text/50">Waiting for peers to connect...</p>
           ) : (
             <p className="text-sm font-bold text-nb-green">{playerCount - 1} Opponent(s) Connected!</p>
           )}
           <button 
             className="w-12 h-10 bg-nb-panel border border-nb-cyan text-nb-cyan rounded active:bg-nb-cyan active:text-black flex items-center justify-center font-bold" 
             onTouchStart={(e) => { e.preventDefault(); (window as any).triggerMobileKey?.('\x1b[A'); }}
             onClick={(e) => { e.preventDefault(); (window as any).triggerMobileKey?.('\x1b[A'); if (xtermRef.current) xtermRef.current.focus(); }}
           >↑</button>
           <div className="flex gap-1">
             <button 
               className="w-12 h-10 bg-nb-panel border border-nb-cyan text-nb-cyan rounded active:bg-nb-cyan active:text-black flex items-center justify-center font-bold" 
               onTouchStart={(e) => { e.preventDefault(); (window as any).triggerMobileKey?.('\x1b[D'); }}
               onClick={(e) => { e.preventDefault(); (window as any).triggerMobileKey?.('\x1b[D'); if (xtermRef.current) xtermRef.current.focus(); }}
             >←</button>
             <button 
               className="w-12 h-10 bg-nb-panel border border-nb-cyan text-nb-cyan rounded active:bg-nb-cyan active:text-black flex items-center justify-center font-bold" 
               onTouchStart={(e) => { e.preventDefault(); (window as any).triggerMobileKey?.('\x1b[B'); }}
               onClick={(e) => { e.preventDefault(); (window as any).triggerMobileKey?.('\x1b[B'); if (xtermRef.current) xtermRef.current.focus(); }}
             >↓</button>
             <button 
               className="w-12 h-10 bg-nb-panel border border-nb-cyan text-nb-cyan rounded active:bg-nb-cyan active:text-black flex items-center justify-center font-bold" 
               onTouchStart={(e) => { e.preventDefault(); (window as any).triggerMobileKey?.('\x1b[C'); }}
               onClick={(e) => { e.preventDefault(); (window as any).triggerMobileKey?.('\x1b[C'); if (xtermRef.current) xtermRef.current.focus(); }}
             >→</button>
           </div>
        </div>
        <button 
          className="pointer-events-auto bg-black/80 border border-nb-cyan text-nb-cyan px-6 py-4 rounded font-bold tracking-widest active:bg-nb-cyan active:text-black backdrop-blur-sm"
          onTouchStart={(e) => {
            e.preventDefault();
            if ((window as any).triggerMobileKey) {
              (window as any).triggerMobileKey('\t');
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            if ((window as any).triggerMobileKey) {
              (window as any).triggerMobileKey('\t');
            }
            if (xtermRef.current) {
              xtermRef.current.focus();
            }
          }}
        >
          TAB ↹
        </button>
      </div>
    </div>
  );
});
