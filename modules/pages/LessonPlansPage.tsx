import React, { useEffect, useState, useMemo } from 'react';
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
  Download,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  BookMarked
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { LessonPlan, ScheduledLesson, ClassRoom, Subject, CurriculumItem } from '../types';
import { Modal } from '../components/common/Modal';
import { useSearchParams } from 'react-router-dom';

export const LessonPlansPage: React.FC = () => {
  const { activeAcademicYear, schoolSettings, addToast } = useApp();
  const [searchParams] = useSearchParams();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [scheduledLessons, setScheduledLessons] = useState<ScheduledLesson[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'full' (កិច្ចតែងការពេញលេញសម្រាប់បង្រៀន) vs 'cards' (កាតសង្ខេប)
  const [viewMode, setViewMode] = useState<'full' | 'cards'>('full');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => searchParams.get('planId') || null);

  // Filters
  const [selectedChapter, setSelectedChapter] = useState<string>(() => searchParams.get('chapter') || 'all');
  const [selectedLesson, setSelectedLesson] = useState<string>(() => searchParams.get('lesson') || 'all'); // Filter by Lesson
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editor Modal
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [planToPrint, setPlanToPrint] = useState<LessonPlan | null>(null);

  // Presentation / Fullscreen teaching mode
  const [isFullscreenTeaching, setIsFullscreenTeaching] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plans, cur, sessions, cls, subs] = await Promise.all([
        storageService.getLessonPlans(),
        storageService.getCurriculum(activeAcademicYear?.academicYearId),
        storageService.getScheduledLessons(activeAcademicYear?.academicYearId),
        storageService.getClasses(),
        storageService.getSubjects()
      ]);
      setLessonPlans(plans);
      setCurriculum(cur);
      setScheduledLessons(sessions);
      setClasses(cls);
      setSubjects(subs);

      if (plans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plans[0].lessonPlanId);
      }
    } catch (err) {
      console.error('Failed to load lesson plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  // Handle URL params for curriculumId, planId, chapter, lesson
  useEffect(() => {
    if (loading || lessonPlans.length === 0) return;
    const targetPlanId = searchParams.get('planId');
    const targetCurriculumId = searchParams.get('curriculumId');
    const targetChapter = searchParams.get('chapter');
    const targetLesson = searchParams.get('lesson');

    if (targetChapter && targetChapter !== selectedChapter) setSelectedChapter(targetChapter);
    if (targetLesson && targetLesson !== selectedLesson) setSelectedLesson(targetLesson);

    if (targetPlanId) {
      const found = lessonPlans.find(p => p.lessonPlanId === targetPlanId);
      if (found) setSelectedPlanId(found.lessonPlanId);
    } else if (targetCurriculumId) {
      const found = lessonPlans.find(p => p.curriculumId === targetCurriculumId);
      if (found) {
        setSelectedPlanId(found.lessonPlanId);
        if (found.chapterTitle) setSelectedChapter(found.chapterTitle);
        if (found.lessonTitle) setSelectedLesson(found.lessonTitle);
      }
    }
  }, [loading, searchParams, lessonPlans]);

  // Extract distinct Chapters from curriculum and lesson plans
  const chapterList = useMemo(() => {
    const set = new Set<string>();
    curriculum.forEach(c => {
      if (c.chapterTitle) set.add(c.chapterTitle);
    });
    lessonPlans.forEach(p => {
      if (p.chapterTitle) set.add(p.chapterTitle);
      else if (p.topic.includes('ជំពូកទី')) {
        const match = p.topic.match(/ជំពូកទី\s*[^\-]+/);
        if (match) set.add(match[0].trim());
      }
    });
    return Array.from(set);
  }, [curriculum, lessonPlans]);

  // Extract distinct Lessons based on selectedChapter or all
  const lessonList = useMemo(() => {
    const map = new Map<string, { lessonTitle: string; chapterTitle: string }>();
    curriculum.forEach(c => {
      if (selectedChapter === 'all' || c.chapterTitle === selectedChapter) {
        const key = `${c.chapterTitle} - ${c.lessonTitle}`;
        if (!map.has(key)) {
          map.set(key, { lessonTitle: c.lessonTitle, chapterTitle: c.chapterTitle });
        }
      }
    });
    lessonPlans.forEach(p => {
      if (p.lessonTitle && (selectedChapter === 'all' || p.chapterTitle === selectedChapter)) {
        const key = `${p.chapterTitle || ''} - ${p.lessonTitle}`;
        if (!map.has(key)) {
          map.set(key, { lessonTitle: p.lessonTitle, chapterTitle: p.chapterTitle || '' });
        }
      }
    });
    return Array.from(map.values());
  }, [curriculum, lessonPlans, selectedChapter]);

  // Filtered Lesson Plans
  const filteredPlans = useMemo(() => {
    return lessonPlans.filter(p => {
      // Filter by Class
      if (selectedClassId !== 'all' && p.classId !== selectedClassId) return false;
      // Filter by Status
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;

      // Filter by Chapter
      if (selectedChapter !== 'all') {
        const matchesChapter =
          p.chapterTitle === selectedChapter ||
          p.topic.includes(selectedChapter) ||
          (p.curriculumId && curriculum.find(c => c.curriculumId === p.curriculumId)?.chapterTitle === selectedChapter);
        if (!matchesChapter) return false;
      }

      // Filter by Lesson (តម្រង តាមមេរៀន)
      if (selectedLesson !== 'all') {
        const matchesLesson =
          p.lessonTitle === selectedLesson ||
          p.topic.includes(selectedLesson) ||
          (p.curriculumId && curriculum.find(c => c.curriculumId === p.curriculumId)?.lessonTitle === selectedLesson);
        if (!matchesLesson) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullContent = `
          ${p.topic} ${p.chapterTitle || ''} ${p.lessonTitle || ''} ${p.topicTitle || ''} 
          ${p.date} ${p.objectives?.knowledge || ''} ${p.objectives?.skills || ''}
        `.toLowerCase();
        return fullContent.includes(q);
      }
      return true;
    });
  }, [lessonPlans, selectedClassId, selectedStatus, selectedChapter, selectedLesson, searchQuery, curriculum]);

  // Currently active plan for Full Teaching View
  const activePlan = useMemo(() => {
    if (selectedPlanId) {
      const found = filteredPlans.find(p => p.lessonPlanId === selectedPlanId);
      if (found) return found;
    }
    return filteredPlans[0] || lessonPlans[0] || null;
  }, [filteredPlans, selectedPlanId, lessonPlans]);

  const activePlanIndex = useMemo(() => {
    if (!activePlan) return -1;
    return filteredPlans.findIndex(p => p.lessonPlanId === activePlan.lessonPlanId);
  }, [filteredPlans, activePlan]);

  const handleSelectPlan = (plan: LessonPlan) => {
    setSelectedPlanId(plan.lessonPlanId);
    setViewMode('full');
  };

  const handlePrevPlan = () => {
    if (activePlanIndex > 0) {
      setSelectedPlanId(filteredPlans[activePlanIndex - 1].lessonPlanId);
    }
  };

  const handleNextPlan = () => {
    if (activePlanIndex < filteredPlans.length - 1) {
      setSelectedPlanId(filteredPlans[activePlanIndex + 1].lessonPlanId);
    }
  };

  const handleCopyPlanText = (plan: LessonPlan) => {
    const text = `
កិច្ចតែងការបង្រៀនគណិតវិទ្យា ថ្នាក់ទី ៨
ប្រធានបទ៖ ${plan.topic}
កាលបរិច្ឆេទ៖ ${plan.date} | រយៈពេល៖ ៥០ នាទី
គ្រូបង្រៀន៖ លោកគ្រូ កែវ សំណាង | វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង

I. វត្ថុបំណង៖
- ចំណេះដឹង៖ ${plan.objectives.knowledge}
- បំណិន៖ ${plan.objectives.skills}
- ឥរិយាបថ៖ ${plan.objectives.attitude}

II. សម្ភារឧបទេស និងវិធីសាស្ត្រ៖
- សម្ភារ៖ ${plan.teachingMaterials}
- វិធីសាស្ត្រ៖ ${plan.teachingMethods}

III. ដំណើរការបង្រៀន (៥ ជំហាន)៖
១. ជំហានទី ១ (រៀបចំ ៥ នាទី)៖
   - គ្រូ៖ ${plan.steps.step1Introduction.teacherActivity}
   - សិស្ស៖ ${plan.steps.step1Introduction.studentActivity}
២. ជំហានទី ២ (រំលឹក ៥ នាទី)៖
   - គ្រូ៖ ${plan.steps.step2Review.teacherActivity}
   - សិស្ស៖ ${plan.steps.step2Review.studentActivity}
៣. ជំហានទី ៣ (មេរៀនថ្មី ២៥ នាទី)៖
   - គ្រូ៖ ${plan.steps.step3NewLesson.teacherActivity}
   - សិស្ស៖ ${plan.steps.step3NewLesson.studentActivity}
៤. ជំហានទី ៤ (ពង្រឹងពុទ្ធិ ១០ នាទី)៖
   - គ្រូ៖ ${plan.steps.step4Strengthening.teacherActivity}
   - សិស្ស៖ ${plan.steps.step4Strengthening.studentActivity}
៥. ជំហានទី ៥ (វាយតម្លៃ និងកិច្ចការផ្ទះ ៥ នាទី)៖
   - គ្រូ៖ ${plan.steps.step5AssessmentHomework.teacherActivity}
   - សិស្ស៖ ${plan.steps.step5AssessmentHomework.studentActivity}

IV. ការវាយតម្លៃ៖ ${plan.assessment}
V. កិច្ចការផ្ទះ៖ ${plan.homework}
`.trim();

    navigator.clipboard.writeText(text);
    addToast('success', 'បានចម្លងអត្ថបទកិច្ចតែងការ', 'អាចបិទភ្ជាប់ (Paste) ក្នុង Word ឬ Telegram បានភ្លាមៗ');
  };

  const handleOpenNewFromSession = (session: ScheduledLesson) => {
    const newPlan: LessonPlan = {
      lessonPlanId: `LP-${Date.now()}`,
      scheduledLessonId: session.scheduledLessonId,
      academicYearId: session.academicYearId,
      teacherId: session.teacherId,
      classId: session.classId,
      subjectId: session.subjectId,
      date: session.date,
      chapterTitle: session.chapterTitle,
      lessonTitle: session.lessonTitle,
      topicTitle: session.topicTitle,
      topic: `${session.chapterTitle} - ${session.lessonTitle} (${session.topicTitle})`,
      durationMinutes: 50,
      grade: 8,
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
      setSelectedPlanId(planToSave.lessonPlanId);
      addToast('success', 'បានរក្សាទុកកិច្ចតែងការបង្រៀន', planToSave.topic);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  return (
    <div className={`space-y-6 ${isFullscreenTeaching ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 warm:bg-[#fffdf9] p-6 overflow-y-auto' : ''}`}>
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 warm:bg-[#eee6d3] warm:text-[#78350f]">
              ស្តង់ដារ ៥ ជំហាន MoEYS
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              គណិតវិទ្យា ថ្នាក់ទី ៨
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 warm:text-[#2b251f] mt-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]" />
            <span>កិច្ចតែងការបង្រៀនសម្រាប់បង្រៀនក្នុងថ្នាក់</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#786f60] mt-0.5">
            បង្ហាញពេញលេញតាមរចនាសម្ព័ន្ធក្រសួងអប់រំ យុវជន និងកីឡា សម្រាប់លោកគ្រូ កែវ សំណាង
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 warm:bg-[#eee6d3] border border-slate-200/80 dark:border-slate-700/80 warm:border-[#dfd4bf]">
            <button
              onClick={() => setViewMode('full')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'full'
                  ? 'bg-white dark:bg-slate-900 warm:bg-[#fffdf9] text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>បង្ហាញពេញលេញ (Full Plan)</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 warm:bg-[#fffdf9] text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>កាតសង្ខេប ({filteredPlans.length})</span>
            </button>
          </div>

          {/* Fullscreen Teaching Mode Button */}
          <button
            onClick={() => setIsFullscreenTeaching(!isFullscreenTeaching)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] bg-white dark:bg-slate-800 warm:bg-[#fffdf9] text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            title={isFullscreenTeaching ? 'ចេញពីរបៀបពេញអេក្រង់' : 'របៀបពេញអេក្រង់បង្រៀន'}
          >
            {isFullscreenTeaching ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Create New Plan Button */}
          <button
            onClick={() => {
              const firstSession = scheduledLessons[0];
              if (firstSession) handleOpenNewFromSession(firstSession);
              else {
                // Generic new plan
                setEditingPlan({
                  lessonPlanId: `LP-${Date.now()}`,
                  scheduledLessonId: 'SCH-NEW',
                  academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
                  teacherId: 'T-001',
                  classId: classes[0]?.classId || 'CLS-8A',
                  subjectId: 'SUB-MATH-8',
                  date: new Date().toISOString().split('T')[0],
                  topic: 'មេរៀនថ្មី គណិតវិទ្យាថ្នាក់ទី ៨',
                  durationMinutes: 50,
                  grade: 8,
                  objectives: {
                    knowledge: 'សិស្សកំណត់បាននូវខ្លឹមសារសំខាន់នៃមេរៀន។',
                    skills: 'សិស្សអនុវត្តដោះស្រាយលំហាត់បានត្រឹមត្រូវ។',
                    attitude: 'សិស្សចូលរួមសហការ និងមានទំនួលខុសត្រូវ។'
                  },
                  teachingMaterials: 'សៀវភៅពុម្ពគណិតវិទ្យាទី ៨, បន្ទាត់វែង, ក្តារខៀន, ហ្វឺត។',
                  teachingMethods: 'វិធីសាស្ត្របង្រៀនបែបសកម្ម, សំណួរ-ចម្លើយ, ពិភាក្សាដៃគូ។',
                  steps: {
                    step1Introduction: { teacherActivity: 'ពិនិត្យអនាម័យ វត្តមាន និងរៀបចំសណ្តាប់ធ្នាប់។', studentActivity: 'ប្រធានថ្នាក់រាយការណ៍វត្តមាន។', timeMinutes: 5 },
                    step2Review: { teacherActivity: 'រំលឹកមេរៀនចាស់ ដោយហៅសិស្សឡើងធ្វើលំហាត់។', studentActivity: 'សិស្សឡើងដោះស្រាយ និងផ្ទៀងផ្ទាត់។', timeMinutes: 5 },
                    step3NewLesson: { teacherActivity: 'ពន្យល់ទ្រឹស្តី និងលើកឧទាហរណ៍គំរូ។', studentActivity: 'សិស្សកត់ត្រា និងចូលរួមឆ្លើយ។', timeMinutes: 25 },
                    step4Strengthening: { teacherActivity: 'ដាក់លំហាត់ប្រតិបត្តិជាក្រុម។', studentActivity: 'សិស្សធ្វើលំហាត់ និងរាយការណ៍លទ្ធផល។', timeMinutes: 10 },
                    step5AssessmentHomework: { teacherActivity: 'សួរសំណួរវាយតម្លៃ និងដាក់កិច្ចការផ្ទះ។', studentActivity: 'សិស្សកត់កិច្ចការផ្ទះ។', timeMinutes: 5 }
                  },
                  assessment: 'សង្កេតការយល់ដឹង និងការឆ្លើយសំណួររបស់សិស្ស។',
                  homework: 'លំហាត់ក្នុងសៀវភៅពុម្ព។',
                  status: 'prepared',
                  updatedAt: new Date().toISOString()
                });
                setShowEditorModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 warm:bg-[#b45309] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>បង្កើតកិច្ចតែងការថ្មី</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR - Comprehensive Filters by Lesson, Chapter, Class, and Status */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 warm:bg-[#fffdf9] border border-slate-200/80 dark:border-slate-700/80 warm:border-[#dfd4bf] shadow-xs space-y-3">
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* 1. Search */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកខ្លឹមសារ ឬប្រធានបទ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl text-slate-800 dark:text-slate-200 font-medium"
            />
          </div>

          {/* 2. Filter by Chapter (តម្រងតាមជំពូក) */}
          <div>
            <select
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(e.target.value);
                setSelectedLesson('all'); // Reset lesson filter when chapter changes
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="all">📚 គ្រប់ជំពូក ({chapterList.length})</option>
              {chapterList.map((chap, idx) => (
                <option key={idx} value={chap}>{chap}</option>
              ))}
            </select>
          </div>

          {/* 3. Filter by Lesson (តម្រងតាមមេរៀន - User's Primary Request) */}
          <div className="lg:col-span-1">
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl text-indigo-700 dark:text-indigo-300 warm:text-[#b45309] font-bold"
            >
              <option value="all">📖 គ្រប់មេរៀន ({lessonList.length})</option>
              {lessonList.map((item, idx) => (
                <option key={idx} value={item.lessonTitle}>
                  {item.lessonTitle}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filter by Class */}
          <div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="all">🏫 គ្រប់ថ្នាក់ (៨ក, ៨ខ, ៨គ, ៨ឃ)</option>
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>ថ្នាក់ {c.className}</option>
              ))}
            </select>
          </div>

          {/* 5. Filter by Status */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="all">✨ គ្រប់ស្ថានភាព</option>
              <option value="prepared">បានរៀបចំ (Prepared)</option>
              <option value="taught">បានបង្រៀនរួច (Taught)</option>
              <option value="draft">ព្រាង (Draft)</option>
            </select>

            {(selectedChapter !== 'all' || selectedLesson !== 'all' || selectedClassId !== 'all' || selectedStatus !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedChapter('all');
                  setSelectedLesson('all');
                  setSelectedClassId('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                title="សម្អាតតម្រងទាំងអស់"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Quick Chapter Pill Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-400 font-bold shrink-0">ជំពូករហ័ស៖</span>
          <button
            onClick={() => {
              setSelectedChapter('all');
              setSelectedLesson('all');
            }}
            className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition-colors ${
              selectedChapter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ទាំងអស់ ({lessonPlans.length})
          </button>
          {chapterList.map((chap, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedChapter(chap);
                setSelectedLesson('all');
              }}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                selectedChapter === chap
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {chap.split('៖')[0] || chap}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN VIEW AREA */}
      {viewMode === 'full' && activePlan ? (
        /* ================= FULL TEACHING LESSON PLAN VIEW ================= */
        <div className="space-y-4">
          {/* Lesson Navigator & Action Toolbar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 warm:bg-[#fffdf9] border border-slate-200/80 dark:border-slate-700/80 warm:border-[#dfd4bf] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Prev / Next Plan Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPlan}
                disabled={activePlanIndex <= 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">មេរៀនមុន</span>
              </button>

              <span className="text-slate-500 font-medium px-1">
                មេរៀនទី <span className="font-bold text-slate-900 dark:text-white warm:text-[#2b251f]">{activePlanIndex + 1}</span> / {filteredPlans.length}
              </span>

              <button
                onClick={handleNextPlan}
                disabled={activePlanIndex >= filteredPlans.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <span className="hidden sm:inline">មេរៀនបន្ទាប់</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Switch Dropdown */}
            <div className="flex-1 max-w-sm hidden md:block">
              <select
                value={activePlan.lessonPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl font-bold text-indigo-700 dark:text-indigo-300 warm:text-[#b45309] truncate"
              >
                {filteredPlans.map((p, idx) => (
                  <option key={p.lessonPlanId} value={p.lessonPlanId}>
                    {idx + 1}. {p.topic} ({p.date})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons: Print, Copy, Edit */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyPlanText(activePlan)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors"
                title="ចម្លងអត្ថបទកិច្ចតែងការ"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ចម្លងអត្ថបទ</span>
              </button>

              <button
                onClick={() => {
                  setPlanToPrint(activePlan);
                  setShowPrintModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 warm:bg-[#eee6d3] warm:text-[#78350f] font-bold hover:bg-indigo-100 transition-colors"
                title="បោះពុម្ពកិច្ចតែងការផ្លូវការ"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>បោះពុម្ព / A4 PDF</span>
              </button>

              <button
                onClick={() => {
                  setEditingPlan(activePlan);
                  setShowEditorModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 warm:bg-[#b45309] text-white font-bold hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>កែសម្រួល</span>
              </button>
            </div>
          </div>

          {/* OFFICIAL COMPLETE LESSON PLAN SHEET (ក្រដាសកិច្ចតែងការបង្រៀនផ្លូវការពេញលេញ) */}
          <div className="bg-white dark:bg-slate-900 warm:bg-[#fffdfa] rounded-3xl border border-slate-200/90 dark:border-slate-700/80 warm:border-[#dfd4bf] shadow-sm p-6 lg:p-10 text-slate-900 dark:text-slate-100 warm:text-[#2b251f] space-y-6">
            {/* Header: Kingdom of Cambodia & School Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 warm:border-[#dfd4bf] pb-6 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4">
                {/* Left School Info */}
                <div className="space-y-0.5">
                  <p className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 warm:text-[#786f60]">
                    ក្រសួងអប់រំ យុវជន និងកីឡា
                  </p>
                  <p className="font-bold text-sm text-indigo-700 dark:text-indigo-400 warm:text-[#b45309]">
                    {schoolSettings?.schoolNameKm || 'វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ឆ្នាំសិក្សា ២០២៥-២០២៦ (៣៨ សប្តាហ៍បង្រៀន)
                  </p>
                </div>

                {/* Center / Right Kingdom Motto */}
                <div className="text-center space-y-0.5">
                  <p className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-200">
                    ព្រះរាជាណាចក្រកម្ពុជា
                  </p>
                  <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                    ជាតិ សាសនា ព្រះមហាក្សត្រ
                  </p>
                  <div className="w-16 h-0.5 bg-amber-500 mx-auto mt-1 rounded-full" />
                </div>
              </div>

              {/* Lesson Plan Main Title */}
              <div className="text-center pt-3">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-indigo-900 dark:text-indigo-300 warm:text-[#78350f]">
                  កិច្ចតែងការបង្រៀនគណិតវិទ្យា ថ្នាក់ទី ៨ (MoEYS Standard)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ទម្រង់ស្តង់ដារ ៥ ជំហានសម្រាប់ការបង្រៀនជាក់ស្តែងក្នុងថ្នាក់រៀន
                </p>
              </div>
            </div>

            {/* General Lesson Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 warm:bg-[#f7f3e9] border border-slate-200/80 dark:border-slate-700/80 warm:border-[#dfd4bf] text-xs">
              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase">កាលបរិច្ឆេទបង្រៀន</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{activePlan.date}</span>
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase">ថ្នាក់រៀនទទួលបន្ទុក</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] mt-0.5 flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ថ្នាក់ {classes.find(c => c.classId === activePlan.classId)?.className || '៨ក'}</span>
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase">គ្រូបង្រៀន</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] mt-0.5">
                  លោកគ្រូ កែវ សំណាង
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase">រយៈពេលបង្រៀន</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{activePlan.durationMinutes || 50} នាទី (១ ម៉ោង)</span>
                </p>
              </div>
            </div>

            {/* Lesson Topic & Focus Header */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 warm:bg-[#eee6d3]/60 border border-indigo-100 dark:border-indigo-900/40 warm:border-[#dfd4bf]">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] uppercase tracking-wider">
                ប្រធានបទមេរៀន / ខ្លឹមសារបង្រៀន
              </span>
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white warm:text-[#2b251f] mt-1 leading-snug">
                {activePlan.topic}
              </h3>
            </div>

            {/* I. Objectives (វត្ថុបំណង ៣ វិស័យ) */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 warm:text-[#b45309] flex items-center gap-1.5">
                <BookMarked className="w-4 h-4" />
                <span>I. វត្ថុបំណងមេរៀន (Learning Objectives)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 warm:bg-[#f7f3e9] border border-slate-200/80 dark:border-slate-700 warm:border-[#dfd4bf]">
                  <p className="font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>ចំណេះដឹង (Knowledge)</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 warm:text-[#524a3e] leading-relaxed">
                    {activePlan.objectives.knowledge}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 warm:bg-[#f7f3e9] border border-slate-200/80 dark:border-slate-700 warm:border-[#dfd4bf]">
                  <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>បំណិន (Skills)</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 warm:text-[#524a3e] leading-relaxed">
                    {activePlan.objectives.skills}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 warm:bg-[#f7f3e9] border border-slate-200/80 dark:border-slate-700 warm:border-[#dfd4bf]">
                  <p className="font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>ឥរិយាបថ (Attitude)</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 warm:text-[#524a3e] leading-relaxed">
                    {activePlan.objectives.attitude}
                  </p>
                </div>
              </div>
            </div>

            {/* II. Teaching Materials & Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 warm:bg-[#f7f3e9] border border-slate-200/80 dark:border-slate-700 warm:border-[#dfd4bf]">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] mb-1">
                  II. សម្ភារឧបទេស (Teaching Materials)
                </h5>
                <p className="text-slate-600 dark:text-slate-400 warm:text-[#524a3e] leading-relaxed">
                  {activePlan.teachingMaterials}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 warm:bg-[#f7f3e9] border border-slate-200/80 dark:border-slate-700 warm:border-[#dfd4bf]">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] mb-1">
                  III. វិធីសាស្ត្របង្រៀន (Teaching Methods)
                </h5>
                <p className="text-slate-600 dark:text-slate-400 warm:text-[#524a3e] leading-relaxed">
                  {activePlan.teachingMethods}
                </p>
              </div>
            </div>

            {/* III. Complete 5-Step Teaching Process Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400 warm:text-[#b45309] flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>IV. ដំណើរការបង្រៀន និងរៀន ៥ ជំហាន (5-Step Teaching Procedure)</span>
              </h4>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] overflow-hidden text-xs">
                <table className="w-full text-left divide-y divide-slate-200 dark:divide-slate-700 warm:divide-[#dfd4bf]">
                  <thead className="bg-slate-100 dark:bg-slate-800 warm:bg-[#eee6d3] font-bold text-slate-700 dark:text-slate-300 warm:text-[#2b251f]">
                    <tr>
                      <th className="p-3 w-40 border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf]">
                        ជំហានបង្រៀន (Steps)
                      </th>
                      <th className="p-3 border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf]">
                        សកម្មភាពគ្រូ (Teacher Activity)
                      </th>
                      <th className="p-3 border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf]">
                        សកម្មភាពសិស្ស (Student Activity)
                      </th>
                      <th className="p-3 w-20 text-center">រយៈពេល</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 warm:divide-[#dfd4bf]">
                    {/* Step 1 */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-400 warm:text-[#b45309] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf]">
                        ជំហានទី ១<br />
                        <span className="text-[11px] font-medium text-slate-500">រៀបចំ និងវត្តមាន</span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 warm:text-[#524a3e] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step1Introduction.teacherActivity}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 warm:text-[#524a3e] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step1Introduction.studentActivity}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-500 whitespace-nowrap">
                        {activePlan.steps.step1Introduction.timeMinutes} នាទី
                      </td>
                    </tr>

                    {/* Step 2 */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors bg-slate-50/30 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-400 warm:text-[#b45309] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf]">
                        ជំហានទី ២<br />
                        <span className="text-[11px] font-medium text-slate-500">រំលឹកមេរៀនចាស់</span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 warm:text-[#524a3e] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step2Review.teacherActivity}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 warm:text-[#524a3e] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step2Review.studentActivity}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-500 whitespace-nowrap">
                        {activePlan.steps.step2Review.timeMinutes} នាទី
                      </td>
                    </tr>

                    {/* Step 3 */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors bg-indigo-50/20 dark:bg-indigo-950/20">
                      <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-400 warm:text-[#b45309] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf]">
                        ជំហានទី ៣<br />
                        <span className="text-[11px] font-bold text-indigo-600">មេរៀនថ្មី (ទ្រឹស្តី/គំរូ)</span>
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200 warm:text-[#2b251f] font-medium border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step3NewLesson.teacherActivity}
                      </td>
                      <td className="p-3.5 text-slate-800 dark:text-slate-200 warm:text-[#2b251f] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step3NewLesson.studentActivity}
                      </td>
                      <td className="p-3.5 text-center font-bold text-indigo-600 whitespace-nowrap">
                        {activePlan.steps.step3NewLesson.timeMinutes} នាទី
                      </td>
                    </tr>

                    {/* Step 4 */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors bg-slate-50/30 dark:bg-slate-900/30">
                      <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-400 warm:text-[#b45309] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf]">
                        ជំហានទី ៤<br />
                        <span className="text-[11px] font-medium text-slate-500">ពង្រឹងពុទ្ធិ/លំហាត់</span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 warm:text-[#524a3e] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step4Strengthening.teacherActivity}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 warm:text-[#524a3e] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step4Strengthening.studentActivity}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-500 whitespace-nowrap">
                        {activePlan.steps.step4Strengthening.timeMinutes} នាទី
                      </td>
                    </tr>

                    {/* Step 5 */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-indigo-700 dark:text-indigo-400 warm:text-[#b45309] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf]">
                        ជំហានទី ៥<br />
                        <span className="text-[11px] font-medium text-slate-500">វាយតម្លៃ & កិច្ចការផ្ទះ</span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 warm:text-[#524a3e] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step5AssessmentHomework.teacherActivity}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 warm:text-[#524a3e] border-r border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] leading-relaxed">
                        {activePlan.steps.step5AssessmentHomework.studentActivity}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-500 whitespace-nowrap">
                        {activePlan.steps.step5AssessmentHomework.timeMinutes} នាទី
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* V. Assessment & Homework */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 warm:bg-[#f7f3e9] border border-slate-200/80 dark:border-slate-700 warm:border-[#dfd4bf]">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] mb-1">
                  V. ការវាយតម្លៃលទ្ធផលសិក្សា (Assessment)
                </h5>
                <p className="text-slate-600 dark:text-slate-400 warm:text-[#524a3e] leading-relaxed">
                  {activePlan.assessment}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 warm:bg-[#f7f3e9] border border-slate-200/80 dark:border-slate-700 warm:border-[#dfd4bf]">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] mb-1">
                  VI. កិច្ចការផ្ទះ និងការណែនាំបន្ត (Homework)
                </h5>
                <p className="text-slate-600 dark:text-slate-400 warm:text-[#524a3e] leading-relaxed">
                  {activePlan.homework}
                </p>
              </div>
            </div>

            {/* Notes / Reflections */}
            {activePlan.notes && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 warm:bg-[#fbf3dc] border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  កំណត់សម្គាល់ និងការឆ្លុះបញ្ចាំងក្រោយបង្រៀន (Post-Lesson Reflection)៖
                </span>
                <p className="text-slate-700 dark:text-slate-300 warm:text-[#524a3e] mt-1 leading-relaxed">
                  {activePlan.notes}
                </p>
              </div>
            )}

            {/* Signatures Footer */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 warm:border-[#dfd4bf] grid grid-cols-2 text-center text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-600 dark:text-slate-400">បានឃើញ និងអនុម័ត</p>
                <p className="text-slate-500 font-medium">នាយកសាលា</p>
                <div className="h-14 flex items-center justify-center">
                  <span className="italic text-slate-400 text-[11px]">(ចុះហត្ថលេខា និងត្រា)</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {schoolSettings?.principalName || 'លោកនាយក ឈុន គឹមសាន'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500">
                  ថ្ងៃទី...... ខែ...... ឆ្នាំ ២០២...
                </p>
                <p className="font-bold text-slate-600 dark:text-slate-400">គ្រូបង្រៀន</p>
                <div className="h-14 flex items-center justify-center">
                  <span className="italic text-slate-400 text-[11px]">(ចុះហត្ថលេខា)</span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  លោកគ្រូ កែវ សំណាង
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= CARD SUMMARY GRID VIEW ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>បង្ហាញ {filteredPlans.length} កិច្ចតែងការបង្រៀន</span>
            <span className="text-[11px]">ចុចលើកាតណាមួយដើម្បី «បង្ហាញពេញលេញ» សម្រាប់យកទៅបង្រៀន</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => {
              const cls = classes.find(c => c.classId === plan.classId);
              return (
                <div
                  key={plan.lessonPlanId}
                  onClick={() => handleSelectPlan(plan)}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-800 warm:bg-[#fffdf9] border border-slate-200/80 dark:border-slate-700/80 warm:border-[#dfd4bf] shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 warm:hover:border-[#b45309] hover:shadow-md transition-all space-y-4 cursor-pointer group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 warm:text-[#b45309]">
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

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white warm:text-[#2b251f] line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {plan.topic}
                    </h3>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 warm:bg-[#f7f3e9] text-[11px] text-slate-600 dark:text-slate-300 warm:text-[#524a3e] space-y-1">
                      <p><span className="font-semibold text-slate-400">កាលបរិច្ឆេទ៖</span> {plan.date}</p>
                      <p className="line-clamp-2"><span className="font-semibold text-slate-400">វត្ថុបំណង៖</span> {plan.objectives?.knowledge}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 warm:border-[#dfd4bf] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">
                      ៥ ជំហាន MoEYS
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                        onClick={() => handleSelectPlan(plan)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 warm:bg-[#eee6d3] warm:text-[#78350f] font-bold hover:bg-indigo-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>បង្ហាញពេញលេញ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editingPlan && (
        <Modal
          isOpen={showEditorModal}
          onClose={() => setShowEditorModal(false)}
          title="កិច្ចតែងការបង្រៀនគំរូ ៥ ជំហាន (MoEYS Standard)"
          maxWidth="4xl"
        >
          <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800 warm:bg-[#f7f3e9] rounded-2xl">
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
              <span className="font-bold text-indigo-700 dark:text-indigo-400">វត្ថុបំណងមេរៀន (Objectives)</span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="ចំណេះដឹង (Knowledge)..."
                  value={editingPlan.objectives.knowledge}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    objectives: { ...editingPlan.objectives, knowledge: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="បំណិន (Skills)..."
                  value={editingPlan.objectives.skills}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    objectives: { ...editingPlan.objectives, skills: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <input
                  type="text"
                  placeholder="ឥរិយាបថ (Attitude)..."
                  value={editingPlan.objectives.attitude}
                  onChange={(e) => setEditingPlan({
                    ...editingPlan,
                    objectives: { ...editingPlan.objectives, attitude: e.target.value }
                  })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* 5 Steps Editing */}
            <div className="space-y-3">
              <span className="font-bold text-slate-800 dark:text-slate-200">ដំណើរការ ៥ ជំហាន</span>
              
              {/* Step 1 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold">ជំហានទី ១៖ ពិនិត្យវត្តមាន និងសណ្តាប់ធ្នាប់ (៥ នាទី)</span>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step1Introduction.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step1Introduction: { ...editingPlan.steps.step1Introduction, teacherActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step1Introduction.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step1Introduction: { ...editingPlan.steps.step1Introduction, studentActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold">ជំហានទី ២៖ រំលឹកមេរៀនចាស់ (៥ នាទី)</span>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step2Review.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step2Review: { ...editingPlan.steps.step2Review, teacherActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step2Review.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step2Review: { ...editingPlan.steps.step2Review, studentActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-indigo-600">ជំហានទី ៣៖ មេរៀនថ្មី (២៥ នាទី)</span>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={3}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step3NewLesson.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step3NewLesson: { ...editingPlan.steps.step3NewLesson, teacherActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-medium"
                  />
                  <textarea
                    rows={3}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step3NewLesson.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step3NewLesson: { ...editingPlan.steps.step3NewLesson, studentActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold">ជំហានទី ៤៖ ពង្រឹងពុទ្ធិ (១០ នាទី)</span>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step4Strengthening.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step4Strengthening: { ...editingPlan.steps.step4Strengthening, teacherActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step4Strengthening.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step4Strengthening: { ...editingPlan.steps.step4Strengthening, studentActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold">ជំហានទី ៥៖ វាយតម្លៃ និងកិច្ចការផ្ទះ (៥ នាទី)</span>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពគ្រូ..."
                    value={editingPlan.steps.step5AssessmentHomework.teacherActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step5AssessmentHomework: { ...editingPlan.steps.step5AssessmentHomework, teacherActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    placeholder="សកម្មភាពសិស្ស..."
                    value={editingPlan.steps.step5AssessmentHomework.studentActivity}
                    onChange={(e) => setEditingPlan({
                      ...editingPlan,
                      steps: { ...editingPlan.steps, step5AssessmentHomework: { ...editingPlan.steps.step5AssessmentHomework, studentActivity: e.target.value } }
                    })}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
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
                className="px-4 py-2 bg-indigo-600 warm:bg-[#b45309] text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xs"
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
          <div className="space-y-6 p-6 bg-white text-slate-900 text-xs font-sans print:p-0">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="font-bold text-sm tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</h2>
              <p className="font-semibold text-xs">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
              <div className="pt-2 text-left flex justify-between">
                <div>
                  <p className="font-semibold">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
                  <p className="font-bold">{schoolSettings?.schoolNameKm || 'វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">ឆ្នាំសិក្សា ២០២៥-២០២៦</p>
                  <p className="font-semibold">មុខវិជ្ជា៖ គណិតវិទ្យា ថ្នាក់ទី ៨</p>
                </div>
              </div>
              <h1 className="text-base font-bold pt-3 uppercase tracking-wide">កិច្ចតែងការបង្រៀន ៥ ជំហាន</h1>
            </div>

            <div className="grid grid-cols-2 gap-2 border-y py-2 border-slate-300">
              <div>
                <p><span className="font-bold">កាលបរិច្ឆេទ៖</span> {planToPrint.date}</p>
                <p><span className="font-bold">គ្រូបង្រៀន៖</span> លោកគ្រូ កែវ សំណាង</p>
              </div>
              <div>
                <p><span className="font-bold">ថ្នាក់រៀន៖</span> ថ្នាក់ {classes.find(c => c.classId === planToPrint.classId)?.className || '៨ក'}</p>
                <p><span className="font-bold">រយៈពេល៖</span> {planToPrint.durationMinutes || 50} នាទី (១ ម៉ោងសិក្សា)</p>
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

            <div>
              <p className="font-bold mb-0.5">សម្ភារ និងវិធីសាស្ត្របង្រៀន៖</p>
              <p className="pl-4 text-slate-700">សម្ភារ៖ {planToPrint.teachingMaterials}</p>
              <p className="pl-4 text-slate-700">វិធីសាស្ត្រ៖ {planToPrint.teachingMethods}</p>
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
                  <td className="p-2 border-r border-slate-400 font-medium">{planToPrint.steps?.step3NewLesson?.teacherActivity}</td>
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

            <div className="grid grid-cols-2 gap-4 pt-2">
              <p><span className="font-bold">ការវាយតម្លៃ៖</span> {planToPrint.assessment}</p>
              <p><span className="font-bold">កិច្ចការផ្ទះ៖</span> {planToPrint.homework}</p>
            </div>

            <div className="grid grid-cols-2 text-center pt-8">
              <div>
                <p className="font-bold">បានឃើញ និងឯកភាព</p>
                <p className="font-medium text-slate-500">នាយកសាលា</p>
                <div className="h-12" />
                <p className="font-bold">{schoolSettings?.principalName || 'លោកនាយក ឈុន គឹមសាន'}</p>
              </div>
              <div>
                <p className="text-slate-500">ថ្ងៃទី...... ខែ...... ឆ្នាំ ២០២...</p>
                <p className="font-bold">គ្រូបង្រៀន</p>
                <div className="h-12" />
                <p className="font-bold">លោកគ្រូ កែវ សំណាង</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
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
