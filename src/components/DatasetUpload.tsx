import React, { useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface DatasetUploadProps {
  onDataUpload: (data: any[]) => void;
  isLoading: boolean;
}

export function DatasetUpload({ onDataUpload, isLoading }: DatasetUploadProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [parsedData, setParsedData] = React.useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isCSV = selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv');
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

      if (!isCSV && !isExcel) {
        setError('Please upload a valid CSV or Excel file.');
        setFile(null);
        setParsedData(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setParsedData(null);
      
      if (isCSV) {
        parseCSVFile(selectedFile);
      } else {
        parseExcelFile(selectedFile);
      }
    }
  };

  const parseCSVFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file. Please check the format.');
          return;
        }
        setParsedData(results.data);
      },
      error: (error) => {
        setError(`Error: ${error.message}`);
      }
    });
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(jsonData);
      } catch (err) {
        setError('Error parsing Excel file. Please check the format.');
      }
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsArrayBuffer(file);
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcess = () => {
    if (parsedData) {
      onDataUpload(parsedData);
      removeFile();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111114] rounded-3xl border border-[#1F1F23] p-8 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Upload className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Dataset Integration</h3>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Upload CSV or Excel for Technical Analysis</p>
        </div>
      </div>

      <div 
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-10 transition-all flex flex-col items-center justify-center gap-4 ${
          file ? 'border-blue-500/50 bg-blue-500/5' : 'border-[#1F1F23] hover:border-blue-500/30 hover:bg-blue-500/5'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv, .xlsx, .xls"
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div 
              key="file-selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-white tracking-tight">{file.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {(file.size / 1024).toFixed(1)} KB • {file.name.endsWith('.csv') ? 'CSV' : 'Excel'} Format
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="mt-2 p-2 hover:bg-red-500/10 rounded-lg transition-colors group/btn"
              >
                <X className="w-4 h-4 text-slate-500 group-hover/btn:text-red-500" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="no-file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-[#151619] rounded-2xl border border-[#1F1F23] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-blue-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-white tracking-tight">Drop your dataset here</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">or click to browse CSV/Excel files</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="absolute inset-0 bg-[#111114]/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Processing...</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
          </motion.div>
        )}
        {!error && file && parsedData && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 space-y-4"
          >
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Dataset parsed successfully ({parsedData.length} records)</p>
            </div>
            
            <button
              onClick={handleProcess}
              disabled={isLoading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              {isLoading ? 'Processing...' : 'Process Dataset for Analysis'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 pt-8 border-t border-[#1F1F23]">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Expected Format (Flexible)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#151619] p-3 rounded-xl border border-[#1F1F23]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Required Columns</p>
            <p className="text-[10px] font-mono text-blue-500">Year (or yr), Cases (or count)</p>
          </div>
          <div className="bg-[#151619] p-3 rounded-xl border border-[#1F1F23]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Climate Data</p>
            <p className="text-[10px] font-mono text-slate-500">Temp, Humidity, Rainfall</p>
          </div>
        </div>
        <p className="text-[9px] text-slate-600 mt-4 italic">* Column names are case-insensitive. Ensure data is numeric for accurate trends.</p>
      </div>
    </motion.div>
  );
}
