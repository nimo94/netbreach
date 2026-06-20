import React from 'react';
import { Target, AlertTriangle, Lightbulb, Terminal as TerminalIcon, X, Activity } from 'lucide-react';
import { useGameState } from '../context/GameState';

interface BottomBarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default React.memo(function BottomBar({ isOpen = false, onClose }: BottomBarProps) {
  const { level, currentTarget, victimLogs, addVictimLog } = useGameState();
  
  // We optionally add some ambient noise to the victim logs if it's too quiet
  React.useEffect(() => {
    const ambientLogs = [
      "[kernel] TCP connection established: 192.168.1.42:54312 -> 10.0.0.1:22",
      "[systemd] Starting Cleanup of Temporary Directories...",
      "[cron] (root) CMD ( /usr/local/bin/backup.sh >/dev/null )",
      "[sshd] Accepted publickey for root from 192.168.1.42"
    ];

    const interval = setInterval(() => {
      // Only ambient logs occasionally
      if (Math.random() > 0.7) {
        const nextMsg = ambientLogs[Math.floor(Math.random() * ambientLogs.length)];
        addVictimLog(nextMsg);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [addVictimLog]);

  return (
    <div className={`${isOpen ? 'flex fixed inset-0 z-50 w-full overflow-y-auto' : 'hidden md:flex md:h-[180px] md:relative md:z-0'} shrink-0 bg-nb-panel-bg md:border-t md:border-nb-border flex-col md:flex-row md:divide-x divide-y md:divide-y-0 divide-nb-border tour-bottom pb-4 md:pb-0`}>
      
      {/* Mobile Header / Close Button */}
      <div className="md:hidden flex items-center justify-between p-3 pb-2 bg-[#0e1015]">
        <div className="text-nb-cyan font-bold flex items-center gap-2">
          <Target size={16} />
          MISSION DASHBOARD
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Panel 1: Live Target Feed */}
      <div className="flex-1 p-3 flex flex-col justify-center gap-1.5 overflow-hidden">
        <div className="text-xxs uppercase text-gray-500 tracking-wider mb-1 font-bold flex items-center gap-2">
          <Activity size={12} className="text-nb-red animate-pulse" />
          VICTIM LIVE FEED
        </div>
        <div className="flex-1 bg-nb-app-bg border border-nb-border p-2 font-mono text-[9px] leading-relaxed text-gray-400 overflow-hidden flex flex-col justify-end">
          {victimLogs.map((log, i) => (
            <div key={i} className="truncate w-full hover:text-white transition-colors duration-200">
              <span className="text-nb-cyan opacity-50 mr-2">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              {log.toLowerCase().includes('ssh') || log.toLowerCase().includes('auth') || log.includes('DROP') || log.toLowerCase().includes('login') ? <span className="text-nb-amber font-bold">{log}</span> : log.includes('AI') || log.includes('IDS') ? <span className="text-nb-red font-bold">{log}</span> : log}
            </div>
          ))}
        </div>
      </div>

      {/* Panel 2: Active Missions */}
      <div className="flex-1 p-3 flex flex-col">
        <div className="text-xxs uppercase text-gray-500 tracking-wider mb-2 font-bold flex justify-between">
          <span>MISSION QUEUE</span>
          <span className="text-nb-cyan">LVL {level}</span>
        </div>
        
        <div className="bg-nb-hover-bg border border-nb-border p-2 mb-2">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1.5 text-nb-green font-bold">
              <Target size={14} />
              <span className="truncate">{currentTarget.domain}</span>
            </div>
            <div className="text-nb-amber text-xxs font-bold">{15 * level}.00 BTC</div>
          </div>
          <div className="text-gray-400 text-[10px] mb-2 uppercase">
            Objective: {
              currentTarget.missionType === 'exfiltration' ? 'Exfiltrate confidential files' :
              currentTarget.missionType === 'db_wipe' ? 'Wipe target database records' :
              'Deface target web server'
            }
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xxs text-nb-red flex items-center gap-1 animate-pulse">
              <AlertTriangle size={12} />
              <span>FORENSICS WIPEOUT REQ.</span>
            </div>
            <div className="text-gray-500 font-mono font-bold text-xxs">{currentTarget.difficulty}</div>
          </div>
        </div>

      </div>

      {/* Panel 3: Mission Hints */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        <div className="text-xxs uppercase text-gray-500 tracking-wider mb-1 font-bold flex items-center gap-1">
          <Lightbulb size={12} className="text-nb-amber" />
          MISSION HINTS
        </div>
        
        {currentTarget.missionType === 'exfiltration' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-start p-1">
              <TerminalIcon size={14} className="text-nb-cyan shrink-0 mt-0.5" />
              <div>
                <div className="text-gray-300 font-bold mb-0.5 leading-tight text-xs">1. Gain Access</div>
                <div className="text-gray-500 text-[10px] leading-tight">Use <span className="text-nb-cyan font-mono">nmap</span> to find ports, then <span className="text-nb-cyan font-mono">./exploit.py</span> or <span className="text-nb-cyan font-mono">ssh</span> to enter.</div>
              </div>
            </div>
            <div className="flex gap-3 items-start p-1">
              <TerminalIcon size={14} className="text-nb-cyan shrink-0 mt-0.5" />
              <div>
                <div className="text-gray-300 font-bold mb-0.5 leading-tight text-xs">2. Exfiltrate Files</div>
                <div className="text-gray-500 text-[10px] leading-tight">Download the target files using <span className="text-nb-cyan font-mono">scp -r root@[ip]:/opt/project_icarus .</span></div>
              </div>
            </div>
          </div>
        )}

        {currentTarget.missionType === 'db_wipe' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-start p-1">
              <TerminalIcon size={14} className="text-nb-cyan shrink-0 mt-0.5" />
              <div>
                <div className="text-gray-300 font-bold mb-0.5 leading-tight text-xs">1. Dump Credentials</div>
                <div className="text-gray-500 text-[10px] leading-tight">Find SQL injections and dump passwords using <span className="text-nb-cyan font-mono">sqlmap -u http://[ip]</span></div>
              </div>
            </div>
            <div className="flex gap-3 items-start p-1">
              <TerminalIcon size={14} className="text-nb-cyan shrink-0 mt-0.5" />
              <div>
                <div className="text-gray-300 font-bold mb-0.5 leading-tight text-xs">2. Wipe Database</div>
                <div className="text-gray-500 text-[10px] leading-tight">Login via <span className="text-nb-cyan font-mono">mysql -u root -p</span> and drop the users table.</div>
              </div>
            </div>
          </div>
        )}

        {currentTarget.missionType === 'defacement' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-start p-1">
              <TerminalIcon size={14} className="text-nb-cyan shrink-0 mt-0.5" />
              <div>
                <div className="text-gray-300 font-bold mb-0.5 leading-tight text-xs">1. Gain Access</div>
                <div className="text-gray-500 text-[10px] leading-tight">Scan with <span className="text-nb-cyan font-mono">nmap</span>, then breach using <span className="text-nb-cyan font-mono">./exploit.py</span>.</div>
              </div>
            </div>
            <div className="flex gap-3 items-start p-1">
              <TerminalIcon size={14} className="text-nb-cyan shrink-0 mt-0.5" />
              <div>
                <div className="text-gray-300 font-bold mb-0.5 leading-tight text-xs">2. Deface Website</div>
                <div className="text-gray-500 text-[10px] leading-tight">Overwrite the homepage using <span className="text-nb-cyan font-mono">echo "HACKED" &gt; /var/www/html/index.html</span></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 items-start p-1 mt-1 border-t border-nb-border/50 pt-2">
          <TerminalIcon size={14} className="text-nb-green shrink-0 mt-0.5" />
          <div>
            <div className="text-nb-green font-bold mb-0.5 leading-tight text-xs">3. Cover Your Tracks</div>
            <div className="text-gray-500 text-[10px] leading-tight">Always finish by running <span className="text-nb-cyan font-mono">rm -rf /var/log/auth.log && history -c</span></div>
          </div>
        </div>

      </div>

    </div>
  );
});
