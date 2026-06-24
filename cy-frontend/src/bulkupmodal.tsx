import React, { useState } from 'react';
import Papa from 'papaparse';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDarkMode: boolean; 
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess, isDarkMode }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Silakan pilih file CSV terlebih dahulu!');

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('http://localhost:3000/api/containers/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(results.data),
          });

          const resData = await response.json();
          if (resData.status === 'success') {
             alert(resData.message);
             setFile(null); 
             onSuccess(); 
             onClose(); 
          } else {
             alert('Gagal: ' + resData.message);
          }
        } catch (error) {
          console.error('Error jaringan:', error);
          alert('Terjadi kesalahan jaringan saat menghubungi backend.');
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        alert('Gagal memproses CSV: ' + err.message);
        setLoading(false);
      }
    });
  };

  // Variabel Tema Dinamis agar Semuanya Sesuai (Sinkron)
  const backdropBg = isDarkMode ? 'bg-slate-900/80' : 'bg-slate-200/60'; // <-- Layar belakang ikut berubah
  const modalBg = isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700';

  return (
    /* Layar belakang transparan yang sekarang mengikuti tema */
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 transition-all duration-300 ${backdropBg}`}>
      
      {/* Kotak Modal Card */}
      <div className={`w-full max-w-lg border rounded-2xl shadow-2xl p-6 md:p-8 transition-colors duration-300 ${modalBg}`}>
        
        <div className="flex justify-between items-center mb-5 border-b border-slate-500/30 pb-3">
          <h3 className="text-xl font-bold">Import CSV Container</h3>
          <button 
            onClick={onClose}
            className="p-2 text-sm text-red-500 hover:text-red-700 transition font-bold"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleUpload} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold opacity-90">Pilih File CSV (.csv)</label>
            <input 
              type="file" 
              accept=".csv" 
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className={`w-full p-2 border rounded-lg cursor-pointer transition-colors duration-300 ${inputBg} 
                file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold 
                file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 
                dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50`}
            />
          </div>
          
          <div className={`p-4 rounded-lg text-sm border transition-colors duration-300 ${isDarkMode ? 'bg-blue-900/20 border-blue-800/50 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            <p className="font-semibold mb-1">Format Header Kolom Wajib:</p>
            <code className={`block px-2 py-1 rounded font-mono text-xs overflow-x-auto ${isDarkMode ? 'bg-slate-900 text-pink-400' : 'bg-white text-pink-600'}`}>
              id, type, size, status, weight, target_date
            </code>
          </div>

          <div className="mt-2 flex justify-end gap-3 pt-4 border-t border-slate-500/30">
            <button 
              type="button" 
              onClick={onClose}
              className={`py-2 px-4 rounded-lg font-medium transition-colors duration-300 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={!file || loading}
              className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
            >
              {loading ? '⏳ Menyimpan...' : 'Upload Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}