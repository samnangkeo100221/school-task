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
  BookCopy
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import {
  ScheduledLesson,
  Student,
  Teacher,
  ClassRoom,
  CurriculumItem,
  SchoolCalendarEvent
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

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [t, s, c, cur, sl, ev] = await Promise.all([
          storageService.getTeachers(),
          storageService.getStudents(),
          storageService.getClasses(),
          storageService.getCurriculum(activeAcademicYear?.academicYearId),
          storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
          storageService.getCalendarEvents(activeAcademicYear?.academicYearId)
        ]);
        setTeachers(t);
        setStudents(s);
        setClasses(c);
        setCurriculum(cur);
        setScheduledLessons(sl);
        setCalendarEvents(ev);
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
  const missingAttendance = scheduledLessons.filter(l => l.status === 'completed' && !l.attendanceRecorded).length;

  // Upcoming holidays / exams
  const upcomingEvents = calendarEvents
    .filter(e => e.startDate >= todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-600 p-6 lg:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
                {activeAcademicYear?.yearName || 'ឆ្នាំសិក្សា ២០២៥-២០២៦'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/30 text-emerald-100 backdrop-blur-md">
                ឆមាសទី ១
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              សួស្តី {currentUser.displayName} 👋
            </h1>
            <p className="text-sm text-blue-100 max-w-xl font-medium leading-relaxed">
              ប្រព័ន្ធគ្រប់គ្រងការងារសិក្សា និងកិច្ចការបង្រៀនគណិតវិទ្យា ថ្នាក់ទី ៨ វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/class-curriculum"
              className="px-4 py-2.5 bg-white text-blue-700 font-bold text-xs rounded-xl shadow-md hover:bg-blue-50 transition-all flex items-center gap-1.5"
            >
              <BookCopy className="w-4 h-4" />
              <span>កម្មវិធីបង្រៀនតាមថ្នាក់</span>
            </NavLink>
            <NavLink
              to="/lesson-plans"
              className="px-4 py-2.5 bg-white/20 backdrop-blur-md text-white font-bold text-xs rounded-xl hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>កិច្ចតែងការ</span>
            </NavLink>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Teachers */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">គ្រូបង្រៀន</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{teachers.length}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">សកម្ម ១០០%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">លោកគ្រូ កែវ សំណាង (គណិតវិទ្យា)</p>
        </div>

        {/* Students */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">សិស្សសរុប</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{students.length}</span>
            <span className="text-[11px] text-blue-600 font-semibold">ថ្នាក់ទី ៨</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">៤ ថ្នាក់រៀន (៨ក, ៨ខ, ៨គ, ៨ឃ)</p>
        </div>

        {/* Classes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ថ្នាក់រៀនទទួលបន្ទុក</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{classes.length}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">១៦ ម៉ោង/សប្តាហ៍</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">៤ ម៉ោង/ថ្នាក់ ក្នុងមួយសប្តាហ៍</p>
        </div>

        {/* Curriculum Progress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">វឌ្ឍនភាពកម្មវិធីសិក្សា</span>
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
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(curriculumPercentage, 100)}%` }}
            />
          </div>
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
                  ម៉ោងបង្រៀនជាក់ស្តែងរបស់លោកគ្រូ កែវ សំណាង
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
                  សូមពិនិត្យមើលកាលវិភាគសប្តាហ៍ ឬប្រតិទិនសាលា
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

                    <div className="flex items-center gap-2">
                      <NavLink
                        to="/attendance"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                      >
                        កត់វត្តមាន
                      </NavLink>
                      <NavLink
                        to="/lesson-plans"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                      >
                        កិច្ចតែងការ
                      </NavLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curriculum Chapters Overview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              ជំពូកមេរៀនគណិតវិទ្យា ថ្នាក់ទី ៨ (តាមស្តង់ដារក្រសួងអប់រំ)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {curriculum.slice(0, 6).map((item) => (
                <div
                  key={item.curriculumId}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/20"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
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
                    <span>បានបង្រៀន៖ {item.completedPeriods} ម៉ោង</span>
                  </div>
                </div>
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
                  កិច្ចតែងការបង្រៀនត្រូវរៀបចំ
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                  មាន {pendingLessonPlans} ម៉ោងបង្រៀនរង់ចាំការបំពេញកិច្ចតែងការ ៥ ជំហាន
                </p>
                <NavLink
                  to="/lesson-plans"
                  className="inline-block mt-2 text-[11px] font-bold text-amber-800 dark:text-amber-200 underline"
                >
                  រៀបចំកិច្ចតែងការ &rarr;
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
