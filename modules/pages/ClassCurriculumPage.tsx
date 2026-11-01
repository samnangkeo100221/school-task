import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  UserCheck,
  BookCopy
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { schedulerEngine } from '../services/schedulerEngine';
import { excelService } from '../services/excelService';
import { ScheduledLesson, ClassRoom, Subject, Teacher } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { NavLink } from 'react-router-dom';

export const ClassCurriculumPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('msts_curriculum_view') as 'table' | 'calendar') || 'table';
    }
    return 'table';
  });

  const [loading, setLoading] = useState(true);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Modal / Detail Panel
  const [selectedLesson, setSelectedLesson] = useState<ScheduledLesson | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Pagination for table view
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const loadData = async () => {
    setLoading(true);
    try {
      const [lessons, cls, subs, tchs] = await Promise.all([
        storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
        storageService.getClasses(),
        storageService.getSubjects(),
        storageService.getTeachers()
      ]);
      setScheduledLessons(lessons);
      setClasses(cls);
      setSubjects(subs);
      setTeachers(tchs);
    } catch (err) {
      console.error('Failed to load class curriculum schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  const handleToggleView = (mode: 'table' | 'calendar') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('msts_curriculum_view', mode);
    }
  };

  const handleRegenerate = async () => {
    if (!activeAcademicYear) return;
    setGenerating(true);
    try {
      const result = await schedulerEngine.generateSchedule(activeAcademicYear.academicYearId, {
        preserveCompleted: true
      });
      await loadData();
      addToast('success', 'បានបង្កើតកាលវិភាគបង្រៀនដោយជោគជ័យ', `បង្កើតបាន ${result.totalGenerated} ម៉ោង (រក្សាម៉ោងបានបង្រៀន ${result.totalPreserved})`);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការបង្កើតកាលវិភាគ', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (lesson: ScheduledLesson, newStatus: ScheduledLesson['status']) => {
    const updated = {
      ...lesson,
      status: newStatus,
      completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
    };
    await storageService.updateScheduledLesson(updated);
    setScheduledLessons(prev => prev.map(l => l.scheduledLessonId === lesson.scheduledLessonId ? updated : l));
    if (selectedLesson && selectedLesson.scheduledLessonId === lesson.scheduledLessonId) {
      setSelectedLesson(updated);
    }
    addToast('success', 'បានកែប្រែស្ថានភាពបង្រៀន', `ស្ថានភាពថ្មី៖ ${newStatus}`);
  };

  // Filter lessons
  const filteredLessons = scheduledLessons.filter(lesson => {
    if (selectedClassId !== 'all' && lesson.classId !== selectedClassId) return false;
    if (selectedStatus !== 'all' && lesson.status !== selectedStatus) return false;
    if (selectedMonth !== 'all' && !lesson.date.startsWith(selectedMonth)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        lesson.lessonTitle.toLowerCase().includes(q) ||
        lesson.chapterTitle.toLowerCase().includes(q) ||
        lesson.topicTitle.toLowerCase().includes(q) ||
        lesson.date.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLessons.length / pageSize) || 1;
  const paginatedLessons = filteredLessons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportExcel = () => {
    const exportData = filteredLessons.map((l, i) => ({
      'ល.រ': i + 1,
      'កាលបរិច្ឆេទ': l.date,
      'ថ្ងៃ': getKhmerDayName(l.dayOfWeek),
      'ម៉ោងទី': l.periodNumber,
      'ថ្នាក់': classes.find(c => c.classId === l.classId)?.className || l.classId,
      'មុខវិជ្ជា': subjects.find(s => s.subjectId === l.subjectId)?.subjectName || l.subjectId,
      'ជំពូក': l.chapterTitle,
      'មេរៀន': l.lessonTitle,
      'ខ្លឹមសារ': l.topicTitle,
      'ម៉ោងទីក្នុងមេរៀន': `${l.periodIndexForLesson}/${l.totalPeriodsForLesson}`,
      'ស្ថានភាព': l.status === 'completed' ? 'បានបង្រៀន' : l.status === 'prepared' ? 'បានរៀបចំ' : l.status === 'missed' ? 'ខកខាន' : 'គ្រោង',
      'វត្តមាន': l.attendanceRecorded ? 'បានកត់' : 'មិនទាន់'
    }));
    excelService.exportToExcel(exportData, `កម្មវិធីបង្រៀនតាមថ្នាក់_${activeAcademicYear?.yearName || ''}`, 'កាលវិភាគបង្រៀន');
  };

  const getKhmerDayName = (day: number) => {
    switch (day) {
      case 1: return 'ចន្ទ';
      case 2: return 'អង្គារ';
      case 3: return 'ពុធ';
      case 4: return 'ព្រហស្បតិ៍';
      case 5: return 'សុក្រ';
      case 6: return 'សៅរ៍';
      default: return 'អាទិត្យ';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookCopy className="w-5 h-5 text-blue-600" />
            <span>កម្មវិធីបង្រៀនតាមថ្នាក់ (Class Curriculum Schedule)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            កាលវិភាគបង្រៀនជាក់ស្តែងដែលបានបង្កើតស្វ័យប្រវត្តិពីកាលវិភាគគ្រូ និងកម្មវិធីសិក្សា
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleToggleView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>តារាង</span>
            </button>
            <button
              onClick={() => handleToggleView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>ប្រតិទិន</span>
            </button>
          </div>

          <button
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={generating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'កំពុងបង្កើត...' : 'បង្កើតកាលវិភាគស្វ័យប្រវត្តិ'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមចំណងជើងមេរៀន ជំពូក កាលបរិច្ឆេទ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden font-medium"
          >
            <option value="all">គ្រប់ថ្នាក់រៀន</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden font-medium"
          >
            <option value="all">គ្រប់ស្ថានភាពបង្រៀន</option>
            <option value="planned">គ្រោងបង្រៀន (Planned)</option>
            <option value="prepared">បានរៀបចំ (Prepared)</option>
            <option value="completed">បានបង្រៀនរួច (Completed)</option>
            <option value="missed">ខកខាន (Missed)</option>
            <option value="rescheduled">បង្រៀនសង (Rescheduled)</option>
          </select>
        </div>

        {/* Export and Print Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>ទាញយក Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>បោះពុម្ព</span>
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3">កាលបរិច្ឆេទ</th>
                  <th className="px-3 py-3">ថ្ងៃ/ម៉ោង</th>
                  <th className="px-3 py-3">ថ្នាក់</th>
                  <th className="px-3 py-3">ជំពូក & មេរៀន</th>
                  <th className="px-3 py-3">ខ្លឹមសារបង្រៀន (ប្រធានបទ)</th>
                  <th className="px-3 py-3 text-center">ម៉ោងបង្រៀន</th>
                  <th className="px-3 py-3 text-center">ស្ថានភាព</th>
                  <th className="px-3 py-3 text-center">វត្តមាន</th>
                  <th className="px-3 py-3 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedLessons.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      មិនមានទិន្នន័យម៉ោងបង្រៀនទេ។ សូមចុច &quot;បង្កើតកាលវិភាគស្វ័យប្រវត្តិ&quot; ដើម្បីបង្កើត។
                    </td>
                  </tr>
                ) : (
                  paginatedLessons.map((lesson) => {
                    const cls = classes.find(c => c.classId === lesson.classId);
                    return (
                      <tr
                        key={lesson.scheduledLessonId}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {lesson.date}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="font-bold text-blue-600">
                            {getKhmerDayName(lesson.dayOfWeek)}
                          </span>
                          <span className="text-slate-400 ml-1.5">
                            (P{lesson.periodNumber} - {lesson.startTime})
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                          {cls?.className || lesson.classId}
                        </td>
                        <td className="px-3 py-3 max-w-[200px]">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{lesson.lessonTitle}</p>
                          <p className="text-[11px] text-slate-400 truncate">{lesson.chapterTitle}</p>
                        </td>
                        <td className="px-3 py-3 max-w-[220px]">
                          <p className="text-slate-600 dark:text-slate-300 truncate font-medium">{lesson.topicTitle}</p>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap font-semibold">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {lesson.periodIndexForLesson}/{lesson.totalPeriodsForLesson}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <select
                            value={lesson.status}
                            onChange={(e) => handleStatusChange(lesson, e.target.value as any)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border-0 focus:ring-1 cursor-pointer ${
                              lesson.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : lesson.status === 'prepared'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : lesson.status === 'missed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <option value="planned">គ្រោងបង្រៀន</option>
                            <option value="prepared">បានរៀបចំ</option>
                            <option value="completed">បានបង្រៀន</option>
                            <option value="missed">ខកខាន</option>
                            <option value="rescheduled">បង្រៀនសង</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {lesson.attendanceRecorded ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>បានកត់</span>
                            </span>
                          ) : (
                            <NavLink
                              to="/attendance"
                              className="text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              កត់វត្តមាន
                            </NavLink>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedLesson(lesson);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600"
                            title="មើលព័ត៌មានលម្អិត"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span>
              បង្ហាញ {paginatedLessons.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} ដល់{' '}
              {Math.min(currentPage * pageSize, filteredLessons.length)} នៃ {filteredLessons.length} ម៉ោងបង្រៀន
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              ទិដ្ឋភាពប្រតិទិនបង្រៀន (Calendar Grid)
            </h3>
            <span className="text-xs text-slate-500">
              ចុចលើម៉ោងបង្រៀនណាមួយដើម្បីពិនិត្យ ឬកែប្រែស្ថានភាព
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredLessons.slice(0, 36).map((lesson) => {
              const cls = classes.find(c => c.classId === lesson.classId);
              return (
                <div
                  key={lesson.scheduledLessonId}
                  onClick={() => {
                    setSelectedLesson(lesson);
                    setShowDetailModal(true);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-all ${
                    lesson.status === 'completed'
                      ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                      : lesson.status === 'prepared'
                      ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                      : lesson.status === 'missed'
                      ? 'bg-red-50/50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                      : 'bg-slate-50/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {lesson.date} ({getKhmerDayName(lesson.dayOfWeek)})
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      P{lesson.periodNumber} ({lesson.startTime})
                    </span>
                  </div>

                  <p className="font-bold text-xs text-blue-700 dark:text-blue-300 mt-2 truncate">
                    ថ្នាក់ {cls?.className || lesson.classId} - {lesson.room}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5 truncate">
                    {lesson.lessonTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {lesson.topicTitle} ({lesson.periodIndexForLesson}/{lesson.totalPeriodsForLesson})
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${
                      lesson.status === 'completed' ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {lesson.status === 'completed' ? '✓ បានបង្រៀន' : '○ គ្រោងទុក'}
                    </span>
                    {lesson.attendanceRecorded && (
                      <span className="text-emerald-600 font-semibold">វត្តមានរួច</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lesson Detail Modal */}
      {selectedLesson && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`ព័ត៌មានលម្អិតម៉ោងបង្រៀន (${selectedLesson.date})`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div>
                <span className="text-slate-400">កាលបរិច្ឆេទ & ម៉ោង៖</span>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">
                  {selectedLesson.date} (ថ្ងៃ{getKhmerDayName(selectedLesson.dayOfWeek)}) - ម៉ោងទី {selectedLesson.periodNumber} ({selectedLesson.startTime} - {selectedLesson.endTime})
                </p>
              </div>
              <div>
                <span className="text-slate-400">ថ្នាក់ & បន្ទប់៖</span>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">
                  {classes.find(c => c.classId === selectedLesson.classId)?.className} ({selectedLesson.room})
                </p>
              </div>
              <div>
                <span className="text-slate-400">គ្រូបង្រៀន៖</span>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">
                  លោកគ្រូ កែវ សំណាង (T-001)
                </p>
              </div>
              <div>
                <span className="text-slate-400">មុខវិជ្ជា៖</span>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">
                  គណិតវិទ្យា ថ្នាក់ទី ៨
                </p>
              </div>
            </div>

            <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <div>
                <span className="text-slate-400">ជំពូក និងមេរៀន៖</span>
                <p className="font-bold text-sm text-slate-800 dark:text-white mt-0.5">
                  {selectedLesson.chapterTitle}
                </p>
                <p className="font-semibold text-blue-600 mt-0.5">
                  {selectedLesson.lessonTitle}
                </p>
              </div>
              <div>
                <span className="text-slate-400">ខ្លឹមសារលម្អិត/ប្រធានបទ៖</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {selectedLesson.topicTitle} (ម៉ោងទី {selectedLesson.periodIndexForLesson} នៃ {selectedLesson.totalPeriodsForLesson} ម៉ោងសរុបនៃមេរៀន)
                </p>
              </div>
            </div>

            {/* Quick Status Buttons */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">កែប្រែស្ថានភាពបង្រៀន៖</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusChange(selectedLesson, 'completed')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                    selectedLesson.status === 'completed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>បានបង្រៀន</span>
                </button>
                <button
                  onClick={() => handleStatusChange(selectedLesson, 'prepared')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                    selectedLesson.status === 'prepared'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>បានរៀបចំ</span>
                </button>
                <button
                  onClick={() => handleStatusChange(selectedLesson, 'missed')}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                    selectedLesson.status === 'missed'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ខកខាន</span>
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <NavLink
                to="/lesson-plans"
                className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl flex items-center gap-1.5 hover:bg-blue-100"
              >
                <FileText className="w-4 h-4" />
                <span>បើកកិច្ចតែងការ</span>
              </NavLink>
              <NavLink
                to="/attendance"
                className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl flex items-center gap-1.5 hover:bg-emerald-100"
              >
                <UserCheck className="w-4 h-4" />
                <span>កត់ត្រាវត្តមាន</span>
              </NavLink>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Regenerating Schedule */}
      <ConfirmDialog
        isOpen={showRegenerateConfirm}
        onClose={() => setShowRegenerateConfirm(false)}
        onConfirm={handleRegenerate}
        title="បញ្ជាក់ការបង្កើតកាលវិភាគបង្រៀនស្វ័យប្រវត្តិ"
        message="ម៉ាស៊ីនរៀបចំកាលវិភាគស្វ័យប្រវត្តិនឹងគណនាបែងចែកមេរៀនទាំងអស់ទៅតាមកាលវិភាគគ្រូបង្រៀន ដោយស្វ័យប្រវត្តិមិនរាប់បញ្ចូលថ្ងៃបុណ្យជាតិ និងថ្ងៃឈប់សម្រាក។ រាល់ម៉ោងដែលបានបង្រៀនរួច និងវត្តមានសិស្សដែលបានកត់នឹងត្រូវបានការពារ ១០០%។"
        confirmLabel="យល់ព្រមបង្កើត"
        cancelLabel="បោះបង់"
      />
    </div>
  );
};
