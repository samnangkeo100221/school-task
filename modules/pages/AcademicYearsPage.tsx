import React, { useEffect, useState } from 'react';
import {
  CalendarRange,
  Plus,
  Edit2,
  CheckCircle2,
  Archive,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { AcademicYear } from '../types';
import { Modal } from '../components/common/Modal';

export const AcademicYearsPage: React.FC = () => {
  const { activeAcademicYear, setActiveAcademicYearId, addToast } = useApp();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState<Partial<AcademicYear>>({
    yearName: '',
    startDate: '2025-11-01',
    endDate: '2026-08-31',
    status: 'active',
    totalWeeks: 38,
    description: ''
  });

  const loadYears = async () => {
    setLoading(true);
    try {
      const data = await storageService.getAcademicYears();
      setAcademicYears(data);
    } catch (err) {
      console.error('Failed to load academic years:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYears();
  }, []);

  const handleOpenAdd = () => {
    setEditingYear(null);
    setFormData({
      academicYearId: `AY-${Date.now()}`,
      yearName: 'ឆ្នាំសិក្សា ២០២៦-២០២៧',
      startDate: '2026-11-01',
      endDate: '2027-08-31',
      status: 'upcoming',
      totalWeeks: 38,
      description: 'ឆ្នាំសិក្សាថ្មី',
      semester1StartDate: '2026-11-01',
      semester1EndDate: '2027-03-31',
      semester2StartDate: '2027-04-01',
      semester2EndDate: '2027-08-31'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData(year);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.yearName || !formData.startDate || !formData.endDate) {
      addToast('error', 'សូមបំពេញព័ត៌មានចាំបាច់');
      return;
    }

    try {
      const yearToSave: AcademicYear = {
        academicYearId: editingYear?.academicYearId || `AY-${Date.now()}`,
        yearName: formData.yearName || '',
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        status: (formData.status as any) || 'active',
        totalWeeks: Number(formData.totalWeeks) || 38,
        description: formData.description || '',
        semester1StartDate: formData.semester1StartDate || formData.startDate || '',
        semester1EndDate: formData.semester1EndDate || formData.endDate || '',
        semester2StartDate: formData.semester2StartDate || formData.startDate || '',
        semester2EndDate: formData.semester2EndDate || formData.endDate || ''
      };

      await storageService.saveAcademicYear(yearToSave);
      await loadYears();
      setShowModal(false);
      addToast('success', editingYear ? 'បានកែប្រែឆ្នាំសិក្សា' : 'បានបន្ថែមឆ្នាំសិក្សាថ្មី', yearToSave.yearName);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  const handleActivate = async (year: AcademicYear) => {
    await setActiveAcademicYearId(year.academicYearId);
    // update status
    const updated = academicYears.map(y => ({
      ...y,
      status: y.academicYearId === year.academicYearId ? ('active' as const) : ('archived' as const)
    }));
    for (const y of updated) {
      await storageService.saveAcademicYear(y);
    }
    await loadYears();
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <span>គ្រប់គ្រងឆ្នាំសិក្សា (Academic Years Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            កំណត់ឆ្នាំសិក្សាផ្លូវការ កាលបរិច្ឆេទចាប់ផ្តើម-បញ្ចប់ និងឆមាសនីមួយៗ
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមឆ្នាំសិក្សា</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {academicYears.map((year) => {
          const isActive = activeAcademicYear?.academicYearId === year.academicYearId;

          return (
            <div
              key={year.academicYearId}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-800 border shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                isActive
                  ? 'border-blue-400 ring-2 ring-blue-500/20 dark:border-blue-600'
                  : 'border-slate-200/80 dark:border-slate-700/80 hover:border-blue-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {year.academicYearId}
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>កំពុងប្រើប្រាស់</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {year.status === 'upcoming' ? 'ជិតមកដល់' : 'ទុកជាប្រវត្តិ'}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {year.yearName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{year.startDate} ដល់ {year.endDate}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p><span className="text-slate-400">សរុបសប្តាហ៍សិក្សា៖</span> {year.totalWeeks} សប្តាហ៍</p>
                  {year.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">{year.description}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                {!isActive ? (
                  <button
                    onClick={() => handleActivate(year)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                  >
                    បើកដំណើរការ
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>សកម្ម</span>
                  </span>
                )}

                <button
                  onClick={() => handleOpenEdit(year)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600"
                  title="កែប្រែ"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingYear ? 'កែប្រែឆ្នាំសិក្សា' : 'បន្ថែមឆ្នាំសិក្សាថ្មី'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ឈ្មោះឆ្នាំសិក្សា *
            </label>
            <input
              type="text"
              placeholder="ឧ. ឆ្នាំសិក្សា ២០២៦-២០២៧"
              value={formData.yearName}
              onChange={(e) => setFormData({ ...formData, yearName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                កាលបរិច្ឆេទចាប់ផ្តើម *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                កាលបរិច្ឆេទបញ្ចប់ *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ចំនួនសប្តាហ៍សិក្សាសរុប *
            </label>
            <input
              type="number"
              min="20"
              max="52"
              value={formData.totalWeeks || 38}
              onChange={(e) => setFormData({ ...formData, totalWeeks: Number(e.target.value) })}
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
