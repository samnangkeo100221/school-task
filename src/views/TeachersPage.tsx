import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Phone,
  Mail,
  BookOpen,
  School,
  Clock
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { Teacher, Subject, ClassRoom } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExcelImportModal } from '../components/common/ExcelImportModal';
import { excelService } from '../services/excelService';

export const TeachersPage: React.FC = () => {
  const { addToast } = useApp();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    teacherId: '',
    teacherCode: '',
    fullName: '',
    gender: 'M' as 'M' | 'F',
    phone: '',
    email: '',
    address: '',
    subjects: [] as string[],
    assignedClasses: [] as string[],
    employmentStatus: 'ACTIVE' as 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE',
    weeklyWorkloadHours: 18
  });

  const loadData = async () => {
    const [t, s, c] = await Promise.all([
      storageService.getTeachers(),
      storageService.getSubjects(),
      storageService.getClasses()
    ]);
    setTeachers(t);
    setSubjects(s);
    setClasses(c);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      teacherId: 'T-' + Date.now().toString().slice(-4),
      teacherCode: 'T-' + Math.floor(100 + Math.random() * 900),
      fullName: '',
      gender: 'M',
      phone: '',
      email: '',
      address: '',
      subjects: ['SUB-MATH-8'],
      assignedClasses: ['CLS-8A'],
      employmentStatus: 'ACTIVE',
      weeklyWorkloadHours: 18
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      teacherId: t.teacherId,
      teacherCode: t.teacherCode,
      fullName: t.fullName,
      gender: t.gender,
      phone: t.phone,
      email: t.email,
      address: t.address || '',
      subjects: t.subjects,
      assignedClasses: t.assignedClasses,
      employmentStatus: t.employmentStatus,
      weeklyWorkloadHours: t.weeklyWorkloadHours || 18
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.teacherCode) {
      addToast('error', 'សូមបំពេញឈ្មោះ និងលេខកូដគ្រូ!');
      return;
    }

    const payload: Teacher = {
      teacherId: formData.teacherId,
      teacherCode: formData.teacherCode,
      fullName: formData.fullName,
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      subjects: formData.subjects,
      assignedClasses: formData.assignedClasses,
      employmentStatus: formData.employmentStatus,
      weeklyWorkloadHours: Number(formData.weeklyWorkloadHours)
    };

    await storageService.saveTeacher(payload);
    await loadData();
    setModalOpen(false);
    addToast('success', editingTeacher ? 'បានកែប្រែព័ត៌មានគ្រូជោគជ័យ' : 'បានបន្ថែមគ្រូបង្រៀនថ្មីជោគជ័យ', payload.fullName);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    await storageService.deleteTeacher(confirmDeleteId);
    setConfirmDeleteId(null);
    await loadData();
    addToast('success', 'បានលុបគ្រូបង្រៀនចេញពីប្រព័ន្ធ');
  };

  const handleExportExcel = () => {
    const exportData = teachers.map(t => ({
      'កូដគ្រូ (Code)': t.teacherCode,
      'គោត្តនាម-នាម (Name)': t.fullName,
      'ភេទ (Gender)': t.gender === 'M' ? 'ប្រុស' : 'ស្រី',
      'ទូរស័ព្ទ (Phone)': t.phone,
      'អ៊ីមែល (Email)': t.email,
      'អាសយដ្ឋាន (Address)': t.address || '',
      'មុខវិជ្ជាបង្រៀន (Subjects)': t.subjects.map(sId => subjects.find(s => s.subjectId === sId)?.subjectName).filter(Boolean).join(', '),
      'ថ្នាក់ទទួលបន្ទុក (Classes)': t.assignedClasses.map(cId => classes.find(c => c.classId === cId)?.className).filter(Boolean).join(', '),
      'បន្ទុកម៉ោង (Workload)': t.weeklyWorkloadHours || 18,
      'ស្ថានភាព (Status)': t.employmentStatus
    }));
    excelService.exportToExcel(exportData, 'បញ្ជីរាយនាមគ្រូបង្រៀន_វិទ្យាល័យហ៊ុនសែនបាត់ដឹង', 'Teachers');
    addToast('success', 'បានទាញយកទិន្នន័យ Excel ជោគជ័យ');
  };

  const handleImportExcel = async (parsedRows: any[]) => {
    let count = 0;
    for (const row of parsedRows) {
      const teacherName = row['គោត្តនាម-នាម (Name)'] || row['fullName'] || row['Name'];
      if (!teacherName) continue;

      const code = row['កូដគ្រូ (Code)'] || row['teacherCode'] || 'T-' + Math.floor(100 + Math.random() * 900);
      const gender = (row['ភេទ (Gender)'] === 'ស្រី' || row['gender'] === 'F') ? 'F' : 'M';
      const phone = String(row['ទូរស័ព្ទ (Phone)'] || row['phone'] || '');
      const email = String(row['អ៊ីមែល (Email)'] || row['email'] || '');

      const newTeacher: Teacher = {
        teacherId: 'T-' + Date.now().toString().slice(-4) + Math.random().toString(36).substring(2, 5),
        teacherCode: code,
        fullName: teacherName,
        gender,
        phone,
        email,
        subjects: ['SUB-MATH-8'],
        assignedClasses: ['CLS-8A'],
        employmentStatus: 'ACTIVE',
        weeklyWorkloadHours: 18
      };
      await storageService.saveTeacher(newTeacher);
      count++;
    }
    await loadData();
    addToast('success', `បានបញ្ចូលគ្រូបង្រៀនចំនួន ${count} នាក់ដោយជោគជ័យ`);
  };

  // Filter list
  const filtered = teachers.filter(t => {
    const matchSearch = t.fullName.toLowerCase().includes(search.toLowerCase()) ||
                        t.teacherCode.toLowerCase().includes(search.toLowerCase()) ||
                        t.phone.includes(search);
    const matchSubject = filterSubject ? t.subjects.includes(filterSubject) : true;
    const matchClass = filterClass ? t.assignedClasses.includes(filterClass) : true;
    return matchSearch && matchSubject && matchClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-primary-600" />
            ព័ត៌មាន និងប្រវត្តិរូបគ្រូបង្រៀន (លោកគ្រូ កែវ សំណាង)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ប្រព័ន្ធគ្រប់គ្រងផ្ទាល់ខ្លួនសម្រាប់ លោកគ្រូ កែវ សំណាង • ឯកទេសគណិតវិទ្យា ថ្នាក់ទី ៨ (វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង)
          </p>
        </div>

        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-1.5" />
            ទាញយក Excel
          </button>
          {teachers.length > 0 && (
            <button
              onClick={() => handleOpenEdit(teachers[0])}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-1.5" />
              កែប្រែប្រវត្តិរូប
            </button>
          )}
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
            placeholder="ស្វែងរកតាមឈ្មោះ, កូដគ្រូ, ឬលេខទូរស័ព្ទ..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">-- គ្រប់មុខវិជ្ជា --</option>
            {subjects.map(s => (
              <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">-- គ្រប់ថ្នាក់ --</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 font-bold">ល.រ</th>
                <th className="p-3.5 font-bold">កូដគ្រូ</th>
                <th className="p-3.5 font-bold">គោត្តនាម-នាម</th>
                <th className="p-3.5 font-bold">ភេទ</th>
                <th className="p-3.5 font-bold">ទំនាក់ទំនង</th>
                <th className="p-3.5 font-bold">មុខវិជ្ជាបង្រៀន</th>
                <th className="p-3.5 font-bold">ថ្នាក់ទទួលបន្ទុក</th>
                <th className="p-3.5 font-bold text-center">បន្ទុកម៉ោង/សប្តាហ៍</th>
                <th className="p-3.5 font-bold text-center">ស្ថានភាព</th>
                <th className="p-3.5 font-bold text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((t, idx) => (
                <tr key={t.teacherId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-3.5 font-mono font-bold text-primary-600">{t.teacherCode}</td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                    {t.fullName}
                    {t.teacherId === 'T-001' && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 font-semibold">
                        គណិតវិទ្យា ៨
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    {t.gender === 'M' ? 'ប្រុស' : 'ស្រី'}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 space-y-0.5">
                    <div className="flex items-center text-[11px]"><Phone className="w-3 h-3 mr-1 text-slate-400" /> {t.phone}</div>
                    {t.email && <div className="flex items-center text-[11px] text-slate-400"><Mail className="w-3 h-3 mr-1" /> {t.email}</div>}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.map(sId => {
                        const s = subjects.find(x => x.subjectId === sId);
                        return (
                          <span
                            key={sId}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: s?.color || '#3b82f6' }}
                          >
                            {s?.subjectName || sId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {t.assignedClasses.map(cId => {
                        const c = classes.find(x => x.classId === cId);
                        return (
                          <span key={cId} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                            {c?.className || cId}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-bold font-mono text-slate-800 dark:text-slate-200">
                    {t.weeklyWorkloadHours || 18} ម៉ោង
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      សកម្ម
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center space-x-1.5 rtl:space-x-reverse">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="កែសម្រួល"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(t.teacherId)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="លុប"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    រកមិនឃើញទិន្នន័យគ្រូបង្រៀនដែលស្វែងរកទេ!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Teacher */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTeacher ? 'កែសម្រួលព័ត៌មានគ្រូ' : 'បន្ថែមគ្រូបង្រៀនថ្មី'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                កូដសម្គាល់គ្រូ (Code) *
              </label>
              <input
                type="text"
                required
                value={formData.teacherCode}
                onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="T-001"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ភេទ *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="M">ប្រុស (Male)</option>
                <option value="F">ស្រី (Female)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              គោត្តនាម និងនាមពេញ *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="កែវ សំណាង"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                លេខទូរស័ព្ទ *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="012 889 456"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                បន្ទុកម៉ោងបង្រៀន/សប្តាហ៍
              </label>
              <input
                type="number"
                min="1"
                max="36"
                value={formData.weeklyWorkloadHours}
                onChange={(e) => setFormData({ ...formData, weeklyWorkloadHours: parseInt(e.target.value, 10) || 18 })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              អ៊ីមែល
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="teacher@school.edu.kh"
            />
          </div>

          {/* Subject multi-select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              មុខវិជ្ជាបង្រៀន (ជ្រើសរើសបានច្រើន)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl">
              {subjects.map(s => {
                const checked = formData.subjects.includes(s.subjectId);
                return (
                  <label key={s.subjectId} className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, subjects: [...formData.subjects, s.subjectId] });
                        } else {
                          setFormData({ ...formData, subjects: formData.subjects.filter(id => id !== s.subjectId) });
                        }
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span>{s.subjectName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Class multi-select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ថ្នាក់ទទួលបន្ទុក (ជ្រើសរើសបានច្រើន)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl">
              {classes.map(c => {
                const checked = formData.assignedClasses.includes(c.classId);
                return (
                  <label key={c.classId} className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, assignedClasses: [...formData.assignedClasses, c.classId] });
                        } else {
                          setFormData({ ...formData, assignedClasses: formData.assignedClasses.filter(id => id !== c.classId) });
                        }
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span>{c.className}</span>
                  </label>
                );
              })}
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
        title="លុបគ្រូបង្រៀន"
        message="តើអ្នកប្រាកដជាចង់លុបគ្រូបង្រៀននេះចេញពីប្រព័ន្ធមែនទេ? កាលវិភាគបង្រៀនដែលពាក់ព័ន្ធនឹងត្រូវពិនិត្យឡើងវិញ។"
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="នាំចូលបញ្ជីគ្រូបង្រៀនពី Excel"
        expectedFields={['កូដគ្រូ (Code)', 'គោត្តនាម-នាម (Name)', 'ភេទ (Gender)', 'ទូរស័ព្ទ (Phone)']}
        onImportConfirmed={handleImportExcel}
      />
    </div>
  );
};

