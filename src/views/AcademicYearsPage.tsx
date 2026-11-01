import React, { useState, useEffect } from 'react';
import {
  CalendarRange,
  Plus,
  Edit2,
  CheckCircle,
  Archive,
  Copy,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { AcademicYear } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const AcademicYearsPage: React.FC = () => {
  const { academicYears, activeAcademicYear, setActiveAcademicYearId, refreshData, addToast } = useApp();
  const [years, setYears] = useState<AcademicYear[]>(academicYears);
  const [modalOpen, setModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [sourceYearId, setSourceYearId] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  const [copyOptions, setCopyOptions] = useState({ copyCurriculum: true, copyTimetable: true });

  const [formData, setFormData] = useState({
    academicYearId: '',
    yearName: '',
    startDate: '',
    endDate: '',
    status: 'UPCOMING' as 'ACTIVE' | 'ARCHIVED' | 'UPCOMING',
    description: ''
  });

  useEffect(() => {
    setYears(academicYears);
  }, [academicYears]);

  const handleOpenAdd = () => {
    setEditingYear(null);
    setFormData({
      academicYearId: 'AY-' + Date.now().toString().slice(-4),
      yearName: '២០២៦-២០២៧',
      startDate: '2026-11-01',
      endDate: '2027-08-31',
      status: 'UPCOMING',
      description: 'ឆ្នាំសិក្សាថ្មី'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ay: AcademicYear) => {
    setEditingYear(ay);
    setFormData({
      academicYearId: ay.academicYearId,
      yearName: ay.yearName,
      startDate: ay.startDate,
      endDate: ay.endDate,
      status: ay.status,
      description: ay.description || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.yearName || !formData.startDate || !formData.endDate) {
      addToast('error', 'សូមបំពេញព័ត៌មានចាំបាច់ឱ្យបានគ្រប់គ្រាន់!');
      return;
    }

    const payload: AcademicYear = {
      academicYearId: formData.academicYearId,
      yearName: formData.yearName,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      description: formData.description
    };

    await storageService.saveAcademicYear(payload);
    await refreshData();
    setModalOpen(false);
    addToast('success', editingYear ? 'បានកែប្រែឆ្នាំសិក្សាជោគជ័យ' : 'បានបង្កើតឆ្នាំសិក្សាថ្មីជោគជ័យ', payload.yearName);
  };

  const handleCopyData = async () => {
    if (!sourceYearId || !targetYearId) {
      addToast('error', 'សូមជ្រើសរើសឆ្នាំសិក្សាប្រភព និងឆ្នាំសិក្សាគោលដៅ!');
      return;
    }

    try {
      if (copyOptions.copyCurriculum) {
        const sourceCurriculum = await storageService.getCurriculum(sourceYearId);
        const clonedCurriculum = sourceCurriculum.map(c => ({
          ...c,
          curriculumId: 'CUR-' + Math.random().toString(36).substring(2, 8),
          academicYearId: targetYearId,
          status: 'PLANNED' as const
        }));
        for (const item of clonedCurriculum) {
          await storageService.saveCurriculumItem(item);
        }
      }

      if (copyOptions.copyTimetable) {
        const sourceTimetable = await storageService.getTimetables(sourceYearId);
        const clonedTimetable = sourceTimetable.map(t => ({
          ...t,
          timetableId: 'TT-' + Math.random().toString(36).substring(2, 8),
          academicYearId: targetYearId
        }));
        for (const slot of clonedTimetable) {
          await storageService.saveTimetableSlot(slot);
        }
      }

      addToast('success', 'បានចម្លងទិន្នន័យជោគជ័យ', 'កម្មវិធីសិក្សា និងកាលវិភាគត្រូវបានចម្លង');
      setCopyModalOpen(false);
      await refreshData();
    } catch (err: any) {
      addToast('error', 'បញ្ហាពេលចម្លងទិន្នន័យ', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <CalendarRange className="w-5 h-5 mr-2 text-primary-600" />
            គ្រប់គ្រងឆ្នាំសិក្សា (Academic Years)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            កំណត់កាលបរិច្ឆេទបើកបវេសនកាល បិទបញ្ចប់ និងចម្លងទិន្នន័យឆ្លងឆ្នាំ
          </p>
        </div>

        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <button
            onClick={() => setCopyModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Copy className="w-4 h-4 mr-1.5" />
            ចម្លងកម្មវិធី/កាលវិភាគ
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            បន្ថែមឆ្នាំសិក្សា
          </button>
        </div>
      </div>

      {/* Grid of Academic Years */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {years.map((ay) => {
          const isActive = activeAcademicYear?.academicYearId === ay.academicYearId;

          return (
            <div
              key={ay.academicYearId}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm transition-all relative ${
                isActive
                  ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-primary-500/5'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                      ឆ្នាំសិក្សា {ay.yearName}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        កំពុងដំណើរការ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ay.description || 'ឆ្នាំសិក្សាផ្លូវការ'}</p>
                </div>

                <button
                  onClick={() => handleOpenEdit(ay)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title="កែសម្រួល"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Date Box */}
              <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">បើកបវេសនកាល៖</span>
                  <span className="font-semibold">{ay.startDate}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">បិទបញ្ចប់ឆ្នាំសិក្សា៖</span>
                  <span className="font-semibold">{ay.endDate}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">ស្ថានភាព៖</span>
                  <span className="font-semibold">{ay.status}</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                {!isActive ? (
                  <button
                    onClick={() => setActiveAcademicYearId(ay.academicYearId)}
                    className="w-full py-2 text-xs font-bold rounded-xl bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    កំណត់ជាឆ្នាំសិក្សាសកម្ម (Set Active)
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center mx-auto">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    ឆ្នាំសិក្សាដែលបានជ្រើសរើសរួច
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingYear ? 'កែសម្រួលឆ្នាំសិក្សា' : 'បន្ថែមឆ្នាំសិក្សាថ្មី'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ឈ្មោះឆ្នាំសិក្សា (ឧទាហរណ៍៖ ២០២៥-២០២៦) *
            </label>
            <input
              type="text"
              required
              value={formData.yearName}
              onChange={(e) => setFormData({ ...formData, yearName: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="២០២៥-២០២៦"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ថ្ងៃបើកបវេសនកាល *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ថ្ងៃបិទបញ្ចប់ឆ្នាំសិក្សា *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ស្ថានភាព
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ACTIVE">ACTIVE (កំពុងដំណើរការ)</option>
              <option value="UPCOMING">UPCOMING (ជិតចូលមកដល់)</option>
              <option value="ARCHIVED">ARCHIVED (បានបញ្ចប់ / រក្សាទុក)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ពិពណ៌នាបន្ថែម
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ព័ត៌មានលម្អិត..."
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

      {/* Copy Data Modal */}
      <Modal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title="ចម្លងទិន្នន័យកម្មវិធីសិក្សា និងកាលវិភាគ"
        subtitle="ចម្លងទិន្នន័យពីឆ្នាំចាស់ទៅឆ្នាំថ្មីដោយស្វ័យប្រវត្តិ"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ឆ្នាំសិក្សាប្រភព (Source Year)
            </label>
            <select
              value={sourceYearId}
              onChange={(e) => setSourceYearId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="">-- ជ្រើសរើសឆ្នាំសិក្សាប្រភព --</option>
              {years.map(y => (
                <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ឆ្នាំសិក្សាគោលដៅ (Target Year)
            </label>
            <select
              value={targetYearId}
              onChange={(e) => setTargetYearId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="">-- ជ្រើសរើសឆ្នាំសិក្សាគោលដៅ --</option>
              {years.map(y => (
                <option key={y.academicYearId} value={y.academicYearId}>{y.yearName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={copyOptions.copyCurriculum}
                onChange={(e) => setCopyOptions({ ...copyOptions, copyCurriculum: e.target.checked })}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>ចម្លងកម្មវិធីសិក្សាប្រចាំឆ្នាំ (Annual Curriculum)</span>
            </label>
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={copyOptions.copyTimetable}
                onChange={(e) => setCopyOptions({ ...copyOptions, copyTimetable: e.target.checked })}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>ចម្លងកាលវិភាគបង្រៀនគ្រូ (Teacher Timetable)</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCopyModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleCopyData}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20"
            >
              ចម្លងទិន្នន័យឥឡូវនេះ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

