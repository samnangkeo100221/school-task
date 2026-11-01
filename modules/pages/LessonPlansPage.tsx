import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Edit3,
  CheckCircle2,
  Clock,
  BookOpen,
  School,
  Calendar,
  Layers,
  Copy,
  Download
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { LessonPlan, ScheduledLesson, ClassRoom, Subject } from '../types';
import { Modal } from '../components/common/Modal';

export const LessonPlansPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Modal
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [planToPrint, setPlanToPrint] = useState<LessonPlan | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plans, sessions, cls, subs] = await Promise.all([
        storageService.getLessonPlans(activeAcademicYear?.academicYearId),
        storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
        storageService.getClasses(),
        storageService.getSubjects()
      ]);
      setLessonPlans(plans);
      setScheduledLessons(sessions);
      setClasses(cls);
      setSubjects(subs);
    } catch (err) {
      console.error('Failed to load lesson plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  const filteredPlans = lessonPlans.filter(p => {
    if (selectedClassId !== 'all' && p.classId !== selectedClassId) return false;
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.topic.toLowerCase().includes(q) || p.date.includes(q);
    }
    return true;
  });

  const handleOpenNewFromSession = (session: ScheduledLesson) => {
    const newPlan: LessonPlan = {
      lessonPlanId: `LP-${session.scheduledLessonId}`,
      scheduledLessonId: session.scheduledLessonId,
      academicYearId: session.academicYearId,
      teacherId: session.teacherId,
      classId: session.classId,
      subjectId: session.subjectId,
      date: session.date,
      topic: `${session.chapterTitle} - ${session.lessonTitle} (${session.topicTitle})`,
      objectives: {
        knowledge: 'សិស្សកំណត់បាននូវខ្លឹមសារសំខាន់នៃមេរៀនបានត្រឹមត្រូវ។',
        skills: 'សិស្សអនុវត្តដោះស្រាយលំហាត់គំរូបានច្បាស់លាស់។',
        attitude: 'សិស្សចូលរួមសហការជាក្រុម និងមានស្មារតីទទួលខុសត្រូវខ្ពស់។'
      },
      teachingMaterials: 'សៀវភៅពុម្ពគណិតវិទ្យាថ្នាក់ទី ៨, បន្ទាត់វែង, ហ្វឺត, ក្រដាសរូបភាពគំរូ។',
      teachingMethods: 'វិធីសាស្ត្របង្រៀនតាមបែបសកម្ម (Active Learning), ពិភាក្សាដៃគូ, ធ្វើលំហាត់ជាក់ស្តែង។',
      steps: {
        step1Introduction: {
          teacherActivity: 'ពិនិត្យអនាម័យ វត្តមាន និងរៀបចំសណ្តាប់ធ្នាប់ក្នុងថ្នាក់។',
          studentActivity: 'ប្រធានថ្នាក់រាយការណ៍វត្តមាន និងត្រៀមសម្ភារៈសិក្សា។',
          timeMinutes: 5
        },
        step2Review: {
          teacherActivity: 'រំលឹកមេរៀនចាស់ ដោយហៅសិស្សឡើងដោះស្រាយលំហាត់លើក្តារខៀន។',
          studentActivity: 'សិស្សឡើងធ្វើលំហាត់ និងផ្ទៀងផ្ទាត់ចម្លើយ។',
          timeMinutes: 5
        },
        step3NewLesson: {
          teacherActivity: 'ពន្យល់ទ្រឹស្តី និងលើកឧទាហរណ៍ជាក់ស្តែងទាក់ទងនឹងប្រធានបទមេរៀន។ ដាក់លំហាត់គំរូនាំសិស្សដោះស្រាយ។',
          studentActivity: 'សិស្សស្តាប់ការបកស្រាយ កត់ត្រាមេរៀន និងចូលរួមឆ្លើយសំណួរ។',
          timeMinutes: 25
        },
        step4Strengthening: {
          teacherActivity: 'ចែកសិស្សជាក្រុម និងដាក់លំហាត់ប្រតិបត្តិឱ្យសិស្សពិភាក្សា។ ដើរជួយសម្របសម្រួល។',
          studentActivity: 'សិស្សពិភាក្សាក្នុងក្រុម និងរាយការណ៍លទ្ធផល។',
          timeMinutes: 10
        },
        step5AssessmentHomework: {
          teacherActivity: 'វាយតម្លៃការយល់ដឹងសិស្សតាមសំណួរខ្លីៗ។ ដាក់កិច្ចការផ្ទះ។',
          studentActivity: 'សិស្សឆ្លើយសំណួរ និងកត់ត្រាកិច្ចការផ្ទះចូលសៀវភៅ។',
          timeMinutes: 5
        }
      },
      assessment: 'តាមរយៈការសង្កេតផ្ទាល់ និងការឆ្លើយសំណួរបានត្រឹមត្រូវយ៉ាងតិច ៨០% នៃសិស្ស។',
      homework: 'លំហាត់ប្រតិបត្តិក្នុងសៀវភៅពុម្ពទំព័រពាក់ព័ន្ធ។',
      notes: '',
      status: 'prepared',
      updatedAt: new Date().toISOString()
    };

    setEditingPlan(newPlan);
    setShowEditorModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const planToSave = {
        ...editingPlan,
        updatedAt: new Date().toISOString()
      };
      await storageService.saveLessonPlan(planToSave);
      await loadData();
      setShowEditorModal(false);
      addToast('success', 'បានរក្សាទុកកិច្ចតែងការបង្រៀន', planToSave.topic);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>កិច្ចតែងការបង្រៀន ៥ ជំហាន (MoEYS Lesson Plans)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            រៀបចំ និងកែសម្រួលកិច្ចតែងការបង្រៀនស្តង់ដារក្រសួងអប់រំ យុវជន និងកីឡា
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const firstSession = scheduledLessons[0];
              if (firstSession) handleOpenNewFromSession(firstSession);
              else addToast('warning', 'សូមបង្កើតកាលវិភាគបង្រៀនជាមុនសិន');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>បង្កើតកិច្ចតែងការថ្មី</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមប្រធានបទមេរៀន ឬកាលបរិច្ឆេទ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">គ្រប់ថ្នាក់រៀន</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">គ្រប់ស្ថានភាព</option>
            <option value="prepared">បានរៀបចំ (Prepared)</option>
            <option value="taught">បានបង្រៀនរួច (Taught)</option>
            <option value="draft">ព្រាង (Draft)</option>
          </select>
        </div>

        <span className="text-xs text-slate-500">
          មាន {filteredPlans.length} កិច្ចតែងការ
        </span>
      </div>

      {/* Lesson Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.map((plan) => {
          const cls = classes.find(c => c.classId === plan.classId);
          return (
            <div
              key={plan.lessonPlanId}
              className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    ថ្នាក់ {cls?.className || plan.classId}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    plan.status === 'taught'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : plan.status === 'prepared'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {plan.status === 'taught' ? '✓ បានបង្រៀន' : plan.status === 'prepared' ? 'បានរៀបចំ' : 'ព្រាង'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                  {plan.topic}
                </h3>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <p><span className="font-semibold text-slate-400">កាលបរិច្ឆេទ៖</span> {plan.date}</p>
                  <p className="line-clamp-2"><span className="font-semibold text-slate-400">វត្ថុបំណង៖</span> {plan.objectives?.knowledge}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  ៥ ជំហាន MoEYS
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setPlanToPrint(plan);
                      setShowPrintModal(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900"
                    title="បោះពុម្ព / មើលគំរូ"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowEditorModal(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>កែសម្រួល</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      {editingPlan && (
        <Modal
          isOpen={showEditorModal}
          onClose={() => setShowEditorModal(false)}
          title="កិច្ចតែងការបង្រៀនគំរូ ៥ ជំហាន (MoEYS Standard)"
          maxWidth="4xl"
        >
          <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">កាលបរិច្ឆេទ</label>
                <input
                  type="date"
                  value={editingPlan.date}
                  onChange={(e) => setEditingPlan({ ...editingPlan, date: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">ថ្នាក់រៀន</label>
                <select
                  value={editingPlan.classId}
                  onChange={(e) => setEditingPlan({ ...editingPlan, classId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                >
                  {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">ស្ថានភាព</label>
                <select
                  value={editingPlan.status}
                  onChange={(e) => setEditingPlan({ ...editingPlan, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                >
                  <option value="draft">ព្រាង (Draft)</option>
                  <option value="prepared">បានរៀបចំ (Prepared)</option>
                  <option value="taught">បានបង្រៀនរួច (Taught)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                ប្រធានបទមេរៀន *
              </label>
              <input
                type="text"
                value={editingPlan.topic}
                onChange={(e) => setEditingPlan({ ...editingPlan, topic: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
                required
              />
            </div>

            {/* Objectives */}
            <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
              <span className="font-bold text-blue-700 dark:text-blue-400">វត្ថុបំណងមេរៀន (Objectives)</span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="ចំណេះដឹង (Knowledge)..."
                  value={editingPlan.objectives.knowledge}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    objectives: { ...editingPlan.objectives, knowledge: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  placeholder="បំណិន (Skills)..."
                  value={editingPlan.objectives.skills}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    objectives: { ...editingPlan.objectives, skills: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  placeholder="ឥរិយាបថ (Attitude)..."
                  value={editingPlan.objectives.attitude}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    objectives: { ...editingPlan.objectives, attitude: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* 5-Step Procedures Table */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 dark:text-white">ដំណើរការបង្រៀន ៥ ជំហាន (5 Steps of Teaching)</span>
              
              {/* Step 1 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>ជំហានទី ១៖ ទំនាក់ទំនង ឬរៀបចំថ្នាក់ (៥ នាទី)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step1Introduction.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step1Introduction: { ...editingPlan.steps.step1Introduction, teacherActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step1Introduction.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step1Introduction: { ...editingPlan.steps.step1Introduction, studentActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>ជំហានទី ២៖ រំលឹកមេរៀនចាស់ (៥ នាទី)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step2Review.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step2Review: { ...editingPlan.steps.step2Review, teacherActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step2Review.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step2Review: { ...editingPlan.steps.step2Review, studentActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>ជំហានទី ៣៖ មេរៀនថ្មី (២៥ នាទី)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={3}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step3NewLesson.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step3NewLesson: { ...editingPlan.steps.step3NewLesson, teacherActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <textarea
                    rows={3}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step3NewLesson.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step3NewLesson: { ...editingPlan.steps.step3NewLesson, studentActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>ជំហានទី ៤៖ ពង្រឹងពុទ្ធិ (១០ នាទី)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step4Strengthening.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step4Strengthening: { ...editingPlan.steps.step4Strengthening, teacherActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step4Strengthening.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step4Strengthening: { ...editingPlan.steps.step4Strengthening, studentActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>ជំហានទី ៥៖ វាយតម្លៃ និងកិច្ចការផ្ទះ (៥ នាទី)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step5AssessmentHomework.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step5AssessmentHomework: { ...editingPlan.steps.step5AssessmentHomework, teacherActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step5AssessmentHomework.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: {
                        ...editingPlan.steps,
                        step5AssessmentHomework: { ...editingPlan.steps.step5AssessmentHomework, studentActivity: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                រក្សាទុកកិច្ចតែងការ
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Print View Modal */}
      {planToPrint && (
        <Modal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`បោះពុម្ពកិច្ចតែងការបង្រៀន - ${planToPrint.date}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 p-4 bg-white text-slate-900 text-xs">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="font-bold text-sm tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</h2>
              <p className="font-semibold text-xs">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
              <div className="pt-2 text-left">
                <p className="font-semibold">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
                <p className="font-semibold">វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង</p>
              </div>
              <h1 className="text-base font-black pt-2">កិច្ចតែងការបង្រៀនគណិតវិទ្យា ថ្នាក់ទី ៨</h1>
            </div>

            <div className="grid grid-cols-2 gap-2 border-y py-2 border-slate-300">
              <div>
                <p><span className="font-bold">កាលបរិច្ឆេទ៖</span> {planToPrint.date}</p>
                <p><span className="font-bold">គ្រូបង្រៀន៖</span> លោកគ្រូ កែវ សំណាង</p>
              </div>
              <div>
                <p><span className="font-bold">ថ្នាក់រៀន៖</span> {classes.find(c => c.classId === planToPrint.classId)?.className}</p>
                <p><span className="font-bold">រយៈពេល៖</span> ៥០ នាទី (១ ម៉ោងសិក្សា)</p>
              </div>
            </div>

            <div>
              <p className="font-bold text-sm mb-1">{planToPrint.topic}</p>
              <div className="pl-4 space-y-0.5">
                <p><span className="font-bold">ចំណេះដឹង៖</span> {planToPrint.objectives?.knowledge}</p>
                <p><span className="font-bold">បំណិន៖</span> {planToPrint.objectives?.skills}</p>
                <p><span className="font-bold">ឥរិយាបថ៖</span> {planToPrint.objectives?.attitude}</p>
              </div>
            </div>

            {/* Print Table */}
            <table className="w-full border border-slate-400 text-left">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400">
                  <th className="p-2 border-r border-slate-400 w-28">ជំហានបង្រៀន</th>
                  <th className="p-2 border-r border-slate-400">សកម្មភាពគ្រូ</th>
                  <th className="p-2 border-r border-slate-400">សកម្មភាពសិស្ស</th>
                  <th className="p-2 w-16 text-center">រយៈពេល</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="p-2 font-bold border-r border-slate-400">ជំហានទី ១ (រៀបចំ)</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step1Introduction?.teacherActivity}</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step1Introduction?.studentActivity}</td>
                  <td className="p-2 text-center">៥ នាទី</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border-r border-slate-400">ជំហានទី ២ (រំលឹក)</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step2Review?.teacherActivity}</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step2Review?.studentActivity}</td>
                  <td className="p-2 text-center">៥ នាទី</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border-r border-slate-400">ជំហានទី ៣ (មេរៀនថ្មី)</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step3NewLesson?.teacherActivity}</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step3NewLesson?.studentActivity}</td>
                  <td className="p-2 text-center">២៥ នាទី</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border-r border-slate-400">ជំហានទី ៤ (ពង្រឹង)</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step4Strengthening?.teacherActivity}</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step4Strengthening?.studentActivity}</td>
                  <td className="p-2 text-center">១០ នាទី</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold border-r border-slate-400">ជំហានទី ៥ (វាយតម្លៃ)</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step5AssessmentHomework?.teacherActivity}</td>
                  <td className="p-2 border-r border-slate-400">{planToPrint.steps?.step5AssessmentHomework?.studentActivity}</td>
                  <td className="p-2 text-center">៥ នាទី</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>បោះពុម្ពកិច្ចតែងការនេះ</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
