import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export type InventoryItem = 
  | 'net_scanner' 
  | 'zero_day' 
  | 'key_logger' 
  | 'hydra_injector' 
  | 'sql_automator' 
  | 'log_wiper' 
  | 'proxy_chain' 
  | 'trace_obfuscator' 
  | 'auto_scraper';
export type MissionType = 'exfiltration' | 'defacement' | 'db_wipe';
export type AppState = 'menu' | 'playing';
export type MultiplayerMode = 'single' | 'coop' | 'pvp' | 'speedrun';

interface Target {
  domain: string;
  ip: string;
  difficulty: string;
  missionType: MissionType;
}

interface GameState {
  appState: AppState;
  multiplayerMode: MultiplayerMode;
  lobbyCode: string | null;
  isHost: boolean;
  credits: number;
  level: number;
  inventory: InventoryItem[];
  username: string;
  currentTarget: Target;
  aiProgress: number;
  aiThreat: number;
  setAppState: (state: AppState) => void;
  setMultiplayerState: (mode: MultiplayerMode, code: string | null, host: boolean) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  levelUp: () => void;
  playLevel: (targetLevel: number) => void;
  buyItem: (item: InventoryItem, cost: number) => boolean;
  hasItem: (item: InventoryItem) => boolean;
  updateAIStats: (progress: number, threat: number) => void;
  setExactTarget: (target: Target) => void;
  setUsername: (name: string) => void;
  deleteAccount: () => void;
  hasPlayedBefore: boolean;
  victimLogs: string[];
  addVictimLog: (log: string) => void;
}

const DOMAINS = [
  'omnicorp.local', 'cyberdine.sys', 'megatech.net', 'tyrell.corp', 
  'weyland.ind', 'arasaka.corp', 'militech.sys', 'biotechnica.net',
  'ghost.sec', 'neural.net', 'mainframe.gov', 'bank.corp'
];

const MISSION_TYPES: MissionType[] = ['exfiltration', 'defacement', 'db_wipe'];

export const LEVEL_PROGRESSION: { missionType: MissionType, difficulty: string }[] = [
  { missionType: 'defacement', difficulty: 'EASY' },
  { missionType: 'exfiltration', difficulty: 'EASY' },
  { missionType: 'db_wipe', difficulty: 'MEDIUM' },
  { missionType: 'defacement', difficulty: 'MEDIUM' },
  { missionType: 'exfiltration', difficulty: 'HARD' },
  { missionType: 'db_wipe', difficulty: 'HARD' },
  { missionType: 'defacement', difficulty: 'INSANE' },
  { missionType: 'exfiltration', difficulty: 'INSANE' },
  { missionType: 'db_wipe', difficulty: 'INSANE' }
];

const generateTarget = (level: number): Target => {
  const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
  const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
  
  const progression = LEVEL_PROGRESSION[(level - 1) % LEVEL_PROGRESSION.length];
  return { domain, ip, difficulty: progression.difficulty, missionType: progression.missionType };
};

const GameStateContext = createContext<GameState | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage or defaults
  const [credits, setCredits] = useState(() => {
    const saved = localStorage.getItem('nb_credits');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [level, setLevel] = useState(() => {
    const saved = localStorage.getItem('nb_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('nb_inventory');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTarget, setCurrentTarget] = useState<Target>(() => {
    const saved = localStorage.getItem('nb_target');
    // Ensure backwards compatibility if missionType wasn't saved before
    const parsed = saved ? JSON.parse(saved) : generateTarget(1);
    if (!parsed.missionType) parsed.missionType = 'exfiltration';
    return parsed;
  });

  const [username, setUsername] = useState<string>('ghost');
  const [authLoaded, setAuthLoaded] = useState(false);
  const skipNextSave = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            skipNextSave.current = true; // Prevent the loaded data from instantly saving back unnecessarily
            if (data.credits !== undefined) setCredits(data.credits);
            if (data.level !== undefined) {
              setLevel(data.level);
              setCurrentTarget(generateTarget(data.level));
            }
            if (data.inventory !== undefined) setInventory(data.inventory);
            if (data.username !== undefined) setUsername(data.username);
          }
        } catch (e) {
          console.error("Failed to load cloud state", e);
        }
      }
      setAuthLoaded(true);
    });
    return unsub;
  }, []);

  const [appState, setAppStateState] = useState<AppState>(() => {
    const savedApp = localStorage.getItem('nb_appState') as AppState;
    const savedMode = localStorage.getItem('nb_multiplayerMode') as MultiplayerMode;
    // Only auto-resume into playing if they are in singleplayer mode, as lobbies are lost on reload
    if (savedMode === 'single' && savedApp === 'playing') return 'playing';
    return 'menu';
  });
  
  const [multiplayerMode, setMultiplayerModeState] = useState<MultiplayerMode>(() => {
    const savedMode = localStorage.getItem('nb_multiplayerMode') as MultiplayerMode;
    return savedMode === 'single' ? 'single' : 'single'; // always fallback to single mode on reload
  });
  
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const setAppState = (state: AppState) => {
    localStorage.setItem('nb_appState', state);
    setAppStateState(state);
  };

  // AI Tracking state
  const [aiProgress, setAiProgress] = useState(() => {
    const saved = localStorage.getItem('nb_ai_progress');
    return saved ? parseFloat(saved) : 0;
  });
  const [aiThreat, setAiThreat] = useState(0);
  const [victimLogs, setVictimLogs] = useState<string[]>([
    "[sshd] Accepted publickey for root from 192.168.1.42 port 54312 ssh2",
    "[kernel] TCP: Treason uncloaked! Peer 192.168.1.42:54312/22 shrunk window"
  ]);

  const addVictimLog = (log: string) => {
    setVictimLogs(prev => {
      const updated = [...prev, log];
      if (updated.length > 5) return updated.slice(updated.length - 5);
      return updated;
    });
  };

  // Autosave whenever state changes
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    localStorage.setItem('nb_credits', credits.toString());
    localStorage.setItem('nb_level', level.toString());
    localStorage.setItem('nb_inventory', JSON.stringify(inventory));
    localStorage.setItem('nb_target', JSON.stringify(currentTarget));
    localStorage.setItem('nb_ai_progress', aiProgress.toString());
    
    if (authLoaded && auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), {
        credits,
        level,
        inventory,
        username
      }, { merge: true }).catch(e => console.error("Cloud save failed", e));
    }
  }, [credits, level, inventory, currentTarget, username, authLoaded, aiProgress]);

  const setMultiplayerState = (mode: MultiplayerMode, code: string | null, host: boolean) => {
    localStorage.setItem('nb_multiplayerMode', mode);
    setMultiplayerModeState(mode);
    setLobbyCode(code);
    setIsHost(host);
  };

  const addCredits = (amount: number) => setCredits(c => c + amount);
  
  const spendCredits = (amount: number) => {
    if (credits >= amount) {
      setCredits(c => c - amount);
      return true;
    }
    return false;
  };

  const levelUp = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setCurrentTarget(generateTarget(newLevel));
  };

  const playLevel = (targetLevel: number) => {
    setLevel(targetLevel);
    setCurrentTarget(generateTarget(targetLevel));
  };

  const buyItem = (item: InventoryItem, cost: number) => {
    if (!inventory.includes(item) && spendCredits(cost)) {
      setInventory(prev => [...prev, item]);
      return true;
    }
    return false;
  };

  const hasItem = (item: InventoryItem) => inventory.includes(item);

  const updateAIStats = (progress: number, threat: number) => {
    setAiProgress(progress);
    setAiThreat(threat);
  };

  const deleteAccount = async () => {
    const aiSession = localStorage.getItem('nb_ai_session');
    
    // Wipe AI memory on the backend if session exists
    if (aiSession) {
      try {
        await fetch('https://netbreach-api-gateway-866084699533.us-central1.run.app/session/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: aiSession, command: '__HARD_RESET__', level: 1, mission_type: 'default' })
        });
      } catch (e) {
        console.error("Failed to reset AI memory", e);
      }
    }

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid));
        await auth.currentUser.delete();
      } catch (e) {
        console.error("Failed to delete cloud account", e);
      }
      try {
        await auth.signOut();
      } catch (e) {}
    }
    
    localStorage.clear();
    window.location.reload();
  };

  const setExactTarget = (target: Target) => {
    setCurrentTarget(target);
  };

  const hasPlayedBefore = localStorage.getItem('nb_credits') !== null;

  return (
    <GameStateContext.Provider value={{
      appState, multiplayerMode, lobbyCode, isHost, setAppState, setMultiplayerState,
      credits, level, inventory, username, currentTarget, aiProgress, aiThreat, 
      addCredits, spendCredits, levelUp, playLevel, buyItem, hasItem, updateAIStats, setExactTarget, setUsername,
      deleteAccount,
      hasPlayedBefore,
      victimLogs, addVictimLog
    }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
