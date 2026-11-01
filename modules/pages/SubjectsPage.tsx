import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit2, Layers, CheckCircle2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { Subject } from '../types';
import { Modal } from '../components/common/Modal';

export const SubjectsPage: React.FC = () => {
  const { addToast } = useApp();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<Partial<Subject>>({
    subjectCode: '',
    subjectName: '',
    description: '',
    color: '#2563eb',
    weeklyPeriods: 4,
    status: 'active'
  });

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const data = await storageService.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      subjectId: `SUB-${Date.now()}`,
      subjectCode: '',
      subjectName: '',
      description: '',
      color: '#2563eb',
      weeklyPeriods: 4,
      status: 'active',
      gradeLevels: [8]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setFormData(sub);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectName || !formData.subjectCode) {
      addToast('error', 'សូមបញ្ចូលកូដ និងឈ្មោះមុខវិជ្ជា');
      return;
    }

    try {
      const subToSave: Subject = {
        subjectId: editingSubject?.subjectId || `SUB-${Date.now()}`,
        subjectCode: formData.subjectCode || '',
        subjectName: formData.subjectName || '',
        description: formData.description || '',
        color: formData.color || '#2563eb',
        weeklyPeriods: Number(formData.weeklyPeriods) || 4,
        status: (formData.status as any) || 'active',
        gradeLevels: [8]
      };

      await storageService.saveSubject(subToSave);
      await loadSubjects();
      setShowModal(false);
      addToast('success', editingSubject ? 'បានកែប្រែមុខវិជ្ជា' : 'បានបន្ថែមមុខវិជ្ជាថ្មី', subToSave.subjectName);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>គ្រប់គ្រងមុខវិជ្ជាសិក្សា (Subjects Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            មុខវិជ្ជាកម្រិតទី ៨ តាមកម្មវិធីសិក្សារបស់ក្រសួងអប់រំ យុវជន និងកីឡា
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមមុខវិជ្ជា</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((sub) => (
          <div
            key={sub.subjectId}
            className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                  style={{ backgroundColor: sub.color }}
                >
                  {sub.subjectCode.slice(0, 3)}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {sub.weeklyPeriods} ម៉ោង / សប្តាហ៍
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {sub.subjectName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{sub.subjectCode}</p>
              </div>

              {sub.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {sub.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end">
              <button
                onClick={() => handleOpenEdit(sub)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>កែប្រែ</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSubject ? 'កែប្រែមុខវិជ្ជា' : 'បន្ថែមមុខវិជ្ជាថ្មី'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                កូដមុខវិជ្ជា *
              </label>
              <input
                type="text"
                placeholder="MTH-8"
                value={formData.subjectCode}
                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ពណ៌សម្គាល់
              </label>
              <input
                type="color"
                value={formData.color || '#2563eb'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-9 p-1 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ឈ្មោះមុខវិជ្ជា *
            </label>
            <input
              type="text"
              placeholder="ឧ. គណិតវិទ្យា (Mathematics)"
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ចំនួនម៉ោងបង្រៀនក្នុងមួយសប្តាហ៍ *
            </label>
            <input
              type="number"
              min="1"
              max="15"
              value={formData.weeklyPeriods || 4}
              onChange={(e) => setFormData({ ...formData, weeklyPeriods: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ការពិពណ៌នា
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
