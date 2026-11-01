import { APP_VERSION } from '../version';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarCheck,
  FileCheck2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import {
  Teacher,
  Student,
  ClassRoom,
  Subject,
  ScheduledLesson,
  LessonPlan,
  AttendanceRecord,
  CurriculumItem
} from '../types';

export const DashboardPage: React.FC = () => {
  const { activeAcademicYear, schoolSettings } = useApp();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [t, s, c, sub, sch, lp, att, cur] = await Promise.all([
          storageService.getTeachers(),
          storageService.getStudents(),
          storageService.getClasses(),
          storageService.getSubjects(),
          storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
          storageService.getLessonPlans(),
          storageService.getAttendance(),
          storageService.getCurriculum(activeAcademicYear?.academicYearId),
        ]);
        setTeachers(t);
        setStudents(s);
        setClasses(c);
        setSubjects(sub);
        setScheduledLessons(sch);
        setLessonPlans(lp);
        setAttendance(att);
        setCurriculum(cur);
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [activeAcademicYear]);

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLessons = scheduledLessons.filter(s => s.date === todayStr);
  const completedLessons = scheduledLessons.filter(s => s.teachingStatus === 'COMPLETED');
  const pendingPlans = scheduledLessons.filter(s => {
    const plan = lessonPlans.find(p => p.scheduledLessonId === s.scheduledLessonId);
    return !plan || plan.status === 'NOT_PREPARED';
  });

  // Calculate attendance rate
  const totalAttRecords = attendance.length;
  const presentRecords = attendance.filter(a => a.status === 'PRESENT' || a.status === 'EXCUSED').length;
  const attendanceRate = totalAttRecords > 0 ? Math.round((presentRecords / totalAttRecords) * 100) : 98;

  // Workload Chart Data
  const teacherWorkloadData = teachers.map(t => ({
    name: t.fullName,
    hours: t.weeklyWorkloadHours || 18,
  }));

  // Curriculum Progress by Month
  const monthlyProgressData = [
    { month: 'វិច្ឆិកា', planned: 20, completed: 20 },
    { month: 'ធ្នូ', planned: 22, completed: 22 },
    { month: 'មករា', planned: 24, completed: 18 },
    { month: 'កុម្ភៈ', planned: 20, completed: 14 },
    { month: 'មីនា', planned: 22, completed: 10 },
    { month: 'មេសា', planned: 16, completed: 4 },
    { month: 'ឧសភា', planned: 22, completed: 0 },
    { month: 'មិថុនា', planned: 20, completed: 0 },
  ];

  // Attendance breakdown by status
  const attendancePieData = [
    { name: 'មានវត្តមាន (Present)', value: 85, color: '#10b981' },
    { name: 'មានច្បាប់ (Excused)', value: 8, color: '#3b82f6' },
    { name: 'មកយឺត (Late)', value: 4, color: '#f59e0b' },
    { name: 'អវត្តមាន (Absent)', value: 3, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & School Banner */}
      <div className="bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 rounded-3xl p-6 lg:p-8 text-white shadow-xl shadow-primary-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            ប្រព័ន្ធគ្រប់គ្រងការងារសិក្សា និងកិច្ចការគ្រូបង្រៀន
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            {schoolSettings?.schoolNameKm || 'វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង'}
          </h2>
          <p className="text-primary-100 text-sm mt-1 max-w-xl">
            កម្មវិធីសិក្សា និងកាលវិភាគបង្រៀនឆ្នាំសិក្សា {activeAcademicYear?.yearName || '២០២៥-២០២៦'} (ស្រុកឧដុង្គ ខេត្តកំពង់ស្ពឺ)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/class-curriculum"
            className="px-4 py-2.5 rounded-xl bg-white text-primary-700 hover:bg-primary-50 font-bold text-xs shadow-md transition-all flex items-center"
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            មើលប្រតិទិនបង្រៀន
          </Link>
          <Link
            to="/attendance"
            className="px-4 py-2.5 rounded-xl bg-primary-700/60 hover:bg-primary-700 text-white font-bold text-xs border border-white/20 transition-all flex items-center"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            ស្រង់វត្តមានសិស្ស
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Solo Teacher Profile */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">គ្រូបង្រៀនទទួលបន្ទុក</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base font-black text-slate-800 dark:text-white block truncate">លោកគ្រូ កែវ សំណាង</span>
            <span className="text-[11px] font-semibold text-emerald-600">គណិតវិទ្យា (២០ ម៉ោង/សប្តាហ៍)</span>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">សិស្សចុះឈ្មោះ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{students.length}</span>
            <span className="text-[11px] font-semibold text-primary-600">សិស្សថ្នាក់ទី ៨</span>
          </div>
        </div>

        {/* Total Classes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ថ្នាក់រៀនទទួលបន្ទុក</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{classes.length}</span>
            <span className="text-[11px] font-semibold text-slate-500">៨ក, ៨ខ, ៨គ, ៨ឃ</span>
          </div>
        </div>

        {/* Curriculum Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">កម្មវិធីសិក្សាគណិតទី៨</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{curriculum.length}</span>
            <span className="text-[11px] font-semibold text-amber-600">៣៨ សប្តាហ៍ / ១១០ ម៉ោង</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Progress Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                វឌ្ឍនភាពបង្រៀនប្រចាំខែ (Planned vs Completed)
              </h3>
              <p className="text-xs text-slate-400">ប្រៀបធៀបម៉ោងគ្រោងទុក និងម៉ោងបានបង្រៀនជាក់ស្តែង</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-primary-50 dark:bg-primary-950 text-primary-600 rounded-lg">
              គណិតវិទ្យា ថ្នាក់ទី ៨
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="plannedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="planned" name="ម៉ោងគ្រោង (Planned)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#plannedColor)" />
                <Area type="monotone" dataKey="completed" name="ម៉ោងបានបង្រៀន (Completed)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#completedColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Breakdown Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              អត្រាវត្តមានសិស្ស (Attendance Ratio)
            </h3>
            <p className="text-xs text-slate-400">ស្ថិតិវត្តមានទូទាំងសាលា</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {attendancePieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                <span className="font-bold text-slate-800 dark:text-white ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher Workload & Today's Schedule Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teacher Workload Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                បន្ទុកម៉ោងបង្រៀនគ្រូ (Hours/Week)
              </h3>
              <p className="text-xs text-slate-400">ចំនួនម៉ោងបង្រៀនក្នុងមួយសប្តាហ៍</p>
            </div>
            <Link to="/teachers" className="text-xs font-semibold text-primary-600 hover:underline">
              មើលទាំងអស់
            </Link>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teacherWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 24]} />
                <Tooltip />
                <Bar dataKey="hours" name="ម៉ោងបង្រៀន (Workload)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Tasks & Teaching Sessions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                កាលវិភាគបង្រៀនថ្ងៃនេះ (Today's Schedule)
              </h3>
              <p className="text-xs text-slate-400">
                {todayLessons.length > 0 ? `មាន ${todayLessons.length} ម៉ោងបង្រៀន` : 'កាលវិភាគបង្រៀនគំរូរបស់លោកគ្រូ កែវ សំណាង (ថ្នាក់ទី ៨)'}
              </p>
            </div>
            <Link to="/class-curriculum" className="text-xs font-semibold text-primary-600 hover:underline flex items-center">
              មើលកាលវិភាគពេញលេញ <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {/* Schedule list */}
          <div className="space-y-2.5">
            {[
              { period: 'ម៉ោងទី ១ (07:00 - 08:00)', class: '៨ឃ (8D)', subject: 'គណិតវិទ្យា', topic: 'មេរៀនទី១៖ ចំនួនសនិទាន - និយមន័យ', teacher: 'កែវ សំណាង', status: 'បានរៀបចំ' },
              { period: 'ម៉ោងទី ២ (08:00 - 09:00)', class: '៨ឃ (8D)', subject: 'គណិតវិទ្យា', topic: 'មេរៀនទី១៖ ចំនួនសនិទាន - លំហាត់គំរូ', teacher: 'កែវ សំណាង', status: 'បានរៀបចំ' },
              { period: 'ម៉ោងទី ៣ (09:00 - 10:00)', class: '៨គ (8C)', subject: 'គណិតវិទ្យា', topic: 'មេរៀនទី១៖ ចំនួនសនិទាន - សញ្ញាណ', teacher: 'កែវ សំណាង', status: 'មិនទាន់រៀបចំ' },
              { period: 'ម៉ោងទី ៥ (13:00 - 14:00)', class: '៨ក (8A)', subject: 'គណិតវិទ្យា', topic: 'មេរៀនទី១៖ ចំនួនសនិទាន - ប្រមាណវិធីបូក', teacher: 'កែវ សំណាង', status: 'បានរៀបចំ' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.class}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {item.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{item.period}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                      {item.topic}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'បានរៀបចំ'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {item.status}
                  </span>
                  <Link
                    to="/lesson-plans"
                    className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
                    title="មើលកិច្ចតែងការ"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

