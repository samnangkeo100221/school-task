import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { excelService } from '../../services/excelService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onImport: (data: any[]) => Promise<void>;
  expectedColumnsDescription: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  title,
  onImport,
  expectedColumnsDescription
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setLoading(true);

    try {
      const data = await excelService.parseExcelFile(selected);
      if (!data || data.length === 0) {
        setError('ឯកសារគ្មានទិន្នន័យ ឬមិនត្រូវទម្រង់ទេ។ សូមពិនិត្យឡើងវិញ។');
      } else {
        setParsedData(data);
      }
    } catch (err: any) {
      setError('មិនអាចអានឯកសារ Excel បានទេ៖ ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    try {
      await onImport(parsedData);
      setFile(null);
      setParsedData([]);
      onClose();
    } catch (err: any) {
      setError('បរាជ័យក្នុងការបញ្ចូលទិន្នន័យ៖ ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="3xl">
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl text-xs text-blue-700 dark:text-blue-300">
          <p className="font-semibold mb-1">ទម្រង់ជួរឈរតម្រូវ (Columns):</p>
          <p>{expectedColumnsDescription}</p>
        </div>

        {/* Upload Dropzone */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
          <UploadCloud className="w-10 h-10 text-primary-500 mb-2" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {file ? file.name : 'ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ Excel (.xlsx, .xls)'}
          </span>
          <span className="text-xs text-slate-400 mt-1">គាំទ្រទម្រង់ Excel ឬ CSV</span>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {error && (
          <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                ទិន្នន័យរកឃើញ៖ {parsedData.length} ជួរ (បង្ហាញគំរូ ៥ ជួរដំបូង)
              </span>
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-56 text-xs">
              <table className="w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    {Object.keys(parsedData[0] || {}).map((header) => (
                      <th
                        key={header}
                        className="px-3 py-2 text-left font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {String(val ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
          >
            បោះបង់
          </button>
          <button
            type="button"
            disabled={parsedData.length === 0 || loading}
            onClick={handleConfirm}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>{loading ? 'កំពុងបញ្ចូល...' : `យល់ព្រមបញ្ចូល (${parsedData.length})`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
