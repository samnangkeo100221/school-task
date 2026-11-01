import React, { useEffect, useState } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { excelService } from '../services/excelService';
import { CurriculumItem } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExcelImportModal } from '../components/common/ExcelImportModal';

export const CurriculumPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');

  // Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CurriculumItem | null>(null);
  const [formData, setFormData] = useState<Partial<CurriculumItem>>({
    chapterNumber: 1,
    chapterTitle: '',
    lessonTitle: '',
    topicTitle: '',
    lessonOrder: 1,
    requiredPeriods: 2,
    learningObjectives: '',
    grade: 8,
    status: 'planned'
  });

  // Delete Confirm
  const [itemToDelete, setItemToDelete] = useState<CurriculumItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Excel Import
  const [showImportModal, setShowImportModal] = useState(false);

  const loadCurriculum = async () => {
    setLoading(true);
    try {
      const data = await storageService.getCurriculum(activeAcademicYear?.academicYearId);
      setCurriculum(data.sort((a, b) => a.lessonOrder - b.lessonOrder));
    } catch (err) {
      console.error('Failed to load curriculum:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurriculum();
  }, [activeAcademicYear]);

  const chapters = Array.from(new Set(curriculum.map(c => c.chapterTitle)));

  const filteredCurriculum = curriculum.filter(c => {
    if (selectedChapter !== 'all' && c.chapterTitle !== selectedChapter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.lessonTitle.toLowerCase().includes(q) ||
        c.chapterTitle.toLowerCase().includes(q) ||
        c.topicTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPeriods = curriculum.reduce((sum, c) => sum + c.requiredPeriods, 0);
  const completedPeriods = curriculum.reduce((sum, c) => sum + c.completedPeriods, 0);
  const overallPercentage = totalPeriods > 0 ? Math.round((completedPeriods / totalPeriods) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      curriculumId: `CUR-${Date.now()}`,
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      grade: 8,
      subjectId: 'SUB-MATH-8',
      chapterNumber: chapters.length || 1,
      chapterTitle: '',
      lessonTitle: '',
      topicTitle: '',
      lessonOrder: curriculum.length + 1,
      requiredPeriods: 2,
      learningObjectives: '',
      status: 'planned',
      completedPeriods: 0
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: CurriculumItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lessonTitle || !formData.chapterTitle) {
      addToast('error', 'សូមបំពេញព័ត៌មានចាំបាច់', 'ចំណងជើងជំពូក និងមេរៀនមិនអាចទទេបានទេ');
      return;
    }

    try {
      const itemToSave: CurriculumItem = {
        curriculumId: editingItem?.curriculumId || `CUR-${Date.now()}`,
        academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
        grade: formData.grade || 8,
        subjectId: formData.subjectId || 'SUB-MATH-8',
        chapterNumber: Number(formData.chapterNumber) || 1,
        chapterTitle: formData.chapterTitle || '',
        lessonTitle: formData.lessonTitle || '',
        topicTitle: formData.topicTitle || '',
        lessonOrder: Number(formData.lessonOrder) || (curriculum.length + 1),
        requiredPeriods: Number(formData.requiredPeriods) || 2,
        learningObjectives: formData.learningObjectives || '',
        status: (formData.status as any) || 'planned',
        completedPeriods: Number(formData.completedPeriods) || 0
      };

      await storageService.saveCurriculumItem(itemToSave);
      await loadCurriculum();
      setShowAddModal(false);
      addToast('success', editingItem ? 'បានកែប្រែមេរៀន' : 'បានបន្ថែមមេរៀនថ្មី', itemToSave.lessonTitle);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const updated = curriculum.filter(c => c.curriculumId !== itemToDelete.curriculumId);
      await storageService.saveCurriculumBatch(updated);
      await loadCurriculum();
      addToast('success', 'បានលុបមេរៀនចេញពីកម្មវិធីសិក្សា', itemToDelete.lessonTitle);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការលុប', err.message);
    }
  };

  const handleImportExcel = async (parsedData: any[]) => {
    const importedItems: CurriculumItem[] = parsedData.map((row, i) => ({
      curriculumId: `CUR-IMP-${Date.now()}-${i}`,
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      grade: 8,
      subjectId: 'SUB-MATH-8',
      chapterNumber: Number(row['ជំពូកលេខ'] || row['chapterNumber'] || 1),
      chapterTitle: row['ជំពូក'] || row['chapterTitle'] || 'ជំពូកទូទៅ',
      lessonTitle: row['ចំណងជើងមេរៀន'] || row['lessonTitle'] || `មេរៀនទី ${i + 1}`,
      topicTitle: row['ខ្លឹមសារមេរៀន'] || row['topicTitle'] || '',
      lessonOrder: Number(row['លំដាប់មេរៀន'] || row['lessonOrder'] || i + 1),
      requiredPeriods: Number(row['ចំនួនម៉ោងតម្រូវ'] || row['requiredPeriods'] || 2),
      learningObjectives: row['វត្ថុបំណងសិក្សា'] || row['learningObjectives'] || '',
      status: 'planned',
      completedPeriods: 0
    }));

    await storageService.saveCurriculumBatch([...curriculum, ...importedItems]);
    await loadCurriculum();
    addToast('success', 'បានបញ្ចូលកម្មវិធីសិក្សាពី Excel', `បញ្ចូលបាន ${importedItems.length} មេរៀន`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-blue-600" />
            <span>កម្មវិធីសិក្សាប្រចាំឆ្នាំ (Annual Curriculum Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            គណិតវិទ្យា ថ្នាក់ទី ៨ (៣៨ សប្តាហ៍សិក្សា តាមស្តង់ដារក្រសួងអប់រំ យុវជន និងកីឡា)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => excelService.exportCurriculum(curriculum, 'គណិតវិទ្យា_ថ្នាក់ទី៨')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>ទាញយក Excel</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>បញ្ចូល Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមមេរៀនថ្មី</span>
          </button>
        </div>
      </div>

      {/* Curriculum Summary Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              សង្ខេបកម្មវិធីសិក្សាគណិតវិទ្យា ថ្នាក់ទី ៨
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              សរុប {chapters.length} ជំពូក | {curriculum.length} មេរៀន | {totalPeriods} ម៉ោងសិក្សា
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-500">បានបង្រៀនចប់៖</span>
            <p className="text-sm font-bold text-emerald-600">
              {completedPeriods} / {totalPeriods} ម៉ោង ({overallPercentage}%)
            </p>
          </div>
          <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមចំណងជើងមេរៀន ឬខ្លឹមសារ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden font-medium"
          >
            <option value="all">គ្រប់ជំពូក ({chapters.length})</option>
            {chapters.map((chap, i) => (
              <option key={i} value={chap}>{chap}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500">
          បង្ហាញ {filteredCurriculum.length} លើ {curriculum.length} មេរៀន
        </span>
      </div>

      {/* Curriculum Table */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-x-auto text-xs">
        <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-900/60 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 text-center">ល.រ</th>
              <th className="px-3 py-3">ជំពូក</th>
              <th className="px-3 py-3">ចំណងជើងមេរៀន</th>
              <th className="px-3 py-3">ខ្លឹមសារមេរៀន/ប្រធានបទ</th>
              <th className="px-3 py-3 text-center">ម៉ោងតម្រូវ</th>
              <th className="px-3 py-3 text-center">បានបង្រៀន</th>
              <th className="px-3 py-3 text-center">ស្ថានភាព</th>
              <th className="px-3 py-3 text-right">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredCurriculum.map((item) => (
              <tr key={item.curriculumId} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                <td className="px-3 py-3 text-center font-bold text-slate-500">{item.lessonOrder}</td>
                <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{item.chapterTitle}</td>
                <td className="px-3 py-3 font-bold text-blue-700 dark:text-blue-300 max-w-[200px] truncate">{item.lessonTitle}</td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300 max-w-[250px] truncate font-medium">{item.topicTitle}</td>
                <td className="px-3 py-3 text-center font-bold">{item.requiredPeriods} ម៉ោង</td>
                <td className="px-3 py-3 text-center font-bold text-emerald-600">{item.completedPeriods} ម៉ោង</td>
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : item.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {item.status === 'completed' ? 'បញ្ចប់' : item.status === 'in_progress' ? 'កំពុងបង្រៀន' : 'គ្រោង'}
                  </span>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600"
                      title="កែសម្រួល"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete(item);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                      title="លុប"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingItem ? 'កែសម្រួលមេរៀនក្នុងកម្មវិធីសិក្សា' : 'បន្ថែមមេរៀនថ្មី'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ជំពូកលេខ *
              </label>
              <input
                type="number"
                value={formData.chapterNumber || 1}
                onChange={(e) => setFormData({ ...formData, chapterNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ចំណងជើងជំពូក *
              </label>
              <input
                type="text"
                placeholder="ឧ. ជំពូកទី ១៖ ចំនួនគត់រ៉ឺឡាទីវ"
                value={formData.chapterTitle || ''}
                onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ចំណងជើងមេរៀន *
            </label>
            <input
              type="text"
              placeholder="ឧ. មេរៀនទី ១៖ និយមន័យ និងការប្រៀបធៀប"
              value={formData.lessonTitle || ''}
              onChange={(e) => setFormData({ ...formData, lessonTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ខ្លឹមសារលម្អិត / ប្រធានបទ *
            </label>
            <input
              type="text"
              placeholder="ឧ. ចំនួនវិជ្ជមាន អវិជ្ជមាន និងការតាងលើបន្ទាត់ចំនួន"
              value={formData.topicTitle || ''}
              onChange={(e) => setFormData({ ...formData, topicTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                លំដាប់មេរៀន
              </label>
              <input
                type="number"
                value={formData.lessonOrder || 1}
                onChange={(e) => setFormData({ ...formData, lessonOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ចំនួនម៉ោងតម្រូវ
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.requiredPeriods || 2}
                onChange={(e) => setFormData({ ...formData, requiredPeriods: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ស្ថានភាព
              </label>
              <select
                value={formData.status || 'planned'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="planned">គ្រោងបង្រៀន</option>
                <option value="in_progress">កំពុងបង្រៀន</option>
                <option value="completed">បានបញ្ចប់</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              វត្ថុបំណងសិក្សា (Learning Objectives)
            </label>
            <textarea
              rows={3}
              placeholder="បញ្ជាក់ពីចំណេះដឹង បំណិន និងឥរិយាបថដែលសិស្សទទួលបាន..."
              value={formData.learningObjectives || ''}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="បញ្ជាក់ការលុបមេរៀន"
        message={`តើលោកគ្រូពិតជាចង់លុបមេរៀន "${itemToDelete?.lessonTitle}" ចេញពីកម្មវិធីសិក្សាប្រចាំឆ្នាំមែនទេ?`}
        confirmLabel="យល់ព្រមលុប"
        cancelLabel="បោះបង់"
        isDestructive
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="បញ្ចូលកម្មវិធីសិក្សាពី Excel"
        onImport={handleImportExcel}
        expectedColumnsDescription="ជំពូក, ចំណងជើងមេរៀន, ខ្លឹមសារមេរៀន, ចំនួនម៉ោងតម្រូវ, វត្ថុបំណងសិក្សា"
      />
    </div>
  );
};
