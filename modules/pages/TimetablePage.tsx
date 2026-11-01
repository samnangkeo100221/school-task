import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Clock,
  School,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { excelService } from '../services/excelService';
import { TimetableSlot, ClassRoom, Subject, Teacher } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const TimetablePage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // View filter
  const [viewBy, setViewBy] = useState<'teacher' | 'class'>('teacher');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('T-001'); // Keo Samnang default

  // Slot modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [slotFormData, setSlotFormData] = useState<Partial<TimetableSlot>>({
    dayOfWeek: 1,
    periodNumber: 1,
    startTime: '07:00',
    endTime: '07:50',
    teacherId: 'T-001',
    classId: 'CLS-8A',
    subjectId: 'SUB-MATH-8',
    room: 'បន្ទប់ ១២',
    status: 'active'
  });

  const [conflictError, setConflictError] = useState<string | null>(null);

  // Delete confirm
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slots, cls, subs, tchs] = await Promise.all([
        storageService.getTimetables(activeAcademicYear?.academicYearId),
        storageService.getClasses(),
        storageService.getSubjects(),
        storageService.getTeachers()
      ]);
      setTimetable(slots);
      setClasses(cls);
      setSubjects(subs);
      setTeachers(tchs);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  // Days of week: Monday to Saturday (1 to 6)
  const daysOfWeek = [
    { day: 1, name: 'ចន្ទ (Monday)' },
    { day: 2, name: 'អង្គារ (Tuesday)' },
    { day: 3, name: 'ពុធ (Wednesday)' },
    { day: 4, name: 'ព្រហស្បតិ៍ (Thursday)' },
    { day: 5, name: 'សុក្រ (Friday)' },
    { day: 6, name: 'សៅរ៍ (Saturday)' }
  ];

  const periods = [
    { num: 1, time: '07:00 - 07:50' },
    { num: 2, time: '08:00 - 08:50' },
    { num: 3, time: '09:10 - 10:00' },
    { num: 4, time: '10:10 - 11:00' },
    { num: 5, time: '13:00 - 13:50' },
    { num: 6, time: '14:00 - 14:50' },
    { num: 7, time: '15:10 - 16:00' },
    { num: 8, time: '16:10 - 17:00' }
  ];

  // Conflict detection
  const validateConflicts = (slot: Partial<TimetableSlot>, excludeSlotId?: string): string | null => {
    for (const existing of timetable) {
      if (excludeSlotId && existing.timetableId === excludeSlotId) continue;
      if (existing.status !== 'active') continue;

      if (
        existing.dayOfWeek === Number(slot.dayOfWeek) &&
        existing.periodNumber === Number(slot.periodNumber)
      ) {
        // Rule 1: Teacher conflict
        if (existing.teacherId === slot.teacherId) {
          const tName = teachers.find(t => t.teacherId === slot.teacherId)?.fullName || slot.teacherId;
          const cName = classes.find(c => c.classId === existing.classId)?.className || existing.classId;
          return `ជាន់ម៉ោងបង្រៀនរបស់គ្រូ៖ លោកគ្រូ/អ្នកគ្រូ ${tName} មានម៉ោងបង្រៀននៅថ្នាក់ ${cName} រួចហើយក្នុងម៉ោងទី ${slot.periodNumber} ថ្ងៃនេះ!`;
        }

        // Rule 2: Class conflict
        if (existing.classId === slot.classId) {
          const cName = classes.find(c => c.classId === slot.classId)?.className || slot.classId;
          const sName = subjects.find(s => s.subjectId === existing.subjectId)?.subjectName || existing.subjectId;
          return `ជាន់ម៉ោងរៀនរបស់ថ្នាក់៖ ថ្នាក់ ${cName} កំពុងរៀនមុខវិជ្ជា ${sName} រួចហើយក្នុងម៉ោងទី ${slot.periodNumber} ថ្ងៃនេះ!`;
        }

        // Rule 3: Room conflict
        if (slot.room && existing.room && slot.room.trim() === existing.room.trim()) {
          return `ជាន់បន្ទប់រៀន៖ ${slot.room} ត្រូវបានប្រើប្រាស់ដោយថ្នាក់ផ្សេងរួចហើយក្នុងម៉ោងទី ${slot.periodNumber} ថ្ងៃនេះ!`;
        }
      }
    }
    return null;
  };

  const handleOpenAddSlot = (dayOfWeek?: number, periodNumber?: number) => {
    setEditingSlot(null);
    setConflictError(null);
    const p = periods.find(p => p.num === periodNumber) || periods[0];
    const [st, et] = p.time.split(' - ');
    setSlotFormData({
      timetableId: `TT-${Date.now()}`,
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      dayOfWeek: dayOfWeek || 1,
      periodNumber: periodNumber || 1,
      startTime: st || '07:00',
      endTime: et || '07:50',
      teacherId: selectedTeacherId !== 'all' ? selectedTeacherId : 'T-001',
      classId: selectedClassId !== 'all' ? selectedClassId : 'CLS-8A',
      subjectId: 'SUB-MATH-8',
      room: 'បន្ទប់ ១២',
      effectiveStartDate: activeAcademicYear?.startDate || '2025-11-01',
      effectiveEndDate: activeAcademicYear?.endDate || '2026-08-31',
      status: 'active'
    });
    setShowSlotModal(true);
  };

  const handleOpenEditSlot = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setConflictError(null);
    setSlotFormData(slot);
    setShowSlotModal(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const conflict = validateConflicts(slotFormData, editingSlot?.timetableId);
    if (conflict) {
      setConflictError(conflict);
      return;
    }

    try {
      const slotToSave: TimetableSlot = {
        timetableId: editingSlot?.timetableId || `TT-${Date.now()}`,
        academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
        teacherId: slotFormData.teacherId || 'T-001',
        classId: slotFormData.classId || 'CLS-8A',
        subjectId: slotFormData.subjectId || 'SUB-MATH-8',
        dayOfWeek: Number(slotFormData.dayOfWeek) || 1,
        periodNumber: Number(slotFormData.periodNumber) || 1,
        startTime: slotFormData.startTime || '07:00',
        endTime: slotFormData.endTime || '07:50',
        room: slotFormData.room || 'បន្ទប់ ១២',
        effectiveStartDate: slotFormData.effectiveStartDate || '2025-11-01',
        effectiveEndDate: slotFormData.effectiveEndDate || '2026-08-31',
        status: (slotFormData.status as any) || 'active'
      };

      await storageService.saveTimetableSlot(slotToSave);
      await loadData();
      setShowSlotModal(false);
      addToast('success', editingSlot ? 'បានកែប្រែកាលវិភាគ' : 'បានបន្ថែមម៉ោងបង្រៀនថ្មី', `ម៉ោងទី ${slotToSave.periodNumber}`);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;
    try {
      await storageService.deleteTimetableSlot(slotToDelete.timetableId);
      await loadData();
      addToast('success', 'បានលុបម៉ោងបង្រៀនចេញពីកាលវិភាគ', `ម៉ោងទី ${slotToDelete.periodNumber}`);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការលុប', err.message);
    }
  };

  // Filter timetable for grid
  const currentSlots = timetable.filter(slot => {
    if (viewBy === 'teacher') {
      return slot.teacherId === selectedTeacherId;
    } else {
      if (selectedClassId === 'all') return true;
      return slot.classId === selectedClassId;
    }
  });

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <span>កាលវិភាគបង្រៀន (Teacher & Class Timetable)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            គ្រប់គ្រងម៉ោងបង្រៀនប្រចាំសប្តាហ៍ និងផ្ទៀងផ្ទាត់ការជាន់ម៉ោងស្វ័យប្រវត្តិ (Conflict Detection)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenAddSlot()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមម៉ោងបង្រៀន</span>
          </button>
        </div>
      </div>

      {/* Filter and View Toggle */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <button
              onClick={() => setViewBy('teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewBy === 'teacher'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              កាលវិភាគតាមគ្រូ
            </button>
            <button
              onClick={() => setViewBy('class')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewBy === 'class'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              កាលវិភាគតាមថ្នាក់
            </button>
          </div>

          {viewBy === 'teacher' ? (
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              {teachers.map(t => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.fullName} ({t.teacherCode})
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="all">គ្រប់ថ្នាក់រៀន</option>
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>{c.className}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900">
            បន្ទុកបង្រៀន៖ {currentSlots.length} ម៉ោង / សប្តាហ៍
          </span>
        </div>
      </div>

      {/* Timetable Weekly Grid */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-x-auto text-xs">
        <table className="w-full border-collapse border border-slate-200 dark:border-slate-700 min-w-[850px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
              <th className="p-3 border border-slate-200 dark:border-slate-700 w-28 text-center font-bold">
                ម៉ោងសិក្សា
              </th>
              {daysOfWeek.map((d) => (
                <th
                  key={d.day}
                  className="p-3 border border-slate-200 dark:border-slate-700 text-center font-bold"
                >
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.num} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                <td className="p-2.5 border border-slate-200 dark:border-slate-700 text-center bg-slate-50/60 dark:bg-slate-900/40">
                  <span className="font-bold text-slate-800 dark:text-white block">
                    ម៉ោងទី {p.num}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    {p.time}
                  </span>
                </td>

                {daysOfWeek.map((d) => {
                  const slot = currentSlots.find(
                    s => s.dayOfWeek === d.day && s.periodNumber === p.num
                  );
                  const cls = slot ? classes.find(c => c.classId === slot.classId) : null;
                  const tch = slot ? teachers.find(t => t.teacherId === slot.teacherId) : null;

                  return (
                    <td
                      key={d.day}
                      className="p-2 border border-slate-200 dark:border-slate-700 h-20 align-top relative group"
                    >
                      {slot ? (
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/70 h-full flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-blue-700 dark:text-blue-300">
                                ថ្នាក់ {cls?.className || slot.classId}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white dark:bg-slate-800 text-slate-500 font-medium">
                                {slot.room}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold mt-1">
                              គណិតវិទ្យា
                            </p>
                            {viewBy === 'class' && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{tch?.fullName}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditSlot(slot)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white"
                              title="កែសម្រួល"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setSlotToDelete(slot);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white"
                              title="លុប"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAddSlot(d.day, p.num)}
                          className="w-full h-full rounded-xl border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-slate-400"
                        >
                          <Plus className="w-4 h-4" />
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

      {/* Slot Modal */}
      <Modal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        title={editingSlot ? 'កែប្រែម៉ោងបង្រៀនក្នុងកាលវិភាគ' : 'បន្ថែមម៉ោងបង្រៀនថ្មី'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
          {conflictError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{conflictError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ថ្ងៃនៃសប្តាហ៍ *
              </label>
              <select
                value={slotFormData.dayOfWeek}
                onChange={(e) => {
                  setSlotFormData({ ...slotFormData, dayOfWeek: Number(e.target.value) });
                  setConflictError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                {daysOfWeek.map(d => <option key={d.day} value={d.day}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ម៉ោងសិក្សាទី *
              </label>
              <select
                value={slotFormData.periodNumber}
                onChange={(e) => {
                  const pNum = Number(e.target.value);
                  const p = periods.find(item => item.num === pNum);
                  const [st, et] = (p?.time || '07:00 - 07:50').split(' - ');
                  setSlotFormData({
                    ...slotFormData,
                    periodNumber: pNum,
                    startTime: st,
                    endTime: et
                  });
                  setConflictError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                {periods.map(p => <option key={p.num} value={p.num}>ម៉ោងទី {p.num} ({p.time})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ថ្នាក់រៀន *
              </label>
              <select
                value={slotFormData.classId}
                onChange={(e) => {
                  setSlotFormData({ ...slotFormData, classId: e.target.value });
                  setConflictError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                បន្ទប់រៀន *
              </label>
              <input
                type="text"
                placeholder="ឧ. បន្ទប់ ១២"
                value={slotFormData.room || ''}
                onChange={(e) => setSlotFormData({ ...slotFormData, room: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                គ្រូបង្រៀន *
              </label>
              <select
                value={slotFormData.teacherId}
                onChange={(e) => {
                  setSlotFormData({ ...slotFormData, teacherId: e.target.value });
                  setConflictError(null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                {teachers.map(t => <option key={t.teacherId} value={t.teacherId}>{t.fullName} ({t.teacherCode})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                មុខវិជ្ជា *
              </label>
              <select
                value={slotFormData.subjectId}
                onChange={(e) => setSlotFormData({ ...slotFormData, subjectId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowSlotModal(false)}
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
        onConfirm={handleDeleteSlot}
        title="បញ្ជាក់ការលុបម៉ោងបង្រៀន"
        message="តើលោកគ្រូពិតជាចង់លុបម៉ោងបង្រៀននេះចេញពីកាលវិភាគមែនទេ?"
        confirmLabel="យល់ព្រមលុប"
        cancelLabel="បោះបង់"
        isDestructive
      />
    </div>
  );
};
