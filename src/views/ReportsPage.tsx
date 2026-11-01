import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { excelService } from '../services/excelService';
import { ClassRoom, Subject, Teacher, Student, ScheduledLesson, AttendanceRecord, CurriculumItem } from '../types';
import { 
  FileSpreadsheet, Download, Printer, BarChart3, Users, 
  BookOpen, CheckCircle, Clock, Calendar, Filter
} from 'lucide-react';

type ReportTab = 'CURRICULUM' | 'TEACHER_WORKLOAD' | 'ATTENDANCE';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('CURRICULUM');
  
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);

  // Filter
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');

  const loadData = async () => {
    const [cls, sbj, tch, stu, sch, att, cur] = await Promise.all([
      storageService.getClasses(),
      storageService.getSubjects(),
      storageService.getTeachers(),
      storageService.getStudents(),
      storageService.getScheduledLessons(),
      storageService.getAttendance(),
      storageService.getCurriculum()
    ]);

    setClasses(cls);
    setSubjects(sbj);
    setTeachers(tch);
    setStudents(stu);
    setScheduledLessons(sch);
    setAttendanceRecords(att);
    setCurriculumItems(cur);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Curriculum Completion Report Data
  const curriculumReportData = classes.map(c => {
    const classLessons = scheduledLessons.filter(sl => sl.classId === c.classId);
    const totalAllocated = classLessons.length;
    const completed = classLessons.filter(sl => sl.teachingStatus === 'COMPLETED').length;
    const upcoming = classLessons.filter(sl => sl.teachingStatus === 'PLANNED' || sl.teachingStatus === 'PREPARED').length;
    const missed = classLessons.filter(sl => sl.teachingStatus === 'MISSED').length;
    const pct = totalAllocated > 0 ? Math.round((completed / totalAllocated) * 100) : 0;

    return {
      classId: c.classId,
      className: c.className,
      gradeLevel: c.grade,
      totalPeriods: totalAllocated,
      completedPeriods: completed,
      upcomingPeriods: upcoming,
      missedPeriods: missed,
      completionRate: pct
    };
  });

  // 2. Teacher Workload Report Data
  const teacherReportData = teachers.map(t => {
    const teacherLessons = scheduledLessons.filter(sl => sl.teacherId === t.teacherId);
    const taught = teacherLessons.filter(sl => sl.teachingStatus === 'COMPLETED').length;
    const remaining = teacherLessons.filter(sl => sl.teachingStatus === 'PLANNED' || sl.teachingStatus === 'PREPARED').length;
    const missed = teacherLessons.filter(sl => sl.teachingStatus === 'MISSED').length;

    return {
      teacherId: t.teacherId,
      teacherCode: t.teacherCode,
      nameKhmer: t.fullName,
      specialty: 'គណិតវិទ្យា',
      weeklyQuota: t.weeklyWorkloadHours || 18,
      totalTaught: taught,
      scheduled: remaining,
      missed: missed,
      totalAssigned: teacherLessons.length
    };
  });

  // 3. Student Attendance Statistics Data
  const activeStudents = selectedClassId === 'ALL' 
    ? students 
    : students.filter(s => s.classId === selectedClassId);

  const attendanceReportData = activeStudents.map(s => {
    const sRecords = attendanceRecords.filter(r => r.studentId === s.studentId);
    const totalPeriodsRecorded = sRecords.length;
    const present = sRecords.filter(r => r.status === 'PRESENT').length;
    const absent = sRecords.filter(r => r.status === 'ABSENT').length;
    const excused = sRecords.filter(r => r.status === 'EXCUSED').length;
    const late = sRecords.filter(r => r.status === 'LATE').length;
    
    // Attendance % = (Present + Late) / Total * 100
    const pct = totalPeriodsRecorded > 0 
      ? Math.round(((present + late) / totalPeriodsRecorded) * 100) 
      : 100;

    const studentClass = classes.find(c => c.classId === s.classId)?.className || s.classId;

    return {
      studentId: s.studentId,
      studentCode: s.studentCode,
      nameKhmer: s.fullName,
      gender: s.gender === 'F' ? 'ស្រី' : 'ប្រុស',
      className: studentClass,
      totalPeriodsRecorded,
      present,
      absent,
      excused,
      late,
      attendancePercentage: pct
    };
  });

  // Export handlers
  const handleExportCurriculum = () => {
    const rows = curriculumReportData.map(r => ({
      'ថ្នាក់រៀន': r.className,
      'កម្រិត': r.gradeLevel,
      'ម៉ោងសរុបតាមកាលវិភាគ': r.totalPeriods,
      'បានបង្រៀនរួច': r.completedPeriods,
      'រង់ចាំបង្រៀន': r.upcomingPeriods,
      'ខកខាន': r.missedPeriods,
      'ភាគរយសម្រេច (%)': `${r.completionRate}%`
    }));
    excelService.exportToExcel(rows, 'របាយការណ៍វឌ្ឍនភាពកម្មវិធីសិក្សា');
  };

  const handleExportTeacherWorkload = () => {
    const rows = teacherReportData.map(r => ({
      'អត្តលេខ': r.teacherCode,
      'គោត្តនាម-នាម': r.nameKhmer,
      'ឯកទេស': r.specialty,
      'បន្ទុកម៉ោងកំណត់/សប្តាហ៍': r.weeklyQuota,
      'ម៉ោងបង្រៀនសរុប': r.totalAssigned,
      'បានបង្រៀនរួច': r.totalTaught,
      'ម៉ោងខកខាន': r.missed
    }));
    excelService.exportToExcel(rows, 'របាយការណ៍បន្ទុកម៉ោងបង្រៀនគ្រូ');
  };

  const handleExportAttendance = () => {
    const rows = attendanceReportData.map(r => ({
      'អត្តលេខ': r.studentCode,
      'គោត្តនាម-នាម': r.nameKhmer,
      'ភេទ': r.gender,
      'ថ្នាក់': r.className,
      'ម៉ោងកត់ត្រាសរុប': r.totalPeriodsRecorded,
      'វត្តមាន (មក)': r.present,
      'អវត្តមានឥតច្បាប់': r.absent,
      'មានច្បាប់': r.excused,
      'មកយឺត': r.late,
      'ភាគរយវត្តមាន (%)': `${r.attendancePercentage}%`
    }));
    excelService.exportToExcel(rows, 'របាយការណ៍អវត្តមានសិស្ស');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            របាយការណ៍ និងស្ថិតិសិក្សា (Academic Reports)
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            ទាញយក និងបោះពុម្ពរបាយការណ៍វឌ្ឍនភាពកម្មវិធីសិក្សា បន្ទុកម៉ោងបង្រៀនគ្រូ និងអវត្តមានសិស្ស
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            បោះពុម្ពរបាយការណ៍
          </button>
          <button
            onClick={() => {
              if (activeTab === 'CURRICULUM') handleExportCurriculum();
              else if (activeTab === 'TEACHER_WORKLOAD') handleExportTeacherWorkload();
              else handleExportAttendance();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            នាំចេញ Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-xl px-4 pt-2 print:hidden">
        <button
          onClick={() => setActiveTab('CURRICULUM')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'CURRICULUM'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          វឌ្ឍនភាពកម្មវិធីសិក្សា (Curriculum Progress)
        </button>

        <button
          onClick={() => setActiveTab('TEACHER_WORKLOAD')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'TEACHER_WORKLOAD'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          បន្ទុកម៉ោងបង្រៀនគ្រូ (Teacher Workload)
        </button>

        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'ATTENDANCE'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          ស្ថិតិអវត្តមានសិស្ស (Student Attendance)
        </button>
      </div>

      {/* Tab 1: Curriculum Progress */}
      {activeTab === 'CURRICULUM' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-800 dark:text-white text-base">
              វឌ្ឍនភាពនៃការអនុវត្តកម្មវិធីសិក្សាប្រចាំថ្នាក់ (Curriculum Completion)
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              គណនាដោយស្វ័យប្រវត្តិតាមការបង្រៀនជាក់ស្តែងធៀបនឹងកម្មវិធីសិក្សាប្រចាំឆ្នាំ
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/60 text-gray-700 dark:text-slate-300 text-xs font-semibold border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4">ថ្នាក់រៀន</th>
                  <th className="py-3 px-4">កម្រិត</th>
                  <th className="py-3 px-4 text-center">ម៉ោងបង្រៀនសរុប</th>
                  <th className="py-3 px-4 text-center text-emerald-700 dark:text-emerald-400">បានបង្រៀនរួច</th>
                  <th className="py-3 px-4 text-center text-blue-700 dark:text-blue-400">រង់ចាំបង្រៀន</th>
                  <th className="py-3 px-4 text-center text-rose-700 dark:text-rose-400">ខកខាន</th>
                  <th className="py-3 px-4 w-52">ភាគរយសម្រេច (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {curriculumReportData.map(r => (
                  <tr key={r.classId} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">ថ្នាក់ {r.className}</td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-slate-400">ថ្នាក់ទី {r.gradeLevel}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-gray-800 dark:text-slate-200">{r.totalPeriods} ម៉ោង</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">{r.completedPeriods}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-blue-600 dark:text-blue-400">{r.upcomingPeriods}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">{r.missedPeriods}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${Math.min(r.completionRate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300 w-10 text-right">
                          {r.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Teacher Workload */}
      {activeTab === 'TEACHER_WORKLOAD' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-800 dark:text-white text-base">
              របាយការណ៍បន្ទុកម៉ោងបង្រៀនរបស់លោកគ្រូ-អ្នកគ្រូ (Teacher Teaching Workload)
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              ផ្ទៀងផ្ទាត់បន្ទុកម៉ោងបង្រៀនប្រចាំសប្តាហ៍ និងម៉ោងបង្រៀនជាក់ស្តែងតាមប្រតិទិន
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/60 text-gray-700 dark:text-slate-300 text-xs font-semibold border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4">អត្តលេខ</th>
                  <th className="py-3 px-4">គោត្តនាម-នាមគ្រូ</th>
                  <th className="py-3 px-4">មុខវិជ្ជាឯកទេស</th>
                  <th className="py-3 px-4 text-center">កូតាកំណត់/សប្តាហ៍</th>
                  <th className="py-3 px-4 text-center">ម៉ោងបង្រៀនសរុប</th>
                  <th className="py-3 px-4 text-center text-emerald-700 dark:text-emerald-400">បានបង្រៀនរួច</th>
                  <th className="py-3 px-4 text-center text-rose-700 dark:text-rose-400">ខកខាន</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {teacherReportData.map(r => (
                  <tr key={r.teacherId} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-slate-400">{r.teacherCode}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">{r.nameKhmer}</td>
                    <td className="py-3.5 px-4 text-indigo-600 dark:text-indigo-400 font-medium">{r.specialty}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-700 dark:text-slate-300">{r.weeklyQuota} ម៉ោង</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-gray-800 dark:text-slate-200">{r.totalAssigned} ម៉ោង</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">{r.totalTaught} ម៉ោង</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">{r.missed} ម៉ោង</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Attendance Statistics */}
      {activeTab === 'ATTENDANCE' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden space-y-4">
          <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-base">
                ស្ថិតិ និងភាគរយអវត្តមានសិស្ស (Student Attendance Summary)
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                ភាគរយវត្តមានសរុបគណនាតាមរូបមន្ត: (ម៉ោងមានវត្តមាន ÷ ម៉ោងកត់ត្រាសរុប) × ១០០%
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">ចម្រាញ់តាមថ្នាក់:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">គ្រប់ថ្នាក់រៀន</option>
                {classes.map(c => (
                  <option key={c.classId} value={c.classId}>ថ្នាក់ {c.className}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/60 text-gray-700 dark:text-slate-300 text-xs font-semibold border-b border-gray-200 dark:border-slate-700">
                  <th className="py-3 px-4 w-12 text-center">ល.រ</th>
                  <th className="py-3 px-4">អត្តលេខ</th>
                  <th className="py-3 px-4">គោត្តនាម-នាម</th>
                  <th className="py-3 px-4 text-center">ភេទ</th>
                  <th className="py-3 px-4">ថ្នាក់</th>
                  <th className="py-3 px-4 text-center text-emerald-700 dark:text-emerald-400">វត្តមាន</th>
                  <th className="py-3 px-4 text-center text-rose-700 dark:text-rose-400">អត់ច្បាប់</th>
                  <th className="py-3 px-4 text-center text-blue-700 dark:text-blue-400">មានច្បាប់</th>
                  <th className="py-3 px-4 text-center text-amber-700 dark:text-amber-400">មកយឺត</th>
                  <th className="py-3 px-4 text-right pr-6">ភាគរយ (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {attendanceReportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400">
                      មិនមានទិន្នន័យសិស្ស
                    </td>
                  </tr>
                ) : (
                  attendanceReportData.map((s, idx) => (
                    <tr key={s.studentId} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-center text-xs text-gray-500 dark:text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-slate-400">{s.studentCode}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{s.nameKhmer}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          s.gender === 'ស្រី' ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}>
                          {s.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700 dark:text-slate-300">{s.className}</td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">{s.present}</td>
                      <td className="py-3 px-4 text-center font-semibold text-rose-600 dark:text-rose-400">{s.absent}</td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600 dark:text-blue-400">{s.excused}</td>
                      <td className="py-3 px-4 text-center font-semibold text-amber-600 dark:text-amber-400">{s.late}</td>
                      <td className="py-3 px-4 text-right pr-6">
                        <span className={`font-bold ${
                          s.attendancePercentage >= 90 ? 'text-emerald-700 dark:text-emerald-400' :
                          s.attendancePercentage >= 75 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }`}>
                          {s.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
