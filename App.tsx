import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppMode, Protocol } from './types';
import { ENCRYPTION_MAP } from './constants';
import Button from './components/Button';
import { analyzeCipher } from './services/geminiService';
import { generateDeterministicMapping, encryptText, decryptText } from './utils/cipherUtils';

const STORAGE_KEY = 'ncryptor_protocols';

const LEGACY_PROTOCOL: Protocol = {
  id: 'Legacy-00',
  name: 'Legacy Symbol Matrix',
  mapping: ENCRYPTION_MAP,
  isCustom: false,
  createdAt: Date.now()
};

const ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const generateAlphanumericId = (length: number = 12): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC_CHARS.charAt(Math.floor(Math.random() * ALPHANUMERIC_CHARS.length));
  }
  return result;
};

const App: React.FC = () => {
  const [protocols, setProtocols] = useState<Record<string, Protocol>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = stored ? JSON.parse(stored) : {};
    return { 'Legacy-00': LEGACY_PROTOCOL, ...initial };
  });

  const [activeProtocolId, setActiveProtocolId] = useState('Legacy-00');
  const [mode, setMode] = useState<AppMode>(AppMode.ENCRYPT);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAutoProcess, setIsAutoProcess] = useState(true);
  const [isStealthMode, setIsStealthMode] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(1);
  const [isStale, setIsStale] = useState(false);
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyLookupInput, setKeyLookupInput] = useState('');
  const [lastGeneratedId, setLastGeneratedId] = useState<string | null>(null);

  const activeProtocol = useMemo(() => protocols[activeProtocolId] || LEGACY_PROTOCOL, [protocols, activeProtocolId]);

  const handleAiAction = useCallback(async () => {
    const textToAnalyze = output || input;
    if (!textToAnalyze) return;
    setIsAiLoading(true);
    setAiAnalysis('');
    try {
      const result = await analyzeCipher(textToAnalyze);
      setAiAnalysis(result);
    } catch (error) {
      setAiAnalysis("Analysis failed. Signal interference detected.");
    } finally {
      setIsAiLoading(false);
    }
  }, [input, output]);

  useEffect(() => {
    const { 'Legacy-00': _, ...customOnes } = protocols;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnes));
  }, [protocols]);

  const triggerToast = (msg = "PROTOCOL SYNCED") => {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.innerText = msg;
      toast.classList.remove('opacity-0');
      setTimeout(() => toast.classList.add('opacity-0'), 2000);
    }
  };

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    triggerToast("COPIED TO CLIPBOARD");
  }, [output]);

  const processText = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setIsStale(false);
      return;
    }

    const result = mode === AppMode.ENCRYPT 
      ? encryptText(input, activeProtocol.mapping, isStealthMode, noiseLevel, activeProtocolId)
      : decryptText(input, activeProtocol.mapping, noiseLevel, activeProtocolId);
      
    setOutput(result);
    setIsStale(false);
  }, [input, mode, activeProtocol, isStealthMode, noiseLevel, activeProtocolId]);

  useEffect(() => {
    if (isAutoProcess) processText();
    else setIsStale(true);
  }, [input, mode, isAutoProcess, isStealthMode, noiseLevel, processText]);

  const handleGenerateKey = () => {
    const newId = generateAlphanumericId(12);
    const newMapping = generateDeterministicMapping(newId);
    const newProtocol: Protocol = {
      id: newId,
      name: `Protocol-${newId}`,
      mapping: newMapping,
      isCustom: true,
      createdAt: Date.now()
    };
    setProtocols(prev => ({ ...prev, [newId]: newProtocol }));
    setActiveProtocolId(newId);
    setLastGeneratedId(newId);
    setInput('');
    triggerToast("NEW IDENTITY SPAWNED");
  };

  const handleLoadKey = () => {
    const tidiedId = keyLookupInput.trim().replace('#', '');
    if (tidiedId.length < 3) {
      alert("ID TOO SHORT. MINIMUM 3 CHARACTERS REQUIRED.");
      return;
    }

    if (!protocols[tidiedId]) {
      const reconstructedMapping = generateDeterministicMapping(tidiedId);
      const newProtocol: Protocol = {
        id: tidiedId,
        name: `Reconstructed-${tidiedId}`,
        mapping: reconstructedMapping,
        isCustom: true,
        createdAt: Date.now()
      };
      setProtocols(prev => ({ ...prev, [tidiedId]: newProtocol }));
    }

    setActiveProtocolId(tidiedId);
    setShowKeyModal(false);
    setKeyLookupInput('');
    setLastGeneratedId(null);
    triggerToast("PROTOCOL SYNCED");
  };

  const crackTimeEstimate = useMemo(() => {
    const idLen = activeProtocolId.length;
    if (activeProtocolId === 'Legacy-00') return "1.2 Seconds";
    
    if (idLen > 10) return "> 100k Years";
    if (idLen > 8) return "120 Days";
    if (idLen > 6) return "4 Hours";
    if (idLen > 4) return "12 Minutes";
    return "Instant";
  }, [activeProtocolId]);

  const securityRating = useMemo(() => {
    let score = 0;
    if (activeProtocolId.length >= 10 && /[a-zA-Z]/.test(activeProtocolId)) score += 3;
    else if (activeProtocolId !== 'Legacy-00') score += 1;
    
    if (isStealthMode) score += 1;
    if (noiseLevel === 2) score += 2;
    else if (noiseLevel === 1) score += 1;
    
    if (score >= 6) return { label: 'SPECTRE', color: 'text-rose-400' };
    if (score >= 4) return { label: 'PHANTOM', color: 'text-purple-400' };
    if (score >= 2) return { label: 'GHOST', color: 'text-emerald-400' };
    return { label: 'UNSECURE', color: 'text-amber-500' };
  }, [activeProtocolId, isStealthMode, noiseLevel]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto bg-[#0a0f1d] text-slate-200 selection:bg-emerald-500/30">
      <div id="toast" className="fixed top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-2 rounded-full shadow-2xl opacity-0 transition-opacity duration-300 pointer-events-none z-50 text-sm font-bold uppercase">
        PROTOCOL SYNCED
      </div>

      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-400 neon-text italic">N-CRYPTOR!</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-slate-600 text-[10px] font-black tracking-[0.4em] uppercase">Security Tier:</span>
             <span className={`text-[10px] font-black uppercase tracking-widest ${securityRating.color}`}>{securityRating.label}</span>
          </div>
        </div>

        <div onClick={() => setShowKeyModal(true)} className="bg-slate-900/80 border border-emerald-500/20 p-4 rounded-2xl cursor-pointer hover:border-emerald-500/50 transition-all flex items-center gap-5 shadow-2xl min-w-[240px]">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10 flex-shrink-0">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div className="pr-4 overflow-hidden">
            <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Active Protocol</div>
            <div className="text-2xl mono font-black text-emerald-400 tracking-tighter truncate">#{activeProtocolId}</div>
          </div>
        </div>
      </header>

      <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex bg-slate-800/20 p-1.5 rounded-2xl border border-slate-800/50 flex-1">
              {Object.values(AppMode).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-3 rounded-xl font-bold transition-all text-xs tracking-widest ${mode === m ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                  {m}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 bg-slate-800/20 px-6 py-2 rounded-2xl border border-slate-800/50">
               <button onClick={() => setIsStealthMode(!isStealthMode)} className="flex flex-col items-center">
                 <span className={`text-[8px] font-black tracking-tighter mb-1 ${isStealthMode ? 'text-emerald-400' : 'text-slate-600'}`}>STEALTH</span>
                 <div className={`w-10 h-5 rounded-full p-1 transition-colors ${isStealthMode ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                   <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isStealthMode ? 'translate-x-5' : 'translate-x-0'}`} />
                 </div>
               </button>
               <div className="h-8 w-px bg-slate-800" />
               <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-600 tracking-tighter mb-1">NOISE LEVEL</span>
                 <div className="flex gap-1">
                   {[0, 1, 2].map(l => (
                     <button key={l} onClick={() => setNoiseLevel(l)} className={`w-4 h-4 rounded-sm border transition-all ${noiseLevel === l ? 'bg-emerald-500 border-emerald-400' : 'border-slate-700 hover:border-slate-500'}`} />
                   ))}
                 </div>
               </div>
            </div>
          </div>

          <div className="relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === AppMode.ENCRYPT ? "INPUT SIGNAL..." : "INPUT CIPHERTEXT..."}
              className="w-full h-48 bg-slate-900/40 border-2 border-slate-800/50 rounded-3xl p-6 mono text-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 outline-none transition-all resize-none placeholder:text-slate-700"
            />
            {isStale && (
              <div className="absolute top-4 right-4 animate-pulse">
                <div className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-1 rounded font-bold border border-amber-500/30 uppercase tracking-widest">STALE BUFFER</div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="h-px bg-slate-800/50 flex-1" />
            <div className="px-6">
               {!isAutoProcess && <Button onClick={processText}>RE-PROCESS BUFFER</Button>}
            </div>
            <div className="h-px bg-slate-800/50 flex-1" />
          </div>

          <div className="relative group">
            <div className="absolute -top-3 left-6 px-3 bg-[#0a0f1d] text-[10px] font-black text-emerald-500 tracking-[0.3em] uppercase">Output Channel</div>
            <div className="w-full min-h-[12rem] bg-emerald-500/5 border-2 border-emerald-500/10 rounded-3xl p-6 mono text-lg break-all whitespace-pre-wrap text-emerald-400/90 relative overflow-hidden">
               {output || <span className="text-slate-800 italic">AWAITING TRANSMISSION...</span>}
               {output && (
                 <button onClick={handleCopy} className="absolute top-4 right-4 p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-500 transition-all border border-emerald-500/10">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                 </button>
               )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 flex flex-col gap-4">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
               <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
               Security Audit
             </h3>
             <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mb-2 relative">Crack Time Estimate</div>
                <div className="text-2xl font-black text-emerald-400 mono tracking-tighter relative">{crackTimeEstimate}</div>
                <div className="mt-3 text-[7px] text-slate-700 font-bold uppercase tracking-widest italic opacity-60 relative">Calculated via Bruteforce heuristic</div>
             </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 flex flex-col gap-4">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
               Signal Analysis
             </h3>
             <Button variant="secondary" onClick={handleAiAction} disabled={isAiLoading || (!input && !output)} fullWidth>
               {isAiLoading ? 'SCANNING...' : 'AI HEURISTICS'}
             </Button>
             
             {aiAnalysis && (
               <div className="bg-slate-950/50 border border-emerald-500/10 rounded-2xl p-4 text-xs leading-relaxed text-slate-400 italic font-medium relative">
                 <div className="absolute top-0 right-0 p-2 opacity-20">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                 </div>
                 {aiAnalysis}
               </div>
             )}
          </div>
        </aside>
      </div>

      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#070b14]/90 backdrop-blur-xl" onClick={() => setShowKeyModal(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                   <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">PROTOCOL CONTROL</h2>
                <p className="text-slate-500 text-xs mt-2 uppercase tracking-[0.2em]">Sync existing or spawn new identity</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Sync Protocol ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={keyLookupInput}
                      onChange={(e) => setKeyLookupInput(e.target.value)}
                      placeholder="#Xy9Z1..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 mono text-emerald-400 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleLoadKey()}
                    />
                    <button onClick={handleLoadKey} className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-all shadow-lg">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>

                <div className="relative py-4 flex items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-700 font-bold uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <Button onClick={handleGenerateKey} fullWidth variant="primary" className="py-4 !rounded-2xl">
                  SPAWN NEW IDENTITY
                </Button>
              </div>

              {lastGeneratedId && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                   <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Last Generated Protocol</div>
                   <div className="mono text-emerald-400 font-black text-lg select-all">#{lastGeneratedId}</div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowKeyModal(false)}
              className="w-full py-4 bg-slate-950/50 text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-[0.4em] transition-colors border-t border-slate-800"
            >
              Close Override
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;