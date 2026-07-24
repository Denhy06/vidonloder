'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDownload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Gagal mengekstrak video');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-black text-slate-50 font-sans">
      
      {/* Container Utama - Sharp Edges */}
      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-md p-6 sm:p-10 border-t-4 border-blue-500 border-x border-b border-slate-700/50 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        <h1 className="text-3xl sm:text-4xl font-black mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase tracking-tight">
          Video Downloader
        </h1>
        <p className="text-center text-slate-400 text-sm mb-8 tracking-widest uppercase">
          Unduh Media Kualitas Tinggi
        </p>
        
        {/* SVG Social Media Icons */}
        <div className="flex flex-wrap justify-center gap-6 mb-10 border-y border-slate-700/50 py-4">
          {/* Instagram */}
          <svg className="w-6 h-6 fill-slate-400 hover:fill-pink-500 transition-colors cursor-pointer" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          {/* TikTok */}
          <svg className="w-6 h-6 fill-slate-400 hover:fill-white transition-colors cursor-pointer" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.04.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.22-1.15 4.38-2.9 5.81-1.77 1.44-4.14 2.1-6.42 1.76-2.52-.39-4.81-2.02-5.91-4.31-1.14-2.39-1.07-5.32.19-7.65 1.25-2.29 3.58-3.92 6.15-4.24 1.24-.15 2.51-.06 3.73.23v4.03c-1.3-.39-2.73-.24-3.89.44-1.28.76-2.11 2.15-2.22 3.65-.12 1.6.59 3.16 1.87 4.11 1.29.95 3.04 1.11 4.47.38 1.44-.73 2.37-2.24 2.44-3.89.09-4.73.05-9.47.07-14.21h-2.14z"/>
          </svg>
          {/* Facebook */}
          <svg className="w-6 h-6 fill-slate-400 hover:fill-blue-500 transition-colors cursor-pointer" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          {/* Pinterest */}
          <svg className="w-6 h-6 fill-slate-400 hover:fill-red-500 transition-colors cursor-pointer" viewBox="0 0 24 24">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.624 0 12.017 0z"/>
          </svg>
        </div>

        {/* Form Input URL */}
        <form onSubmit={handleDownload} className="flex flex-col gap-5">
          <div className="relative">
            <input
              type="url"
              placeholder="Tempel tautan media di sini..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-5 py-4 bg-slate-950/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm shadow-inner"
            />
            {/* Dekorasi Sudut Input */}
            <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500"></div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase py-4 transition-all disabled:opacity-50 disabled:bg-slate-700 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] overflow-hidden"
          >
            {/* Efek Garis Scanline saat Hover */}
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 group-hover:animate-pulse pointer-events-none"></div>
            
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </span>
            ) : 'Ekstrak Media'}
          </button>
        </form>

        {/* Area Notifikasi Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-950/40 border border-red-500 text-red-400 text-sm font-mono flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Area Hasil Output */}
        {result && result.data && (
          <div className="mt-8 border border-slate-700 bg-slate-900/50 relative">
            {/* Dekorasi Frame Area Output */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500"></div>
            
            <div className="p-5 flex flex-col gap-5">
              
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                <span className="text-xs font-mono text-slate-400 tracking-wider">STATUS: <span className="text-emerald-400">FOUND</span></span>
                <span className="bg-slate-800 text-slate-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-slate-600">
                  {result.platform}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-stretch">
                
                {/* Area Gambar / Thumbnail */}
                {result.data.thumbnail ? (
                  <div className="w-full sm:w-40 shrink-0 border border-slate-700 bg-slate-950 p-1">
                    <img 
                      src={result.data.thumbnail} 
                      alt="Thumbnail" 
                      className="w-full h-48 sm:h-32 object-cover"
                      onError={(e) => { e.target.style.display = 'none' }} 
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-40 h-48 sm:h-32 shrink-0 bg-slate-950 flex items-center justify-center border border-slate-700 text-slate-600 text-xs font-mono">
                    [NO_IMG_DATA]
                  </div>
                )}

                {/* Konten Judul & Tombol Download */}
                <div className="flex flex-col flex-1 w-full justify-between gap-4">
                  <h3 className="font-medium text-sm text-white line-clamp-3 leading-relaxed border-l-2 border-slate-600 pl-3">
                    {result.data.title || 'Mendapatkan media tanpa judul atau caption...'}
                  </h3>
                  
                  <a
                    href={result.data.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider py-3 transition-all text-xs text-center border border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Download .MP4
                  </a>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>
      
    </main>
  );
}
