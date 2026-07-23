export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">API Video Downloader Aktif 🚀</h1>
        <p className="text-slate-400 mb-6 text-sm">
          API berjalan dengan baik. Gunakan endpoint <code className="bg-slate-900 px-2 py-1 rounded text-blue-400">/api/download?url=...</code> untuk mengekstrak video.
        </p>
        <div className="text-left bg-slate-900 p-4 rounded-xl text-sm overflow-auto text-slate-300">
          <p className="font-semibold text-white mb-2">Contoh Penggunaan:</p>
          <code>GET /api/download?url=https://vt.tiktok.com/xxxx/</code>
        </div>
      </div>
    </main>
  );
}