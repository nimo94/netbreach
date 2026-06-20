import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Swords, Timer, Monitor, Globe, ChevronLeft, Play } from 'lucide-react';
import { useGameState, MultiplayerMode } from '../context/GameState';
import { useMultiplayer } from '../hooks/useMultiplayer';

type MenuState = 'main' | 'lobby';

export default function MainMenu() {
  const { setAppState, setMultiplayerState, lobbyCode, isHost } = useGameState();
  const { lobbyStatus, startGame } = useMultiplayer();
  const [menuState, setMenuState] = useState<MenuState>(lobbyCode ? 'lobby' : 'main');
  const [lobbyType, setLobbyType] = useState<'host' | 'join' | null>(lobbyCode ? (isHost ? 'host' : 'join') : null);
  const [generatedCode, setGeneratedCode] = useState<string>(isHost ? lobbyCode || '' : '');
  const [joinCode, setJoinCode] = useState<string>(!isHost ? lobbyCode || '' : '');

  useEffect(() => {
    if (lobbyCode) {
      setMenuState('lobby');
      setLobbyType(isHost ? 'host' : 'join');
    }
  }, [lobbyCode, isHost]);

  const generateLobbyCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSingleplayer = () => {
    setMultiplayerState('single', null, true);
    setAppState('playing');
  };



  const handleHostGame = () => {
    const code = generateLobbyCode();
    setGeneratedCode(code);
    setLobbyType('host');
    setMultiplayerState('speedrun', code, true);
  };

  const handleJoinGame = () => {
    setLobbyType('join');
  };

  const handleStartMultiplayer = () => {
    const code = lobbyType === 'host' ? generatedCode : joinCode;
    if (lobbyType === 'join' && code.length !== 6) return; // Basic validation
    setMultiplayerState('speedrun', code, lobbyType === 'host');
    // We NO LONGER set appState('playing') here! 
    // The host will click the separate startGame() button which updates Firestore.
    // The client will join, setMultiplayerState, which re-renders MainMenu into the waiting screen.
  };

  const getQrUrl = (code: string) => {
    let url = window.location.origin;
    if (url.includes('localhost')) {
      url = url.replace('localhost', '10.100.64.146');
    }
    return `${url}?join=${code}`;
  };

  return (
    <div className="flex-1 bg-nb-bg flex flex-col items-center justify-center p-8 overflow-hidden text-nb-text">
      
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-bold tracking-tighter text-nb-cyan mb-2" style={{ textShadow: '0 0 20px rgba(34, 211, 238, 0.4)' }}>
          NETBREACH<span className="text-nb-text opacity-50">.OS</span>
        </h1>
        <p className="text-nb-text/60 tracking-widest text-sm">v1.0.4 // CYBER WARFARE SIMULATOR</p>
      </div>

      {/* Main Selection */}
      {menuState === 'main' && (
        <div className="flex flex-col md:flex-row gap-6 max-w-4xl w-full">
          <button 
            onClick={handleSingleplayer}
            className="flex-1 bg-nb-panel border border-nb-border hover:border-nb-cyan p-12 rounded-lg flex flex-col items-center gap-6 transition-all hover:bg-nb-cyan/5 group"
          >
            <Monitor size={64} className="text-nb-cyan group-hover:scale-110 transition-transform" />
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">SINGLEPLAYER</h2>
              <p className="text-nb-text/60 text-sm">Hack alone. Build your arsenal. Take down AI targets.</p>
            </div>
          </button>

          <button 
            onClick={() => setMenuState('lobby')}
            className="flex-1 bg-nb-panel border border-nb-border hover:border-nb-amber p-12 rounded-lg flex flex-col items-center gap-6 transition-all hover:bg-nb-amber/5 group"
          >
            <Globe size={64} className="text-nb-amber group-hover:scale-110 transition-transform" />
            <div className="text-center">
               <h2 className="text-2xl font-bold mb-2">MULTIPLAYER</h2>
              <p className="text-nb-text/60 text-sm">Race against a friend in a Speedrun Match to hack the target first.</p>
            </div>
          </button>
        </div>
      )}

      {/* Lobby Connection */}
      {menuState === 'lobby' && (
        <div className="flex flex-col gap-6 max-w-2xl w-full bg-nb-panel border border-nb-border p-8 rounded-lg animate-in zoom-in-95 duration-300">
          <button onClick={() => { setMenuState('main'); setLobbyType(null); }} className="flex items-center gap-2 text-nb-text/50 hover:text-nb-text self-start">
            <ChevronLeft size={20} /> Back
          </button>

          <h2 className="text-2xl font-bold text-center border-b border-nb-border pb-4">
            MULTIPLAYER LOBBY
          </h2>

          {!lobbyType ? (
            <div className="flex gap-4 mt-4">
              <button onClick={handleHostGame} className="flex-1 bg-nb-cyan text-black font-bold py-4 rounded hover:bg-nb-cyan/90 transition-colors">
                HOST MATCH
              </button>
              <button onClick={handleJoinGame} className="flex-1 border border-nb-cyan text-nb-cyan font-bold py-4 rounded hover:bg-nb-cyan/10 transition-colors">
                JOIN MATCH
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 mt-4">
              {lobbyType === 'host' ? (
                <>
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG value={getQrUrl(generatedCode)} size={200} />
                  </div>
                  <div className="text-center">
                    <p className="text-nb-text/60 mb-2">LOBBY CODE</p>
                    <div className="text-4xl font-mono font-bold tracking-widest text-nb-cyan bg-black/50 px-6 py-3 rounded border border-nb-border">
                      {generatedCode}
                    </div>
                  </div>
                  {lobbyStatus === 'waiting' ? (
                    <p className="text-sm text-nb-text/50">Waiting for peer to connect...</p>
                  ) : (
                    <p className="text-sm font-bold text-nb-green">Opponent Connected!</p>
                  )}
                  <button onClick={startGame} disabled={lobbyStatus !== 'ready'} className="w-full bg-nb-green text-black font-bold py-3 rounded flex items-center justify-center gap-2 mt-4 hover:bg-nb-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <Play size={20} /> START MATCH
                  </button>
                </>
              ) : (
                <>
                  {lobbyCode ? (
                    <div className="text-center p-8 border border-nb-border bg-black/50 rounded-lg w-full">
                      <p className="text-nb-text/60 mb-2">CONNECTED TO LOBBY</p>
                      <div className="text-4xl font-mono font-bold tracking-widest text-nb-cyan mb-4">
                        {lobbyCode}
                      </div>
                      <p className="text-sm text-nb-green animate-pulse">Waiting for host to start the game...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-full">
                        <p className="text-nb-text/60 mb-2">ENTER LOBBY CODE</p>
                        <input 
                          type="text" 
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          maxLength={6}
                          placeholder="XXXXXX"
                          className="w-full bg-black border border-nb-border rounded p-4 text-center text-3xl font-mono font-bold tracking-widest focus:outline-none focus:border-nb-cyan uppercase"
                        />
                      </div>
                      <button 
                        onClick={handleStartMultiplayer} 
                        disabled={joinCode.length !== 6}
                        className="w-full bg-nb-cyan text-black font-bold py-3 rounded flex items-center justify-center gap-2 mt-2 hover:bg-nb-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        CONNECT
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
