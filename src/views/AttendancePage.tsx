import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { useApp } from '../contexts/AppContext';
import { AttendanceRecord, AttendanceStatus, ClassRoom, Student } from '../types';
import { 
  CheckSquare, Calendar, Users, CheckCircle2, XCircle, Clock, AlertTriangle, 
  Save, Printer, Search, ShieldCheck
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { addToast } = useApp();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Filter criteria
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Local editable attendance map: studentId -> { status, reason }
  const [currentAttendance, setCurrentAttendance] = useState<{ [studentId: string]: { status: AttendanceStatus; reason?: string } }>({});

  const loadData = async () => {
    const [cls, st, att] = await Promise.all([
      storageService.getClasses(),
      storageService.getStudents(),
      storageService.getAttendance()
    ]);

    setClasses(cls);
    setStudents(st);
    setAttendanceRecords(att);

    if (cls.length > 0 && !selectedClassId) {
      setSelectedClassId(cls[0].classId);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When class, date, or period changes, load existing records or init default PRESENT
  useEffect(() => {
    if (!selectedClassId) return;

    const classStudents = students.filter(s => s.classId === selectedClassId && s.status === 'ACTIVE');
    const existingForSlot = attendanceRecords.filter(
      r => r.classId === selectedClassId && r.date === selectedDate && r.periodNumber === selectedPeriod
    );

    const map: { [studentId: string]: { status: AttendanceStatus; reason?: string } } = {};
    classStudents.forEach(s => {
      const match = existingForSlot.find(r => r.studentId === s.studentId);
      if (match) {
        map[s.studentId] = { status: match.status, reason: match.reason || '' };
      } else {
        map[s.studentId] = { status: 'PRESENT', reason: '' };
      }
    });

    setCurrentAttendance(map);
    setSaveSuccess(false);
  }, [selectedClassId, selectedDate, selectedPeriod, students, attendanceRecords]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setCurrentAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        reason: status === 'PRESENT' ? '' : (prev[studentId]?.reason || '')
      }
    }));
  };

  const handleReasonChange = (studentId: string, reason: string) => {
    setCurrentAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason
      }
    }));
  };

  const handleMarkAllPresent = () => {
    setCurrentAttendance(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        updated[id] = { status: 'PRESENT', reason: '' };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;

    const classStudents = students.filter(s => s.classId === selectedClassId && s.status === 'ACTIVE');
    const recordsToSave: AttendanceRecord[] = classStudents.map(s => {
      const entry = currentAttendance[s.studentId] || { status: 'PRESENT', reason: '' };
      const existing = attendanceRecords.find(
        r => r.classId === selectedClassId && r.date === selectedDate && r.periodNumber === selectedPeriod && r.studentId === s.studentId
      );

      return {
        attendanceId: existing?.attendanceId || `ATT-${selectedClassId}-${s.studentId}-${selectedDate}-P${selectedPeriod}`,
        scheduledLessonId: existing?.scheduledLessonId || '',
        studentId: s.studentId,
        classId: selectedClassId,
        academicYearId: 'AY-2025-2026',
        date: selectedDate,
        periodNumber: selectedPeriod,
        status: entry.status,
        reason: entry.reason || '',
        recordedBy: 'T-001',
        updatedAt: new Date().toISOString()
      };
    });

    await storageService.bulkSaveAttendance(recordsToSave);
    addToast('success', 'បានរក្សាទុកវត្តមានសិស្សជោគជ័យ');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    await loadData();
  };

  const currentClass = classes.find(c => c.classId === selectedClassId);
  const enrolledStudents = students.filter(s => s.classId === selectedClassId && s.status === 'ACTIVE');
  
  const filteredStudents = enrolledStudents.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (s.fullName || '').toLowerCase().includes(q) || (s.studentCode || '').toLowerCase().includes(q);
  });

  // Calculate live statistics
  const total = enrolledStudents.length;
  let presentCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let lateCount = 0;
  let leftEarlyCount = 0;

  Object.values(currentAttendance).forEach(v => {
    if (v.status === 'PRESENT') presentCount++;
    else if (v.status === 'ABSENT') absentCount++;
    else if (v.status === 'EXCUSED') excusedCount++;
    else if (v.status === 'LATE') lateCount++;
    else if (v.status === 'LEFT_EARLY') leftEarlyCount++;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            គ្រប់គ្រងអវត្តមានសិស្ស (Student Attendance)
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            កត់ត្រាវត្តមានសិស្សប្រចាំថ្ងៃតាមវេនបង្រៀន និងតាមដានស្ថានភាពសិស្ស
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-all print:hidden"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            បោះពុម្ពបញ្ជីវត្តមាន
          </button>
          <button
            onClick={handleSaveAttendance}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all print:hidden"
          >
            <Save className="w-4 h-4" />
            រក្សាទុកវត្តមាន
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">វត្តមានសិស្សសម្រាប់ថ្នាក់ {currentClass?.className} ម៉ោងទី {selectedPeriod} ត្រូវបានរក្សាទុកជោគជ័យ!</span>
        </div>
      )}

      {/* Filter and Class Selection Bar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-4 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">ជ្រើសរើសថ្នាក់រៀន</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>ថ្នាក់ {c.className} (ទី {c.grade})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">កាលបរិច្ឆេទ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">ម៉ោងបង្រៀនទី</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                <option key={p} value={p}>ម៉ោងទី {p} ({p <= 4 ? 'ពេលព្រឹក' : 'ពេលរសៀល'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">ស្វែងរកសិស្ស</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ឈ្មោះ ឬអត្តលេខ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions & Summary Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700 dark:text-slate-300">ស្ថិតិវត្តមាន:</span>
            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md font-semibold">
              វត្តមាន (P): {presentCount}
            </span>
            <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-md font-semibold">
              អវត្តមាន (A): {absentCount}
            </span>
            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-md font-semibold">
              មានច្បាប់ (E): {excusedCount}
            </span>
            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md font-semibold">
              មកយឺត (L): {lateCount}
            </span>
            <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-md font-semibold">
              ចេញមុន: {leftEarlyCount}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600 dark:text-slate-400 font-medium">
              សរុប: {total} នាក់
            </span>
          </div>

          <button
            onClick={handleMarkAllPresent}
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            កំណត់វត្តមានទាំងអស់ (Mark All Present)
          </button>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Printable Header */}
        <div className="hidden print:block p-6 text-center border-b">
          <h2 className="text-lg font-bold">វិទ្យាល័យហ៊ុនសែន បាត់ដឹង</h2>
          <h3 className="text-base font-semibold mt-1">បញ្ជីវត្តមានសិស្សប្រចាំថ្នាក់ {currentClass?.className}</h3>
          <p className="text-xs text-gray-600 mt-1">កាលបរិច្ឆេទ: {selectedDate} | ម៉ោងទី: {selectedPeriod}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold">
                <th className="py-3.5 px-4 w-12 text-center">ល.រ</th>
                <th className="py-3.5 px-4 w-28">អត្តលេខ</th>
                <th className="py-3.5 px-4 w-44">គោត្តនាម-នាម</th>
                <th className="py-3.5 px-4 w-20 text-center">ភេទ</th>
                <th className="py-3.5 px-4 text-center w-80 print:w-40">ស្ថានភាពវត្តមាន</th>
                <th className="py-3.5 px-4">មូលហេតុ / កំណត់សម្គាល់</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-slate-400">
                    មិនមានសិស្សនៅក្នុងថ្នាក់នេះទេ
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const entry = currentAttendance[s.studentId] || { status: 'PRESENT', reason: '' };
                  const isPresent = entry.status === 'PRESENT';
                  const isAbsent = entry.status === 'ABSENT';
                  const isExcused = entry.status === 'EXCUSED';
                  const isLate = entry.status === 'LATE';

                  return (
                    <tr 
                      key={s.studentId} 
                      className={`hover:bg-gray-50/60 dark:hover:bg-slate-700/50 transition-colors ${
                        isAbsent ? 'bg-rose-50/40 dark:bg-rose-950/20' : isExcused ? 'bg-blue-50/30 dark:bg-blue-950/20' : isLate ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-xs text-gray-500 dark:text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-slate-400">
                        {s.studentCode}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        {s.fullName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          s.gender === 'F' ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}>
                          {s.gender === 'F' ? 'ស្រី' : 'ប្រុស'}
                        </span>
                      </td>

                      {/* Status Selector Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, 'PRESENT')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                              isPresent 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                            }`}
                            title="វត្តមាន"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>មក</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, 'ABSENT')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                              isAbsent 
                                ? 'bg-rose-600 text-white shadow-xs' 
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                            }`}
                            title="អវត្តមានឥតច្បាប់"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>អត់ច្បាប់</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, 'EXCUSED')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                              isExcused 
                                ? 'bg-blue-600 text-white shadow-xs' 
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                            }`}
                            title="មានច្បាប់អនុញ្ញាត"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>មានច្បាប់</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(s.studentId, 'LATE')}
                            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                              isLate 
                                ? 'bg-amber-600 text-white shadow-xs' 
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                            }`}
                            title="មកយឺត"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>យឺត</span>
                          </button>
                        </div>
                      </td>

                      {/* Reason input field */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder={isPresent ? 'កំណត់សម្គាល់បន្ថែម...' : 'បញ្ជាក់មូលហេតុ (ឈឺ, ធុរៈ...)'}
                          value={entry.reason || ''}
                          onChange={(e) => handleReasonChange(s.studentId, e.target.value)}
                          className={`w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-1 dark:bg-slate-900 text-gray-900 dark:text-white ${
                            !isPresent && !entry.reason 
                              ? 'border-amber-300 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-950/20 focus:ring-amber-500' 
                              : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-500'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="p-4 bg-gray-50 dark:bg-slate-900/60 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between print:hidden">
          <div className="text-xs text-gray-500 dark:text-slate-400">
            * ព័ត៌មានអវត្តមានត្រូវបានគណនាដោយស្វ័យប្រវត្តិទៅក្នុងរបាយការណ៍សិស្សប្រចាំខែ និងប្រចាំឆ្នាំ
          </div>
          <button
            onClick={handleSaveAttendance}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            រក្សាទុកវត្តមាន
          </button>
        </div>
      </div>
    </div>
  );
};
