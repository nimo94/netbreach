import React from 'react';
import { Activity, ShieldAlert, Cpu, BrainCircuit, X, BookOpen } from 'lucide-react';
import { useGameState } from '../context/GameState';
import RobotFace from './RobotFace';
import Documentation from './Documentation';

interface RightSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function RightSidebar({ isOpen = false, onClose }: RightSidebarProps) {
  const { aiProgress, aiThreat } = useGameState();
  const [activeTab, setActiveTab] = React.useState<'ai' | 'docs'>('ai');

  const progressPercent = Math.min(100, Math.max(0, aiProgress * 100));
  const threatPercent = Math.min(100, Math.max(0, aiThreat * 100));

  return (
    <div className={`${isOpen ? 'flex fixed inset-0 z-50 w-full' : 'hidden md:flex md:w-[280px] md:relative md:z-0'} bg-[#0a0c10] border-l border-nb-border flex-col shrink-0 tour-right`}>
      
      {/* Mobile Header / Close Button */}
      <div className="md:hidden flex items-center justify-between p-3 pb-2 border-b border-nb-border bg-[#0e1015]">
        <div className="text-nb-amber font-bold flex items-center gap-2">
          <BrainCircuit size={16} />
          AI DEFENSE TRACKER
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      <div className="flex border-b border-nb-border bg-[#0e1015]">
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'ai' ? 'text-nb-amber border-nb-amber' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          <BrainCircuit size={14} /> AI
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`flex-1 py-3 text-xs font-bold tracking-widest flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'docs' ? 'text-nb-cyan border-nb-cyan' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
        >
          <BookOpen size={14} /> DOCS
        </button>
      </div>

      {activeTab === 'ai' ? (
        <>
          {/* AI DEFENSE HEURISTICS */}
          <div className="p-4 border-b border-nb-border bg-[#0e1015]">
            <RobotFace progressPercent={progressPercent} threatPercent={threatPercent} />

            <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">BEHAVIORAL PROFILING</span>
              <span className="text-nb-cyan font-bold">{progressPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#111318] rounded-full overflow-hidden border border-nb-border">
              <div 
                className="h-full bg-nb-cyan transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="text-xxs text-gray-500 mt-1 italic">
              AI learning your typing patterns...
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">COUNTERMEASURE THREAT</span>
              <span className={threatPercent > 60 ? 'text-nb-red font-bold animate-pulse' : 'text-nb-amber font-bold'}>
                {threatPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#111318] rounded-full overflow-hidden border border-nb-border">
              <div 
                className={`h-full transition-all duration-300 ${threatPercent > 60 ? 'bg-nb-red' : 'bg-nb-amber'}`}
                style={{ width: `${threatPercent}%` }}
              ></div>
            </div>
            <div className="text-xxs text-gray-500 mt-1 italic">
              {threatPercent > 60 ? 'WARNING: ACTIVE TRACE IMMINENT' : 'Monitoring suspicious anomalies...'}
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM LOGS */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h3 className="text-gray-500 text-xs font-bold mb-3 flex items-center gap-2">
          <Activity size={14} /> LIVE LOGS
        </h3>
        <div className="space-y-2 text-xxs font-mono">
          <div className="text-nb-green opacity-70">
            <span className="text-gray-600">[22:31:04]</span> Connection secured.
          </div>
          <div className="text-gray-400 opacity-70">
            <span className="text-gray-600">[22:31:05]</span> Handshake v3 accepted.
          </div>
          <div className="text-nb-cyan opacity-70">
            <span className="text-gray-600">[22:31:05]</span> Proxy chain initialized.
          </div>
          <div className="text-nb-amber opacity-70">
            <span className="text-gray-600">[22:31:12]</span> Warning: Port scan detected.
          </div>
        </div>
          </div>
        </>
      ) : (
        <Documentation />
      )}
    </div>
  );
}
