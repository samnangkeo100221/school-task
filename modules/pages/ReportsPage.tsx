import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  UserCheck,
  BookOpen,
  School,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { excelService } from '../services/excelService';
import {
  ScheduledLesson,
  CurriculumItem,
  AttendanceRecord,
  ClassRoom,
  Teacher,
  Student
} from '../types';

export const ReportsPage: React.FC = () => {
  const { activeAcademicYear } = useApp();
  const [activeTab, setActiveTab] = useState<'curriculum' | 'teacher' | 'attendance'>('curriculum');
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [lessons, cur, att, cls, tchs, stds] = await Promise.all([
        storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
        storageService.getCurriculum(activeAcademicYear?.academicYearId),
        storageService.getAttendance(activeAcademicYear?.academicYearId),
        storageService.getClasses(),
        storageService.getTeachers(),
        storageService.getStudents()
      ]);
      setScheduledLessons(lessons);
      setCurriculum(cur);
      setAttendance(att);
      setClasses(cls);
      setTeachers(tchs);
      setStudents(stds);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  // Overall calculations
  const totalCurriculumHours = curriculum.reduce((s, c) => s + c.requiredPeriods, 0);
  const completedCurriculumHours = curriculum.reduce((s, c) => s + c.completedPeriods, 0);

  const completedSessions = scheduledLessons.filter(l => l.status === 'completed').length;
  const missedSessions = scheduledLessons.filter(l => l.status === 'missed').length;
  const rescheduledSessions = scheduledLessons.filter(l => l.status === 'rescheduled').length;

  // Attendance stats
  const totalAttendanceRecords = attendance.length;
  const presentRecords = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((presentRecords / totalAttendanceRecords) * 100)
    : 100;

  const handleExportReport = () => {
    if (activeTab === 'curriculum') {
      const data = curriculum.map((c, i) => ({
        'ល.រ': i + 1,
        'ជំពូក': c.chapterTitle,
        'មេរៀន': c.lessonTitle,
        'ខ្លឹមសារ': c.topicTitle,
        'ម៉ោងតម្រូវ': c.requiredPeriods,
        'ម៉ោងបានបង្រៀន': c.completedPeriods,
        'ភាគរយសម្រេច': `${Math.round(((c.completedPeriods || 0) / c.requiredPeriods) * 100)}%`,
        'ស្ថានភាព': c.status === 'completed' ? 'បានបញ្ចប់' : c.status === 'in_progress' ? 'កំពុងបង្រៀន' : 'គ្រោង'
      }));
      excelService.exportToExcel(data, `របាយការណ៍កម្មវិធីសិក្សា_${activeAcademicYear?.yearName || ''}`, 'កម្មវិធីសិក្សា');
    } else if (activeTab === 'teacher') {
      const data = teachers.map((t, i) => {
        const tLessons = scheduledLessons.filter(l => l.teacherId === t.teacherId);
        return {
          'ល.រ': i + 1,
          'អត្តលេខ': t.teacherCode,
          'ឈ្មោះគ្រូ': t.fullName,
          'ម៉ោងបង្រៀនសរុប': tLessons.length,
          'បានបង្រៀនចប់': tLessons.filter(l => l.status === 'completed').length,
          'ខកខាន': tLessons.filter(l => l.status === 'missed').length,
          'បង្រៀនសង': tLessons.filter(l => l.status === 'rescheduled').length,
          'កិច្ចតែងការបានរៀបចំ': tLessons.filter(l => l.status !== 'planned').length
        };
      });
      excelService.exportToExcel(data, `របាយការណ៍បន្ទុកបង្រៀនគ្រូ_${activeAcademicYear?.yearName || ''}`, 'បន្ទុកគ្រូ');
    } else {
      const data = classes.map((cls, i) => {
        const clsAtt = attendance.filter(a => a.classId === cls.classId);
        const pCount = clsAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
        const rate = clsAtt.length > 0 ? Math.round((pCount / clsAtt.length) * 100) : 100;
        return {
          'ល.រ': i + 1,
          'ថ្នាក់': cls.className,
          'ចំនួនសិស្ស': students.filter(s => s.classId === cls.classId && s.status === 'active').length,
          'កំណត់ត្រាវត្តមានសរុប': clsAtt.length,
          'វត្តមាន': pCount,
          'អវត្តមានឥតច្បាប់': clsAtt.filter(a => a.status === 'ABSENT').length,
          'មានច្បាប់': clsAtt.filter(a => a.status === 'EXCUSED').length,
          'អត្រាវត្តមាន': `${rate}%`
        };
      });
      excelService.exportToExcel(data, `របាយការណ៍វត្តមានតាមថ្នាក់_${activeAcademicYear?.yearName || ''}`, 'វត្តមានថ្នាក់');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>របាយការណ៍ និងស្ថិតិសិក្សា (Reports & Analytics)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            វាយតម្លៃលទ្ធផលការងារបង្រៀន វឌ្ឍនភាពកម្មវិធីសិក្សា និងស្ថិតិវត្តមានសិស្ស
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>ទាញយក Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>បោះពុម្ពរបាយការណ៍</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'curriculum'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>របាយការណ៍កម្មវិធីសិក្សា</span>
        </button>
        <button
          onClick={() => setActiveTab('teacher')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'teacher'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>របាយការណ៍គ្រូបង្រៀន</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>របាយការណ៍វត្តមានសិស្ស</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-xs text-slate-500 block">កម្មវិធីសិក្សាសម្រេចបាន</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {totalCurriculumHours > 0 ? Math.round((completedCurriculumHours / totalCurriculumHours) * 100) : 0}%
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {completedCurriculumHours} / {totalCurriculumHours} ម៉ោងបង្រៀន
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-xs text-slate-500 block">ម៉ោងបង្រៀនបានបញ្ចប់</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {completedSessions}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ខកខាន៖ {missedSessions} | សង៖ {rescheduledSessions}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-xs text-slate-500 block">អត្រាវត្តមានសិស្សមធ្យម</span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">
            {attendanceRate}%
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {presentRecords} វត្តមាន / {totalAttendanceRecords} កំណត់ត្រា
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
          <span className="text-xs text-slate-500 block">សិស្សសរុបកំពុងសិក្សា</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {students.filter(s => s.status === 'active').length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ៤ ថ្នាក់រៀន (៨ក-៨ឃ)
          </span>
        </div>
      </div>

      {/* TAB 1: CURRICULUM REPORT */}
      {activeTab === 'curriculum' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            វឌ្ឍនភាពកម្មវិធីសិក្សាគណិតវិទ្យា ថ្នាក់ទី ៨ តាមជំពូក
          </h2>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2.5">ជំពូក</th>
                  <th className="px-3 py-2.5">ចំណងជើងមេរៀន</th>
                  <th className="px-3 py-2.5 text-center">ម៉ោងតម្រូវ</th>
                  <th className="px-3 py-2.5 text-center">បានបង្រៀន</th>
                  <th className="px-3 py-2.5">វឌ្ឍនភាព (%)</th>
                  <th className="px-3 py-2.5 text-center">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {curriculum.map((c) => {
                  const percent = Math.min(100, Math.round(((c.completedPeriods || 0) / c.requiredPeriods) * 100));
                  return (
                    <tr key={c.curriculumId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-200">{c.chapterTitle}</td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 font-semibold">{c.lessonTitle}</td>
                      <td className="px-3 py-2.5 text-center font-bold">{c.requiredPeriods}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-600">{c.completedPeriods || 0}</td>
                      <td className="px-3 py-2.5 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="font-bold text-[11px] w-8">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.status === 'completed' ? 'បញ្ចប់' : 'កំពុងរៀន'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER REPORT */}
      {activeTab === 'teacher' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            ស្ថិតិបន្ទុកបង្រៀន និងសកម្មភាពគ្រូបង្រៀន
          </h2>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2.5">អត្តលេខ</th>
                  <th className="px-3 py-2.5">ឈ្មោះគ្រូ</th>
                  <th className="px-3 py-2.5 text-center">ម៉ោងបង្រៀនសរុប</th>
                  <th className="px-3 py-2.5 text-center">បានបង្រៀនរួច</th>
                  <th className="px-3 py-2.5 text-center">ខកខាន</th>
                  <th className="px-3 py-2.5 text-center">បានបង្រៀនសង</th>
                  <th className="px-3 py-2.5 text-center">អត្រាបញ្ចប់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {teachers.map((t) => {
                  const tLessons = scheduledLessons.filter(l => l.teacherId === t.teacherId);
                  const completed = tLessons.filter(l => l.status === 'completed').length;
                  const rate = tLessons.length > 0 ? Math.round((completed / tLessons.length) * 100) : 0;

                  return (
                    <tr key={t.teacherId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-600">{t.teacherCode}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-white">{t.fullName}</td>
                      <td className="px-3 py-2.5 text-center font-bold">{tLessons.length} ម៉ោង</td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-600">{completed}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-red-600">
                        {tLessons.filter(l => l.status === 'missed').length}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-blue-600">
                        {tLessons.filter(l => l.status === 'rescheduled').length}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-600">
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE REPORT */}
      {activeTab === 'attendance' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            ស្ថិតិវត្តមានសិស្សតាមថ្នាក់រៀន (៨ក, ៨ខ, ៨គ, ៨ឃ)
          </h2>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2.5">ថ្នាក់រៀន</th>
                  <th className="px-3 py-2.5 text-center">សិស្សសរុប</th>
                  <th className="px-3 py-2.5 text-center">កំណត់ត្រាវត្តមាន</th>
                  <th className="px-3 py-2.5 text-center">មានវត្តមាន</th>
                  <th className="px-3 py-2.5 text-center">អវត្តមានឥតច្បាប់</th>
                  <th className="px-3 py-2.5 text-center">មានច្បាប់</th>
                  <th className="px-3 py-2.5 text-center">អត្រាវត្តមាន (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classes.map((cls) => {
                  const classStudents = students.filter(s => s.classId === cls.classId && s.status === 'active');
                  const classAtt = attendance.filter(a => a.classId === cls.classId);
                  const pCount = classAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
                  const abCount = classAtt.filter(a => a.status === 'ABSENT').length;
                  const exCount = classAtt.filter(a => a.status === 'EXCUSED').length;
                  const rate = classAtt.length > 0 ? Math.round((pCount / classAtt.length) * 100) : 100;

                  return (
                    <tr key={cls.classId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-white">{cls.className}</td>
                      <td className="px-3 py-2.5 text-center font-semibold">{classStudents.length} នាក់</td>
                      <td className="px-3 py-2.5 text-center">{classAtt.length}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-emerald-600">{pCount}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-red-600">{abCount}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-amber-600">{exCount}</td>
                      <td className="px-3 py-2.5 text-center font-black text-blue-600">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
