import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Calendar,
  School,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Search,
  Download,
  Check,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { excelService } from '../services/excelService';
import { Student, ClassRoom, AttendanceRecord, AttendanceStatus, ScheduledLesson } from '../types';
import { useSearchParams } from 'react-router-dom';

export const AttendancePage: React.FC = () => {
  const { activeAcademicYear, currentUser, addToast } = useApp();
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(() => searchParams.get('classId') || 'CLS-8A');
  const [selectedDate, setSelectedDate] = useState<string>(() => searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(() => {
    const p = searchParams.get('period');
    return p ? parseInt(p, 10) : 1;
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<{ [studentId: string]: { status: AttendanceStatus; reason?: string; notes?: string } }>({});
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cls, allStudents, sessions] = await Promise.all([
        storageService.getClasses(),
        storageService.getStudents(),
        storageService.getScheduledLessons(activeAcademicYear?.academicYearId)
      ]);
      setClasses(cls);
      setScheduledLessons(sessions);

      // Filter students for selected class
      const classStudents = allStudents.filter(s => s.classId === selectedClassId && s.status === 'active');
      setStudents(classStudents);

      // Load existing attendance records for this date, class, period
      const existing = await storageService.getAttendance(
        activeAcademicYear?.academicYearId,
        selectedDate,
        selectedClassId,
        selectedPeriod
      );

      const map: { [studentId: string]: { status: AttendanceStatus; reason?: string; notes?: string } } = {};
      classStudents.forEach(st => {
        const found = existing.find(r => r.studentId === st.studentId);
        map[st.studentId] = {
          status: found ? found.status : 'PRESENT', // default present
          reason: found?.reason || '',
          notes: found?.notes || ''
        };
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear, selectedClassId, selectedDate, selectedPeriod]);

  useEffect(() => {
    const c = searchParams.get('classId');
    const d = searchParams.get('date');
    const p = searchParams.get('period');
    if (c && c !== selectedClassId) setSelectedClassId(c);
    if (d && d !== selectedDate) setSelectedDate(d);
    if (p && parseInt(p, 10) !== selectedPeriod) setSelectedPeriod(parseInt(p, 10));
  }, [searchParams]);

  // Find linked scheduled lesson
  const currentSession = scheduledLessons.find(
    s => s.date === selectedDate && s.classId === selectedClassId && s.periodNumber === selectedPeriod
  );

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: typeof attendanceMap = {};
    students.forEach(st => {
      updated[st.studentId] = {
        ...attendanceMap[st.studentId],
        status
      };
    });
    setAttendanceMap(updated);
    addToast('info', 'បានកំណត់វត្តមានរួម', `កំណត់សិស្សទាំងអស់ទៅជា៖ ${getStatusLabel(status)}`);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const recordsToSave: AttendanceRecord[] = students.map(st => {
        const att = attendanceMap[st.studentId] || { status: 'PRESENT' as const };
        return {
          attendanceId: `ATT-${selectedClassId}-${selectedDate}-P${selectedPeriod}-${st.studentId}`,
          scheduledLessonId: currentSession?.scheduledLessonId || `SCH-${selectedClassId}-${selectedDate}-P${selectedPeriod}`,
          academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
          classId: selectedClassId,
          subjectId: currentSession?.subjectId || 'SUB-MATH-8',
          teacherId: currentSession?.teacherId || 'T-001',
          date: selectedDate,
          periodNumber: selectedPeriod,
          studentId: st.studentId,
          studentCode: st.studentCode,
          studentName: st.fullName,
          gender: st.gender,
          status: att.status,
          reason: att.reason,
          notes: att.notes,
          recordedBy: currentUser.displayName,
          recordedAt: new Date().toISOString()
        };
      });

      await storageService.saveAttendanceRecords(recordsToSave);

      // If there is a scheduled lesson, mark attendanceRecorded = true
      if (currentSession) {
        await storageService.updateScheduledLesson({
          ...currentSession,
          attendanceRecorded: true
        });
      }

      addToast('success', 'បានរក្សាទុកវត្តមានសិស្សដោយជោគជ័យ', `សិស្សសរុប ${recordsToSave.length} នាក់`);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុកវត្តមាន', err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return 'មានវត្តមាន';
      case 'ABSENT': return 'អវត្តមាន';
      case 'EXCUSED': return 'មានច្បាប់';
      case 'LATE': return 'មកយឺត';
      case 'LEFT_EARLY': return 'ចេញមុន';
    }
  };

  // Calculations for summary stats
  const presentCount = Object.values(attendanceMap).filter(v => v.status === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter(v => v.status === 'ABSENT').length;
  const excusedCount = Object.values(attendanceMap).filter(v => v.status === 'EXCUSED').length;
  const lateCount = Object.values(attendanceMap).filter(v => v.status === 'LATE').length;
  const attendanceRate = students.length > 0 ? Math.round(((presentCount + lateCount) / students.length) * 100) : 100;

  const filteredStudents = students.filter(st => {
    if (!searchStudent.trim()) return true;
    const q = searchStudent.toLowerCase();
    return st.fullName.toLowerCase().includes(q) || st.studentCode.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>កត់ត្រាវត្តមានសិស្ស (Student Attendance)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            កត់ត្រាវត្តមានសិស្សតាមម៉ោងបង្រៀននីមួយៗ ភ្ជាប់ជាមួយកាលវិភាគបង្រៀនជាក់ស្តែង
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const records = students.map(st => ({
                attendanceId: '',
                scheduledLessonId: '',
                academicYearId: '',
                classId: selectedClassId,
                subjectId: '',
                teacherId: '',
                date: selectedDate,
                periodNumber: selectedPeriod,
                studentId: st.studentId,
                studentCode: st.studentCode,
                studentName: st.fullName,
                gender: st.gender,
                status: attendanceMap[st.studentId]?.status || 'PRESENT',
                reason: attendanceMap[st.studentId]?.reason,
                recordedBy: currentUser.displayName,
                recordedAt: new Date().toISOString()
              }));
              const className = classes.find(c => c.classId === selectedClassId)?.className || selectedClassId;
              excelService.exportAttendance(records, className, selectedDate);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>ទាញយក Excel</span>
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកវត្តមាន'}</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Date Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            កាលបរិច្ឆេទបង្រៀន
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Class Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            ថ្នាក់រៀន
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>
        </div>

        {/* Period Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            ម៉ោងបង្រៀនទី
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
              <option key={p} value={p}>ម៉ោងទី {p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Session Context Banner */}
      {currentSession ? (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <span className="font-bold">ម៉ោងបង្រៀនតាមកាលវិភាគ៖</span>
            <span>{currentSession.chapterTitle} - {currentSession.lessonTitle}</span>
          </div>
          <span className="font-bold px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px]">
            {currentSession.startTime} - {currentSession.endTime} ({currentSession.room})
          </span>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>មិនមានម៉ោងបង្រៀនគ្រោងទុកក្នុងកាលវិភាគផ្លូវការសម្រាប់ពេលនេះទេ។ លោកគ្រូអាចកត់ត្រាវត្តមានសម្រាប់ម៉ោងបង្រៀនក្រៅម៉ោង ឬម៉ោងសងបានធម្មតា។</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <span className="text-[11px] text-slate-500 block">សិស្សសរុប</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{students.length}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <span className="text-[11px] text-emerald-600 block">មានវត្តមាន</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{presentCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <span className="text-[11px] text-red-600 block">អវត្តមានឥតច្បាប់</span>
          <span className="text-xl font-black text-red-600 mt-1 block">{absentCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-center">
          <span className="text-[11px] text-amber-600 block">មានច្បាប់</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{excusedCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-center col-span-2 sm:col-span-1">
          <span className="text-[11px] text-blue-600 block">អត្រាវត្តមាន</span>
          <span className="text-xl font-black text-blue-600 mt-1 block">{attendanceRate}%</span>
        </div>
      </div>

      {/* Quick Mark Buttons & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">កំណត់ទាំងអស់៖</span>
          <button
            onClick={() => handleMarkAll('PRESENT')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            វត្តមានទាំងអស់
          </button>
          <button
            onClick={() => handleMarkAll('ABSENT')}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            អវត្តមានទាំងអស់
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ស្វែងរកឈ្មោះសិស្ស..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-x-auto text-xs">
        <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-900/60 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 text-center w-12">ល.រ</th>
              <th className="px-3 py-3 w-28">អត្តលេខ</th>
              <th className="px-3 py-3">ឈ្មោះសិស្ស</th>
              <th className="px-3 py-3 text-center w-16">ភេទ</th>
              <th className="px-3 py-3 text-center">ស្ថានភាពវត្តមាន</th>
              <th className="px-3 py-3">មូលហេតុ (បើមាន)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  មិនមានសិស្សក្នុងថ្នាក់នេះទេ។
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => {
                const att = attendanceMap[student.studentId] || { status: 'PRESENT' };
                return (
                  <tr
                    key={student.studentId}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="px-3 py-3 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="px-3 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">{student.studentCode}</td>
                    <td className="px-3 py-3 font-bold text-slate-900 dark:text-white">{student.fullName}</td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                      {student.gender === 'M' ? 'ប្រុស' : 'ស្រី'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl gap-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            att.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          មានវត្តមាន
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'ABSENT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            att.status === 'ABSENT'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          អវត្តមាន
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'EXCUSED')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            att.status === 'EXCUSED'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          មានច្បាប់
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'LATE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            att.status === 'LATE'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          មកយឺត
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        placeholder="បញ្ជាក់មូលហេតុ..."
                        value={att.reason || ''}
                        onChange={(e) => {
                          setAttendanceMap(prev => ({
                            ...prev,
                            [student.studentId]: {
                              ...prev[student.studentId],
                              reason: e.target.value
                            }
                          }));
                        }}
                        className="w-full px-2.5 py-1 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-slate-50 dark:focus:bg-slate-900 rounded-xs text-xs"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
