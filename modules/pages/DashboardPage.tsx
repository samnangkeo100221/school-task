import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Calendar,
  FileCheck,
  RotateCcw,
  BookCopy,
  Award,
  ArrowRight,
  Check,
  UserCheck,
  FileText
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import {
  ScheduledLesson,
  Student,
  Teacher,
  ClassRoom,
  CurriculumItem,
  SchoolCalendarEvent,
  StudentTest
} from '../types';
import { NavLink } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { activeAcademicYear, currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<SchoolCalendarEvent[]>([]);
  const [studentTests, setStudentTests] = useState<StudentTest[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [t, s, c, cur, sl, ev, st] = await Promise.all([
          storageService.getTeachers(),
          storageService.getStudents(),
          storageService.getClasses(),
          storageService.getCurriculum(activeAcademicYear?.academicYearId),
          storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
          storageService.getCalendarEvents(activeAcademicYear?.academicYearId),
          storageService.getStudentTests(activeAcademicYear?.academicYearId)
        ]);
        setTeachers(t);
        setStudents(s);
        setClasses(c);
        setCurriculum(cur);
        setScheduledLessons(sl);
        setCalendarEvents(ev);
        setStudentTests(st);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [activeAcademicYear]);

  // Today's date calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLessons = scheduledLessons.filter(l => l.date === todayStr);

  // Curriculum completion statistics
  const totalRequiredPeriods = curriculum.reduce((sum, c) => sum + c.requiredPeriods, 0);
  const completedCurriculumPeriods = curriculum.reduce((sum, c) => sum + (c.completedPeriods || 0), 0);
  const curriculumPercentage = totalRequiredPeriods > 0 
    ? Math.round((completedCurriculumPeriods / totalRequiredPeriods) * 100) 
    : 0;

  // Completed & pending sessions
  const completedSessions = scheduledLessons.filter(l => l.status === 'completed').length;
  const pendingLessonPlans = scheduledLessons.filter(l => l.status === 'planned').length;

  // Student test statistics
  const allTestScores = (studentTests || []).flatMap(t => {
    const list = t?.records || t?.scores || [];
    return Array.isArray(list) ? list.map(s => (typeof s?.score === 'number' ? s.score : 0)) : [];
  });
  const avgTestScore = allTestScores.length > 0 
    ? (allTestScores.reduce((a, b) => a + b, 0) / allTestScores.length).toFixed(1)
    : '0';

  // Upcoming holidays / exams
  const upcomingEvents = calendarEvents
    .filter(e => e.startDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 warm:from-[#2e261f] warm:via-[#3d3228] warm:to-[#2e261f] p-6 lg:p-8 text-white shadow-sm border border-slate-700/40 dark:border-slate-800 warm:border-amber-900/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 border border-white/10 backdrop-blur-md text-slate-200">
                {activeAcademicYear?.yearName || 'ឆ្នាំសិក្សា ២០២៥-២០២៦'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/20 text-emerald-200 backdrop-blur-md">
                ឆមាសទី ១
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 border border-amber-300/20 text-amber-200">
                គ្រូទោល៖ លោកគ្រូ កែវ សំណាង
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              សួស្តី {currentUser.displayName} 👋
            </h1>
            <p className="text-sm text-slate-300 dark:text-slate-400 warm:text-amber-200/80 max-w-2xl font-normal leading-relaxed">
              ប្រព័ន្ធគ្រប់គ្រងការងារបង្រៀនគណិតវិទ្យា ថ្នាក់ទី ៨ (៨ក, ៨ខ, ៨គ, ៨ឃ) វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <NavLink
              to="/class-curriculum"
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <BookCopy className="w-4 h-4" />
              <span>កម្មវិធីបង្រៀនតាមថ្នាក់</span>
            </NavLink>
            <NavLink
              to="/lesson-plans"
              className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-slate-600/50 backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>កិច្ចតែងការ</span>
            </NavLink>
            <NavLink
              to="/student-tests"
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>កត់ត្រាតេស្តសិស្ស</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Teaching Workflow Pipeline Diagram (Strict Hierarchy) */}
      <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-800/90 warm:bg-[#fbf7f0] border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                រចនាសម្ព័ន្ធបង្រៀនគណិតវិទ្យា ថ្នាក់ទី ៨ របស់លោកគ្រូ កែវ សំណាង
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              កិច្ចតែងការអាស្រ័យកម្មវិធីសិក្សា &bull; កម្មវិធីសិក្សាអាស្រ័យកាលវិភាគ (បែងចែកតាមថ្នាក់នីមួយៗ) &bull; កិច្ចការប្រចាំថ្ងៃ
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/50 self-start sm:self-auto">
            លំហូរស្វ័យប្រវត្តិ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* Step 1: Timetable */}
          <NavLink
            to="/timetable"
            className="group p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 hover:border-blue-400 transition-all block relative"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                ១
              </div>
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              កាលវិភាគបង្រៀន
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              ១៦ ម៉ោង/សប្តាហ៍ បែងចែក ៤ ម៉ោងក្នុងមួយថ្នាក់ (៨ក, ៨ខ, ៨គ, ៨ឃ)
            </p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-2 inline-flex items-center gap-1">
              <span>មើលកាលវិភាគ</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </NavLink>

          {/* Step 2: Curriculum by Class */}
          <NavLink
            to="/class-curriculum"
            className="group p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 hover:border-emerald-400 transition-all block relative"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                ២
              </div>
              <BookCopy className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              កម្មវិធីសិក្សា (តាមថ្នាក់)
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              អាស្រ័យកាលវិភាគ៖ បែងចែកមេរៀនតាមម៉ោងជាក់ស្តែងនៃថ្នាក់នីមួយៗ
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 inline-flex items-center gap-1">
              <span>មើលតាមថ្នាក់</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </NavLink>

          {/* Step 3: Lesson Plans */}
          <NavLink
            to="/lesson-plans"
            className="group p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40 hover:border-purple-400 transition-all block relative"
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                ៣
              </div>
              <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              កិច្ចតែងការបង្រៀន
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              អាស្រ័យកម្មវិធីសិក្សា៖ គំរូ ៥ ជំហាន MoEYS ពេញលេញគ្រប់មេរៀន
            </p>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-2 inline-flex items-center gap-1">
              <span>បើកកិច្ចតែងការ</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </NavLink>

          {/* Step 4: Daily Attendance & Tests */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 relative">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                ៤
              </div>
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white mt-2.5">
              កិច្ចការប្រចាំថ្ងៃ
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              ស្រង់អវត្តមាន និង កត់ត្រាតេស្តសិស្ស (ប្រចាំថ្ងៃ, សប្តាហ៍, ខែ)
            </p>
            <div className="flex items-center gap-2 mt-2">
              <NavLink
                to="/attendance"
                className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                ស្រង់វត្តមាន
              </NavLink>
              <span className="text-slate-300 dark:text-slate-600">&bull;</span>
              <NavLink
                to="/student-tests"
                className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
              >
                កត់ត្រាតេស្ត
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solo Teacher Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">គ្រូបង្រៀនទោល</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-black text-slate-900 dark:text-white truncate">កែវ សំណាង</span>
            <span className="text-[11px] text-emerald-600 font-semibold">គណិតវិទ្យា ៨</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង</p>
        </div>

        {/* Classes & Students */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ថ្នាក់ទទួលបន្ទុក</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{classes.length} ថ្នាក់</span>
            <span className="text-[11px] text-blue-600 font-semibold">{students.length} សិស្ស</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">៨ក, ៨ខ, ៨គ, ៨ឃ (១៦ ម៉ោង/សប្តាហ៍)</p>
        </div>

        {/* Curriculum Progress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">វឌ្ឍនភាពកម្មវិធី</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{curriculumPercentage}%</span>
            <span className="text-[11px] text-slate-500 font-medium">{completedCurriculumPeriods}/{totalRequiredPeriods} ម៉ោង</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(curriculumPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Student Tests & Scoring */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">តេស្ត & ការវាយតម្លៃ</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{studentTests.length} តេស្ត</span>
            <span className="text-[11px] text-indigo-600 font-semibold">មធ្យម {avgTestScore}/10</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">កត់ត្រាតេស្តប្រចាំថ្ងៃ/សប្តាហ៍</p>
        </div>
      </div>

      {/* 4 Assigned Classes Quick Hub */}
      <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              ថ្នាក់រៀនទាំង ៤ ដែលទទួលបន្ទុកបង្រៀនគណិតវិទ្យា
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ចុចដើម្បីចូលទៅកាន់កម្មវិធីសិក្សា ស្រង់វត្តមាន ឬកត់ត្រាតេស្តសម្រាប់ថ្នាក់នីមួយៗ
            </p>
          </div>
          <NavLink
            to="/class-curriculum"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>កម្មវិធីសិក្សាគ្រប់ថ្នាក់</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {classes.map((cls) => {
            const classStudentCount = students.filter(s => s.classId === cls.classId && s.status === 'active').length;
            const classTestsCount = studentTests.filter(t => t.classId === cls.classId).length;
            const classLessons = scheduledLessons.filter(l => l.classId === cls.classId);
            const classDone = classLessons.filter(l => l.status === 'completed').length;
            const classTotal = classLessons.length || 1;
            const pct = Math.round((classDone / classTotal) * 100);

            return (
              <div
                key={cls.classId}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      ថ្នាក់ {cls.className}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {cls.roomNumber || 'បន្ទប់ ១២'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ចំនួនសិស្ស៖</span>
                      <span className="font-bold">{classStudentCount} នាក់</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ម៉ោងបង្រៀន៖</span>
                      <span className="font-semibold">៤ ម៉ោង/សប្តាហ៍</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">បានធ្វើតេស្ត៖</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{classTestsCount} លើក</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>វឌ្ឍនភាពថ្នាក់</span>
                      <span className="font-bold">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                  <NavLink
                    to={`/class-curriculum?classId=${cls.classId}`}
                    className="flex-1 text-center py-1.5 px-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors"
                  >
                    មេរៀន
                  </NavLink>
                  <NavLink
                    to={`/attendance?classId=${cls.classId}`}
                    className="flex-1 text-center py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    វត្តមាន
                  </NavLink>
                  <NavLink
                    to={`/student-tests?classId=${cls.classId}`}
                    className="flex-1 text-center py-1.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    តេស្ត
                  </NavLink>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Today's Tasks & Teaching Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Teaching Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  កាលវិភាគបង្រៀនថ្ងៃនេះ ({new Date().toLocaleDateString('km-KH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ម៉ោងបង្រៀនជាក់ស្តែងរបស់លោកគ្រូ កែវ សំណាង &bull; ចុចដើម្បីកត់វត្តមាន ឬកត់ត្រាតេស្តភ្លាមៗ
                </p>
              </div>
              <NavLink
                to="/timetable"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>កាលវិភាគពេញលេញ</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            {todayLessons.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  មិនមានម៉ោងបង្រៀនថ្ងៃនេះ ឬជាថ្ងៃឈប់សម្រាក
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  លោកគ្រូអាចពិនិត្យមើលកាលវិភាគសប្តាហ៍ ឬរៀបចំកិច្ចតែងការទុកជាមុន
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayLessons.map((session) => (
                  <div
                    key={session.scheduledLessonId}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold flex flex-col items-center justify-center text-xs shrink-0">
                        <span>P{session.periodNumber}</span>
                        <span className="text-[9px] font-normal">{session.startTime}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            ថ្នាក់ {classes.find(c => c.classId === session.classId)?.className || session.classId}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                            {session.room}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                          {session.lessonTitle}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {session.topicTitle} (ម៉ោងទី {session.periodIndexForLesson}/{session.totalPeriodsForLesson})
                        </p>
                      </div>
                    </div>

                    {/* Direct Action Buttons for Today */}
                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                      <NavLink
                        to={`/attendance?classId=${session.classId}&date=${session.date}&period=${session.periodNumber}`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>ស្រង់វត្តមាន</span>
                      </NavLink>
                      <NavLink
                        to={`/student-tests?classId=${session.classId}&curriculumId=${session.curriculumId}&new=true`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>កត់ត្រាតេស្ត</span>
                      </NavLink>
                      <NavLink
                        to={`/lesson-plans?curriculumId=${session.curriculumId}`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>កិច្ចតែងការ</span>
                      </NavLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curriculum Chapters Overview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ជំពូកមេរៀនគណិតវិទ្យា ថ្នាក់ទី ៨ (តាមស្តង់ដារក្រសួងអប់រំ)
              </h3>
              <NavLink
                to="/lesson-plans"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                មើលកិច្ចតែងការទាំងអស់ &rarr;
              </NavLink>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {curriculum.slice(0, 6).map((item) => (
                <NavLink
                  key={item.curriculumId}
                  to={`/lesson-plans?curriculumId=${item.curriculumId}`}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all block group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] group-hover:text-blue-600 transition-colors">
                      {item.chapterTitle}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : item.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {item.status === 'completed' ? 'បញ្ចប់' : item.status === 'in_progress' ? 'កំពុងរៀន' : 'គ្រោង'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {item.lessonTitle}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>ម៉ោងតម្រូវ៖ {item.requiredPeriods} ម៉ោង</span>
                    <span className="text-blue-600 font-semibold group-hover:underline">បើកកិច្ចតែងការ &rarr;</span>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Events */}
        <div className="space-y-4">
          {/* Quick Action Alerts */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ការងារត្រូវយកចិត្តទុកដាក់
            </h3>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  កិច្ចតែងការបង្រៀន ៥ ជំហាន
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  មាន {curriculum.length} មេរៀនដែលបានរៀបចំកិច្ចតែងការរួចរាល់ អាចបោះពុម្ព ឬបង្ហាញបង្រៀន
                </p>
                <NavLink
                  to="/lesson-plans"
                  className="inline-block mt-2 text-[11px] font-bold text-amber-800 dark:text-amber-200 underline"
                >
                  ពិនិត្យកិច្ចតែងការ &rarr;
                </NavLink>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 flex items-start gap-3">
              <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  កត់ត្រាតេស្ត និងវាយតម្លៃសិស្ស
                </p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  កត់ត្រាពិន្ទុតេស្តខ្លីប្រចាំថ្ងៃ ឬសំណួរផ្ទាល់មាត់ក្នុងម៉ោងបង្រៀនជាក់ស្តែង
                </p>
                <NavLink
                  to="/student-tests"
                  className="inline-block mt-2 text-[11px] font-bold text-indigo-800 dark:text-indigo-200 underline"
                >
                  កត់ត្រាតេស្តថ្មី &rarr;
                </NavLink>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  ម៉ោងបង្រៀនសង
                </p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                  អាចកំណត់ពេលបង្រៀនសងម៉ោងដែលខកខាន ឬចំនឹងថ្ងៃបុណ្យជាតិ
                </p>
                <NavLink
                  to="/makeup-lessons"
                  className="inline-block mt-2 text-[11px] font-bold text-blue-800 dark:text-blue-200 underline"
                >
                  ពិនិត្យម៉ោងបង្រៀនសង &rarr;
                </NavLink>
              </div>
            </div>
          </div>

          {/* Upcoming School Events */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                បុណ្យជាតិ និងព្រឹត្តិការណ៍សាលា
              </h3>
              <NavLink to="/calendar" className="text-xs text-blue-600 font-bold hover:underline">
                ទាំងអស់
              </NavLink>
            </div>

            <div className="space-y-2.5">
              {upcomingEvents.map((ev) => (
                <div
                  key={ev.eventId}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {ev.eventTitle}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} ដល់ ${ev.endDate}`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    ev.eventType === 'examination'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  }`}>
                    {ev.eventType === 'examination' ? 'ប្រឡង' : 'ឈប់បុណ្យ'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
