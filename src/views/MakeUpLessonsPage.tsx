import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { useApp } from '../contexts/AppContext';
import { MakeUpLesson, ScheduledLesson, ClassRoom, Subject, Teacher } from '../types';
import { 
  RotateCcw, Calendar, Clock, AlertTriangle, Plus, CheckCircle, 
  Search, Filter, Save, X
} from 'lucide-react';

export const MakeUpLessonsPage: React.FC = () => {
  const { addToast } = useApp();
  const [makeUps, setMakeUps] = useState<MakeUpLesson[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<Partial<MakeUpLesson>>({
    classId: '',
    subjectId: '',
    missedDate: new Date().toISOString().split('T')[0],
    missedPeriod: 1,
    missedTeacherId: 'T-001',
    substituteTeacherId: '',
    curriculumTopic: '',
    rescheduledDate: new Date().toISOString().split('T')[0],
    rescheduledPeriod: 5,
    status: 'SCHEDULED',
    reason: 'ឈប់សម្រាកព្យាបាលជំងឺ',
    notes: ''
  });

  const loadData = async () => {
    const [mu, sl, cls, tch, sbj] = await Promise.all([
      storageService.getMakeUpLessons(),
      storageService.getScheduledLessons(),
      storageService.getClasses(),
      storageService.getTeachers(),
      storageService.getSubjects()
    ]);

    setMakeUps(mu);
    setScheduledLessons(sl);
    setClasses(cls);
    setTeachers(tch);
    setSubjects(sbj);

    if (cls.length > 0 && !formData.classId) {
      setFormData(prev => ({
        ...prev,
        classId: cls[0].classId,
        subjectId: sbj[0]?.subjectId || 'SUB-MATH-8',
        missedTeacherId: tch[0]?.teacherId || 'T-001'
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      makeUpId: 'MU-' + Date.now(),
      academicYearId: 'AY-2025-2026',
      originalScheduledLessonId: '',
      classId: classes[0]?.classId || 'CLS-8A',
      subjectId: subjects[0]?.subjectId || 'SUB-MATH-8',
      missedDate: new Date().toISOString().split('T')[0],
      missedPeriod: 1,
      missedTeacherId: teachers[0]?.teacherId || 'T-001',
      substituteTeacherId: teachers[1]?.teacherId || '',
      curriculumTopic: 'មេរៀនទី ១: ចំនួនសនិទាន និងប្រភាគ',
      rescheduledDate: new Date().toISOString().split('T')[0],
      rescheduledPeriod: 5,
      status: 'SCHEDULED',
      reason: 'ឈប់សម្រាកព្យាបាលជំងឺ ឬការងារផ្លូវការ',
      notes: '',
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.classId || !formData.curriculumTopic || !formData.rescheduledDate) {
      alert('សូមបំពេញព័ត៌មានចាំបាច់ (ថ្នាក់រៀន, ខ្លឹមសារមេរៀន, កាលបរិច្ឆេទសង)!');
      return;
    }

    const item: MakeUpLesson = {
      makeUpId: formData.makeUpId || 'MU-' + Date.now(),
      academicYearId: 'AY-2025-2026',
      originalScheduledLessonId: formData.originalScheduledLessonId || '',
      missedDate: formData.missedDate || '',
      missedPeriod: Number(formData.missedPeriod) || 1,
      missedTeacherId: formData.missedTeacherId || teachers[0]?.teacherId || 'T-001',
      substituteTeacherId: formData.substituteTeacherId || undefined,
      classId: formData.classId || classes[0]?.classId || 'CLS-8A',
      subjectId: formData.subjectId || subjects[0]?.subjectId || 'SUB-MATH-8',
      curriculumTopic: formData.curriculumTopic || '',
      rescheduledDate: formData.rescheduledDate || '',
      rescheduledPeriod: Number(formData.rescheduledPeriod) || 5,
      status: (formData.status as any) || 'SCHEDULED',
      reason: formData.reason || '',
      notes: formData.notes || '',
      createdAt: formData.createdAt || new Date().toISOString()
    };

    await storageService.saveMakeUpLesson(item);
    addToast('success', 'បានរក្សាទុកកាលវិភាគបង្រៀនសង');
    setIsModalOpen(false);
    await loadData();
  };

  const handleStatusChange = async (mu: MakeUpLesson, newStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED') => {
    const updated = { ...mu, status: newStatus };
    await storageService.saveMakeUpLesson(updated);
    addToast('success', 'បានកែប្រែស្ថានភាពបង្រៀនសង');
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបកាលវិភាគបង្រៀនសងនេះមែនទេ?')) {
      await storageService.deleteMakeUpLesson(id);
      addToast('success', 'បានលុបកាលវិភាគបង្រៀនសង');
      await loadData();
    }
  };

  const getClassName = (cid: string) => classes.find(c => c.classId === cid)?.className || cid;
  const getSubjectName = (sid: string) => subjects.find(s => s.subjectId === sid)?.subjectName || sid;
  const getTeacherName = (tid?: string) => tid ? (teachers.find(t => t.teacherId === tid)?.fullName || tid) : 'គ្មាន';

  // Filtered list
  const filteredMakeUps = makeUps.filter(m => {
    if (selectedClassId !== 'ALL' && m.classId !== selectedClassId) return false;
    if (selectedStatus !== 'ALL' && m.status !== selectedStatus) return false;
    return true;
  });

  // Calculate missed lessons from scheduled lessons
  const missedFromSchedule = scheduledLessons.filter(sl => sl.teachingStatus === 'MISSED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            ម៉ោងបង្រៀនសង (Make-Up Lessons)
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            គ្រប់គ្រង និងតាមដានម៉ោងបង្រៀនដែលបានខកខាន ការចាត់តាំងគ្រូបង្រៀនជំនួស និងការបង្រៀនសង
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          បង្កើតកាលវិភាគបង្រៀនសង
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {makeUps.filter(m => m.status === 'SCHEDULED').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">កំពុងរង់ចាំបង្រៀនសង (Scheduled)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {makeUps.filter(m => m.status === 'COMPLETED').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">បានបង្រៀនសងរួចរាល់ (Completed)</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {missedFromSchedule.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">ម៉ោងខកខានក្នុងប្រតិទិន (Missed)</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">គ្រប់ថ្នាក់រៀន</option>
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>{c.className}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">គ្រប់ស្ថានភាព</option>
              <option value="SCHEDULED">បានកំណត់កាលវិភាគ (Scheduled)</option>
              <option value="COMPLETED">បានបង្រៀនសងរួច (Completed)</option>
              <option value="CANCELLED">លុបចោល (Cancelled)</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-slate-400">
          សរុប: <span className="font-bold text-gray-800 dark:text-white">{filteredMakeUps.length}</span> ម៉ោងបង្រៀនសង
        </div>
      </div>

      {/* Make-Up Lessons Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold">
                <th className="py-3.5 px-4 w-12 text-center">ល.រ</th>
                <th className="py-3.5 px-4">ថ្នាក់ & មុខវិជ្ជា</th>
                <th className="py-3.5 px-4">ខ្លឹមសារមេរៀនដែលខកខាន</th>
                <th className="py-3.5 px-4">ម៉ោងខកខានដើម</th>
                <th className="py-3.5 px-4">កាលវិភាគបង្រៀនសង</th>
                <th className="py-3.5 px-4">គ្រូដើម / គ្រូជំនួស</th>
                <th className="py-3.5 px-4 text-center">ស្ថានភាព</th>
                <th className="py-3.5 px-4 text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filteredMakeUps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 dark:text-slate-400">
                    មិនមានទិន្នន័យម៉ោងបង្រៀនសងទេ
                  </td>
                </tr>
              ) : (
                filteredMakeUps.map((mu, idx) => {
                  const isCompleted = mu.status === 'COMPLETED';
                  const isScheduled = mu.status === 'SCHEDULED';

                  return (
                    <tr key={mu.makeUpId} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-4 text-center text-xs text-gray-500 dark:text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white block">ថ្នាក់ {getClassName(mu.classId)}</span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400">{getSubjectName(mu.subjectId)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800 dark:text-slate-200 block text-xs line-clamp-1">{mu.curriculumTopic}</span>
                        {mu.reason && <span className="text-[11px] text-gray-500 dark:text-slate-400">មូលហេតុ: {mu.reason}</span>}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium text-rose-700 dark:text-rose-400">{mu.missedDate}</div>
                        <div className="text-gray-500 dark:text-slate-400">ម៉ោងទី {mu.missedPeriod}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {mu.rescheduledDate}
                        </div>
                        <div className="text-gray-600 dark:text-slate-400 font-medium">ម៉ោងទី {mu.rescheduledPeriod} ({mu.rescheduledPeriod <= 4 ? 'ព្រឹក' : 'រសៀល'})</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="text-gray-800 dark:text-slate-200">ដើម: <span className="font-semibold">{getTeacherName(mu.missedTeacherId)}</span></div>
                        {mu.substituteTeacherId && (
                          <div className="text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                            ជំនួស: {getTeacherName(mu.substituteTeacherId)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-semibold inline-block ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' :
                          isScheduled ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isCompleted ? 'បង្រៀនរួចរាល់' : isScheduled ? 'បានកំណត់កាលវិភាគ' : 'លុបចោល'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isScheduled && (
                            <button
                              onClick={() => handleStatusChange(mu, 'COMPLETED')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-medium border border-emerald-200 transition-colors"
                              title="សម្គាល់ថាបានបង្រៀនរួច"
                            >
                              សងរួច
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(mu.makeUpId)}
                            className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                            title="លុប"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Schedule Make-Up Lesson */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-gray-900 dark:text-white">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/30">
              <h2 className="text-base font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                បង្កើតកាលវិភាគបង្រៀនសង (Schedule Make-Up Lesson)
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ថ្នាក់រៀន</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                  >
                    {classes.map(c => (
                      <option key={c.classId} value={c.classId}>{c.className}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">មុខវិជ្ជា</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                  >
                    {subjects.map(s => (
                      <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ខ្លឹមសារមេរៀនដែលខកខាន *</label>
                <input
                  type="text"
                  value={formData.curriculumTopic}
                  onChange={(e) => setFormData({ ...formData, curriculumTopic: e.target.value })}
                  placeholder="ឧ. មេរៀនទី ១: ចំនួនសនិទាន..."
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                />
              </div>

              {/* Missed Slot Info */}
              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-xl space-y-2">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-400">ព័ត៌មានម៉ោងដែលខកខានដើម</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-slate-400">កាលបរិច្ឆេទខកខាន</label>
                    <input
                      type="date"
                      value={formData.missedDate}
                      onChange={(e) => setFormData({ ...formData, missedDate: e.target.value })}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded p-1.5 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-slate-400">ម៉ោងទី</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.missedPeriod}
                      onChange={(e) => setFormData({ ...formData, missedPeriod: Number(e.target.value) })}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded p-1.5 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-slate-400">គ្រូបង្រៀនដើម</label>
                    <select
                      value={formData.missedTeacherId}
                      onChange={(e) => setFormData({ ...formData, missedTeacherId: e.target.value })}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded p-1.5 text-xs bg-white dark:bg-slate-800"
                    >
                      {teachers.map(t => (
                        <option key={t.teacherId} value={t.teacherId}>{t.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rescheduled Slot Info */}
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">ព័ត៌មានកាលវិភាគបង្រៀនសង</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-slate-400">កាលបរិច្ឆេទសង</label>
                    <input
                      type="date"
                      value={formData.rescheduledDate}
                      onChange={(e) => setFormData({ ...formData, rescheduledDate: e.target.value })}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded p-1.5 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-slate-400">ម៉ោងសងទី</label>
                    <select
                      value={formData.rescheduledPeriod}
                      onChange={(e) => setFormData({ ...formData, rescheduledPeriod: Number(e.target.value) })}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded p-1.5 text-xs bg-white dark:bg-slate-800"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                        <option key={p} value={p}>ម៉ោងទី {p} ({p <= 4 ? 'ព្រឹក' : 'រសៀល'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-600 dark:text-slate-400">គ្រូជំនួស (បើមាន)</label>
                    <select
                      value={formData.substituteTeacherId || ''}
                      onChange={(e) => setFormData({ ...formData, substituteTeacherId: e.target.value })}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded p-1.5 text-xs bg-white dark:bg-slate-800"
                    >
                      <option value="">គ្រូដើមដដែល</option>
                      {teachers.map(t => (
                        <option key={t.teacherId} value={t.teacherId}>{t.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">មូលហេតុនៃការខកខាន</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="ឧ. ឈប់សម្រាកព្យាបាលជំងឺ, បេសកកម្មក្រៅ..."
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-slate-900">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                បោះបង់
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                រក្សាទុកកាលវិភាគ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
