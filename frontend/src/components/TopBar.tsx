import React from 'react';
import { Terminal as TerminalIcon, Coins, Flame, User, BrainCircuit, Target } from 'lucide-react';
import { useGameState } from '../context/GameState';

export type MobilePanel = 'none' | 'left' | 'right' | 'bottom';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeMobilePanel: MobilePanel;
  setActiveMobilePanel: (panel: MobilePanel) => void;
}

export default function TopBar({ activeTab, setActiveTab, activeMobilePanel, setActiveMobilePanel }: TopBarProps) {
  const { credits, level, currentTarget } = useGameState();
  const tabs = ['Terminal', 'Inventory', 'Levels', 'Dark Web', 'Settings', 'AI Metrics', 'Documentation'];

  const togglePanel = (panel: MobilePanel) => {
    setActiveMobilePanel(activeMobilePanel === panel ? 'none' : panel);
  };

  return (
    <div className="h-auto md:h-10 bg-[#0a0c10] border-b border-nb-border flex flex-col md:flex-row md:items-center justify-between shrink-0 select-none">
      
      {/* Mobile Top Row */}
      <div className="flex items-center justify-between px-4 h-10 w-full md:w-auto md:border-r md:border-nb-border">
        <div className="flex items-center gap-2 text-nb-green font-bold tracking-widest h-full">
          <TerminalIcon size={16} />
          <span>NETBREACH</span>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex items-center gap-4 md:hidden">
          <button onClick={() => togglePanel('left')} className={`${activeMobilePanel === 'left' ? 'text-nb-green' : 'text-gray-500'} hover:text-white transition-colors`}>
            <User size={18} />
          </button>
          <button onClick={() => togglePanel('right')} className={`${activeMobilePanel === 'right' ? 'text-nb-amber' : 'text-gray-500'} hover:text-white transition-colors`}>
            <BrainCircuit size={18} />
          </button>
          <button onClick={() => togglePanel('bottom')} className={`${activeMobilePanel === 'bottom' ? 'text-nb-cyan' : 'text-gray-500'} hover:text-white transition-colors`}>
            <Target size={18} />
          </button>
        </div>
      </div>

      {/* Tabs - Scrollable horizontally on mobile */}
      <div className="flex h-10 overflow-x-auto custom-scrollbar md:flex-1 md:ml-4 border-t border-nb-border md:border-t-0 bg-[#0e1015] md:bg-transparent">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 shrink-0 h-full flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-nb-green text-white bg-nb-term-bg font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#111318]'
            } ${tab === 'Levels' ? 'tour-levels-tab' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Right side - STATS (Hidden on mobile to save space) */}
      <div className="hidden md:flex items-center gap-6 h-full px-4 border-l border-nb-border">
        <div className="flex items-center gap-2 h-full">
          <Flame size={14} className={
            currentTarget.difficulty === 'EASY' ? 'text-nb-green' : 
            currentTarget.difficulty === 'MEDIUM' ? 'text-nb-amber' : 
            'text-nb-red'
          } />
          <span className="text-gray-400">THREAT LEVEL:</span>
          <span className="text-white font-bold">{currentTarget.difficulty} (Lvl {level})</span>
        </div>
        <div className="flex items-center gap-2 text-nb-green h-full">
          <Coins size={14} />
          <span className="font-bold">₿ {credits.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
