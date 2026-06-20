import React, { useState } from 'react';
import { useGameState, InventoryItem } from '../context/GameState';
import { Lock, FileCode2, Terminal, Shield, Zap, Database, Globe, Search, Network, Trash2 } from 'lucide-react';

interface ToolData {
  id: InventoryItem;
  name: string;
  icon: React.ReactNode;
  description: string;
  usage: string;
  tutorial: React.ReactNode;
}

const TOOLS: ToolData[] = [
  {
    id: 'net_scanner',
    name: 'Nmap Pro (Net Scanner)',
    icon: <Search size={24} className="text-nb-cyan" />,
    description: 'Advanced network scanner that reveals active hosts and open ports on a target network.',
    usage: 'nmap [target_ip]',
    tutorial: (
      <div className="space-y-4">
        <p>The network scanner is your primary reconnaissance tool. It pings a target IP address and checks for open vulnerabilities.</p>
        <div className="bg-[#0a0c10] p-4 rounded border border-nb-border font-mono text-xs">
          <div className="text-nb-green">ghost@netbreach:~$ nmap 192.168.1.100</div>
          <div className="text-gray-400 mt-2">Starting Nmap 7.92 ( https://nmap.org )</div>
          <div className="text-gray-400">Nmap scan report for omnicorp.local (192.168.1.100)</div>
          <div className="text-gray-400">Host is up (0.012s latency).</div>
          <div className="text-nb-amber mt-2">PORT     STATE SERVICE</div>
          <div className="text-nb-green">22/tcp   open  ssh</div>
          <div className="text-nb-green">80/tcp   open  http</div>
        </div>
        <p className="text-nb-cyan text-sm">💡 Tip: Always run this first when targeting a new domain to find out which exploits will work.</p>
      </div>
    )
  },
  {
    id: 'zero_day',
    name: '0-Day Exploit Framework',
    icon: <Zap size={24} className="text-nb-amber" />,
    description: 'Unpatched exploits that grant immediate shell access on vulnerable services.',
    usage: './exploit.py [cve_code]',
    tutorial: (
      <div className="space-y-4">
        <p>Zero-days are incredibly powerful scripts that exploit unknown vulnerabilities. Once you find an open port (e.g. via <span className="text-nb-amber">nmap</span>), you can run an exploit targeting it.</p>
        <div className="bg-[#0a0c10] p-4 rounded border border-nb-border font-mono text-xs overflow-hidden relative">
          <div className="text-nb-green">ghost@netbreach:~$ ./exploit.py CVE-2024-1337</div>
          <div className="text-gray-400 mt-2 animate-pulse">[*] Initializing reverse shell payload...</div>
          <div className="text-gray-400">[*] Bypassing ASLR...</div>
          <div className="text-nb-green mt-2">[+] Shell acquired!</div>
        </div>
        <p className="text-nb-cyan text-sm">💡 Tip: Combine this with a proxy chain to prevent the AI from tracing the payload source.</p>
      </div>
    )
  },
  {
    id: 'proxy_chain',
    name: 'ProxyChains Configuration',
    icon: <Network size={24} className="text-nb-green" />,
    description: 'Routes your connection through multiple proxies to obfuscate your origin IP.',
    usage: 'proxychains [command]',
    tutorial: (
      <div className="space-y-4">
        <p>ProxyChains forces any TCP connection made by a given application to follow through proxy like TOR or any other SOCKS4, SOCKS5 or HTTP(S) proxy.</p>
        <div className="flex gap-2 text-xs items-center justify-center p-4 bg-[#0a0c10] border border-nb-border rounded">
          <div className="p-2 border border-nb-green text-nb-green rounded">YOU</div>
          <div className="text-gray-600">→</div>
          <div className="p-2 border border-nb-amber text-nb-amber rounded animate-pulse">PROXY 1</div>
          <div className="text-gray-600">→</div>
          <div className="p-2 border border-nb-amber text-nb-amber rounded animate-pulse" style={{ animationDelay: '0.2s'}}>PROXY 2</div>
          <div className="text-gray-600">→</div>
          <div className="p-2 border border-red-500 text-red-500 rounded">TARGET</div>
        </div>
        <p className="text-nb-cyan text-sm">💡 Tip: Prefixing a command with proxychains (e.g. `proxychains ssh root@ip`) reduces the AI Threat generation by 50%.</p>
      </div>
    )
  },
  {
    id: 'hydra_injector',
    name: 'Hydra Dictionary Attacker',
    icon: <Shield size={24} className="text-red-500" />,
    description: 'A very fast network logon cracker which supports many different services.',
    usage: 'hydra -l root -P dict.txt [ip] ssh',
    tutorial: (
      <div className="space-y-4">
        <p>Hydra rapidly guesses passwords using a dictionary file. It's noisy, but effective against poorly secured SSH or FTP servers.</p>
        <div className="bg-[#0a0c10] p-4 rounded border border-nb-border font-mono text-xs">
          <div className="text-nb-green">ghost@netbreach:~$ hydra -l root -P pass.txt 192.168.1.100 ssh</div>
          <div className="text-gray-400 mt-2 text-red-500">[WARNING] AI Threat spiking due to high connection rate!</div>
          <div className="text-gray-400">[ATTEMPT] root:password123 - FAILED</div>
          <div className="text-gray-400">[ATTEMPT] root:admin - FAILED</div>
          <div className="text-nb-green font-bold mt-2">[SUCCESS] root:cyberpunk2077</div>
        </div>
      </div>
    )
  },
  {
    id: 'sql_automator',
    name: 'SQLMap',
    icon: <Database size={24} className="text-nb-cyan" />,
    description: 'Automates the process of detecting and exploiting SQL injection flaws.',
    usage: 'sqlmap -u "[url]" --dump',
    tutorial: (
      <div className="space-y-4">
        <p>When you have a DB Wipe or Exfiltration mission on a web server, SQLMap is your best friend. It automatically tests web endpoints for SQL injection.</p>
        <div className="bg-[#0a0c10] p-4 rounded border border-nb-border font-mono text-xs">
          <div className="text-nb-green">ghost@netbreach:~$ sqlmap -u "http://target.com/page?id=1" --dump</div>
          <div className="text-gray-400 mt-2">[*] testing connection to the target URL</div>
          <div className="text-gray-400">[*] checking if the GET parameter 'id' is dynamic</div>
          <div className="text-nb-green mt-2">[+] GET parameter 'id' is vulnerable. Do you want to keep testing the others? [Y/n]</div>
        </div>
      </div>
    )
  },
  {
    id: 'auto_scraper',
    name: 'OSINT Auto-Scraper',
    icon: <Globe size={24} className="text-[#a78bfa]" />,
    description: 'Scrapes the web for employee names, emails, and leaked passwords.',
    usage: 'gobuster dir -u [url] -w common.txt',
    tutorial: (
      <div className="space-y-4">
        <p>The Auto-Scraper (Gobuster) performs directory enumeration and OSINT gathering. It finds hidden files on web servers.</p>
        <div className="bg-[#0a0c10] p-4 rounded border border-nb-border font-mono text-xs">
          <div className="text-nb-green">ghost@netbreach:~$ gobuster dir -u http://omnicorp.local -w common.txt</div>
          <div className="text-gray-400 mt-2">/admin (Status: 301)</div>
          <div className="text-gray-400">/login.php (Status: 200)</div>
          <div className="text-gray-400">/backups (Status: 403)</div>
        </div>
      </div>
    )
  },
  {
    id: 'key_logger',
    name: 'Remote Keylogger',
    icon: <FileCode2 size={24} className="text-nb-amber" />,
    description: 'Records keystrokes of administrators once you have initial access.',
    usage: 'Deployed automatically upon root access.',
    tutorial: (
      <div className="space-y-4">
        <p>The Keylogger runs silently in the background once you obtain root access on a machine. It occasionally intercepts admin credentials which are then stored in your local logs.</p>
        <div className="flex justify-center my-4">
          <div className="w-16 h-16 border-2 border-nb-amber rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-center text-sm text-gray-400">Passive ability. No manual execution required.</p>
      </div>
    )
  },
  {
    id: 'log_wiper',
    name: 'Log Wiper',
    icon: <Trash2 size={24} className="text-gray-400" />,
    description: 'Automatically shreds bash_history and system logs upon exit.',
    usage: 'shred -u /var/log/auth.log',
    tutorial: (
      <div className="space-y-4">
        <p>Never leave a trace. Log Wiper deletes your forensic footprint. If you have this tool, running `exit` or disconnecting will automatically trigger a wipe, preventing the AI from analyzing your session post-disconnect.</p>
        <div className="bg-[#0a0c10] p-4 rounded border border-nb-border font-mono text-xs">
          <div className="text-nb-green">root@target:~# shred -zun 3 /var/log/syslog</div>
          <div className="text-gray-400 mt-2">shred: /var/log/syslog: pass 1/3 (random)...</div>
          <div className="text-gray-400">shred: /var/log/syslog: pass 2/3 (random)...</div>
          <div className="text-gray-400">shred: /var/log/syslog: pass 3/3 (000000)...</div>
          <div className="text-gray-400">shred: /var/log/syslog: removed</div>
        </div>
      </div>
    )
  },
  {
    id: 'trace_obfuscator',
    name: 'Trace Obfuscator',
    icon: <Shield size={24} className="text-[#f472b6]" />,
    description: 'Generates fake connection logs to confuse the IDS AI.',
    usage: 'Passive Module',
    tutorial: (
      <div className="space-y-4">
        <p>The Trace Obfuscator floods the target's Intrusion Detection System (IDS) with fake traffic originating from multiple random global IPs.</p>
        <div className="bg-[#0a0c10] p-4 rounded border border-nb-border font-mono text-xs text-gray-500">
          <div>[IDS] Incoming connection from 45.33.2.1</div>
          <div>[IDS] Incoming connection from 198.4.22.1</div>
          <div>[IDS] Incoming connection from 8.8.4.4</div>
          <div className="text-nb-green">[IDS] Incoming connection from YOUR_IP</div>
          <div>[IDS] Incoming connection from 12.44.2.19</div>
        </div>
        <p className="text-nb-cyan text-sm">💡 Tip: This passive module permanently reduces the rate at which the AI learns your patterns.</p>
      </div>
    )
  }
];

export default function Inventory() {
  const { hasItem } = useGameState();
  const [selectedTool, setSelectedTool] = useState<ToolData | null>(null);

  const ownedTools = TOOLS.filter(t => hasItem(t.id));
  const lockedTools = TOOLS.filter(t => !hasItem(t.id));

  return (
    <div className="flex flex-1 h-full bg-nb-app-bg text-gray-300 overflow-hidden font-mono text-sm">
      
      {/* Left Sidebar - List of Tools */}
      <div className="w-80 border-r border-nb-border flex flex-col bg-[#0e1015]">
        <div className="p-4 border-b border-nb-border flex items-center justify-between">
          <h2 className="font-bold text-nb-green flex items-center gap-2">
            <Terminal size={18} />
            LOADOUT
          </h2>
          <span className="text-xs text-gray-500">{ownedTools.length}/{TOOLS.length} OWNED</span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-widest px-2 pt-2 pb-1">Acquired Tools</div>
          {ownedTools.length === 0 && (
            <div className="p-4 text-center text-gray-600 text-xs italic border border-dashed border-gray-800 m-2">
              No tools purchased. Visit the Dark Web to buy tools.
            </div>
          )}
          {ownedTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool)}
              className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${
                selectedTool?.id === tool.id 
                  ? 'bg-nb-green/10 border border-nb-green/30' 
                  : 'hover:bg-[#1a1d24] border border-transparent'
              }`}
            >
              <div className={selectedTool?.id === tool.id ? 'text-nb-green' : 'text-gray-400'}>
                {tool.icon}
              </div>
              <div className="truncate text-white text-sm">{tool.name}</div>
            </button>
          ))}

          <div className="text-xs text-gray-500 uppercase tracking-widest px-2 pt-6 pb-1">Locked Tools</div>
          {lockedTools.map(tool => (
            <div
              key={tool.id}
              className="w-full text-left p-3 rounded flex items-center gap-3 opacity-50 cursor-not-allowed"
              title="Purchase this tool on the Dark Web to unlock documentation."
            >
              <div className="text-gray-600">
                <Lock size={20} />
              </div>
              <div className="truncate text-gray-500 line-through">{tool.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content Area - Tutorial Documentation */}
      <div className="flex-1 overflow-y-auto bg-nb-app-bg p-8">
        {selectedTool ? (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-nb-border">
              <div className="p-4 bg-[#111318] border border-nb-border rounded">
                {selectedTool.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{selectedTool.name}</h1>
                <div className="text-gray-400">{selectedTool.description}</div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-500 tracking-widest mb-3 uppercase">Usage Syntax</h3>
              <div className="bg-[#0a0c10] border border-nb-border p-3 rounded text-nb-green font-mono">
                {selectedTool.usage}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-500 tracking-widest mb-4 uppercase">Operational Tutorial</h3>
              <div className="prose prose-invert prose-pre:bg-[#0a0c10] prose-pre:border prose-pre:border-nb-border max-w-none text-gray-300">
                {selectedTool.tutorial}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <FileCode2 size={48} className="mb-4 opacity-50" />
            <div className="text-xl font-bold mb-2">NO TOOL SELECTED</div>
            <p className="max-w-sm text-center text-sm">
              Select an acquired tool from your loadout to view its operational manual and usage examples.
            </p>
          </div>
        )}
      </div>
      
    </div>
  );
}
