import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  School,
  GraduationCap,
  CalendarDays
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { schedulerEngine } from '../services/schedulerEngine';
import { MakeUpLesson, ScheduledLesson, ClassRoom, Teacher, Subject } from '../types';
import { Modal } from '../components/common/Modal';

export const MakeUpLessonsPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [makeUpLessons, setMakeUpLessons] = useState<MakeUpLesson[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // New Make-up Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMissedId, setSelectedMissedId] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [newPeriod, setNewPeriod] = useState<number>(5); // default afternoon
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mkp, sessions, cls, tchs, subs] = await Promise.all([
        storageService.getMakeUpLessons(activeAcademicYear?.academicYearId),
        storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
        storageService.getClasses(),
        storageService.getTeachers(),
        storageService.getSubjects()
      ]);
      setMakeUpLessons(mkp);
      setScheduledLessons(sessions);
      setClasses(cls);
      setTeachers(tchs);
      setSubjects(subs);
    } catch (err) {
      console.error('Failed to load make up lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  // Lessons marked as missed or planned that haven't been completed
  const missedSessions = scheduledLessons.filter(l => l.status === 'missed');

  const handleScheduleMakeUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMissedId || !newDate) {
      addToast('error', 'សូមជ្រើសរើសព័ត៌មានចាំបាច់', 'សូមជ្រើសរើសម៉ោងខកខាន និងកាលបរិច្ឆេទថ្មី');
      return;
    }

    setSaving(true);
    try {
      await schedulerEngine.rescheduleMissedLesson(
        selectedMissedId,
        newDate,
        newPeriod,
        substituteTeacherId || undefined
      );
      await loadData();
      setShowScheduleModal(false);
      addToast('success', 'បានកំណត់ម៉ោងបង្រៀនសងដោយជោគជ័យ', `កាលបរិច្ឆេទថ្មី៖ ${newDate} ម៉ោងទី ${newPeriod}`);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការកំណត់ម៉ោងសង', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <span>ម៉ោងបង្រៀនសង (Make-up Lessons Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            គ្រប់គ្រងម៉ោងដែលខកខាន និងរៀបចំកាលវិភាគបង្រៀនសងស្របតាមកម្មវិធីសិក្សា
          </p>
        </div>

        <button
          onClick={() => {
            if (missedSessions.length === 0) {
              addToast('info', 'មិនមានម៉ោងខកខាន', 'បច្ចុប្បន្នមិនទាន់មានម៉ោងបង្រៀនដែលត្រូវបានកំណត់ថាខកខាននៅឡើយទេ។');
            }
            setShowScheduleModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>កំណត់ម៉ោងបង្រៀនសង</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>ម៉ោងខកខានសរុប</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-2 block">
            {missedSessions.length}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">រង់ចាំការកំណត់បង្រៀនសង</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>ម៉ោងបានកំណត់សង</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-600 mt-2 block">
            {makeUpLessons.length}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">បានរៀបចំកាលវិភាគរួច</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>បានបង្រៀនសងចប់</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 mt-2 block">
            {makeUpLessons.filter(m => m.status === 'completed').length}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">បានបំពេញរួចរាល់</p>
        </div>
      </div>

      {/* Missed Lessons Awaiting Rescheduling */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          ម៉ោងខកខានរង់ចាំការបង្រៀនសង (Pending Missed Sessions)
        </h2>

        {missedSessions.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ពុំមានម៉ោងបង្រៀនណាមួយដែលបានខកខានឡើយ! វឌ្ឍនភាពដំណើរការល្អប្រសើរ។
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {missedSessions.map((session) => (
              <div
                key={session.scheduledLessonId}
                className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-700 dark:text-red-400">
                      កាលបរិច្ឆេទខកខាន៖ {session.date} (ម៉ោងទី {session.periodNumber})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 text-[10px]">
                      ថ្នាក់ {classes.find(c => c.classId === session.classId)?.className}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold mt-1">
                    {session.lessonTitle} - {session.topicTitle}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    មូលហេតុ៖ {session.missedReason || 'អវត្តមាន ឬជាប់ធុរៈផ្លូវការ'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedMissedId(session.scheduledLessonId);
                    setShowScheduleModal(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shrink-0"
                >
                  កំណត់ពេលសង
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Make-up History Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          បញ្ជីកាលវិភាគម៉ោងបង្រៀនសងដែលបានរៀបចំ (Scheduled Make-up Records)
        </h2>

        {makeUpLessons.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            មិនទាន់មានទិន្នន័យម៉ោងបង្រៀនសងនៅឡើយទេ។
          </p>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2.5">ថ្ងៃខកខាន</th>
                  <th className="px-3 py-2.5">ថ្ងៃបង្រៀនសងថ្មី</th>
                  <th className="px-3 py-2.5">ម៉ោងទី</th>
                  <th className="px-3 py-2.5">ថ្នាក់</th>
                  <th className="px-3 py-2.5">គ្រូបង្រៀន/ជំនួស</th>
                  <th className="px-3 py-2.5">មូលហេតុ</th>
                  <th className="px-3 py-2.5 text-center">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {makeUpLessons.map((m) => (
                  <tr key={m.makeUpId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-mono text-slate-500">{m.originalDate}</td>
                    <td className="px-3 py-2.5 font-bold text-blue-600">{m.newDate}</td>
                    <td className="px-3 py-2.5">ម៉ោងទី {m.periodNumber} ({m.startTime})</td>
                    <td className="px-3 py-2.5 font-bold">{classes.find(c => c.classId === m.classId)?.className}</td>
                    <td className="px-3 py-2.5">
                      {teachers.find(t => t.teacherId === m.teacherId)?.fullName || 'លោកគ្រូ កែវ សំណាង'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{m.reason}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {m.status === 'completed' ? 'បានបង្រៀនរួច' : 'រង់ចាំបង្រៀន'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="រៀបចំកាលវិភាគបង្រៀនសង (Reschedule Lesson)"
        maxWidth="xl"
      >
        <form onSubmit={handleScheduleMakeUp} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ជ្រើសរើសម៉ោងខកខាន *
            </label>
            <select
              value={selectedMissedId}
              onChange={(e) => setSelectedMissedId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              required
            >
              <option value="">-- សូមជ្រើសរើស --</option>
              {missedSessions.map(s => (
                <option key={s.scheduledLessonId} value={s.scheduledLessonId}>
                  {s.date} - ម៉ោងទី {s.periodNumber} ({classes.find(c => c.classId === s.classId)?.className}) : {s.lessonTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                កាលបរិច្ឆេទបង្រៀនសងថ្មី *
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ម៉ោងបង្រៀនទី *
              </label>
              <select
                value={newPeriod}
                onChange={(e) => setNewPeriod(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                  <option key={p} value={p}>ម៉ោងទី {p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              គ្រូបង្រៀនជំនួស (បើមាន)
            </label>
            <select
              value={substituteTeacherId}
              onChange={(e) => setSubstituteTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
            >
              <option value="">លោកគ្រូ កែវ សំណាង (បង្រៀនផ្ទាល់)</option>
              {teachers.filter(t => t.teacherId !== 'T-001').map(t => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.fullName} ({t.teacherCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកកាលវិភាគសង'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
