import React from 'react';
import { BookOpen, Database, UploadCloud, MonitorX } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="flex-1 p-4 overflow-y-auto font-mono">
      <h3 className="text-gray-400 text-xs font-bold mb-4 flex items-center gap-2 border-b border-nb-border pb-2">
        <BookOpen size={14} /> OPERATIONS MANUAL
      </h3>

      <div className="space-y-6 text-sm">
        <div>
          <div className="flex items-center gap-2 text-nb-cyan mb-2 font-bold">
            <Database size={16} /> DB WIPE
          </div>
          <p className="text-gray-400 text-xs mb-2 leading-relaxed">
            Target the backend database infrastructure.
          </p>
          <ul className="text-xxs text-gray-500 list-disc pl-4 space-y-1">
            <li>Identify the DB port (e.g., MySQL 3306).</li>
            <li>Use credentials or exploits to gain entry.</li>
            <li>Execute the drop command: <span className="text-nb-cyan">DROP DATABASE users;</span></li>
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 text-nb-green mb-2 font-bold">
            <UploadCloud size={16} /> EXFILTRATION
          </div>
          <p className="text-gray-400 text-xs mb-2 leading-relaxed">
            Extract sensitive corporate assets.
          </p>
          <ul className="text-xxs text-gray-500 list-disc pl-4 space-y-1">
            <li>Locate target files using directory enumeration (e.g., <span className="text-nb-green">gobuster</span>).</li>
            <li>Connect via <span className="text-nb-green">ftp</span> or <span className="text-nb-green">scp</span>.</li>
            <li>Download the asset securely using <span className="text-nb-green">wget</span> or equivalent.</li>
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 text-nb-amber mb-2 font-bold">
            <MonitorX size={16} /> DEFACEMENT
          </div>
          <p className="text-gray-400 text-xs mb-2 leading-relaxed">
            Alter the public-facing server index.
          </p>
          <ul className="text-xxs text-gray-500 list-disc pl-4 space-y-1">
            <li>Gain shell access via RCE or SSH.</li>
            <li>Navigate to the web root directory.</li>
            <li>Overwrite <span className="text-nb-amber">index.html</span> with a defacement payload.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
