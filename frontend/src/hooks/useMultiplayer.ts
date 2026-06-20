import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useGameState } from '../context/GameState';
import { v4 as uuidv4 } from 'uuid';

interface PlayerState {
  id: string;
  isHost: boolean;
  aiProgress: number;
  aiThreat: number;
}

export function useMultiplayer() {
  const { lobbyCode, isHost, aiProgress, aiThreat, setAppState, currentTarget, setExactTarget } = useGameState();
  const [remoteState, setRemoteState] = useState<PlayerState | null>(null);
  const [lobbyStatus, setLobbyStatus] = useState<'waiting' | 'ready' | 'playing'>('waiting');
  const [winner, setWinner] = useState<'host' | 'client' | string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const playerId = useRef(uuidv4());

  useEffect(() => {
    if (!lobbyCode) return;

    const lobbyRef = doc(db, 'lobbies', lobbyCode);

    const initLobby = async () => {
      if (isHost) {
        await setDoc(lobbyRef, {
          mode: 'speedrun',
          status: 'waiting',
          winner: null,
          target: currentTarget,
          players: [{
            id: playerId.current,
            isHost: true,
            aiProgress: 0,
            aiThreat: 0
          }]
        }, { merge: true });
      } else {
        // Client joins the players array
        await updateDoc(lobbyRef, {
          players: arrayUnion({
            id: playerId.current,
            isHost: false,
            aiProgress: 0,
            aiThreat: 0
          })
        }).catch(console.error);
      }
    };

    initLobby();

    const unsubscribe = onSnapshot(lobbyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLobbyStatus(data.status);
        setWinner(data.winner || null);
        
        if (data.players) {
           setPlayerCount(data.players.length);
        }
        
        // If the match was started by the host, transition the app state!
        if (data.status === 'playing') {
          setAppState('playing');
        }

        if (isHost) {
          // Keep marking lobby as ready if we have >1 player
          if (data.players && data.players.length > 1 && data.status === 'waiting') {
             updateDoc(lobbyRef, { status: 'ready' }).catch(console.error);
          }
        } else {
          // Client syncs the target from the host so they both hack the same server
          if (data.target && currentTarget.ip !== data.target.ip) {
             setExactTarget(data.target);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [lobbyCode, isHost]);

  // Sync our local AI stats to the database (simplified for now to avoid array deep updates)
  // We can just rely on who sets 'winner' first for speedrun logic
  
  const startGame = async () => {
    if (!lobbyCode || !isHost) return;
    const lobbyRef = doc(db, 'lobbies', lobbyCode);
    await updateDoc(lobbyRef, { status: 'playing' }).catch(console.error);
  };

  const declareWinner = async () => {
    if (!lobbyCode) return;
    const lobbyRef = doc(db, 'lobbies', lobbyCode);
    // Use our unique ID so everyone knows who won
    await updateDoc(lobbyRef, { winner: playerId.current }).catch(console.error);
  };

  const retryMatch = async () => {
    if (!lobbyCode || !isHost) return;
    const lobbyRef = doc(db, 'lobbies', lobbyCode);
    const domain = `node-${Math.floor(Math.random() * 9999)}.net`;
    const ip = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
    
    const newTarget = {
      domain,
      ip,
      difficulty: currentTarget.difficulty,
      missionType: currentTarget.missionType
    };
    
    setExactTarget(newTarget);
    
    await updateDoc(lobbyRef, { 
      status: 'playing', 
      winner: null,
      target: newTarget
    }).catch(console.error);
  };

  const isWinner = winner === playerId.current;

  return { lobbyStatus, winner, isWinner, startGame, declareWinner, playerCount, retryMatch };
}
