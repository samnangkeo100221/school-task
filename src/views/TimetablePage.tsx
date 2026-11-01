import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  School,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { schedulerEngine } from '../services/schedulerEngine';
import { TimetableSlot, Teacher, ClassRoom, Subject, TeachingPeriodConfig } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { excelService } from '../services/excelService';

export const TimetablePage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [timetables, setTimetables] = useState<TimetableSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [periods, setPeriods] = useState<TeachingPeriodConfig[]>([]);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('T-001'); // Default Keo Samnang
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    timetableId: '',
    teacherId: 'T-001',
    classId: 'CLS-8A',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 1, // Monday
    periodNumber: 1,
    room: 'B1-01'
  });

  const loadData = async () => {
    const [t, tch, cls, sub, set] = await Promise.all([
      storageService.getTimetables(activeAcademicYear?.academicYearId),
      storageService.getTeachers(),
      storageService.getClasses(),
      storageService.getSubjects(),
      storageService.getSettings()
    ]);
    setTimetables(t);
    setTeachers(tch);
    setClasses(cls);
    setSubjects(sub);
    setPeriods(set.periods || []);
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  const daysKm = [
    { num: 1, name: 'ចន្ទ (Mon)' },
    { num: 2, name: 'អង្គារ (Tue)' },
    { num: 3, name: 'ពុធ (Wed)' },
    { num: 4, name: 'ព្រហស្បតិ៍ (Thu)' },
    { num: 5, name: 'សុក្រ (Fri)' },
    { num: 6, name: 'សៅរ៍ (Sat)' },
  ];

  const handleOpenAdd = (day?: number, period?: number) => {
    setEditingSlot(null);
    setConflictError(null);
    setFormData({
      timetableId: 'TT-' + Date.now().toString().slice(-4),
      teacherId: selectedTeacherId || teachers[0]?.teacherId || 'T-001',
      classId: selectedClassId || classes[0]?.classId || 'CLS-8A',
      subjectId: 'SUB-MATH-8',
      dayOfWeek: day || 1,
      periodNumber: period || 1,
      room: 'B1-01'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setConflictError(null);
    setFormData({
      timetableId: slot.timetableId,
      teacherId: slot.teacherId,
      classId: slot.classId,
      subjectId: slot.subjectId,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      room: slot.room || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    // Conflict Check
    const conflictResult = schedulerEngine.detectTimetableConflicts(
      timetables,
      {
        teacherId: formData.teacherId,
        classId: formData.classId,
        dayOfWeek: Number(formData.dayOfWeek),
        periodNumber: Number(formData.periodNumber),
      },
      editingSlot?.timetableId
    );

    if (conflictResult.hasConflict) {
      setConflictError(conflictResult.errors.join(' | '));
      return;
    }

    const matchedPeriod = periods.find(p => p.periodNumber === Number(formData.periodNumber));

    const payload: TimetableSlot = {
      timetableId: formData.timetableId,
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      teacherId: formData.teacherId,
      classId: formData.classId,
      subjectId: formData.subjectId,
      dayOfWeek: Number(formData.dayOfWeek),
      periodNumber: Number(formData.periodNumber),
      startTime: matchedPeriod?.startTime || '07:00',
      endTime: matchedPeriod?.endTime || '08:00',
      room: formData.room,
      effectiveStartDate: activeAcademicYear?.startDate || '2025-11-01',
      effectiveEndDate: activeAcademicYear?.endDate || '2026-08-31',
      status: 'ACTIVE'
    };

    await storageService.saveTimetableSlot(payload);
    await loadData();
    setModalOpen(false);
    addToast('success', editingSlot ? 'បានកែប្រែកាលវិភាគជោគជ័យ' : 'បានបញ្ចូលម៉ោងបង្រៀនជោគជ័យ');
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    await storageService.deleteTimetableSlot(confirmDeleteId);
    setConfirmDeleteId(null);
    await loadData();
    addToast('success', 'បានលុបម៉ោងបង្រៀនចេញពីកាលវិភាគ');
  };

  const handleExportExcel = () => {
    const exportData = timetables.map(t => ({
      'ថ្ងៃ (Day)': daysKm.find(d => d.num === t.dayOfWeek)?.name || t.dayOfWeek,
      'ម៉ោងទី (Period)': t.periodNumber,
      'ម៉ោងបង្រៀន (Time)': `${t.startTime} - ${t.endTime}`,
      'គ្រូបង្រៀន (Teacher)': teachers.find(tch => tch.teacherId === t.teacherId)?.fullName || t.teacherId,
      'ថ្នាក់រៀន (Class)': classes.find(c => c.classId === t.classId)?.className || t.classId,
      'មុខវិជ្ជា (Subject)': subjects.find(s => s.subjectId === t.subjectId)?.subjectName || t.subjectId,
      'បន្ទប់ (Room)': t.room || ''
    }));
    excelService.exportToExcel(exportData, 'កាលវិភាគបង្រៀន_វិទ្យាល័យហ៊ុនសែនបាត់ដឹង', 'Timetable');
    addToast('success', 'បានទាញយក Excel កាលវិភាគជោគជ័យ');
  };

  // Filter slots for the visual matrix
  const displayedSlots = timetables.filter(slot => {
    if (selectedTeacherId && slot.teacherId !== selectedTeacherId) return false;
    if (selectedClassId && slot.classId !== selectedClassId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-primary-600" />
            កាលវិភាគគ្រូបង្រៀន (Teacher Timetable)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            តារាងកាលវិភាគបង្រៀនប្រចាំសប្តាហ៍ ពិនិត្យភាពជាន់គ្នានៃម៉ោង និងចាត់តាំងថ្នាក់
          </p>
        </div>

        <div className="flex items-center space-x-2.5 rtl:space-x-reverse no-print">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            បោះពុម្ព
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-1.5" />
            ទាញយក Excel
          </button>
          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            បញ្ចូលម៉ោងបង្រៀន
          </button>
        </div>
      </div>

      {/* Filter Selector Row */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {/* Teacher indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">គ្រូបង្រៀន៖</span>
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
              លោកគ្រូ កែវ សំណាង (គណិតវិទ្យា ថ្នាក់ទី៨)
            </div>
          </div>

          {/* Class view filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">មើលតាមថ្នាក់៖</span>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedTeacherId('');
              }}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none font-semibold cursor-pointer"
            >
              <option value="">-- មើលគ្រប់ថ្នាក់ទាំងអស់ --</option>
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>{c.className}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedTeacherId === 'T-001' && (
          <span className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 rounded-full text-xs font-bold whitespace-nowrap">
            កាលវិភាគផ្លូវការ លោកគ្រូ កែវ សំណាង
          </span>
        )}
      </div>

      {/* Weekly Timetable Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              <tr>
                <th className="p-3 border border-slate-200 dark:border-slate-700 font-bold w-24">ម៉ោងសិក្សា</th>
                {daysKm.map(d => (
                  <th key={d.num} className="p-3 border border-slate-200 dark:border-slate-700 font-bold w-44">
                    {d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period.periodNumber} className={period.session === 'AFTERNOON' && period.periodNumber === 5 ? 'border-t-2 border-primary-500' : ''}>
                  {/* Period Time Column */}
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-mono">
                    <div className="font-bold">{period.startTime} - {period.endTime}</div>
                    <div className="text-[10px] text-slate-400">{period.periodNameKm}</div>
                  </td>

                  {/* Day Columns */}
                  {daysKm.map(d => {
                    const matchedSlots = displayedSlots.filter(
                      s => s.dayOfWeek === d.num && s.periodNumber === period.periodNumber
                    );

                    return (
                      <td
                        key={d.num}
                        className="p-1.5 border border-slate-200 dark:border-slate-700 align-top h-20 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20 relative group"
                      >
                        {matchedSlots.map(slot => {
                          const subj = subjects.find(s => s.subjectId === slot.subjectId);
                          const cls = classes.find(c => c.classId === slot.classId);
                          const tch = teachers.find(t => t.teacherId === slot.teacherId);

                          return (
                            <div
                              key={slot.timetableId}
                              className="p-2 rounded-xl text-left border shadow-xs relative transition-all bg-white dark:bg-slate-800 hover:shadow-md mb-1"
                              style={{ borderLeftColor: subj?.color || '#3b82f6', borderLeftWidth: '4px' }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-white truncate">
                                  {cls?.className}
                                </span>
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded text-white font-bold"
                                  style={{ backgroundColor: subj?.color || '#3b82f6' }}
                                >
                                  {subj?.subjectName}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                                គ្រូ៖ {tch?.fullName}
                              </p>

                              {slot.room && (
                                <p className="text-[10px] text-slate-400 font-mono">
                                  បន្ទប់៖ {slot.room}
                                </p>
                              )}

                              <div className="flex items-center justify-end space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenEdit(slot)}
                                  className="p-1 text-slate-400 hover:text-primary-600 rounded"
                                  title="កែសម្រួល"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(slot.timetableId)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="លុប"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {matchedSlots.length === 0 && (
                          <button
                            onClick={() => handleOpenAdd(d.num, period.periodNumber)}
                            className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 hover:text-primary-600 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                          >
                            <Plus className="w-4 h-4 mr-1" /> បន្ថែម
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Timetable Slot */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSlot ? 'កែសម្រួលម៉ោងបង្រៀន' : 'បញ្ចូលម៉ោងបង្រៀនថ្មី'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {conflictError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-start">
              <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>ការព្រមានអំពីភាពជាន់គ្នានៃកាលវិភាគ (Conflict Detected):</strong>
                <p className="mt-0.5">{conflictError}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ថ្ងៃនៃសប្តាហ៍ *
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {daysKm.map(d => (
                  <option key={d.num} value={d.num}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ម៉ោងទី (Period) *
              </label>
              <select
                value={formData.periodNumber}
                onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {periods.map(p => (
                  <option key={p.periodNumber} value={p.periodNumber}>
                    {p.periodNameKm} ({p.startTime} - {p.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                គ្រូបង្រៀន *
              </label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {teachers.map(t => (
                  <option key={t.teacherId} value={t.teacherId}>{t.fullName} ({t.teacherCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ថ្នាក់រៀន *
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {classes.map(c => (
                  <option key={c.classId} value={c.classId}>{c.className}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                មុខវិជ្ជា *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {subjects.map(s => (
                  <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                បន្ទប់រៀន
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="B1-01"
              />
            </div>
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
        title="លុបម៉ោងបង្រៀន"
        message="តើអ្នកប្រាកដជាចង់លុបម៉ោងបង្រៀននេះចេញពីកាលវិភាគមែនទេ?"
      />
    </div>
  );
};

