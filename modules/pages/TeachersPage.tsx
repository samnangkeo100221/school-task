import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  BookOpen
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { excelService } from '../services/excelService';
import { Teacher, Subject, ClassRoom, TimetableSlot } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExcelImportModal } from '../components/common/ExcelImportModal';
import { NavLink } from 'react-router-dom';

export const TeachersPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [timetables, setTimetables] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>({
    teacherCode: '',
    fullName: '',
    gender: 'M',
    phone: '',
    email: '',
    address: 'ស្រុកឧដុង្គ ខេត្តកំពង់ស្ពឺ',
    subjects: ['SUB-MATH-8'],
    assignedClasses: ['CLS-8A', 'CLS-8B', 'CLS-8C', 'CLS-8D'],
    qualification: 'បរិញ្ញាបត្រគរុកោសល្យ',
    position: 'គ្រូបង្រៀន',
    employmentStatus: 'active'
  });

  // Delete Confirm
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tchs, subs, cls, tt] = await Promise.all([
        storageService.getTeachers(),
        storageService.getSubjects(),
        storageService.getClasses(),
        storageService.getTimetables(activeAcademicYear?.academicYearId)
      ]);
      setTeachers(tchs);
      setSubjects(subs);
      setClasses(cls);
      setTimetables(tt);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  const filteredTeachers = teachers.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.fullName.toLowerCase().includes(q) ||
      t.teacherCode.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      teacherId: `T-${Date.now()}`,
      teacherCode: `T-${(teachers.length + 1).toString().padStart(3, '0')}`,
      fullName: '',
      gender: 'M',
      phone: '',
      email: '',
      address: 'ស្រុកឧដុង្គ ខេត្តកំពង់ស្ពឺ',
      subjects: ['SUB-MATH-8'],
      assignedClasses: ['CLS-8A', 'CLS-8B'],
      qualification: 'បរិញ្ញាបត្រគរុកោសល្យ',
      position: 'គ្រូបង្រៀន',
      employmentStatus: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData(t);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.teacherCode) {
      addToast('error', 'សូមបំពេញព័ត៌មានចាំបាច់');
      return;
    }

    try {
      const teacherToSave: Teacher = {
        teacherId: editingTeacher?.teacherId || `T-${Date.now()}`,
        teacherCode: formData.teacherCode || '',
        fullName: formData.fullName || '',
        gender: (formData.gender as any) || 'M',
        phone: formData.phone || '',
        email: formData.email || '',
        address: formData.address || '',
        subjects: formData.subjects || ['SUB-MATH-8'],
        assignedClasses: formData.assignedClasses || [],
        qualification: formData.qualification,
        position: formData.position,
        employmentStatus: (formData.employmentStatus as any) || 'active'
      };

      await storageService.saveTeacher(teacherToSave);
      await loadData();
      setShowModal(false);
      addToast('success', editingTeacher ? 'បានកែប្រែប្រវត្តិរូបគ្រូ' : 'បានបន្ថែមគ្រូបង្រៀនថ្មី', teacherToSave.fullName);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;
    try {
      await storageService.deleteTeacher(teacherToDelete.teacherId);
      await loadData();
      addToast('success', 'បានកែប្រែស្ថានភាពគ្រូទៅជាឈប់សម្រាក', teacherToDelete.fullName);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការលុប', err.message);
    }
  };

  const handleImportExcel = async (parsedData: any[]) => {
    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      const newTeacher: Teacher = {
        teacherId: `T-IMP-${Date.now()}-${i}`,
        teacherCode: String(row['អត្តលេខគ្រូ'] || row['teacherCode'] || `T-${i + 10}`),
        fullName: String(row['គោត្តនាម និងនាម'] || row['fullName'] || 'គ្រូថ្មី'),
        gender: (row['ភេទ'] === 'ស្រី' || row['gender'] === 'F') ? 'F' : 'M',
        phone: String(row['លេខទូរស័ព្ទ'] || row['phone'] || ''),
        email: String(row['អ៊ីមែល'] || row['email'] || ''),
        address: String(row['អាសយដ្ឋាន'] || row['address'] || 'ខេត្តកំពង់ស្ពឺ'),
        subjects: ['SUB-MATH-8'],
        assignedClasses: ['CLS-8A'],
        employmentStatus: 'active'
      };
      await storageService.saveTeacher(newTeacher);
    }
    await loadData();
    addToast('success', 'បានបញ្ចូលគ្រូបង្រៀនពី Excel', `បញ្ចូលបាន ${parsedData.length} នាក់`);
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span>គ្រប់គ្រងគ្រូបង្រៀន (Teachers Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ប្រវត្តិរូបគ្រូបង្រៀន បន្ទុកបង្រៀន និងកាលវិភាគបង្រៀនផ្ទាល់ខ្លួន
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => excelService.exportTeachers(teachers)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>ទាញយក Excel</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>បញ្ចូល Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមគ្រូបង្រៀន</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ អត្តលេខ ឬអ៊ីមែលគ្រូ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
          />
        </div>

        <span className="text-xs text-slate-500">
          គ្រូបង្រៀនសរុប៖ {filteredTeachers.length} នាក់
        </span>
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((t) => {
          const workloadSlots = timetables.filter(slot => slot.teacherId === t.teacherId && slot.status === 'active');
          const isKeoSamnang = t.teacherId === 'T-001';

          return (
            <div
              key={t.teacherId}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-800 border shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all ${
                isKeoSamnang ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-blue-500/20">
                      {t.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {t.fullName}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold">
                        {t.teacherCode}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {t.employmentStatus === 'active' ? 'សកម្ម' : 'ឈប់សម្រាក'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{t.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.address || '—'}</span>
                  </div>
                </div>

                {/* Workload badge */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">បន្ទុកបង្រៀន៖</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-lg">
                    {workloadSlots.length} ម៉ោង / សប្តាហ៍
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <NavLink
                  to="/timetable"
                  className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>កាលវិភាគ</span>
                </NavLink>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600"
                    title="កែសម្រួល"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setTeacherToDelete(t);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                    title="លុប"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTeacher ? 'កែប្រែប្រវត្តិរូបគ្រូ' : 'បន្ថែមគ្រូបង្រៀនថ្មី'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                អត្តលេខគ្រូ *
              </label>
              <input
                type="text"
                placeholder="KS-100221"
                value={formData.teacherCode}
                onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                គោត្តនាម និងនាម *
              </label>
              <input
                type="text"
                placeholder="ឧ. កែវ សំណាង"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ភេទ
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="M">ប្រុស</option>
                <option value="F">ស្រី</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                លេខទូរស័ព្ទ
              </label>
              <input
                type="text"
                placeholder="012 xxx xxx"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ស្ថានភាពការងារ
              </label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="active">កំពុងបម្រើការ (Active)</option>
                <option value="leave">ច្បាប់សម្រាក (Leave)</option>
                <option value="retired">ចូលនិវត្តន៍ (Retired)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              អ៊ីមែល
            </label>
            <input
              type="email"
              placeholder="name@school.edu.kh"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              អាសយដ្ឋាន
            </label>
            <input
              type="text"
              placeholder="ភូមិ ឃុំ ស្រុក ខេត្ត"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="បញ្ជាក់ការកែប្រែស្ថានភាពគ្រូ"
        message={`តើលោកគ្រូពិតជាចង់កំណត់គ្រូបង្រៀន "${teacherToDelete?.fullName}" ទៅជាឈប់សម្រាកមែនទេ?`}
        confirmLabel="យល់ព្រម"
        cancelLabel="បោះបង់"
        isDestructive
      />

      {/* Excel Import */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="បញ្ចូលគ្រូបង្រៀនពី Excel"
        onImport={handleImportExcel}
        expectedColumnsDescription="អត្តលេខគ្រូ, គោត្តនាម និងនាម, ភេទ, លេខទូរស័ព្ទ, អ៊ីមែល, អាសយដ្ឋាន"
      />
    </div>
  );
};
