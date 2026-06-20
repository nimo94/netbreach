import React from 'react';
import { Server, Wrench, User, ShieldAlert, Database, Globe, X } from 'lucide-react';
import { useGameState } from '../context/GameState';

interface LeftSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default React.memo(function LeftSidebar({ isOpen = false, onClose }: LeftSidebarProps) {
  const { currentTarget, level, inventory, hasItem, username } = useGameState();

  const getMissionIcon = (type: string) => {
    switch(type) {
      case 'exfiltration': return <Database size={14} className="text-nb-cyan" />;
      case 'db_wipe': return <ShieldAlert size={14} className="text-nb-red" />;
      case 'defacement': return <Globe size={14} className="text-nb-amber" />;
      default: return <Server size={14} />;
    }
  };

  const getMissionLabel = (type: string) => {
    switch (type) {
      case 'exfiltration': return 'Data Exfiltration';
      case 'defacement': return 'Web Defacement';
      case 'db_wipe': return 'DB Deletion';
      default: return 'Hack';
    }
  };

  return (
    <div className={`${isOpen ? 'flex fixed inset-0 z-50 w-full' : 'hidden md:flex md:w-[220px] md:relative md:z-0'} shrink-0 bg-nb-panel-bg border-r border-nb-border flex-col p-3 overflow-y-auto custom-scrollbar tour-left`}>
      
      {/* Mobile Header / Close Button */}
      <div className="md:hidden flex items-center justify-between mb-4 pb-2 border-b border-nb-border">
        <div className="text-nb-green font-bold flex items-center gap-2">
          <User size={16} />
          IDENTITY & LOADOUT
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Missions Section */}
      <div className="mb-6">
        <div className="text-xxs uppercase text-gray-500 tracking-wider mb-2 font-bold flex justify-between">
          <span>MISSION QUEUE</span>
          <span className="text-nb-cyan">LVL {level}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-col p-2 bg-nb-green/10 border border-nb-green/30 rounded-sm">
            <div className="flex items-center gap-2 text-nb-green font-bold mb-1">
              {getMissionIcon(currentTarget.missionType)}
              <span className="truncate text-sm">LVL {level}: {currentTarget.domain}</span>
              <span className="ml-auto text-[9px] bg-nb-green text-nb-term-bg px-1 rounded-sm">ACTIVE</span>
            </div>
            <div className="text-[10px] text-nb-green/70 font-mono flex justify-between">
               <span>{getMissionLabel(currentTarget.missionType)}</span>
               <span>{currentTarget.difficulty}</span>
            </div>
          </div>
          
          {level > 1 && (
            <div className="flex items-center gap-2 p-1.5 mt-1 text-gray-500 rounded-sm opacity-60">
              <Server size={14} />
              <span className="truncate text-xs">Previous Target</span>
              <span className="ml-auto text-[9px] border border-gray-600 px-1 rounded-sm">WIPED</span>
            </div>
          )}
        </div>
      </div>

      {/* Tools Section */}
      <div className="mb-6">
        <div className="text-xxs uppercase text-gray-500 tracking-wider mb-2 font-bold">LOADOUT</div>
        <div className="flex flex-col gap-1">
          {/* Base Tools */}
          <div className="flex items-center justify-between p-1.5 text-gray-300">
            <div className="flex items-center gap-2">
              <Wrench size={14} className="text-gray-400" />
              <span>Nmap Scanner</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-1.5 text-gray-300">
            <div className="flex items-center gap-2">
              <Wrench size={14} className="text-gray-400" />
              <span>Hydra & SQLMap</span>
            </div>
          </div>

          {/* Purchased Tools */}
          {hasItem('proxy_chain') ? (
            <div className="flex items-center justify-between p-1.5 text-nb-cyan">
              <div className="flex items-center gap-2">
                <Wrench size={14} />
                <span>Proxy Chain v3</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-1.5 text-gray-600 opacity-60">
              <div className="flex items-center gap-2">
                <Wrench size={14} />
                <span>Proxy Chain v3</span>
              </div>
              <span className="text-[9px] text-nb-red border border-nb-red px-1 rounded-sm">LOCKED</span>
            </div>
          )}

          {hasItem('auto_scraper') ? (
            <div className="flex items-center justify-between p-1.5 text-nb-cyan">
              <div className="flex items-center gap-2">
                <Wrench size={14} />
                <span>Memory Scraper</span>
              </div>
            </div>
          ) : (
             <div className="flex items-center justify-between p-1.5 text-gray-600 opacity-60">
              <div className="flex items-center gap-2">
                <Wrench size={14} />
                <span>Memory Scraper</span>
              </div>
              <span className="text-[9px] text-nb-red border border-nb-red px-1 rounded-sm">LOCKED</span>
            </div>
          )}

          {hasItem('zero_day') ? (
            <div className="flex items-center justify-between p-1.5 text-nb-amber font-bold">
              <div className="flex items-center gap-2">
                <Wrench size={14} />
                <span>0-Day Exploit DB</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-1.5 text-gray-600 opacity-60">
              <div className="flex items-center gap-2">
                <Wrench size={14} />
                <span>0-Day Exploit DB</span>
              </div>
              <span className="text-[9px] text-nb-red border border-nb-red px-1 rounded-sm">LOCKED</span>
            </div>
          )}
        </div>
      </div>

      {/* Aliases Section */}
      <div className="mt-auto">
        <div className="text-xxs uppercase text-gray-500 tracking-wider mb-2 font-bold">IDENTITY</div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 p-1.5 text-nb-green font-bold bg-nb-green/5 rounded border border-nb-green/20">
            <User size={14} />
            <span className="text-sm">{username}@netbreach</span>
          </div>
          <div className="px-2 pt-1 text-[10px] text-gray-500 font-mono">
            Status: Undetected<br/>
            Uplink: Secure TLSv1.3<br/>
            Rank: {level > 10 ? 'Elite' : level > 5 ? 'Pro' : 'Script Kiddie'}
          </div>
        </div>
      </div>
    </div>
  );
});
