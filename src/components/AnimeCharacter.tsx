import React, { useEffect, useRef, useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Activity, 
  Settings, 
  Terminal, 
  X, 
  ChevronUp, 
  Radio, 
  Cpu, 
  Heart, 
  Sparkles,
  Zap,
  RefreshCw,
  Eye,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Live2D Models Configuration
interface Live2DModelInfo {
  id: string;
  name: string;
  url: string;
  creator: string;
  description: string;
  scaleFactor: number;
}

const MODELS: Live2DModelInfo[] = [
  {
    id: 'hiyori',
    name: 'A.I. Hiyori',
    url: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/hiyori/hiyori.model3.json',
    creator: 'Live2D Inc.',
    description: 'High-fidelity Cybernetic Companion optimized for full sync diagnostics.',
    scaleFactor: 0.12,
  },
  {
    id: 'haru',
    name: 'Haru Protocol',
    url: 'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/haru/haru_greeter.model3.json',
    creator: 'Live2D Inc.',
    description: 'Security & interface protocol model with multi-motion support.',
    scaleFactor: 0.10,
  }
];

const CYBER_PHRASES = [
  "Core systems operating within standard parameters.",
  "Neural bridge synchronization: 98.6% complete.",
  "Madu Multi-Device background processes running cleanly.",
  "Durable cloud storage connected and ready.",
  "Analyzing terminal workspace commands. Log is clear.",
  "Cybernetic interfaces fully aligned.",
  "Warning: High level of optimization detected in node sandbox.",
  "Did you know? Terminating dead processes saves battery and RAM.",
  "Awaiting your command, Admin.",
  "All WhatsApp relays are humming at standard frequency."
];

const GREETINGS = [
  "Hello Admin! Systems are healthy. Ready for deployment.",
  "Connection established. Syncing server clusters.",
  "Welcome back. Holo-sync is online."
];

export default function AnimeCharacter() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Script / library loading state
  const [libLoadState, setLibLoadState] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  
  // App States
  const [isMinimized, setIsMinimized] = useState<boolean>(true); // start minimized to not obstruct admin main screen
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [dialogue, setDialogue] = useState<string>("Cybernetic Companion protocol initialized.");
  const [selectedModel, setSelectedModel] = useState<Live2DModelInfo>(MODELS[0]);
  const [showModelConfig, setShowModelConfig] = useState<boolean>(false);
  
  // Telemetry real-time states
  const [hudStats, setHudStats] = useState({
    cpu: '1.2%',
    sync: '98.8%',
    vibe: 'Responsive',
    neuralLoad: '14%'
  });
  
  // References to PIXI instances to allow proper disposal
  const pixiAppRef = useRef<any>(null);
  const currentModelRef = useRef<any>(null);

  // Helper utility to load script sequence with resilient fallbacks
  const loadScriptWithFallbacks = (urls: string[], checkFn: () => boolean): Promise<boolean> => {
    return new Promise((resolve) => {
      if (checkFn()) {
        resolve(true);
        return;
      }

      let index = 0;

      const tryLoadNext = () => {
        if (index >= urls.length) {
          console.error("All fallback URLs failed to load for resource list:", urls);
          resolve(false);
          return;
        }

        const url = urls[index];
        index++;

        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        script.onload = () => {
          setTimeout(() => {
            if (checkFn()) {
              resolve(true);
            } else {
              try {
                document.head.removeChild(script);
              } catch (_) {}
              tryLoadNext();
            }
          }, 50);
        };
        
        script.onerror = () => {
          console.warn(`Failed to load external module mirror: ${url}. Attempting next...`);
          try {
            document.head.removeChild(script);
          } catch (_) {}
          tryLoadNext();
        };

        document.head.appendChild(script);
      };

      tryLoadNext();
    });
  };

  // 1. Sequentially load PixiJS, Live2D Cubism Core and the Display Bridge
  useEffect(() => {
    let isMounted = true;
    
    const initLibraries = async () => {
      if (libLoadState === 'success') return;
      setLibLoadState('loading');
      
      try {
        // Load PIXI
        const pixiSuccess = await loadScriptWithFallbacks([
          '/pixi.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.3.12/pixi.min.js',
          'https://cdn.jsdelivr.net/npm/pixi.js@5.3.12/dist/pixi.min.js',
          'https://unpkg.com/pixi.js@5.3.12/dist/pixi.min.js'
        ], () => !!(window as any).PIXI);

        if (!pixiSuccess) {
          if (isMounted) setLibLoadState('failed');
          return;
        }
        
        // Load Live2D Core
        const coreSuccess = await loadScriptWithFallbacks([
          '/live2dcubismcore.min.js',
          'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/live2dcubismcore.min.js',
          'https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Core/live2dcubismcore.js',
          'https://cdn.jsdelivr.net/gh/GerritVance/pixi-live2d-display/Core/live2dcubismcore.js'
        ], () => !!(window as any).Live2DCubismCore);

        if (!coreSuccess) {
          if (isMounted) setLibLoadState('failed');
          return;
        }
        
        // Load Pixi Live2D display bridge
        const bridgeSuccess = await loadScriptWithFallbacks([
          '/pixi-live2d-display.min.js',
          'https://cdn.jsdelivr.net/npm/pixi-live2d-display/dist/cubism4.min.js',
          'https://unpkg.com/pixi-live2d-display/dist/cubism4.min.js',
          'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/dist/cubism4.min.js'
        ], () => !!(window as any).PIXI?.live2d);

        if (!bridgeSuccess) {
          if (isMounted) setLibLoadState('failed');
          return;
        }

        if (isMounted) {
          setLibLoadState('success');
          // Greet User
          triggerSpeech(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
        }
      } catch (err) {
        console.error('Error constructing Live2D companion:', err);
        if (isMounted) setLibLoadState('failed');
      }
    };

    initLibraries();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Telemetry noise generator to make the cyber card feel alive
  useEffect(() => {
    const timer = setInterval(() => {
      setHudStats({
        cpu: (1.0 + Math.random() * 2.5).toFixed(1) + '%',
        sync: (97.8 + Math.random() * 2.1).toFixed(1) + '%',
        vibe: ['Responsive', 'Alert', 'Calm', 'Processing'][Math.floor(Math.random() * 4)],
        neuralLoad: (10 + Math.floor(Math.random() * 15)) + '%'
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // 3. Render and initialize the Live2D character on canvas
  useEffect(() => {
    if (libLoadState !== 'success' || isMinimized || !canvasRef.current) return;

    const PIXI = (window as any).PIXI;
    if (!PIXI) return;

    // Create the Pixi Application to handle rendering
    const app = new PIXI.Application({
      view: canvasRef.current,
      autoStart: true,
      backgroundAlpha: 0, // fully transparent so cyber glows behind work perfectly
      antialias: true,
      width: 260,
      height: 340,
    });
    pixiAppRef.current = app;

    let model: any = null;

    const loadLive2DCharacter = async () => {
      try {
        model = await PIXI.live2d.Live2DModel.from(selectedModel.url);
        currentModelRef.current = model;

        // Position the model
        model.anchor.set(0.5, 0.5);
        model.x = app.screen.width / 2;
        model.y = app.screen.height * 0.52;
        
        // Scale factor adjustment
        const scale = selectedModel.scaleFactor;
        model.scale.set(scale, scale);

        // Turn on user interaction
        model.interactive = true;
        
        // On click trigger custom action
        model.on('hit', (hitAreas: string[]) => {
          if (hitAreas.includes('head')) {
            triggerSpeech("Diagnostics: Cerebral sensors synced. Neural link operating cleanly!");
            playRandomExpressionOrMotion();
          } else if (hitAreas.includes('body')) {
            triggerSpeech("Tactile feedback received. Core temperature within safe boundaries.");
            playRandomExpressionOrMotion();
          } else {
            triggerSpeech("A.I. core tapped. Companion is highly responsive.");
            playRandomExpressionOrMotion();
          }
        });

        app.stage.addChild(model);
      } catch (err) {
        console.error('Failed to load Live2D model texture files:', err);
      }
    };

    loadLive2DCharacter();

    // Clean up Pixi app and variables to prevent webgl context leakages
    return () => {
      if (currentModelRef.current) {
        app.stage.removeChild(currentModelRef.current);
        currentModelRef.current.destroy();
        currentModelRef.current = null;
      }
      if (pixiAppRef.current) {
        app.destroy(true, {
          children: true,
          texture: true,
          baseTexture: true
        });
        pixiAppRef.current = null;
      }
    };
  }, [libLoadState, isMinimized, selectedModel]);

  // Pointer movement listener for live pointer tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!currentModelRef.current || !canvasRef.current) return;
    try {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      currentModelRef.current.focus(x, y);
    } catch (_) {}
  };

  // Helper to execute simple motions
  const playRandomExpressionOrMotion = () => {
    const model = currentModelRef.current;
    if (!model) return;
    try {
      if (model.definitions?.motions) {
        const motionGroups = Object.keys(model.definitions.motions);
        if (motionGroups.length > 0) {
          const randomGroup = motionGroups[Math.floor(Math.random() * motionGroups.length)];
          model.motion(randomGroup);
        }
      }
    } catch (_) {}
  };

  // Custom text speech logic with Web Speech API integration
  const triggerSpeech = (text: string) => {
    setDialogue(text);
    if (!voiceEnabled) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.15; // sweet cute anime companion pitch
      
      // Try to find a nice female/clear robotic synthesized voice
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira')));
      if (engVoice) {
        utterance.voice = engVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis failed or is unavailable in core iframe:', err);
    }
  };

  const handleDiagnose = () => {
    triggerSpeech("Initializing terminal diagnostics... Memory, storage and Node sandbox: all green.");
    playRandomExpressionOrMotion();
    // Shake stats momentarily
    setHudStats(prev => ({ ...prev, sync: '100%', cpu: '0.4%' }));
  };

  const handleIdleTalk = () => {
    const randomPhrase = CYBER_PHRASES[Math.floor(Math.random() * CYBER_PHRASES.length)];
    triggerSpeech(randomPhrase);
    playRandomExpressionOrMotion();
  };

  const toggleVoice = () => {
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);
    if (nextState) {
      // Voice enabled speech trigger
      setTimeout(() => {
        triggerSpeech("Vocal synthesizer synchronized. Audio neural link active.");
      }, 100);
    }
  };

  const switchModel = (modelInfo: Live2DModelInfo) => {
    setSelectedModel(modelInfo);
    setShowModelConfig(false);
    triggerSpeech(`Deploying interface protocols for ${modelInfo.name}. Loaded successfully!`);
  };

  // If libraries failed to load, don't show complex applet
  if (libLoadState === 'failed') {
    return null;
  }

  return (
    <div id="live2d-character-widget" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans pointer-events-none select-none flex flex-col items-end w-[calc(100vw-32px)] sm:w-auto">
      <AnimatePresence mode="wait">
        
        {/* State A: Minimized Floating HUD Capsule */}
        {isMinimized ? (
          <motion.button
            key="minimized-capsule"
            id="minimized-capsule-button"
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => {
              setIsMinimized(false);
              // speak greeting when maximized
              setTimeout(() => {
                triggerSpeech("System overlay expanded. Interface is ready.");
              }, 400);
            }}
            className="pointer-events-auto flex items-center gap-3 p-3 bg-slate-950/90 hover:bg-slate-900 border border-cyan-500/40 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.35)] cursor-pointer backdrop-blur-xl group transition-all duration-300"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center p-[1px]">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-cyan-400 group-hover:text-white transition-colors">
                  <Eye className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full animate-ping"></span>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
            </div>
            
            <div className="text-left pr-4">
              <p className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">OS COMPANION</p>
              <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-200 transition-colors">Expand Companion</p>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="full-hud"
            id="companion-full-hud"
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="pointer-events-auto w-full sm:w-80 max-w-sm bg-slate-950/95 border border-[#1e295d]/60 rounded-3xl overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.85)] relative backdrop-blur-2xl flex flex-col"
            style={{
              boxShadow: '0 0 35px rgba(30, 41, 93, 0.25), inset 0 0 20px rgba(6, 182, 212, 0.05)'
            }}
          >
            
            {/* Holographic background cyber grid lines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(45deg,#00f2fe_1px,transparent_1px),linear-gradient(-45deg,#3b82f6_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            {/* Outer cyber glow frame header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0a1020]/80 border-b border-[#1e295d]/40 relative">
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-indigo-500 animate-[pulse_3s_infinite]"></div>
              
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
                    {selectedModel.name}
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                  </h3>
                  <p className="text-[9px] font-mono text-cyan-400/80 -mt-0.5 uppercase tracking-widest font-semibold">NEURAL SYS COMPANION</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  id="toggle-model-settings"
                  onClick={() => setShowModelConfig(!showModelConfig)}
                  className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Switch Character Interface"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  id="minimize-companion-button"
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                  title="Minimize Companion"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Config Overlay - Allows switching Model */}
            <AnimatePresence>
              {showModelConfig && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  className="absolute top-[48px] inset-x-0 bg-slate-950/98 border-b border-[#1e295d]/80 z-20 p-4 font-sans text-xs origin-top"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold tracking-widest font-mono text-[10px] text-cyan-400 uppercase">SYS MODULE GUEST_LINK</span>
                    <button onClick={() => setShowModelConfig(false)} className="text-slate-400 hover:text-slate-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => switchModel(m)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                          selectedModel.id === m.id
                            ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200'
                            : 'bg-slate-905 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center font-bold">
                          <span>{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono italic">by {m.creator}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 leading-normal">{m.description}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Companion Render Frame Container */}
            <div 
              onPointerMove={handlePointerMove}
              className="relative h-[340px] w-full bg-gradient-to-b from-slate-950 via-[#030612]/90 to-slate-950 flex items-center justify-center overflow-hidden"
            >
              
              {/* Scanlines dynamic filter */}
              <div 
                className="absolute inset-0 pointer-events-none z-10" 
                style={{
                  background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
                  backgroundSize: '100% 4px, 6px 100%'
                }}
              ></div>

              {/* Holographic Projection Ambient Rays */}
              <div className="absolute top-0 bottom-0 left-1/4 right-1/4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none blur-xl"></div>
              
              {/* Interactive Speech Dialogue Bubble */}
              <div className="absolute top-3 inset-x-3 z-10">
                <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-[11px] leading-relaxed text-slate-200 min-h-[46px] relative backdrop-blur-md">
                  {/* Speech bubble pointer */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-r border-b border-cyan-500/30 rotate-45"></div>
                  
                  <div className="flex items-start gap-1">
                    <span className="text-[10px] text-cyan-400 font-mono shrink-0 font-bold select-none">&gt;</span>
                    <p className="font-medium text-slate-100">{dialogue}</p>
                  </div>
                </div>
              </div>

              {/* Loader indicator while loading libraries */}
              {libLoadState === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-25 bg-slate-950">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                  <p className="text-xs font-mono text-cyan-400 animate-pulse tracking-widest uppercase">SYNCING WEBGL COMPANION</p>
                </div>
              )}

              {/* Canvas element for PixiJS rendered character */}
              <canvas 
                ref={canvasRef} 
                className={`w-[260px] h-[340px] transition-opacity duration-700 ${libLoadState === 'success' ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Floating micro telemetry dials inside canvas */}
              <div className="absolute bottom-2 left-3 font-mono text-[9px] text-slate-400/80 space-y-0.5 select-none pointer-events-none z-10">
                <div className="flex items-center gap-1.5 text-slate-400/90 font-bold">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  <span>CORE LOAD: {hudStats.cpu}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-indigo-400" />
                  <span>SYNC COEF: {hudStats.sync}</span>
                </div>
              </div>

              <div className="absolute bottom-2 right-3 font-mono text-[9px] text-slate-400/80 space-y-0.5 text-right select-none pointer-events-none z-10">
                <span className="inline-block px-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-[8px] tracking-wider uppercase font-bold">
                  MODE: {hudStats.vibe}
                </span>
                <p className="text-[8px] uppercase tracking-widest text-[#00f2fe]/80 font-bold mt-1">NEURAL_SYS : {hudStats.neuralLoad}</p>
              </div>

              {/* Visual equalizer pulsing logic if the character is speaking */}
              {isSpeaking && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-[2px] h-3 z-15 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-[3px] bg-cyan-400 rounded-full animate-pulse"
                      style={{ 
                        height: `${Math.floor(Math.random() * 12) + 4}px`,
                        animationDuration: `${0.3 + (i * 0.1)}s` 
                      }}
                    ></span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons and controls under character */}
            <div className="p-4 bg-[#050816]/95 border-t border-[#1e295d]/40 flex flex-col gap-3">
              
              {/* Interactive buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="companion-diagnose-button"
                  onClick={handleDiagnose}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-cyan-500/30 hover:border-cyan-400/80 bg-cyan-950/20 hover:bg-cyan-900/40 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Core Diagnostic</span>
                </button>
                <button
                  id="companion-talk-button"
                  onClick={handleIdleTalk}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-indigo-500/30 hover:border-indigo-400/80 bg-indigo-950/20 hover:bg-indigo-900/40 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Query Mind</span>
                </button>
              </div>

              {/* Audio controller section */}
              <div className="flex items-center justify-between px-2 py-1 bg-slate-900/50 border border-slate-800/80 rounded-xl text-[10.5px]">
                <span className="font-mono text-slate-400 font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-500 animate-pulse fill-red-500/20" />
                  Voice Synthesizer Link
                </span>
                
                <button
                  id="companion-sound-toggle"
                  onClick={toggleVoice}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[9.5px] font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                    voiceEnabled 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                      : 'bg-slate-950/40 text-slate-500 border border-slate-800/40 hover:text-slate-300'
                  }`}
                >
                  {voiceEnabled ? (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3 h-3" />
                      <span>OFF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
