import React, { useEffect, useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  Calendar,
  School,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Download,
  Users,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { StudentTest, StudentScoreRecord, ClassRoom, Student, CurriculumItem, TestType } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useSearchParams } from 'react-router-dom';

export const StudentTestsPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [searchParams] = useSearchParams();
  const [tests, setTests] = useState<StudentTest[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>(() => searchParams.get('classId') || 'all');
  const [selectedTestType, setSelectedTestType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTestForView, setSelectedTestForView] = useState<StudentTest | null>(null);
  const [testToDelete, setTestToDelete] = useState<StudentTest | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [formClassId, setFormClassId] = useState('CLS-8A');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTestType, setFormTestType] = useState<TestType>('DAILY_QUIZ');
  const [formTitle, setFormTitle] = useState('');
  const [formCurriculumId, setFormCurriculumId] = useState('');
  const [formMaxScore, setFormMaxScore] = useState(10);
  const [formNotes, setFormNotes] = useState('');
  const [formScores, setFormScores] = useState<{ [studentId: string]: number }>({});
  const [formFeedbacks, setFormFeedbacks] = useState<{ [studentId: string]: string }>({});

  const testTypeLabels: { [key in TestType]: { label: string; color: string } } = {
    DAILY_QUIZ: { label: 'តេស្តខ្លីប្រចាំថ្ងៃ (Daily Quiz)', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    WEEKLY_TEST: { label: 'តេស្តប្រចាំសប្តាហ៍ (Weekly Test)', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    ORAL_QUESTION: { label: 'សំណួរផ្ទាល់មាត់ (Oral Quiz)', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    MONTHLY_EXAM: { label: 'តេស្តប្រចាំខែ (Monthly Exam)', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    HOMEWORK: { label: 'កិច្ចការផ្ទះ (Homework)', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, cList, sList, curList] = await Promise.all([
        storageService.getStudentTests(activeAcademicYear?.academicYearId),
        storageService.getClasses(),
        storageService.getStudents(),
        storageService.getCurriculum(activeAcademicYear?.academicYearId)
      ]);
      setTests(tList);
      setClasses(cList);
      setStudents(sList);
      setCurriculum(curList);
    } catch (err) {
      console.error('Failed to load student tests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  // Students for the active modal class
  const classStudentsForForm = useMemo(() => {
    return students.filter(s => s.classId === formClassId && s.status === 'active');
  }, [students, formClassId]);

  // When opening modal or switching class in modal, initialize student score inputs
  const handleOpenNewTest = (defaultClassId?: string, defaultCurriculumItem?: CurriculumItem) => {
    const cId = defaultClassId || classes[0]?.classId || 'CLS-8A';
    setFormClassId(cId);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTestType('DAILY_QUIZ');
    setFormMaxScore(10);
    setFormNotes('');

    if (defaultCurriculumItem) {
      setFormCurriculumId(defaultCurriculumItem.curriculumId);
      setFormTitle(`តេស្តខ្លី៖ ${defaultCurriculumItem.lessonTitle} (${defaultCurriculumItem.topicTitle})`);
    } else {
      setFormCurriculumId('');
      setFormTitle('តេស្តខ្លីប្រចាំថ្ងៃ គណិតវិទ្យា');
    }

    // Init scores
    const studentsInClass = students.filter(s => s.classId === cId && s.status === 'active');
    const initialScores: { [studentId: string]: number } = {};
    const initialFeedbacks: { [studentId: string]: string } = {};
    studentsInClass.forEach(s => {
      initialScores[s.studentId] = 8; // default reasonable starting score
      initialFeedbacks[s.studentId] = '';
    });
    setFormScores(initialScores);
    setFormFeedbacks(initialFeedbacks);
    setShowAddModal(true);
  };

  // Check URL params after loading
  useEffect(() => {
    if (loading || classes.length === 0) return;
    const cid = searchParams.get('classId');
    if (cid && cid !== selectedClassId) {
      setSelectedClassId(cid);
    }
    if (searchParams.get('new') === 'true') {
      const targetCid = cid || 'CLS-8A';
      const curId = searchParams.get('curriculumId');
      const curItem = curId ? curriculum.find(c => c.curriculumId === curId) : undefined;
      handleOpenNewTest(targetCid, curItem);
    }
  }, [loading, searchParams, classes, curriculum, selectedClassId]);

  const handleClassChangeInForm = (newClassId: string) => {
    setFormClassId(newClassId);
    const studentsInClass = students.filter(s => s.classId === newClassId && s.status === 'active');
    const initialScores: { [studentId: string]: number } = {};
    const initialFeedbacks: { [studentId: string]: string } = {};
    studentsInClass.forEach(s => {
      initialScores[s.studentId] = 8;
      initialFeedbacks[s.studentId] = '';
    });
    setFormScores(initialScores);
    setFormFeedbacks(initialFeedbacks);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      addToast('warning', 'សូមបញ្ចូលចំណងជើងតេស្ត');
      return;
    }

    const curItem = curriculum.find(c => c.curriculumId === formCurriculumId);
    const scoreRecords: StudentScoreRecord[] = classStudentsForForm.map(s => {
      const scoreVal = Number(formScores[s.studentId] !== undefined ? formScores[s.studentId] : 0);
      return {
        scoreId: `SC-${Date.now()}-${s.studentId}`,
        testId: `TEST-${Date.now()}`,
        studentId: s.studentId,
        studentCode: s.studentCode,
        studentName: s.fullName,
        gender: s.gender,
        score: scoreVal,
        maxScore: formMaxScore,
        feedback: formFeedbacks[s.studentId] || ''
      };
    });

    const totalScores = scoreRecords.map(r => r.score);
    const sum = totalScores.reduce((acc, val) => acc + val, 0);
    const avg = totalScores.length > 0 ? Number((sum / totalScores.length).toFixed(2)) : 0;
    const highest = totalScores.length > 0 ? Math.max(...totalScores) : 0;
    const lowest = totalScores.length > 0 ? Math.min(...totalScores) : 0;
    const pass = scoreRecords.filter(r => r.score >= (formMaxScore * 0.5)).length;

    const newTest: StudentTest = {
      testId: `TEST-${Date.now()}`,
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      classId: formClassId,
      subjectId: 'SUB-MATH-8',
      teacherId: 'T-001',
      curriculumId: formCurriculumId || undefined,
      chapterTitle: curItem?.chapterTitle,
      lessonTitle: curItem?.lessonTitle,
      date: formDate,
      testTitle: formTitle.trim(),
      testType: formTestType,
      maxScore: formMaxScore,
      records: scoreRecords,
      averageScore: avg,
      highestScore: highest,
      lowestScore: lowest,
      passingCount: pass,
      notes: formNotes.trim(),
      recordedAt: new Date().toISOString()
    };

    try {
      await storageService.saveStudentTest(newTest);
      await loadData();
      setShowAddModal(false);
      addToast('success', 'បានកត់ត្រាតេស្តសិស្សជោគជ័យ', `${newTest.testTitle} - មធ្យមភាគ៖ ${avg}/${formMaxScore}`);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការកត់ត្រា', err.message);
    }
  };

  const handleDeleteTest = async () => {
    if (!testToDelete) return;
    try {
      await storageService.deleteStudentTest(testToDelete.testId);
      await loadData();
      setShowDeleteConfirm(false);
      setTestToDelete(null);
      addToast('info', 'បានលុបកំណត់ត្រាតេស្ត');
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការលុប', err.message);
    }
  };

  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      if (selectedClassId !== 'all' && t.classId !== selectedClassId) return false;
      if (selectedTestType !== 'all' && t.testType !== selectedTestType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.testTitle.toLowerCase().includes(q) ||
          (t.lessonTitle && t.lessonTitle.toLowerCase().includes(q)) ||
          t.date.includes(q)
        );
      }
      return true;
    });
  }, [tests, selectedClassId, selectedTestType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 warm:bg-[#eee6d3] warm:text-[#78350f]">
              ការវាយតម្លៃប្រចាំថ្ងៃ និងប្រចាំសប្តាហ៍
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              លោកគ្រូ កែវ សំណាង
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 warm:text-[#2b251f] mt-1 flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]" />
            <span>កត់ត្រាតេស្ត និងការវាស់ស្ទង់សមត្ថភាពសិស្ស (Student Test Scoring)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#786f60] mt-0.5">
            កត់ត្រាពិន្ទុតេស្តខ្លីប្រចាំថ្ងៃ តេស្តសប្តាហ៍ និងការសួរមាត់ មុខវិជ្ជាគណិតវិទ្យា តាមថ្នាក់ (៨ក, ៨ខ, ៨គ, ៨ឃ)
          </p>
        </div>

        <button
          onClick={() => handleOpenNewTest()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 warm:bg-[#b45309] text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ កត់ត្រាតេស្តថ្មី</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 warm:bg-[#fffdf9] border border-slate-200/80 dark:border-slate-700/80 warm:border-[#dfd4bf] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមចំណងជើងតេស្ត ឬកាលបរិច្ឆេទ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl text-slate-800 dark:text-slate-200 font-medium"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">🏫 គ្រប់ថ្នាក់ (៨ក, ៨ខ, ៨គ, ៨ឃ)</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>ថ្នាក់ {c.className}</option>
            ))}
          </select>

          {/* Test Type Filter */}
          <select
            value={selectedTestType}
            onChange={(e) => setSelectedTestType(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 warm:bg-[#f7f3e9] border border-slate-200 dark:border-slate-700 warm:border-[#dfd4bf] rounded-xl font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="all">គ្រប់ប្រភេទតេស្ត</option>
            <option value="DAILY_QUIZ">តេស្តខ្លីប្រចាំថ្ងៃ</option>
            <option value="WEEKLY_TEST">តេស្តប្រចាំសប្តាហ៍</option>
            <option value="ORAL_QUESTION">សំណួរផ្ទាល់មាត់</option>
            <option value="MONTHLY_EXAM">តេស្តប្រចាំខែ</option>
            <option value="HOMEWORK">កិច្ចការផ្ទះ</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          មាន <span className="font-bold text-slate-900 dark:text-white warm:text-[#2b251f]">{filteredTests.length}</span> តេស្ត
        </span>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map((test) => {
          const cls = classes.find(c => c.classId === test.classId);
          const typeInfo = testTypeLabels[test.testType] || testTypeLabels.DAILY_QUIZ;
          return (
            <div
              key={test.testId}
              className="p-5 rounded-3xl bg-white dark:bg-slate-800 warm:bg-[#fffdf9] border border-slate-200/80 dark:border-slate-700/80 warm:border-[#dfd4bf] shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 warm:bg-[#eee6d3] warm:text-[#78350f]">
                    ថ្នាក់ {cls?.className || test.classId}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeInfo.color}`}>
                    {typeInfo.label.split('(')[0]}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white warm:text-[#2b251f] line-clamp-2">
                    {test.testTitle}
                  </h3>
                  {test.lessonTitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 warm:text-[#786f60] mt-0.5 truncate">
                      {test.lessonTitle}
                    </p>
                  )}
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 warm:bg-[#f7f3e9] text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">មធ្យមភាគ</span>
                    <span className="text-base font-black text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]">
                      {test.averageScore !== undefined ? test.averageScore : '-'}
                    </span>
                    <span className="text-[9px] text-slate-400"> / {test.maxScore}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">ខ្ពស់បំផុត</span>
                    <span className="text-base font-black text-emerald-600">
                      {test.highestScore !== undefined ? test.highestScore : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">សិស្សជាប់</span>
                    <span className="text-base font-black text-blue-600">
                      {test.passingCount !== undefined ? `${test.passingCount}/${test.records.length}` : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{test.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{test.records.length} នាក់</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 warm:border-[#dfd4bf] flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setTestToDelete(test);
                    setShowDeleteConfirm(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="លុបតេស្ត"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTestForView(test);
                      setShowDetailModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 warm:bg-[#eee6d3] text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>មើលតារាងពិន្ទុ</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / RECORD NEW TEST MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="កត់ត្រាតេស្ត និងបញ្ចូលពិន្ទុសិស្ស (Student Test Scoring)"
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveTest} className="space-y-4 text-xs">
          {/* Header Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800 warm:bg-[#f7f3e9] rounded-2xl">
            <div>
              <label className="block text-slate-500 font-bold mb-1">ថ្នាក់រៀន *</label>
              <select
                value={formClassId}
                onChange={(e) => handleClassChangeInForm(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
                required
              >
                {classes.map(c => (
                  <option key={c.classId} value={c.classId}>ថ្នាក់ {c.className}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">កាលបរិច្ឆេទ *</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">ប្រភេទតេស្ត *</label>
              <select
                value={formTestType}
                onChange={(e) => setFormTestType(e.target.value as TestType)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
              >
                <option value="DAILY_QUIZ">តេស្តខ្លីប្រចាំថ្ងៃ</option>
                <option value="WEEKLY_TEST">តេស្តប្រចាំសប្តាហ៍</option>
                <option value="ORAL_QUESTION">សំណួរផ្ទាល់មាត់</option>
                <option value="MONTHLY_EXAM">តេស្តប្រចាំខែ</option>
                <option value="HOMEWORK">កិច្ចការផ្ទះ</option>
              </select>
            </div>
          </div>

          {/* Test Title & Curriculum link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                ចំណងជើងតេស្ត *
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="ឧ. តេស្តខ្លី៖ វិធានគុណចែកចំនួនគត់រ៉ឺឡាទីវ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-200 font-bold mb-1">
                មេរៀនក្នុងកម្មវិធីសិក្សា (Curriculum Item)
              </label>
              <select
                value={formCurriculumId}
                onChange={(e) => {
                  setFormCurriculumId(e.target.value);
                  const item = curriculum.find(c => c.curriculumId === e.target.value);
                  if (item && !formTitle) {
                    setFormTitle(`តេស្ត៖ ${item.lessonTitle}`);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
              >
                <option value="">-- ជ្រើសរើសមេរៀន (ស្រេចចិត្ត) --</option>
                {curriculum.map(c => (
                  <option key={c.curriculumId} value={c.curriculumId}>
                    {c.lessonTitle} ({c.topicTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Scoring Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                បញ្ចូលពិន្ទុសិស្សថ្នាក់ {classes.find(c => c.classId === formClassId)?.className} ({classStudentsForForm.length} នាក់)
              </span>
              <span className="text-[11px] text-slate-400">ពិន្ទុអតិបរមា៖ {formMaxScore}</span>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5 w-14 text-center">អត្តលេខ</th>
                    <th className="p-2.5">គោត្តនាម-នាម</th>
                    <th className="p-2.5 w-12 text-center">ភេទ</th>
                    <th className="p-2.5 w-28 text-center">ពិន្ទុ (០-១០) *</th>
                    <th className="p-2.5">កំណត់សម្គាល់/មតិកែលម្អ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {classStudentsForForm.map(student => (
                    <tr key={student.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2 text-center font-bold text-slate-400">{student.studentCode}</td>
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{student.fullName}</td>
                      <td className="p-2 text-center text-slate-500">{student.gender}</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={formMaxScore}
                          value={formScores[student.studentId] !== undefined ? formScores[student.studentId] : ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setFormScores(prev => ({ ...prev, [student.studentId]: isNaN(val) ? 0 : val }));
                          }}
                          className="w-20 px-2 py-1 text-center font-black rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="មតិខ្លី..."
                          value={formFeedbacks[student.studentId] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormFeedbacks(prev => ({ ...prev, [student.studentId]: val }));
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 warm:bg-[#b45309] text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xs"
            >
              រក្សាទុកកំណត់ត្រាតេស្ត
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL / SCORE SHEET MODAL */}
      {selectedTestForView && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`តារាងពិន្ទុតេស្ត៖ ${selectedTestForView.testTitle}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 p-2 text-xs">
            {/* Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800 warm:bg-[#f7f3e9] rounded-2xl">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">ថ្នាក់រៀន</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ថ្នាក់ {classes.find(c => c.classId === selectedTestForView.classId)?.className}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">កាលបរិច្ឆេទ</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTestForView.date}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">មធ្យមភាគ</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {selectedTestForView.averageScore} / {selectedTestForView.maxScore}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">សិស្សជាប់</span>
                <span className="font-bold text-emerald-600">
                  {selectedTestForView.passingCount} / {selectedTestForView.records.length} នាក់
                </span>
              </div>
            </div>

            {/* Score Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5 text-center w-12">ល.រ</th>
                    <th className="p-2.5 w-20">អត្តលេខ</th>
                    <th className="p-2.5">គោត្តនាម-នាមសិស្ស</th>
                    <th className="p-2.5 text-center w-14">ភេទ</th>
                    <th className="p-2.5 text-center w-24">ពិន្ទុ</th>
                    <th className="p-2.5 text-center w-24">លទ្ធផល</th>
                    <th className="p-2.5">មតិកែលម្អ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedTestForView.records.map((r, idx) => {
                    const isPass = r.score >= (selectedTestForView.maxScore * 0.5);
                    return (
                      <tr key={r.scoreId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-400">{r.studentCode}</td>
                        <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{r.studentName}</td>
                        <td className="p-2 text-center text-slate-500">{r.gender}</td>
                        <td className="p-2 text-center font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          {r.score}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {isPass ? 'ជាប់' : 'ធ្លាក់'}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400 text-[11px]">{r.feedback || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>បោះពុម្ពតារាងពិន្ទុ</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTest}
        title="លុបកំណត់ត្រាតេស្ត"
        message={`តើលោកគ្រូពិតជាចង់លុប "${testToDelete?.testTitle}" មែនឬទេ? ទិន្នន័យពិន្ទុទាំងអស់នឹងត្រូវលុប។`}
        confirmLabel="លុបចោល"
        type="danger"
      />
    </div>
  );
};
