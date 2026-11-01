import { getChapterMaster } from '../data/lessonPlansMaster';
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { useApp } from '../contexts/AppContext';
import { LessonPlan, ScheduledLesson, ClassRoom, Subject, Teacher, LessonPlanProcedureStep } from '../types';
import { 
  BookOpen, Plus, Edit2, Trash2, Printer, CheckCircle, Clock, AlertCircle, 
  Search, Filter, Save, X, Eye, FileText, ChevronRight
} from 'lucide-react';

const DEFAULT_STEPS: LessonPlanProcedureStep[] = [
  {
    stepNumber: 1,
    stepNameKm: 'ជំហានទី១',
    stepSubNameKm: 'រដ្ឋបាលថ្នាក់',
    teacherActivities: 'ពិនិត្យអវត្តមាន អនាម័យ និងសណ្ដាប់ធ្នាប់ក្នុងថ្នាក់',
    studentActivities: 'ប្រធានថ្នាក់រាយការណ៍អវត្តមាន សិស្សានុសិស្សអង្គុយតាមកន្លែងប្រកបដោយរបៀបរៀបរយ',
    content: 'ពិនិត្យវត្តមាន អនាម័យ បរិស្ថាន និងវិន័យ',
    durationMinutes: 5
  },
  {
    stepNumber: 2,
    stepNameKm: 'ជំហានទី២',
    stepSubNameKm: 'រំលឹកមេរៀនចាស់',
    teacherActivities: 'សួរសំណួរទាក់ទងនឹងមេរៀនមុន ឬកែការងារផ្ទះរបស់សិស្ស',
    studentActivities: 'ឆ្លើយសំណួរគ្រូ និងឡើងកែលំហាត់លើក្តារខៀន',
    content: 'រំលឹកចំណុចសំខាន់ៗនៃមេរៀនមុន',
    durationMinutes: 5
  },
  {
    stepNumber: 3,
    stepNameKm: 'ជំហានទី៣',
    stepSubNameKm: 'មេរៀនថ្មី',
    teacherActivities: 'ពន្យល់ខ្លឹមសារមេរៀនថ្មី លើកឧទាហរណ៍ និងដឹកនាំសិស្សធ្វើសកម្មភាព/ពិភាក្សាក្រុម',
    studentActivities: 'ស្តាប់ការពន្យល់ កត់ត្រា និងចូលរួមធ្វើលំហាត់គំរូជាបុគ្គល ឬជាក្រុម',
    content: 'ខ្លឹមសារលម្អិតនៃមេរៀន និងលំហាត់គំរូ',
    durationMinutes: 25
  },
  {
    stepNumber: 4,
    stepNameKm: 'ជំហានទី៤',
    stepSubNameKm: 'ពង្រឹងពុទ្ធិ',
    teacherActivities: 'ដាក់លំហាត់អនុវត្តខ្លីៗ ឬសួរសំណួរសង្ខេបដើម្បីវាយតម្លៃការយល់ដឹងរបស់សិស្ស',
    studentActivities: 'អនុវត្តលំហាត់លើក្តារឆ្នួន ឬសៀវភៅព្រាង និងឆ្លើយសំណួរសង្ខេប',
    content: 'លំហាត់អនុវត្តពង្រឹងការយល់ដឹង',
    durationMinutes: 10
  },
  {
    stepNumber: 5,
    stepNameKm: 'ជំហានទី៥',
    stepSubNameKm: 'បណ្តាំផ្ញើ',
    teacherActivities: 'ដាក់កិច្ចការផ្ទះ ណែនាំសិស្សឱ្យមើលមេរៀនបន្ត និងអប់រំទូទៅ (សុជីវធម៌/សុខភាព)',
    studentActivities: 'កត់ត្រាកិច្ចការផ្ទះ និងស្តាប់ការណែនាំរបស់គ្រូ',
    content: 'កិច្ចការផ្ទះ និងការណែនាំស្វ័យសិក្សា',
    durationMinutes: 5
  }
];

export const LessonPlansPage: React.FC = () => {
  const { addToast } = useApp();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<LessonPlan>>({
    chapterTitle: '',
    lessonTitle: '',
    topic: '',
    durationMinutes: 50,
    learningObjectivesKnowledge: '',
    learningObjectivesSkills: '',
    learningObjectivesAttitude: '',
    teachingMaterials: 'សៀវភៅពុម្ពគណិតវិទ្យាថ្នាក់ទី៨, បន្ទាត់, ក្ដារខៀន, ហ្វឺត, ក្រដាសផ្ទាំងធំ',
    teachingMethods: 'វិធីសាស្ត្របង្រៀនតាមបែបសិស្សមជ្ឈមណ្ឌល, ការពិភាក្សាក្រុម, ការដោះស្រាយបញ្ហា',
    steps: JSON.parse(JSON.stringify(DEFAULT_STEPS)),
    assessmentHomework: 'ធ្វើលំហាត់លេខ ១, ២ ក្នុងសៀវភៅពុម្ពទំព័រ ...',
    notes: '',
    status: 'PREPARED',
    date: new Date().toISOString().split('T')[0],
    periodNumber: 1,
    classId: '',
    subjectId: '',
    teacherId: ''
  });

  const loadData = async () => {
    const [p, c, s, t] = await Promise.all([
      storageService.getLessonPlans(),
      storageService.getClasses(),
      storageService.getSubjects(),
      storageService.getTeachers()
    ]);
    
    setPlans(p);
    setClasses(c);
    setSubjects(s);
    setTeachers(t);

    if (c.length > 0 && !formData.classId) {
      setFormData(prev => ({
        ...prev,
        classId: c[0].classId,
        subjectId: s[0]?.subjectId || 'SUB-MATH-8',
        teacherId: t[0]?.teacherId || 'T-001'
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setFormData({
      lessonPlanId: 'LP-' + Date.now(),
      scheduledLessonId: '',
      academicYearId: 'AY-2025-2026',
      teacherId: teachers[0]?.teacherId || 'T-001',
      classId: classes[0]?.classId || 'CLS-8A',
      subjectId: subjects[0]?.subjectId || 'SUB-MATH-8',
      date: new Date().toISOString().split('T')[0],
      periodNumber: 1,
      chapterTitle: 'ជំពូកទី ១: ចំនួនសនិទាន',
      lessonTitle: 'មេរៀនទី ១: ចំនួនសនិទាន និងប្រភាគ',
      topic: 'និយមន័យ និងការប្រៀបធៀបចំនួនសនិទាន',
      durationMinutes: 50,
      learningObjectivesKnowledge: 'សិស្សអាចកំណត់និយមន័យចំនួនសនិទានបានត្រឹមត្រូវតាមរយៈការពន្យល់របស់គ្រូ។',
      learningObjectivesSkills: 'សិស្សចេះប្រៀបធៀប និងគណនាតម្លៃចំនួនសនិទានបានត្រឹមត្រូវ។',
      learningObjectivesAttitude: 'បណ្ដុះស្មារតីប្រុងប្រយ័ត្ន ស្រឡាញ់ការគិតលេខ និងមានទំនួលខុសត្រូវ។',
      teachingMaterials: 'សៀវភៅពុម្ពគណិតវិទ្យាថ្នាក់ទី៨, បន្ទាត់, ក្ដារខៀន, ហ្វឺត, ក្រដាសផ្ទាំងធំ',
      teachingMethods: 'វិធីសាស្ត្របង្រៀនតាមបែបសិស្សមជ្ឈមណ្ឌល, ការពិភាក្សាក្រុម, ការដោះស្រាយបញ្ហា',
      steps: JSON.parse(JSON.stringify(DEFAULT_STEPS)),
      assessmentHomework: 'ធ្វើលំហាត់លេខ ១, ២ ក្នុងសៀវភៅពុម្ពទំព័រ ១២',
      notes: 'អនុវត្តតាមស្តង់ដាកិច្ចតែងការ ៥ ជំហានរបស់ក្រសួងអប់រំ យុវជន និងកីឡា',
      status: 'PREPARED',
      updatedAt: new Date().toISOString()
    });
    setIsEditorOpen(true);
  };

  const handleEdit = (plan: LessonPlan) => {
    setFormData(JSON.parse(JSON.stringify(plan)));
    setIsEditorOpen(true);
  };

  const handlePreview = (plan: LessonPlan) => {
    setActivePlan(plan);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('តើអ្នកពិតជាចង់លុបកិច្ចតែងការបង្រៀននេះមែនទេ?')) {
      await storageService.deleteLessonPlan(id);
      addToast('success', 'បានលុបកិច្ចតែងការរួចរាល់');
      await loadData();
    }
  };

  const handleSave = async () => {
    if (!formData.lessonTitle || !formData.classId) {
      alert('សូមបំពេញចំណងជើងមេរៀន និងជ្រើសរើសថ្នាក់រៀន!');
      return;
    }

    const planToSave: LessonPlan = {
      lessonPlanId: formData.lessonPlanId || 'LP-' + Date.now(),
      scheduledLessonId: formData.scheduledLessonId || '',
      academicYearId: formData.academicYearId || 'AY-2025-2026',
      teacherId: formData.teacherId || teachers[0]?.teacherId || 'T-001',
      classId: formData.classId || classes[0]?.classId || 'CLS-8A',
      subjectId: formData.subjectId || subjects[0]?.subjectId || 'SUB-MATH-8',
      date: formData.date || new Date().toISOString().split('T')[0],
      periodNumber: Number(formData.periodNumber) || 1,
      chapterTitle: formData.chapterTitle || '',
      lessonTitle: formData.lessonTitle || '',
      topic: formData.topic || '',
      durationMinutes: Number(formData.durationMinutes) || 50,
      learningObjectivesKnowledge: formData.learningObjectivesKnowledge || '',
      learningObjectivesSkills: formData.learningObjectivesSkills || '',
      learningObjectivesAttitude: formData.learningObjectivesAttitude || '',
      teachingMaterials: formData.teachingMaterials || '',
      teachingMethods: formData.teachingMethods || '',
      steps: formData.steps || DEFAULT_STEPS,
      assessmentHomework: formData.assessmentHomework || '',
      notes: formData.notes || '',
      status: (formData.status as any) || 'PREPARED',
      updatedAt: new Date().toISOString()
    };

    await storageService.saveLessonPlan(planToSave);
    addToast('success', 'បានរក្សាទុកកិច្ចតែងការបង្រៀន');
    setIsEditorOpen(false);
    await loadData();
  };

  const updateStep = (index: number, field: keyof LessonPlanProcedureStep, value: any) => {
    const newSteps = [...(formData.steps || [])];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value
    };
    setFormData({ ...formData, steps: newSteps });
  };

  const filteredPlans = plans.filter(p => {
    if (selectedClassId !== 'ALL' && p.classId !== selectedClassId) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.lessonTitle || '').toLowerCase().includes(q);
      const matchChapter = (p.chapterTitle || '').toLowerCase().includes(q);
      const matchTopic = (p.topic || '').toLowerCase().includes(q);
      if (!matchTitle && !matchChapter && !matchTopic) return false;
    }
    return true;
  });

  const getClassName = (cid: string) => classes.find(c => c.classId === cid)?.className || cid;
  const getSubjectName = (sid: string) => subjects.find(s => s.subjectId === sid)?.subjectName || sid;
  const getTeacherName = (tid: string) => teachers.find(t => t.teacherId === tid)?.fullName || tid;

  const handleGenerateFromCurriculum = async () => {
    const currs = await storageService.getCurriculum();
    if (currs.length === 0) {
      addToast('error', 'មិនទាន់មានទិន្នន័យកម្មវិធីសិក្សាដើម្បីទាញយកទេ!');
      return;
    }

    const newPlans: LessonPlan[] = [];
    const targetClasses = classes.length > 0 ? classes : [{ classId: 'CLS-8A', className: '៨ក (8A)' }];

    for (const c of currs) {
      const master = getChapterMaster(c.chapterNumber);
      for (const cls of targetClasses) {
        const planId = `LP-${cls.classId}-${c.curriculumId}`;
        const plan: LessonPlan = {
          lessonPlanId: planId,
          scheduledLessonId: `SCH-${cls.classId}-${c.curriculumId}`,
          academicYearId: c.academicYearId || 'AY-2025-2026',
          teacherId: 'T-001',
          classId: cls.classId,
          subjectId: 'SUB-MATH-8',
          date: new Date().toISOString().split('T')[0],
          periodNumber: 1,
          chapterTitle: c.chapterTitle,
          lessonTitle: c.lessonTitle,
          topic: c.topicTitle,
          durationMinutes: 50,
          learningObjectivesKnowledge: master.objectivesKnowledge || c.learningObjectives || 'កំណត់និយមន័យ និងទ្រឹស្តីបទសំខាន់ៗបានត្រឹមត្រូវ។',
          learningObjectivesSkills: master.objectivesSkill,
          learningObjectivesAttitude: master.objectivesAttitude,
          teachingMaterials: `${master.teachingMaterials.join(', ')} (សៀវភៅពុម្ពទំព័រ ${c.studentBookPage || ''})`,
          teachingMethods: master.teachingMethod,
          steps: [
            {
              stepNumber: 1,
              stepNameKm: 'ជំហានទី ១',
              stepSubNameKm: master.defaultSteps.step1.title,
              teacherActivities: master.defaultSteps.step1.teacherActivity,
              studentActivities: master.defaultSteps.step1.studentActivity,
              content: master.defaultSteps.step1.content,
              durationMinutes: master.defaultSteps.step1.durationMin
            },
            {
              stepNumber: 2,
              stepNameKm: 'ជំហានទី ២',
              stepSubNameKm: master.defaultSteps.step2.title,
              teacherActivities: master.defaultSteps.step2.teacherActivity,
              studentActivities: master.defaultSteps.step2.studentActivity,
              content: master.defaultSteps.step2.content,
              durationMinutes: master.defaultSteps.step2.durationMin
            },
            {
              stepNumber: 3,
              stepNameKm: 'ជំហានទី ៣',
              stepSubNameKm: master.defaultSteps.step3.title,
              teacherActivities: master.defaultSteps.step3.teacherActivity,
              studentActivities: master.defaultSteps.step3.studentActivity,
              content: `${c.lessonTitle} - ${c.topicTitle}: ${master.defaultSteps.step3.content}`,
              durationMinutes: master.defaultSteps.step3.durationMin
            },
            {
              stepNumber: 4,
              stepNameKm: 'ជំហានទី ៤',
              stepSubNameKm: master.defaultSteps.step4.title,
              teacherActivities: master.defaultSteps.step4.teacherActivity,
              studentActivities: master.defaultSteps.step4.studentActivity,
              content: master.defaultSteps.step4.content,
              durationMinutes: master.defaultSteps.step4.durationMin
            },
            {
              stepNumber: 5,
              stepNameKm: 'ជំហានទី ៥',
              stepSubNameKm: master.defaultSteps.step5.title,
              teacherActivities: master.defaultSteps.step5.teacherActivity,
              studentActivities: master.defaultSteps.step5.studentActivity,
              content: master.defaultSteps.step5.content,
              durationMinutes: master.defaultSteps.step5.durationMin
            }
          ],
          assessmentHomework: master.defaultSteps.step5.content || `លំហាត់ក្នុងសៀវភៅពុម្ពគណិតវិទ្យាថ្នាក់ទី ៨ ទំព័រ ${c.studentBookPage}`,
          notes: 'ដកស្រង់ចេញពីកិច្ចតែងការបង្រៀនគណិតវិទ្យាថ្នាក់ទី៨ វិទ្យាស្ថានជាតិអប់រំ (NIE) ជំនាន់ទី១៧ និងបំណែងចែកកម្មវិធីសិក្សាលម្អិត ២០២៥-២០២៦',
          status: 'PREPARED',
          updatedAt: new Date().toISOString()
        };
        newPlans.push(plan);
      }
    }

    await storageService.saveLessonPlansBatch(newPlans);
    await loadData();
    addToast('success', `បានដកស្រង់ និងបង្កើតកិច្ចតែងការ ៥ ជំហានចំនួន ${newPlans.length} ដោយជោគជ័យ!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            កិច្ចតែងការបង្រៀន ៥ ជំហាន (Lesson Plans)
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            ដកស្រង់ចេញពីកម្មវិធីសិក្សាលម្អិតគណិតវិទ្យាថ្នាក់ទី ៨ • លោកគ្រូ កែវ សំណាង
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateFromCurriculum}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <BookOpen className="w-4 h-4" />
            ដកស្រង់កិច្ចតែងការពីកម្មវិធីសិក្សា
          </button>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            តែងកិច្ចតែងការថ្មី
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកមេរៀន, ជំពូក..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>

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
              <option value="PREPARED">បានតែងរួចរាល់ (Prepared)</option>
              <option value="DRAFT">ព្រាង (Draft)</option>
              <option value="TAUGHT">បានបង្រៀនរួច (Taught)</option>
              <option value="NOT_PREPARED">មិនទាន់តែង (Not Prepared)</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-slate-400">
          សរុប: <span className="font-bold text-gray-800 dark:text-white">{filteredPlans.length}</span> កិច្ចតែងការ
        </div>
      </div>

      {/* Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-gray-100 dark:border-slate-700">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-slate-200">មិនទាន់មានកិច្ចតែងការបង្រៀន</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 mb-4">សូមចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតកិច្ចតែងការថ្មីតាមគំរូ ៥ ជំហាន</p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            បង្កើតកិច្ចតែងការ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlans.map(plan => (
            <div 
              key={plan.lessonPlanId} 
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 rounded text-xs font-semibold">
                    ថ្នាក់ {getClassName(plan.classId)} • ម៉ោងទី {plan.periodNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    plan.status === 'TAUGHT' ? 'bg-emerald-100 text-emerald-800' :
                    plan.status === 'PREPARED' ? 'bg-blue-100 text-blue-800' :
                    plan.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {plan.status === 'TAUGHT' ? 'បានបង្រៀន' :
                     plan.status === 'PREPARED' ? 'ត្រៀមរួចរាល់' :
                     plan.status === 'DRAFT' ? 'កំពុងព្រាង' : 'មិនទាន់តែង'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {plan.lessonTitle}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{plan.chapterTitle}</p>
                {plan.topic && (
                  <p className="text-xs text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/50 p-2 rounded line-clamp-2 mb-3">
                    <span className="font-semibold">ខ្លឹមសារ:</span> {plan.topic}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-700">
                  <div>កាលបរិច្ឆេទ: <span className="text-gray-700 dark:text-slate-200 font-medium">{plan.date}</span></div>
                  <div>រយៈពេល: <span className="text-gray-700 dark:text-slate-200 font-medium">{plan.durationMinutes} នាទី</span></div>
                  <div>មុខវិជ្ជា: <span className="text-gray-700 dark:text-slate-200 font-medium">{getSubjectName(plan.subjectId)}</span></div>
                  <div>គ្រូបង្រៀន: <span className="text-gray-700 dark:text-slate-200 font-medium">{getTeacherName(plan.teacherId)}</span></div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-gray-50 dark:bg-slate-900/60 px-5 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <button
                  onClick={() => handlePreview(plan)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> មើល & បោះពុម្ព
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-1.5 text-gray-600 dark:text-slate-300 hover:text-blue-600 rounded transition-colors"
                    title="កែសម្រួល"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.lessonPlanId)}
                    className="p-1.5 text-gray-600 dark:text-slate-300 hover:text-rose-600 rounded transition-colors"
                    title="លុប"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full 5-Step Ministry Lesson Plan Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl my-auto text-gray-900 dark:text-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/30 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  {formData.lessonPlanId && plans.some(p => p.lessonPlanId === formData.lessonPlanId) 
                    ? 'កែសម្រួលកិច្ចតែងការបង្រៀន (MoEYS 5 Steps)' 
                    : 'បង្កើតកិច្ចតែងការបង្រៀនថ្មី (MoEYS 5 Steps)'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">គំរូកិច្ចតែងការស្តង់ដា ៥ ជំហានរបស់ក្រសួងអប់រំ យុវជន និងកីឡា</p>
              </div>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50/60 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200/70 dark:border-slate-700">
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

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">គ្រូបង្រៀន</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                  >
                    {teachers.map(t => (
                      <option key={t.teacherId} value={t.teacherId}>{t.fullName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">កាលបរិច្ឆេទ</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ម៉ោងបង្រៀនទី</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.periodNumber}
                    onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">រយៈពេល (នាទី)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ជំពូកទី (Chapter)</label>
                  <input
                    type="text"
                    value={formData.chapterTitle}
                    onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
                    placeholder="ឧទាហរណ៍: ជំពូកទី ១: ចំនួនសនិទាន"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ស្ថានភាពកិច្ចតែងការ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 font-medium text-indigo-700 dark:text-indigo-400"
                  >
                    <option value="PREPARED">ត្រៀមរួចរាល់ (Prepared)</option>
                    <option value="DRAFT">ព្រាង (Draft)</option>
                    <option value="TAUGHT">បានបង្រៀន (Taught)</option>
                    <option value="CANCELLED">លុបចោល (Cancelled)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ចំណងជើងមេរៀន (Lesson Title) *</label>
                  <input
                    type="text"
                    value={formData.lessonTitle}
                    onChange={(e) => setFormData({ ...formData, lessonTitle: e.target.value })}
                    placeholder="ឧទាហរណ៍: មេរៀនទី ១: ចំនួនសនិទាន និងប្រភាគ"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ចំណងជើងរង / ខ្លឹមសារលម្អិត (Topic)</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="ឧទាហរណ៍: ១. និយមន័យចំនួនសនិទាន, ២. ការប្រៀបធៀប"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                  <ChevronRight className="w-4 h-4" /> វត្ថុបំណងមេរៀន (Learning Objectives)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">១. ចំណេះដឹង (Knowledge)</label>
                    <textarea
                      rows={3}
                      value={formData.learningObjectivesKnowledge}
                      onChange={(e) => setFormData({ ...formData, learningObjectivesKnowledge: e.target.value })}
                      placeholder="សិស្សអាចកំណត់និយមន័យ..."
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">២. បំណិន (Skills)</label>
                    <textarea
                      rows={3}
                      value={formData.learningObjectivesSkills}
                      onChange={(e) => setFormData({ ...formData, learningObjectivesSkills: e.target.value })}
                      placeholder="សិស្សចេះគណនា និងដោះស្រាយ..."
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">៣. ឥរិយាបថ (Attitude)</label>
                    <textarea
                      rows={3}
                      value={formData.learningObjectivesAttitude}
                      onChange={(e) => setFormData({ ...formData, learningObjectivesAttitude: e.target.value })}
                      placeholder="បណ្ដុះស្មារតីប្រុងប្រយ័ត្ន..."
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Teaching Materials & Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">សម្ភារឧបទេស (Teaching Materials)</label>
                  <textarea
                    rows={2}
                    value={formData.teachingMaterials}
                    onChange={(e) => setFormData({ ...formData, teachingMaterials: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">វិធីសាស្ត្របង្រៀន (Teaching Methods)</label>
                  <textarea
                    rows={2}
                    value={formData.teachingMethods}
                    onChange={(e) => setFormData({ ...formData, teachingMethods: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* 5-Step Procedure Table */}
              <div className="border border-indigo-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-indigo-600 px-4 py-2.5 text-white flex items-center justify-between">
                  <span className="font-bold text-sm">ដំណើរការបង្រៀន ៥ ជំហាន (MoEYS 5-Step Process)</span>
                  <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded text-indigo-50">៥០ នាទី</span>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {(formData.steps || []).map((step, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded text-xs font-bold">
                            {step.stepNameKm} : {step.stepSubNameKm}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                          <span>រយៈពេល:</span>
                          <input
                            type="number"
                            value={step.durationMinutes}
                            onChange={(e) => updateStep(idx, 'durationMinutes', Number(e.target.value))}
                            className="w-14 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded px-1.5 py-0.5 text-xs text-center font-semibold"
                          />
                          <span>នាទី</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-0.5">សកម្មភាពគ្រូ</label>
                          <textarea
                            rows={2}
                            value={step.teacherActivities}
                            onChange={(e) => updateStep(idx, 'teacherActivities', e.target.value)}
                            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded p-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-0.5">ខ្លឹមសារមេរៀន</label>
                          <textarea
                            rows={2}
                            value={step.content}
                            onChange={(e) => updateStep(idx, 'content', e.target.value)}
                            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded p-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 dark:text-slate-400 mb-0.5">សកម្មភាពសិស្ស</label>
                          <textarea
                            rows={2}
                            value={step.studentActivities}
                            onChange={(e) => updateStep(idx, 'studentActivities', e.target.value)}
                            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded p-1.5 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment & Homework */}
              <div className="border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">ការវាយតម្លៃ និងកិច្ចការផ្ទះ (Assessment & Homework)</label>
                <textarea
                  rows={2}
                  value={formData.assessmentHomework}
                  onChange={(e) => setFormData({ ...formData, assessmentHomework: e.target.value })}
                  placeholder="លំហាត់ ឬកិច្ចការស្រាវជ្រាវប្រគល់ជូនសិស្ស..."
                  className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-slate-900 rounded-b-2xl">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                បោះបង់
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                រក្សាទុកកិច្ចតែងការ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Preview Modal */}
      {isPreviewOpen && activePlan && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl my-auto print:m-0 print:max-w-none print:shadow-none text-gray-900">
            {/* Modal Controls */}
            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 print:hidden rounded-t-2xl">
              <span className="font-bold text-gray-800 text-sm">មើលគំរូកិច្ចតែងការសម្រាប់បោះពុម្ព</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> បោះពុម្ព (Print)
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Document Content */}
            <div className="p-8 overflow-y-auto font-sans leading-relaxed text-gray-900 print:p-0">
              {/* National Header */}
              <div className="text-center space-y-1 mb-6">
                <h3 className="font-bold text-base tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</h3>
                <h4 className="font-bold text-sm tracking-widest text-gray-700">ជាតិ សាសនា ព្រះមហាក្សត្រ</h4>
                <div className="text-xs text-gray-400">***</div>
              </div>

              <div className="flex justify-between items-start text-xs border-b pb-4 mb-4">
                <div>
                  <p><span className="font-semibold">ក្រសួង:</span> អប់រំ យុវជន និងកីឡា</p>
                  <p><span className="font-semibold">សាលារៀន:</span> វិទ្យាល័យហ៊ុនសែន បាត់ដឹង</p>
                  <p><span className="font-semibold">គ្រូបង្រៀន:</span> {getTeacherName(activePlan.teacherId)}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-semibold">មុខវិជ្ជា:</span> {getSubjectName(activePlan.subjectId)}</p>
                  <p><span className="font-semibold">ថ្នាក់ទី:</span> {getClassName(activePlan.classId)} | ម៉ោងទី: {activePlan.periodNumber}</p>
                  <p><span className="font-semibold">កាលបរិច្ឆេទ:</span> {activePlan.date}</p>
                </div>
              </div>

              <div className="text-center my-4">
                <h2 className="text-lg font-bold text-indigo-900 uppercase">កិច្ចតែងការបង្រៀន</h2>
                <p className="text-sm font-semibold text-gray-800 mt-1">{activePlan.chapterTitle}</p>
                <p className="text-base font-bold text-indigo-700">{activePlan.lessonTitle}</p>
                {activePlan.topic && <p className="text-xs text-gray-600 mt-0.5">ខ្លឹមសារ: {activePlan.topic}</p>}
                <p className="text-xs text-gray-500 mt-0.5">រយៈពេលបង្រៀន: {activePlan.durationMinutes} នាទី</p>
              </div>

              {/* Objectives */}
              <div className="mb-5 text-xs">
                <h4 className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">I. វត្ថុបំណងមេរៀន (Objectives)</h4>
                <div className="pl-4 space-y-1">
                  <p><span className="font-semibold">១. ចំណេះដឹង:</span> {activePlan.learningObjectivesKnowledge || 'គ្មាន'}</p>
                  <p><span className="font-semibold">២. បំណិន:</span> {activePlan.learningObjectivesSkills || 'គ្មាន'}</p>
                  <p><span className="font-semibold">៣. ឥរិយាបថ:</span> {activePlan.learningObjectivesAttitude || 'គ្មាន'}</p>
                </div>
              </div>

              {/* Materials & Methods */}
              <div className="mb-5 text-xs">
                <h4 className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">II. សម្ភារឧបទេស និងវិធីសាស្ត្របង្រៀន</h4>
                <div className="pl-4 space-y-1">
                  <p><span className="font-semibold">• សម្ភារឧបទេស:</span> {activePlan.teachingMaterials || 'សៀវភៅពុម្ព, ក្តារខៀន, ហ្វឺត'}</p>
                  <p><span className="font-semibold">• វិធីសាស្ត្របង្រៀន:</span> {activePlan.teachingMethods || 'សិស្សមជ្ឈមណ្ឌល'}</p>
                </div>
              </div>

              {/* 5 Steps Table */}
              <div className="mb-5 text-xs">
                <h4 className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">III. ដំណើរការបង្រៀន និងរៀន (៥ ជំហាន)</h4>
                <table className="w-full border-collapse border border-gray-400 mt-2 text-left">
                  <thead>
                    <tr className="bg-gray-100 text-gray-900">
                      <th className="border border-gray-400 p-2 text-center w-28">ជំហាន & ពេល</th>
                      <th className="border border-gray-400 p-2 w-1/3">សកម្មភាពគ្រូ</th>
                      <th className="border border-gray-400 p-2 w-1/3">ខ្លឹមសារមេរៀន</th>
                      <th className="border border-gray-400 p-2 w-1/3">សកម្មភាពសិស្ស</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activePlan.steps || []).map((step, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="border border-gray-400 p-2 font-semibold bg-gray-50/50">
                          <div>{step.stepNameKm}</div>
                          <div className="text-[11px] text-gray-600 font-normal">({step.stepSubNameKm})</div>
                          <div className="text-[10px] text-indigo-600 mt-1">{step.durationMinutes} នាទី</div>
                        </td>
                        <td className="border border-gray-400 p-2 text-gray-700 whitespace-pre-wrap">{step.teacherActivities}</td>
                        <td className="border border-gray-400 p-2 text-gray-800 whitespace-pre-wrap font-medium">{step.content}</td>
                        <td className="border border-gray-400 p-2 text-gray-700 whitespace-pre-wrap">{step.studentActivities}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Homework */}
              <div className="mb-6 text-xs">
                <h4 className="font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">IV. ការវាយតម្លៃ និងកិច្ចការផ្ទះ</h4>
                <p className="pl-4">{activePlan.assessmentHomework || 'មិនមានកិច្ចការផ្ទះ'}</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center pt-8 text-xs">
                <div>
                  <p className="font-bold">បានឃើញ និងឯកភាព</p>
                  <p className="text-gray-500 mt-1">នាយកសាលា / គណៈគ្រប់គ្រង</p>
                  <div className="h-16"></div>
                  <p className="font-semibold">................................................</p>
                </div>
                <div>
                  <p className="text-gray-500">ថ្ងៃទី.......... ខែ.......... ឆ្នាំ ២០២...</p>
                  <p className="font-bold mt-1">ហត្ថលេខាគ្រូបង្រៀន</p>
                  <div className="h-16"></div>
                  <p className="font-semibold">{getTeacherName(activePlan.teacherId)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

