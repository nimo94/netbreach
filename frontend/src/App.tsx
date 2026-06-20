import React, { useState, useCallback, useEffect } from 'react';
// @ts-ignore
import { Joyride, Step } from 'react-joyride';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import BottomBar from './components/BottomBar';
import Terminal from './components/Terminal';
import DarkWeb from './components/DarkWeb';
import Levels from './components/Levels';
import Settings from './components/Settings';
import AIMetrics from './components/AIMetrics';
import Documentation from './components/Documentation';
import MainMenu from './components/MainMenu';
import AuthMenu from './components/AuthMenu';
import Inventory from './components/Inventory';
import { GameStateProvider, useGameState } from './context/GameState';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    content: (
      <div className="font-mono text-left">
        <h2 className="text-nb-green font-bold mb-2">SYSTEM INITIALIZED</h2>
        <p className="text-gray-300">Welcome to NETBREACH. You have been connected to the anonymous hacking interface.</p>
      </div>
    )
  },
  {
    target: '.tour-terminal',
    placement: 'center',
    content: (
      <div className="font-mono text-left">
        <h2 className="text-nb-green font-bold mb-2">MAIN WORKSPACE</h2>
        <p className="text-gray-300">This is your terminal. You'll run exploits, scripts, and commands here. Type <strong className="text-nb-amber">help</strong> anytime you get stuck.</p>
      </div>
    ),
  },
  {
    target: '.tour-left',
    placement: 'right',
    content: (
      <div className="font-mono text-left">
        <h2 className="text-nb-green font-bold mb-2">IDENTITY & LOADOUT</h2>
        <p className="text-gray-300">Your digital footprint and purchased hacking tools are shown here. Better tools make harder hacks easier.</p>
      </div>
    ),
  },
  {
    target: '.tour-right',
    placement: 'left',
    content: (
      <div className="font-mono text-left">
        <h2 className="text-nb-green font-bold mb-2">AI IDS MONITOR</h2>
        <p className="text-gray-300">Watch this closely. The target's AI will learn your patterns. If it reaches 100%, you get locked out. Stay unpredictable.</p>
      </div>
    ),
  },
  {
    target: '.tour-bottom',
    placement: 'top',
    content: (
      <div className="font-mono text-left">
        <h2 className="text-nb-green font-bold mb-2">MISSION QUEUE</h2>
        <p className="text-gray-300">Your active objectives, skill levels, and system alerts are tracked here.</p>
      </div>
    ),
  },
  {
    target: '.tour-levels-tab',
    placement: 'bottom',
    content: (
      <div className="font-mono text-left">
        <h2 className="text-nb-green font-bold mb-2">AWAITING ORDERS</h2>
        <p className="text-gray-300">Click the <strong className="text-nb-amber">Levels</strong> tab up here to select your first target and begin your contract. Good luck.</p>
      </div>
    ),
  }
];

function AppContent() {
  const [activeTab, setActiveTab] = useState('Terminal');
  const [activeMobilePanel, setActiveMobilePanel] = useState<'none' | 'left' | 'right' | 'bottom'>('none');
  const { appState, setAppState, setMultiplayerState, currentTarget, level, addCredits, levelUp, hasPlayedBefore, multiplayerMode, lobbyCode, username } = useGameState();
  const [runTour, setRunTour] = useState(!hasPlayedBefore && !lobbyCode);
  
  const [user, loadingAuth] = useAuthState(auth);
  const [authComplete, setAuthComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!loadingAuth && !isInitialized) {
      setIsInitialized(true);
      if (user) {
        setAuthComplete(true);
      }
    }
  }, [loadingAuth, user, isInitialized]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode && joinCode.length === 6) {
      // Set the join code but stay in the menu state so MainMenu can render the lobby!
      setMultiplayerState('coop', joinCode.toUpperCase(), false);
      
      // Clean up URL without refreshing
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({path:newUrl}, '', newUrl);
    }
  }, []);

  const handleMissionComplete = useCallback(() => {
    // Mission complete logic is now handled in Terminal directly
  }, []);

  if (!isInitialized || loadingAuth) {
    return (
      <div className="flex h-screen w-screen bg-[#0a0c10] text-nb-green font-mono text-sm items-center justify-center">
        INITIALIZING SYSTEM ENCRYPTION...
      </div>
    );
  }

  if (!authComplete) {
    return <AuthMenu onComplete={() => setAuthComplete(true)} />;
  }

  if (appState === 'menu') {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-nb-app-bg text-gray-300 font-mono text-xs relative">
        <MainMenu />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-nb-app-bg text-gray-300 font-mono text-xs relative">
      {/* @ts-ignore */}
      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        disableOverlayClose={true}
        spotlightPadding={4}
        styles={{
          options: {
            arrowColor: '#111318',
            backgroundColor: '#111318',
            overlayColor: 'rgba(0, 0, 0, 0.8)',
            primaryColor: '#4ade80',
            textColor: '#d1d5db',
            zIndex: 1000,
          },
          tooltip: {
            border: '1px solid #4ade80',
            borderRadius: '4px',
          },
          buttonNext: {
            backgroundColor: '#111318',
            border: '1px solid #4ade80',
            color: '#4ade80',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: '12px',
            borderRadius: '2px',
          },
          buttonBack: {
            color: '#6b7280',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: '12px',
          },
          buttonSkip: {
            color: '#ef4444',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: '12px',
          }
        } as any}
        callback={(data: any) => {
          if (data.status === 'finished' || data.status === 'skipped') {
            setRunTour(false);
          }
        }}
      />
      
      <TopBar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        activeMobilePanel={activeMobilePanel}
        setActiveMobilePanel={setActiveMobilePanel} 
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
          isOpen={activeMobilePanel === 'left'} 
          onClose={() => setActiveMobilePanel('none')} 
        />

        {activeTab === 'Terminal' ? (
          <div className="flex-1 bg-nb-term-bg relative border-r border-nb-border flex flex-col min-w-0">
            <div className="h-6 flex items-center px-2 border-b border-nb-border bg-[#0e1015] justify-between text-xxs text-gray-500 shrink-0">
              <div className="flex gap-1.5 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-nb-red opacity-80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-nb-amber opacity-80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-nb-green opacity-80"></div>
              </div>
              <div>session://{currentTarget.domain} — {username}</div>
              <div className="flex gap-2">
                <span>TLSv1.3</span>
                <span className="text-nb-cyan">00:04:12</span>
              </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <Terminal 
                onMissionComplete={handleMissionComplete} 
                level={level}
                addCredits={addCredits}
                levelUp={levelUp}
                currentTargetDomain={currentTarget.domain}
                currentTargetIp={currentTarget.ip}
              />
            </div>
          </div>
        ) : activeTab === 'Levels' ? (
          <Levels setActiveTab={setActiveTab} />
        ) : activeTab === 'Inventory' ? (
          <Inventory />
        ) : activeTab === 'Dark Web' ? (
          <DarkWeb />
        ) : activeTab === 'Settings' ? (
          <Settings />
        ) : activeTab === 'AI Metrics' ? (
          <AIMetrics />
        ) : activeTab === 'Documentation' ? (
          <div className="flex-1 bg-nb-term-bg border-r border-nb-border flex flex-col min-w-0">
             <Documentation />
          </div>
        ) : (
          <div className="flex-1 bg-nb-term-bg relative border-r border-nb-border flex flex-col items-center justify-center text-gray-500">
            <div className="text-xl mb-2 text-nb-amber font-bold">SYSTEM OFFLINE</div>
            <div className="text-sm">[{activeTab}] module is currently unavailable.</div>
            <div className="mt-4 text-xxs">Return to Terminal to continue the session.</div>
          </div>
        )}

        <RightSidebar 
          isOpen={activeMobilePanel === 'right'} 
          onClose={() => setActiveMobilePanel('none')} 
        />
      </div>

      <BottomBar 
        isOpen={activeMobilePanel === 'bottom'} 
        onClose={() => setActiveMobilePanel('none')} 
      />
    </div>
  );
}

export default function App() {
  return (
    <GameStateProvider>
      <AppContent />
    </GameStateProvider>
  );
}
