import React from 'react';
import { Target, Server, ShieldAlert, PlayCircle, CheckCircle } from 'lucide-react';
import { useGameState, LEVEL_PROGRESSION } from '../context/GameState';

export default function Levels({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { level: currentActiveLevel, playLevel } = useGameState();

  const handlePlayLevel = (lvl: number) => {
    playLevel(lvl);
    setActiveTab('Terminal');
  };

  return (
    <div className="flex-1 bg-nb-term-bg p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-nb-green mb-6 border-b border-nb-border pb-4 flex items-center gap-3">
          <Target size={28} />
          GLOBAL TARGET DATABASE
        </h2>
        
        <div className="mb-6 text-gray-400">
          Select any available target below to initiate a remote connection. Targets scale in difficulty.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
            const progression = LEVEL_PROGRESSION[(lvl - 1) % LEVEL_PROGRESSION.length];
            const diff = progression.difficulty;
            const isActive = lvl === currentActiveLevel;
            
            return (
              <div 
                key={lvl} 
                className={`border p-4 flex flex-col relative group transition-all ${
                  isActive 
                    ? 'border-nb-green bg-[#0e1216] shadow-[0_0_15px_rgba(74,222,128,0.15)]' 
                    : 'border-nb-border bg-[#0a0c10] hover:border-nb-cyan hover:bg-[#0d1015]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-nb-green text-black font-bold text-[9px] px-2 py-0.5 rounded-bl">
                    CURRENT TARGET
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-bold text-lg ${isActive ? 'text-nb-green' : 'text-gray-300 group-hover:text-nb-cyan'}`}>
                    LEVEL {lvl}
                  </h3>
                  {diff === 'EASY' && <span className="text-xxs text-nb-green border border-nb-green/30 px-1.5 rounded bg-nb-green/10">EASY</span>}
                  {diff === 'MEDIUM' && <span className="text-xxs text-[#3b82f6] border border-[#3b82f6]/30 px-1.5 rounded bg-[#3b82f6]/10">MEDIUM</span>}
                  {diff === 'HARD' && <span className="text-xxs text-nb-amber border border-nb-amber/30 px-1.5 rounded bg-nb-amber/10">HARD</span>}
                  {diff === 'INSANE' && <span className="text-xxs text-nb-red border border-nb-red/30 px-1.5 rounded bg-nb-red/10 animate-pulse">INSANE</span>}
                </div>

                <div className="text-xs text-gray-500 font-mono mb-4 flex-1">
                  Payout: {15 * lvl}.00 BTC<br/>
                  Objective: {progression.missionType.toUpperCase()}<br/>
                  Trace Defense: {lvl * 10}ms
                </div>

                <button 
                  onClick={() => handlePlayLevel(lvl)}
                  className={`flex items-center justify-center gap-2 w-full py-1.5 text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-nb-green text-black' 
                      : 'border border-gray-600 text-gray-400 group-hover:border-nb-cyan group-hover:text-nb-cyan group-hover:bg-nb-cyan/10'
                  }`}
                >
                  {isActive ? <Server size={14} /> : <PlayCircle size={14} />}
                  {isActive ? 'RECONNECT' : 'INITIATE HACK'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
