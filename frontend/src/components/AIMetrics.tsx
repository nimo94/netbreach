import React, { useEffect, useState, useRef } from 'react';
import { BrainCircuit, Activity, Network, Zap, RotateCcw } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface NetworkData {
  inputs: number;
  hidden: number;
  outputs: number;
  vocab: string[];
  W1: number[][];
  b1: number[];
  W2: number[][];
  b2: number[];
}

interface MissionStat {
  commands_seen: number;
  ghost_completion: number;
}

interface UserNetwork {
  total_commands: number;
  ghost_completion: number;
  mission_stats?: Record<string, MissionStat>;
  network_data: NetworkData;
}

export default function AIMetrics() {
  const [networks, setNetworks] = useState<Record<string, UserNetwork>>({});
  const [loading, setLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const fetchedUids = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const res = await fetch('https://netbreach-api-gateway-866084699533.us-central1.run.app/api/network');
        const data = await res.json();
        if (!data.error) {
          setNetworks(data);
          
          // Fetch aliases for any new UIDs
          const newUids = Object.keys(data).filter(uid => !fetchedUids.current.has(uid) && uid !== 'anonymous');
          if (newUids.length > 0) {
            newUids.forEach(uid => fetchedUids.current.add(uid));
            
            const newAliases: Record<string, string> = {};
            for (const uid of newUids) {
              try {
                const snap = await getDoc(doc(db, 'users', uid));
                if (snap.exists() && snap.data().username) {
                  newAliases[uid] = snap.data().username;
                } else {
                  newAliases[uid] = 'ghost';
                }
              } catch (e) {
                newAliases[uid] = 'ghost';
              }
            }
            
            setAliases(prev => ({ ...prev, ...newAliases }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch network metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworks();
    const interval = setInterval(fetchNetworks, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleGlobalReset = async () => {
    if (passwordInput === 'ASS1234') {
      try {
        await fetch('https://netbreach-api-gateway-866084699533.us-central1.run.app/api/network/reset', { method: 'POST' });
        setNetworks({}); // Clear locally immediately
      } catch (err) {
        console.error('Failed to reset neural networks');
      }
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      alert("INCORRECT AUTHORIZATION CODE.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#0a0c10] text-gray-400 p-8 flex items-center justify-center font-mono">
        <Activity className="animate-pulse mr-2" /> SCANNING GLOBAL NEURAL MESH...
      </div>
    );
  }

  const userIds = Object.keys(networks);

  return (
    <div className="flex-1 bg-[#0a0c10] text-white p-4 overflow-y-auto custom-scrollbar font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-nb-border pb-4">
          <h1 className="text-xl font-bold text-nb-amber flex items-center gap-2 tracking-widest">
            <BrainCircuit />
            GLOBAL AI PREDICTIVE MESH
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              Active Neural Nodes: <span className="text-nb-cyan">{userIds.length}</span>
            </div>
            <button 
              onClick={() => setShowPasswordPrompt(true)}
              className="flex items-center gap-1 text-xs bg-nb-red/10 border border-nb-red/50 text-nb-red px-2 py-1 rounded hover:bg-nb-red hover:text-white transition-colors"
            >
              <RotateCcw size={12} />
              WIPE NEURAL MESH
            </button>
          </div>
        </div>

        {showPasswordPrompt && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-[#050608] border border-nb-red p-6 rounded-md w-96 font-mono text-center">
              <h2 className="text-nb-red font-bold mb-4">CRITICAL: WIPE ALL NEURAL MEMORY</h2>
              <p className="text-xs text-gray-400 mb-4">This will permanently destroy the learned behavioral patterns of all connected users across the global mesh.</p>
              <input 
                type="password"
                placeholder="ENTER AUTHORIZATION CODE"
                className="w-full bg-[#0a0c10] border border-gray-700 p-2 text-white outline-none focus:border-nb-red mb-4 text-center"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGlobalReset()}
              />
              <div className="flex justify-between gap-4">
                <button 
                  onClick={() => setShowPasswordPrompt(false)}
                  className="flex-1 bg-gray-800 text-white px-4 py-2 text-sm hover:bg-gray-700 transition"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleGlobalReset}
                  className="flex-1 bg-nb-red text-white px-4 py-2 text-sm hover:bg-red-600 transition"
                >
                  AUTHORIZE WIPE
                </button>
              </div>
            </div>
          </div>
        )}

        {userIds.length === 0 ? (
          <div className="text-gray-500 text-center py-10 italic">
            No active hackers detected in the neural mesh.
          </div>
        ) : (
          <div className="space-y-6">
            {userIds.map(uid => {
              const net = networks[uid];
              const isHighThreat = net.ghost_completion >= 0.74;
              const maxLayerSize = Math.max(net.network_data.inputs || 1, net.network_data.hidden || 1, net.network_data.outputs || 1);
              
              // Deduplicate alias logic
              let rawAlias = aliases[uid] || (uid === 'anonymous' ? 'ghost' : 'ghost');
              let displayAlias = rawAlias;
              const sameAliasUids = userIds.filter(u => (aliases[u] || 'ghost') === rawAlias);
              if (sameAliasUids.length > 1) {
                const index = sameAliasUids.indexOf(uid);
                if (index > 0) {
                  displayAlias = `${rawAlias}_${index}`;
                }
              }

              const calculatedHeight = Math.max(300, maxLayerSize * 25);
              const usableHeight = calculatedHeight - 40;
              
              return (
                <div key={uid} className={`bg-[#0e1015] border ${isHighThreat ? 'border-nb-red shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-nb-border'} rounded-md p-4`}>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <Network className={isHighThreat ? 'text-nb-red' : 'text-nb-cyan'} size={20} />
                      <div>
                        <div className="text-sm font-bold tracking-wider">{displayAlias}@netbreach</div>
                        <div className="text-[10px] text-gray-600 font-mono mb-1">UID: {uid.slice(0, 12)}...</div>
                        <div className="text-xs text-gray-500">Commands Analyzed: {net.total_commands}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Prediction Confidence</div>
                      <div className={`text-lg font-bold ${isHighThreat ? 'text-nb-red' : 'text-nb-cyan'}`}>
                        {(net.ghost_completion * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Mission Breakdown */}
                  {net.mission_stats && Object.keys(net.mission_stats).length > 0 && (
                    <div className="mb-4 p-4 bg-[#0a0c10] border border-gray-800 rounded-md">
                      <div className="text-xs text-nb-amber mb-2 uppercase font-bold tracking-widest">Active Mission Strategies Analyzed:</div>
                      <div className="space-y-2">
                        {Object.entries(net.mission_stats).map(([mission, stat]) => (
                          <div key={mission} className="flex items-center justify-between text-sm">
                            <span className="text-nb-cyan">{mission}</span>
                            <div className="flex items-center gap-4 text-gray-400">
                              <span>{stat.commands_seen} cmds</span>
                              <span className={`font-bold ${stat.ghost_completion >= 0.74 ? 'text-nb-red' : 'text-gray-300'}`}>
                                {(stat.ghost_completion * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Network Topology Details */}
                  <div className="mt-4 bg-[#050608] p-4 rounded border border-gray-800">
                    <div className="text-xs text-nb-amber font-bold mb-4 flex items-center gap-2">
                      <Zap size={14} /> LIVE NEURAL MESH TOPOLOGY & WEIGHTS
                    </div>
                    
                    <div className="w-full overflow-x-auto custom-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <svg width="100%" height={calculatedHeight} viewBox={`0 0 800 ${calculatedHeight}`} className="min-w-[600px]">
                        <defs>
                          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="nodeGlowRed" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* Edges W1: Inputs -> Hidden */}
                        {net.network_data.W1.map((row, j) => 
                          row.map((weight, i) => {
                            const x1 = 100;
                            const y1 = 20 + (usableHeight / (net.network_data.inputs - 1 || 1)) * i;
                            const x2 = 400;
                            const y2 = 40 + ((usableHeight - 40) / (net.network_data.hidden - 1 || 1)) * j;
                            
                            const dx = x2 - x1;
                            const dy = y2 - y1;
                            const length = Math.sqrt(dx * dx + dy * dy);
                            
                            const absW = Math.abs(weight);
                            
                            // Strength metric (0.0 to 1.0) based on weight
                            const strength = Math.min(1.0, absW * 4); // Reaches full connection at weight 0.25
                            
                            // SVG line drawing animation properties: line grows from left to right!
                            const strokeDasharray = length;
                            const strokeDashoffset = length - (length * strength);
                            
                            // Opacity and width progressively increase
                            const opacity = Math.min(1.0, 0.15 + absW * 2.0);
                            const width = 0.5 + absW * 3.0;
                            const strokeColor = weight > 0 ? '#4ade80' : '#ef4444'; // Green for positive, Red for negative
                            
                            return (
                              <line 
                                key={`w1-${i}-${j}`} 
                                x1={x1} y1={y1} x2={x2} y2={y2} 
                                stroke={strokeColor} 
                                strokeWidth={width} 
                                strokeOpacity={opacity}
                              />
                            );
                          })
                        )}

                        {/* Edges W2: Hidden -> Outputs */}
                        {net.network_data.W2.map((row, k) => 
                          row.map((weight, j) => {
                            const x1 = 400;
                            const y1 = 40 + ((usableHeight - 40) / (net.network_data.hidden - 1 || 1)) * j;
                            const x2 = 700;
                            const y2 = 20 + (usableHeight / (net.network_data.outputs - 1 || 1)) * k;
                            
                            const dx = x2 - x1;
                            const dy = y2 - y1;
                            const length = Math.sqrt(dx * dx + dy * dy);
                            
                            const absW = Math.abs(weight);
                            const strength = Math.min(1.0, absW * 4);
                            
                            const strokeDasharray = length;
                            const strokeDashoffset = length - (length * strength);
                            
                            const opacity = Math.min(1.0, 0.15 + absW * 2.0);
                            const width = 0.5 + absW * 3.0;
                            const strokeColor = weight > 0 ? '#4ade80' : '#ef4444';
                            
                            return (
                              <line 
                                key={`w2-${j}-${k}`} 
                                x1={x1} y1={y1} x2={x2} y2={y2} 
                                stroke={strokeColor} 
                                strokeWidth={width} 
                                strokeOpacity={opacity} 
                              />
                            );
                          })
                        )}

                        {/* Nodes: Inputs */}
                        {Array.from({ length: net.network_data.inputs }).map((_, i) => {
                          const x = 100;
                          const y = 20 + (usableHeight / (net.network_data.inputs - 1 || 1)) * i;
                          return (
                            <g key={`in-${i}`}>
                              <circle cx={x} cy={y} r="8" fill="url(#nodeGlow)" />
                              <circle cx={x} cy={y} r="3" fill="#fff" />
                              {i % 4 === 0 && <text x={x - 20} y={y + 4} fontSize="10" fill="#6b7280" textAnchor="end">IN_{i}</text>}
                            </g>
                          );
                        })}

                        {/* Nodes: Hidden */}
                        {Array.from({ length: net.network_data.hidden }).map((_, j) => {
                          const x = 400;
                          const y = 40 + ((usableHeight - 40) / (net.network_data.hidden - 1 || 1)) * j;
                          // Bias coloring
                          const bias = net.network_data.b1[j] || 0;
                          const biasColor = bias > 0 ? '#4ade80' : '#ef4444';
                          return (
                            <g key={`hid-${j}`}>
                              <circle cx={x} cy={y} r="12" fill="url(#nodeGlow)" opacity="0.6" />
                              <circle cx={x} cy={y} r="5" fill={biasColor} />
                              <text x={x} y={y - 12} fontSize="9" fill="#9ca3af" textAnchor="middle">b:{bias.toFixed(2)}</text>
                            </g>
                          );
                        })}

                        {/* Nodes: Outputs */}
                        {Array.from({ length: net.network_data.outputs }).map((_, k) => {
                          const x = 700;
                          const y = 20 + (usableHeight / (net.network_data.outputs - 1 || 1)) * k;
                          const bias = net.network_data.b2[k] || 0;
                          const biasColor = bias > 0 ? '#4ade80' : '#ef4444';
                          const cmdLabel = net.network_data.vocab[k] || `OUT_${k}`;
                          
                          return (
                            <g key={`out-${k}`}>
                              <circle cx={x} cy={y} r="8" fill={isHighThreat ? "url(#nodeGlowRed)" : "url(#nodeGlow)"} />
                              <circle cx={x} cy={y} r="4" fill={biasColor} />
                              <text x={x + 15} y={y + 3} fontSize="10" fill={isHighThreat ? '#ef4444' : '#22d3ee'} textAnchor="start">
                                {cmdLabel}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Footer Stats */}
                    <div className="flex justify-between mt-4 border-t border-gray-800 pt-3 text-xs text-gray-500">
                      <div>
                        <span className="font-bold text-gray-300">Architecture: </span> 
                        {net.network_data.inputs} Input Neurons · {net.network_data.hidden} Hidden Layer Neurons · {net.network_data.outputs} Output Neurons · {net.network_data.inputs * net.network_data.hidden + net.network_data.hidden * net.network_data.outputs} Synaptic Edges
                      </div>
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-nb-green inline-block"></span> Excitatory (+)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-nb-red inline-block"></span> Inhibitory (-)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
