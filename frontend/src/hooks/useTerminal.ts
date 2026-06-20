import { useRef, useEffect, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { MissionType, useGameState } from '../context/GameState';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../firebase';

// ANSI Color Codes for output
const GREEN = '\x1b[38;2;74;222;128m';
const AMBER = '\x1b[38;2;245;158;11m';
const RED = '\x1b[38;2;239;68;68m';
const CYAN = '\x1b[38;2;34;211;238m';
const RESET = '\x1b[0m';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useTerminal = () => {
  const gameContext = useGameState();
  const { hasItem, updateAIStats, addCredits, addVictimLog } = gameContext;
  
  const gameRef = useRef(gameContext);
  useEffect(() => {
    gameRef.current = gameContext;
  }, [gameContext]);
  
  const state = useRef({
    mode: 'NORMAL', // NORMAL, TRACE, PIN, MYSQL, BLACKLISTED
    cve: '',
    pin: '',
    pinContext: '',
    prompt: '', // Set dynamically
    traceWord: 'override-proxy',
    traceStartTime: 0,
    hasShell: false,
    hasRoot: false,
    blacklistCount: 0,
    blacklistFailedAttempts: 0,
    missionObjectiveCompleted: false,
  });

  const aiSessionId = useRef(auth.currentUser?.uid || localStorage.getItem('nb_ai_session') || uuidv4());
  const [ghostSequence, setGhostSequence] = useState<string[]>([]);

  useEffect(() => {
    // Keep localstorage fallback for complete offline/guest if not auth
    if (!localStorage.getItem('nb_ai_session') && !auth.currentUser) {
      localStorage.setItem('nb_ai_session', aiSessionId.current);
    }
    if (auth.currentUser) {
      aiSessionId.current = auth.currentUser.uid;
    }
  }, [auth.currentUser]);

  const getPrompt = () => {
    const { currentTarget, username } = gameRef.current;
    if (state.current.mode === 'TRACE') return `\r${AMBER}ACTION REQUIRED:${RESET} `;
    if (state.current.mode === 'PIN') return `\rroot@${currentTarget.ip}'s password: `;
    if (state.current.mode === 'MYSQL') return `\rmysql> `;
    if (state.current.mode === 'BLACKLISTED') return `${RED}[BLACKLISTED]${RESET} ${GREEN}${username}@netbreach${RESET}:${CYAN}~${RESET}$ `;
    if (state.current.prompt === '') return `${GREEN}${username}@netbreach${RESET}:${CYAN}~${RESET}$ `;
    return state.current.prompt;
  };

  const handleMissionSuccess = async (term: XTerm, s: any, setLocked: (l: boolean) => void, writePrompt: () => void, currentLevel: number) => {
    term.clear();
    term.writeln(`${GREEN}[SYSTEM] Disconnecting from remote host...${RESET}`);
    term.writeln(`${CYAN}[SYSTEM] ₿ ${(15000 * currentLevel).toLocaleString()} deposited to anonymous wallet.${RESET}`);
    await sleep(1500);
    
    if ((window as any).progressionCallback) {
       (window as any).progressionCallback();
    }
    
    term.clear();
    term.writeln('\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m NETBREACH OS v1.0.4 loaded.');
    term.writeln('\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m Awaiting new target initialization...');
    term.writeln('');
    
    s.mode = 'NORMAL';
    s.cve = '';
    s.pin = '';
    s.hasShell = false;
    s.hasRoot = false;
    s.missionObjectiveCompleted = false;
    s.prompt = ''; // Will recalculate
    updateAIStats(gameRef.current.aiProgress, 0); // Keep behavioral profile, reset threat
    
    // Notify backend to drop the threat for the new target server
    fetch('https://netbreach-api-gateway-866084699533.us-central1.run.app/session/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: aiSessionId.current, command: '__RESET_THREAT__', level: 1, mission_type: 'default' })
    }).catch(() => {});
    
    setLocked(false);
    writePrompt();
  };

  const handleInput = async (input: string, term: XTerm, setLocked: (l: boolean) => void, writePrompt: () => void) => {
    setLocked(true);
    const s = state.current;
    const { currentTarget, level } = gameRef.current;
    
    const hasProxyChain = hasItem('proxy_chain');
    const hasAutoScraper = hasItem('auto_scraper');
    const hasZeroDay = hasItem('zero_day');
    const hasNetScanner = hasItem('net_scanner');
    const hasKeyLogger = hasItem('key_logger');
    const hasHydraInjector = hasItem('hydra_injector');
    const hasSqlAutomator = hasItem('sql_automator');
    const hasLogWiper = hasItem('log_wiper');
    const hasTraceObfuscator = hasItem('trace_obfuscator');
    
    let baseTraceTime = 6000;
    if (currentTarget.difficulty === 'EASY') baseTraceTime = 18000;
    else if (currentTarget.difficulty === 'MEDIUM') baseTraceTime = 12000;
    else if (currentTarget.difficulty === 'HARD') baseTraceTime = 8000;
    else if (currentTarget.difficulty === 'INSANE') baseTraceTime = 5000;
    
    const traceTimeLimit = hasProxyChain ? baseTraceTime * 1.5 : baseTraceTime;
    
    const args = input.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();
    const fullCmd = input.trim();
    
    const isInsideOrExploiting = (s.hasShell || s.hasRoot || s.mode === 'MYSQL' || s.mode === 'FTP' ||
                                 ['./exploit.py', 'sqlmap', 'hydra', 'scp', 'sudo', 'rm', 'echo', 'gobuster', 'curl', 'ssh', 'shred', 'wget', 'ftp', 'put'].includes(cmd)) && 
                                 s.mode !== 'BLACKLISTED';

    // Only log to AI if we are actively exploiting or already inside the system
    if (isInsideOrExploiting) {
      fetch('https://netbreach-api-gateway-866084699533.us-central1.run.app/session/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: aiSessionId.current, command: input, level: currentTarget.difficulty === 'INSANE' ? 15 : currentTarget.difficulty === 'HARD' ? 10 : currentTarget.difficulty === 'MEDIUM' ? 5 : 1, mission_type: currentTarget.missionType })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.ai_status && data.ai_status !== 'unreachable') {
           updateAIStats(data.ai_status.ghost_completion, data.ai_status.pattern_strength);
           
           if (data.ai_status.message) {
             addVictimLog(`[IDS] ${data.ai_status.message}`);
           }

           if (data.ai_status.ghost_completion >= 0.74 && ghostSequence.length === 0) {
             fetch(`https://netbreach-ai-engine-866084699533.us-central1.run.app/ghost/${aiSessionId.current}?mission_type=${currentTarget.missionType}`)
               .then(res => res.json())
               .then(ghostData => {
                 if (ghostData.active && ghostData.sequence && ghostData.sequence.length > 0) {
                   setGhostSequence(ghostData.sequence);
                   term.writeln('');
                   term.writeln(`${RED}[!] PREDICTIVE MODEL COMPLETE. AI HAS LEARNED YOUR ATTACK PATTERN:${RESET}`);
                   term.writeln(`${RED}[!] ANTICIPATED COMMANDS: ${ghostData.sequence.join(', ')}${RESET}`);
                   term.writeln(`${AMBER}[?] Executing these commands will now trigger an instant active-defense lockout.${RESET}`);
                   if (s.mode === 'NORMAL' || s.mode === 'FTP' || s.mode === 'MYSQL' || s.mode === 'PIN' || s.mode === 'TRACE') {
                       writePrompt();
                   }
                 }
               }).catch(() => {});
           }
           
           // Threat level hits 100% (1.0), trigger blacklist
           if (data.ai_status.pattern_strength >= 1.0 && s.mode === 'NORMAL') {
                term.writeln('');
                if (data.ai_status.vector === 'PREDICTIVE_DEFENSE' && s.blacklistCount < 2) {
                  term.writeln(`${RED}[!] PREDICTIVE DEFENSE TRIGGERED: The AI anticipated your exact strategy.${RESET}`);
                  if (currentTarget.missionType === 'exfiltration') {
                     term.writeln(`${AMBER}[?] STRATEGY HINT: Avoid SSH/scp. Try finding an exposed backup zip file using gobuster and downloading it with wget.${RESET}`);
                  } else if (currentTarget.missionType === 'db_wipe') {
                     term.writeln(`${AMBER}[?] STRATEGY HINT: Stop using sqlmap. Look for exposed credentials in .env files using curl.${RESET}`);
                  } else if (currentTarget.missionType === 'defacement') {
                     term.writeln(`${AMBER}[?] STRATEGY HINT: The exploit.py vector is blocked. Try accessing the FTP server directly and using 'put'.${RESET}`);
                  }
                  term.writeln(`${RED}[!] ACTIVE COUNTER-MEASURE DEPLOYED. CONNECTION SEVERED.${RESET}`);
                  term.writeln(`${AMBER}[?] You are locked out. Think like a hacker: if your IP/MAC is banned, what command do you run locally to change it?${RESET}`);
                  s.mode = 'BLACKLISTED';
                  s.hasShell = false;
                  s.hasRoot = false;
                  s.cve = '';
                  s.pin = '';
                  s.prompt = '';
                  s.blacklistCount++;
                  s.blacklistFailedAttempts = 0;
                  writePrompt();
                } else if (s.blacklistCount >= 2) {
                   term.writeln(`${RED}[!] FATAL ERROR: REPEATED INTRUSION DETECTED.${RESET}`);
                   term.writeln(`${RED}[!] ACTIVE COUNTER-MEASURE DEPLOYED. FULL LOCKOUT INITIATED.${RESET}`);
                   
                   // Play robot expanding animation
                   const overlay = document.createElement('div');
                   overlay.id = 'hack-overlay';
                   overlay.style.position = 'fixed';
                   overlay.style.top = '0';
                   overlay.style.left = '0';
                   overlay.style.width = '100vw';
                   overlay.style.height = '100vh';
                   overlay.style.backgroundColor = 'black';
                   overlay.style.display = 'flex';
                   overlay.style.justifyContent = 'center';
                   overlay.style.alignItems = 'center';
                   overlay.style.zIndex = '9999';
                   
                   // Add keyframes for shake
                   const style = document.createElement('style');
                   style.innerHTML = `
                     @keyframes evilShake {
                        0% { transform: scale(1) translate(0px, 0px) rotate(0deg); }
                        25% { transform: scale(3) translate(2px, -2px) rotate(-1deg); }
                        50% { transform: scale(5) translate(-2px, 2px) rotate(1deg); }
                        75% { transform: scale(7) translate(3px, 1px) rotate(-2deg); }
                        100% { transform: scale(8) translate(-1px, -1px) rotate(2deg); filter: drop-shadow(0 0 50px red); }
                     }
                     @keyframes fadeInText {
                        0% { opacity: 0; transform: translateY(20px); }
                        100% { opacity: 1; transform: translateY(0); }
                     }
                   `;
                   document.head.appendChild(style);
                   
                   const robot = document.createElement('div');
                   robot.innerHTML = `
                     <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width: 50px; height: 50px;">
                       <rect x="15" y="15" width="70" height="70" rx="15" fill="#111" stroke="red" stroke-width="3"/>
                       <path d="M 25 45 L 45 50 L 35 35 Z" fill="red"/>
                       <path d="M 75 45 L 55 50 L 65 35 Z" fill="red"/>
                       <path d="M 30 75 Q 50 65 70 75 Q 50 85 30 75 Z" fill="red"/>
                     </svg>
                   `;
                   robot.style.transition = 'all 2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                   robot.style.zIndex = '1';
                   robot.style.position = 'relative';
                   robot.style.top = '-10vh';
                   
                   const text = document.createElement('div');
                   text.innerText = 'YOU HAVE BEEN ATTACKED!';
                   text.style.color = 'red';
                   text.style.fontFamily = 'monospace';
                   text.style.fontSize = '50px';
                   text.style.fontWeight = 'bold';
                   text.style.position = 'absolute';
                   text.style.bottom = '5%';
                   text.style.opacity = '0';
                   text.style.textShadow = '0 0 20px red';
                   text.style.zIndex = '10';
                   
                   overlay.appendChild(robot);
                   overlay.appendChild(text);
                   document.body.appendChild(overlay);
                   
                   setTimeout(() => {
                       text.style.animation = 'fadeInText 0.5s forwards';
                       robot.style.animation = 'evilShake 2s forwards 0.8s';
                   }, 100);
                   
                   setTimeout(() => {
                       window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
                       document.body.removeChild(overlay);
                       document.head.removeChild(style);
                   }, 3200);
                   
                   s.mode = 'NORMAL';
                   s.hasShell = false;
                   s.hasRoot = false;
                   s.cve = '';
                   s.pin = '';
                   s.prompt = '';
                   s.blacklistCount = 0;
                   s.blacklistFailedAttempts = 0;
                   updateAIStats(0, 0);
                   setTimeout(() => {
                       term.clear();
                       term.writeln('\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m NETBREACH OS v1.0.4 loaded.');
                       term.writeln(`\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m Connection established to \x1b[38;2;74;222;128m${currentTarget.domain}\x1b[0m`);
                       term.writeln('');
                       writePrompt();
                   }, 3500);
               } else {
                   term.writeln(`${RED}[!] FATAL ERROR: NETWORK CONNECTION SEVERED BY AI IDS.${RESET}`);
                   term.writeln(`${RED}[!] TARGET HAS BLACKLISTED YOUR IP ADDRESS.${RESET}`);
                   term.writeln(`${AMBER}[?] You are locked out. Think like a hacker: if your IP/MAC is banned, what command do you run locally to change it?${RESET}`);
                   s.mode = 'BLACKLISTED';
                   s.hasShell = false;
                   s.hasRoot = false;
                   s.cve = '';
                   s.pin = '';
                   s.prompt = '';
                   s.blacklistCount++;
                   s.blacklistFailedAttempts = 0;
                   writePrompt();
               }
           }
        }
      })
      .catch(err => console.error('Failed to log command:', err));
    }

    if (s.mode === 'BLACKLISTED') {
        if (cmd === 'macchanger' || cmd === 'dhclient' || cmd === 'proxychains') {
            term.writeln(`${CYAN}[*] Disconnecting eth0 interface...${RESET}`);
            term.writeln(`${CYAN}[*] Spoofing hardware MAC address and requesting new DHCP lease...${RESET}`);
            term.writeln(`${GREEN}[+] Network identity successfully rotated. New IP assigned.${RESET}`);
            term.writeln(`${GREEN}[+] Target AI IDS no longer recognizes your signature. Threat level reset.${RESET}`);
            s.mode = 'NORMAL';
            s.hasShell = false;
            s.hasRoot = false;
            s.cve = '';
            s.pin = '';
            s.prompt = '';
            s.blacklistFailedAttempts = 0;
            
            fetch('https://netbreach-api-gateway-866084699533.us-central1.run.app/session/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: aiSessionId.current, command: '__RESET_THREAT__', level: currentTarget.difficulty === 'INSANE' ? 15 : currentTarget.difficulty === 'HARD' ? 10 : currentTarget.difficulty === 'MEDIUM' ? 5 : 1, mission_type: currentTarget.missionType })
            }).then(res => res.json()).then(data => {
                if (data.success && data.ai_status && data.ai_status !== 'unreachable') {
                    updateAIStats(data.ai_status.ghost_completion, data.ai_status.pattern_strength);
                }
            }).catch(err => console.error('Failed to reset threat:', err));
        } else if (cmd === 'ifconfig' || cmd === 'ip') {
            term.writeln(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`);
            term.writeln(`        inet 192.168.1.55  netmask 255.255.255.0  broadcast 192.168.1.255`);
            term.writeln(`        ${RED}[STATUS: EXPOSED / BLACKLISTED BY TARGET]${RESET}`);
        } else if (cmd === 'override-proxy') {
            s.blacklistFailedAttempts++;
            term.writeln(`${RED}[!] 'override-proxy' is used to intercept active traces. Your connection here is severed by a firewall ban.${RESET}`);
            term.writeln(`${AMBER}[?] You must rotate your IP or MAC address to bypass the ban.${RESET}`);
        } else {
            s.blacklistFailedAttempts++;
            term.writeln(`${RED}[!] NO ROUTE TO HOST: Your current IP is blocked. You must rotate your network identity to continue.${RESET}`);
            
            if (s.blacklistFailedAttempts >= 3) {
               term.writeln('');
               term.writeln(`${RED}[!] TOO MANY FAILED ATTEMPTS. ACTIVE COUNTER-MEASURE DEPLOYED.${RESET}`);
               window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
               
               s.mode = 'NORMAL';
               s.hasShell = false;
               s.hasRoot = false;
               s.cve = '';
               s.pin = '';
               s.prompt = '';
               s.blacklistCount = 0;
               s.blacklistFailedAttempts = 0;
               updateAIStats(0, 0);
               setTimeout(() => {
                   term.clear();
                   term.writeln('\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m NETBREACH OS v1.0.4 loaded.');
                   term.writeln(`\x1b[38;2;34;211;238m[SYSTEM]\x1b[0m Connection established to \x1b[38;2;74;222;128m${currentTarget.domain}\x1b[0m`);
                   term.writeln('');
                   writePrompt();
               }, 3000);
               return; // Prevent writePrompt from being called immediately below
            }
        }
        setLocked(false);
        writePrompt();
        return;
    }

    if (s.mode === 'TRACE') {
        const timeTaken = Date.now() - s.traceStartTime;
        if (input.trim() === s.traceWord && timeTaken < traceTimeLimit) {
            term.writeln(`${GREEN}[+] Trace blocked successfully! (${(timeTaken/1000).toFixed(1)}s)${RESET}`);
            s.mode = 'NORMAL';
            if (currentTarget.missionType === 'defacement') {
                s.hasShell = true;
                s.prompt = `${GREEN}shell@${currentTarget.ip}${RESET}$ `;
                term.writeln(`${GREEN}[+] Reverse shell established.${RESET}`);
            } else {
                term.writeln(`${RED}[!] Exploit payload failed: Remote host connection refused.${RESET}`);
                term.writeln(`${AMBER}[?] This vector doesn't seem to work here. Try using the tools specific to your mission objective.${RESET}`);
            }
        } else {
            term.writeln(`${RED}[!] Trace completed. Connection severed. You were too slow or typed it wrong!${RESET}`);
            s.mode = 'NORMAL';
        }
        setLocked(false);
        writePrompt();
        return;
    }

    if (s.mode === 'PIN') {
        if (input.trim() === s.pin) {
            term.writeln(`${CYAN}(key accepted)${RESET}`);
            await sleep(300);
            if (s.pinContext === 'mysql') {
                term.writeln(`Welcome to the MySQL monitor.  Commands end with ; or \\g.`);
                term.writeln(`Server version: 8.0.35-0ubuntu0.22.04.1 (Ubuntu)`);
                term.writeln(``);
                s.mode = 'MYSQL';
            } else if (s.pinContext === 'scp') {
                term.writeln(`icarus_schematics.pdf                                    100%   45MB  12.5MB/s   00:03`);
                await sleep(200);
                term.writeln(`icarus_source_code.zip                                   100%  120MB  25.0MB/s   00:04`);
                term.writeln(`${GREEN}[+] Exfiltration complete.${RESET}`);
                s.missionObjectiveCompleted = true;
                s.mode = 'NORMAL';
            } else if (s.pinContext === 'ssh') {
                term.writeln(`${GREEN}[+] ROOT shell obtained. euid=0(root)${RESET}`);
                s.hasRoot = true;
                s.hasShell = true;
                s.prompt = `${RED}root@${currentTarget.ip}${RESET}# `;
                s.mode = 'NORMAL';
            }
        } else {
            term.writeln(`${RED}Permission denied, please try again.${RESET}`);
            s.mode = 'NORMAL';
        }
        setLocked(false);
        writePrompt();
        return;
    }

    if (s.mode === 'FTP') {
        if (cmd === 'put') {
            if (fullCmd === 'put index.html') {
                term.writeln(`local: index.html remote: index.html`);
                term.writeln(`227 Entering Passive Mode (192,168,1,42,130,22).`);
                await sleep(400);
                term.writeln(`150 Ok to send data.`);
                term.writeln(`226 Transfer complete.`);
                term.writeln(`89 bytes sent in 0.00 secs (89.0000 kB/s)`);
                term.writeln(`${GREEN}[+] Alternative defacement vector successful.${RESET}`);
                s.missionObjectiveCompleted = true;
                if (hasLogWiper) {
                    await sleep(1000);
                    term.writeln(`${CYAN}[*] LOG WIPER DAEMON TRIGGERED. Scrubbing forensic traces...${RESET}`);
                    await sleep(500);
                    term.writeln(`${GREEN}[+] Tracks successfully covered. MISSION ACCOMPLISHED.${RESET}`);
                    await sleep(1000);
                    handleMissionSuccess(term, s, setLocked, writePrompt, level);
                    return;
                }
            } else {
                term.writeln(`local: ${args[1] || 'undefined'}: No such file or directory`);
            }
        } else if (cmd === 'exit' || cmd === 'quit') {
            term.writeln(`221 Goodbye.`);
            s.mode = 'NORMAL';
            s.prompt = `${GREEN}ass@cybercracker${RESET}:~$ `;
        } else if (cmd === 'help') {
            term.writeln(`Commands may be abbreviated.  Commands are:`);
            term.writeln(``);
            term.writeln(`!               macdef          proxy           site`);
            term.writeln(`$               mdelete         sendport        size`);
            term.writeln(`account         mdir            put             status`);
            term.writeln(`append          mget            pwd             struct`);
            term.writeln(`ascii           mkdir           quit            system`);
            term.writeln(`bell            mls             quote           sunique`);
            term.writeln(`binary          mode            recv            tenex`);
            term.writeln(`bye             modtime         reget           trace`);
            term.writeln(`case            mput            rstatus         type`);
            term.writeln(`cd              newer           rhelp           user`);
            term.writeln(`cdup            nmap            rename          umask`);
            term.writeln(`chmod           nlist           reset           verbose`);
            term.writeln(`close           ntrans          restart         ?`);
            term.writeln(`cr              open            rmdir`);
            term.writeln(`delete          prompt          runique`);
            term.writeln(`debug           passive         send`);
            term.writeln(`dir             mls             quote`);
            term.writeln(`disconnect      mode            recv`);
            term.writeln(`exit            modtime         reget`);
            term.writeln(`form            mput            rstatus`);
            term.writeln(`get             newer           rhelp`);
            term.writeln(`glob            nmap            rename`);
            term.writeln(`hash            nlist           reset`);
            term.writeln(`help            ntrans          restart`);
            term.writeln(`idle            open            rmdir`);
            term.writeln(`image           prompt          runique`);
            term.writeln(`lcd             passive         send`);
            term.writeln(`ls              proxy           site`);
            term.writeln(``);
            term.writeln(`For this mission, you only need to use ${CYAN}put index.html${RESET} to overwrite the site.`);
        } else if (cmd === 'echo') {
            term.writeln(`?Invalid command. You are in FTP mode, not a bash shell. Use 'put' to upload files.`);
        } else {
            term.writeln(`?Invalid command`);
        }
        setLocked(false);
        writePrompt();
        return;
    }

    if (s.mode === 'MYSQL') {
        if (input.trim() === 'DROP DATABASE users;') {
            term.writeln(`Query OK, 4125 rows affected (0.15 sec)`);
            term.writeln(`${GREEN}[+] Database successfully wiped.${RESET}`);
            s.missionObjectiveCompleted = true;
            s.mode = 'NORMAL';
            s.hasRoot = true; // Implicit root upon exiting MySQL
            
            if (hasLogWiper) {
                await sleep(1000);
                term.writeln(`${CYAN}[*] LOG WIPER DAEMON TRIGGERED. Scrubbing forensic traces...${RESET}`);
                await sleep(500);
                term.writeln(`${GREEN}[+] Tracks successfully covered. MISSION ACCOMPLISHED.${RESET}`);
                await sleep(1000);
                handleMissionSuccess(term, s, setLocked, writePrompt, level);
                return;
            }
        } else if (input.trim().toLowerCase() === 'exit' || input.trim().toLowerCase() === 'quit') {
            term.writeln(`Bye`);
            s.mode = 'NORMAL';
            s.hasRoot = true;
        } else if (input.trim().toLowerCase() === 'help') {
            term.writeln(`MySQL commands:`);
            term.writeln(`  ${CYAN}DROP DATABASE users;${RESET}  Wipe the target database and complete the objective.`);
            term.writeln(`  ${CYAN}exit${RESET}                  Close the database connection and return to bash.`);
        } else {
            term.writeln(`${RED}ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${input}' at line 1${RESET}`);
        }
        setLocked(false);
        writePrompt();
        return;
    }

    if (cmd === 'nslookup') {
        if (!args[1]) {
            term.writeln(`${RED}nslookup: Missing target domain. Usage: nslookup [domain]${RESET}`);
        } else if (args[1] === currentTarget.domain) {
          term.writeln(`Server:         192.168.1.1`);
          term.writeln(`Address:        192.168.1.1#53`);
          term.writeln(``);
          term.writeln(`Non-authoritative answer:`);
          term.writeln(`Name:   ${currentTarget.domain}`);
          term.writeln(`Address: ${GREEN}${currentTarget.ip}${RESET}`);
        } else {
          term.writeln(`${AMBER}** server can't find ${args[1]}: NXDOMAIN${RESET}`);
        }
    } 
    else if (cmd === 'nmap') {
        if (args.includes('-h') || args.includes('--help')) {
            term.writeln(`Nmap 7.93 ( https://nmap.org )`);
            term.writeln(`Usage: nmap [Scan Type(s)] [Options] {target specification}`);
        } else if (!args.includes(currentTarget.ip) && !hasNetScanner) {
             term.writeln(`${RED}nmap: Missing or incorrect target IP address. Example: nmap [flags] 192.168.1.1${RESET}`);
        } else if (!args.includes('-sS') && !hasNetScanner) {
             term.writeln(`${RED}nmap: Scan blocked! Missing SYN stealth flag (-sS). The IDS dropped your connection.${RESET}`);
        } else if (!args.includes('-Pn') && !hasNetScanner) {
             term.writeln(`${RED}nmap: Host appears down. Missing ping sweep bypass (-Pn). The host is blocking ICMP.${RESET}`);
        } else if (fullCmd.includes(`nmap -sS -Pn ${currentTarget.ip}`) || fullCmd.includes(`nmap -Pn -sS ${currentTarget.ip}`) || (hasNetScanner && args[1] === currentTarget.ip)) {
            if (hasNetScanner && !fullCmd.includes('-sS')) {
                 term.writeln(`${CYAN}[*] NETWORK SCANNER OVERRIDE ACTIVE. Injecting stealth/ping bypass flags...${RESET}`);
                 await sleep(400);
            }
            if (!s.cve) {
                const year = Math.floor(Math.random() * (2026 - 2010 + 1)) + 2010;
                const id = Math.floor(Math.random() * 9000) + 1000;
                s.cve = `CVE-${year}-${id}`;
            }
            term.writeln(`Starting Nmap 7.93 ( https://nmap.org ) at 2026-06-04 22:34 UTC`);
            await sleep(800);
            
            if (hasZeroDay) {
                term.writeln(`${CYAN}[*] ZERO-DAY DATABASE ACTIVE. Cross-referencing signatures...${RESET}`);
                await sleep(400);
            }
            
            term.writeln(`Nmap scan report for ${currentTarget.ip}`);
            term.writeln(`Host is up (0.012s latency).`);
            term.writeln(`Not shown: 997 closed tcp ports (reset)`);
            term.writeln(`PORT    STATE SERVICE`);
            term.writeln(`${GREEN}22/tcp  open  ssh${RESET}`);
            term.writeln(`${GREEN}80/tcp  open  http${RESET}`);
            term.writeln(`${GREEN}443/tcp open  https${RESET}`);
            term.writeln(``);
            await sleep(500);
            
            term.writeln(`${CYAN}[*] Vulnerability Engine triggered...${RESET}`);
            term.writeln(`${CYAN}[*] Port 443 vulnerable to ${AMBER}${s.cve}${RESET}`);
            
            if (hasKeyLogger && currentTarget.missionType !== 'defacement') {
                if (!s.pin) s.pin = Math.floor(1000 + Math.random() * 9000).toString();
                term.writeln(``);
                term.writeln(`${CYAN}[*] DECRYPTION KEY LOGGER ACTIVE. Scraping memory buffers...${RESET}`);
                await sleep(600);
                term.writeln(`${GREEN}[+] Administrator PIN recovered: ${s.pin}${RESET}`);
            }
        } else {
            term.writeln(`${AMBER}nmap: Invalid syntax. Try \`nmap -h\`.${RESET}`);
        }
    }
    else if (cmd === 'hydra') {
        if (currentTarget.missionType !== 'exfiltration') {
            term.writeln(`${RED}hydra: This tool is not required for your current objective.${RESET}`);
        } else if (!hasHydraInjector && !args.includes(`ssh://${currentTarget.ip}`)) {
            term.writeln(`${RED}hydra: Missing or incorrect target protocol/IP. Example: hydra -l admin -P wordlist.txt ssh://${currentTarget.ip}${RESET}`);
        } else if (fullCmd.includes(`hydra -l admin -P wordlist.txt ssh://${currentTarget.ip}`) || (hasHydraInjector && args[1] === currentTarget.ip)) {
            if (hasHydraInjector && !fullCmd.includes('ssh://')) {
                term.writeln(`${CYAN}[*] HYDRA PROTOCOL INJECTOR ACTIVE. Specifying wordlists and SSH protocol...${RESET}`);
                await sleep(400);
            }
            term.writeln(`${CYAN}Hydra v9.4 (c) 2023 by van Hauser/THC${RESET}`);
            term.writeln(`[INFO] Starting attack. Target: ssh://${currentTarget.ip}:22/`);
            await sleep(500);
            
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
            const animateBruteForce = async () => {
              for(let j=0; j<20; j++) {
                  let str = "";
                  for(let k=0; k<4; k++) str += charset.charAt(Math.floor(Math.random() * charset.length));
                  term.write(`\r[ATTEMPT] admin : ${str}`);
                  await sleep(30);
              }
              term.write('\r\x1b[2K'); // clear line
            };

            for(let i=0; i<3; i++) {
                await animateBruteForce();
                const randomPass = Math.floor(1000 + Math.random() * 9000);
                term.writeln(`[ATTEMPT] admin : ${randomPass} - INCORRECT`);
            }
            
            await animateBruteForce();
            if (!s.pin) {
                s.pin = Math.floor(1000 + Math.random() * 9000).toString();
            }
            term.writeln(`[ATTEMPT] admin : ${s.pin} - ${GREEN}SUCCESS${RESET}`);
            term.writeln(`${GREEN}[80] host: ${currentTarget.ip}   login: admin   password: ${s.pin}${RESET}`);
        } else {
            term.writeln(`${AMBER}hydra: syntax error. Use: hydra -l [user] -P [wordlist] [protocol]://[ip]${RESET}`);
        }
    }
    else if (cmd === './exploit.py') {
        if (currentTarget.missionType === 'db_wipe') {
            term.writeln(`${RED}./exploit.py: This tool is not required for your current objective.${RESET}`);
        } else if (!s.cve) {
            term.writeln(`${RED}[!] Error: No target scanned. Run nmap first to discover the vulnerability.${RESET}`);
        } else if (fullCmd.includes(`--cve`) && !fullCmd.includes(s.cve)) {
            term.writeln(`${RED}[!] Exploit failed: The target server is NOT vulnerable to the specified CVE.${RESET}`);
        } else if (fullCmd.includes(`./exploit.py --rhost ${currentTarget.ip} --cve ${s.cve}`)) {
            term.writeln(`${RED}`);
            term.writeln(`    _  _   _____  _    _  _  ___  __  \r`);
            term.writeln(`  _| || |_|  ___|| |  | || |/ _ \\|  | \r`);
            term.writeln(` |_  ..  _| |__  | |  | || | | | |  | \r`);
            term.writeln(` |_      _|  __| | |/\\| || | | | |  | \r`);
            term.writeln(` |_  ..  _| |___ \\  /\\  /| | |_| |  | \r`);
            term.writeln(` |_||_||_||_____| \\/  \\/ |_|\\___/|__| \r`);
            term.writeln(`${RESET}`);
            term.writeln(`${CYAN}[*] Initializing exploit payload for ${s.cve}...${RESET}`);
            await sleep(1000);
            term.writeln(`${CYAN}[*] Sending crafted buffer to ${currentTarget.ip}:443...${RESET}`);
            await sleep(1500);
            
            if (hasTraceObfuscator) {
                term.writeln(`${RED}[!] WARNING: AI DEFENSE HEURISTICS TRIGGERED!${RESET}`);
                await sleep(300);
                term.writeln(`${CYAN}[*] TRACE OBFUSCATOR ACTIVE. Intercepting and blocking trace...${RESET}`);
                await sleep(500);
                term.writeln(`${GREEN}[+] Trace blocked successfully! (0.0s)${RESET}`);
                s.mode = 'NORMAL';
                
                if (currentTarget.missionType === 'defacement') {
                    s.hasShell = true;
                    s.prompt = `${GREEN}shell@${currentTarget.ip}${RESET}$ `;
                    term.writeln(`${GREEN}[+] Reverse shell established.${RESET}`);
                } else {
                    term.writeln(`${RED}[!] Exploit payload failed: Remote host connection refused.${RESET}`);
                    term.writeln(`${AMBER}[?] This vector doesn't seem to work here. Try using the tools specific to your mission objective.${RESET}`);
                }
                
                setLocked(false);
                writePrompt();
                return;
            } else {
                term.writeln(`${RED}[!] WARNING: AI DEFENSE HEURISTICS TRIGGERED!${RESET}`);
                term.writeln(`${RED}[!] ACTIVE TRACE IN PROGRESS...${RESET}`);
                term.writeln(`${AMBER}>> TYPE 'override-proxy' TO BLOCK TRACE (${traceTimeLimit/1000} SECONDS)<<${RESET}`);
                
                s.mode = 'TRACE';
                s.traceStartTime = Date.now();
                setLocked(false);
                writePrompt();
                return;
            }
        } else {
            term.writeln(`${AMBER}./exploit.py: Invalid syntax.${RESET}`);
        }
    }
    else if (cmd === 'sqlmap') {
        if (currentTarget.missionType !== 'db_wipe') {
            term.writeln(`${RED}sqlmap: This tool is not required for your current objective.${RESET}`);
        } else if (fullCmd === 'sqlmap' && !hasSqlAutomator) {
             term.writeln(`${AMBER}sqlmap: Invalid syntax. Example: sqlmap -u http://[ip]${RESET}`);
        } else if (fullCmd.includes(`sqlmap -u http://${currentTarget.ip}`) || (fullCmd === 'sqlmap' && hasSqlAutomator)) {
            if (hasSqlAutomator && fullCmd === 'sqlmap') {
                term.writeln(`${CYAN}[*] SQL AUTOMATOR ACTIVE. Targeting ${currentTarget.ip}...${RESET}`);
                await sleep(400);
            }
            term.writeln(`${CYAN}sqlmap/1.7.3#stable - automatic SQL injection and database takeover tool${RESET}`);
            await sleep(500);
            term.writeln(`[*] starting @ 22:31:05`);
            term.writeln(`[22:31:05] [INFO] testing connection to the target URL`);
            term.writeln(`[22:31:06] [INFO] checking if the target is protected by some kind of WAF/IPS`);
            await sleep(500);
            term.writeln(`[22:31:07] [INFO] testing if GET parameter 'id' is dynamic`);
            term.writeln(`[22:31:07] [INFO] confirming that GET parameter 'id' is dynamic`);
            await sleep(500);
            term.writeln(`[22:31:08] [INFO] GET parameter 'id' is 'MySQL >= 5.0 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause (FLOOR)' injectable`);
            if (!s.pin) {
                s.pin = Math.floor(1000 + Math.random() * 9000).toString();
            }
            term.writeln(``);
            term.writeln(`${GREEN}[+] Database administrator credentials dumped: root / ${s.pin}${RESET}`);
        } else {
            term.writeln(`${AMBER}sqlmap: Invalid syntax. Example: sqlmap -u http://[ip]${RESET}`);
        }
    }
    else if (cmd === 'mysql') {
        if (currentTarget.missionType !== 'db_wipe') {
            term.writeln(`${RED}mysql: This tool is not required for your current objective.${RESET}`);
        } else if (fullCmd.includes(`mysql -u root -p`)) {
            if (hasAutoScraper) {
                term.writeln(`${CYAN}[*] MEMORY AUTO-SCRAPER INJECTING STORED PIN...${RESET}`);
                await sleep(500);
                term.writeln(`Welcome to the MySQL monitor.  Commands end with ; or \\g.`);
                term.writeln(`Server version: 8.0.35-0ubuntu0.22.04.1 (Ubuntu)`);
                term.writeln(``);
                s.mode = 'MYSQL';
            } else if (!s.pin) {
                 term.writeln(`${RED}mysql: Access denied. (Did you run sqlmap first to find the password?)${RESET}`);
            } else {
                s.pinContext = 'mysql';
                s.mode = 'PIN';
                setLocked(false);
                writePrompt();
                return;
            }
        } else {
            term.writeln(`${AMBER}mysql: Invalid syntax. Example: mysql -u root -p${RESET}`);
        }
    }
    else if (cmd === 'sudo') {
        if (!s.hasShell) {
            term.writeln(`${RED}bash: sudo: command not found${RESET}`);
        } else if (fullCmd.includes('sudo env /bin/bash')) {
            term.writeln(`${CYAN}[*] Executing binary with elevated privileges...${RESET}`);
            await sleep(800);
            term.writeln(`${GREEN}[+] ROOT shell obtained. euid=0(root)${RESET}`);
            s.hasRoot = true;
            s.prompt = `${RED}root@${currentTarget.ip}${RESET}# `;
        } else {
            term.writeln(`${RED}Sorry, user ghost is not allowed to execute '${args.slice(1).join(' ')}' as root on ${currentTarget.domain.split('.')[0]}-web.${RESET}`);
        }
    }
    else if (cmd === 'echo') {
        if (currentTarget.missionType !== 'defacement') {
            term.writeln(`${RED}echo: This tool is not required for your current objective.${RESET}`);
        } else if (!s.hasRoot) {
            term.writeln(`${RED}bash: /var/www/html/index.html: Permission denied${RESET}`);
        } else if (fullCmd.includes(`echo "HACKED" > /var/www/html/index.html`)) {
            term.writeln(`${GREEN}[+] Website successfully defaced. Operations halted on target server.${RESET}`);
            s.missionObjectiveCompleted = true;
            if (hasLogWiper) {
                await sleep(1000);
                term.writeln(`${CYAN}[*] LOG WIPER DAEMON TRIGGERED. Scrubbing forensic traces...${RESET}`);
                await sleep(500);
                term.writeln(`${GREEN}[+] Tracks successfully covered. MISSION ACCOMPLISHED.${RESET}`);
                await sleep(1000);
                handleMissionSuccess(term, s, setLocked, writePrompt, level);
                return;
            }
        } else {
            term.writeln(`${AMBER}bash: syntax error near unexpected token${RESET}`);
        }
    }
    else if (cmd === 'scp') {
        if (currentTarget.missionType !== 'exfiltration') {
            term.writeln(`${RED}scp: This tool is not required for your current objective.${RESET}`);
        } else if (!s.hasRoot) {
            term.writeln(`${RED}scp: /opt/project_icarus: Permission denied. (Do you need to escalate privileges?)${RESET}`);
            } else if (fullCmd.includes(`scp -r root@${currentTarget.ip}:/opt/project_icarus .`)) {
            if (hasAutoScraper) {
                term.writeln(`${CYAN}[*] MEMORY AUTO-SCRAPER INJECTING STORED PIN...${RESET}`);
                await sleep(500);
                term.writeln(`${CYAN}(key accepted)${RESET}`);
                await sleep(300);
                term.writeln(`icarus_schematics.pdf                                    100%   45MB  12.5MB/s   00:03`);
                await sleep(200);
                term.writeln(`icarus_source_code.zip                                   100%  120MB  25.0MB/s   00:04`);
                term.writeln(`${GREEN}[+] Exfiltration complete.${RESET}`);
                
                if (hasLogWiper) {
                    await sleep(1000);
                    term.writeln(`${CYAN}[*] LOG WIPER DAEMON TRIGGERED. Scrubbing forensic traces...${RESET}`);
                    await sleep(500);
                    term.writeln(`${GREEN}[+] Tracks successfully covered. MISSION ACCOMPLISHED.${RESET}`);
                    await sleep(1000);
                    handleMissionSuccess(term, s, setLocked, writePrompt, level);
                    return;
                }
            } else if (!s.pin) {
                 term.writeln(`${RED}scp: Missing encryption key. Run hydra first to find the password.${RESET}`);
            } else {
                s.pinContext = 'scp';
                s.mode = 'PIN';
                setLocked(false);
                writePrompt();
                return;
            }
        } else {
             term.writeln(`${AMBER}scp: invalid syntax.${RESET}`);
        }
    }
    else if (cmd === 'wget') {
        if (currentTarget.missionType !== 'exfiltration') {
            term.writeln(`${RED}wget: This tool is not required for your current objective.${RESET}`);
        } else if (fullCmd === `wget http://${currentTarget.ip}/assets/icarus_backup.zip`) {
            term.writeln(`${CYAN}[*] Connecting to ${currentTarget.ip}:80... connected.${RESET}`);
            await sleep(500);
            term.writeln(`HTTP request sent, awaiting response... 200 OK`);
            term.writeln(`Length: 120584 (118K) [application/zip]`);
            term.writeln(`Saving to: 'icarus_backup.zip'`);
            term.writeln(``);
            await sleep(800);
            term.writeln(`icarus_backup.zip     100%[===================>] 117.76K  --.-KB/s    in 0.1s`);
            term.writeln(`${GREEN}[+] Exfiltration complete via alternative vector.${RESET}`);
            s.missionObjectiveCompleted = true;
            if (hasLogWiper) {
                await sleep(1000);
                term.writeln(`${CYAN}[*] LOG WIPER DAEMON TRIGGERED. Scrubbing forensic traces...${RESET}`);
                await sleep(500);
                term.writeln(`${GREEN}[+] Tracks successfully covered. MISSION ACCOMPLISHED.${RESET}`);
                await sleep(1000);
                handleMissionSuccess(term, s, setLocked, writePrompt, level);
                return;
            }
        } else {
            term.writeln(`${AMBER}wget: Invalid URL or file not found. 404 Not Found.${RESET}`);
        }
    }
    else if (cmd === 'ftp') {
        if (currentTarget.missionType !== 'defacement') {
            term.writeln(`${RED}ftp: This tool is not required for your current objective.${RESET}`);
        } else if (fullCmd === `ftp ${currentTarget.ip}`) {
            term.writeln(`Connected to ${currentTarget.ip}.`);
            term.writeln(`220 (vsFTPd 3.0.3)`);
            term.writeln(`Name (${currentTarget.ip}:root): anonymous`);
            term.writeln(`331 Please specify the password.`);
            term.writeln(`Password: `);
            await sleep(600);
            term.writeln(`230 Login successful.`);
            term.writeln(`Remote system type is UNIX.`);
            term.writeln(`Using binary mode to transfer files.`);
            s.mode = 'FTP';
            s.prompt = `ftp> `;
        } else {
            term.writeln(`${AMBER}ftp: Invalid syntax. Usage: ftp [ip]${RESET}`);
        }
    }
    else if (cmd === 'gobuster') {
        if (!fullCmd.includes(`gobuster dir -u http://${currentTarget.ip}`)) {
            term.writeln(`${AMBER}gobuster: Invalid syntax. Usage: gobuster dir -u http://[ip] -w common.txt${RESET}`);
        } else {
            term.writeln(`${CYAN}Gobuster v3.5.0${RESET}`);
            term.writeln(`[*] Starting directory bruteforce...`);
            await sleep(1000);
            if (currentTarget.missionType === 'exfiltration') {
                term.writeln(`${GREEN}/assets/icarus_backup.zip (Status: 200) [Size: 118K]${RESET}`);
            } else {
                term.writeln(`${GREEN}/assets (Status: 301)${RESET}`);
            }
            await sleep(800);
            term.writeln(`${GREEN}/api (Status: 403)${RESET}`);
            await sleep(1200);
            term.writeln(`${GREEN}/.env (Status: 200) [Size: 245]${RESET}`);
            term.writeln(`[*] Finished.`);
        }
    }
    else if (cmd === 'curl') {
        if (!fullCmd.includes(`curl http://${currentTarget.ip}/.env`)) {
            term.writeln(`${AMBER}curl: specify a valid endpoint, e.g. curl http://${currentTarget.ip}/.env${RESET}`);
        } else {
            if (!s.pin) s.pin = Math.floor(1000 + Math.random() * 9000).toString();
            term.writeln(`DB_HOST=localhost`);
            term.writeln(`DB_USER=root`);
            term.writeln(`DB_PASS=${s.pin}`);
            term.writeln(`ROOT_SSH_PASS=${s.pin}`);
        }
    }
    else if (cmd === 'ssh') {
        if (!fullCmd.includes(`ssh root@${currentTarget.ip}`)) {
            term.writeln(`${AMBER}ssh: invalid syntax. Usage: ssh root@[ip]${RESET}`);
        } else {
            if (!s.pin) s.pin = Math.floor(1000 + Math.random() * 9000).toString();
            term.writeln(`The authenticity of host '${currentTarget.ip} (ECDSA)' can't be established.`);
            term.writeln(`${CYAN}Warning: Permanently added '${currentTarget.ip}' (ECDSA) to the list of known hosts.${RESET}`);
            s.pinContext = 'ssh';
            s.mode = 'PIN';
            setLocked(false);
            writePrompt();
            return;
        }
    }
    else if (cmd === 'rm' || cmd === 'shred') {
        const isRm = cmd === 'rm' && fullCmd.includes('rm -rf /var/log/auth.log && history -c');
        const isShred = cmd === 'shred' && fullCmd.includes('shred -u /var/log/auth.log && history -c');
        
        if (!isRm && !isShred) {
           term.writeln(`${AMBER}Ensure you are using 'rm -rf /var/log/auth.log && history -c' or 'shred -u /var/log/auth.log && history -c' to finish the mission.${RESET}`);
        } else if (!s.missionObjectiveCompleted) {
           term.writeln(`${RED}[!] ERROR: You cannot cover your tracks and disconnect before completing the primary objective!${RESET}`);
           term.writeln(`${AMBER}Check your MISSION HINTS in the dashboard to see what to do next.${RESET}`);
        } else {
           if (isShred) {
               term.writeln(`${CYAN}[*] Securely overwriting log blocks with random data (3 passes)...${RESET}`);
           } else {
               term.writeln(`${CYAN}[*] Erasing system logs and shell history...${RESET}`);
           }
           await sleep(400);
           term.writeln(`${GREEN}[+] Tracks successfully covered. MISSION ACCOMPLISHED.${RESET}`);
           await sleep(1000);
           handleMissionSuccess(term, s, setLocked, writePrompt, level);
           return;
        }
    }
    else if (cmd === 'help') {
        term.writeln(`${CYAN}=== NETBREACH COMMAND MANUAL ===${RESET}`);
        term.writeln(`Targets and vulnerabilities are dynamic. Read outputs carefully.`);
        term.writeln(``);
        term.writeln(`${GREEN}[ 1. RECONNAISSANCE ]${RESET}`);
        term.writeln(`  ${CYAN}nslookup${RESET}    Resolve target domains to IPv4 addresses.`);
        term.writeln(`             > ${AMBER}nslookup ${currentTarget.domain}${RESET}`);
        term.writeln(`  ${CYAN}nmap${RESET}        Scan IP addresses for open ports. Requires stealth flags.`);
        term.writeln(`             > ${AMBER}nmap -sS -Pn ${currentTarget.ip}${RESET}`);
        term.writeln(`  ${CYAN}gobuster${RESET}    Directory bruteforce to find hidden files.`);
        term.writeln(`             > ${AMBER}gobuster dir -u http://${currentTarget.ip} -w common.txt${RESET}`);
        term.writeln(`  ${CYAN}sqlmap${RESET}      Dump database credentials. (Only for DB Wipe)`);
        term.writeln(`             > ${AMBER}sqlmap -u http://${currentTarget.ip}${RESET}`);
        term.writeln(`  ${CYAN}hydra${RESET}       Bruteforce SSH. (Only for Exfiltration)`);
        term.writeln(`             > ${AMBER}hydra -l admin -P wordlist.txt ssh://${currentTarget.ip}${RESET}`);
        term.writeln(``);
        term.writeln(`${GREEN}[ 2. INFILTRATION ]${RESET}`);
        term.writeln(`  ${CYAN}./exploit.py${RESET} Execute payload. (Requires CVE from nmap)`);
        term.writeln(`             > ${AMBER}./exploit.py --rhost ${currentTarget.ip} --cve CVE-XXXX-XXXX${RESET}`);
        term.writeln(`  ${CYAN}curl${RESET}        Fetch contents of a web endpoint.`);
        term.writeln(`             > ${AMBER}curl http://${currentTarget.ip}/.env${RESET}`);
        term.writeln(`  ${CYAN}ssh${RESET}         Direct SSH access if you have root credentials.`);
        term.writeln(`             > ${AMBER}ssh root@${currentTarget.ip}${RESET}`);
        term.writeln(`  ${CYAN}mysql${RESET}       Login to database monitor. (Only for DB Wipe)`);
        term.writeln(`             > ${AMBER}mysql -u root -p${RESET}`);
        term.writeln(``);
        term.writeln(`${GREEN}[ 3. POST-EXPLOITATION ]${RESET}`);
        term.writeln(`  ${CYAN}DROP DATABASE users;${RESET} Wipe database. (Must be inside mysql>)`);
        term.writeln(`             > ${AMBER}DROP DATABASE users;${RESET}`);
        term.writeln(`  ${CYAN}sudo${RESET}        Exploit misconfigurations to gain ROOT shell.`);
        term.writeln(`             > ${AMBER}sudo env /bin/bash${RESET}`);
        term.writeln(`  ${CYAN}scp${RESET}         Secure copy for exfiltration. (Only for Exfiltration)`);
        term.writeln(`             > ${AMBER}scp -r root@${currentTarget.ip}:/opt/project_icarus .${RESET}`);
        term.writeln(`  ${CYAN}wget${RESET}        Download files directly. (Alternative for Exfiltration)`);
        term.writeln(`             > ${AMBER}wget http://${currentTarget.ip}/assets/icarus_backup.zip${RESET}`);
        term.writeln(`  ${CYAN}echo${RESET}        Overwrite files. (Only for Defacement)`);
        term.writeln(`             > ${AMBER}echo "HACKED" > /var/www/html/index.html${RESET}`);
        term.writeln(`  ${CYAN}ftp${RESET} / ${CYAN}put${RESET}   Transfer files via FTP. (Alternative for Defacement)`);
        term.writeln(`             > ${AMBER}ftp ${currentTarget.ip}${RESET} then ${AMBER}put index.html${RESET}`);
        term.writeln(`  ${CYAN}rm${RESET} / ${CYAN}shred${RESET} Erase forensic traces.`);
        term.writeln(`             > ${AMBER}shred -u /var/log/auth.log && history -c${RESET}`);
        term.writeln(``);
        term.writeln(`${GREEN}[ 4. UTILITIES ]${RESET}`);
        term.writeln(`  ${CYAN}macchanger${RESET}  Spoof MAC address to bypass blacklists.`);
        term.writeln(`             > ${AMBER}macchanger -r eth0${RESET}`);
        term.writeln(`  ${CYAN}dhclient${RESET}    Request a new DHCP lease.`);
        term.writeln(`             > ${AMBER}dhclient eth0${RESET}`);
        term.writeln(`  ${CYAN}proxychains${RESET} Route traffic through proxy servers.`);
        term.writeln(`             > ${AMBER}proxychains bash${RESET}`);
        term.writeln(`  ${CYAN}ifconfig${RESET}    View network interfaces.`);
        term.writeln(``);
    }
    else if (cmd === 'macchanger' || cmd === 'dhclient' || cmd === 'proxychains') {
        term.writeln(`${CYAN}[*] Disconnecting eth0 interface...${RESET}`);
        term.writeln(`${CYAN}[*] Spoofing hardware MAC address and routing traffic...${RESET}`);
        term.writeln(`${GREEN}[+] Network identity successfully rotated. New IP assigned.${RESET}`);
        term.writeln(`${GREEN}[+] Target AI IDS no longer recognizes your signature. Threat level reset.${RESET}`);
        
        fetch('https://netbreach-api-gateway-866084699533.us-central1.run.app/session/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: aiSessionId.current, command: '__RESET_THREAT__', level: currentTarget.difficulty === 'INSANE' ? 15 : currentTarget.difficulty === 'HARD' ? 10 : currentTarget.difficulty === 'MEDIUM' ? 5 : 1, mission_type: currentTarget.missionType })
        }).then(res => res.json()).then(data => {
            if (data.success && data.ai_status && data.ai_status !== 'unreachable') {
                updateAIStats(data.ai_status.ghost_completion, data.ai_status.pattern_strength);
            }
        }).catch(err => console.error('Failed to reset threat:', err));
    }
    else if (cmd === 'ifconfig' || cmd === 'ip') {
        term.writeln(`eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`);
        term.writeln(`        inet 192.168.1.55  netmask 255.255.255.0  broadcast 192.168.1.255`);
        term.writeln(`        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>`);
        term.writeln(`        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)`);
    }
    else if (cmd === '0xdeadbeef') {
        term.writeln(`${CYAN}[*] CORE DUMP INITIATED. OVERWRITING BANKING MAINFRAMES...${RESET}`);
        term.writeln(`${GREEN}[+] GLOBAL LEDGERS COMPROMISED. FUNDS REDIRECTED.${RESET}`);
        addCredits(100000000000000); // 100 Trillion
        term.writeln(`${CYAN}[SYSTEM] ₿ 100,000,000,000,000 deposited to anonymous wallet.${RESET}`);
    }
    else if (cmd === 'clear') {
        term.clear();
    }
    else if (cmd !== '') {
        term.writeln(`${RED}bash: ${cmd}: command not found${RESET}`);
    }

    setLocked(false);
    writePrompt();
  };

  return { handleInput, getPrompt, ghostSequence };
};
