import React, { useState } from 'react';
import { useGameState, MultiplayerMode } from '../context/GameState';
import { AlertTriangle, Trash2, Power, Cloud, User, Users } from 'lucide-react';
import { auth } from '../firebase';
import { linkWithPopup, GoogleAuthProvider, EmailAuthProvider, linkWithCredential } from 'firebase/auth';

export default function Settings() {
  const { deleteAccount, username, setUsername, multiplayerMode, setMultiplayerState, setAppState } = useGameState();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [newUsername, setNewUsername] = useState(username);
  const [upgradeError, setUpgradeError] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showEmailUpgrade, setShowEmailUpgrade] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  
  const handleReset = () => {
    if (deleteConfirmText === 'DELETE') {
      deleteAccount();
    }
  };

  const handleSaveUsername = () => {
    const sanitized = newUsername.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'ghost';
    setUsername(sanitized);
    setNewUsername(sanitized);
  };

  const handleSignOut = () => {
    auth.signOut();
    window.location.reload();
  };

  const handleUpgradeGoogle = async () => {
    try {
      if (!auth.currentUser) return;
      setIsUpgrading(true);
      setUpgradeError('');
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      window.location.reload();
    } catch (e: any) {
      if (e.code === 'auth/credential-already-in-use') {
        setUpgradeError('That Google account is already linked to another NetBreach profile.');
      } else {
        setUpgradeError(e.message);
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpgradeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) return;
      setIsUpgrading(true);
      setUpgradeError('');
      const credential = EmailAuthProvider.credential(upgradeEmail, upgradePassword);
      await linkWithCredential(auth.currentUser, credential);
      window.location.reload();
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setUpgradeError('That email is already registered. Please sign out and log in.');
      } else if (e.code === 'auth/weak-password') {
        setUpgradeError('Password must be at least 6 characters.');
      } else {
        setUpgradeError(e.message.replace('Firebase: Error ', '').replace(/[()]/g, ''));
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="flex-1 bg-nb-app-bg text-gray-300 p-8 overflow-y-auto font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-nb-cyan border-b border-nb-border pb-4">
          SYSTEM PREFERENCES
        </h1>

        <div className="bg-[#0e1015] border border-nb-border p-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-6">
            
            {/* Cloud Account Section */}
            <div>
              <h2 className="text-xl text-white font-bold mb-2 flex items-center gap-2">
                <Cloud size={20} className="text-nb-cyan" /> 
                CLOUD ACCOUNT
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Your AI memory signature and inventory are synced to the cloud.
              </p>
              <div className="flex gap-4">
                <div className="text-sm">
                  <span className="text-gray-500">PROVIDER: </span>
                  <span className={auth.currentUser?.isAnonymous ? 'text-nb-amber' : 'text-nb-green'}>
                    {auth.currentUser?.isAnonymous ? 'GUEST (Anonymous)' : auth.currentUser?.email || 'Google Account'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">UID: </span>
                  <span className="text-gray-400">{auth.currentUser?.uid}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <button 
                  onClick={handleSignOut}
                  className="bg-[#1a1d24] hover:bg-[#2a2d35] text-gray-300 border border-nb-border px-6 py-2 flex items-center gap-2 transition-colors focus:outline-none"
                >
                  <Power size={16} />
                  <span>SIGN OUT & REBOOT</span>
                </button>

                {auth.currentUser?.isAnonymous && (
                  <>
                    <button 
                      onClick={handleUpgradeGoogle}
                      disabled={isUpgrading}
                      className="bg-nb-green/10 hover:bg-nb-green/20 text-nb-green border border-nb-green/50 px-6 py-2 flex items-center gap-2 transition-colors focus:outline-none disabled:opacity-50"
                    >
                      <Cloud size={16} />
                      <span>UPGRADE TO PERMANENT (GOOGLE)</span>
                    </button>
                    <button 
                      onClick={() => setShowEmailUpgrade(!showEmailUpgrade)}
                      className="bg-nb-cyan/10 hover:bg-nb-cyan/20 text-nb-cyan border border-nb-cyan/50 px-6 py-2 flex items-center gap-2 transition-colors focus:outline-none"
                    >
                      <Cloud size={16} />
                      <span>UPGRADE (EMAIL)</span>
                    </button>
                  </>
                )}
              </div>
              
              {showEmailUpgrade && auth.currentUser?.isAnonymous && (
                <form onSubmit={handleUpgradeEmail} className="mt-4 p-4 border border-nb-border bg-[#0a0c10] flex flex-col gap-4 max-w-md">
                  <div className="text-sm text-gray-400">Register a new email and password to permanently save this Guest account.</div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={upgradeEmail}
                    onChange={e => setUpgradeEmail(e.target.value)}
                    required
                    className="w-full bg-[#111318] border border-gray-700 p-2 text-white outline-none focus:border-nb-cyan"
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={upgradePassword}
                    onChange={e => setUpgradePassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-[#111318] border border-gray-700 p-2 text-white outline-none focus:border-nb-cyan"
                  />
                  <button 
                    type="submit"
                    disabled={isUpgrading}
                    className="bg-nb-cyan text-[#0a0c10] font-bold py-2 disabled:opacity-50 hover:bg-cyan-400 transition"
                  >
                    {isUpgrading ? 'LINKING...' : 'CONFIRM EMAIL LINK'}
                  </button>
                </form>
              )}

              {upgradeError && (
                <div className="mt-2 text-nb-red text-xs">
                  {upgradeError}
                </div>
              )}
            </div>

            <hr className="border-nb-border" />

            {/* Identity Customization */}
            <div>
              <h2 className="text-xl text-white font-bold mb-2 flex items-center gap-2">
                <User size={20} className="text-nb-green" /> 
                IDENTITY CONFIGURATION
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Configure your terminal alias.
                {auth.currentUser?.isAnonymous && <span className="text-nb-amber ml-2">Guest accounts cannot change their alias.</span>}
              </p>
              
              <div className="flex items-center gap-2 max-w-md">
                <div className="flex flex-1 bg-[#0a0c10] border border-nb-border focus-within:border-nb-green">
                  <input 
                    type="text" 
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    disabled={auth.currentUser?.isAnonymous}
                    className="w-full bg-transparent text-white p-2 focus:outline-none text-right disabled:opacity-50"
                    placeholder="ghost"
                    maxLength={15}
                  />
                  <span className="p-2 text-gray-500 select-none bg-[#111318]">@netbreach:~$</span>
                </div>
                <button 
                  onClick={handleSaveUsername}
                  disabled={auth.currentUser?.isAnonymous || newUsername === username}
                  className="bg-nb-green/20 text-nb-green border border-nb-green hover:bg-nb-green/30 px-6 py-2 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                >
                  SAVE
                </button>
              </div>
            </div>

            <hr className="border-nb-border" />

            {/* Mode Selection */}
            <div>
              <h2 className="text-xl text-white font-bold mb-2 flex items-center gap-2">
                <Users size={20} className="text-nb-amber" /> 
                GAME MODE SELECTION
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Return to the main lobby to switch between offline infiltration and speedrun matches.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setAppState('menu')}
                  className="bg-nb-amber/10 hover:bg-nb-amber/20 text-nb-amber border border-nb-amber/50 px-6 py-2 font-bold transition-colors"
                >
                  RETURN TO MODE SELECTION
                </button>
              </div>
            </div>

            <hr className="border-nb-border" />

            {/* Delete Account */}
            <div>
              <h2 className="text-xl text-white font-bold mb-2 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" /> 
                DELETE ACCOUNT
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Wiping your system will permanently erase all local save data, your AI memory signature, and your cloud account. This action cannot be undone.
              </p>
              
              {!showConfirm ? (
                <button 
                  onClick={() => setShowConfirm(true)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-2 flex items-center gap-2 transition-colors focus:outline-none w-fit"
                >
                  <Trash2 size={16} />
                  <span>DELETE ACCOUNT</span>
                </button>
              ) : (
                <div className="bg-red-950/30 border border-red-500/50 p-4 animate-pulse-slow w-fit">
                  <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                    <AlertTriangle size={18} />
                    CRITICAL WARNING
                  </div>
                  <p className="text-red-400 text-sm mb-4">
                    Are you absolutely sure you want to delete your account? All data will be lost. Type 'DELETE' to confirm.
                  </p>
                  <div className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="bg-[#111318] border border-red-500/50 p-2 text-white focus:outline-none focus:border-red-500 w-full max-w-[200px]"
                    />
                    <div className="flex gap-4">
                      <button 
                        onClick={handleReset}
                        disabled={deleteConfirmText !== 'DELETE'}
                        className="bg-red-500 text-white px-6 py-2 font-bold hover:bg-red-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        AGREE & DELETE
                      </button>
                      <button 
                        onClick={() => { setShowConfirm(false); setDeleteConfirmText(''); }}
                        className="bg-gray-800 text-gray-300 border border-gray-600 px-6 py-2 hover:bg-gray-700 transition-colors focus:outline-none"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
