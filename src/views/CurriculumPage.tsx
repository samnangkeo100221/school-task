import React, { useState, useEffect } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Layers,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { schedulerEngine } from '../services/schedulerEngine';
import { CurriculumItem, Subject, ClassRoom } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExcelImportModal } from '../components/common/ExcelImportModal';
import { excelService } from '../services/excelService';

export const CurriculumPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [search, setSearch] = useState('');
  const [filterChapter, setFilterChapter] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CurriculumItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [newOpeningDate, setNewOpeningDate] = useState<string>('2025-11-01');
  const [rescheduleTargetClass, setRescheduleTargetClass] = useState<string>('');
  const [forceResetAll, setForceResetAll] = useState<boolean>(true);
  const [rescheduling, setRescheduling] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    curriculumId: '',
    academicYearId: '',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    monthNameKm: 'វិច្ឆិកា',
    weekNumber: 1,
    chapterNumber: 1,
    chapterTitle: 'ចំនួនសនិទាន',
    lessonTitle: '',
    topicTitle: '',
    lessonOrder: 1,
    requiredPeriods: 2,
    learningObjectives: '',
    studentBookPage: '',
    teacherBookPage: '',
    status: 'PLANNED' as 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
  });

  const loadData = async () => {
    const [c, s, cls] = await Promise.all([
      storageService.getCurriculum(activeAcademicYear?.academicYearId),
      storageService.getSubjects(),
      storageService.getClasses()
    ]);
    setCurriculum(c.sort((a, b) => a.lessonOrder - b.lessonOrder));
    setSubjects(s);
    setClasses(cls);
  };

  useEffect(() => {
    loadData();
    if (activeAcademicYear?.startDate) {
      setNewOpeningDate(activeAcademicYear.startDate);
    }
  }, [activeAcademicYear]);

  // Reschedule & Re-calculate based on new School Opening Date
  const handleExecuteReschedule = async () => {
    if (!activeAcademicYear) {
      addToast('error', 'សូមជ្រើសរើសឆ្នាំសិក្សាជាមុនសិន!');
      return;
    }

    if (!newOpeningDate) {
      addToast('error', 'សូមជ្រើសរើសកាលបរិច្ឆេទបើកបវេសនកាល!');
      return;
    }

    setRescheduling(true);
    try {
      const result = await schedulerEngine.generateAnnualSchedule(
        activeAcademicYear.academicYearId,
        rescheduleTargetClass || undefined,
        'SUB-MATH-8',
        newOpeningDate,
        forceResetAll
      );
      setRescheduleModalOpen(false);
      await loadData();
      addToast(
        'success',
        'បានរៀបចំកាលវិភាគបង្រៀនជាថ្មីជោគជ័យ!',
        `បានបង្កើតឡើងវិញចំនួន ${result.totalGenerated} ម៉ោងបង្រៀន ចាប់ពីថ្ងៃបើកបវេសនកាល ${newOpeningDate}`
      );
    } catch (err: any) {
      addToast('error', 'បញ្ហាពេលរៀបចំកាលវិភាគជាថ្មី', err.message);
    } finally {
      setRescheduling(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    const nextOrder = curriculum.length > 0 ? Math.max(...curriculum.map(c => c.lessonOrder)) + 1 : 1;
    setFormData({
      curriculumId: 'CUR-' + Date.now().toString().slice(-4),
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      grade: 8,
      subjectId: 'SUB-MATH-8',
      monthNameKm: 'វិច្ឆិកា',
      weekNumber: 1,
      chapterNumber: 1,
      chapterTitle: 'ចំនួនសនិទាន',
      lessonTitle: 'មេរៀនទី ' + nextOrder,
      topicTitle: '',
      lessonOrder: nextOrder,
      requiredPeriods: 2,
      learningObjectives: '',
      studentBookPage: '',
      teacherBookPage: '',
      status: 'PLANNED'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: CurriculumItem) => {
    setEditingItem(item);
    setFormData({
      curriculumId: item.curriculumId,
      academicYearId: item.academicYearId,
      grade: item.grade,
      subjectId: item.subjectId,
      monthNameKm: item.monthNameKm,
      weekNumber: item.weekNumber,
      chapterNumber: item.chapterNumber,
      chapterTitle: item.chapterTitle,
      lessonTitle: item.lessonTitle,
      topicTitle: item.topicTitle,
      lessonOrder: item.lessonOrder,
      requiredPeriods: item.requiredPeriods,
      learningObjectives: item.learningObjectives,
      studentBookPage: item.studentBookPage || '',
      teacherBookPage: item.teacherBookPage || '',
      status: item.status
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lessonTitle || !formData.topicTitle) {
      addToast('error', 'សូមបំពេញចំណងជើងមេរៀន និងប្រធានបទ!');
      return;
    }

    const payload: CurriculumItem = {
      curriculumId: formData.curriculumId,
      academicYearId: formData.academicYearId || activeAcademicYear?.academicYearId || 'AY-2025-2026',
      grade: Number(formData.grade),
      subjectId: formData.subjectId,
      monthNameKm: formData.monthNameKm,
      weekNumber: Number(formData.weekNumber),
      chapterNumber: Number(formData.chapterNumber),
      chapterTitle: formData.chapterTitle,
      lessonTitle: formData.lessonTitle,
      topicTitle: formData.topicTitle,
      lessonOrder: Number(formData.lessonOrder),
      requiredPeriods: Number(formData.requiredPeriods),
      learningObjectives: formData.learningObjectives,
      studentBookPage: formData.studentBookPage,
      teacherBookPage: formData.teacherBookPage,
      status: formData.status
    };

    await storageService.saveCurriculumItem(payload);
    await loadData();
    setModalOpen(false);
    addToast('success', editingItem ? 'បានកែប្រែកម្មវិធីសិក្សាជោគជ័យ' : 'បានបន្ថែមមេរៀនថ្មីជោគជ័យ', payload.topicTitle);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    let list = await storageService.getCurriculum();
    list = list.filter(c => c.curriculumId !== confirmDeleteId);
    await storageService.bulkSaveCurriculum(list);
    setConfirmDeleteId(null);
    await loadData();
    addToast('success', 'បានលុបមេរៀនចេញពីកម្មវិធីសិក្សា');
  };

  const handleExportExcel = () => {
    const exportData = curriculum.map(c => ({
      'លំដាប់ (Order)': c.lessonOrder,
      'ខែ (Month)': c.monthNameKm,
      'សប្តាហ៍ទី (Week)': c.weekNumber,
      'ជំពូកទី (Chapter)': c.chapterNumber,
      'ចំណងជើងជំពូក (Chapter Title)': c.chapterTitle,
      'មេរៀន (Lesson)': c.lessonTitle,
      'ខ្លឹមសារ/ប្រធានបទ (Topic)': c.topicTitle,
      'ចំនួនម៉ោង (Periods)': c.requiredPeriods,
      'លទ្ធផលរំពឹងទុក (Objectives)': c.learningObjectives,
      'ទំព័រ ស.ស': c.studentBookPage || '',
      'ទំព័រ ស.គ': c.teacherBookPage || '',
      'ស្ថានភាព (Status)': c.status
    }));
    excelService.exportToExcel(exportData, 'កម្មវិធីសិក្សាលម្អិតគណិតវិទ្យា_ថ្នាក់ទី៨_វិទ្យាល័យហ៊ុនសែនបាត់ដឹង', 'Curriculum');
    addToast('success', 'បានទាញយក Excel កម្មវិធីសិក្សាជោគជ័យ');
  };

  const handleImportExcel = async (parsedRows: any[]) => {
    let count = 0;
    const newItems: CurriculumItem[] = [];
    for (const row of parsedRows) {
      const topic = row['ខ្លឹមសារ/ប្រធានបទ (Topic)'] || row['topicTitle'] || row['Topic'];
      if (!topic) continue;

      const order = Number(row['លំដាប់ (Order)'] || row['lessonOrder'] || (curriculum.length + count + 1));
      const chapter = Number(row['ជំពូកទី (Chapter)'] || row['chapterNumber'] || 1);
      const periods = Number(row['ចំនួនម៉ោង (Periods)'] || row['requiredPeriods'] || 2);

      newItems.push({
        curriculumId: 'CUR-' + Date.now().toString().slice(-4) + Math.random().toString(36).substring(2, 5),
        academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
        grade: 8,
        subjectId: 'SUB-MATH-8',
        monthNameKm: row['ខែ (Month)'] || 'វិច្ឆិកា',
        weekNumber: Number(row['សប្តាហ៍ទី (Week)'] || 1),
        chapterNumber: chapter,
        chapterTitle: row['ចំណងជើងជំពូក (Chapter Title)'] || 'ជំពូក ' + chapter,
        lessonTitle: row['មេរៀន (Lesson)'] || 'មេរៀន ' + order,
        topicTitle: topic,
        lessonOrder: order,
        requiredPeriods: periods,
        learningObjectives: row['លទ្ធផលរំពឹងទុក (Objectives)'] || '',
        studentBookPage: row['ទំព័រ ស.ស'] || '',
        teacherBookPage: row['ទំព័រ ស.គ'] || '',
        status: 'PLANNED'
      });
      count++;
    }

    const merged = [...curriculum, ...newItems];
    await storageService.bulkSaveCurriculum(merged);
    await loadData();
    addToast('success', `បាននាំចូលកម្មវិធីសិក្សាចំនួន ${count} មេរៀនដោយជោគជ័យ`);
  };

  // Unique chapters for filter
  const uniqueChapters = Array.from(new Set(curriculum.map(c => c.chapterNumber)));

  const filtered = curriculum.filter(c => {
    const matchSearch = c.topicTitle.toLowerCase().includes(search.toLowerCase()) ||
                        c.lessonTitle.toLowerCase().includes(search.toLowerCase()) ||
                        c.chapterTitle.toLowerCase().includes(search.toLowerCase());
    const matchChapter = filterChapter !== '' ? c.chapterNumber === Number(filterChapter) : true;
    return matchSearch && matchChapter;
  });

  const totalPeriods = curriculum.reduce((sum, item) => sum + (item.requiredPeriods || 2), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <BookMarked className="w-5 h-5 mr-2 text-primary-600" />
            កម្មវិធីសិក្សាប្រចាំឆ្នាំ (Annual Curriculum)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            បែងចែកកម្មវិធីសិក្សាលម្អិតថ្នាក់ទី ៨ គណិតវិទ្យា (វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង) • សរុប {curriculum.length} មេរៀន ({totalPeriods} ម៉ោង)
          </p>
        </div>

        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            នាំចូល Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-1.5" />
            ទាញយក Excel
          </button>
          <button
            onClick={() => setRescheduleModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            រៀបចំជាថ្មី (បើកបវេសនកាល)
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            បន្ថែមមេរៀន
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកតាមប្រធានបទ, ជំពូក, ឬមេរៀន..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterChapter}
            onChange={(e) => setFilterChapter(e.target.value ? Number(e.target.value) : '')}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">-- គ្រប់ជំពូកទាំងអស់ --</option>
            {uniqueChapters.map(ch => (
              <option key={ch} value={ch}>ជំពូកទី {ch}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Curriculum Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 font-bold text-center w-12">លំដាប់</th>
                <th className="p-3 font-bold">ខែ / សប្តាហ៍</th>
                <th className="p-3 font-bold">ជំពូក / មេរៀន</th>
                <th className="p-3 font-bold">ខ្លឹមសារ / ប្រធានបទលម្អិត</th>
                <th className="p-3 font-bold">លទ្ធផលរំពឹងទុក</th>
                <th className="p-3 font-bold text-center">ម៉ោង</th>
                <th className="p-3 font-bold text-center">សៀវភៅ (ស.ស/ស.គ)</th>
                <th className="p-3 font-bold text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <tr key={item.curriculumId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-center font-mono font-bold text-primary-600 bg-primary-50/30 dark:bg-primary-950/20">
                    {item.lessonOrder}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 dark:text-white block">{item.monthNameKm}</span>
                    <span className="text-[11px] text-slate-400">សប្តាហ៍ទី {item.weekNumber}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 inline-block mb-1">
                      ជំពូក {item.chapterNumber}: {item.chapterTitle}
                    </span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">{item.lessonTitle}</p>
                  </td>
                  <td className="p-3 max-w-xs">
                    <p className="font-bold text-slate-900 dark:text-white leading-relaxed">
                      {item.topicTitle}
                    </p>
                  </td>
                  <td className="p-3 max-w-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {item.learningObjectives}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      {item.requiredPeriods} ម៉ោង
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono text-[11px] text-slate-500">
                    <div>ស.ស៖ {item.studentBookPage || '-'}</div>
                    <div>ស.គ៖ {item.teacherBookPage || '-'}</div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5 rtl:space-x-reverse">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="កែសម្រួល"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(item.curriculumId)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="លុប"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Curriculum Item */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'កែសម្រួលមេរៀនកម្មវិធីសិក្សា' : 'បន្ថែមមេរៀនកម្មវិធីសិក្សា'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                លំដាប់មេរៀន (Order) *
              </label>
              <input
                type="number"
                required
                value={formData.lessonOrder}
                onChange={(e) => setFormData({ ...formData, lessonOrder: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ខែ *
              </label>
              <input
                type="text"
                required
                value={formData.monthNameKm}
                onChange={(e) => setFormData({ ...formData, monthNameKm: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="វិច្ឆិកា"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                សប្តាហ៍ទី *
              </label>
              <input
                type="number"
                min="1"
                max="40"
                required
                value={formData.weekNumber}
                onChange={(e) => setFormData({ ...formData, weekNumber: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ជំពូកទី (Chapter No.) *
              </label>
              <input
                type="number"
                required
                value={formData.chapterNumber}
                onChange={(e) => setFormData({ ...formData, chapterNumber: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ចំណងជើងជំពូក *
              </label>
              <input
                type="text"
                required
                value={formData.chapterTitle}
                onChange={(e) => setFormData({ ...formData, chapterTitle: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="ចំនួនសនិទាន"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ចំណងជើងមេរៀន *
              </label>
              <input
                type="text"
                required
                value={formData.lessonTitle}
                onChange={(e) => setFormData({ ...formData, lessonTitle: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="មេរៀនទី១៖ ចំនួនសនិទាន"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ចំនួនម៉ោងត្រូវការ *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.requiredPeriods}
                onChange={(e) => setFormData({ ...formData, requiredPeriods: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ខ្លឹមសារ ឬប្រធានបទលម្អិត *
            </label>
            <input
              type="text"
              required
              value={formData.topicTitle}
              onChange={(e) => setFormData({ ...formData, topicTitle: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="១. សញ្ញាណចំនួនសនិទាន"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              លទ្ធផលរំពឹងទុក (Learning Objectives)
            </label>
            <textarea
              rows={2}
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="សិស្សអាចកំណត់និយមន័យ..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ទំព័រ សៀវភៅសិស្ស (ស.ស)
              </label>
              <input
                type="text"
                value={formData.studentBookPage}
                onChange={(e) => setFormData({ ...formData, studentBookPage: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                placeholder="1-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ទំព័រ សៀវភៅគ្រូ (ស.គ)
              </label>
              <input
                type="text"
                value={formData.teacherBookPage}
                onChange={(e) => setFormData({ ...formData, teacherBookPage: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono"
                placeholder="1-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="លុបមេរៀនពីកម្មវិធីសិក្សា"
        message="តើអ្នកប្រាកដជាចង់លុបមេរៀននេះមែនទេ? កាលវិភាគបង្រៀនដែលបានបង្កើតនឹងត្រូវកែប្រែ។"
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="នាំចូលកម្មវិធីសិក្សាពី Excel"
        expectedFields={['លំដាប់ (Order)', 'ជំពូកទី (Chapter)', 'ខ្លឹមសារ/ប្រធានបទ (Topic)', 'ចំនួនម៉ោង (Periods)']}
        onImportConfirmed={handleImportExcel}
      />

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="រៀបចំកាលវិភាគបង្រៀនជាថ្មី (កំណត់ថ្ងៃបើកបវេសនកាល)"
        subtitle="ដកស្រង់ទិន្នន័យពីបំណែងចែកកម្មវិធីសិក្សាលម្អិតគណិតថ្នាក់ទី៨ ២០២៥-២០២៦ ទាំងស្រុង"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Info Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 leading-relaxed">
            <p className="font-bold flex items-center mb-1">
              <RotateCcw className="w-4 h-4 mr-1.5" />
              ប្រព័ន្ធរៀបចំកាលបរិច្ឆេទស្វ័យប្រវត្តិតាមការកែប្រែថ្ងៃបើកបវេសនកាល
            </p>
            <p className="text-[11px] opacity-90">
              នៅពេលលោកគ្រូកែប្រែកាលបរិច្ឆេទបើកបវេសនកាល ប្រព័ន្ធនឹងដកស្រង់ទិន្នន័យពី <strong>បំណែងចែកកម្មវិធីសិក្សាលម្អិតគណិតថ្នាក់ទី៨ ២០២៥-២០២៦ ទាំងស្រុង</strong> (៣៨ សប្តាហ៍ / ១១០ ម៉ោងបង្រៀន / ១៨ ជំពូក) ហើយរៀបចំកាលបរិច្ឆេទបង្រៀនឡើងវិញជាស្វ័យប្រវត្តិតាមកាលវិភាគប្រចាំសប្តាហ៍ ដោយរំលងថ្ងៃឈប់សម្រាកបុណ្យជាតិ និងការប្រឡងឆមាស។
            </p>
          </div>

          {/* New Academic Opening Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              កាលបរិច្ឆេទបើកបវេសនកាលថ្មី (New Academic Opening Date) *
            </label>
            <input
              type="date"
              value={newOpeningDate}
              onChange={(e) => setNewOpeningDate(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Target Class Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ថ្នាក់រៀនគោលដៅ (Target Classes)
            </label>
            <select
              value={rescheduleTargetClass}
              onChange={(e) => setRescheduleTargetClass(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- រៀបចំគ្រប់ថ្នាក់ទាំងអស់ (៨ក, ៨ខ, ៨គ, ៨ឃ) --</option>
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>
                  ថ្នាក់ {c.className}
                </option>
              ))}
            </select>
          </div>

          {/* Full Reset Option */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="forceResetCurrCheckbox"
              checked={forceResetAll}
              onChange={(e) => setForceResetAll(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="forceResetCurrCheckbox" className="text-xs text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              <span className="font-bold">រៀបចំឡើងវិញទាំងអស់ពីដើមឆ្នាំ (Full Reset & Reschedule)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ដកស្រង់ទិន្នន័យមេរៀនឡើងវិញទាំងស្រុង និងប្តូរកាលបរិច្ឆេទចាប់ពីថ្ងៃបើកបវេសនកាលថ្មី
              </p>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setRescheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="button"
              disabled={rescheduling}
              onClick={handleExecuteReschedule}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              {rescheduling ? 'កំពុងរៀបចំ...' : 'ចាប់ផ្តើមរៀបចំជាថ្មី (Regenerate Now)'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

