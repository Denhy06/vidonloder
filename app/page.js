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
      // Memanggil endpoint API buatanmu sendiri
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
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-50">
      
      {/* Container Utama - UI Downloader */}
      <div className="w-full max-w-2xl bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-700 mb-6">
        <h1 className="text-3xl font-bold mb-3 text-center text-white">Video Downloader</h1>
        
        {/* Keterangan Platform Support */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-600/30">
            ✅ Facebook
          </span>
          <span className="bg-pink-600/20 text-pink-400 px-3 py-1 rounded-full text-xs font-medium border border-pink-600/30">
            ✅ TikTok
          </span>
          <span className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium border border-red-600/30">
            ✅ Pinterest
          </span>
        </div>

        {/* Form Input URL */}
        <form onSubmit={handleDownload} className="flex flex-col gap-4">
          <input
            type="url"
            placeholder="Tempel link video di sini..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sedang Memproses...' : 'Download Video'}
          </button>
        </form>

        {/* Area Notifikasi Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Area Hasil Output */}
        {result && result.data && (
          <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-700 flex flex-col items-center gap-3">
            <h3 className="font-medium text-sm text-center text-white">
              {result.data.title || 'Video Berhasil Diproses'}
            </h3>
            <a
              href={result.data.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-all"
            >
              Simpan File
            </a>
          </div>
        )}
      </div>

      {/* Area Dokumentasi API (Bawah) */}
      <div className="w-full max-w-2xl bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          👨‍💻 Dokumentasi API Endpoint
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Tools ini juga menyediakan API terbuka yang bisa kamu panggil langsung dari aplikasi atau script pihak ketiga.
        </p>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 overflow-x-auto text-sm">
          <p className="text-slate-300 font-mono mb-2">
            <span className="text-emerald-400 font-bold">GET</span> /api/download?url=<span className="text-blue-400">[LINK_VIDEO]</span>
          </p>
          
          <div className="text-slate-500 mt-4 pt-4 border-t border-slate-700">
            <p className="mb-2 text-slate-300 font-medium">Contoh Format Response (JSON):</p>
            <pre className="text-xs text-sky-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
{`{
  "status": true,
  "platform": "tiktok",
  "data": {
    "title": "Judul Video",
    "download_url": "https://...",
    "thumbnail": "https://..."
  }
}`}
            </pre>
          </div>
        </div>
      </div>

    </main>
  );
}
