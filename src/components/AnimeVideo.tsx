import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Settings, 
  Tv, 
  Sliders, 
  Sparkles, 
  Minimize2, 
  Maximize2, 
  Plus, 
  Check, 
  Video,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronUp,
  Layout,
  Info
} from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  url: string;
  description: string;
}

const VIDEO_PRESETS: Preset[] = [
  {
    id: 'user-anime-lofi',
    name: '🌸 Premium Anime Lofi Chill',
    url: 'https://www.youtube.com/watch?v=CY5WLrSYPzo',
    description: 'Beautiful custom anime lofi girl scene.'
  },
  {
    id: 'lofi-study',
    name: '☕ Lofi Study Glow',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-cup-on-table-with-lofi-glow-40788-large.mp4',
    description: 'Cozy study session loop with ambient steam.'
  },
  {
    id: 'lofi-girl-classic',
    name: '🎧 Lofi Girl Classic Loop',
    url: 'https://www.youtube.com/watch?v=tNkZs5bCg0A',
    description: 'The iconic Lofi Girl study session backdrop.'
  },
  {
    id: 'rainy-lofi',
    name: '🌧️ Anime Rain Window',
    url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    description: 'Soothing rain and coffee on a window pane.'
  },
  {
    id: 'neon-city',
    name: '🌆 Cyberpunk Alley',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-neon-city-street-at-night-41589-large.mp4',
    description: 'Rainy neon-drenched city alleyway.'
  },
  {
    id: 'subway',
    name: '🚄 Cyber Subway Train',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-subway-station-in-a-futuristic-city-43230-large.mp4',
    description: 'Gliding transit loop through cyber grids.'
  },
  {
    id: 'synthwave-road',
    name: '🌌 Outrun Highway',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-driving-on-a-neon-road-at-night-background-loop-41593-large.mp4',
    description: 'Classic retro synthwave grid road loop.'
  },
  {
    id: 'rainy-neon',
    name: '🌧️ Neon Rain Reflection',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-neon-city-with-rain-41591-large.mp4',
    description: 'Cozy neon city glow on a rainy evening.'
  },
  {
    id: 'local-fallback',
    name: '🎭 Fallback Offline Loop',
    url: '/videos/anime-bg.mp4',
    description: 'Local system default backup anime video.'
  }
];

// Check if a URL is a YouTube Video Link with double fallback parsed support
const getYoutubeId = (url: string) => {
  if (!url) return null;
  const cleanUrl = url.trim();

  // If they pasted just an 11-character video ID, e.g. CY5WLrSYPzo
  if (cleanUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // Comprehensive YouTube ID match regex (includes watch?v=, watch/..., embed/..., v/..., shorts/..., live/..., youtu.be/...)
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = cleanUrl.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  // Backup manual parsing for safety
  try {
    const urlObj = new URL(cleanUrl);
    
    // handles youtu.be/ID
    if (urlObj.hostname.includes('youtu.be')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts[0] && pathParts[0].length === 11) {
        return pathParts[0];
      }
    }

    // handles youtube.com / m.youtube.com
    if (urlObj.hostname.includes('youtube.com')) {
      // 1. check query param v=
      const vParam = urlObj.searchParams.get('v');
      if (vParam && vParam.length === 11) {
        return vParam;
      }

      // 2. check paths: shorts, live, embed, v
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const keywords = ['shorts', 'live', 'embed', 'v', 'watch'];
      for (let i = 0; i < pathParts.length; i++) {
        if (keywords.includes(pathParts[i])) {
          if (pathParts[i + 1] && pathParts[i + 1].length === 11) {
            return pathParts[i + 1];
          }
        }
      }
      
      // 3. if the last path part is 11 chars
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.length === 11) {
        return lastPart;
      }
    }
  } catch (e) {
    // ignore parsing errors
  }

  return null;
};

export default function AnimeVideo() {
  // Persistent client state
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    const saved = localStorage.getItem('ayezz_anime_video_url');
    // If empty, or contains the old Mixkit coffee cup URL, upgrade to the user's gorgeous requested premium lofi video!
    if (!saved || saved.includes('mixkit-coffee-cup-on-table')) {
      return VIDEO_PRESETS[0].url;
    }
    return saved;
  });

  const ytId = getYoutubeId(currentUrl);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  
  const [opacity, setOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('ayezz_anime_video_opacity');
    return saved ? Number(saved) : 0.8;
  });
  
  const [layoutMode, setLayoutMode] = useState<'floating' | 'background'>(() => {
    const saved = localStorage.getItem('ayezz_anime_video_layout');
    // Default to 'background' layout so it serves as an immersive wallpaper instantly!
    if (!saved) {
      return 'background';
    }
    return saved as 'floating' | 'background';
  });

  const changeLayoutMode = (mode: 'floating' | 'background') => {
    setLayoutMode(mode);
    localStorage.setItem('ayezz_anime_video_layout', mode);
    window.dispatchEvent(new Event('ayezz_video_layout_changed'));
  };
  
  const [widgetSize, setWidgetSize] = useState<'sm' | 'md' | 'lg'>(() => {
    return (localStorage.getItem('ayezz_anime_video_size') as 'sm' | 'md' | 'lg') || 'md';
  });
  
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>(() => {
    return (localStorage.getItem('ayezz_anime_video_position') as any) || 'bottom-right';
  });

  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [customNotification, setCustomNotification] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem('ayezz_anime_video_url', currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    localStorage.setItem('ayezz_anime_video_opacity', opacity.toString());
  }, [opacity]);

  useEffect(() => {
    localStorage.setItem('ayezz_anime_video_layout', layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    localStorage.setItem('ayezz_anime_video_size', widgetSize);
  }, [widgetSize]);

  useEffect(() => {
    localStorage.setItem('ayezz_anime_video_position', position);
  }, [position]);

  // Handle Play/Pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {
          console.log('Autoplay request blocked or interrupted');
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentUrl]);

  // Sync Play/Pause and Mute state dynamically with any embedded YouTube players
  useEffect(() => {
    if (ytId) {
      const sendPlayerCommand = (func: string) => {
        const message = JSON.stringify({ event: 'command', func });
        
        // Find BG Iframe
        const bgIframe = document.querySelector('iframe[title="Anime BG Loop"]') as HTMLIFrameElement;
        if (bgIframe && bgIframe.contentWindow) {
          bgIframe.contentWindow.postMessage(message, '*');
        }
        
        // Find Floating Iframe
        const floatIframe = document.querySelector('iframe[title="Floating Anime Loop"]') as HTMLIFrameElement;
        if (floatIframe && floatIframe.contentWindow) {
          floatIframe.contentWindow.postMessage(message, '*');
        }
      };

      // Slight timeout to ensure iframe loading is completed before posting command
      const timer = setTimeout(() => {
        if (isPlaying) {
          sendPlayerCommand('playVideo');
        } else {
          sendPlayerCommand('pauseVideo');
        }

        if (isMuted) {
          sendPlayerCommand('mute');
        } else {
          sendPlayerCommand('unMute');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isMuted, ytId, currentUrl]);

  const triggerNotification = (text: string) => {
    setCustomNotification(text);
    setTimeout(() => {
      setCustomNotification(null);
    }, 3500);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    let targetUrl = customUrlInput.trim();
    // Strip quotes if they pasted with quotes
    if ((targetUrl.startsWith('"') && targetUrl.endsWith('"')) || (targetUrl.startsWith("'") && targetUrl.endsWith("'"))) {
      targetUrl = targetUrl.slice(1, -1).trim();
    }
    
    // Auto-detect YouTube and parse
    const detectedYtId = getYoutubeId(targetUrl);
    if (detectedYtId) {
      setCurrentUrl(`https://www.youtube.com/watch?v=${detectedYtId}`);
      setIsPlaying(true);
      triggerNotification('📺 YouTube Anime video loop parsed successfully!');
    } else if (targetUrl.startsWith('http') || targetUrl.startsWith('/') || targetUrl.startsWith('data:')) {
      setCurrentUrl(targetUrl);
      setIsPlaying(true);
      triggerNotification('✨ Custom direct video URL applied successfully!');
    } else {
      triggerNotification('⚠️ Invalid URL format. Please paste a secure URL.');
    }
    setCustomUrlInput('');
  };

  const handlePresetSelect = (preset: Preset) => {
    setCurrentUrl(preset.url);
    setIsPlaying(true);
    triggerNotification(`🎬 Loaded: ${preset.name}`);
  };

  // Sizing definitions
  const sizeClasses = {
    sm: 'w-[140px] md:w-[220px]',
    md: 'w-[180px] md:w-[320px]',
    lg: 'w-[240px] md:w-[420px]'
  };

  // Position coordinates inside the dashboard
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4'
  };

  // Active styles for layout
  const isBgMode = layoutMode === 'background';

  // Floating window wrapper animations
  const widgetVariants = {
    initial: { opacity: 0, scale: 0.92, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 15 }
  };

  return (
    <>
      {/* Immersive Background Mode rendering */}
      {isBgMode && (
        <div 
          id="anime-background-host"
          className="fixed inset-0 w-full h-full z-0 pointer-events-none transition-all duration-700 overflow-hidden"
          style={{ opacity: opacity * 0.25 }}
        >
          {ytId ? (
            <iframe
              title="Anime BG Loop"
              className="w-full h-full scale-[1.3] pointer-events-none border-none object-cover"
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&enablejsapi=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
              src={currentUrl}
            />
          )}
          {/* Futuristic matrix scanning grid overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020512] via-transparent to-[#020512]/40 pointer-events-none mix-blend-overlay" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#020512_95%)] pointer-events-none" />
        </div>
      )}

      {/* Floating control trigger button if completely minimized */}
      {isMinimized && (
        <motion.button
          id="restore-video-btn"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 z-50 p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/40 cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs font-mono"
        >
          <Video className="w-4 h-4 animate-pulse" />
          <span>Show Video</span>
        </motion.button>
      )}

      {/* Floating Mode or System Controller Host */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            id="anime-video-widget-container"
            variants={widgetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className={`fixed ${isBgMode ? 'bottom-4 right-4 w-72' : `${positionClasses[position]} ${sizeClasses[widgetSize]}`} z-50 rounded-3xl pointer-events-auto border border-cyan-500/25 shadow-[0_8px_35px_rgba(0,0,0,0.6)] overflow-hidden glassmorphism flex flex-col`}
          >
            {/* Header Controls Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-slate-900/60 font-mono text-[10px] text-slate-300 font-bold select-none">
              <div className="flex items-center gap-1.5">
                <Video className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="tracking-tight truncate max-w-[120px]">
                  {isBgMode ? "Background Config" : "Holo Display Active"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className={`p-1 hover:bg-white/10 rounded transition-colors cursor-pointer ${showConfig ? 'text-cyan-400' : 'text-slate-400'}`}
                  title="Configure video stream"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 hover:bg-white/10 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                  title="Minimize widget"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Playback Controller Deck */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/75 border-b border-slate-900/60 text-xs text-slate-300 font-sans z-10">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-400/30 rounded-xl text-white font-mono font-bold text-[9px] cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                  title={isPlaying ? "Pause Video" : "Play Video"}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3 text-cyan-300" />
                      <span>PAUSE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-white" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-1.5 border rounded-xl cursor-pointer transition-all flex items-center gap-1 ${
                    isMuted 
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-400' 
                      : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                  }`}
                  title={isMuted ? "Unmute Audio" : "Mute Audio"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className="capitalize tracking-wider">{layoutMode} mode</span>
              </div>
            </div>

            {/* Video Canvas Section (Visible only in Floating Mode) */}
            {!isBgMode && (
              <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                {ytId ? (
                  <iframe
                    title="Floating Anime Loop"
                    className="w-full h-full pointer-events-none border-none object-cover rounded-b-[2px]"
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&enablejsapi=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    style={{ opacity }}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover transition-opacity duration-300"
                    style={{ opacity }}
                    src={currentUrl}
                  />
                )}

                {/* Micro Ambient Glow reflection */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none" />

                {/* Inline playback deck on hover */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-1 hover:bg-white/5 rounded text-white cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1 hover:bg-white/5 rounded text-white cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-450" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  </div>
                  <span className="text-[8px] font-mono text-slate-400">
                    {ytId ? "YouTube" : "Direct Video"}
                  </span>
                </div>
              </div>
            )}

            {/* Custom Interactive Settings Drawer */}
            <AnimatePresence>
              {(showConfig || isBgMode) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-950/95 border-t border-slate-900 overflow-y-auto max-h-[340px] p-4 space-y-4 text-xs font-sans text-slate-300 scrollbar-thin"
                >
                  {/* Mode switch selectors */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => changeLayoutMode('floating')}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        !isBgMode ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Video className="w-3 h-3" />
                      <span>Floating Widget</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => changeLayoutMode('background')}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        isBgMode ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layout className="w-3 h-3" />
                      <span>Full BG Mode</span>
                    </button>
                  </div>

                  {/* Preset selections */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase tracking-wider font-bold">
                      🌸 Pre-Curated Anime Loops
                    </span>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {VIDEO_PRESETS.map((preset) => {
                        const isSelected = currentUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => handlePresetSelect(preset)}
                            className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-0.5 ${
                              isSelected
                                ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200'
                                : 'bg-slate-900/40 border-slate-900/60 hover:border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-semibold text-xs">{preset.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                            </div>
                            <span className="text-[9px] text-slate-500 leading-normal line-clamp-1">{preset.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct Paste Form */}
                  <form onSubmit={handleApplyCustomUrl} className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider font-bold">
                      🔗 Paste Custom URL
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="Paste .mp4 or YouTube video URL..."
                        className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500/60 font-mono"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl cursor-pointer flex items-center justify-center transition-all"
                        title="Load Link"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[8.5px] text-slate-500 leading-normal">
                      Accepts direct <strong>.mp4</strong> links (e.g. from GitHub/CDN) or any <strong>YouTube</strong> URL loop.
                    </p>
                  </form>

                  {/* Opacity Slider */}
                  <div className="space-y-2 pt-1 border-t border-slate-900/60">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Opacity Intensity</span>
                      <span className="text-cyan-400">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Positioning and Sizing Layout options (Only relevant in Floating Mode) */}
                  {!isBgMode && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900/60 text-[10px] font-mono">
                      {/* Anchor Placement */}
                      <div className="space-y-1.5">
                        <span className="text-slate-400 block font-bold uppercase tracking-wider">Placement</span>
                        <select
                          value={position}
                          onChange={(e) => setPosition(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200 outline-none"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>

                      {/* Display Size */}
                      <div className="space-y-1.5">
                        <span className="text-slate-400 block font-bold uppercase tracking-wider">Dimension</span>
                        <select
                          value={widgetSize}
                          onChange={(e) => setWidgetSize(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200 outline-none"
                        >
                          <option value="sm">Small</option>
                          <option value="md">Medium</option>
                          <option value="lg">Large</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Active Link status & Source info */}
                  <div className="pt-2 border-t border-slate-900/60 flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                    <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate flex-grow">Source: {currentUrl}</span>
                    {ytId && (
                      <span className="bg-red-950/20 text-red-400 border border-red-900/40 px-1 py-0.5 rounded font-bold">YT</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom Interactive Notification Banner inside widget */}
            <AnimatePresence>
              {customNotification && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="absolute bottom-2 left-2 right-2 bg-indigo-950/90 border border-indigo-500/30 text-indigo-200 p-2 rounded-xl text-[9px] leading-relaxed font-mono flex items-center gap-1.5 shadow-lg z-50 backdrop-blur-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />
                  <span>{customNotification}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
