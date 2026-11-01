import React, { useState, useEffect } from 'react';
import {
  BookCopy,
  Table as TableIcon,
  Calendar as CalendarIcon,
  Play,
  Download,
  Printer,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { schedulerEngine, GenerationResult } from '../services/schedulerEngine';
import {
  ScheduledLesson,
  ClassRoom,
  Teacher,
  Subject,
  TeachingStatus,
  LessonPlan,
  AttendanceRecord
} from '../types';
import { Modal } from '../components/common/Modal';
import { excelService } from '../services/excelService';

export const ClassCurriculumPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // View state: 'table' or 'calendar'
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>(() => {
    return (localStorage.getItem('msts_curriculum_view') as 'table' | 'calendar') || 'table';
  });

  // Filters
  const [filterClass, setFilterClass] = useState<string>('CLS-8A'); // Default 8A
  const [filterSubject, setFilterSubject] = useState<string>('SUB-MATH-8'); // Math
  const [filterTeacher, setFilterTeacher] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Calendar View month pointer
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(2025, 10, 1)); // Nov 2025 (School start)

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newOpeningDate, setNewOpeningDate] = useState<string>('2025-11-01');
  const [rescheduleTargetClass, setRescheduleTargetClass] = useState<string>('');
  const [forceResetAll, setForceResetAll] = useState<boolean>(true);

  // Modals & Panels
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genSummary, setGenSummary] = useState<GenerationResult | null>(null);

  const loadData = async () => {
    const [sch, c, t, s, lp, att] = await Promise.all([
      storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
      storageService.getClasses(),
      storageService.getTeachers(),
      storageService.getSubjects(),
      storageService.getLessonPlans(),
      storageService.getAttendance()
    ]);
    setScheduledLessons(sch);
    setClasses(c);
    setTeachers(t);
    setSubjects(s);
    setLessonPlans(lp);
    setAttendance(att);
  };

  useEffect(() => {
    loadData();
    if (activeAcademicYear?.startDate) {
      setNewOpeningDate(activeAcademicYear.startDate);
    }
  }, [activeAcademicYear]);

  const switchViewMode = (mode: 'table' | 'calendar') => {
    setViewMode(mode);
    localStorage.setItem('msts_curriculum_view', mode);
  };

  // Run Scheduling Engine
  const handleGenerateSchedule = async () => {
    if (!activeAcademicYear) {
      addToast('error', 'សូមជ្រើសរើសឆ្នាំសិក្សាជាមុនសិន!');
      return;
    }

    setGenerating(true);
    try {
      const result = await schedulerEngine.generateAnnualSchedule(
        activeAcademicYear.academicYearId,
        filterClass || undefined,
        filterSubject || undefined
      );
      setGenSummary(result);
      await loadData();
      addToast(
        'success',
        'ដំណើរការបង្កើតកាលវិភាគជោគជ័យ!',
        `បានបង្កើត ${result.newCount} ម៉ោងបង្រៀន (រក្សាទុក ${result.preservedCount} ម៉ោងចាស់)`
      );
    } catch (err: any) {
      addToast('error', 'បញ្ហាពេលបង្កើតកាលវិភាគ', err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Reschedule & Re-calculate based on new School Opening Date
  const handleExecuteReschedule = async () => {
    if (!activeAcademicYear) {
      addToast('error', 'សូមជ្រើសរើសឆ្នាំសិក្សាជាមុនសិន!');
      return;
    }

    if (!newOpeningDate) {
      addToast('error', 'សូមជ្រើសរើសកាលបរិច្ឆេទបើកបវេសនកាល!');
      return;
    }

    setGenerating(true);
    try {
      const result = await schedulerEngine.generateAnnualSchedule(
        activeAcademicYear.academicYearId,
        rescheduleTargetClass || undefined,
        'SUB-MATH-8',
        newOpeningDate,
        forceResetAll
      );
      setGenSummary(result);
      setRescheduleModalOpen(false);
      await loadData();
      addToast(
        'success',
        'បានរៀបចំកាលវិភាគបង្រៀនជាថ្មីជោគជ័យ!',
        `បានបង្កើតឡើងវិញចំនួន ${result.totalGenerated} ម៉ោងបង្រៀន ចាប់ពីថ្ងៃបើកបវេសនកាល ${newOpeningDate}`
      );
    } catch (err: any) {
      addToast('error', 'បញ្ហាពេលរៀបចំកាលវិភាគជាថ្មី', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateLessonStatus = async (status: TeachingStatus) => {
    if (!selectedLesson) return;
    const updated: ScheduledLesson = {
      ...selectedLesson,
      teachingStatus: status,
      actualTaughtDate: status === 'COMPLETED' ? new Date().toISOString().split('T')[0] : undefined
    };
    await storageService.saveScheduledLesson(updated);
    setSelectedLesson(updated);
    await loadData();
    addToast('success', 'បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពបង្រៀន', status);
  };

  const handleExportExcel = () => {
    const exportData = filteredLessons.map((l, idx) => ({
      'ល.រ': idx + 1,
      'កាលបរិច្ឆេទ (Date)': l.date,
      'ថ្ងៃ (Day)': ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'][l.dayOfWeek] || '',
      'ម៉ោងទី (Period)': l.periodNumber,
      'ពេលវេលា (Time)': `${l.startTime} - ${l.endTime}`,
      'ថ្នាក់រៀន (Class)': classes.find(c => c.classId === l.classId)?.className || l.classId,
      'គ្រូបង្រៀន (Teacher)': teachers.find(t => t.teacherId === l.teacherId)?.fullName || l.teacherId,
      'មុខវិជ្ជា (Subject)': subjects.find(s => s.subjectId === l.subjectId)?.subjectName || l.subjectId,
      'ជំពូក (Chapter)': l.chapterTitle || '',
      'មេរៀន (Lesson)': l.lessonTitle || '',
      'ប្រធានបទ (Topic)': l.topic || '',
      'ស្ថានភាពបង្រៀន (Status)': l.teachingStatus
    }));
    excelService.exportToExcel(exportData, `កម្មវិធីបង្រៀនតាមថ្នាក់_${activeAcademicYear?.yearName}`, 'ClassCurriculum');
    addToast('success', 'បានទាញយក Excel កម្មវិធីបង្រៀនជោគជ័យ');
  };

  // Filtered Lessons
  const filteredLessons = scheduledLessons.filter(l => {
    if (filterClass && l.classId !== filterClass) return false;
    if (filterSubject && l.subjectId !== filterSubject) return false;
    if (filterTeacher && l.teacherId !== filterTeacher) return false;
    if (filterStatus && l.teachingStatus !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTopic = (l.topic || '').toLowerCase().includes(q);
      const matchLesson = (l.lessonTitle || '').toLowerCase().includes(q);
      const matchDate = l.date.includes(q);
      if (!matchTopic && !matchLesson && !matchDate) return false;
    }
    return true;
  });

  const statusBadges: Record<TeachingStatus, { label: string; color: string }> = {
    PLANNED: { label: 'គ្រោងទុក', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    PREPARED: { label: 'បានរៀបចំ', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
    COMPLETED: { label: 'បានបង្រៀនចប់', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    MISSED: { label: 'អវត្តមាន/ខកខាន', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
    RESCHEDULED: { label: 'បានប្តូរម៉ោង', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    EXAM: { label: 'ប្រឡង', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
    HOLIDAY: { label: 'ឈប់សម្រាក', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
  };

  // Calendar days generation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const currentYear = calendarMonth.getFullYear();
  const currentMonthIdx = calendarMonth.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonthIdx);
  const firstDayOfWeek = new Date(currentYear, currentMonthIdx, 1).getDay();

  const prevMonth = () => {
    setCalendarMonth(new Date(currentYear, currentMonthIdx - 1, 1));
  };
  const nextMonth = () => {
    setCalendarMonth(new Date(currentYear, currentMonthIdx + 1, 1));
  };

  const monthNamesKm = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <BookCopy className="w-5 h-5 mr-2 text-primary-600" />
            កម្មវិធីសិក្សាតាមថ្នាក់ (Class Curriculum Engine)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            តារាងកាលវិភាគបង្រៀនជាក់ស្តែងដែលបង្កើតចេញពីកាលវិភាគគ្រូ និងកម្មវិធីសិក្សាប្រចាំឆ្នាំ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          {/* Switch View Toggle */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => switchViewMode('table')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 mr-1.5" />
              តារាង (Table)
            </button>
            <button
              onClick={() => switchViewMode('calendar')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
              ប្រតិទិន (Calendar)
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Excel
          </button>

          {/* Reschedule Button */}
          <button
            onClick={() => setRescheduleModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            រៀបចំជាថ្មី (បើកបវេសនកាល)
          </button>

          {/* Engine Generate Button */}
          <button
            onClick={handleGenerateSchedule}
            disabled={generating}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {generating ? 'កំពុងគណនា...' : 'គណនាកាលវិភាគ'}
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between no-print">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកតាមប្រធានបទ ឬកាលបរិច្ឆេទ..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none font-semibold cursor-pointer"
          >
            <option value="">-- គ្រប់ថ្នាក់រៀន --</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>

          {/* Math Solo Indicator Badge */}
          <div className="flex items-center px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 font-bold">
            គណិតវិទ្យា ថ្នាក់ទី៨ (កែវ សំណាង)
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">-- គ្រប់ស្ថានភាព --</option>
            <option value="PLANNED">គ្រោងទុក (Planned)</option>
            <option value="COMPLETED">បានបង្រៀនចប់ (Completed)</option>
            <option value="MISSED">ខកខាន (Missed)</option>
            <option value="RESCHEDULED">បានប្តូរម៉ោង (Rescheduled)</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              បញ្ជីម៉ោងបង្រៀនជាក់ស្តែង (ចំនួនសរុប៖ {filteredLessons.length} ម៉ោង)
            </span>
            {filteredLessons.length === 0 && (
              <span className="text-amber-600 font-semibold">
                សូមចុចប៊ូតុង "បង្កើតកាលវិភាគស្វ័យប្រវត្តិ" ដើម្បីបំពេញទិន្នន័យ
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-bold">កាលបរិច្ឆេទ</th>
                  <th className="p-3 font-bold">ម៉ោងទី</th>
                  <th className="p-3 font-bold">ថ្នាក់</th>
                  <th className="p-3 font-bold">គ្រូបង្រៀន</th>
                  <th className="p-3 font-bold">មុខវិជ្ជា</th>
                  <th className="p-3 font-bold">មេរៀន / ខ្លឹមសារបង្រៀន</th>
                  <th className="p-3 font-bold text-center">ស្ថានភាពបង្រៀន</th>
                  <th className="p-3 font-bold text-center">កិច្ចតែងការ</th>
                  <th className="p-3 font-bold text-center">វត្តមាន</th>
                  <th className="p-3 font-bold text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLessons.slice(0, 50).map((lesson) => {
                  const cls = classes.find(c => c.classId === lesson.classId);
                  const tch = teachers.find(t => t.teacherId === lesson.teacherId);
                  const subj = subjects.find(s => s.subjectId === lesson.subjectId);
                  const plan = lessonPlans.find(p => p.scheduledLessonId === lesson.scheduledLessonId);
                  const attRecords = attendance.filter(a => a.scheduledLessonId === lesson.scheduledLessonId);
                  const badge = statusBadges[lesson.teachingStatus] || statusBadges.PLANNED;

                  return (
                    <tr
                      key={lesson.scheduledLessonId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      <td className="p-3 font-mono font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {lesson.date}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-primary-600 block">ម៉ោង {lesson.periodNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{lesson.startTime}-{lesson.endTime}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                        {cls?.className}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {tch?.fullName}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: subj?.color || '#3b82f6' }}
                        >
                          {subj?.subjectName}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-semibold">
                          {lesson.lessonTitle || 'មេរៀនតាមកាលវិភាគ'}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {lesson.topic}
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          plan && plan.status !== 'NOT_PREPARED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}>
                          {plan && plan.status !== 'NOT_PREPARED' ? 'មានកិច្ចតែងការ' : 'មិនទាន់មាន'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          attRecords.length > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {attRecords.length > 0 ? `ស្រង់រួច (${attRecords.length})` : 'មិនទាន់ស្រង់'}
                        </span>
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLesson(lesson)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="មើលព័ត៌មានលម្អិត"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredLessons.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 text-xs">
                      <p>មិនទាន់មានទិន្នន័យម៉ោងបង្រៀនដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ!</p>
                      <button
                        onClick={handleGenerateSchedule}
                        className="mt-3 px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md shadow-primary-500/20"
                      >
                        ចុចទីនេះដើម្បីបង្កើតកាលវិភាគបង្រៀនស្វ័យប្រវត្តិ
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredLessons.length > 50 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
              កំពុងបង្ហាញ ៥០ ជួរដំបូង ក្នុងចំណោម {filteredLessons.length} ម៉ោងបង្រៀនសរុប
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: VISUAL ACADEMIC CALENDAR */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 lg:p-6 space-y-4">
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-5 h-5 text-primary-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ខែ {monthNamesKm[currentMonthIdx]} ឆ្នាំ {currentYear}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-2">
            {['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'].map((day, idx) => (
              <div key={idx} className="text-center font-bold text-xs py-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                {day}
              </div>
            ))}

            {/* Empty offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-28 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-transparent" />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, dIdx) => {
              const dayNum = dIdx + 1;
              const dateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayLessons = filteredLessons.filter(l => l.date === dateStr);
              const isSunday = new Date(currentYear, currentMonthIdx, dayNum).getDay() === 0;

              return (
                <div
                  key={dayNum}
                  className={`h-28 p-1.5 rounded-xl border flex flex-col justify-between transition-colors overflow-hidden ${
                    isSunday
                      ? 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${isSunday ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {dayNum}
                    </span>
                    {dayLessons.length > 0 && (
                      <span className="text-[10px] font-bold px-1 rounded bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                        {dayLessons.length} ម៉ោង
                      </span>
                    )}
                  </div>

                  {/* Lessons Badges inside day */}
                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {dayLessons.map(l => (
                      <button
                        key={l.scheduledLessonId}
                        onClick={() => setSelectedLesson(l)}
                        className="w-full text-left p-1 rounded-md bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-[10px] hover:bg-primary-100 transition-colors block truncate"
                      >
                        <span className="font-bold text-primary-700 dark:text-primary-300 mr-1">P{l.periodNumber}</span>
                        <span className="text-slate-700 dark:text-slate-200 truncate">{l.topic}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lesson Detail Modal */}
      <Modal
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        title={selectedLesson?.topic || 'ព័ត៌មានលម្អិតម៉ោងបង្រៀន'}
        subtitle={`កាលបរិច្ឆេទ៖ ${selectedLesson?.date} • ម៉ោងទី ${selectedLesson?.periodNumber} (${selectedLesson?.startTime} - ${selectedLesson?.endTime})`}
        maxWidth="2xl"
      >
        {selectedLesson && (
          <div className="space-y-4 text-xs">
            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div>
                <span className="text-slate-400">ថ្នាក់រៀន៖</span>
                <span className="font-bold text-slate-800 dark:text-white ml-2">
                  {classes.find(c => c.classId === selectedLesson.classId)?.className}
                </span>
              </div>
              <div>
                <span className="text-slate-400">គ្រូបង្រៀន៖</span>
                <span className="font-bold text-slate-800 dark:text-white ml-2">
                  {teachers.find(t => t.teacherId === selectedLesson.teacherId)?.fullName}
                </span>
              </div>
              <div>
                <span className="text-slate-400">មុខវិជ្ជា៖</span>
                <span className="font-bold text-slate-800 dark:text-white ml-2">
                  {subjects.find(s => s.subjectId === selectedLesson.subjectId)?.subjectName}
                </span>
              </div>
              <div>
                <span className="text-slate-400">ជំពូក៖</span>
                <span className="font-bold text-slate-800 dark:text-white ml-2">
                  {selectedLesson.chapterTitle || '-'}
                </span>
              </div>
            </div>

            {/* Quick Status Updater */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                ធ្វើបច្ចុប្បន្នភាពស្ថានភាពបង្រៀនជាក់ស្តែង (Update Teaching Status)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { status: 'COMPLETED' as const, label: '✓ បានបង្រៀនចប់ (Completed)', color: 'bg-emerald-600 text-white' },
                  { status: 'MISSED' as const, label: '✗ ខកខានបង្រៀន (Missed)', color: 'bg-rose-600 text-white' },
                  { status: 'PLANNED' as const, label: '● គ្រោងទុក (Planned)', color: 'bg-blue-600 text-white' },
                ].map(b => (
                  <button
                    key={b.status}
                    type="button"
                    onClick={() => handleUpdateLessonStatus(b.status)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs shadow-xs transition-all ${
                      selectedLesson.teachingStatus === b.status
                        ? `${b.color} ring-2 ring-offset-2 ring-primary-500`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLesson(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                បិទ
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="រៀបចំកាលវិភាគបង្រៀនជាថ្មី (កំណត់ថ្ងៃបើកបវេសនកាល)"
        subtitle="ដកស្រង់ទិន្នន័យពីបំណែងចែកកម្មវិធីសិក្សាលម្អិតគណិតថ្នាក់ទី៨ ២០២៥-២០២៦ ទាំងស្រុង"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Info Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 leading-relaxed">
            <p className="font-bold flex items-center mb-1">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              ប្រព័ន្ធរៀបចំកាលបរិច្ឆេទស្វ័យប្រវត្តិតាមការកែប្រែថ្ងៃបើកបវេសនកាល
            </p>
            <p className="text-[11px] opacity-90">
              នៅពេលលោកគ្រូកែប្រែកាលបរិច្ឆេទបើកបវេសនកាល ប្រព័ន្ធនឹងដកស្រង់ទិន្នន័យពី <strong>បំណែងចែកកម្មវិធីសិក្សាលម្អិតគណិតថ្នាក់ទី៨ ២០២៥-២០២៦ ទាំងស្រុង</strong> (៣៨ សប្តាហ៍ / ១១០ ម៉ោងបង្រៀន / ១៨ ជំពូក) ហើយរៀបចំកាលបរិច្ឆេទបង្រៀនឡើងវិញជាស្វ័យប្រវត្តិតាមកាលវិភាគប្រចាំសប្តាហ៍ ដោយរំលងថ្ងៃឈប់សម្រាកបុណ្យជាតិ និងការប្រឡងឆមាស។
            </p>
          </div>

          {/* New Academic Opening Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              កាលបរិច្ឆេទបើកបវេសនកាលថ្មី (New Academic Opening Date) *
            </label>
            <input
              type="date"
              value={newOpeningDate}
              onChange={(e) => setNewOpeningDate(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Target Class Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ថ្នាក់រៀនគោលដៅ (Target Classes)
            </label>
            <select
              value={rescheduleTargetClass}
              onChange={(e) => setRescheduleTargetClass(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- រៀបចំគ្រប់ថ្នាក់ទាំងអស់ (៨ក, ៨ខ, ៨គ, ៨ឃ) --</option>
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>
                  ថ្នាក់ {c.className}
                </option>
              ))}
            </select>
          </div>

          {/* Full Reset Option */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="forceResetCheckbox"
              checked={forceResetAll}
              onChange={(e) => setForceResetAll(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="forceResetCheckbox" className="text-xs text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              <span className="font-bold">រៀបចំឡើងវិញទាំងអស់ពីដើមឆ្នាំ (Full Reset & Reschedule)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ដកស្រង់ទិន្នន័យមេរៀនឡើងវិញទាំងស្រុង និងប្តូរកាលបរិច្ឆេទចាប់ពីថ្ងៃបើកបវេសនកាលថ្មី
              </p>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setRescheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="button"
              disabled={generating}
              onClick={handleExecuteReschedule}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {generating ? 'កំពុងរៀបចំ...' : 'ចាប់ផ្តើមរៀបចំជាថ្មី (Regenerate Now)'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

