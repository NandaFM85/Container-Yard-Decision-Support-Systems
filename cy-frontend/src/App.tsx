import { useState, useEffect, useRef } from 'react';

// Definisi Tipe Data
interface Container {
  id: string;
  type: string;
  size: number;
  weight: string;
  status: string;
}

export default function App() {
  // State untuk Data Tabel
  const [data, setData] = useState<Container[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  // State untuk UI & SPK
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [spkResult, setSpkResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);

  // Fungsi Mengambil Data dari Backend
  const fetchContainers = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/containers?page=${page}&limit=10&search=${search}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const json = await res.json();
      setData(json.data);
      setTotalPages(json.totalPages);
      setTotalData(json.total);
    } catch (err) {
      console.error("Error Fetching:", err);
    }
  };

  // Panggil fetch setiap kali `page` atau `search` berubah
  useEffect(() => {
    fetchContainers();
  }, [page, search]);

  // Fungsi Menjalankan SPK Metode SMART
  const runSpk = async (container: Container) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container }),
      });
      const result = await res.json();
      setSpkResult(result);
    } catch (err) {
      console.error("Gagal menjalankan SPK", err);
      alert("Terjadi kesalahan saat menghubungi backend.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Kontrol Antarmuka
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && appRef.current) {
      appRef.current.requestFullscreen().catch(err => alert(`Error fullscreen: ${err.message}`));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // Variabel Tema Dinamis
  const themeClass = isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800';
  const cardClass = isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const tableHeadClass = isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600';
  const tableRowClass = isDarkMode ? 'border-b border-slate-700 hover:bg-slate-800' : 'border-b border-slate-200 hover:bg-slate-50';

  return (
    <div ref={appRef} className={`min-h-screen transition-colors duration-300 ${themeClass}`}>
      
      {/* Header Navigation */}
      <header className={`p-4 shadow flex justify-between items-center border-b ${cardClass}`}>
        <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
          SPK Container Yard (SMART)
        </h1>
        <div className="flex gap-2 md:gap-4">
          <button onClick={toggleTheme} className="p-2 px-3 md:px-4 rounded-md border border-slate-400 hover:bg-slate-500 hover:text-white transition font-medium text-sm">
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button onClick={toggleFullscreen} className="p-2 px-3 md:px-4 rounded-md border border-blue-500 text-blue-500 hover:bg-blue-600 hover:text-white transition font-medium text-sm">
            ⛶ Fullscreen
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Cari ID Peti Kemas (Contoh: MSKU)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset ke halaman 1 saat mencari
            }}
            className={`w-full md:w-1/3 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white focus:bg-slate-700' : 'bg-white border-slate-300'}`}
          />
        </div>

        {/* Data Table */}
        <div className={`overflow-x-auto rounded-xl shadow-sm border ${cardClass} mb-6`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={tableHeadClass}>
                <th className="p-4 font-semibold uppercase text-sm tracking-wider">ID Peti Kemas</th>
                <th className="p-4 font-semibold uppercase text-sm tracking-wider">Tipe</th>
                <th className="p-4 font-semibold uppercase text-sm tracking-wider">Ukuran</th>
                <th className="p-4 font-semibold uppercase text-sm tracking-wider">Bobot</th>
                <th className="p-4 font-semibold uppercase text-sm tracking-wider text-center">Aksi Optimasi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada data peti kemas ditemukan.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className={tableRowClass}>
                    <td className="p-4 font-mono font-bold text-blue-500">{item.id}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'Reefer' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4">{item.size} feet</td>
                    <td className="p-4">{item.weight}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => runSpk(item)}
                        disabled={isLoading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium text-sm shadow-md hover:shadow-lg"
                      >
                        {isLoading ? '⏳ Memproses...' : 'Cari Slot Terbaik'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-slate-500">Total Keseluruhan: {totalData} Peti Kemas</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg disabled:opacity-40 hover:bg-slate-700 transition font-medium"
            >
              Sebelumnya
            </button>
            <span className={`py-2 px-4 rounded-lg font-medium border ${cardClass}`}>
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg disabled:opacity-40 hover:bg-slate-700 transition font-medium"
            >
              Selanjutnya
            </button>
          </div>
        </div>

      </main>

      {/* Modal Popup Hasil SPK */}
      {spkResult && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className={`p-6 md:p-8 rounded-2xl w-full max-w-lg shadow-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h2 className="text-2xl font-bold mb-1">Rekomendasi Penempatan</h2>
            <p className="text-slate-500 mb-6 font-mono">ID Peti Kemas: {spkResult.containerId}</p>

            {spkResult.error ? (
               <div className="p-4 rounded-lg bg-red-100 text-red-800 border border-red-300">
                  {spkResult.error}
               </div>
            ) : (
              <>
                <div className="mb-6 p-5 rounded-xl bg-emerald-100 border border-emerald-400 text-emerald-900 shadow-inner">
                  <p className="text-sm uppercase tracking-wider font-bold mb-1 opacity-80">Slot Utama (Prioritas 1)</p>
                  <h3 className="font-mono text-3xl font-black">{spkResult.recommendedSlot?.slotId}</h3>
                  <p className="mt-2 font-medium">Skor SMART: <span className="bg-emerald-200 px-2 py-1 rounded-md">{spkResult.recommendedSlot?.finalScore} / 100</span></p>
                </div>

                <h4 className="font-bold text-sm uppercase tracking-wider mb-3 text-slate-500">Alternatif Slot Lainnya</h4>
                <ul className={`text-sm max-h-40 overflow-y-auto rounded-lg p-2 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  {spkResult.ranking?.slice(1, 6).map((rank: any, index: number) => (
                    <li key={index} className={`flex justify-between items-center py-2 px-3 border-b last:border-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <span className="font-mono font-medium">{index + 2}. {rank.slotId}</span>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                        Skor: {rank.finalScore}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSpkResult(null)}
                className="bg-red-500 text-white px-6 py-2.5 rounded-lg hover:bg-red-600 transition font-bold shadow-md hover:shadow-lg w-full md:w-auto"
              >
                Tutup Rekomendasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}