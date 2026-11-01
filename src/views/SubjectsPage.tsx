import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Search, Palette } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { Subject } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SubjectsPage: React.FC = () => {
  const { addToast } = useApp();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subjectId: '',
    subjectCode: '',
    subjectName: '',
    description: '',
    color: '#2563eb',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const loadData = async () => {
    const list = await storageService.getSubjects();
    setSubjects(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      subjectId: 'SUB-' + Date.now().toString().slice(-4),
      subjectCode: 'SUB-' + Math.floor(100 + Math.random() * 900),
      subjectName: '',
      description: '',
      color: '#2563eb',
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSubject(s);
    setFormData({
      subjectId: s.subjectId,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      description: s.description || '',
      color: s.color || '#2563eb',
      status: s.status
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectName || !formData.subjectCode) {
      addToast('error', 'សូមបំពេញឈ្មោះមុខវិជ្ជា និងកូដមុខវិជ្ជា!');
      return;
    }

    const payload: Subject = {
      subjectId: formData.subjectId,
      subjectCode: formData.subjectCode,
      subjectName: formData.subjectName,
      description: formData.description,
      color: formData.color,
      status: formData.status
    };

    await storageService.saveSubject(payload);
    await loadData();
    setModalOpen(false);
    addToast('success', editingSubject ? 'បានកែប្រែព័ត៌មានមុខវិជ្ជាជោគជ័យ' : 'បានបន្ថែមមុខវិជ្ជាថ្មីជោគជ័យ', payload.subjectName);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    let list = await storageService.getSubjects();
    list = list.filter(s => s.subjectId !== confirmDeleteId);
    localStorage.setItem('msts_subjects', JSON.stringify(list));
    setConfirmDeleteId(null);
    await loadData();
    addToast('success', 'បានលុបមុខវិជ្ជាជោគជ័យ');
  };

  const filtered = subjects.filter(s =>
    s.subjectName.toLowerCase().includes(search.toLowerCase()) ||
    s.subjectCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
            មុខវិជ្ជាគណិតវិទ្យា ថ្នាក់ទី ៨ (Mathematics)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            កម្មវិធីសិក្សា និងបំណែងចែកម៉ោងបង្រៀនគណិតវិទ្យាថ្នាក់ទី ៨ (ពីជគណិត និងធរណីមាត្រ) • វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះមុខវិជ្ជា ឬកូដ..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((s) => (
          <div
            key={s.subjectId}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.subjectName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                      {s.subjectName}
                    </h3>
                    <span className="font-mono text-[11px] text-slate-400 font-medium">
                      {s.subjectCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(s.subjectId)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                {s.description || 'មុខវិជ្ជាសិក្សាស្តង់ដារតាមក្រសួងអប់រំ យុវជន និងកីឡា'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">កូដពណ៌សម្គាល់៖</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 uppercase">{s.color}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Subject */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'កែសម្រួលមុខវិជ្ជា' : 'បន្ថែមមុខវិជ្ជាថ្មី'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                កូដមុខវិជ្ជា (Code) *
              </label>
              <input
                type="text"
                required
                value={formData.subjectCode}
                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="MATH-8"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ឈ្មោះមុខវិជ្ជា (Name) *
              </label>
              <input
                type="text"
                required
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="គណិតវិទ្យា"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ពណ៌សម្គាល់កាលវិភាគ (Color Badge)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-10 p-1 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-32 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ពិពណ៌នាសង្ខេប
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="ព័ត៌មានលម្អិតមុខវិជ្ជា..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="លុបមុខវិជ្ជា"
        message="តើអ្នកប្រាកដជាចង់លុបមុខវិជ្ជានេះចេញពីប្រព័ន្ធមែនទេ?"
      />
    </div>
  );
};

