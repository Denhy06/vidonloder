export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center bg-slate-800 p-8 rounded-2xl border border-slate-700">
        <h1 className="text-6xl font-bold text-blue-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-slate-400 mb-8 text-sm">
          Waduh, URL atau endpoint yang kamu tuju sepertinya tidak ada. Pastikan kamu mengakses path yang benar.
        </p>
        <a href="/" className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-colors w-full block">
          Kembali ke Beranda
        </a>
      </div>
    </main>
  );
}