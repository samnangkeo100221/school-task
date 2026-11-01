import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Modal } from './Modal';
import { excelService } from '../../services/excelService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  expectedFields: string[];
  onImportConfirmed: (parsedData: any[]) => Promise<void>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  title,
  expectedFields,
  onImportConfirmed,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setErrors([]);

    try {
      const data = await excelService.parseExcelFile<any>(selectedFile);
      if (!data || data.length === 0) {
        setErrors(['ឯកសារទទេ ឬគ្មានទិន្នន័យ (Empty sheet)!']);
        setParsedData([]);
        return;
      }

      // Validate header fields
      const firstRow = data[0];
      const missingFields = expectedFields.filter(f => !(f in firstRow));
      if (missingFields.length > 0) {
        setErrors([`ខ្វះជួរឈរចាំបាច់ (Missing required columns): ${missingFields.join(', ')}`]);
      }

      setParsedData(data);
    } catch (err: any) {
      setErrors(['មិនអាចអានឯកសារ Excel បានទេ: ' + (err.message || 'File read error')]);
    }
  };

  const handleConfirm = async () => {
    if (parsedData.length === 0 || errors.length > 0) return;
    setIsLoading(true);
    try {
      await onImportConfirmed(parsedData);
      onClose();
      setFile(null);
      setParsedData([]);
    } catch (err: any) {
      setErrors(['បញ្ហាពេលរក្សាទុកទិន្នន័យ: ' + (err.message || 'Error saving')]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
      <div className="space-y-4">
        {/* Upload Box */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors bg-slate-50 dark:bg-slate-800/40">
          <input
            type="file"
            id="excel-file-input"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center">
            <FileSpreadsheet className="w-12 h-12 text-emerald-500 mb-2" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {file ? file.name : 'ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ Excel (.xlsx, .csv)'}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              គាំទ្រឯកសារតារាងទិន្នន័យស្តង់ដារ Excel
            </span>
          </label>
        </div>

        {/* Expected Fields Banner */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-700 dark:text-slate-200">ជួរឈរដែលត្រូវការ (Required Headers): </span>
          {expectedFields.map(f => (
            <span key={f} className="inline-block bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 mr-1.5 mt-1 font-mono text-[11px]">
              {f}
            </span>
          ))}
        </div>

        {/* Errors list */}
        {errors.length > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl">
            <div className="flex items-center text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
              <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" />
              រកឃើញបញ្ហាក្នុងឯកសារ៖
            </div>
            {errors.map((e, idx) => (
              <p key={idx} className="text-xs text-rose-600 dark:text-rose-300 pl-5">
                • {e}
              </p>
            ))}
          </div>
        )}

        {/* Data Preview */}
        {parsedData.length > 0 && errors.length === 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                មើលទិន្នន័យជាមុន (ចំនួនសរុប៖ {parsedData.length} ជួរ)
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                ទិន្នន័យត្រឹមត្រូវ
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                  <tr>
                    {Object.keys(parsedData[0] || {}).slice(0, 6).map(k => (
                      <th key={k} className="p-2 border-b border-slate-200 dark:border-slate-700 font-semibold">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedData.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {Object.values(row).slice(0, 6).map((val: any, vIdx) => (
                        <td key={vIdx} className="p-2 truncate max-w-[120px]">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            បោះបង់
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedData.length === 0 || errors.length > 0 || isLoading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'កំពុងបញ្ចូលទិន្នន័យ...' : `យល់ព្រមបញ្ចូល (${parsedData.length})`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

