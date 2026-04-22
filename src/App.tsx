/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, PictureInPicture, Search, ArrowLeft, Loader2, Download, Heart, Gamepad2 } from 'lucide-react';
import Vault from './Vault';
import KidsGame from './KidsGame';
import localforage from 'localforage';

interface VideoResult {
  videoId: string;
  title: string;
  url: string;
  thumbnail: string;
  image: string;
  timestamp: string;
  views: number;
  author: { name: string };
}

export default function App() {
  const [view, setView] = useState<'home' | 'player' | 'vault' | 'game'>('home');
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoResult | null>(null);
  const [inputQuery, setInputQuery] = useState('');
  
  const [playing, setPlaying] = useState(false);
  const [pip, setPip] = useState(false);
  const [secretCounter, setSecretCounter] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    fetchTrending();
    localforage.getItem('liked_videos').then((val) => {
      if (val) setLikedVideos(val as Record<string, boolean>);
    });
  }, []);

  const toggleLike = async (videoId: string) => {
    const newLikes = { ...likedVideos, [videoId]: !likedVideos[videoId] };
    setLikedVideos(newLikes);
    await localforage.setItem('liked_videos', newLikes);
  };

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trending');
      const data = await res.json();
      setVideos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async (query: string) => {
    if (!query.trim()) {
      return fetchTrending();
    }
    setLoading(true);
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(query));
      const data = await res.json();
      setVideos(data);
      setView('home');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(inputQuery);
  };

  const playVideo = (v: VideoResult) => {
    setActiveVideo(v);
    setPlaying(true);
    setView('player');
  };

  const formatViews = (views: number | undefined) => {
    if (!views) return '';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M views';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K views';
    return views.toLocaleString() + ' views';
  };

  const handleSecretClick = () => {
    setSecretCounter((c) => {
      if (c + 1 >= 5) {
        setView('vault');
        return 0;
      }
      return c + 1;
    });
  };

  if (view === 'vault') {
    return <Vault onClose={() => setView('home')} />;
  }

  if (view === 'game') {
    return <KidsGame onClose={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans selection:bg-[#E1C27A]/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0add] backdrop-blur-md px-4 lg:px-8 flex flex-wrap items-center justify-between py-4 border-b border-white/10 gap-4">
        <div className="flex items-center gap-4 lg:gap-12 cursor-pointer group" onClick={() => setView('home')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-[#E1C27A]/50 bg-[#E1C27A]/10 flex items-center justify-center group-hover:bg-[#E1C27A]/30 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-6 h-6 bg-[#E1C27A] opacity-30 blur-md rounded-full"></div>
              <span className="font-serif italic text-xl text-[#E1C27A] font-bold pr-0.5 drop-shadow-md">N<span className="text-white">S</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg lg:text-xl font-bold tracking-[0.1em] uppercase leading-none text-white">
                NON <span className="font-light text-white/50">STOP</span>
              </span>
              <span className="text-[8px] text-[#E1C27A] uppercase tracking-widest font-mono mt-1">Premium Edition</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="flex-1 w-full max-w-xl min-w-[200px]">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#E1C27A]" />
            </div>
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="block w-full pl-8 pr-4 py-2 bg-transparent border-b border-white/20 text-[#F5F5F5] placeholder-white/30 focus:border-[#E1C27A] focus:outline-none transition-colors text-xs font-mono uppercase tracking-widest"
              placeholder="Search songs, movies, creators..."
            />
          </div>
        </form>
        
        <div className="flex items-center gap-6 hidden md:flex">
          <button 
            onClick={() => setView('game')}
            className="flex items-center gap-2 px-4 py-1.5 border border-blue-500/20 bg-blue-500/10 rounded-full text-[10px] uppercase tracking-tighter font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            <Gamepad2 className="w-3.5 h-3.5" /> Kids Arcade
          </button>
          <div 
            onClick={handleSecretClick}
            className="px-4 py-1 border border-white/20 rounded-full text-[10px] uppercase tracking-tighter font-medium text-white/50 cursor-pointer select-none hover:text-[#E1C27A] transition-colors"
          >
            Premium Mode
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
        
        {view === 'home' && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-serif italic text-white/50 tracking-wider">
                 {inputQuery ? `Showing results for "${inputQuery}"` : 'Curated Library'}
              </h2>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-[#E1C27A] mb-4" />
                <p className="text-xs uppercase font-mono tracking-widest text-[#E1C27A]">Fetching Signals...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {videos.map((v, i) => (
                  <div 
                    key={v.videoId + i} 
                    onClick={() => playVideo(v)}
                    className="group cursor-pointer flex flex-col gap-3"
                  >
                    {/* Thumbnail Container */}
                    <div className="aspect-video w-full relative rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-[#E1C27A]/50 transition-colors">
                      <img 
                        src={v.thumbnail || v.image} 
                        alt={v.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-[#E1C27A]/50 text-[#E1C27A]">
                           <Play className="w-5 h-5 ml-1 fill-current" />
                        </div>
                      </div>

                      {/* Duration stamp */}
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono tracking-widest font-bold border border-white/10">
                        {v.timestamp}
                      </div>
                    </div>
                    
                    {/* Meta */}
                    <div className="flex flex-col gap-1 pr-4">
                      <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-white/90 group-hover:text-white transition-colors">
                        {v.title}
                      </h3>
                      <div className="text-[11px] text-white/40 uppercase tracking-wider flex items-center gap-2 mt-1">
                        <span>{v.author?.name}</span>
                        {v.views > 0 && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-white/40"></span>
                            <span>{formatViews(v.views)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!loading && videos.length === 0 && (
              <div className="text-center py-20 text-white/40 font-serif italic text-sm">
                No signals found in the archive.
              </div>
            )}
          </div>
        )}

        {view === 'player' && activeVideo && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8 fade-in duration-700">
            {/* Player Section */}
            <div className="lg:col-span-8 flex flex-col">
              <button 
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#E1C27A] hover:text-white transition-colors mb-6 font-mono w-max"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Archive
              </button>

              <div className="relative group w-full mb-8">
                <div className="absolute -inset-4 bg-[#E1C27A] opacity-10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/5 relative bg-gradient-to-b from-[#222] to-[#111] flex items-center justify-center p-2 shadow-2xl">
                  <div className="w-full h-full rounded shadow-2xl overflow-hidden relative bg-black">
                    <ReactPlayer
                      ref={playerRef}
                      url={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
                      width="100%"
                      height="100%"
                      playing={playing}
                      controls={true}
                      pip={pip}
                      config={{
                        youtube: {
                          playerVars: { 
                            showinfo: 0,
                            modestbranding: 1,
                            rel: 0,
                            color: 'white',
                            iv_load_policy: 3
                          }
                        }
                      }}
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                      onEnablePIP={() => setPip(true)}
                      onDisablePIP={() => setPip(false)}
                    />
                  </div>
                  
                  {/* Custom Buttons Overlay */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none flex gap-2">
                    <button
                      onClick={() => toggleLike(activeVideo.videoId)}
                      className={`pointer-events-auto px-4 py-1.5 hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all text-white border text-[10px] font-mono tracking-widest uppercase flex items-center gap-2 ${likedVideos[activeVideo.videoId] ? 'bg-red-500/80 border-red-500' : 'bg-black/80 border-white/30'}`}
                      title="Like Video"
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedVideos[activeVideo.videoId] ? 'fill-current' : ''}`} /> {likedVideos[activeVideo.videoId] ? 'Liked' : 'Like'}
                    </button>
                    <a 
                      href={`/api/download?videoId=${activeVideo.videoId}`}
                      download
                      className="pointer-events-auto px-4 py-1.5 bg-black/80 hover:bg-white hover:text-black rounded-full backdrop-blur-md transition-all text-white border border-white/30 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2"
                      title="Download Video"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                    <button 
                      onClick={() => setPip(!pip)}
                      className="pointer-events-auto px-4 py-1.5 bg-black/80 hover:bg-[#E1C27A] hover:text-black rounded-full backdrop-blur-md transition-all text-[#E1C27A] border border-[#E1C27A]/30 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2"
                      title="Picture in Picture"
                    >
                      <PictureInPicture className="w-3.5 h-3.5" /> PIP Mode
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="px-2 space-y-2">
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-[#E1C27A] font-bold mb-4">Now Playing</h2>
                <h1 className="text-2xl md:text-3xl font-serif italic leading-tight text-[#F5F5F5]">{activeVideo.title}</h1>
                <div className="flex items-center gap-4 text-xs text-white/50 pt-2 tracking-widest uppercase font-mono">
                  <span>{activeVideo.author.name}</span>
                  {activeVideo.views > 0 && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span>{formatViews(activeVideo.views)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="lg:col-span-4 flex flex-col gap-10 shrink-0">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                   <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Up Next Sequence</h3>
                   <span className="text-[10px] text-[#E1C27A] font-mono">Auto-queue</span>
                </div>
                
                <div className="space-y-4">
                  {videos.filter(v => v.videoId !== activeVideo.videoId).slice(0, 5).map((demo, i) => (
                    <div 
                      key={demo.videoId + i}
                      onClick={() => playVideo(demo)}
                      className="flex gap-4 items-start opacity-50 hover:opacity-100 transition-opacity cursor-pointer group"
                    >
                      <div className="w-24 aspect-video bg-white/5 border border-white/10 rounded flex-shrink-0 relative overflow-hidden group-hover:border-[#E1C27A]/50">
                         <img src={demo.thumbnail} alt="" className="w-full h-full object-cover object-center" />
                         <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors"></div>
                         <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono tracking-widest border border-white/10">
                           {demo.timestamp}
                         </div>
                      </div>
                      <div className="flex flex-col pt-1">
                        <p className="text-xs font-semibold line-clamp-2 leading-tight text-[#F5F5F5]">{demo.title}</p>
                        <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1 line-clamp-1">{demo.author.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                 <div className="p-4 border border-dashed border-white/10 rounded-xl relative overflow-hidden bg-white/[0.02]">
                    <h3 className="text-[10px] text-[#E1C27A] uppercase tracking-widest mb-2 flex items-center gap-2">
                       <span className="font-mono">Notice</span>
                    </h3>
                    <p className="text-[10px] text-white/50 font-serif leading-relaxed">
                      "Non Stop embeds official streams. While ads are heavily minimized on embedded players, 
                      a completely 100% ad-free experience relies on your browser (e.g., using Brave Browser or uBlock)."
                    </p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
