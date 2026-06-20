import React from 'react';
import { ShoppingCart, Shield, Cpu, Zap, Check, Skull, Radar, Key, Database, EyeOff, Trash2 } from 'lucide-react';
import { useGameState, InventoryItem } from '../context/GameState';

export default function DarkWeb() {
  const { credits, buyItem, hasItem } = useGameState();

  const shopItems = [
    {
      id: 'net_scanner',
      name: 'Network Scanner Override',
      desc: 'Automatically passes stealth/ping flags (-sS -Pn) to nmap. You can simply type "nmap [ip]".',
      price: 25000,
      icon: <Radar size={24} className="text-nb-amber" />
    },
    {
      id: 'zero_day',
      name: 'Zero-Day Exploit DB',
      desc: 'Instantly cross-references target IPs to find CVEs when running nmap.',
      price: 50000,
      icon: <Skull size={24} className="text-nb-red" />
    },
    {
      id: 'key_logger',
      name: 'Decryption Key Logger',
      desc: 'Immediately reveals target passwords (PINs) upon running a vulnerability scan. Skips hydra/sqlmap.',
      price: 75000,
      icon: <Key size={24} className="text-nb-green" />
    },
    {
      id: 'hydra_injector',
      name: 'Hydra Protocol Injector',
      desc: 'Shortens the bruteforce command. You only have to type "hydra [ip]".',
      price: 35000,
      icon: <Zap size={24} className="text-nb-amber" />
    },
    {
      id: 'sql_automator',
      name: 'SQL Injection Automator',
      desc: 'Shortens the database dump command. Just type "sqlmap".',
      price: 35000,
      icon: <Database size={24} className="text-nb-cyan" />
    },
    {
      id: 'log_wiper',
      name: 'Log Wiper Daemon',
      desc: 'Automatically scrubs logs and disconnects you upon mission completion. Skips the shred/rm step.',
      price: 90000,
      icon: <Trash2 size={24} className="text-nb-red" />
    },
    {
      id: 'proxy_chain',
      name: 'Advanced Proxy Chains',
      desc: 'Increases the time you have to block an AI countermeasure trace from 6 seconds to 10 seconds.',
      price: 5000,
      icon: <Shield size={24} className="text-nb-cyan" />
    },
    {
      id: 'trace_obfuscator',
      name: 'Trace Obfuscator',
      desc: 'Automatically types the override block and cancels active traces instantly. Total immunity.',
      price: 120000,
      icon: <EyeOff size={24} className="text-[#a855f7]" />
    },
    {
      id: 'auto_scraper',
      name: 'Memory Auto-Scraper',
      desc: 'Automatically intercepts and injects keys when running scp or mysql.',
      price: 15000,
      icon: <Cpu size={24} className="text-[#eab308]" />
    }
  ] as const;

  return (
    <div className="flex-1 bg-nb-term-bg p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-nb-border">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <ShoppingCart className="text-nb-green" />
              THE DARK WEB
            </h1>
            <p className="text-gray-400">Trade your illicit earnings for cyber warfare advantages.</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">AVAILABLE BALANCE</div>
            <div className="text-2xl font-bold text-nb-green">₿ {credits.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shopItems.map(item => {
            const owned = hasItem(item.id);
            const canAfford = credits >= item.price;
            
            return (
              <div 
                key={item.id} 
                className={`border p-6 rounded-sm flex flex-col ${
                  owned 
                    ? 'bg-[#111318] border-nb-green/30' 
                    : 'bg-[#0a0c10] border-nb-border hover:border-nb-green/50 transition-colors'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-[#1a1d24] rounded-sm shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-nb-border/50">
                  <div className="font-mono font-bold text-lg text-white">
                    ₿ {item.price.toLocaleString()}
                  </div>
                  
                  {owned ? (
                    <div className="flex items-center gap-2 text-nb-green text-sm font-bold bg-nb-green/10 px-4 py-2 rounded-sm">
                      <Check size={16} /> OWNED
                    </div>
                  ) : (
                    <button
                      onClick={() => buyItem(item.id, item.price)}
                      disabled={!canAfford}
                      className={`px-6 py-2 rounded-sm font-bold text-xs transition-colors ${
                        canAfford 
                          ? 'bg-nb-green text-nb-term-bg hover:bg-nb-green/90' 
                          : 'bg-[#1a1d24] text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      PURCHASE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
